/**
 * Ananta Quantum Studio - Real Gemini Embeddings Client
 *
 * Thin wrapper around Google's text-embedding-004 endpoint. Used both to
 * build the offline knowledge index (buildIndex.js, run once) and at
 * query time to embed the student's actual question (ragRetrieval.js).
 * No embedding is ever fabricated - if there's no GEMINI_API_KEY, callers
 * get a clear error instead of a fake/random vector, since a fake vector
 * would silently corrupt retrieval quality while looking like it works.
 */

const EMBED_MODEL = 'text-embedding-004';
const EMBED_DIM = 768;

async function embedText(text, apiKey) {
  if (!apiKey) throw new Error('GEMINI_API_KEY is required to generate real embeddings');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${apiKey}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini embedding API HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const values = data?.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBED_DIM) {
    throw new Error(`Unexpected embedding response shape (expected ${EMBED_DIM}-dim vector)`);
  }
  return values;
}

/** Embeds many texts sequentially with a small delay, to stay well under free-tier rate limits. */
async function embedBatch(texts, apiKey, { onProgress, delayMs = 250 } = {}) {
  const out = [];
  for (let i = 0; i < texts.length; i++) {
    const vec = await embedText(texts[i], apiKey);
    out.push(vec);
    if (onProgress) onProgress(i + 1, texts.length);
    if (delayMs && i < texts.length - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return out;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = { embedText, embedBatch, cosineSimilarity, EMBED_MODEL, EMBED_DIM };
