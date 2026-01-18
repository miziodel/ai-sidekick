# Active Context

## Current Focus
**Antigravity Migration**: We are restructuring the repository to align with the "Quality First" methodology and professional "Arc Expert" identity.

### Current Goals
1.  Establish `.agent/rules` (Done).
2.  Migrate Documentation to `docs/` (Done).
3.  Implement robust Arc Browser Single-Instance logic (Done).
4.  Standardize Source Code to `src/` (In Progress).

## Recent Changes
- Fixed Arc Toolbar Icon dimensions via `styles.css` CSS forcing (400x600px).
- Implemented `chrome.storage.session` for resilient window tracking in Arc.
- Added UI Context Bar and "Open Sidekick Here" menu action.
- Integrated ESLint into the build pipeline.

## Active Questions
- Will the `src/` move break `manifest.json` paths? (Mitigation: `tests/audit_paths.js` planned).
