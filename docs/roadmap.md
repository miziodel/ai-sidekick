# Roadmap

## 🚧 In Progress
- [x] **Smart Content Extraction (Clean {{page_content}})**
    - *Goal*: Replace noisy `document.body.innerText` with a heuristic-based scraper.
    - *Details*: Target semantic tags (`<main>`, `<article>`), filter out noise (`nav`, `footer`, `ads`), and preserve relevant links/titles.
    - *Technical Note*: Use a custom content scraper within `chrome.scripting.executeScript`.

## 📋 Backlog / Planned Features

### Content Extraction Refinement
- [ ] **Heuristic Post-Processing**: Further clean Readability output to remove residual boilerplate not caught by the library.
- [ ] **Title & Header Formatting**: Improve handling of `<h1>`-`<h3>` tags to maintain hierarchy in the extracted text prompt.
- [ ] **Metadata Enrichment**: Extract more metadata (author, publish date) if available via Readability.

### Urgent Fixes
- [ ] **🚨 Chat UI ID Collision**: `Date.now()` allows duplicate IDs when messages are sent in rapid succession (e.g., User + AI response).
    - *Problem*: AI response overwrites User message bubble if IDs collide.
    - *Impact*: User messages "disappear" from UI (but exist in history).
    - *Fix*: Use unique IDs (timestamp + random + counter).
- [ ] **🚨 Web Mode Fallback (BROKEN)**: The "Gemini Web (Free)" option currently just opens `gemini.google.com` in a new tab, but doesn't properly integrate.
    - *Goal*: Implement proper fallback to free web interfaces when no API key is available.
    - *Scope*: Support multiple providers:
      - Gemini: `gemini.google.com`
      - DeepSeek: `chat.deepseek.com`
      - ChatGPT: `chat.openai.com` (or `chatgpt.com`)
      - Claude: `claude.ai`
    - *Technical Note*: Consider embedding via iframe in side panel OR seamless redirect with context injection (if possible).
- [ ] **Destructive Summarization**: Context summarization currently replaces the *entire* history. Needs a strategy to append summary + recent messages.
- [ ] **Tab Isolation**: Chat session is currently global (or loosely tied to window). Need strict per-tab or per-domain session isolation.
- [ ] **Image Support**: Add multimodal input (Screenshots/Images) for Gemini.
- [ ] **Model Parameters**: Expose Temperature and Top-K in Options UI.
- [ ] **History Export**: JSON/Markdown export of chat logs.
- [ ] **DeepSeek Reasoning**: Parse `<think>` tags from DeepSeek R1 to visually separate reasoning steps from the final answer.

### Technical Debt
- [x] **Regression Testing**: Integrate `repro_vault_flow.js` into the main `npm test` suite.
- Added UI Context Bar and "Open Sidekick Here" menu action.
- Integrated ESLint into the build pipeline.
- Implemented **Smart Content Extraction** with heuristic-based semantic scraper.
- [x] **Static Analysis**: Integrated ESLint and Prettier for mandatory codebase hygiene.
- [ ] **Release Automation**: Create GitHub Actions workflow (`.github/workflows/release.yml`) to auto-build ZIP on git tag push.
    - *Goal*: Reduce manual errors and streamline release process.
    - *Scope*: Automatic ZIP creation, GitHub Release publishing, version validation.
