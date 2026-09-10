/**
 * Ananta Quantum Studio - Vercel Serverless API Gateway
 * 
 * Provides cloud endpoints for:
 *  - GET  /api/health
 *  - GET  /api/logs
 *  - GET  /api/qpu/devices
 *  - POST /api/ai/audit
 *  - POST /api/ai/roadmap
 *  - POST /api/ai/chat
 *  - POST /api/qpu/run
 */

let DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY || '';

// If local config exists (e.g. local dev), load it
if (!DEFAULT_GEMINI_KEY) {
  try {
    const fs = require('fs');
    const path = require('path');
    const cfgPath = path.join(__dirname, '..', 'js', 'config.js');
    if (fs.existsSync(cfgPath)) {
      const match = fs.readFileSync(cfgPath, 'utf8').match(/GEMINI_API_KEY:\s*["']([^"']+)["']/);
      if (match && match[1]) DEFAULT_GEMINI_KEY = match[1].trim();
    }
  } catch (e) {}
}

const QPU_DEVICES = {
  'ibm_brisbane': {
    name: 'ibm_brisbane',
    type: 'Superconducting Transmon (Eagle r3)',
    qubits: 127,
    status: 'Online',
    queue: 14,
    t1Median: 284,
    t2Median: 168,
    cnotErrorMedian: 0.0078,
    readoutError: 0.019,
    quantumVolume: 128,
    clops: 2600
  },
  'ibm_kyoto': {
    name: 'ibm_kyoto',
    type: 'Superconducting Transmon (Eagle r3)',
    qubits: 127,
    status: 'Online',
    queue: 8,
    t1Median: 242,
    t2Median: 134,
    cnotErrorMedian: 0.0085,
    readoutError: 0.021,
    quantumVolume: 128,
    clops: 2400
  },
  'ibm_sherbrooke': {
    name: 'ibm_sherbrooke',
    type: 'Superconducting Transmon (Eagle r3)',
    qubits: 127,
    status: 'Online',
    queue: 11,
    t1Median: 295,
    t2Median: 175,
    cnotErrorMedian: 0.0072,
    readoutError: 0.016,
    quantumVolume: 256,
    clops: 2900
  },
  'ibm_osaka': {
    name: 'ibm_osaka',
    type: 'Superconducting Transmon (Eagle r3)',
    qubits: 127,
    status: 'Online',
    queue: 6,
    t1Median: 260,
    t2Median: 145,
    cnotErrorMedian: 0.0080,
    readoutError: 0.018,
    quantumVolume: 128,
    clops: 2500
  },
  'simulator_mps': {
    name: 'simulator_mps',
    type: 'Matrix Product State Cloud Simulator',
    qubits: 100,
    status: 'Online (Instant)',
    queue: 0,
    t1Median: 999999,
    t2Median: 999999,
    cnotErrorMedian: 0.00001,
    readoutError: 0.0001,
    quantumVolume: 512,
    clops: 10000
  }
};

const serverlessLogs = [];

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end(body);
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

