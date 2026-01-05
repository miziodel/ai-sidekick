/**
 * SIDEPANEL LOGIC
 * Core chat, API integration, and Vault handling.
 */

// --- Global State ---
const state = {
  keys: { gemini: null, deepseek: null },
  systemInstruction: "",
  prompts: {}, // Store loaded prompts
  storageMode: 'local',
  chatHistory: [], // Stores { role: 'user'|'ai', text: string }
  isGenerating: false,
  abortController: null,
  deferredAction: null, // Store action if vault is locked
  currentContextUrl: null 
};

// --- DOM Elements ---
const els = {
  chatContainer: document.getElementById('chat-history'),
  promptInput: document.getElementById('prompt-input'),
  sendBtn: document.getElementById('send-btn'),
  modelSelect: document.getElementById('model-select'),
  newChatBtn: document.getElementById('new-chat-btn'),
  analyzePageBtn: document.getElementById('analyze-page-btn'),
  summarizeBtn: document.getElementById('summarize-btn'),
  notificationToast: document.getElementById('notification-toast'),
  vaultOverlay: document.getElementById('vault-overlay'),
  vaultPassInput: document.getElementById('vault-password-input'),
  vaultUnlockBtn: document.getElementById('vault-unlock-btn'),
  openTabBtn: document.getElementById('open-tab-btn'),
  contextUrl: document.getElementById('context-url')
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
  if (els.summarizeBtn) els.summarizeBtn.addEventListener('click', handleSummarizeContext);
  if (els.openTabBtn) {
    els.openTabBtn.addEventListener('click', () => {
       chrome.tabs.create({ url: chrome.runtime.getURL('sidepanel.html') });
    });
  }
  
  // Vault Listeners
  els.vaultUnlockBtn.addEventListener('click', unlockVault);
  els.vaultPassInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') unlockVault();
  });

  // Model Selection Persistence
  els.modelSelect.addEventListener('change', () => {
    chrome.storage.local.set({ selectedModel: els.modelSelect.value });
  });

  // Focus input
  els.promptInput.focus();

  // --- ACTIONS HANDLER ---
  
  // 1. Check startup pending action
  await checkPendingAction();

  // 2. Listen for new actions (if panel is already open)
  // 2. Listen for DIRECT MESSAGES (Message Passing Architecture)
  // This solves the race condition by letting the background script decide WHO executes.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PING') {
      sendResponse({ status: 'alive' });
      return;
    }
    if (message.type === 'EXECUTE_ACTION' && message.data) {
       console.log("Received direct execution command", message.data);
       processAction(message.data);
       sendResponse({ status: 'started' });
    }
  });

  // 3. Listen for Session Changes (e.g. cleared by Options or Auto-Lock from background)
  chrome.storage.session.onChanged.addListener((changes) => {
      if (changes.decryptedKeys && !changes.decryptedKeys.newValue) {
          // Keys cleared -> Lock
          lockVault();
      }
  });

  // 4. Auto-Lock Alarm Listener
  chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'autoLock') {
          // Time's up!
          clearSession();
          lockVault();
          showNotification("🔐 Vault auto-locked due to inactivity.");
      }
  });
}

