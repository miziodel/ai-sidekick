# Project Status: AI Sidekick

## 🟢 Implemented Features (Verified)

### Core
- [x] **Multi-Model Support**: Gemini 1.5 Flash/Pro (002) and DeepSeek V3/R1.
- [x] **Streaming**: Real-time token streaming for all API models.
- [x] **Secure Vault**: PBKDF2 + AES-GCM client-side encryption for API keys.
- [x] **Web Mode Fallback**: Direct link to `gemini.google.com` for free usage.

### Memory & Context
- [x] **Conversation Persistence**: Chat history saved to `chrome.storage.local`.
- [x] **Sliding Window**: Sends only the last **10 messages** to LLM to prevent context overflow.
- [x] **Context Pruning Notification**: Persistent yellow toast warns when older messages are forgotten.
- [x] **Summarization**: Dedicated button to request a conversation summary.

### UI/UX
- [x] **Arc-Style Design**: Minimalist aesthetic matching Arc browser.
- [x] **Tooltips**: Comprehensive coverage for all icon buttons.
- [x] **Markdown Rendering**: Safe rendering via `marked.js` (vendored).
- [x] **Toast Notifications**: Interactive, dismissible alerts.

### Accessibility
- [x] **Keyboard support**: Enter to send (Shift+Enter for newline).
- [x] **High-Contrast Alerts**: Visual feedback for system states.

## 🟡 Known Limitations / TODOs
- **Image Support**: Currently text-only.
- **Model Parameters**: Temperature/Top-K are hardcoded.
- **History Export**: No way to export chat logs yet.
- **DeepSeek Reasoning**: R1 model works but reasoning steps are not yet parsed/separated visually (just raw text).

## 🛠 Tech Stack
- **Framework**: Vanilla JS (No Webpack/Build Step).
- **Storage**: `chrome.storage.local` (History), `chrome.storage.sync` (Encrypted Vault).
- **Testing**: Node.js unit tests (`tests/run_tests.js`) with manual UI verification.