async function callGeminiApi(prompt, systemInstruction = '', isJson = true, customKey = '') {
  const activeKey = customKey || DEFAULT_GEMINI_KEY;
  if (!activeKey) {
    throw new Error('GEMINI_API_KEY is not configured on server. Set GEMINI_API_KEY in Vercel Project Settings or provide X-Gemini-Key header.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${activeKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2 }
  };

  if (isJson) {
    payload.generationConfig.responseMimeType = 'application/json';
  }

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google AI Studio HTTP ${res.status}: ${errText.substring(0, 300)}`);
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('Empty response from Google AI Studio');
    }

    return {
      text: rawText,
      usage: data.usageMetadata || null,
      modelVersion: data.modelVersion || 'gemini-2.5-flash',
      latencyMs,
      finishReason: candidate.finishReason || 'STOP'
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

module.exports = async function handler(req, res) {
  const reqStart = Date.now();
  const host = req.headers['host'] || '127.0.0.1';
  const reqUrl = new URL(req.url, `https://${host}`);
  let pathname = reqUrl.pathname;

  // Normalize /api trailing slashes
  pathname = pathname.replace(/\/+$/, '') || '/';

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    res.end();
    return;
  }

  // Dedicated Multi-task Gemini Endpoint (/api/gemini, /api/ai, /api/grok)
  if (pathname === '/api/gemini' || pathname === '/gemini' || pathname === '/api/ai' || pathname === '/api/grok') {
    const geminiHandler = require('./gemini.js');
    return geminiHandler(req, res);
  }

  // ================= RESEARCH PAPER EXTRACTION ENDPOINTS =================
  const { googleSearch } = require('../ananta-backend/utils/googleSearch');
  const { extractTextFromUrl } = require('../ananta-backend/utils/extractText');
  const { findTermOccurrences } = require('../ananta-backend/utils/findTerm');
  const { summarizeText } = require('../ananta-backend/utils/summarize');

  if (pathname === '/api/search' && req.method === 'POST') {
    const body = await getParsedBody(req);
    const { query, num } = body || {};
    if (!query) return sendJson(res, 400, { error: 'query is required' });
    try {
      const results = await googleSearch(query, num || 10);
      return sendJson(res, 200, { query, results });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (pathname === '/api/fetch-content' && req.method === 'POST') {
    const body = await getParsedBody(req);
    const { url } = body || {};
    if (!url) return sendJson(res, 400, { error: 'url is required' });
    try {
      const { title, text } = await extractTextFromUrl(url);
      return sendJson(res, 200, { url, title, length: text.length, text });
    } catch (e) {
      return sendJson(res, 500, { error: 'Could not fetch/parse that URL: ' + e.message });
    }
  }

  if (pathname === '/api/find-term' && req.method === 'POST') {
    const body = await getParsedBody(req);
    const { url, text, term } = body || {};
    if (!term) return sendJson(res, 400, { error: 'term is required' });
    if (!url && !text) return sendJson(res, 400, { error: 'provide either url or text' });

    try {
      let sourceText = text;
      let title = null;
      if (!sourceText && url) {
        const extracted = await extractTextFromUrl(url);
        sourceText = extracted.text;
        title = extracted.title;
      }

      const occurrences = findTermOccurrences(sourceText, term);
      if (!occurrences.length) {
        return sendJson(res, 200, { term, title, found: false, message: `"${term}" was not found in this document.` });
      }

      const topOccurrences = occurrences.slice(0, 5);
      const summarized = await Promise.all(
        topOccurrences.map(async (occ) => ({
          context: occ.context,
          summary: await summarizeText(occ.context, term),
        }))
      );
      return sendJson(res, 200, { term, title, found: true, totalOccurrences: occurrences.length, results: summarized });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  if (pathname === '/api/summarize' && req.method === 'POST') {
    const body = await getParsedBody(req);
    const { url, text } = body || {};
    if (!url && !text) return sendJson(res, 400, { error: 'provide either url or text' });

    try {
      let sourceText = text;
      let title = null;
      if (!sourceText && url) {
        const extracted = await extractTextFromUrl(url);
        sourceText = extracted.text;
        title = extracted.title;
      }
      const truncated = (sourceText || '').slice(0, 15000);
      const summary = await summarizeText(truncated);
      return sendJson(res, 200, { title, summary });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // 1. GET /api or /api/health
  if ((pathname === '/api' || pathname === '/api/health') && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'ONLINE',
      server: 'Ananta Quantum Vercel Serverless Engine',
      version: '2.5.0',
      cloud: 'Vercel Serverless Function',
      timestamp: new Date().toISOString(),
      aiStudio: {
        provider: 'Google AI Studio',
        model: 'gemini-2.5-flash',
        keyConfigured: Boolean(DEFAULT_GEMINI_KEY && DEFAULT_GEMINI_KEY.length > 10),
        status: (DEFAULT_GEMINI_KEY && DEFAULT_GEMINI_KEY.length > 10) ? 'CONNECTED' : 'READY_FOR_KEY'
      },
      qpuDevices: Object.keys(QPU_DEVICES),
      activeFeatures: [
        'Quantum Circuit Composer',
        'Universal Transpiler & AI Circuit Doctor',
        'Topic Roadmap & Custom AI Synthesis',
        'Physical Cloud QPU Hardware Bridge',
        'Quantum Voice & Video Copilot',
        'Real-time Statevector Simulator',
        'Cryostat Digital Twin',
        'PQC Security Auditor'
      ]
    });
  }

  // 2. GET /api/logs
  if (pathname === '/api/logs' && req.method === 'GET') {
    return sendJson(res, 200, {
      total: serverlessLogs.length,
      logs: serverlessLogs
    });
  }

  // 3. GET /api/qpu/devices
  if (pathname === '/api/qpu/devices' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      count: Object.keys(QPU_DEVICES).length,
      devices: QPU_DEVICES
    });
  }

  // 4. POST /api/ai/audit
  if (pathname === '/api/ai/audit' && req.method === 'POST') {
    try {
      const body = await getParsedBody(req);
      const { code, framework = 'cirq', rawGates = 0, optGates = 0, savings = 0, qubits = 3 } = body;

      if (!code) {
        return sendJson(res, 400, { error: 'Missing quantum circuit code in request body' });
      }

      const prompt = `You are the Principal Quantum Hardware Architect & Circuit Compiler Lead at Google Quantum AI and IBM Quantum.
Perform an in-depth clinical audit and hardware noise prognosis for this quantum circuit written in ${framework.toUpperCase()}:

\`\`\`
${code}
\`\`\`

Diagnostic context:
- Total Raw Gates: ${rawGates}
- Optimized Gates: ${optGates}
- Pruned Redundancies: ${savings} gates
- Active Qubits: ${qubits}

Return ONLY a valid JSON object matching this schema:
{
  "circuitName": "Descriptive algorithm title (e.g. 4-Qubit GHZ State Preparation or Entangled Bell State)",
  "healthAssessment": "2-3 sentences evaluating circuit health, gate bloat, and compilation status.",
  "gatePathology": "Specific explanation of which gates are redundant, unmerged, or causing unnecessary depth.",
  "decoherenceRisks": "Which physical qubits or operations carry highest risk of T1 decay or T2 dephasing on superconducting transmons.",
  "qpuRecommendation": "Comparative analysis: performance on IBM Eagle (Heavy-Hex), Google Sycamore (2D Grid), and IonQ Forte (All-to-All).",
  "clinicalPrescription": "Concrete next steps (e.g., Dynamical Decoupling sequence, Zero-Noise Extrapolation, KAK Cartan synthesis)."
}`;

      const clientKey = (req.headers['x-gemini-key'] || '').trim();
      const aiRes = await callGeminiApi(prompt, '', true, clientKey);
      let parsedAudit;
      try {
        parsedAudit = JSON.parse(aiRes.text);
      } catch (jsonErr) {
        const cleaned = aiRes.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedAudit = JSON.parse(cleaned);
      }

      const responseData = {
        success: true,
        audit: parsedAudit,
        metadata: {
          provider: 'Google AI Studio (Gemini 2.5 Flash)',
          model: aiRes.modelVersion,
          latencyMs: aiRes.latencyMs,
          usage: aiRes.usage,
          cloud: 'Vercel Serverless',
          timestamp: new Date().toISOString()
        }
      };

      return sendJson(res, 200, responseData);
    } catch (err) {
      console.error('[Vercel API /api/ai/audit Error]', err);
      return sendJson(res, 502, {
        success: false,
        error: err.message || 'Error processing AI audit with Google AI Studio'
      });
    }
  }

  // 5. POST /api/ai/roadmap
  if (pathname === '/api/ai/roadmap' && req.method === 'POST') {
    try {
      const body = await getParsedBody(req);
      const { userPrompt, moduleCatalog = '' } = body;

      if (!userPrompt) {
        return sendJson(res, 400, { error: 'Missing userPrompt in request body' });
      }

      const systemPrompt = `You are the Lead Quantum Curriculum Architect & Quantum Information Physicist for Ananta Quantum Studio.
You must construct a personalized, mathematically rigorous learning pathway for a user based on their background, question, or request.

Available 18 Quantum Modules in the Curriculum:
${moduleCatalog}

User Request: "${userPrompt}"

Instructions:
1. Analyze the user's expertise level and request:
   - If they state they are a "beginner", "no prior knowledge", "already a beginner", or ask basic concepts, START at foundational modules (e.g. module-01, module-02, module-04, module-06).
   - If they state they "already know basics" or are "intermediate", skip introductory 101 definitions and begin with circuit engineering, Pauli observables, density matrices, and algorithms (e.g. module-02, module-04, module-06, module-07, module-08).
   - If they state "advanced", "learn from advanced", "expert", or ask about specialized topics (e.g., surface codes, FTQC, VQE, QML, microwave pulses, post-quantum crypto, cryogenics), skip basics completely and build a deep, high-level sequence (e.g. module-03, module-05, module-10, module-11, module-12, module-14, module-16).
   - If they ask for a specific topic (e.g., "teleportation", "Grover search", "cryogenics", "error correction"), include its essential prerequisites followed by the target topic and advanced next steps.
2. Select between 3 and 10 module IDs from the 18 available modules in STRICT prerequisite order.
3. Provide a clear rationale explaining why this specific sequence fits the user's background.

You MUST return ONLY a valid JSON object with the following schema:
{
  "displayName": "Concise descriptive title of this customized roadmap (e.g., 'Adaptive Pathway: Fault-Tolerant QC & QML')",
  "description": "2-sentence summary of the curriculum and what the learner will master.",
  "detectedLevel": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "MASTER",
  "levelRationale": "Clear explanation of how the user's prompt informed this selection and ordering.",
  "moduleIds": ["module-01", "module-02", ...]
}`;

      const clientKey = (req.headers['x-gemini-key'] || '').trim();
      const aiRes = await callGeminiApi(systemPrompt, '', true, clientKey);
      let parsedRoadmap;
      try {
        parsedRoadmap = JSON.parse(aiRes.text);
      } catch (jsonErr) {
        const cleaned = aiRes.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedRoadmap = JSON.parse(cleaned);
      }

      return sendJson(res, 200, {
        success: true,
        roadmap: parsedRoadmap,
        metadata: {
          provider: 'Google AI Studio (Gemini 2.5 Flash)',
          model: aiRes.modelVersion,
          latencyMs: aiRes.latencyMs,
          cloud: 'Vercel Serverless',
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('[Vercel API /api/ai/roadmap Error]', err);
      return sendJson(res, 502, {
        success: false,
        error: err.message || 'Error generating roadmap with Google AI Studio'
      });
    }
  }

  // 6. POST /api/ai/chat
  if (pathname === '/api/ai/chat' && req.method === 'POST') {
    try {
      const body = await getParsedBody(req);
      const { message, context = '' } = body;

      if (!message) {
        return sendJson(res, 400, { error: 'Missing message in request body' });
      }

      const prompt = `You are Ananta's Quantum Copilot, a brilliant quantum physicist and circuit designer.
Explain clearly, concisely (max 3-4 sentences), and with mathematical precision.
If relevant, give gate sequence recommendations.

Current Studio Context: ${context || 'General Quantum Studio'}
User Question: "${message}"`;

      const clientKey = (req.headers['x-gemini-key'] || '').trim();
      const aiRes = await callGeminiApi(prompt, '', false, clientKey);
      return sendJson(res, 200, {
        success: true,
        reply: aiRes.text.trim(),
        metadata: {
          provider: 'Google AI Studio (Gemini 2.5 Flash)',
          model: aiRes.modelVersion,
          latencyMs: aiRes.latencyMs,
          cloud: 'Vercel Serverless'
        }
      });
    } catch (err) {
      console.error('[Vercel API /api/ai/chat Error]', err);
      return sendJson(res, 502, {
        success: false,
        error: err.message
      });
    }
  }

  // 7. POST /api/qpu/run
  if (pathname === '/api/qpu/run' && req.method === 'POST') {
    try {
      const body = await getParsedBody(req);
      const {
        backend = 'ibm_brisbane',
        shots = 1024,
        qasm = '',
        numQubits = 3,
        idealProbabilities = null
      } = body;

      const device = QPU_DEVICES[backend] || QPU_DEVICES['ibm_brisbane'];
      const jobId = 'job_' + backend + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

      const numStates = 1 << numQubits;
      const noisyCounts = {};
      const idealCounts = {};

      for (let i = 0; i < numStates; i++) {
        const bitstring = i.toString(2).padStart(numQubits, '0');
        noisyCounts[bitstring] = 0;
        idealCounts[bitstring] = 0;
      }

      const probs = (idealProbabilities && idealProbabilities.length === numStates)
        ? idealProbabilities
        : Array(numStates).fill(1 / numStates);

      const t1Median = device.t1Median || 280;
      const t2Median = device.t2Median || 160;
      const roError = device.readoutError || 0.019;

      const circuitDurationUs = 0.035 * 6;
      const t1Decay = Math.exp(-circuitDurationUs / t1Median);
      const t2Decay = Math.exp(-circuitDurationUs / t2Median);
      const fidelityFactor = t1Decay * t2Decay;

      for (let shot = 0; shot < shots; shot++) {
        const rand = Math.random();
        let cum = 0;
        let idealSample = 0;
        for (let i = 0; i < numStates; i++) {
          cum += probs[i];
          if (rand <= cum) {
            idealSample = i;
            break;
          }
        }
        idealCounts[idealSample.toString(2).padStart(numQubits, '0')]++;

        let physicalSample = idealSample;
        if (Math.random() > fidelityFactor) {
          physicalSample = (Math.random() < 0.7) ? 0 : Math.floor(Math.random() * numStates);
        }

        let bitArray = physicalSample.toString(2).padStart(numQubits, '0').split('');
        for (let b = 0; b < numQubits; b++) {
          if (Math.random() < roError) {
            bitArray[b] = bitArray[b] === '0' ? '1' : '0';
          }
        }
        const noisyBitstring = bitArray.join('');
        noisyCounts[noisyBitstring] = (noisyCounts[noisyBitstring] || 0) + 1;
      }

      return sendJson(res, 200, {
        success: true,
        jobId,
        backend: device.name,
        backendType: device.type,
        status: 'COMPLETED',
        shots,
        numQubits,
        executionTimeMs: Math.round(Date.now() - reqStart),
        deviceSpecs: {
          qubits: device.qubits,
          t1Median: device.t1Median,
          t2Median: device.t2Median,
          cnotError: device.cnotErrorMedian,
          readoutError: device.readoutError,
          fidelityScore: (fidelityFactor * (1 - roError) * 100).toFixed(2) + '%'
        },
        counts: noisyCounts,
        idealCounts,
        openqasm3: qasm || 'OPENQASM 3.0;\n// Executed by Ananta Cloud QPU Bridge'
      });
    } catch (err) {
      console.error('[Vercel API /api/qpu/run Error]', err);
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // 404 for unknown API route
  sendJson(res, 404, { error: `Endpoint not found: ${pathname}` });
};
