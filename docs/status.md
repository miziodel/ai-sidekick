# Project Status: Feature Matrix

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
- [x] **Custom Actions System**: Full CRUD (Create/Read/Update/Delete) for context menu actions. Supports dynamic prompts and context selection (Page vs Selection).
- [x] **Dynamic Context Menu**: The browser context menu automatically syncs with the configured prompts.
- [x] **Hot-Reload**: Settings changes (including prompts) apply instantly without reloading the extension.

### Arc Browser Support
- [x] **Robust Migration**: Fully handles "Little Arc" to "Main Tab" promotion using Tab Survival tracking.
- [x] **Resilient Discovery**: Uses Title matching and "blind trust" for Active Tabs to bypass Arc's URL obfuscation.
- [x] **Split View Compatible**: "Open in Tab" button allows opening chat in a standard tab for Arc Split View.
- [x] **Context Awareness**: "Open Sidekick Here" menu item allows setting context without triggering a prompt.
- [x] **UI Context Bar**: Visual indicator of the active page URL being analyzed.
