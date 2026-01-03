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
    id: "open-panel",
    title: "Open Side Panel",
    contexts: ["all"]
  });
});

importScripts('lib/action-manager.js');

// Helper to open the extension logic
async function openExtension(tab) {
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

  // 1. Try Side Panel
  try {
    if (!windowId) throw new Error("No valid window ID found for Side Panel");
    // Attempt to open side panel
    await chrome.sidePanel.open({ windowId: windowId });
  } catch (err) {
    console.warn("Side Panel open failed, falling back to Popup:", err);
    // 2. Fallback: Open as a detached popup window
    chrome.windows.create({
      url: "sidepanel.html",
      type: "popup",
      width: 400,
      height: 600
    });
  }
}

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // 1. Always save pending action (Unified path)
  // This ensures 'tab.id' is preserved and timing is consistent.
  await ActionManager.savePendingAction({
    action: "contextMenu",
    menuItemId: info.menuItemId,
    selectionText: info.selectionText,
    pageUrl: info.pageUrl,
    tabId: tab ? tab.id : null
  });

  // 2. Open UI
  await openExtension(tab);
});

// Explicitly handle icon click (Disabling automatic setPanelBehavior to ensure fallback works)
chrome.action.onClicked.addListener((tab) => {
  openExtension(tab);
});
