
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
