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

### Configuration
- [x] **Configurable Prompts**: 10 fully customisable templates including new actions like "Expert Critique", "Pros & Cons", and "Data Extraction".
- [x] **Dynamic Context Menu**: The browser context menu automatically syncs with the configured prompts.
- [x] **Hot-Reload**: Settings changes (including prompts) apply instantly without reloading the extension.

## 🟡 Known Limitations / TODOs
- **Destructive Summarization**: When summarizing context, replace the entire history with the summary (must be detailed) to save tokens/screen space.

### Arc Browser Support
- [x] **Robust Migration**: Fully handles "Little Arc" to "Main Tab" promotion using Tab Survival tracking.
- [x] **Resilient Discovery**: Uses Title matching and "blind trust" for Active Tabs to bypass Arc's URL obfuscation.
- [x] **Split View Compatible**: "Open in Tab" button allows opening chat in a standard tab for Arc Split View.
- [x] **Context Awareness**: "Open Sidekick Here" menu item allows setting context without triggering a prompt.
- [x] **UI Context Bar**: Visual indicator of the active page URL being analyzed.

## 🟡 Known Limitations / TODOs
- **Destructive Summarization**: When summarizing context, replace the entire history with the summary (must be detailed) to save tokens/screen space.
- **Tab-Specific Chat Sessions**: Partially addressed via "Open Sidekick Here" and Context Bar, but true isolation per tab requires further architectural changes.
- **Regression Testing Infrastructure**: Needs `init` (package.json + ESLint) and integration of `repro_vault_flow.js` into `npm test` pipeline (Deferred).
- **Image Support**: Currently text-only.
- **Model Parameters**: Temperature/Top-K are hardcoded.
- **History Export**: No way to export chat logs yet.
- **DeepSeek Reasoning**: R1 model works but reasoning steps are not yet parsed/separated visually (just raw text).

## 🛠 Tech Stack
- **Framework**: Vanilla JS (No Webpack/Build Step).
- **Storage**: `chrome.storage.local` (History), `chrome.storage.sync` (Encrypted Vault).
- **Testing**: Node.js unit tests (`tests/run_tests.js`) with manual UI verification.
