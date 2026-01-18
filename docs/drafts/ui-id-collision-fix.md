# Draft: Fix Chat UI ID Collision

## Problem
In `src/sidepanel.js`, the `addMessage` function generates message IDs using `Date.now()`:
```javascript
function addMessage(role, text, isRaw = false) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.id = 'msg-' + Date.now(); // <-- RISK OF COLLISION
  // ...
}
```
When a User message is added and an AI message (placeholder) follows immediately, they may receive the same ID. `updateMessage` then finds the first element with that ID (the User bubble) and overwrites its content with the AI response.

## Proposed Strategy
Replace `Date.now()` with a more robust unique identifier.

### Option A: Timestamp + Metadata
```javascript
div.id = `msg-${Date.now()}-${role}-${Math.floor(Math.random() * 1000)}`;
```

### Option B: Global Counter (Cleaner)
Add a counter to the global state:
```javascript
const state = {
  // ...
  msgCounter: 0
};

function addMessage(role, text, isRaw = false) {
  state.msgCounter++;
  const div.id = `msg-${Date.now()}-${state.msgCounter}`;
  // ...
}
```

## Implementation Note
- Apply changes to `addMessage` in `src/sidepanel.js`.
- No changes needed to `updateMessage` or `scrollToBottom`.
- Ensure `loadSettings` (rendering history) also uses unique IDs if it calls `addMessage`.
