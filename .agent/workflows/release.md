---
description: Create and publish a GitHub ZIP release for AI Sidekick
---

# GitHub Release Workflow

This workflow guides you through creating a production-ready ZIP release for distribution via GitHub Releases.

---

## Prerequisites

Before starting, ensure:
- [ ] All changes are committed to `main` branch
- [ ] Working directory is clean (`git status`)
- [ ] Version numbers are synced across files

---

## Step 1: Pre-Release Quality Checks

Run automated checks:

```bash
# Path audit
node tests/audit_paths.js

# Test suite
npm test

# Linting
npm run lint
```

**Expected Result**: All checks pass with no errors.

---

## Step 2: Version Sync Verification

Manually verify version consistency:

```bash
# Check manifest.json
grep '"version"' manifest.json

# Check package.json
grep '"version"' package.json

# Check README badge
grep 'status-v' README.md
```

**Expected Result**: All show same version (e.g., `1.0.2`).

If versions don't match, update them now following the [versioning rules](.agent/rules/02-versioning.md).

---

## Step 3: Update Changelog

Edit `docs/changelog.md`:

```markdown
## [1.0.2] - 2026-01-18

### Added
- [Feature description]

### Fixed
- [Bug fix description]
```

Commit changelog:
```bash
git add docs/changelog.md
git commit -m "docs: update changelog for v1.0.2"
git push origin main
```

---

## Step 4: Manual Smoke Test

Load extension in **clean Chrome profile**:

1. Go to `chrome://extensions`
2. Enable Developer Mode
3. Load Unpacked → Select project folder
4. Test:
   - [ ] Chat with Gemini (with API key)
   - [ ] Context menu → Explain This
   - [ ] Vault lock/unlock
   - [ ] Arc Browser toolbar icon (if on Arc)

**Expected Result**: No console errors, all features work.

---

## Step 5: Build Release ZIP

// turbo
Run the automated build script:

```bash
./scripts/build-release.sh
```

**Output**: `ai-sidekick-v1.0.2.zip` created in project root.

---

## Step 6: Verify ZIP Contents

Extract and inspect:

```bash
unzip -l ai-sidekick-v1.0.2.zip
```

**Expected Contents**:
- `manifest.json`
- `README.md`
- `LICENSE`
- `src/` folder (with all runtime files)

**Should NOT contain**:
- `node_modules/`
- `tests/`
- `docs/` (except top-level README)
- `.git/`

---

## Step 7: Test Release ZIP

Load the ZIP in a **fresh Chrome profile**:

1. Extract `ai-sidekick-v1.0.2.zip` to a temp folder
2. Load unpacked → Select extracted folder
3. Quick smoke test (basic chat)

**Expected Result**: Extension loads and works.

---

## Step 8: Create Git Tag

```bash
VERSION="1.0.2"
git tag -a v${VERSION} -m "Release v${VERSION}: [Brief description]"
git push origin v${VERSION}
```

---

## Step 9: Create GitHub Release

1. Go to: `https://github.com/miziodel/ai-sidekick/releases/new`
2. Select tag: `v1.0.2`
3. Release title: `AI Sidekick v1.0.2 - [Short tagline]`
4. Copy release notes from [implementation plan](docs/templates/release-notes-template.md)
5. Upload `ai-sidekick-v1.0.2.zip` as asset
6. Check **"This is a pre-release"** if still in beta
7. Click **"Publish release"**

---

## Step 10: Post-Release Verification

1. Download ZIP from GitHub Release page
2. Extract and load in Chrome
3. Verify extension works

---

## Step 11: Announce (Optional)

Share on relevant platforms:
- Reddit: `/r/chrome_extensions`, `/r/ArcBrowser`
- Product Hunt
- Hacker News: "Show HN"

---

## Troubleshooting

**Q: Build script fails with "version not found"**  
A: Check `manifest.json` has valid `"version": "X.Y.Z"` line

**Q: ZIP contains `node_modules/`**  
A: Script excludes this automatically. Check build script output.

**Q: Extension won't load from ZIP**  
A: Verify `manifest.json` is in root of extracted folder, not nested.

---

## Next Release

For subsequent releases, increment version following [Semantic Versioning](https://semver.org/):
- **Patch** (1.0.X): Bug fixes
- **Minor** (1.X.0): New features (backward compatible)
- **Major** (X.0.0): Breaking changes