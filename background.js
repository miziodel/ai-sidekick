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

// Helper to open the extension logic
async function openExtension(tab) {
  // 1. Try Side Panel
  try {
    // Attempt to open side panel
    await chrome.sidePanel.open({ windowId: tab.windowId });
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
  if (info.menuItemId === "open-panel") {
    openExtension(tab);
  }

  // For analysis actions, also ensure panel is open
  openExtension(tab);

  setTimeout(() => {
    chrome.runtime.sendMessage({
      action: "contextMenuData",
      menuItemId: info.menuItemId,
      selectionText: info.selectionText,
      pageUrl: info.pageUrl
    }).catch(e => console.log("Msg error:", e));
  }, 500);
});

// Explicitly handle icon click (Disabling automatic setPanelBehavior to ensure fallback works)
chrome.action.onClicked.addListener((tab) => {
  openExtension(tab);
});
