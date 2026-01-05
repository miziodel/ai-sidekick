/**
 * Copyright (c) 2026 Maurizio Delmonte
 * Licensed under the MIT License. See LICENSE file in the project root for full license information.
 */

/**
 * OPTIONS LOGIC
 * Handles saving/loading settings and managing the secure vault.
 */

// UI Elements
const els = {
  geminiKey: document.getElementById('gemini-key'),
  deepseekKey: document.getElementById('deepseek-key'),
  systemInstruction: document.getElementById('system-instruction'),
  contextStrategy: document.getElementById('context-strategy'),
  saveBtn: document.getElementById('save-btn'),
  status: document.getElementById('status'),
  btnLocal: document.getElementById('btn-device-storage'),
  btnVault: document.getElementById('btn-cloud-vault'),
  vaultSetup: document.getElementById('vault-setup'),
  vaultPassword: document.getElementById('vault-password'),
  storageHint: document.getElementById('storage-hint'),
  // Prompts Container
  promptsContainer: document.getElementById('prompts-container'),
  resetPromptsBtn: document.getElementById('reset-prompts-btn')
};

let currentMode = 'local'; // 'local' or 'vault'

// Initialize
document.addEventListener('DOMContentLoaded', restoreOptions);
els.saveBtn.addEventListener('click', saveOptions);
els.btnLocal.addEventListener('click', () => setMode('local'));
els.btnVault.addEventListener('click', () => setMode('vault'));
els.resetPromptsBtn.addEventListener('click', handleResetPrompts);

function setMode(mode) {
  currentMode = mode;
  if (mode === 'local') {
    els.btnLocal.classList.add('active');
    els.btnVault.classList.remove('active');
    els.vaultSetup.classList.add('hidden');
    els.storageHint.textContent = "Keys are stored unencrypted in your local Chrome profile. Suitable for personal devices.";
  } else {
    els.btnVault.classList.add('active');
    els.btnLocal.classList.remove('active');
    els.vaultSetup.classList.remove('hidden');
    els.storageHint.textContent = "Keys are encrypted (AES-GCM) and synced to your Google Account. Requires Master Password.";
  }
}

/**
 * Restores select box and checkbox state using the preferences
 * stored in chrome.storage.
 */
function restoreOptions() {
  chrome.storage.local.get(
    ['geminiKey', 'deepseekKey', 'storageMode', 'systemInstruction', 'contextStrategy', 'prompts'],
    (localData) => {
      // Restore Context Strategy
      if (localData.contextStrategy) {
        els.contextStrategy.value = localData.contextStrategy;
      } else {
        els.contextStrategy.value = 'auto'; // Default
      }

      // Restore System Instruction (always local for convenience, not sensitive)
      if (localData.systemInstruction) {
        els.systemInstruction.value = localData.systemInstruction;
      }

      // Restore Prompts (Render Dynamically)
      renderPrompts(localData.prompts || {});

      // Check storage mode
      if (localData.storageMode === 'vault') {
        setMode('vault');
        // If in vault mode, we can't show keys unless we are unlocked.
        // For options page simplification, we just show empty placeholders
        // or we could check session storage if we wanted to show them.
        // Here we just leave them empty to indicate "Secure".
        els.geminiKey.placeholder = "(Encrypted in Vault)";
        els.deepseekKey.placeholder = "(Encrypted in Vault)";
      } else {
        setMode('local');
        if (localData.geminiKey) els.geminiKey.value = localData.geminiKey;
        if (localData.deepseekKey) els.deepseekKey.value = localData.deepseekKey;
      }
    }
  );
}

/**
 * Render Prompt Inputs dynamically based on PROMPT_REGISTRY
 */
function renderPrompts(savedPrompts) {
    els.promptsContainer.innerHTML = ''; // Clear

    if (typeof PROMPT_REGISTRY === 'undefined') {
        els.promptsContainer.innerHTML = '<div class="error">Error: PROMPT_REGISTRY not loaded.</div>';
        return;
    }

    for (const [key, config] of Object.entries(PROMPT_REGISTRY)) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = `${config.title}:`;
        label.htmlFor = `prompt-${key}`;
        
        const textarea = document.createElement('textarea');
        textarea.id = `prompt-${key}`;
        textarea.rows = 3;
        textarea.dataset.key = key; // for easy retrieval
        // Value priority: Saved User Pref -> Registry Default
        textarea.value = savedPrompts[key] || config.prompt;
        
        wrapper.appendChild(label);
        wrapper.appendChild(textarea);
        els.promptsContainer.appendChild(wrapper);
    }
}


/**
 * Saves options to chrome.storage.
 */
async function saveOptions() {
  const geminiVal = els.geminiKey.value.trim();
  const deepseekVal = els.deepseekKey.value.trim();
  const instructionVal = els.systemInstruction.value.trim();
  const contextStrategyVal = els.contextStrategy.value;
  const vaultPass = els.vaultPassword.value;

  // Gather Prompts
  const prompts = {};
  const inputs = els.promptsContainer.querySelectorAll('textarea');
  inputs.forEach(input => {
      const key = input.dataset.key;
      if (key) {
          prompts[key] = input.value;
      }
  });

  showStatus("Saving...", "normal");

  try {
    // Save System Instruction (always unencrypted local)
    await chrome.storage.local.set({ 
      systemInstruction: instructionVal,
      contextStrategy: contextStrategyVal,
      storageMode: currentMode,
      prompts: prompts
    });

    if (currentMode === 'local') {
      // Save cleartext keys locally
      await chrome.storage.local.set({
        geminiKey: geminiVal,
        deepseekKey: deepseekVal
      });
      // Clear any sync vault data to avoid confusion
      await chrome.storage.sync.remove('vault');
      await chrome.storage.session.remove('decryptedKeys'); // Clear any active session
    } else {
      // VAULT MODE
      if (!vaultPass) {
        throw new Error("Master Password is required for Cloud Vault.");
      }
      
      const dataToEncrypt = JSON.stringify({
        geminiKey: geminiVal,
        deepseekKey: deepseekVal
      });

      const vault = await window.CryptoUtils.encryptVault(dataToEncrypt, vaultPass);
      
      // Save vault to sync
      await chrome.storage.sync.set({ vault: vault });
      
      // Clear local keys for security
      await chrome.storage.local.remove(['geminiKey', 'deepseekKey']);
    }

    showStatus("Options saved successfully.", "success");
    setTimeout(() => {
      showStatus("", "");
    }, 2000);

  } catch (error) {
    console.error(error);
    showStatus("Error: " + error.message, "error");
  }
}

function handleResetPrompts() {
    if (confirm("Reset all prompt templates to defaults? This cannot be undone.")) {
        // Re-render purely from registry
        renderPrompts({});
        showStatus("Prompts reset to defaults. Click Save to apply.", "normal");
    }
}

function showStatus(msg, type) {
  els.status.textContent = msg;
  els.status.className = type;
}
