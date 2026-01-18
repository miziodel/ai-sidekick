---
trigger: always_on
---

# Versioning & Release Protocol

## 1. The "Version Sync" Rule
This project (AI Sidekick) maintains strict version consistency across multiple files.
When bumping the version (e.g., `1.0.1` -> `1.0.2`), you **MUST** update **ALL** of the following locations simultaneously:

1.  **`package.json`**: `"version": "X.Y.Z"`
2.  **`manifest.json`**: `"version": "X.Y.Z"`
3.  **`README.md`**: Status Badge (if applicable, e.g., `status-v1.0.1-blue`) and release notes references.
4.  **`docs/changelog.md`**: Add a new `## [X.Y.Z] - YYYY-MM-DD` section.

## 2. Changelog Standards
- Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.
- Sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- Entries should be concise but descriptive.

## 3. Release Process
1.  **Develop**: Make changes, run tests (`npm test`).
2.  **Audit**: Ensure no new warnings introduced.
3.  **Bump**: Apply version updates to all 4 files listed above.
4.  **Commit**: Use a standard message like `chore: bump version to X.Y.Z`.
