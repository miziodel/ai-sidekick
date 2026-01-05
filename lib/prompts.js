/**
 * Copyright (c) 2026 Maurizio Delmonte
 * Licensed under the MIT License. See LICENSE file in the project root for full license information.
 */

/**
 * PROMPT REGISTRY
 * Defines all available actions, their context, and the prompt templates.
 */

const PROMPT_REGISTRY = {
  // --- EXISTING / CORE ---
  "explain": {
    title: "Explain This",
    contexts: ["selection"],
    prompt: "Explain the following text in simple, clear terms. If it's a technical concept, provide a real-world analogy. Text: {{selection}}"
  },
  "summarize": {
    title: "Summarize Selection",
    contexts: ["selection"],
    prompt: "Provide a concise summary of the selected text in 2-3 sentences. Capture the main point and any critical details. Text: {{selection}}"
  },
  "summarize_page": {
    title: "Summarize Page",
    contexts: ["page"],
    prompt: "Read the current page content. Provide a high-level executive summary, followed by a list of the main topics covered.\n\nURL: {{url}}\nContent: {{page_content}}"
  },

  // --- NEW USE CASES ---
  "action_items": {
    title: "Find Action Items",
    contexts: ["selection", "page"],
    prompt: "Analyze the text and extract a markdown checklist of actionable tasks or 'todos'. Identify who is responsible for each if mentioned.\n\nURL: {{url}}\nText: {{selection}}"
  },
  "key_takeaways": {
    title: "Key Takeaways",
    contexts: ["selection", "page"],
    prompt: "Read the following content and list the top 3-5 key takeaways as bullet points. Focus on insightful or surprising information.\n\nURL: {{url}}\nContent: {{selection}}"
  },
  "devils_advocate": {
    title: "Devil's Advocate",
    contexts: ["selection"],
    prompt: "Analyze the selected argument. Play 'Devil's Advocate' and provide 3 strong counter-arguments or potential flaws in this reasoning. Text: {{selection}}"
  },
  "pros_cons": {
    title: "Pros & Cons Analysis",
    contexts: ["selection"],
    prompt: "Analyze the subject of the selected text. Create a balanced Markdown table of Pros and Cons. Conclude with a brief verdict or recommendation. Text: {{selection}}"
  },
  "critique": {
    title: "Expert Critique",
    contexts: ["selection"],
    prompt: "Act as a senior editor/expert. Critique the following text. Identify 3 strengths and 3 specific areas for improvement (clarity, tone, logic). Do not rewrite it, just provide the feedback. Text: {{selection}}"
  },
  "extract_data": {
    title: "Extract Structured Data",
    contexts: ["selection"],
    prompt: "Extract the data from the selected text and format it as a clean Markdown Table. Identify the key columns/fields automatically. Text: {{selection}}"
  }
};

/**
 * Helper to get prompt definition by ID
 */
function getPromptById(id) {
  return PROMPT_REGISTRY[id];
}

// Export for module systems (Node tests) vs Browser global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PROMPT_REGISTRY, getPromptById };
} else {
  // Browser (window or service worker)
  const scope = (typeof self !== 'undefined' ? self : window);
  scope.PROMPT_REGISTRY = PROMPT_REGISTRY;
  scope.getPromptById = getPromptById;
}
