/**
 * ACTION MANAGER
 * Handles persistent pending actions (like Context Menu clicks) 
 * to ensure they are not lost if the Side Panel is closed or loading.
 */

class ActionManager {
  /**
   * Saves an action to be processed later.
   * @param {object} actionData - { action, text, context, tabId, ... }
   */
  static async savePendingAction(actionData) {
    // We use a specific key "pendingAction"
    // In a real app we might want a queue, but for now single action is enough (last one wins)
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ pendingAction: actionData });
      } else {
        console.warn("ActionManager: chrome.storage.local not available");
      }
    } catch (e) {
      console.error("ActionManager save failed:", e);
    }
  }

  /**
   * Retrieves the pending action and optionally clears it.
   * @param {boolean} clearAfterRead - Whether to delete the action after reading (default true)
   * @returns {object|null} - The action data or null
   */
  static async getPendingAction(clearAfterRead = true) {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return null;
      }

      const data = await chrome.storage.local.get(['pendingAction']);
      const action = data.pendingAction || null;

      if (action && clearAfterRead) {
        await chrome.storage.local.remove('pendingAction');
      }
      
      return action;
    } catch (e) {
      console.error("ActionManager get failed:", e);
      return null;
    }
  }
}

// Export for module systems (Node tests) vs Browser global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ActionManager;
} else {
  // Browser (window or service worker)
  (typeof self !== 'undefined' ? self : window).ActionManager = ActionManager;
}
