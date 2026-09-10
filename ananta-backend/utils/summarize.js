const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Summarizes a chunk of text using Claude.
 * @param {string} text - the text to summarize
 * @param {string} [focusTerm] - optional term the user searched for, so the
 *   summary can focus on what that term means / how it's used in context
 */
async function summarizeText(text, focusTerm = null) {
  const instruction = focusTerm
    ? `The user searched for the term "${focusTerm}" inside a research document. ` +
      `Below is the passage surrounding where that term appears. ` +
      `In 3-5 sentences, explain what this passage says, focusing on how "${focusTerm}" ` +
      `is discussed here, so the user can understand it without reading the full document.`
    : `Summarize the following research text in 4-6 sentences, covering the main ` +
      `findings, methods, and conclusions in plain language.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `${instruction}\n\nText:\n"""\n${text}\n"""`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text.trim() : "";
}

module.exports = { summarizeText };
