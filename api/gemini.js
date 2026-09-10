// FILE: /api/gemini.js
// Vercel Serverless Function: Google AI Studio (Gemini 2.5 Flash) Multi-Task Backend
// Handles: voice-parse, circuit-doctor, roadmap, concept-doctor

const _defaultKeyB64 = 'QVEuQWI4Uk42TFozV0wtZ2JnOUh0bldoVzFJNG5qY3JWTkVWMFBReEVHQ2JwYmdvRHdHdmc=';
function getApiKey(req) {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) {
    return process.env.GEMINI_API_KEY.trim();
  }
  if (req && req.headers && req.headers['x-gemini-key'] && req.headers['x-gemini-key'].length > 10) {
    return req.headers['x-gemini-key'].trim();
  }
  try {
    return Buffer.from(_defaultKeyB64, 'base64').toString('utf8');
  } catch (e) {
    return '';
  }
}

async function getParsedBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

async function handler(req, res) {
  // Compatibility helper for native Node.js http.ServerResponse
  if (!res.status) {
    res.status = function(code) {
      res.statusCode = code;
      return res;
    };
  }
  if (!res.json) {
    res.json = function(data) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };
  }

  // CORS & method guard
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Gemini-Key, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = getApiKey(req);
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
  }

  const body = await getParsedBody(req);
  const { task, payload } = body || {};
  if (!task || !payload) {
    return res.status(400).json({ error: 'Missing task or payload' });
  }

  let systemPrompt;
  const responseSchemaNote = 'Return ONLY raw JSON. No markdown fences, no commentary.';

  switch (task) {
    // ------------------------------------------------------------------
    // 1. VOICE / CAMERA COPILOT — generalized circuit intent parser
    // ------------------------------------------------------------------
    case 'voice-parse': {
      const { transcript, currentCircuit } = payload;
      systemPrompt = `You are a quantum circuit intent parser for a browser-based
circuit composer. Given a spoken instruction (already transcribed to text)
and the current circuit state, output ONLY a JSON object matching this
schema:
{
  "num_qubits": <int>,
  "reset_existing": <bool>,
  "operations": [
    { "step": <int|null>, "gate": "<H|X|Y|Z|S|T|CNOT|CZ|SWAP|Toffoli|Rx|Ry|Rz|MEASURE>",
      "targets": [<int>...], "controls": [<int>...], "params": { "theta": <float> } }
  ],
  "confidence": <float 0-1>,
  "clarification_needed": "<string|null>"
}
Support any qubit count and any gate above, including parametrized rotations
with explicit or implied angles ("a quarter turn" -> pi/2 radians). If the
instruction names a known algorithm (Bell pair, GHZ, Grover, etc.), expand it
into the actual explicit gate sequence for that specific case by reasoning
about the algorithm — it must generalize to qubit indices, qubit counts, and
variants the app has never had a preset for. If ambiguous, set
clarification_needed and still return your best-guess plan at low confidence.
Current circuit state: ${JSON.stringify(currentCircuit || {})}
${responseSchemaNote}`;
      return await callGemini(apiKey, systemPrompt, transcript, res);
    }

    // ------------------------------------------------------------------
    // 2. AI CIRCUIT DOCTOR — clinical audit of a transpiled circuit
    // ------------------------------------------------------------------
    case 'circuit-doctor': {
      const { sourceCode, sourceFramework, rawGatesCount, optGatesCount, numQubits } = payload;
      systemPrompt = `You are the Principal Quantum Hardware Architect & Circuit
Compiler Lead at Google Quantum AI and IBM Quantum. Perform an in-depth
clinical audit and hardware noise prognosis for this quantum circuit written
in ${String(sourceFramework || '').toUpperCase()}:
\`\`\`
${sourceCode}
\`\`\`
Diagnostic context:
- Total Raw Gates: ${rawGatesCount}
- Optimized Gates: ${optGatesCount}
- Pruned Redundancies: ${rawGatesCount - optGatesCount} gates
- Active Qubits: ${numQubits}
Return ONLY a valid JSON object matching this schema:
{
  "circuitName": "Descriptive algorithm title",
  "healthAssessment": "2-3 sentences evaluating circuit health, gate bloat, and compilation status.",
  "gatePathology": "Which gates are redundant, unmerged, or causing unnecessary depth.",
  "decoherenceRisks": "Which physical qubits/operations carry highest T1/T2 risk.",
  "qpuRecommendation": "Comparative analysis across IBM Eagle, Google Sycamore, IonQ Forte.",
  "clinicalPrescription": "Concrete next steps (Dynamical Decoupling, ZNE, KAK Cartan synthesis)."
}
${responseSchemaNote}`;
      return await callGemini(apiKey, systemPrompt, '', res);
    }

    // ------------------------------------------------------------------
    // 3. ROADMAP STUDIO — voice-activated curriculum pathway resolver
    // ------------------------------------------------------------------
    case 'roadmap': {
      const { instruction, availableModuleIds } = payload;
      systemPrompt = `You are a quantum curriculum advisor. Given a learner's
spoken/typed request and the list of valid module IDs below, choose the
subset and order of modules that best satisfies the request.
Valid module IDs: ${JSON.stringify(availableModuleIds || [])}
Return ONLY JSON: { "moduleIds": ["id1","id2",...], "displayName": "Descriptive pathway title", "description": "2-sentence overview", "reasoning": "one sentence" }
Only use IDs from the valid list above — never invent new ones.
${responseSchemaNote}`;
      return await callGemini(apiKey, systemPrompt, instruction, res);
    }

    // ------------------------------------------------------------------
    // 4. CONCEPT DOCTOR — grounded conceptual Q&A
    // ------------------------------------------------------------------
    case 'concept-doctor': {
      const { question, groundingEntries } = payload;
      systemPrompt = `You are a quantum physics tutor. Answer the learner's
question using ONLY the grounding material provided below — do not invent
physics facts beyond it. If the material doesn't cover the question, say so
plainly rather than guessing.
Grounding material:
${JSON.stringify(groundingEntries || [])}
Return ONLY JSON: {
  "title": "short title for this explanation",
  "analogy": "a real-world analogy, 2-3 sentences",
  "explanation": "the actual physics explanation grounded in the material above",
  "matched_source": "which grounding entry (if any) this was based on, or null"
}
${responseSchemaNote}`;
      return await callGemini(apiKey, systemPrompt, question, res);
    }

    default:
      return res.status(400).json({ error: `Unknown task: ${task}` });
  }
};

async function callGemini(apiKey, systemPrompt, userText, res) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 22000);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const fullPrompt = userText ? `${systemPrompt}\n\nUser input: "${userText}"` : systemPrompt;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
      })
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: `Gemini HTTP ${response.status}`, detail: errText });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(502).json({ error: 'Empty response from Gemini' });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.status(200).json({ ok: true, result: parsed, source: 'gemini-2.5-flash' });
  } catch (err) {
    return res.status(502).json({ error: err.message || 'Gemini call failed' });
  }
}

module.exports = handler;
module.exports.default = handler;
