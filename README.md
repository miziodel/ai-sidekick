# AI Sidekick - Chrome Extension

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Status](https://img.shields.io/badge/status-draft-orange.svg)

AI Sidekick is a minimalist, "Arc-style" Chrome Extension that brings multi-LLM chat (Gemini & DeepSeek) and contextual analysis to your browser side panel.

> ⚠️ **Note:** This project is currently in a **super draft** phase. Many features are still in the conceptual stage or only partially implemented.

## 🎯 Key Features

- **Multi-Model**: Switch between **Gemini 2.5** (Pro/Flash) and **DeepSeek** (V3/R1 Reasoner).
- **Conversation Memory**: Maintains chat history across sessions with a "Sliding Window" (keeps last 10 messages) to manage token usage.
- **Secure Vault**: Client-side encryption (PBKDF2 + AES-GCM) for API keys.
  - **Session Persistence**: Keys stay unlocked for the browser session.
  - **Auto-Lock**: Automatically locks after 15 minutes of inactivity.
- **Web Mode**: Fallback to `gemini.google.com` (free) if no API key is available.
- **Contextual Actions**:
  - Right-click to Explain, Summarize, or Analyze pages.
  - **Summarize Button**: One-click summary of the current conversation.
- **Accessibility**: Tooltips and persistent, high-visibility notifications for status changes.
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

## 🛠 Development

To ensure code quality and prevent regressions, this project uses **ESLint** and **Prettier**.

```bash
# Install dependencies
npm install

# Run Static Analysis (Linting)
npm run lint

# Auto-fix Lint errors
npm run lint:fix

# Format Code
npm run format
```

## ⚙️ Configuration

1.  Click the extension icon -> **Options**.
2.  **Paste Keys** (Stored locally or encrypted in Cloud Vault):
    - [Get Gemini Key](https://aistudio.google.com/app/apikey)
    - [Get DeepSeek Key](https://platform.deepseek.com/api_keys)
3.  **Arc Browser Setup**:
    - **Pin the Extension**: Hover over the URL bar -> Click Puzzle Piece 🧩 -> Pin 📌 AI Sidekick.
    - **Toolbar Icon**: Clicking the icon opens **Options/Config**.
    - **Open Chat**: Use **Right Click -> AI Sidekick -> Open Sidekick Here** (or Summarize/Explain).
    - **Split View**: To use alongside a page, open Sidekick, then click the **External Link Icon** (top right) to open in a tab -> Drag to Split View.

## 🧪 Testing

**Manual Verification**:

1.  Select "Gemini Web (Free)" -> Type "Hello" -> Verify it opens `gemini.google.com`.
2.  Select text on a page -> Right Click -> "Explain This".

**Automated Tests**:
Run pure logic tests:

```bash
node tests/run_tests.js
```

### Configurable Prompts

You can customize the prompts used for context menu actions and page analysis in the **Options** page (`Right-click extension icon -> Options`).

#### Available Variables

Use these placeholders to insert dynamic content into your prompts:

| Variable        | Description                                                        | Context             |
| :-------------- | :----------------------------------------------------------------- | :------------------ |
| `{{selection}}` | The text currently selected by the user.                           | Select Menu Actions |
| `{{content}}`   | The full text content of the active page (truncated if necessary). | Analyze Page        |
| `{{url}}`       | The URL of the active page.                                        | All Actions         |
| `{{title}}`     | The title of the active page.                                      | All Actions         |

#### Examples

- **Summarize Selection**: `Summarize this in 3 bullet points: {{selection}}`
- **Explain Selection**: `Explain this to a 5-year-old: {{selection}}`
- **Analyze Page**: `Find any deadlines mentioned in this page: {{content}}`

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started.

## 🔒 Security & Privacy

- **Privacy**: API Keys are stored locally on your device. If you use the Cloud Vault feature, they are encrypted with a Master Password using your Google Account for sync, but **we cannot see your keys**. No usage data is collected.
- **Security**: If you find a vulnerability, please see [SECURITY.md](SECURITY.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Third-party libraries are listed in [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).
