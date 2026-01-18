# Roadmap

## 🚧 In Progress
- [ ] **Smart Content Extraction (Clean {{page_content}})**
    - *Goal*: Replace noisy `document.body.innerText` with a heuristic-based scraper.
    - *Details*: Target semantic tags (`<main>`, `<article>`), filter out noise (`nav`, `footer`, `ads`), and preserve relevant links/titles.
    - *Technical Note*: Use a custom content scraper within `chrome.scripting.executeScript`.

## 📋 Backlog / Planned Features

### Limitations to Fix
- [ ] **Destructive Summarization**: Context summarization currently replaces the *entire* history. Needs a strategy to append summary + recent messages.
- [ ] **Tab Isolation**: Chat session is currently global (or loosely tied to window). Need strict per-tab or per-domain session isolation.
- [ ] **Image Support**: Add multimodal input (Screenshots/Images) for Gemini.
- [ ] **Model Parameters**: Expose Temperature and Top-K in Options UI.
- [ ] **History Export**: JSON/Markdown export of chat logs.
- [ ] **DeepSeek Reasoning**: Parse `<think>` tags from DeepSeek R1 to visually separate reasoning steps from the final answer.

### Technical Debt
- [x] **Regression Testing**: Integrate `repro_vault_flow.js` into the main `npm test` suite.
