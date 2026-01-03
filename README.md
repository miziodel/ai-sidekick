# AI Sidekick - Chrome Extension

AI Sidekick is a minimalist, "Arc-style" Chrome Extension that brings multi-LLM chat (Gemini & DeepSeek) and contextual analysis to your browser side panel.

## 🎯 key Features
- **Multi-Model**: Switch between Gemini 1.5 (Pro/Flash) and DeepSeek (V3/R1 Reasoner).
- **Secure Vault**: Client-side encryption (PBKDF2 + AES-GCM) for API keys. No backend required.
- **Web Mode**: Fallback to `gemini.google.com` (free) if no API key is available.
- **Contextual Actions**: Right-click to Summarize, Explain, or Analyze entire pages.
- **Streaming**: Real-time text generation.

## 🛠 Architecture Decisions
- **Manifest V3**: Compliant with latest Chrome standards.
- **No Backend**: Privacy-first. All calls go directly from browser to LLM APIs.
- **Vendor-ing**: `marked.js` is included locally to respect CSP (Content Security Policy).
- **Testing**: Pure logic (formatting, crypto) is separated from UI logic for easy Node.js testing.

## 🚀 Setup
1. Clone/Download this repo.
2. Run `npm install` (optional, mostly for testing scripts).
3. Open `chrome://extensions`.
4. Enable "Developer Mode".
5. Click "Load Unpacked" -> Select this folder.

## ⚙️ Configuration
1.  Right-click the extension icon -> **Options**.
2.  **Paste Keys** (Stored locally or encrypted in Cloud Vault):
    - [Get Gemini Key](https://aistudio.google.com/app/apikey)
    - [Get DeepSeek Key](https://platform.deepseek.com/api_keys)
3.  **Arc Browser Tip**:
    - If the icon isn't visible, hover over the URL bar, click the **Puzzle Piece 🧩**, and **Pin 📌** the AI Sidekick extension.
    - If the Side Panel doesn't open on click, try **Right Click -> AI Sidekick -> Open Side Panel**.

## 🧪 Testing
**Manual Verification**:
1.  Select "Gemini Web (Free)" -> Type "Hello" -> Verify it opens `gemini.google.com`.
2.  Select text on a page -> Right Click -> "Explain This".

**Automated Tests**:
Run pure logic tests:
```bash
node tests/run_tests.js
```
