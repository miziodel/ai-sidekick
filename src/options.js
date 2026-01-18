/**
 * Copyright (c) 2026 Maurizio Delmonte
 * Licensed under the MIT License. See LICENSE file in the project root for full license information.
 */

/**
 * OPTIONS LOGIC
 * Handles saving/loading settings, managing the secure vault, and dynamic Actions CRUD.
 */

// UI Elements
const els = {
  geminiKey: document.getElementById('gemini-key'),
  deepseekKey: document.getElementById('deepseek-key'),
  systemInstruction: document.getElementById('system-instruction'),
  saveBtn: document.getElementById('save-btn'),
  status: document.getElementById('status'),
  btnLocal: document.getElementById('btn-device-storage'),
  btnVault: document.getElementById('btn-cloud-vault'),
  vaultSetup: document.getElementById('vault-setup'),
  vaultPassword: document.getElementById('vault-password'),
  storageHint: document.getElementById('storage-hint'),
  // Actions
  actionsList: document.getElementById('actions-list'),
  addActionBtn: document.getElementById('add-action-btn'),
  resetActionsBtn: document.getElementById('reset-actions-btn')
};

let currentMode = 'local';
let currentActions = []; // Array of { id, title, prompt, contexts }

// Initialize
document.addEventListener('DOMContentLoaded', restoreOptions);
els.saveBtn.addEventListener('click', saveOptions);
els.btnLocal.addEventListener('click', () => setMode('local'));
els.btnVault.addEventListener('click', () => setMode('vault'));
els.addActionBtn.addEventListener('click', addNewAction);
els.resetActionsBtn.addEventListener('click', handleResetActions);

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
 * Restore Options
 */
function restoreOptions() {
  chrome.storage.local.get(
    ['geminiKey', 'deepseekKey', 'storageMode', 'systemInstruction', 'contextStrategy', 'actions'],
    (localData) => {
      // 1. General Settings
      if (localData.systemInstruction) els.systemInstruction.value = localData.systemInstruction;

      // 2. Actions (Storage First -> Default fallback)
      if (localData.actions && Array.isArray(localData.actions)) {
          currentActions = localData.actions;
      } else if (typeof DEFAULT_ACTIONS !== 'undefined') {
          currentActions = JSON.parse(JSON.stringify(DEFAULT_ACTIONS)); // Deep copy
      }
      renderActions();

      // 3. Storage Mode
      if (localData.storageMode === 'vault') {
        setMode('vault');
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
 * Render the List of Actions
 */
function renderActions() {
    els.actionsList.innerHTML = '';
    
    currentActions.forEach((action, index) => {
         const row = document.createElement('div');
         row.className = 'card'; 
         row.style.padding = '15px';
         row.style.marginBottom = '10px';
         row.style.border = '1px solid #eee';
         row.dataset.id = action.id;

         row.innerHTML = `
            <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
                <input type="text" class="action-title" value="${escapeHtml(action.title)}" placeholder="Title" style="flex: 2; font-weight: bold;">
                <select class="action-context" style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border);">
                    <option value="selection" ${action.contexts && action.contexts.includes('selection') && !action.contexts.includes('page') ? 'selected' : ''}>Selection Only</option>
                    <option value="page" ${action.contexts && action.contexts.includes('page') && !action.contexts.includes('selection') ? 'selected' : ''}>Page Only</option>
                    <option value="both" ${action.contexts && action.contexts.includes('selection') && action.contexts.includes('page') ? 'selected' : ''}>Both</option>
                </select>
                <button class="delete-btn" style="background: #ff453a; padding: 8px 12px; font-size: 12px;">Delete</button>
            </div>
            <textarea class="action-prompt" rows="2" placeholder="Prompt... Use {{selection}} or {{url}}">${escapeHtml(action.prompt)}</textarea>
            <div class="hint" style="margin-top: 5px;">ID: ${action.id}</div>
         `;
         
         // Bind Delete
         row.querySelector('.delete-btn').addEventListener('click', () => {
             if (confirm(`Delete action "${action.title}"?`)) {
                 currentActions.splice(index, 1);
                 renderActions();
             }
         });
         
         // Bind Inputs to Array State (Active syncing)
         // Actually, simpler to read ALL from DOM on save. 
         // But "Delete" needs array index. 
         // Hybrid: Rendering is destructive, so we just init from array.
         // On "Save", we scrape the DOM to rebuild array.

         els.actionsList.appendChild(row);
    });
}

function addNewAction() {
    const id = 'custom_' + Date.now();
    currentActions.push({
        id: id,
        title: "New Action",
        contexts: ["selection"],
        prompt: "Analyze this: {{selection}}"
    });
    renderActions();
    // Scroll to bottom
    setTimeout(() => {
        els.actionsList.scrollTop = els.actionsList.scrollHeight;
    }, 100);
}

function handleResetActions() {
    if (confirm("Reset all actions to defaults? Custom actions will be lost.")) {
         if (typeof DEFAULT_ACTIONS === 'undefined') {
            els.actionsList.innerHTML = '<div class="error">Error: DEFAULT_ACTIONS not loaded.</div>'; // Changed from promptsContainer to actionsList
            return;
        }

        currentActions = JSON.parse(JSON.stringify(DEFAULT_ACTIONS)); // Deep copy
        renderActions();
        showStatus("Reset to memory. Click SAVE to persist.", "normal");
    }
}

/**
 * Saves options to chrome.storage.
 */
async function saveOptions() {
  const geminiVal = els.geminiKey.value.trim();
  const deepseekVal = els.deepseekKey.value.trim();
  const instructionVal = els.systemInstruction.value.trim();
  const vaultPass = els.vaultPassword.value;

  // 1. Scrape Actions from DOM
  const newActions = [];
  const rows = els.actionsList.querySelectorAll('.card'); 
  
  rows.forEach(row => {
      const id = row.dataset.id;
      const title = row.querySelector('.action-title').value.trim();
      const prompt = row.querySelector('.action-prompt').value;
      const contextVal = row.querySelector('.action-context').value;
      
      let contexts = ['selection'];
      if (contextVal === 'page') contexts = ['page'];
      if (contextVal === 'both') contexts = ['selection', 'page'];
      
      if (title && prompt) {
        newActions.push({ id, title, prompt, contexts });
      }
  });
  
  // Update in-memory
  currentActions = newActions;

  showStatus("Saving...", "normal");

  try {
    // Save to Storage
    await chrome.storage.local.set({ 
      systemInstruction: instructionVal,
      storageMode: currentMode,
      actions: newActions // THIS TRIGGERS HOT-RELOAD IN BACKGROUND & SIDEPANEL
    });

    if (currentMode === 'local') {
      await chrome.storage.local.set({
        geminiKey: geminiVal,
        deepseekKey: deepseekVal
      });
      await chrome.storage.sync.remove('vault');
      await chrome.storage.session.remove('decryptedKeys');
    } else {
      if (!vaultPass) throw new Error("Master Password is required.");
      const dataToEncrypt = JSON.stringify({ geminiKey: geminiVal, deepseekKey: deepseekVal });
      const vault = await window.CryptoUtils.encryptVault(dataToEncrypt, vaultPass);
      await chrome.storage.sync.set({ vault: vault });
      await chrome.storage.local.remove(['geminiKey', 'deepseekKey']);
    }

    showStatus("Options saved. Context menu updated.", "success");
    setTimeout(() => showStatus("", ""), 2000);

  } catch (error) {
    console.error(error);
    showStatus("Error: " + error.message, "error");
  }
}

// Utils
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showStatus(msg, type) {
  els.status.textContent = msg;
  els.status.className = type;
}
