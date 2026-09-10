const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Downloads a web page and extracts readable text from it,
 * stripping scripts, styles, nav, ads, etc.
 * @param {string} url
 * @returns {Promise<{title: string, text: string}>}
 */
async function extractTextFromUrl(url) {
  const { data: html } = await axios.get(url, {
    headers: {
      // Some research sites block requests with no user agent
      "User-Agent":
        "Mozilla/5.0 (compatible; AnantaResearchBot/1.0; +https://example.com/bot)",
    },
    timeout: 15000,
  });

  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, nav, footer, header, noscript, iframe, .ad, .advertisement").remove();

  const title = $("title").first().text().trim();

  // Grab text from common content containers first; fall back to <body>
  let text = "";
  const contentSelectors = ["article", "main", "#content", ".content", "body"];
  for (const selector of contentSelectors) {
    const found = $(selector).text();
    if (found && found.trim().length > 200) {
      text = found;
      break;
    }
  }
  if (!text) text = $("body").text();

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();

  return { title, text };
}

module.exports = { extractTextFromUrl };
