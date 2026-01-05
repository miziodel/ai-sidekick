
# Lessons Learned: AI Sidekick Development

## 1. Browser Compatibility: The "Arc Factor"
Developing for Arc Browser requires specific considerations compared to standard Chrome.

- **Issue**: `chrome.sidePanel.open()` often fails silently or is ignored when triggered programmatically from a background script listener on `chrome.action.onClicked`.
- **Issue**: `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` is inconsistent.
- **Solution (The Nuclear Option)**: Define `"default_popup": "sidepanel.html"` in `manifest.json`. This forces the browser to render the HTML in a standard UI bubble anchored to the icon. It bypasses the background script trigger chain entirely.
- **Fallback**: While we used `default_popup`, a robust architecture for Side Panel extensions should include a `try/catch` block that attempts to open the Side Panel and falls back to `chrome.windows.create({ type: 'popup' })` if the API fails.

## 2. Manifest V3 Security & CSP
- **Issue**: Chrome Store prevents loading remote scripts (like typical CDN links for `marked.js` or `highlight.js`) due to the Content Security Policy (CSP).
- **Solution**: "Vendor" the libraries. We downloaded `marked.min.js` and placed it in a local `lib/` folder. This is the only compliant way to use third-party logic without a build step (Webpack/Vite).

## 3. Client-Side Encryption (Zero Backend)
- **Constraint**: We needed to store API keys securely without a server.
- **Pattern**: 
    - Use `window.crypto.subtle` (Web Crypto API) for standard AES-GCM.
    - **Key Derivation**: Never use the password directly as a key. Use **PBKDF2** with a random salt to derive a secure key.
    - **Storage**: Store the *Encrypted Blob* (Ciphertext + IV + Salt) in `chrome.storage.sync`.
    - **Session**: Keep the derived key in `memory` (window variable) only. If the browser restarts, the memory is cleared, forcing a re-unlock.

## 4. UI/UX for Popups
- **Lesson**: Extension popups adapt to content size but can be buggy.
- **Fix**: Always enforce explicit `width` and `height` on the `body` tag in CSS (e.g., `width: 400px; height: 600px`). This prevents the "tiny window" bug where the popup renders as a 10x10px square.

