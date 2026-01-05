/**
 * BACKGROUND SCRIPT
 * Handles Context Menus and Side Panel opening.
 */

// Setup Context Menus on Install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ai-sidekick-root",
    title: "AI Sidekick",
    contexts: ["selection", "page"]
  });

  chrome.contextMenus.create({
    parentId: "ai-sidekick-root",
    id: "open-sidekick",
    title: "Open Sidekick Here",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    parentId: "ai-sidekick-root",
    id: "summarize-sel",
    title: "Summarize Selection",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    parentId: "ai-sidekick-root",
    id: "explain-sel",
    title: "Explain This",
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    parentId: "ai-sidekick-root",
    id: "improve-sel",
    title: "Improve Writing",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    parentId: "ai-sidekick-root",
    id: "summarize-page",
    title: "Summarize Page",
    contexts: ["page"]
  });
  chrome.contextMenus.create({
    parentId: "ai-sidekick-root",
    id: "separator-1",
    type: "separator",
    contexts: ["all"]
  });
});

importScripts('lib/action-manager.js');

// Track the existing extension state (Single Instance)
// We use chrome.storage.session so this survives Service Worker restarts.
let inMemoryState = null;

async function getSidekickState() {
  // Check memory first
  if (inMemoryState) return inMemoryState;
  
  // Check session storage
  try {
    const data = await chrome.storage.session.get(['sidekickState']);
    if (data.sidekickState) {
      inMemoryState = data.sidekickState;
      return inMemoryState;
    }
  } catch (e) {
    console.warn("Failed to read session storage", e);
  }
  return null;
}

// Save both Window ID and Tab ID (for resilience)
async function setSidekickState(windowId, tabId) {
  inMemoryState = { windowId, tabId };
  try {
    if (windowId) {
       await chrome.storage.session.set({ sidekickState: { windowId, tabId } });
    } else {
       await chrome.storage.session.remove('sidekickState');
    }
  } catch(e) { console.error("Failed to save Sidekick State", e); }
}

// Cleanup OR Migration when window is closed
// Arc specific: Promoting a Little Arc window to a Tab DESTROYS the window but KEEPS the tab alive.
// Cleanup OR Migration when window is closed
// Arc specific: Promoting a Little Arc window to a Tab DESTROYS the window but KEEPS the tab alive.
chrome.windows.onRemoved.addListener(async (windowId) => {
  const currentState = await getSidekickState();
  if (currentState && currentState.windowId === windowId) {
    // Check if the tab survived (Migration)
    if (currentState.tabId) {
       try {
         const tab = await chrome.tabs.get(currentState.tabId);
         if (tab && tab.id === currentState.tabId) {
            // Update state to point to the new window
            setSidekickState(tab.windowId, tab.id);
            return;
         }
       } catch(e) {
         // Tab likely died with window, proceed to clear
       }
    }
    
    setSidekickState(null, null);
  }
});

// Helper to open the extension logic
async function openExtension(tab) {
  const state = await getSidekickState();
  const trackedId = state ? state.windowId : null;
  
  let targetTab = null;

  // 1. Try to find an existing extension instance (Tab or Window)
  
  if (trackedId) {
    try {
       const win = await chrome.windows.get(trackedId, { populate: true });
       if (win.tabs) {
         const trackedTabId = state ? state.tabId : null;
         
         // 1. GOLDEN PATH: We know the exact Tab ID we want.
         if (trackedTabId) {
             targetTab = win.tabs.find(t => t.id === trackedTabId);
         }

         // 2. URL / Title Match (if Tab ID match failed or wasn't tracked)
         if (!targetTab) {
             targetTab = win.tabs.find(t => 
                 (t.url && t.url.includes("sidepanel.html")) || 
                 t.title === "AI Sidekick"
             );
         }
         
         // 3. Fallback: Adopting ACTIVE tab in tracked window.
         if (!targetTab) {
             targetTab = win.tabs.find(t => t.active) || win.tabs[0];
         }
       }
    } catch(e) {
       // We don't clear state here immediately, just let it fall through.
    }
  }

  // If we haven't pinpointed a tab yet, do a global search
  if (!targetTab) {
     const allTabs = await chrome.tabs.query({});
     
     // Match by URL or Title
     targetTab = allTabs.find(t => 
        (t.url && t.url.includes("sidepanel.html")) ||
        t.title === "AI Sidekick"
     );
     
     if (targetTab) {
       setSidekickState(targetTab.windowId, targetTab.id);
     }
  }

  // 2. DISPATCH or CREATE
  let focused = false;

  if (targetTab) {
     // Update State to ensure we have the Tab ID tracked (Migration Fix)
     setSidekickState(targetTab.windowId, targetTab.id);
     
     // A. EXISTING found -> Liveness Check & Focus
     try {
       // 1. LIVENESS CHECK (Ping)
       await chrome.tabs.sendMessage(targetTab.id, { type: 'PING' });
       
       // 2. If Alive, Focus it
       await chrome.windows.update(targetTab.windowId, { focused: true });
       await chrome.tabs.update(targetTab.id, { active: true });
       
       // 3. Send Pending Action (if any)
       const pending = await ActionManager.getPendingAction(false); 
       if (pending) {
          chrome.tabs.sendMessage(targetTab.id, { type: 'EXECUTE_ACTION', data: pending })
            .then(() => {
                ActionManager.getPendingAction(true); 
            })
            .catch(err => {
                console.warn("Action send failed despite Ping success?", err);
            });
       }
       focused = true; 
     } catch (e) {
       console.error("Tab DEAD/ZOMBIE or Focus Failed. Fallback to create.", e);
       setSidekickState(null, null); 
     }
  }

  // B. Fallback: Create New Popup if no tab was found OR if focus failed
  if (!focused) {
    try {
        const newWin = await chrome.windows.create({
        url: "sidepanel.html",
        type: "popup",
        width: 400,
        height: 600
      });
      if (newWin) {
        // Track both Window AND Tab ID (if available)
        const newTabId = (newWin.tabs && newWin.tabs[0]) ? newWin.tabs[0].id : null;
        setSidekickState(newWin.id, newTabId);
      }
    } catch (createErr) {
      console.error("Failed to create popup window:", createErr);
    }
  }
}

// Handle Extension Icon Click (Action) -> OPEN OPTIONS
chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Determine action type
  let actionType = "contextMenu";
  if (info.menuItemId === "open-sidekick") {
     actionType = "openOnly";
  }

  // 1. Always save pending action (Unified path)
  // This ensures 'tab.id' is preserved and timing is consistent.
  await ActionManager.savePendingAction({
    action: actionType,
    menuItemId: info.menuItemId,
    selectionText: info.selectionText,
    pageUrl: info.pageUrl,
    tabId: tab ? tab.id : null
  });

  // 2. Open UI (with single instance check)
  await openExtension(tab);
});