async function loadSettings() {
  const data = await chrome.storage.local.get(['storageMode', 'systemInstruction', 'geminiKey', 'deepseekKey', 'selectedModel', 'chatHistory']);
  
  if (data.selectedModel) {
    els.modelSelect.value = data.selectedModel;
  }
  
  state.storageMode = data.storageMode || 'local';
  state.systemInstruction = data.systemInstruction || "";

  // Load Prompts
  const defaults = {
      "summarize": "Summarize this: {{selection}}",
      "explain": "Explain this in simple terms: {{selection}}",
      "improve": "Improve writing/grammar: {{selection}}",
      "analyze": "Please summarize this page.\n\nContext:\n{{content}}\n\nURL: {{url}}"
  };
  state.prompts = { ...defaults, ...(data.prompts || {}) };
  
  // Load History
  if (data.chatHistory && Array.isArray(data.chatHistory)) {
    state.chatHistory = data.chatHistory;
    // Render History
    state.chatHistory.forEach(msg => addMessage(msg.role, msg.text, false)); // false = not raw, render as text -> markdown by update/init?
    // Actually addMessage renders as textContent by default. 
    // We should parse markdown for AI messages if we store raw text.
    // For consistency, let's re-render properly. 
    // Note: addMessage logic below needs tweak to handle markdown on init?
    // Or we just clear and re-add.
    // Let's improve render loop:
    els.chatContainer.innerHTML = '';
    state.chatHistory.forEach(msg => {
       // if ai, parse MD. if user, plain.
       if (msg.role === 'ai') {
          const html = window.Logic.parseMarkdown(msg.text);
          addMessage('ai', html, true);
       } else {
          addMessage('user', msg.text, false);
       }
    });
  } else {
      // Default welcome
      // (If history empty, show welcome)
      // (If history empty, show welcome)
     if (state.chatHistory.length === 0) {
        // defined in HTML
     }
  }

  if (state.storageMode === 'local') {
    // Load keys directly
    state.keys.gemini = data.geminiKey;
    state.keys.deepseek = data.deepseekKey;
    hideVaultOverlay();
  } else {
    // Vault mode: Check session storage for decrypted keys
    const session = await chrome.storage.session.get(['decryptedKeys']);
    if (session.decryptedKeys) {
        state.keys = session.decryptedKeys;
        hideVaultOverlay();
        resetAutoLock(); // active session
    } else {
        showVaultOverlay();
    }
  }
}

// --- Vault Logic ---

function showVaultOverlay() {
  els.vaultOverlay.classList.remove('hidden');
  els.vaultPassInput.focus();
}

// --- Vault Logic ---

function hideVaultOverlay() {
  els.vaultOverlay.classList.add('hidden');
}

function resetAutoLock() {
    if (state.storageMode === 'vault' && state.keys.gemini) {
        chrome.alarms.create('autoLock', { delayInMinutes: 15 });
    }
}

function clearSession() {
    chrome.storage.session.remove('decryptedKeys');
}

function lockVault() {
    state.keys = { gemini: null, deepseek: null };
    showVaultOverlay();
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
    
    // Save to Session
    await chrome.storage.session.set({ decryptedKeys: state.keys });
    resetAutoLock();

    hideVaultOverlay();

    // Check deferred action
    if (state.deferredAction) {
        const action = state.deferredAction;
        state.deferredAction = null;
        processAction(action);
    }

    els.promptInput.focus();
  } catch (error) {
    alert("Unlock failed: " + error.message);
  }
}

// --- Chat Logic ---

async function handleUserSend(overrideText = null, displayText = null) {
  const text = overrideText || els.promptInput.value.trim();
  if (!text) return;

  if (state.isGenerating) return;

  // Clear input
  els.promptInput.value = "";
  
  // 1. Add User Message
  // Use displayText if provided, otherwise text
  const showText = displayText || text;
  addMessage('user', showText);
  
  // Save to history (We save the ACTUAL prompt 'text' for context, or should we save what the user 'said'? 
  // Usually for context we want the full prompt if it contains instructions. 
  // BUT if we want to avoid polluting history with huge text, maybe we save displayText?
  // The system prompt handles the instruction. The USER message should probably be the intent.
  // However, the Logic functions use the history to build the context for the API. 
  // If we save 'Summarize this page', the API won't have the content!
  // SO we MUST save the FULL 'text' (prompt containing content) to history.
  state.chatHistory.push({ role: 'user', text: text });
  saveHistory();

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
    const fullText = await consumeStream(responseStream, aiMsgId);
    
    // Save AI response
    state.chatHistory.push({ role: 'ai', text: fullText });
    saveHistory();
    
  } catch (error) {
    updateMessage(aiMsgId, `**Error**: ${error.message}`);
  } finally {
    state.isGenerating = false;
    els.sendBtn.disabled = false;
    resetAutoLock(); // Interactions reset timer
  }
}

