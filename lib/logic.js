/**
 * CORE LOGIC
 * Pure functions for Prompt Engineering and Text Processing.
 */

// If marked is not globally available (Node test env), we might need to mock or ignore it
const markedLib = (typeof marked !== 'undefined') ? marked : { parse: (text) => text }; // Partial mock for tests if not loaded

/**
 * Truncates text to a safe character limit to avoid context window overflow.
 * @param {string} text - The input text
 * @param {number} limit - Character limit (default 100,000 ~ 25k tokens)
 * @returns {string} - Truncated text
 */
function truncateText(text, limit = 100000) {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "\n...[TRUNCATED_BY_EXTENSION]";
}

/**
 * Formats the message context based on active page or selection.
 * @param {string} userMessage - The specific query from the user
 * @param {string} pageContent - The content of the page (document.body.innerText)
 * @param {string} selection - Selected text
 * @param {string} url - The URL of the page
 * @returns {string} - The constructed prompt
 */
function formatPrompt(userMessage, pageContent, selection, url) {
    let context = "";

    if (selection) {
        context += `\n\n--- SELECTED TEXT ---\n${selection}\n---------------------`;
    } else if (pageContent) {
        // If content is huge, we truncate
        const truncated = truncateText(pageContent);
        context += `\n\n--- PAGE CONTENT (${url}) ---\n${truncated}\n------------------------`;
    }

    // Combine
    return `${userMessage}${context}`;
}

/**
 * Prepares the final system prompt by combining default behavior with user custom instructions.
 * @param {string} customInstruction - User's custom system prompt from options
 * @returns {string} - The final system instruction
 */
function prepareSystemInstruction(customInstruction) {
    const base = "You are AI Sidekick, a helpful browser assistant. Be concise, accurate, and use Markdown for formatting.";
    if (!customInstruction || customInstruction.trim() === "") {
        return base;
    }
    return `${base}\n\nUSER CUSTOM INSTRUCTION (Override default style): ${customInstruction}`;
}

/**
 * Safe markdown parser
 */
function parseMarkdown(text) {
    // In a real extension, we trust 'marked' which sanitizes by default or we configure it.
    // Here we just wrap it.
    try {
        return markedLib.parse(text);
    } catch (e) {
        return text;
    }
}

// Export for module systems (Node tests) vs Browser global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatPrompt, prepareSystemInstruction, truncateText, parseMarkdown };
} else {
  window.Logic = { formatPrompt, prepareSystemInstruction, truncateText, parseMarkdown };
}
