/**
 * Finds every exact occurrence of a term in a body of text (case-insensitive,
 * whole-word match) and returns the surrounding context window for each hit.
 *
 * @param {string} text - full document text
 * @param {string} term - exact word/phrase to search for
 * @param {number} windowChars - how many characters of context on each side
 */
function findTermOccurrences(text, term, windowChars = 400) {
  if (!term || !term.trim()) return [];

  // Escape regex special characters in the user-supplied term
  const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // \b word boundaries give an "exact word" match rather than a substring match
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");

  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const start = Math.max(0, match.index - windowChars);
    const end = Math.min(text.length, match.index + term.length + windowChars);

    matches.push({
      matchIndex: match.index,
      context:
        (start > 0 ? "..." : "") +
        text.slice(start, end) +
        (end < text.length ? "..." : ""),
    });

    // Prevent infinite loops on zero-length matches
    if (match.index === regex.lastIndex) regex.lastIndex++;
  }

  return matches;
}

module.exports = { findTermOccurrences };