function resetChat() {
  els.chatContainer.innerHTML = '';
  // Re-add welcome
  addMessage('ai', "Chat reset. How can I help?");
  state.chatHistory = [];
  chrome.storage.local.remove('chatHistory');
}

function saveHistory() {
  chrome.storage.local.set({ chatHistory: state.chatHistory });
}

function handleSummarizeContext() {
   const prompt = "Please verify my understanding by summarizing our conversation so far in a concise bulleted list.";
   handleUserSend(prompt);
}


function showNotification(text) {
  const t = els.notificationToast;
  if (!t) return;
  
  // Clear any existing timeout if we were to use one, but now it's persistent/manual.
  // Actually, for "Oldest messages removed", maybe we still want it to auto-hide after a LONG time?
  // User asked for "persistente (pulsante per nascondere?)", implies manual.
  
  t.innerHTML = `
    <span>${text}</span>
    <button id="toast-close-btn" title="Dismiss">×</button>
  `;
  
  t.classList.remove('hidden');
  // Trigger reflow?
  void t.offsetWidth;
  t.classList.add('show');
  
  // Attach listener dynamically
  const closeBtn = document.getElementById('toast-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      t.classList.remove('show');
      setTimeout(() => t.classList.add('hidden'), 300);
    };
  }
}

// --- Page Analysis ---

async function analyzeCurrentPage(overrideTabId = null) {
  // Use passed tabId (from context menu) OR query active tab
  let tabId = overrideTabId;
  let tabUrl = "";
  let tabTitle = "";
  
  try {
    if (!tabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        tabId = tab.id;
        tabUrl = tab.url;
        tabTitle = tab.title;
      }
    } else {
      // We have tabId, let's get details to avoid script injection if we just need URL
      const tab = await chrome.tabs.get(tabId);
      tabUrl = tab.url;
      tabTitle = tab.title;
    }
  } catch(e) { console.warn("Could not get tab details", e); }

  if (!tabId) {
    addMessage('ai', "⚠️ Could not identify the active page. Please try again.");
    return;
  }
  
  // Deciding on Context Strategy
  const settings = await chrome.storage.local.get(['contextStrategy']);
  const strategy = settings.contextStrategy || 'auto';
  const model = els.modelSelect.value;
  
  let finalText = null;
  let finalUrl = tabUrl; // Use what we got from tab object

  let needText = false;

  // Strategy Logic
  if (strategy === 'full-text') {
      needText = true;
  } else if (strategy === 'url-only') {
      needText = false;
  } else {
      // Auto
      if (model.includes('deepseek')) {
          needText = false; // URL only
      } else {
          needText = true; 
      }
  }

  // If we need text, try to extract it
  if (needText) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
             return { 
               text: document.body.innerText,
               url: window.location.href,
               title: document.title
             };
          }
        });

        if (results && results[0] && results[0].result) {
           finalText = results[0].result.text;
           finalUrl = results[0].result.url; // Update with exact standard URL if valid
        }
      } catch (e) {
        console.warn("Script injection failed (likely restricted page)", e);
        addMessage('ai', `⚠️ Cannot read page content (Security Restriction). **Using URL only**.`);
        // Fallback: finalText remains null, we just use the finalUrl we already have.
      }
  } else {
      // We skipped extraction intentionally
      console.log("Skipping text extraction based on strategy/model.");
  }

  // Pass chosen content with dynamic prompt
  const template = state.prompts.analyze;
  const prompt = window.Logic.formatPrompt(template, {
      content: finalText, 
      url: finalUrl,
      title: tabTitle
  });
  
  // Send with clean display text
  handleUserSend(prompt, "Summarize this page");
}

// --- API Implementation ---

