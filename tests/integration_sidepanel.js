/**
 * INTEGRATION TEST: SidePanel Vault Security Flow
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// --- MOCK CHROME API ---
global.chrome = {
  storage: {
    local: {
      data: {},
      get: (keys) => Promise.resolve(global.chrome.storage.local.data),
      set: (items) => { Object.assign(global.chrome.storage.local.data, items); return Promise.resolve(); },
      remove: (keys) => { 
          if(Array.isArray(keys)) keys.forEach(k => delete global.chrome.storage.local.data[k]);
          else delete global.chrome.storage.local.data[keys];
          return Promise.resolve(); 
      },
      onChanged: { addListener: (cb) => { global.chrome.storage.local._listeners.push(cb); } },
      _listeners: []
    },
    sync: {
      data: {},
      get: (keys) => Promise.resolve(global.chrome.storage.sync.data),
      set: (items) => { Object.assign(global.chrome.storage.sync.data, items); return Promise.resolve(); },
      remove: (keys) => Promise.resolve() 
    },
    session: { 
      data: {},
      get: (keys) => Promise.resolve(global.chrome.storage.session.data),
      set: (items) => { Object.assign(global.chrome.storage.session.data, items); return Promise.resolve(); },
      remove: (keys) => {
          if(Array.isArray(keys)) keys.forEach(k => delete global.chrome.storage.session.data[k]);
          else delete global.chrome.storage.session.data[keys];
          return Promise.resolve();
      },
      onChanged: { addListener: (cb) => { global.chrome.storage.session._listeners.push(cb); } },
      _listeners: []
    }
  },
  tabs: {
      query: () => Promise.resolve([{id: 1, url: 'http://example.com'}])
  },
  alarms: {
      create: (name, info) => { console.log(`[Mock] Alarm created: ${name}`); },
      onAlarm: { addListener: (cb) => { global.chrome.alarms._listeners.push(cb); } },
      _listeners: []
  },
  runtime: {
      onMessage: { addListener: () => {} }
  }
};

// --- MOCK DOM UTILS ---
global.document = {
    getElementById: (id) => {
        if (!global.mockDOM[id]) {
            const el = { 
                value: '', 
                _classes: new Set(),
                classList: { 
                    add: function(c) { el._classes.add(c); },
                    remove: function(c) { el._classes.delete(c); },
                    contains: function(c) { return el._classes.has(c); }
                },
                get classes() { return el._classes; },
                addEventListener: () => {},
                focus: () => {}
            };
            global.mockDOM[id] = el;
        }
        return global.mockDOM[id];
    },
    addEventListener: (event, cb) => {
        if (event === 'DOMContentLoaded') global.domReady = cb;
    },
    createElement: (tag) => ({ className: '', appendChild: () => {}, classList: { add:()=>{} } })
};
global.window = { 
    Logic: require('../src/lib/logic.js'),
    CryptoUtils: {
        decryptVault: async (vault, pass) => {
            if (pass === 'wrong') throw new Error('Bad pass');
            return JSON.stringify({ geminiKey: 'GEMINI_KEY', deepseekKey: 'DEEPSEEK_KEY' });
        }
    },
    open: () => {}
};
global.navigator = { clipboard: { writeText: () => {} } };

// --- HELPER ---
global.mockDOM = {};
function resetMock() {
    global.chrome.storage.local.data = {};
    global.chrome.storage.sync.data = { vault: { ciphertext: 'mock' } };
    global.chrome.storage.session.data = {};
    global.mockDOM = {};
}

async function runTests() {
    console.log("🚀 Starting Integration Tests...");

    const sidepanelCode = fs.readFileSync(path.join(__dirname, '../src/sidepanel.js'), 'utf8');
    
    // TEST 1: Session Persistence
    try {
        resetMock();
        global.chrome.storage.local.data = { storageMode: 'vault' };
        global.chrome.storage.session.data = { decryptedKeys: { gemini: 'SAVED_KEY' } };
        
        global.ActionManager = {
            getPendingAction: async () => global.chrome.storage.local.data.pendingAction,
            clearPendingAction: () => { delete global.chrome.storage.local.data.pendingAction; }
        };
        
        global.chrome.storage.onChanged = { addListener: (cb) => { global.chrome.storage.local._listeners.push(cb); } };

        let modifiedCode = sidepanelCode.replace('const state =', 'global.state =');
        eval(modifiedCode);
        
        await global.domReady();
        
        const overlay = document.getElementById('vault-overlay');
        const isHidden = overlay.classes.has('hidden');
        
        if (isHidden && global.state.keys.gemini === 'SAVED_KEY') {
            console.log("✅ [PASSED] Session keys loaded, Vault unlocked automatically.");
        } else {
            console.error("❌ Test 1 Failed: Vault still locked", { isHidden, keys: global.state.keys });
            process.exit(1);
        }
    } catch (e) {
        console.error("Test 1 Error:", e);
        process.exit(1);
    }

    // TEST 2: Deferred Action
    try {
        console.log("\n🧪 Testing Pending Action Race Condition...");
        resetMock();
        global.chrome.storage.local.data = { 
            storageMode: 'vault',
            pendingAction: { action: 'contextMenu', menuItemId: 'summarize-sel', selectionText: 'test' }
        };
        
        global.state.keys = { gemini: null }; 
        global.state.deferredAction = null;
        global.state.prompts = { summarize: "Sum {{selection}}" };

        await global.domReady();
        
        if (global.state.deferredAction && global.state.deferredAction.menuItemId === 'summarize-sel') {
             console.log("✅ [PASSED] Action deferred when locked.");
        } else {
             console.error("❌ Test 2 Failed: Action NOT deferred", global.state.deferredAction);
             process.exit(1);
        }
    } catch (e) {
        console.error("Test 2 Error:", e);
        process.exit(1);
    }
}

resetMock();
runTests();
