const axios = require("axios");

/**
 * Fetches research results from Google using the Custom Search JSON API.
 * @param {string} query - the topic / research query
 * @param {number} num - number of results to fetch (max 10 per request)
 */
async function googleSearch(query, num = 10) {
  const { GOOGLE_API_KEY, GOOGLE_CX } = process.env;

  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    throw new Error(
      "Missing GOOGLE_API_KEY or GOOGLE_CX. Set them in your .env file."
    );
  }

  const url = "https://www.googleapis.com/customsearch/v1";
  const response = await axios.get(url, {
    params: {
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CX,
      q: query,
      num: Math.min(num, 10),
    },
  });

  const items = response.data.items || [];

  return items.map((item) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    source: item.displayLink,
  }));
}

module.exports = { googleSearch };