async function callLLMStream(model, prompt) {
  // Prune history for context (keep last 10)
  // We use existing history + current user prompt.
  // Actually, 'handleUserSend' already pushed current prompt to state.chatHistory!
  // So we just use state.chatHistory.
  // Wait, handleUserSend pushes BEFORE calling this. Yes.
  
  const history = state.chatHistory;
  const LIMIT = 10;
  
  // NOTE: Logic.pruneHistory returns a NEW array slice.
  const contextMessages = window.Logic.pruneHistory(history, LIMIT);
  
  // Check if we pruned anything (sent context < total history)
  if (history.length > LIMIT) {
     showNotification("Oldest messages removed from AI memory");
  }

  // Prepend System Instruction
  // window.Logic.prepareSystemInstruction is just the string.
  // We need to pass it to respective API handlers or insert into messages.
  
  if (model.startsWith('gemini')) {
    return callGeminiStream(model, contextMessages);
  } else {
    return callDeepSeekStream(model, contextMessages);
  }
}

async function callGeminiStream(model, history) {
  const key = state.keys.gemini;
  if (!key) throw new Error("Gemini API Key missing");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${key}`;
  
  // Format History
  const contents = window.Logic.formatHistoryForGemini(history);
  
  // Add System Instruction
  // Gemini 1.5 supports system_instruction at top level
  // But strictly it might be better to merge into prompt or use new API field.
  // Let's use system_instruction if supported, or prepend.
  // For 1.5 Flash/Pro, 'system_instruction' field is valid.
  
  const sysInstText = window.Logic.prepareSystemInstruction(state.systemInstruction);
  
  const body = {
    contents: contents,
    system_instruction: { parts: [{ text: sysInstText }] } 
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Error (${response.status}): ${err}`);
  }

  return response.body; 
}

async function callDeepSeekStream(model, history) {
  const key = state.keys.deepseek;
  if (!key) throw new Error("DeepSeek API Key missing");

  const url = `https://api.deepseek.com/chat/completions`;
  
  // Format
  const messages = window.Logic.formatHistoryForDeepSeek(history);
  
  // Prepend System
  const sysInstText = window.Logic.prepareSystemInstruction(state.systemInstruction);
  messages.unshift({ role: "system", content: sysInstText });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
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
  return accumulatedText;
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

// --- Action Processor ---

async function checkPendingAction() {
  const action = await ActionManager.getPendingAction(true); // true = clear after read
  if (action) {
    processAction(action);
  }
}

function processAction(data) {
  // Check if locked
  if (state.storageMode === 'vault' && !state.keys.gemini) {
      console.log("Vault locked, deferring action", data);
      state.deferredAction = data;
      showNotification("🔒 Please unlock vault to proceed.");
      return; // Stop here
  }
  
  // { action: "contextMenu"|"openOnly", menuItemId, selectionText, pageUrl, tabId }
  
  // 1. Update Context Bar always
  if (data.pageUrl) {
    updateContextBar(data.pageUrl);
  }
  
  // 2. Handle "Open Sidekick Here" (Just open/update context, no chat)
  if (data.action === "openOnly") {
     console.log("Sidekick opened for context:", data.pageUrl);
     return;
  }
  
  if (data.action === "contextMenu") {
    const { menuItemId, selectionText, pageUrl, tabId } = data;
    
    let template = "";
    if (menuItemId === "summarize-sel") template = state.prompts.summarize;
    if (menuItemId === "explain-sel") template = state.prompts.explain;
    if (menuItemId === "improve-sel") template = state.prompts.improve;
    
    if (menuItemId === "summarize-page") {
      // Special Handling for full page
      analyzeCurrentPage(tabId);
      return; 
    }

    if (template) {
       // Trigger sending
       const prompt = window.Logic.formatPrompt(template, {
           selection: selectionText,
           url: pageUrl
       });
       handleUserSend(prompt);
    }
  }
}

function updateContextBar(url) {
  state.currentContextUrl = url;
  if (!url) {
    els.contextUrl.textContent = "No active context";
    return;
  }
  try {
    const u = new URL(url);
    els.contextUrl.textContent = u.hostname + (u.pathname.length > 1 ? u.pathname : "");
    els.contextUrl.title = url; // Full tooltip
  } catch (e) {
    els.contextUrl.textContent = url;
  }
}
