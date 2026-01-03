/**
 * SIDEPANEL LOGIC
 * Core chat, API integration, and Vault handling.
 */

// --- Global State ---
const state = {
  keys: { gemini: null, deepseek: null },
  systemInstruction: "",
  storageMode: 'local',
  chatHistory: [], // Only for current session context if needed, but we might just append to DOM
  isGenerating: false,
  abortController: null
};

// --- DOM Elements ---
const els = {
  chatContainer: document.getElementById('chat-history'),
  promptInput: document.getElementById('prompt-input'),
  sendBtn: document.getElementById('send-btn'),
  modelSelect: document.getElementById('model-select'),
  newChatBtn: document.getElementById('new-chat-btn'),
  analyzePageBtn: document.getElementById('analyze-page-btn'),
  vaultOverlay: document.getElementById('vault-overlay'),
  vaultPassInput: document.getElementById('vault-password-input'),
  vaultUnlockBtn: document.getElementById('vault-unlock-btn')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadSettings();
  
  // Listeners
  els.sendBtn.addEventListener('click', () => handleUserSend());
  els.promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserSend();
    }
  });
  els.newChatBtn.addEventListener('click', resetChat);
  els.analyzePageBtn.addEventListener('click', analyzeCurrentPage);
  
  // Vault Listeners
  els.vaultUnlockBtn.addEventListener('click', unlockVault);
  els.vaultPassInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') unlockVault();
  });

  // Message Listener (Context Menus)
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);

  // Focus input
  els.promptInput.focus();
}

async function loadSettings() {
  const data = await chrome.storage.local.get(['storageMode', 'systemInstruction', 'geminiKey', 'deepseekKey']);
  
  state.storageMode = data.storageMode || 'local';
  state.systemInstruction = data.systemInstruction || "";

  if (state.storageMode === 'local') {
    // Load keys directly
    state.keys.gemini = data.geminiKey;
    state.keys.deepseek = data.deepseekKey;
    hideVaultOverlay();
  } else {
    // Vault mode: Check if we have keys in memory (we don't on reload).
    // Show overlay to force unlock.
    showVaultOverlay();
  }
}

// --- Vault Logic ---

function showVaultOverlay() {
  els.vaultOverlay.classList.remove('hidden');
  els.vaultPassInput.focus();
}

function hideVaultOverlay() {
  els.vaultOverlay.classList.add('hidden');
}

async function unlockVault() {
  const password = els.vaultPassInput.value;
  if (!password) return;

  try {
    const syncData = await chrome.storage.sync.get(['vault']);
    if (!syncData.vault) {
      alert("No cloud vault found. Go to Options to set it up.");
      return;
    }

    const decryptedJson = await window.CryptoUtils.decryptVault(syncData.vault, password);
    const keys = JSON.parse(decryptedJson);
    
    state.keys.gemini = keys.geminiKey;
    state.keys.deepseek = keys.deepseekKey;
    
    hideVaultOverlay();
    els.promptInput.focus();
  } catch (error) {
    alert("Unlock failed: " + error.message);
  }
}

// --- Chat Logic ---

async function handleUserSend(overrideText = null) {
  const text = overrideText || els.promptInput.value.trim();
  if (!text) return;

  if (state.isGenerating) return;

  // Clear input
  els.promptInput.value = "";
  
  // 1. Add User Message
  addMessage('user', text);

  // 2. Check Web Mode
  const model = els.modelSelect.value;
  if (model === 'gemini-web') {
    handleWebMode(text);
    return;
  }

  // 3. API Call
  state.isGenerating = true;
  els.sendBtn.disabled = true;
  
  // Create AI placeholder
  const aiMsgId = addMessage('ai', "...", true); // true = raw html/loading
  
  try {
    const responseStream = await callLLMStream(model, text);
    await consumeStream(responseStream, aiMsgId);
  } catch (error) {
    updateMessage(aiMsgId, `**Error**: ${error.message}`);
  } finally {
    state.isGenerating = false;
    els.sendBtn.disabled = false;
  }
}

function resetChat() {
  els.chatContainer.innerHTML = '';
  // Re-add welcome
  addMessage('ai', "Chat reset. How can I help?");
}

async function analyzeCurrentPage() {
  // Get active tab content
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Simple extractor
      return { 
        text: document.body.innerText,
        url: window.location.href,
        title: document.title
      };
    }
  });

  if (!results || !results[0] || !results[0].result) return;
  
  const { text, url, title } = results[0].result;
  
  const prompt = window.Logic.formatPrompt("Please analyze this page.", text, null, url);
  handleUserSend(prompt);
}

// --- API Implementation ---

