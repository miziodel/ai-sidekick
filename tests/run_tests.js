/**
 * AUTOMATED TESTS (Node.js)
 * Run with: node tests/run_tests.js
 */

const assert = require('assert');
const crypto = require('crypto');

// Polyfill Web Crypto API for Node.js if needed (Node 15+ has it under webcrypto)
if (!global.crypto) {
  global.crypto = crypto.webcrypto;
}

// Mock browser globals for libs that expect them
global.window = {};

// Import libraries
const Logic = require('../src/lib/logic.js');
const CryptoUtils = require('../src/lib/crypto-utils.js');
const ActionManager = require('../src/lib/action-manager.js');

async function runTests() {
  console.log('🧪 Starting Automated Tests...');

  // --- TEST 1: Logic.truncateText ---
  console.log('   Test 1: Logic.truncateText');
  const longText = 'a'.repeat(150);
  const truncated = Logic.truncateText(longText, 100);
  assert.strictEqual(truncated.length > 100, true, 'Should append truncation message');
  assert.strictEqual(truncated.startsWith('a'.repeat(100)), true, 'Should keep first 100 chars');
  console.log('   ✅ Passed');

  // --- TEST 2: Logic.formatPrompt ---
  // --- TEST 2: Logic.formatPrompt ---
  console.log('   Test 2: Logic.formatPrompt');

  // Test Substitution
  const template1 = 'Summarize {{selection}} from {{url}}';
  const ctx1 = { selection: 'SelectedText', url: 'http://google.com' };
  const res1 = Logic.formatPrompt(template1, ctx1);

  assert.ok(res1.includes('Summarize SelectedText'), 'Substitutes selection');
  assert.ok(res1.includes('http://google.com'), 'Substitutes URL');

  // Test Truncation
  const template2 = 'Content: {{content}}';
  const longContent = 'a'.repeat(200000); // Exceeds default limit
  const res2 = Logic.formatPrompt(template2, { content: longContent });
  assert.ok(res2.includes('TRUNCATED'), 'Truncates huge content');

  // Test Fallback/Missing
  const template3 = 'Title: {{title}}';
  const res3 = Logic.formatPrompt(template3, {}); // Missing title
  assert.strictEqual(res3, 'Title: ', 'Handles missing keys gracefully (empty string)');

  console.log('   ✅ Passed');

  // --- TEST 3: Logic.prepareSystemInstruction ---
  console.log('   Test 3: Logic.prepareSystemInstruction');
  const defaultInst = Logic.prepareSystemInstruction('');
  assert.ok(defaultInst.includes('AI Sidekick'), 'Default instruction present');
  const customInst = Logic.prepareSystemInstruction('Talk like a pirate');
  assert.ok(customInst.includes('Talk like a pirate'), 'Custom instruction present');
  console.log('   ✅ Passed');

  // --- TEST 4: CryptoUtils.encryptVault / decryptVault ---
  console.log('   Test 4: CryptoUtils Encryption Roundtrip');
  const password = 'super_secret_password';
  const data = JSON.stringify({ gemini: '123', deepseek: 'abc' });

  try {
    const vault = await CryptoUtils.encryptVault(data, password);
    assert.ok(vault.ciphertext, 'Has ciphertext');
    assert.ok(vault.iv, 'Has iv');
    assert.ok(vault.salt, 'Has salt');

    const decrypted = await CryptoUtils.decryptVault(vault, password);
    assert.strictEqual(decrypted, data, 'Decrypted data matches original');

    // Test Failure
    try {
      await CryptoUtils.decryptVault(vault, 'wrong_password');
      assert.fail('Should have thrown error on wrong password');
    } catch (e) {
      assert.ok(true, 'Correctly failed on wrong password');
    }
  } catch (e) {
    console.error('Crypto Test Failed:', e);
    process.exit(1);
  }
  console.log('   ✅ Passed');

  // --- TEST 5: ActionManager (Mocked Chrome) ---
  console.log('   Test 5: ActionManager (Mocking chrome.storage)');

  // Mock chrome.storage.local
  let storageMock = {};
  global.chrome = {
    storage: {
      local: {
        set: async (obj) => {
          Object.assign(storageMock, obj);
        },
        get: async (keys) => {
          const res = {};
          keys.forEach((k) => (res[k] = storageMock[k]));
          return res;
        },
        remove: async (key) => {
          delete storageMock[key];
        },
      },
    },
  };

  // Test Save
  await ActionManager.savePendingAction({ type: 'TEST', val: 123 });
  assert.deepStrictEqual(
    storageMock.pendingAction,
    { type: 'TEST', val: 123 },
    'Saved to mock storage',
  );

  // Test Get (with clear)
  const action = await ActionManager.getPendingAction(true);
  assert.deepStrictEqual(action, { type: 'TEST', val: 123 }, 'Retrieved action');
  assert.strictEqual(storageMock.pendingAction, undefined, 'Cleared after read');

  // Test Empty
  const empty = await ActionManager.getPendingAction();
  assert.strictEqual(empty, null, 'Returns null when empty');

  console.log('   ✅ Passed');

  // --- TEST 6: Logic.pruneHistory ---
  console.log('   Test 6: Logic.pruneHistory');
  const history = Array.from({ length: 15 }, (_, i) => ({ role: 'user', text: `msg${i}` })); // msg0..msg14

  // Test Limit 10
  const pruned = Logic.pruneHistory(history, 10);
  assert.strictEqual(pruned.length, 10, 'Should contain exactly 10 items');
  assert.strictEqual(pruned[0].text, 'msg5', 'Should start from msg5 (0-4 dropped)'); // 15 items, keep last 10 -> start index 5
  assert.strictEqual(pruned[9].text, 'msg14', 'Should end at msg14');

  // Test specific case: limit > length
  const shortHistory = [{ role: 'user', text: 'hi' }];
  assert.strictEqual(
    Logic.pruneHistory(shortHistory, 5).length,
    1,
    'Should keep all if length < limit',
  );

  console.log('   ✅ Passed');

  // --- TEST 7: Logic.formatHistory ---
  console.log('   Test 7: Logic.formatHistory');
  const sampleHist = [
    { role: 'user', text: 'Hello' },
    { role: 'ai', text: 'Hi present' },
  ];

  // Gemini
  const geminiFmt = Logic.formatHistoryForGemini(sampleHist);
  assert.strictEqual(geminiFmt[0].role, 'user');
  assert.strictEqual(geminiFmt[0].parts[0].text, 'Hello');
  assert.strictEqual(geminiFmt[1].role, 'model'); // ai -> model
  assert.strictEqual(geminiFmt[1].parts[0].text, 'Hi present');

  // DeepSeek
  const deepseekFmt = Logic.formatHistoryForDeepSeek(sampleHist);
  assert.strictEqual(deepseekFmt[0].role, 'user');
  assert.strictEqual(deepseekFmt[0].content, 'Hello');
  assert.strictEqual(deepseekFmt[1].role, 'assistant'); // ai -> assistant
  assert.strictEqual(deepseekFmt[1].content, 'Hi present');

  console.log('   ✅ Passed');

  console.log('\n🎉 ALL TESTS PASSED!');
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
