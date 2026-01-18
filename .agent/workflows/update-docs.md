---
description: Update documentation (Changelog, Roadmap, Context) to reflect recent changes.
---

# Workflow: Update Documentation

Trigger this workflow after completing a significant task or task phase.

1.  **Read Active Context**:
    -   `view_file docs/context.md`
    -   `view_file docs/changelog.md`

2.  **Update `docs/changelog.md`**:
    -   Add a new entry under the "Unreleased" or current date section.
    -   Format: `- **[Type]** Description of change (Files affected)`.
    -   Example: `- **[Refactor]** Moved logic files to `src/lib/` (logic.js).`

3.  **Update `docs/roadmap.md`**:
    -   Mark completed items with `[x]`.
    -   Add new discovered requirements.

4.  **Update `docs/context.md`**:
    -   Update the "Current Focus" section to reflect the *next* logical step.
    -   Clear out "Recent Changes" if they are now fully documented in the Changelog.

5.  **Verify Consistency**:
    -   Ensure `docs/status.md` (Feature Matrix) matches the code reality.