async function callLLMStream(model, prompt) {
  // Prepend System Instruction
  const finalPrompt = window.Logic.prepareSystemInstruction(state.systemInstruction) 
                      + "\n\nUser: " + prompt;

  if (model.startsWith('gemini')) {
    return callGeminiStream(model, finalPrompt);
  } else {
    return callDeepSeekStream(model, finalPrompt);
  }
}

async function callGeminiStream(model, prompt) {
  const key = state.keys.gemini;
  if (!key) throw new Error("Gemini API Key missing");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${key}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Error (${response.status}): ${err}`);
  }

  return response.body; 
}

async function callDeepSeekStream(model, prompt) {
  const key = state.keys.deepseek;
  if (!key) throw new Error("DeepSeek API Key missing");

  const url = `https://api.deepseek.com/chat/completions`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
         { role: "system", content: state.systemInstruction || "You are a helpful assistant." },
         { role: "user", content: prompt }
      ],
      stream: true
    })
  });

  if (!response.ok) {
     const err = await response.text();
    throw new Error(`DeepSeek Error (${response.status}): ${err}`);
  }

  return response.body;
}

// --- Stream Consumer ---

async function consumeStream(readableStream, msgId) {
  const reader = readableStream.getReader();
  const decoder = new TextDecoder();
  let accumulatedText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    
    // Check if it's Gemini or DeepSeek format based on model selection
    // But easier: both output text. We need to parse.
    const model = els.modelSelect.value;
    
    if (model.startsWith('gemini')) {
      const parsed = parseGeminiChunk(chunk);
      accumulatedText += parsed;
    } else {
      const parsed = parseDeepSeekChunk(chunk);
      accumulatedText += parsed;
    }

    // Render MD
    const html = window.Logic.parseMarkdown(accumulatedText);
    updateMessage(msgId, html);
  }
}

function parseGeminiChunk(chunk) {
  // Gemini returns array of objects, but chunk might contain multiple or partial JSONs.
  // Ideally we should buffer. For simplicity, we try to regex extract text parts.
  // Chunk looks like: [ { "candidates": ... } , \n
  let text = "";
  try {
      // Removing structure to find "text": "..." 
      // This is a "hacky" parser for simple stream. 
      // Robust way: buffer accumulating braces.
      // But Gemini usually sends clean JSON array elements in stream.
      // Let's iterate all "text": "..." occurrences
      const regex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;
      let match;
      while ((match = regex.exec(chunk)) !== null) {
          // Unescape JSON string
          text += JSON.parse(`"${match[1]}"`); 
      }
  } catch(e) { console.error("Parse error", e); }
  return text;
}

function parseDeepSeekChunk(chunk) {
  // OpenAI/DeepSeek SSE format: data: {...}
  let text = "";
  const lines = chunk.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const jsonStr = line.substring(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const json = JSON.parse(jsonStr);
        const content = json.choices[0]?.delta?.content || "";
        text += content;
      } catch (e) { }
    }
  }
  return text;
}

// --- Web Mode ---

async function handleWebMode(prompt) {
  // 1. Copy to clipboard
  try {
     // Needs 'clipboardWrite' permission and focus
     await navigator.clipboard.writeText(prompt);
     addMessage('ai', "📝 Prompt copied to clipboard! Opening Gemini Web...");
  } catch (e) {
     addMessage('ai', "⚠️ Could not copy to clipboard. Please copy manually.");
  }
  
  // 2. Open URL
  setTimeout(() => {
    window.open('https://gemini.google.com/app', '_blank');
  }, 1000);
}

// --- UI Helpers ---

function addMessage(role, text, isRaw = false) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.id = 'msg-' + Date.now();
  
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  
  if (isRaw) {
    bubble.innerHTML = text;
  } else {
    // Basic User text doesn't need MD usually, but nice to have.
    // For User, usually plaintext is safer to avoid render confusion.
    bubble.textContent = text; 
  }
  
  div.appendChild(bubble);
  els.chatContainer.appendChild(div);
  scrollToBottom();
  
  return div.id;
}

function updateMessage(id, html) {
  const div = document.getElementById(id);
  if (div) {
    const bubble = div.querySelector('.bubble');
    bubble.innerHTML = html;
    scrollToBottom();
  }
}

function scrollToBottom() {
  els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
}

// --- Context Handler ---
function handleRuntimeMessage(request, sender, sendResponse) {
  if (request.action === "contextMenuData") {
    // We received data from background context menu
    const { menuItemId, selectionText, pageUrl } = request;
    
    let promptPre = "";
    if (menuItemId === "summarize-sel") promptPre = "Summarize this: ";
    if (menuItemId === "explain-sel") promptPre = "Explain this in simple terms: ";
    if (menuItemId === "improve-sel") promptPre = "Improve writing/grammar: ";
    
    // Trigger sending
    const prompt = window.Logic.formatPrompt(promptPre, null, selectionText, pageUrl);
    handleUserSend(prompt);
  }
}
