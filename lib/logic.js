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
 * Formats the message context based on active page or selection using a template.
 * @param {string} template - The prompt template with placeholders (e.g., {{selection}})
 * @param {Object} contextData - Data for substitution ({ selection, content, url, title })
 * @returns {string} - The constructed prompt
 */
function formatPrompt(template, contextData = {}) {
    const { selection, content, url, title } = contextData;
    let finalPrompt = template || "";

    // 1. Substitute {{selection}}
    if (finalPrompt.includes('{{selection}}')) {
        const safeSelection = selection ? selection.trim() : "";
        finalPrompt = finalPrompt.replace(/{{selection}}/g, safeSelection);
    }

    // 2. Substitute {{content}} (Page Text) - Truncated
    if (finalPrompt.includes('{{content}}')) {
        const safeContent = content ? truncateText(content) : "";
        finalPrompt = finalPrompt.replace(/{{content}}/g, safeContent);
    }

    // 3. Substitute {{url}}
    if (finalPrompt.includes('{{url}}')) {
        const safeUrl = url || "Unknown URL";
        finalPrompt = finalPrompt.replace(/{{url}}/g, safeUrl);
    }

    // 4. Substitute {{title}}
    if (finalPrompt.includes('{{title}}')) {
        const safeTitle = title || "";
        finalPrompt = finalPrompt.replace(/{{title}}/g, safeTitle);
    }
    
    // Cleanup: If a user uses a variable but it's empty, it might leave weird spacing.
    // However, simplicity first.
    
    return finalPrompt;
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

/**
 * Prunes the history to keep only the last N messages.
 * @param {Array} history - Array of { role, text }
 * @param {number} limit - Number of messages to keep
 * @returns {Array} - The pruned history
 */
function pruneHistory(history, limit = 10) {
    if (!history || !Array.isArray(history)) return [];
    if (history.length <= limit) return history;
    return history.slice(history.length - limit);
}

/**
 * Formats chat history for Gemini API.
 * Maps 'ai' -> 'model', 'user' -> 'user'.
 * Structure: { role: "user"|"model", parts: [{ text: "..." }] }
 */
function formatHistoryForGemini(history) {
    return history.map(msg => {
        return {
            role: (msg.role === 'user') ? 'user' : 'model',
            parts: [{ text: msg.text }]
        };
    });
}

/**
 * Formats chat history for DeepSeek/OpenAI API.
 * Maps 'ai' -> 'assistant', 'user' -> 'user'.
 * Structure: { role: "user"|"assistant", content: "..." }
 */
function formatHistoryForDeepSeek(history) {
    return history.map(msg => {
        return {
            role: (msg.role === 'user') ? 'user' : 'assistant',
            content: msg.text
        };
    });
}

// Export for module systems (Node tests) vs Browser global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { formatPrompt, prepareSystemInstruction, truncateText, parseMarkdown, pruneHistory, formatHistoryForGemini, formatHistoryForDeepSeek };
} else {
  window.Logic = { formatPrompt, prepareSystemInstruction, truncateText, parseMarkdown, pruneHistory, formatHistoryForGemini, formatHistoryForDeepSeek };
}
