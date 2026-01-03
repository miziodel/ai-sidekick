/**
 * OPTIONS LOGIC
 * Handles saving/loading settings and managing the secure vault.
 */

// UI Elements
const els = {
  geminiKey: document.getElementById('gemini-key'),
  deepseekKey: document.getElementById('deepseek-key'),
  deepseekKey: document.getElementById('deepseek-key'),
  systemInstruction: document.getElementById('system-instruction'),
  contextStrategy: document.getElementById('context-strategy'),
  saveBtn: document.getElementById('save-btn'),
  status: document.getElementById('status'),
  btnLocal: document.getElementById('btn-device-storage'),
  btnVault: document.getElementById('btn-cloud-vault'),
  vaultSetup: document.getElementById('vault-setup'),
  vaultPassword: document.getElementById('vault-password'),
  storageHint: document.getElementById('storage-hint')
};

let currentMode = 'local'; // 'local' or 'vault'

// Initialize
document.addEventListener('DOMContentLoaded', restoreOptions);
els.saveBtn.addEventListener('click', saveOptions);
els.btnLocal.addEventListener('click', () => setMode('local'));
els.btnVault.addEventListener('click', () => setMode('vault'));

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
    ['geminiKey', 'deepseekKey', 'storageMode', 'systemInstruction', 'contextStrategy'],
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
 * Saves options to chrome.storage.
 */
async function saveOptions() {
  const geminiVal = els.geminiKey.value.trim();
  const deepseekVal = els.deepseekKey.value.trim();
  const instructionVal = els.systemInstruction.value.trim();
  const contextStrategyVal = els.contextStrategy.value;
  const vaultPass = els.vaultPassword.value;

  showStatus("Saving...", "normal");

  try {
    // Save System Instruction (always unencrypted local)
    await chrome.storage.local.set({ 
      systemInstruction: instructionVal,
      contextStrategy: contextStrategyVal,
      storageMode: currentMode
    });

    if (currentMode === 'local') {
      // Save cleartext keys locally
      await chrome.storage.local.set({
        geminiKey: geminiVal,
        deepseekKey: deepseekVal
      });
      // Clear any sync vault data to avoid confusion
      await chrome.storage.sync.remove('vault');
    } else {
      // VAULT MODE
      if (!vaultPass) {
        throw new Error("Master Password is required for Cloud Vault.");
      }
      // If fields are empty (user didn't change them but wants to re-encrypt), 
      // we might have an issue. For now, assume user re-enters keys.
      // Or check if we have values.
      
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

function showStatus(msg, type) {
  els.status.textContent = msg;
  els.status.className = type;
}
