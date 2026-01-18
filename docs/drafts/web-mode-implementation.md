# Web Mode Implementation - Technical Design

> **Status**: 🚧 Draft - Not Yet Implemented  
> **Priority**: Medium  
> **Related**: [Roadmap](../roadmap.md) - "Web Mode Fallback (BROKEN)"

## Problem Statement

The current "Gemini Web (Free)" option ([`sidepanel.js:746`](file:///Users/NOBKP/ai-sidekick/src/sidepanel.js#L746)) simply opens `gemini.google.com` in a new tab, providing no integration with the extension. Users without API keys have no fallback for in-panel chat.

## Goals

1. **Zero-Friction Fallback**: Users without API keys can still use AI assistants directly from the side panel.
2. **Multi-Provider Support**: Extend to Gemini, DeepSeek, ChatGPT, and Claude.
3. **Seamless UX**: Minimize context-switching and manual copy-paste.

---

## Technical Approaches

### Option A: Iframe Embedding ⚠️ Limited Viability

**Concept**: Embed web chat interfaces directly in the side panel using `<iframe>`.

**Pros**:
- User stays in side panel.
- No tab switching.

**Cons**:
- **Security Restrictions**: Most AI providers block `<iframe>` embedding via `X-Frame-Options: DENY` or CSP headers.
  - ✅ **Gemini**: May work (needs testing).
  - ❌ **ChatGPT**: Blocked.
  - ❌ **Claude**: Blocked.
  - ⚠️ **DeepSeek**: Unknown (needs testing).

**Verdict**: Only viable for Gemini. Not a universal solution.

---

### Option B: Managed Tab with Context Injection

**Concept**: Open web interface in a new tab, but inject user's prompt automatically.

**Implementation**:
1. User selects "Gemini Web (Free)" and types a message.
2. Extension opens `https://gemini.google.com/app` in a new tab.
3. Use `chrome.scripting.executeScript` to:
   - Wait for page load.
   - Find chat input field.
   - Insert user's prompt.
   - Optionally trigger "Send" button.

**Pros**:
- Works with all providers (no iframe restrictions).
- User sees response in native interface.

**Cons**:
- **Login Required**: User must be logged into each service.
- **DOM Fragility**: Injection relies on stable DOM selectors (e.g., `textarea[aria-label="Chat input"]`). Providers can break this at any time.
- **Privacy Concerns**: Users may not want extension manipulating web pages.

**Verdict**: Technically feasible but fragile and requires maintenance.

---

### Option C: Hybrid Approach (Recommended)

**Concept**: Show an "onboarding dialog" when user selects Web Mode without API key.

**UX Flow**:
```
User selects "Gemini Web (Free)" → No API key detected

┌─────────────────────────────────────────────┐
│ ⚠️ No API Key Found                         │
│                                             │
│ To use AI Sidekick, you need:              │
│                                             │
│ [Option 1] Enter your API keys (Recommended)│
│   → Private, encrypted, full control       │
│   → Get keys: [Gemini Key] [DeepSeek Key]  │
│                                             │
│ [Option 2] Use free web version            │
│   → Opens gemini.google.com in new tab     │
│   → Requires Google account login          │
│                                             │
│ [ Set Up API Keys ]  [ Continue to Web ]   │
└─────────────────────────────────────────────┘
```

If user clicks **"Continue to Web"**:
- Open `gemini.google.com/app` in new tab.
- Copy user's prompt to clipboard automatically.
- Show toast: "Prompt copied! Paste it in Gemini to continue."

**Pros**:
- ✅ **Clear UX**: Sets expectations (no magic integration).
- ✅ **No Fragility**: No reliance on DOM selectors.
- ✅ **Privacy-Friendly**: Extension doesn't manipulate web pages.
- ✅ **Extensible**: Easy to add ChatGPT, Claude, DeepSeek with same pattern.

**Cons**:
- User must manually paste (1 extra step).

**Verdict**: Best balance of simplicity, reliability, and user experience.

---

## Recommended Implementation (Phase 1)

### 1. Update Model Selection Logic

**File**: `src/sidepanel.js`

**Current Code** (Line 746):
```javascript
if (model === 'gemini-web') {
  window.open('https://gemini.google.com/app', '_blank');
  return;
}
```

**New Code**:
```javascript
if (model === 'gemini-web') {
  showWebModeDialog('gemini', userMessage);
  return;
}
```

### 2. Create Web Mode Dialog

**File**: `src/lib/web-mode-dialog.js` (new)

```javascript
function showWebModeDialog(provider, userPrompt) {
  const providerConfig = {
    gemini: {
      name: 'Gemini',
      url: 'https://gemini.google.com/app',
      keyUrl: 'https://aistudio.google.com/app/apikey'
    },
    deepseek: {
      name: 'DeepSeek',
      url: 'https://chat.deepseek.com',
      keyUrl: 'https://platform.deepseek.com/api_keys'
    },
    chatgpt: {
      name: 'ChatGPT',
      url: 'https://chatgpt.com',
      keyUrl: null // No API key option
    },
    claude: {
      name: 'Claude',
      url: 'https://claude.ai',
      keyUrl: 'https://console.anthropic.com/'
    }
  };

  const config = providerConfig[provider];
  
  // Show dialog with options:
  // 1. "Set Up API Keys" → chrome.runtime.openOptionsPage()
  // 2. "Continue to Web" → copyToClipboard(userPrompt) + open(config.url)
}
```

### 3. Add Clipboard Permission

**File**: `manifest.json`

```json
"permissions": [
  "clipboardWrite",  // Already exists ✅
  // ...
]
```

---

## Future Enhancements (Phase 2+)

### Multi-Provider Dropdown

Instead of just "🌐 Gemini Web (Free)", show:
```html
<optgroup label="🌐 Web Mode (Free, No Keys)">
  <option value="gemini-web">Gemini (Google Account)</option>
  <option value="deepseek-web">DeepSeek (Free Account)</option>
  <option value="chatgpt-web">ChatGPT (OpenAI Account)</option>
  <option value="claude-web">Claude (Anthropic Account)</option>
</optgroup>
```

### Browser Action Integration

Add a "Quick Switch" button in the side panel:
```
[API Mode: Gemini Flash ▼]
  → Gemini 2.5 Pro (API)
  → DeepSeek R1 (API)
  ───────────────
  → Gemini Web (Free) 🌐
  → ChatGPT Web (Free) 🌐
```

---

## Testing Checklist

- [ ] Verify dialog appears when Web Mode selected without API key.
- [ ] Confirm clipboard copy works (test on Mac/Windows/Linux).
- [ ] Ensure correct URL opens for each provider.
- [ ] Test "Set Up API Keys" button redirects to Options.
- [ ] Validate toast notification shows after clipboard copy.

---

## Open Questions

1. **Should we support iframe for Gemini if it works?**  
   → Decision: Test first. If unreliable, use unified "open tab + copy" approach.

2. **Should we inject prompt automatically using content scripts?**  
   → Decision: No. Too fragile. Manual paste is acceptable trade-off.

3. **Should we track which web interface the user prefers?**  
   → Decision: Phase 2. Store in `chrome.storage.local`.

---

## References

- Current Implementation: [`src/sidepanel.js:746`](file:///Users/NOBKP/ai-sidekick/src/sidepanel.js#L746)
- Roadmap Task: [`docs/roadmap.md`](file:///Users/NOBKP/ai-sidekick/docs/roadmap.md)
