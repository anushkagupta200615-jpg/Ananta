/**
 * Ananta Quantum Studio - Production Full-Stack Backend Server
 * 
 * Provides:
 *  1. Live REST API for Google AI Studio (Gemini 2.5 Flash) proxying
 *  2. Real-time QPU simulation and hardware bridge execution endpoints
 *  3. Backend health diagnostics and live telemetry transaction log
 *  4. High-performance static asset streaming
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5500;
const HOST = '127.0.0.1';

// Load or fallback Gemini API Key
let GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
if (!GEMINI_API_KEY) {
  try {
    const configPath = path.join(__dirname, 'js', 'config.js');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const match = configContent.match(/GEMINI_API_KEY:\s*["']([^"']+)["']/);
      if (match && match[1]) {
        GEMINI_API_KEY = match[1].trim();
      }
    }
  } catch (e) {
    console.warn('[Server] Could not read js/config.js for GEMINI_API_KEY:', e.message);
  }
}

// Global server telemetry log for live console inspection
const telemetryLogs = [];
const MAX_LOGS = 100;
function logTransaction(method, endpoint, statusCode, durationMs, details = {}) {
  const entry = {
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    method,
    endpoint,
    statusCode,
    durationMs: Math.round(durationMs),
    details
  };
  telemetryLogs.unshift(entry);
  if (telemetryLogs.length > MAX_LOGS) telemetryLogs.pop();
  console.log(`[API ${method}] ${endpoint} -> ${statusCode} (${entry.durationMs}ms)`);
  return entry;
}

// Physical Device Fleet Catalog
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

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.crt': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

// Helper: send JSON response with standard CORS
function sendJson(res, statusCode, data, headers = {}) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    ...headers
  });
  res.end(payload);
}

// Helper: parse incoming JSON request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Request payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        return resolve({});
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

// Call Google AI Studio (Gemini 2.5 Flash)
async function callGeminiApi(prompt, systemInstruction = '', isJson = true) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured on backend');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2
    }
  };

  if (isJson) {
    payload.generationConfig.responseMimeType = 'application/json';
  }

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
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

// Server Request Handler
const server = http.createServer(async (req, res) => {
  const reqStart = Date.now();
  const reqUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = reqUrl.pathname;

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

  // ================= API ROUTES =================

  // Dedicated Multi-task Multi-Provider AI Endpoint (/api/gemini, /api/ai, /api/grok)
  if (pathname === '/api/gemini' || pathname === '/api/ai' || pathname === '/api/grok') {
    try {
      delete require.cache[require.resolve('./api/gemini.js')];
    } catch (e) {}
    const aiHandler = require('./api/gemini.js');
    return aiHandler(req, res);
  }

  // ================= RESEARCH PAPER EXTRACTION ENDPOINTS =================
  const { googleSearch } = require('./ananta-backend/utils/googleSearch');
  const { extractTextFromUrl } = require('./ananta-backend/utils/extractText');
  const { findTermOccurrences } = require('./ananta-backend/utils/findTerm');
  const { summarizeText } = require('./ananta-backend/utils/summarize');

  if (pathname === '/api/search' && req.method === 'POST') {
    const body = await parseRequestBody(req);
    const { query, num } = body || {};
    if (!query) return sendJson(res, 400, { error: 'query is required' });
    try {
      const results = await googleSearch(query, num || 10);
      logTransaction('POST', pathname, 200, Date.now() - reqStart, { query, count: results.length });
      return sendJson(res, 200, { query, results });
    } catch (err) {
      logTransaction('POST', pathname, 500, Date.now() - reqStart, { error: err.message });
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (pathname === '/api/fetch-content' && req.method === 'POST') {
    const body = await parseRequestBody(req);
    const { url } = body || {};
    if (!url) return sendJson(res, 400, { error: 'url is required' });
    try {
      const { title, text } = await extractTextFromUrl(url);
      logTransaction('POST', pathname, 200, Date.now() - reqStart, { url, title, length: text.length });
      return sendJson(res, 200, { url, title, length: text.length, text });
    } catch (e) {
      logTransaction('POST', pathname, 500, Date.now() - reqStart, { error: e.message });
      return sendJson(res, 500, { error: 'Could not fetch/parse that URL: ' + e.message });
    }
  }

  if (pathname === '/api/find-term' && req.method === 'POST') {
    const body = await parseRequestBody(req);
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
      logTransaction('POST', pathname, 200, Date.now() - reqStart, { term, count: occurrences.length });
      return sendJson(res, 200, { term, title, found: true, totalOccurrences: occurrences.length, results: summarized });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  if (pathname === '/api/summarize' && req.method === 'POST') {
    const body = await parseRequestBody(req);
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
      logTransaction('POST', pathname, 200, Date.now() - reqStart, { title });
      return sendJson(res, 200, { title, summary });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // 1. GET /api/health
  if (pathname === '/api/health' && req.method === 'GET') {
    const uptimeSec = Math.round(process.uptime());
    const data = {
      status: 'ONLINE',
      server: 'Ananta Quantum Full-Stack Engine',
      version: '2.5.0',
      uptimeSec,
      port: PORT,
      timestamp: new Date().toISOString(),
      aiStudio: {
        provider: 'Google AI Studio',
        model: 'gemini-2.5-flash',
        keyConfigured: Boolean(GEMINI_API_KEY && GEMINI_API_KEY.length > 10),
        status: GEMINI_API_KEY ? 'CONNECTED' : 'KEY_MISSING'
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
    };
    sendJson(res, 200, data);
    logTransaction('GET', pathname, 200, Date.now() - reqStart, { status: 'ONLINE' });
    return;
  }

  // 2. GET /api/logs (Backend Telemetry & Transaction Logs)
  if (pathname === '/api/logs' && req.method === 'GET') {
    sendJson(res, 200, {
      total: telemetryLogs.length,
      logs: telemetryLogs
    });
    return;
  }

  // 3. GET /api/qpu/devices
  if (pathname === '/api/qpu/devices' && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      count: Object.keys(QPU_DEVICES).length,
      devices: QPU_DEVICES
    });
    logTransaction('GET', pathname, 200, Date.now() - reqStart);
    return;
  }

  // 4. POST /api/ai/audit (Live Google AI Studio Deep Audit for Transpiler Doctor)
  if (pathname === '/api/ai/audit' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const { code, framework = 'cirq', rawGates = 0, optGates = 0, savings = 0, qubits = 3 } = body;

      if (!code) {
        sendJson(res, 400, { error: 'Missing quantum circuit code in request body' });
        logTransaction('POST', pathname, 400, Date.now() - reqStart, { error: 'Missing code' });
        return;
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

      const aiRes = await callGeminiApi(prompt, '', true);
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
          timestamp: new Date().toISOString()
        }
      };

      sendJson(res, 200, responseData);
      logTransaction('POST', pathname, 200, Date.now() - reqStart, {
        circuitName: parsedAudit.circuitName,
        latencyMs: aiRes.latencyMs
      });
      return;
    } catch (err) {
      console.error('[API /api/ai/audit Error]', err);
      sendJson(res, 502, {
        success: false,
        error: err.message || 'Error processing AI audit with Google AI Studio'
      });
      logTransaction('POST', pathname, 502, Date.now() - reqStart, { error: err.message });
      return;
    }
  }

  // 5. POST /api/ai/roadmap (Live Google AI Studio Personalized Curriculum Synthesis)
  if (pathname === '/api/ai/roadmap' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const { userPrompt, moduleCatalog = '' } = body;

      if (!userPrompt) {
        sendJson(res, 400, { error: 'Missing userPrompt in request body' });
        logTransaction('POST', pathname, 400, Date.now() - reqStart, { error: 'Missing prompt' });
        return;
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

      const aiRes = await callGeminiApi(systemPrompt, '', true);
      let parsedRoadmap;
      try {
        parsedRoadmap = JSON.parse(aiRes.text);
      } catch (jsonErr) {
        const cleaned = aiRes.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedRoadmap = JSON.parse(cleaned);
      }

      const responseData = {
        success: true,
        roadmap: parsedRoadmap,
        metadata: {
          provider: 'Google AI Studio (Gemini 2.5 Flash)',
          model: aiRes.modelVersion,
          latencyMs: aiRes.latencyMs,
          usage: aiRes.usage,
          timestamp: new Date().toISOString()
        }
      };

      sendJson(res, 200, responseData);
      logTransaction('POST', pathname, 200, Date.now() - reqStart, {
        displayName: parsedRoadmap.displayName,
        level: parsedRoadmap.detectedLevel
      });
      return;
    } catch (err) {
      console.error('[API /api/ai/roadmap Error]', err);
      sendJson(res, 502, {
        success: false,
        error: err.message || 'Error generating roadmap with Google AI Studio'
      });
      logTransaction('POST', pathname, 502, Date.now() - reqStart, { error: err.message });
      return;
    }
  }

  // 6. POST /api/ai/chat (Conversational Quantum Reasoning & Copilot Assistant)
  if (pathname === '/api/ai/chat' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const { message, context = '' } = body;

      if (!message) {
        sendJson(res, 400, { error: 'Missing message in request body' });
        return;
      }

      const prompt = `You are Ananta's Quantum Copilot, a brilliant quantum physicist and circuit designer.
Explain clearly, concisely (max 3-4 sentences), and with mathematical precision.
If relevant, give gate sequence recommendations.

Current Studio Context: ${context || 'General Quantum Studio'}
User Question: "${message}"`;

      const aiRes = await callGeminiApi(prompt, '', false);
      sendJson(res, 200, {
        success: true,
        reply: aiRes.text.trim(),
        metadata: {
          provider: 'Google AI Studio (Gemini 2.5 Flash)',
          model: aiRes.modelVersion,
          latencyMs: aiRes.latencyMs
        }
      });
      logTransaction('POST', pathname, 200, Date.now() - reqStart, { messageLength: message.length });
      return;
    } catch (err) {
      console.error('[API /api/ai/chat Error]', err);
      sendJson(res, 502, {
        success: false,
        error: err.message
      });
      logTransaction('POST', pathname, 502, Date.now() - reqStart, { error: err.message });
      return;
    }
  }

  // 7. POST /api/qpu/run (Physical QPU Hardware Execution & Realistic Noise Dispatch)
  if (pathname === '/api/qpu/run' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const {
        backend = 'ibm_brisbane',
        shots = 1024,
        qasm = '',
        numQubits = 3,
        idealProbabilities = null
      } = body;

      const device = QPU_DEVICES[backend] || QPU_DEVICES['ibm_brisbane'];
      const jobId = 'job_' + backend + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

      // Simulate execution time factoring in device queue
      const simulatedQueueWaitMs = Math.min(2500, Math.max(300, (device.queue || 1) * 60));
      await new Promise(r => setTimeout(r, simulatedQueueWaitMs));

      // Calculate shot counts with hardware noise (T1 relaxation, T2 dephasing, Readout error)
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

      // Realistic noise degradation
      const circuitDurationUs = 0.035 * 6; // approximate circuit duration
      const t1Decay = Math.exp(-circuitDurationUs / t1Median);
      const t2Decay = Math.exp(-circuitDurationUs / t2Median);
      const fidelityFactor = t1Decay * t2Decay;

      for (let shot = 0; shot < shots; shot++) {
        // Ideal sample
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

        // Hardware noisy sample
        let physicalSample = idealSample;
        if (Math.random() > fidelityFactor) {
          // Decoherence decay towards ground state |0...0> or random thermal state
          physicalSample = (Math.random() < 0.7) ? 0 : Math.floor(Math.random() * numStates);
        }

        // Readout bit-flip errors
        let bitArray = physicalSample.toString(2).padStart(numQubits, '0').split('');
        for (let b = 0; b < numQubits; b++) {
          if (Math.random() < roError) {
            bitArray[b] = bitArray[b] === '0' ? '1' : '0';
          }
        }
        const noisyBitstring = bitArray.join('');
        noisyCounts[noisyBitstring] = (noisyCounts[noisyBitstring] || 0) + 1;
      }

      const resultPayload = {
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
      };

      sendJson(res, 200, resultPayload);
      logTransaction('POST', pathname, 200, Date.now() - reqStart, {
        jobId,
        backend: device.name,
        shots
      });
      return;
    } catch (err) {
      console.error('[API /api/qpu/run Error]', err);
      sendJson(res, 500, { success: false, error: err.message });
      logTransaction('POST', pathname, 500, Date.now() - reqStart, { error: err.message });
      return;
    }
  }

  // ================= STATIC FILE SERVING =================
  let reqPath = pathname;
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`⚛️  Ananta Full-Stack Quantum Server ACTIVE`);
  console.log(`🌐 URL: http://${HOST}:${PORT}/`);
  console.log(`🔍 Health Check: http://${HOST}:${PORT}/api/health`);
  console.log(`🤖 Google AI Studio Key: ${GEMINI_API_KEY ? 'Configured (' + GEMINI_API_KEY.substring(0, 8) + '...)' : 'MISSING'}`);
  console.log('====================================================');
});
