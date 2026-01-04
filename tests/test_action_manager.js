const assert = require('assert');

// Mock chrome.storage.local
const storageMock = {
  data: {},
  set: async (obj) => {
    Object.assign(storageMock.data, obj);
  },
  get: async (keys) => {
    const result = {};
    keys.forEach(k => {
      result[k] = storageMock.data[k];
    });
    return result;
  },
  remove: async (key) => {
    delete storageMock.data[key];
  }
};

// Global polyfill for Node environment
global.chrome = {
  storage: {
    local: storageMock
  }
};

// Import ActionManager
const ActionManager = require('../lib/action-manager.js');

async function runTests() {
  console.log("🧪 Running ActionManager Tests...");

  // Test 1: Save Action
  const testAction = { 
    action: "test", 
    text: "hello",
    tabId: 123 
  };
  
  await ActionManager.savePendingAction(testAction);
  
  // Verify it's in mock storage
  if (JSON.stringify(storageMock.data.pendingAction) !== JSON.stringify(testAction)) {
    throw new Error("❌ Test 1 Failed: Action not saved correctly to storage.");
  }
  console.log("✅ Test 1 Passed: Action saved.");

  // Test 2: Get Action (No Clear)
  const retrieved1 = await ActionManager.getPendingAction(false);
  if (retrieved1.text !== "hello") {
    throw new Error("❌ Test 2 Failed: Could not retrieve action.");
  }
  if (!storageMock.data.pendingAction) {
    throw new Error("❌ Test 2 Failed: Action was cleared but shouldn't be.");
  }
  console.log("✅ Test 2 Passed: Action retrieved (no clear).");

  // Test 3: Get Action (With Clear)
  const retrieved2 = await ActionManager.getPendingAction(true);
  if (retrieved2.text !== "hello") {
    throw new Error("❌ Test 3 Failed: Could not retrieve action on second try.");
  }
  if (storageMock.data.pendingAction) {
    throw new Error("❌ Test 3 Failed: Action was NOT cleared.");
  }
  console.log("✅ Test 3 Passed: Action retrieved and cleared.");

  // Test 4: Empty Get
  const empty = await ActionManager.getPendingAction();
  if (empty !== null) {
    throw new Error("❌ Test 4 Failed: Expected null for empty storage.");
  }
  console.log("✅ Test 4 Passed: Returns null when empty.");

  console.log("🎉 All ActionManager tests passed!");
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
