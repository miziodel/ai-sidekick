# Architecture Overview

## Core Principles
1.  **Zero Backend**: All AI interactions happen directly between the user's browser (Client) and the LLM APIs (Google/DeepSeek). No intermediate server.
2.  **Manifest V3**: Uses Service Workers (`background.js`) and `chrome.sidePanel`.
3.  **Privacy First**: API keys are stored in `chrome.storage.sync` (encrypted) or `chrome.storage.local` (plaintext, if user chooses). Keys are never exported.

## Key Components

### 1. The Vault (Security)
- **Encryption**: Uses `window.crypto.subtle` (AES-GCM).
- **Key Derivation**: PBKDF2 with random salt derived from a user password.
- **Session Memory**: Decrypted keys are held in `chrome.storage.session` (in-memory, cleared on browser close) or strictly in UI memory variables during runtime.

### 2. Side Panel UI
- **Technology**: Vanilla HTML/CSS/JS.
- **Rendering**: `marked.js` (vendored) for Markdown parsing.
- **Communication**: Listens to `chrome.runtime.onMessage` and `chrome.storage.onChanged` for real-time updates (Hot-Reload).

### 3. Logic Layer (`lib/`)
- **Shared Logic**: Code in `lib/` (e.g., `logic.js`, `crypto-utils.js`) is designed to run in **both** the Window context (UI) and Service Worker context (Background).
- **Environment Checks**: Uses `(typeof self !== 'undefined' ? self : window)` to attach globals safely.

### 4. Background Script
- **Role**: Orchestrator. Handles Context Menu clicks (`chrome.contextMenus`), installs, and "Little Arc" tab tracking.
- **Pending Actions**: Stores intent in `chrome.storage.local` before opening the Side Panel to prevent race conditions.