## 5. Automated Testing for Extensions
- **Strategy**: It is hard to test `chrome.*` APIs.
- **Pattern**: Split code into "Pure Logic" (string formatting, crypto math) and "Extension Logic" (listeners, DOM).
- **Benefit**: Pure logic can be tested in standard Node.js scripts (as we did with `tests/run_tests.js`) without needing a headless browser harness like Puppeteer/Playwright for simple unit tests.
- **Principle**: **TDD (Test Driven Development)** and **DRY (Don't Repeat Yourself)** are now mandatory project principles.

## 6. Communication between Background and UI
- **Race Condition**: Sending a message (`chrome.runtime.sendMessage`) immediately after opening a side panel often fails because the panel's script hasn't loaded yet.
- **Pattern**: **Pending Action Pattern**. 
    1. Background script saves the intent (action, data) to `chrome.storage.local`.
    2. Background script opens the panel.
    3. Panel script checks `chrome.storage.local` on `init()`.
    4. Pass data via storage, not ephemeral messages, for critical startup actions.

## 7. Service Worker Environment
- **Gotcha**: `window` is not defined in Manifest V3 background scripts (Service Workers).
- **Fix**: Library code shared between UI and Background must check for `self` vs `window`:
  ```javascript
  (typeof self !== 'undefined' ? self : window).MyClass = MyClass;
  ```

## 8. Robust Window Targeting
- **Fix**: Always fallback to `chrome.windows.getLastFocused()` if `tab.windowId` is missing before attempting `chrome.sidePanel.open`.

## 9. Conversation Memory & Token Management
- **Issue**: Stateless LLM calls forget previous context, but sending full history quickly hits token limits or degrades performance.
- **Strategy**: **Sliding Window Context**.
    - Store full history for the user's UI.
    - Prune context sent to the API to the **last N messages** (e.g., 10).
    - **Transparency**: When pruning occurs, explicitly notify the user (e.g., "Oldest messages removed from AI memory") so they know why the AI might "forget" early details.

## 10. UI Feedback for Background Actions
- **Issue**: Transient actions (like pruning memory or copying text) can be missed if notifications are too subtle.
- **Pattern**: **Persistent Toast with Manual Dismissal**.
    - For important status changes (like memory loss), standard auto-hiding toasts are insufficient.
    - Use a high-contrast (e.g., Yellow) persistent banner that requires explicit user interaction (click "×") to dismiss.
    - This ensures the user acknowledges the system state change.

## 11. Accessibility & Discovery
- **Lesson**: Clean UIs often hide functionality.
- **Fix**: comprehensive **Tooltips** (`title` attributes) are essential for icon-only buttons to ensure users know what "Eye", "Refresh", or "List" icons do before clicking.

## 12. System Page Security Restrictions
- **Issue**: Extensions cannot run `chrome.scripting.executeScript` or access `document.body` on restricted pages like `chrome://extensions`, `chrome://newtab`, or the Chrome Web Store. This causes runtime errors when "Summarize Page" is triggered.
- **Pattern**: **Graceful Fallback Strategy**.
    1. **Pre-check**: If the user's selected strategy (e.g., "URL Only") doesn't require text, skip injection entirely.
    2. **Try/Catch**: Wrap injection in a try/catch block.
    3. **Fallback**: If injection fails, catch the error and proceed with **URL Only** analysis, notifying the user ("Security Restriction: using URL only"). This ensures the feature works (partially) rather than crashing.

## 13. Decoupling Chat UI from AI Logic
- **Issue**: Sending the full page context (thousands of characters) as the "User Message" ruins the chat readability.
- **Pattern**: **Hidden Context**.
    - The `addMessage('user', text)` function should accept a `displayOverride`.
    - Show short, clean intent to the user: "Summarize this page".
    - Send the massive, prompt-engineered blob to the LLM (and history) in the background.

## 14. Flexible Context Strategy
- **Issue**: Different models have different strengths (DeepSeek has built-in browsing, Gemini 1.5 has massive context). Forcing one approach (e.g., always extract text) is suboptimal.
- **Solution**: **Configurable Context Strategy**.
    - **Auto**: Tailor behavior to model (DeepSeek -> URL, Gemini -> Text).
    - **URL Only**: Minimal cost, fast.
    - **Full Text**: Maximum context, higher cost/latency.
    - Allow the user to override this in Options.

## 15. Managing State in Manifest V3 (Session vs. Global Vars)
- **Issue**: Storing state (e.g., unlocked keys) in a global variable (`window.keys`) is unreliable because the Extension Service Worker and Side Panel can terminate or "freeze" at any time, wiping the state. Reloading the extension (developer mode) definitely wipes it.
- **Service Worker Persistence**: Service workers in MV3 are ephemeral. Storing state (like window IDs) in global variables is flaky.
  - **Solution**: Use `chrome.storage.session` for in-memory state that survives SW restarts but clears on browser exit.
- **Arc Browser: Window Destruction != Tab Death**: In Arc, promoting a "Little Arc" or Popup window to a main tab triggers `chrome.windows.onRemoved`, but the `tabId` remains valid and moves to a new window.
  - **Solution**: Track `{ windowId, tabId }`. In `onRemoved`, check if `tabId` is still alive using `chrome.tabs.get`. If yes, update the tracked `windowId` instead of clearing state. This allows the extension to "stick" to the user's session across UI migrations.
- **Debugging: The "Deep Inspection" Rule**: When standard logic fails silently (e.g. extension says "tab not found" but you see it), do NOT assume API behavior.
  - **Solution**: Log EVERYTHING. Dump `chrome.tabs.query({})`. Dump `win.tabs`. We found that Arc hides URLs in some contexts (returning undefined or empty), causing standard matchers to fail. Always instrument code to reveal the *actual* data shape before trying to fix logic. "Don't guess, inspect."
- **Solution**: **chrome.storage.session**.
    - This is the canonical place for in-memory, session-scoped data.
    - It survives context invalidation, side panel close/reopen, and worker suspension.
    - It is isolated from content scripts (secure).
    - It is cleared on browser quit (transient).

## 16. Regression Prevention (The "Deleted Function" Incident)
- **Incident**: During a refactor, a critical helper function (`hideVaultOverlay`) was accidentally deleted. The linter was not running to catch "Undefined function", leading to a runtime crash on startup.
- **Lesson**: **Static Analysis is Mandatory**.
- **Fix**: We must implement `ESLint` in the build pipeline. We cannot rely solely on manual testing or "being careful".
- **Action**: Creating a `package.json` with `eslint` is the next priority infrastructure task.

## 17. Licensing & Compliance
- **Rule**: Always verify copyright headers on *all* source files (JS, HTML, CSS) before release.
- **Rule**: Explicitly list and verify licenses of *all* third-party software.
    - Check for "Viral" licenses (GPL) which may be incompatible.
    - Do not rely on AI hallucinations for license text; verify the actual file headers or `LICENSE` files in the dependencies.
    - Attribution must be precise (Year, Holder).

## Current Status
- **Core**: Stable.
- **UI**: Functional draft.
- **Licensing**: Implemented (MIT).
