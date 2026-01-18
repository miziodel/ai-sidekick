# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2] - 2026-01-18

### Added
- **Versioning Protocol**: Established strict version sync rules in `.agent/rules/02-versioning.md`.

### Changed
- **Documentation**: Removed "draft" warnings from README; project promoted to Beta status.
- **Audit**: Validated repository consistency and cleanup.

## [1.0.1] - 2026-01-18

### Added
- **Antigravity Structure**: Established `.agent/rules` and strict project identity.
- **Source Reorganization**: Moved all extension code to `src/` for cleaner root.
- **Static Analysis**: Added `tests/audit_paths.js` to prevent broken links during refactors.
- **Side Panel Path**: Corrected `openExtension` logic to point to `src/sidepanel.html` after migration.
- **Debug Logging**: Added stylized console logs in the Side Panel to monitor full chat exchanges (prompts, history context, responses).
- **Multi-Model Support**: Integrated Gemini 1.5 Flash/Pro and DeepSeek V3/R1.
- **Client-Side Encryption**: Implemented `CryptoUtils` class for PBKDF2 + AES-GCM local key storage.
- **Arc Browser Support**:
    - **[Implemented]** **Single Instance Window**: Added logic to `background.js` using `chrome.storage.session` to track and focus the existing extension window, preventing duplicates.
    - **[Added]** **UI Context Bar**: Visual indicator of the active page URL being analyzed in the Side Panel/Popup.
    - **[Added]** **Open Sidekick Here**: New context menu item to initialize context without triggering a prompt.
    - "Little Arc" migration tracking.
    - Title-based tab discovery fallback.
    - Split View compatibility buttons.
- **Memory & Context**:
    - **Context Strategy**: Implemented configurable strategy (Auto, URL-only, Full-text) via settings.
    - **Security Restriction Fallback**: Implemented graceful fallback to URL-only analysis for restricted browser pages.
    - **Hidden Context**: Decoupled AI prompt from user UI to keep chat history clean during page analysis.
    - **Sliding Window**: Context limited to the last 10 messages to prevent token overflow.
    - **Yellow Toast**: Persistent notifications for memory pruning and status alerts.
- **UI System**:
    - "Arc-style" minimalist design.
    - Persistent "Yellow Toast" notifications for context pruning.
    - Markdown rendering with vendored `marked.js`.
- **Configuration**:
    - **Configurable Prompts**: Implemented flexible template system using `{{selection}}`, `{{content}}`, `{{url}}`, and `{{title}}` variables.
    - **Custom Actions System**: Full CRUD for context menu actions.
    - **Model Persistence**: Dropdown selection now persists across sidepanel sessions and extension restarts.
    - **Hot-Reload**: Settings changes apply instantly.
- **Security Hardening**:
    - **Session-Based Storage**: Integrated `chrome.storage.session` to persist decrypted keys across sidepanel sessions.
    - **Auto-Lock**: Implemented a 15-minute inactivity timer that automatically locks the vault.
    - **XSS Mitigation**: Added HTML sanitization for LLM output to prevent script injection.
    - **Deferred Actions**: Implemented context menu action queuing to handle "Vault Locked" states gracefully.

### Security
- **GitHub**: Repository initialized and pushed to `miziodel/ai-sidekick`.
- **CSP Compliance**: Removed all remote script references; vendored necessary libraries.
- **Zero Backend**: All AI calls go directly from client to API.

### Fixed
- **Narrow Toolbar Popup**: Resolved issue in Arc Browser by forcing minimum dimensions (400x600px) in `styles.css` and reverting to `default_popup` for stability.
- **Context Limit**: Implemented "Sliding Window" (last 10 messages) to prevent `400 Bad Request` on long chats.
- **Context Menu Race Condition**: Fixed `Unchecked runtime.lastError: duplicate id` by implementing a mutex lock and robust error suppression.
