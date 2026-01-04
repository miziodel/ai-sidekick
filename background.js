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
    contexts: ["all"]
  });
});

importScripts('lib/action-manager.js');

// Track the existing extension window ID (Single Instance)
// We use chrome.storage.session so this survives Service Worker restarts.
let inMemoryWinId = null;

async function getSidekickWindowId() {
  // Check memory first
  if (inMemoryWinId) return inMemoryWinId;
  
  // Check session storage
  try {
    const data = await chrome.storage.session.get(['sidekickWindowId']);
    if (data.sidekickWindowId) {
      inMemoryWinId = data.sidekickWindowId;
      return inMemoryWinId;
    }
  } catch (e) {
    console.warn("Failed to read session storage", e);
  }
  return null;
}

async function setSidekickWindowId(id) {
  inMemoryWinId = id;
  try {
    if (id) {
       await chrome.storage.session.set({ sidekickWindowId: id });
    } else {
       await chrome.storage.session.remove('sidekickWindowId');
    }
  } catch(e) { console.error("Failed to save Window ID", e); }
}

// Cleanup when window is closed
chrome.windows.onRemoved.addListener(async (windowId) => {
  const currentId = await getSidekickWindowId();
  if (currentId === windowId) {
    console.log("Sidekick window closed. Clearing ID.");
    setSidekickWindowId(null);
  }
});

// Helper to open the extension logic
async function openExtension(tab) {
  const trackedId = await getSidekickWindowId();

  // 1. Check if we already have a window open and if it's still valid
  if (trackedId) {
    try {
      const win = await chrome.windows.get(trackedId);
      if (win) {
        // It exists, just focus it
        await chrome.windows.update(trackedId, { focused: true });
        return; // Done!
      }
    } catch (e) {
      // Window was likely closed by user, reset tracking
      // (This usually catches cases where onRemoved didn't fire or we missed it)
      console.log("Tracked window not found, resetting.");
      setSidekickWindowId(null);
    }
  }

  let windowId;
  
  // Try to get Window ID from tab, or fallback to last focused window
  if (tab && tab.windowId) {
    windowId = tab.windowId;
  } else {
    try {
      const win = await chrome.windows.getLastFocused();
      if (win) windowId = win.id;
    } catch (e) { console.warn("Could not get last focused window", e); }
  }

  // 2. Try Side Panel (Chrome specific, often fails in Arc)
  try {
    // Only attempt sidePanel if we are in a context where it makes sense (standard Chrome)
    // and NOT if we are forcing the single-instance popup flow.
    // However, since we want to support both:
    if (!windowId) throw new Error("No valid window ID found for Side Panel");
    
    // Attempt to open side panel
    await chrome.sidePanel.open({ windowId: windowId });
  } catch (err) {
    console.warn("Side Panel open failed, falling back to Popup:", err);
    
    // 3. Fallback: Search for existing Tab or Popup (Arc "Little Arc" -> Tab promotion issue)
    const existingTabs = await chrome.tabs.query({ url: chrome.runtime.getURL("sidepanel.html") });
    if (existingTabs && existingTabs.length > 0) {
      // Found an existing tab/window! Adopt it.
      const tab = existingTabs[0];
      await chrome.windows.update(tab.windowId, { focused: true });
      await chrome.tabs.update(tab.id, { active: true }); // Ensure tab is active in that window
      setSidekickWindowId(tab.windowId); // Self-heal tracking
    } else {
      // 4. Create new Popup
      try {
         const newWin = await chrome.windows.create({
          url: "sidepanel.html",
          type: "popup",
          width: 400,
          height: 600
        });
        // Track this new window
        if (newWin) {
          setSidekickWindowId(newWin.id);
        }
      } catch (createErr) {
        console.error("Failed to create popup window:", createErr);
      }
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
