# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Antigravity Structure**: Established `.agent/rules` and strict project identity.
- **Source Reorganization**: Moved all extension code to `src/` for cleaner root.
- **Static Analysis**: Added `tests/audit_paths.js` to prevent broken links during refactors.
- **Side Panel Path**: Corrected `openExtension` logic to point to `src/sidepanel.html` after migration.
- **Debug Logging**: Added stylized console logs in the Side Panel to monitor full chat exchanges (prompts, history context, responses).
- **Multi-Model Support**: Integrated Gemini 1.5 Flash/Pro and DeepSeek V3/R1.
- **Client-Side Encryption**: Implemented `CryptoUtils` class for PBKDF2 + AES-GCM local key storage.
- **Arc Browser Support**:
    - "Little Arc" migration tracking.
    - Title-based tab discovery fallback.
    - Split View compatibility buttons.
- **UI System**:
    - "Arc-style" minimalist design.
    - Persistent "Yellow Toast" notifications for context pruning.
    - Markdown rendering with vendored `marked.js`.
- **Configuration**:
    - Hot-Reload of settings.
    - Dynamic Context Menu actions (Crud).

### Security
- **CSP Compliance**: Removed all remote script references; vendored necessary libraries.
- **Zero Backend**: All AI calls go directly from client to API.

### Fixed
- **Context Limit**: Implemented "Sliding Window" (last 10 messages) to prevent `400 Bad Request` on long chats.
- **Context Menu Race Condition**: Fixed `Unchecked runtime.lastError: duplicate id` by implementing a mutex lock to prevent recursive setup calls and adding robust error suppression.
