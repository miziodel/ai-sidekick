---
trigger: always_on
---

# Technical Constraints & Standards

## 1. Technology Stack
- **Framework**: **Vanilla JavaScript** (ES6+). NO React, Vue, or Svelte.
- **Build System**: **NONE**. No Webpack, Vite, or Parcel. The code you write runs directly in the browser.
- **Modules**: Use ES Modules (`<script type="module">`) or properly scoped IIFEs for libraries.
- **CSS**: Vanilla CSS. Flexbox/Grid. No Tailwind unless manually vendored (avoid if possible).

## 2. Testing & Verification
- **Test Runner**: Node.js (via `tests/run_tests.js`).
- **TDD**: strict **Test Driven Development**.
    - Write the test case in `tests/run_tests.js` (or a new file) *before* implementing complex logic.
    - Tests must be pure logic (decoupled from DOM/Chrome APIs) where possible.
- **Static Analysis**: 
    - Use `tests/audit_paths.js` to verify file integrity before any structural change.
    - Run `npm run lint` if available.

## 3. Documentation Strategy
- **Source of Truth**: The `docs/` directory is the single source of truth.
- **Structure**:
    - `docs/context.md`: What are we doing *right now*?
    - `docs/status.md`: High-level feature completion.
    - `docs/architecture.md`: Why the system works this way.
    - `docs/changelog.md`: What happened in the past.
    - `docs/roadmap.md`: What will happen in the future.
    - `docs/knowledge-base.md`: Hard-learned lessons (Arc quirks).

## 4. File Structure (Future State)
- **Source**: All extension code lives in `src/`.
- **Root**: Only config (`package.json`, `manifest.json` - *initially*), docs, and tests remain in root. (Note: Plan v3 moves `manifest.json` to inside `src` or root depending on build, but for "No Build", `manifest.json` generally stays with source or we adjust loading path. Follow Implementation Plan).

## 5. Third-Party Dependencies
- **Vendoring**: ALL dependencies must be downloaded and committed to `src/lib/`.
- **Licensing**: You must verify the license of any code you copy/paste or download.