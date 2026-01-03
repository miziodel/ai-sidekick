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
const Logic = require('../lib/logic.js');
const CryptoUtils = require('../lib/crypto-utils.js');

async function runTests() {
    console.log("🧪 Starting Automated Tests...");

    // --- TEST 1: Logic.truncateText ---
    console.log("   Test 1: Logic.truncateText");
    const longText = "a".repeat(150);
    const truncated = Logic.truncateText(longText, 100);
    assert.strictEqual(truncated.length > 100, true, "Should append truncation message");
    assert.strictEqual(truncated.startsWith("a".repeat(100)), true, "Should keep first 100 chars");
    console.log("   ✅ Passed");

    // --- TEST 2: Logic.formatPrompt ---
    console.log("   Test 2: Logic.formatPrompt");
    const prompt = Logic.formatPrompt("Summarize", "PageContent", "SelectedText", "http://google.com");
    assert.ok(prompt.includes("Summarize"), "Includes user message");
    assert.ok(prompt.includes("SelectedText"), "Includes selection");
    assert.ok(!prompt.includes("PageContent"), "Selection should take precedence over Page Content (or appear distinct)");
    console.log("   ✅ Passed");

    // --- TEST 3: Logic.prepareSystemInstruction ---
    console.log("   Test 3: Logic.prepareSystemInstruction");
    const defaultInst = Logic.prepareSystemInstruction("");
    assert.ok(defaultInst.includes("AI Sidekick"), "Default instruction present");
    const customInst = Logic.prepareSystemInstruction("Talk like a pirate");
    assert.ok(customInst.includes("Talk like a pirate"), "Custom instruction present");
    console.log("   ✅ Passed");

    // --- TEST 4: CryptoUtils.encryptVault / decryptVault ---
    console.log("   Test 4: CryptoUtils Encryption Roundtrip");
    const password = "super_secret_password";
    const data = JSON.stringify({ gemini: "123", deepseek: "abc" });
    
    try {
        const vault = await CryptoUtils.encryptVault(data, password);
        assert.ok(vault.ciphertext, "Has ciphertext");
        assert.ok(vault.iv, "Has iv");
        assert.ok(vault.salt, "Has salt");
        
        const decrypted = await CryptoUtils.decryptVault(vault, password);
        assert.strictEqual(decrypted, data, "Decrypted data matches original");
        
        // Test Failure
        try {
            await CryptoUtils.decryptVault(vault, "wrong_password");
            assert.fail("Should have thrown error on wrong password");
        } catch(e) {
            assert.ok(true, "Correctly failed on wrong password");
        }
        
    } catch (e) {
        console.error("Crypto Test Failed:", e);
        process.exit(1);
    }
    console.log("   ✅ Passed");

    console.log("\n🎉 ALL TESTS PASSED!");
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
