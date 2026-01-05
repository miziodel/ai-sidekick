/**
 * Copyright (c) 2026 Maurizio Delmonte
 * Licensed under the MIT License. See LICENSE file in the project root for full license information.
 */

/**
 * CRYPTO UTILITIES
 * Pure functions for securely encrypting/decrypting API keys using PBKDF2 + AES-GCM.
 */

// Handle Node.js vs Browser environment for Web Crypto API
const cryptoAPI =
  typeof window !== "undefined" && window.crypto
    ? window.crypto
    : typeof global !== "undefined" && global.crypto
    ? global.crypto
    : null;

if (!cryptoAPI) {
  console.error("Web Crypto API not available. Secure features will fail.");
}

const subtle = cryptoAPI.subtle;

/**
 * Derives a cryptographic key from a password and salt using PBKDF2.
 * @param {string} password - User provided master password
 * @param {Uint8Array} salt - Random salt
 * @returns {Promise<CryptoKey>} - Derived key for AES-GCM
 */
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts cleartext using a password.
 * @param {string} text - The text to encrypt (e.g., JSON string of keys)
 * @param {string} password - The master password
 * @returns {Promise<Object>} - { ciphertext: string (base64), iv: string (base64), salt: string (base64) }
 */
async function encryptVault(text, password) {
  const enc = new TextEncoder();
  const salt = cryptoAPI.getRandomValues(new Uint8Array(16));
  const iv = cryptoAPI.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);

  const encrypted = await subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
  };
}

/**
 * Decrypts a vault object using a password.
 * @param {Object} vault - { ciphertext, iv, salt } (all base64 strings)
 * @param {string} password - The master password
 * @returns {Promise<string>} - The decrypted cleartext
 */
async function decryptVault(vault, password) {
  try {
    const salt = base64ToArrayBuffer(vault.salt);
    const iv = base64ToArrayBuffer(vault.iv);
    const ciphertext = base64ToArrayBuffer(vault.ciphertext);

    const key = await deriveKey(password, salt);

    const decrypted = await subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (error) {
    throw new Error("Incorrect Password or Corrupted Vault");
  }
}

// --- Helpers ---

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // In Node.js environment btoa might not be global, verify support
  if (typeof btoa === "function") {
    return btoa(binary);
  } else if (typeof Buffer !== "undefined") {
    return Buffer.from(binary, "binary").toString("base64");
  }
  throw new Error("Base64 conversion not supported in this environment");
}

function base64ToArrayBuffer(base64) {
  let binary_string;
  if (typeof atob === "function") {
    binary_string = atob(base64);
  } else if (typeof Buffer !== "undefined") {
    binary_string = Buffer.from(base64, "base64").toString("binary");
  } else {
    throw new Error("Base64 conversion not supported");
  }

  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// Export for module systems (Node tests) vs Browser global
if (typeof module !== "undefined" && module.exports) {
  module.exports = { encryptVault, decryptVault };
} else {
  // Browser global
  window.CryptoUtils = { encryptVault, decryptVault };
}
