/**
 * QuantaAI - Intelligent Quantum Tutor & Universal AI Assistant
 * v3.0 — Full rewrite
 * Integrates Cloud LLMs (Google Gemini 2.0/1.5 & OpenAI GPT-4o)
 * with real-time quantum circuit telemetry and a rich in-browser
 * expert fallback that handles BOTH quantum topics and general questions.
 */

class QuantaAITutor {
  constructor() {
    this.mode = 'beginner'; // 'beginner' (Intuitive ELI5) or 'academic' (Dirac / Math)

    // Standalone console DOM elements
    this.explanationBox = document.getElementById('ai-explanation-text');
    this.chatHistory   = document.getElementById('ai-chat-history');
    this.chatInput     = document.getElementById('ai-chat-input');
    this.sendBtn       = document.getElementById('btn-send-ai');
    this.modeToggle    = document.getElementById('ai-mode-toggle');

    // In-tab drawer DOM elements
    this.inTabChatHistory = document.getElementById('in-tab-chat-history');
    this.inTabChatInput   = document.getElementById('in-tab-chat-input');
    this.inTabSendBtn     = document.getElementById('btn-send-in-tab-ai');
    this.inTabModeToggle  = document.getElementById('in-tab-mode-toggle');
    this.inTabProviderPill = document.getElementById('in-tab-llm-pill');

    // LLM Provider Configuration (Priority: config.js -> localStorage)
    const envConfig = window.ANANTA_CONFIG || {};
    this.geminiApiKey = (envConfig.GEMINI_API_KEY && !envConfig.GEMINI_API_KEY.includes('PASTE_YOUR'))
      ? envConfig.GEMINI_API_KEY
      : (localStorage.getItem('quanta_gemini_api_key') || '');
    this.openaiApiKey = envConfig.OPENAI_API_KEY || localStorage.getItem('quanta_openai_api_key') || '';
    this.llmProvider  = localStorage.getItem('quanta_llm_provider')
      || (this.geminiApiKey ? 'gemini' : (envConfig.DEFAULT_PROVIDER || 'local'));

    // Verified working model (cached after first successful call)
    this.geminiModel = 'gemini-2.0-flash-lite';

    // Ordered fallback list — free-tier first, then paid-tier
    this.candidateModels = [
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.0-pro'
    ];

    this.initLLMSettingsDOM();
    this.initInTabLLMSettingsDOM();
    this.bindEvents();
    this.updateProviderBadge();
  }

  // ─────────────────────────────────────────────────────────────
  //  DOM INIT
  // ─────────────────────────────────────────────────────────────

  initLLMSettingsDOM() {
    this.toggleSettingsBtn  = document.getElementById('btn-toggle-llm-settings');
    this.providerPill       = document.getElementById('llm-active-pill');
    this.settingsDrawer     = document.getElementById('llm-settings-drawer');
    this.providerSelect     = document.getElementById('llm-provider-select');
    this.apiKeyGroup        = document.getElementById('api-key-group');
    this.apiKeyInput        = document.getElementById('llm-api-key-input');
    this.toggleVisibilityBtn = document.getElementById('btn-toggle-api-key-visibility');
    this.getKeyLink         = document.getElementById('llm-get-key-link');
    this.saveSettingsBtn    = document.getElementById('btn-save-llm-settings');

    if (this.providerSelect) {
      this.providerSelect.value = this.llmProvider;
      this.updateApiKeyInputForProvider(this.llmProvider);
    }
  }

  initInTabLLMSettingsDOM() {
    this.inTabProviderSelect     = document.getElementById('in-tab-provider-select');
    this.inTabApiKeyInput        = document.getElementById('in-tab-api-key-input');
    this.inTabSaveSettingsBtn    = document.getElementById('btn-save-in-tab-llm');
    this.inTabToggleVisibilityBtn = document.getElementById('btn-toggle-in-tab-key');
    this.inTabApiKeyGroup        = document.getElementById('in-tab-api-key-group');

    if (this.inTabProviderSelect) {
      this.inTabProviderSelect.value = this.llmProvider;
      this.updateInTabApiKeyInput(this.llmProvider);
    }
  }

  updateInTabApiKeyInput(provider) {
    if (!this.inTabApiKeyInput || !this.inTabApiKeyGroup) return;
    if (provider === 'local') {
      this.inTabApiKeyGroup.style.display = 'none';
    } else if (provider === 'gemini') {
      this.inTabApiKeyGroup.style.display = 'flex';
      this.inTabApiKeyInput.value = this.geminiApiKey;
      this.inTabApiKeyInput.placeholder = 'Paste Google Gemini API Key (AIzaSy...)';
    } else if (provider === 'openai') {
      this.inTabApiKeyGroup.style.display = 'flex';
      this.inTabApiKeyInput.value = this.openaiApiKey;
      this.inTabApiKeyInput.placeholder = 'Paste OpenAI API Key (sk-proj-...)';
    }
  }

  updateApiKeyInputForProvider(provider) {
    if (!this.apiKeyInput || !this.apiKeyGroup) return;
    if (provider === 'local') {
      this.apiKeyGroup.style.display = 'none';
      if (this.getKeyLink) this.getKeyLink.style.display = 'none';
    } else if (provider === 'gemini') {
      this.apiKeyGroup.style.display = 'flex';
      this.apiKeyInput.value = this.geminiApiKey;
      this.apiKeyInput.placeholder = 'Paste Google Gemini API Key (AIzaSy...)';
      if (this.getKeyLink) {
        this.getKeyLink.style.display = 'inline-block';
        this.getKeyLink.href = 'https://aistudio.google.com/app/apikey';
        this.getKeyLink.textContent = 'Get a free Google Gemini API Key at Google AI Studio ↗';
      }
    } else if (provider === 'openai') {
      this.apiKeyGroup.style.display = 'flex';
      this.apiKeyInput.value = this.openaiApiKey;
      this.apiKeyInput.placeholder = 'Paste OpenAI API Key (sk-proj-...)';
      if (this.getKeyLink) {
        this.getKeyLink.style.display = 'inline-block';
        this.getKeyLink.href = 'https://platform.openai.com/api-keys';
        this.getKeyLink.textContent = 'Get an OpenAI API Key at platform.openai.com ↗';
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  EVENT BINDING
  // ─────────────────────────────────────────────────────────────

  bindEvents() {
    // Mode Switcher
    if (this.modeToggle) {
      this.modeToggle.addEventListener('change', (e) => {
        this.mode = e.target.checked ? 'academic' : 'beginner';
        const label = document.getElementById('ai-mode-label');
        if (label) label.textContent = this.mode === 'academic' ? 'Academic (Math / Dirac)' : 'Intuitive (Beginner ELI5)';
        if (window.circuitUI) window.circuitUI.updateSimulation();
      });
    }

    // Toggle LLM Settings Drawer
    if (this.toggleSettingsBtn && this.settingsDrawer) {
      this.toggleSettingsBtn.addEventListener('click', () => {
        const isHidden = this.settingsDrawer.style.display === 'none' || !this.settingsDrawer.style.display;
        this.settingsDrawer.style.display = isHidden ? 'block' : 'none';
      });
    }

    // Provider Change Handler
    if (this.providerSelect) {
      this.providerSelect.addEventListener('change', (e) => {
        this.updateApiKeyInputForProvider(e.target.value);
      });
    }

    // Toggle API Key Visibility
    if (this.toggleVisibilityBtn && this.apiKeyInput) {
      this.toggleVisibilityBtn.addEventListener('click', () => {
        const isPassword = this.apiKeyInput.type === 'password';
        this.apiKeyInput.type = isPassword ? 'text' : 'password';
        this.toggleVisibilityBtn.textContent = isPassword ? '🔒' : '👁️';
      });
    }

    // Save Settings Button
    if (this.saveSettingsBtn) {
      this.saveSettingsBtn.addEventListener('click', () => {
        const chosenProvider = this.providerSelect.value;
        this.llmProvider = chosenProvider;
        localStorage.setItem('quanta_llm_provider', chosenProvider);
        if (chosenProvider === 'gemini') {
          this.geminiApiKey = this.apiKeyInput.value.trim();
          localStorage.setItem('quanta_gemini_api_key', this.geminiApiKey);
        } else if (chosenProvider === 'openai') {
          this.openaiApiKey = this.apiKeyInput.value.trim();
          localStorage.setItem('quanta_openai_api_key', this.openaiApiKey);
        }
        this.updateProviderBadge();
        this.settingsDrawer.style.display = 'none';
        let providerName = 'Offline Expert System';
        if (chosenProvider === 'gemini') providerName = 'Google Gemini Flash';
        if (chosenProvider === 'openai') providerName = 'OpenAI GPT-4o';
        this.addChatMessage(`✅ AI configured: Connected to <strong>${providerName}</strong> with live quantum circuit telemetry. Ask me anything!`, 'ai');
      });
    }

    // Chat Send Handlers (Standalone console)
    if (this.sendBtn && this.chatInput) {
      this.sendBtn.addEventListener('click', () => this.handleUserMessage(this.chatInput, this.chatHistory));
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) this.handleUserMessage(this.chatInput, this.chatHistory);
      });
    }

    // In-Tab Mode Switcher
    if (this.inTabModeToggle) {
      this.inTabModeToggle.addEventListener('change', (e) => {
        this.mode = e.target.checked ? 'academic' : 'beginner';
        const inTabLbl = document.getElementById('in-tab-mode-label');
        if (inTabLbl) inTabLbl.textContent = this.mode === 'academic' ? 'Dirac' : 'ELI5';
        if (this.modeToggle) this.modeToggle.checked = e.target.checked;
        const label = document.getElementById('ai-mode-label');
        if (label) label.textContent = this.mode === 'academic' ? 'Academic (Math / Dirac)' : 'Intuitive (Beginner ELI5)';
        if (window.circuitUI) window.circuitUI.updateSimulation();
      });
    }

    // In-Tab Send Handlers
    if (this.inTabSendBtn && this.inTabChatInput) {
      this.inTabSendBtn.addEventListener('click', () => this.handleUserMessage(this.inTabChatInput, this.inTabChatHistory));
      this.inTabChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) this.handleUserMessage(this.inTabChatInput, this.inTabChatHistory);
      });
    }

    // In-Tab Provider Select
    if (this.inTabProviderSelect) {
      this.inTabProviderSelect.addEventListener('change', (e) => {
        this.updateInTabApiKeyInput(e.target.value);
      });
    }

    // In-Tab Visibility Toggle
    if (this.inTabToggleVisibilityBtn && this.inTabApiKeyInput) {
      this.inTabToggleVisibilityBtn.addEventListener('click', () => {
        const isPassword = this.inTabApiKeyInput.type === 'password';
        this.inTabApiKeyInput.type = isPassword ? 'text' : 'password';
        this.inTabToggleVisibilityBtn.textContent = isPassword ? '🔒' : '👁️';
      });
    }

    // In-Tab Save Button
    if (this.inTabSaveSettingsBtn) {
      this.inTabSaveSettingsBtn.addEventListener('click', () => {
        const chosenProvider = this.inTabProviderSelect.value;
        this.llmProvider = chosenProvider;
        localStorage.setItem('quanta_llm_provider', chosenProvider);
        if (chosenProvider === 'gemini') {
          this.geminiApiKey = this.inTabApiKeyInput.value.trim();
          localStorage.setItem('quanta_gemini_api_key', this.geminiApiKey);
        } else if (chosenProvider === 'openai') {
          this.openaiApiKey = this.inTabApiKeyInput.value.trim();
          localStorage.setItem('quanta_openai_api_key', this.openaiApiKey);
        }
        if (this.providerSelect) this.providerSelect.value = chosenProvider;
        this.updateApiKeyInputForProvider(chosenProvider);
        this.updateProviderBadge();
        const settingsBox = document.getElementById('in-tab-llm-settings-box');
        if (settingsBox) settingsBox.style.display = 'none';
        let providerName = 'Offline Expert System';
        if (chosenProvider === 'gemini') providerName = 'Google Gemini Flash';
        if (chosenProvider === 'openai') providerName = 'OpenAI GPT-4o';
        this.addChatMessage(`✅ Co-Pilot configured: Connected to <strong>${providerName}</strong> with live quantum circuit telemetry.`, 'ai', this.inTabChatHistory);
      });
    }

    // In-Tab Prompt Chips
    document.querySelectorAll('.in-tab-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-ai-query');
        if (query) this.respondToPrompt(query, this.inTabChatHistory);
      });
    });

    // Pre-set prompt chips
    document.querySelectorAll('.prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        if (query) this.respondToPrompt(query);
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  //  PROVIDER BADGE
  // ─────────────────────────────────────────────────────────────

  updateProviderBadge() {
    const pills = [this.providerPill, this.inTabProviderPill].filter(Boolean);
    pills.forEach(pill => {
      if (this.llmProvider === 'gemini') {
        if (this.geminiApiKey) {
          pill.className = 'llm-pill gemini';
          pill.textContent = `Gemini Flash 🟢`;
        } else {
          pill.className = 'llm-pill warning';
          pill.textContent = 'Gemini (Key Missing)';
        }
      } else if (this.llmProvider === 'openai') {
        if (this.openaiApiKey) {
          pill.className = 'llm-pill openai';
          pill.textContent = 'GPT-4o 🟢';
        } else {
          pill.className = 'llm-pill warning';
          pill.textContent = 'OpenAI (Key Missing)';
        }
      } else {
        pill.className = 'llm-pill local';
        pill.textContent = 'Offline Expert 🔵';
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  //  CIRCUIT ANALYSIS (Live Explanation Card)
  // ─────────────────────────────────────────────────────────────

  onCircuitChanged(grid, probs, blochCoords, selectedQubit) {
    const explanation = this.analyzeCircuit(grid, probs, blochCoords, selectedQubit);
    this.renderExplanation(explanation);
  }

  analyzeCircuit(grid, probs, bloch, selectedQubit) {
    const allGates = grid.flat().filter(Boolean);
    if (allGates.length === 0) {
      if (this.mode === 'beginner') {
        return {
          title: "Ground State (|000⟩)",
          summary: "Your circuit is currently at rest in the classical ground state |000⟩.",
          details: "Think of this like a light switch turned firmly OFF with 100% certainty. To experience quantum behavior, try dragging an <strong>H (Hadamard)</strong> gate onto Qubit 0 to put it into superposition!"
        };
      } else {
        return {
          title: "Initial Pure State |0⟩⊗3",
          summary: "Statevector: |ψ⟩ = 1.00|000⟩.",
          details: "All qubits reside in computational basis ground state |0⟩ with density operator ρ = |000⟩⟨000|. Trace distance to ground is zero."
        };
      }
    }

    const hasH0 = grid[0].some(g => g === 'H');
    const hasCX = grid[0].some((g, c) => g === 'CX_CTRL' && grid[1][c] === 'CX_TGT');
    const nonZeroProbs = probs.filter(p => p.probability > 0.08);

    if (hasH0 && hasCX && nonZeroProbs.length === 2) {
      if (this.mode === 'beginner') {
        return {
          title: "Quantum Entanglement Created (Bell State)",
          summary: "You have created 'spooky action at a distance'! Qubit 0 and Qubit 1 are inextricably linked.",
          details: "Notice only two outcomes exist: both 0 (|000⟩) or both 1. Measuring Qubit 0 instantly determines Qubit 1's state, even if separated by light-years."
        };
      } else {
        return {
          title: "Maximally Entangled Bell Pair |Φ⁺⟩",
          summary: "Statevector: |ψ⟩ = 1/√2 (|00⟩ + |11⟩) ⊗ |0⟩₂.",
          details: "The reduced density matrix for Qubit 0 has Tr(ρ₀²) = 0.5 < 1, confirming a mixed state locally despite the global system being pure. Von Neumann entropy S = 1 bit (maximum entanglement)."
        };
      }
    }

    if (hasH0 && !hasCX && nonZeroProbs.length === 2) {
      if (this.mode === 'beginner') {
        return {
          title: "Equal Superposition (Quantum Coin Flip)",
          summary: "Qubit 0 is in a 50/50 superposition.",
          details: "Unlike a classical bit (0 or 1), Qubit 0 exists in both states simultaneously until observed! On the Bloch Sphere, the vector has rotated to the equator (+X axis)."
        };
      } else {
        return {
          title: "Hadamard Transformation H|0⟩ = |+⟩",
          summary: "|ψ⟩ = 1/√2 (|0⟩ + |1⟩) = |+⟩ on Qubit 0.",
          details: "The Hadamard unitary H = 1/√2 [[1, 1], [1, -1]] rotates Z-basis states into X-basis. Expectation values: ⟨X⟩ = 1.0, ⟨Y⟩ = 0.0, ⟨Z⟩ = 0.0."
        };
      }
    }

    const hasX = grid[selectedQubit].some(g => g === 'X');
    if (hasX && nonZeroProbs.length === 1 && bloch.z < -0.9) {
      if (this.mode === 'beginner') {
        return {
          title: "Quantum Bit Flip (Pauli-X)",
          summary: "Pauli-X flipped the qubit from |0⟩ to |1⟩.",
          details: "The quantum NOT gate. On the Bloch Sphere, the state vector has flipped 180° from the North Pole (|0⟩) to the South Pole (|1⟩)."
        };
      } else {
        return {
          title: "Pauli-X Unitary Transformation X|0⟩ = |1⟩",
          summary: "Pauli-X = [[0, 1], [1, 0]] acts as σₓ reflection across the X-Z plane.",
          details: "⟨Z⟩ eigenvalue flipped from +1 to -1. Measurement in computational basis yields state |1⟩ with probability 1.0."
        };
      }
    }

    const activeStatesStr = nonZeroProbs.map(p => `${p.state} (${(p.probability * 100).toFixed(0)}%)`).join(', ');
    if (this.mode === 'beginner') {
      return {
        title: "Active Multi-Qubit Interference",
        summary: `The circuit produces outcomes: ${activeStatesStr}.`,
        details: `Quantum gates are rotating phase angles and shifting probability amplitudes across the computational basis states. Try tweaking or removing a gate to watch the probability distribution re-balance in real time!`
      };
    } else {
      return {
        title: "Unitary Evolution U_total |000⟩",
        summary: `Superposition across ${nonZeroProbs.length} basis states: ${activeStatesStr}.`,
        details: `The circuit executes the composite unitary U = ∏ U_t. Normalized statevector amplitude satisfies ∑ |c_i|² = 1.00.`
      };
    }
  }

  renderExplanation(exp) {
    if (!this.explanationBox) return;
    this.explanationBox.innerHTML = `
      <div class="exp-card">
        <div class="exp-badge">Live Analysis</div>
        <h4 class="exp-title">${exp.title}</h4>
        <p class="exp-summary">${exp.summary}</p>
        <p class="exp-details">${exp.details}</p>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────
  //  CIRCUIT TELEMETRY (Injected into LLM prompts)
  // ─────────────────────────────────────────────────────────────

  buildCircuitTelemetry() {
    let telemetry = "Live Quantum Circuit Telemetry (Student's Browser):\n";

    if (window.circuitUI && window.circuitUI.grid) {
      const grid = window.circuitUI.grid;
      telemetry += "- Gate Placements:\n";
      for (let q = 0; q < 3; q++) {
        const gates = [];
        for (let col = 0; col < 6; col++) {
          if (grid[q][col]) gates.push(`Col ${col + 1}: ${grid[q][col]}`);
        }
        telemetry += `  Wire q${q}: ${gates.length > 0 ? gates.join(', ') : 'Empty (|0⟩)'}\n`;
      }
    }

    if (window.circuitUI && window.circuitUI.engine) {
      const engine = window.circuitUI.engine;
      telemetry += `- Live Dirac State: ${engine.getDiracNotation()}\n`;
      const active = engine.getProbabilities().filter(p => p.probability > 0.01);
      telemetry += `- Active Basis States: ` + active.map(p => `${p.state} (${(p.probability * 100).toFixed(1)}%, phase: ${(p.phase / Math.PI * 180).toFixed(0)}°)`).join(', ') + '\n';
      if (engine.getEntanglementEntropy) {
        telemetry += `- Von Neumann Entropy S: ${engine.getEntanglementEntropy().toFixed(2)}\n`;
      }
    }

    telemetry += `- Learning Mode: ${this.mode === 'academic' ? 'Academic (Dirac / Math)' : 'Intuitive (ELI5 / Analogies)'}\n`;
    return telemetry;
  }

  // ─────────────────────────────────────────────────────────────
  //  RAG RETRIEVAL — Quantum Literature Corpus
  // ─────────────────────────────────────────────────────────────

  retrieveRelevantLiterature(query, maxResults = 2) {
    if (typeof window === 'undefined' || !Array.isArray(window.QUANTUM_LITERATURE_CORPUS)) return [];
    const qTokens = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    if (qTokens.length === 0) return [];

    const scored = window.QUANTUM_LITERATURE_CORPUS.map(item => {
      let score = 0;
      const docLower = item.doc.toLowerCase();
      const textLower = (item.full || item.snippet).toLowerCase();
      qTokens.forEach(t => {
        if (docLower.includes(t)) score += 3;
        const matches = (textLower.match(new RegExp('\\b' + t, 'g')) || []).length;
        score += matches;
      });
      return { ...item, score };
    });

    return scored.filter(s => s.score > 1).sort((a, b) => b.score - a.score).slice(0, maxResults);
  }

  // ─────────────────────────────────────────────────────────────
  //  MESSAGE HANDLING
  // ─────────────────────────────────────────────────────────────

  async handleUserMessage(inputEl = this.chatInput, historyEl = this.chatHistory) {
    const text = inputEl ? inputEl.value.trim() : '';
    if (!text) return;

    this.addChatMessage(text, 'user', historyEl);
    if (inputEl) inputEl.value = '';

    const typingId = this.showTypingIndicator(historyEl);

    try {
      let reply = '';
      if (this.llmProvider === 'gemini' && this.geminiApiKey) {
        reply = await this.callGeminiAPI(text);
      } else if (this.llmProvider === 'openai' && this.openaiApiKey) {
        reply = await this.callOpenAIAPI(text);
      } else {
        await new Promise(r => setTimeout(r, 320));
        reply = this.generateLocalAIResponse(text);
      }
      this.removeTypingIndicator(typingId);
      this.addChatMessage(reply, 'ai', historyEl);
    } catch (err) {
      console.error('LLM API Error:', err);
      this.removeTypingIndicator(typingId);
      const fallbackReply = this.generateLocalAIResponse(text);
      const isCasual = /^(h+i+|h+e+y+|h+e+l+o+|hola|namaste|greetings|good\s*(morning|afternoon|evening|day)|s+u+p+|y+o+|howdy)\b/i
        .test((text || '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, ''));
      if (isCasual) {
        this.addChatMessage(fallbackReply, 'ai', historyEl);
      } else {
        const errorNote = `<div class="llm-error-tag">⚠️ Cloud AI unavailable (${err.message}). Showing offline response:</div>`;
        this.addChatMessage(errorNote + fallbackReply, 'ai', historyEl);
      }
    }
  }

  async respondToPrompt(promptText, historyEl = this.chatHistory) {
    this.addChatMessage(promptText, 'user', historyEl);
    const typingId = this.showTypingIndicator(historyEl);

    try {
      let reply = '';
      if (this.llmProvider === 'gemini' && this.geminiApiKey) {
        reply = await this.callGeminiAPI(promptText);
      } else if (this.llmProvider === 'openai' && this.openaiApiKey) {
        reply = await this.callOpenAIAPI(promptText);
      } else {
        await new Promise(r => setTimeout(r, 300));
        reply = this.generateLocalAIResponse(promptText);
      }
      this.removeTypingIndicator(typingId);
      this.addChatMessage(reply, 'ai', historyEl);
    } catch (err) {
      this.removeTypingIndicator(typingId);
      const fallbackReply = this.generateLocalAIResponse(promptText);
      this.addChatMessage(fallbackReply, 'ai', historyEl);
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  GEMINI API — Multi-model auto-fallback
  // ─────────────────────────────────────────────────────────────

  async callGeminiAPI(userQuery) {
    const telemetry    = this.buildCircuitTelemetry();
    const retrievedDocs = this.retrieveRelevantLiterature(userQuery, 2);
    let ragGrounding   = '';
    if (retrievedDocs.length > 0 && userQuery.trim().length > 3) {
      ragGrounding = '\n\nRelevant Quantum Literature Excerpts:\n' +
        retrievedDocs.map(d => `Source: ${d.doc}\nExcerpt: ${d.snippet}`).join('\n\n');
    }

    const systemPrompt = `You are Ananta AI, a helpful, brilliant, and versatile AI assistant with deep mastery in Quantum Computing, Physics, Computer Science, Software Engineering, Mathematics, and general problem solving.

Core Behavior:
1. Answer ANY question or conversational message naturally, accurately, and helpfully — whether it is about quantum computing, general science, programming, math, everyday topics, or casual greetings.
2. Greetings & Casual Chat: If the user greets you (e.g., "hi", "hello", "how are you"), reply warmly and conversationally in 1-2 friendly sentences.
3. Quantum & Physics: Provide deep, intuitive, and accurate explanations. If mode is "Intuitive (ELI5)", use vivid physical analogies. If "Academic (Dirac)", provide rigorous bra-ket notation and formal derivations.
4. Circuit Telemetry: Reference the live circuit state below when the user's question is about quantum computing or their circuit. If they ask about general topics, answer directly.
5. Formatting: Use clean markdown. Bold key terms. Use code blocks for math and code. Never use em dashes (use hyphens or colons instead).
6. Research Papers: When citing papers from the quantum literature excerpts, include the source title.

${telemetry}${ragGrounding}`;

    let lastError = null;

    for (const modelName of this.candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(this.geminiApiKey)}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: userQuery }]
              }
            ],
            generationConfig: {
              temperature: 0.72,
              maxOutputTokens: 1024
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            this.geminiModel = modelName; // Cache verified working model
            let formatted = this.formatMarkdown(rawText);
            if (retrievedDocs.length > 0 && userQuery.trim().length > 3) {
              formatted += `<div class="rag-citation-box"><span class="rag-citation-title">📚 Grounded in Quantum Literature:</span> ${retrievedDocs.map(d => d.doc).join(' • ')}</div>`;
            }
            return formatted;
          }
        }

        const errJson = await response.json().catch(() => ({}));
        const msg = errJson.error?.message || `HTTP ${response.status}`;
        lastError = new Error(msg);

        // Try next model if this one is unavailable/not found
        if (response.status === 404 || msg.includes('not found') || msg.includes('not supported') || msg.includes('deprecated')) {
          continue;
        } else {
          throw lastError;
        }
      } catch (err) {
        lastError = err;
        if (err.message && (err.message.includes('not found') || err.message.includes('not supported') || err.message.includes('404') || err.message.includes('deprecated'))) {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('No compatible Gemini model responded');
  }

  // ─────────────────────────────────────────────────────────────
  //  OPENAI API — GPT-4o with RAG grounding
  // ─────────────────────────────────────────────────────────────

  async callOpenAIAPI(userQuery) {
    const telemetry     = this.buildCircuitTelemetry();
    const retrievedDocs = this.retrieveRelevantLiterature(userQuery, 2);
    let ragGrounding    = '';
    if (retrievedDocs.length > 0 && userQuery.trim().length > 3) {
      ragGrounding = '\n\nRelevant Quantum Library Excerpts:\n' +
        retrievedDocs.map(d => `Source: ${d.doc}\nExcerpt: ${d.snippet}`).join('\n\n');
    }

    const systemPrompt = `You are Ananta AI, a helpful and brilliant AI assistant with deep mastery in Quantum Computing, Physics, Computer Science, and general problem solving.

Core Behavior:
1. Answer ANY question naturally and helpfully — quantum computing, science, programming, math, everyday topics, or casual greetings.
2. Greetings: Reply warmly in 1-2 friendly sentences.
3. Quantum: Provide insightful explanations tailored to the student's learning mode.
4. Circuit Context: Reference live circuit state when relevant.
5. Formatting: Clean markdown, bold key terms, code blocks for math/code. No em dashes.

${telemetry}${ragGrounding}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.72,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) throw new Error('Empty response from OpenAI');

    let formatted = this.formatMarkdown(rawText);
    if (retrievedDocs.length > 0 && userQuery.trim().length > 3) {
      formatted += `<div class="rag-citation-box"><span class="rag-citation-title">📚 Grounded in Quantum Literature:</span> ${retrievedDocs.map(d => d.doc).join(' • ')}</div>`;
    }
    return formatted;
  }

  // ─────────────────────────────────────────────────────────────
  //  OFFLINE RESPONSE ENGINE — Quantum + General Knowledge
  // ─────────────────────────────────────────────────────────────

  generateLocalAIResponse(query) {
    const qTrim      = (query || '').trim();
    const cleanAlpha = qTrim.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const words      = cleanAlpha.split(/\s+/).filter(Boolean);
    const firstWord  = words[0] || '';

    // ── 0. Greetings ─────────────────────────────────────────
    const greetingRx = /^(h+i+|h+e+y+|h+e+l+l+o+|hola|namaste|greetings|good\s*(morning|afternoon|evening|night|day)|s+u+p+|y+o+|howdy|wsg|wassup)\b/i;
    if (greetingRx.test(cleanAlpha)) {
      return `<strong>Hello! 👋</strong> I'm your Ananta AI — your personal quantum computing tutor and research assistant.<br><br>I can help you with:<br>• <strong>Quantum concepts</strong> — superposition, entanglement, decoherence, algorithms<br>• <strong>Research papers</strong> — from Feynman 1982 to Google Supremacy 2019<br>• <strong>Circuit analysis</strong> — I can see your live circuit telemetry<br>• <strong>General questions</strong> — science, math, coding, physics<br><br>What would you like to explore? ✨`;
    }

    // ── 1. Identity / Help ────────────────────────────────────
    const identityRx = /^(who\s+are\s+you|what\s+(are|can)\s+you|tell\s+me\s+about\s+yourself|help|what\s+is\s+(this|ananta))\b/i;
    if (identityRx.test(cleanAlpha)) {
      return `<strong>I am Ananta AI</strong> — your intelligent quantum research assistant.<br><br>` +
        `• <strong>Quantum Circuit Synthesis:</strong> Ask about gates (H, X, CNOT, Phase, T), Bell states, Grover's search, Shor's algorithm, or your live circuit state.<br>` +
        `• <strong>Physics & Intuition:</strong> Superposition, entanglement, decoherence, tunneling, Bloch sphere.<br>` +
        `• <strong>Research Archive:</strong> I have 30+ landmark papers loaded — Feynman, Shor, Grover, Google Supremacy, VQE, QAOA, and more.<br>` +
        `• <strong>Any Question:</strong> Connect a Gemini or OpenAI API key (⚙️ settings) for unlimited general AI access.`;
    }

    // ── 2. General Math ───────────────────────────────────────
    if (/\b(calculate|compute|what is|solve|how much|how many)\b.*([\d+\-*/^()]+)/.test(cleanAlpha) ||
        /\d+\s*[+\-*/^]\s*\d+/.test(qTrim)) {
      try {
        // Simple safe expression evaluator
        const expr = qTrim.replace(/[^0-9+\-*/^().\s]/g, '').trim();
        if (expr) {
          const result = Function('"use strict"; return (' + expr.replace(/\^/g, '**') + ')')();
          return `<strong>Result:</strong> <code>${expr} = ${result}</code><br><br><em>For complex math, symbolic algebra, or calculus — connect a Gemini or OpenAI API key for full computation.</em>`;
        }
      } catch (_) { /* fall through */ }
    }

    // ── 3. Search Quantum Knowledge Engine ───────────────────
    if (window.QuantumKnowledgeEngine) {
      try {
        const ke    = new window.QuantumKnowledgeEngine();
        const topic = ke.search(query);
        if (topic) {
          const mathBlock = topic.math
            ? `<br><div class="chat-math-block"><strong>📐 Formula / Math:</strong><pre class="chat-code-pre">${topic.math}</pre></div>`
            : '';
          const intuition = topic.intuition
            ? `<br><div class="chat-intuition-block">💡 <em>${topic.intuition}</em></div>`
            : '';
          const apps = (topic.applications && topic.applications.length > 0)
            ? `<br><strong>Applications:</strong><ul class="chat-list">${topic.applications.map(a => `<li>${a}</li>`).join('')}</ul>`
            : '';
          const ref = topic.furtherReading
            ? `<div class="rag-citation-box"><span class="rag-citation-title">📚 Reference:</span> ${topic.furtherReading}</div>`
            : '';
          const arxiv = topic.arxiv
            ? ` &nbsp;<a href="https://arxiv.org/abs/${topic.arxiv.replace('arXiv:','')}" target="_blank" class="chat-arxiv-link">arXiv ↗</a>`
            : '';

          return `<div class="chat-topic-header"><strong>${topic.title}</strong> <span class="chat-topic-badge">${topic.category}</span>${arxiv}</div><br>` +
            `${topic.definition}${mathBlock}${intuition}${apps}${ref}`;
        }
      } catch (e) { console.warn('KE error:', e); }
    }

    // ── 4. Search Quantum Topic Database ─────────────────────
    if (Array.isArray(window.QUANTUM_TOPIC_DATABASE)) {
      const qTokens = cleanAlpha.split(/\s+/).filter(w => w.length > 2);
      let bestTopic = null;
      let bestScore = 0;

      for (const topic of window.QUANTUM_TOPIC_DATABASE) {
        let score = 0;
        for (const key of (topic.keys || [])) {
          if (cleanAlpha.includes(key)) score += 5;
        }
        for (const token of qTokens) {
          if ((topic.title || '').toLowerCase().includes(token)) score += 2;
          if ((topic.definition || '').toLowerCase().includes(token)) score += 1;
        }
        if (score > bestScore) { bestScore = score; bestTopic = topic; }
      }

      if (bestTopic && bestScore >= 4) {
        const mathBlock = bestTopic.math
          ? `<br><div class="chat-math-block"><strong>📐 Formula / Math:</strong><pre class="chat-code-pre">${bestTopic.math}</pre></div>`
          : '';
        const intuition = bestTopic.intuition
          ? `<br><div class="chat-intuition-block">💡 <em>${bestTopic.intuition}</em></div>`
          : '';
        const apps = (bestTopic.applications && bestTopic.applications.length > 0)
          ? `<br><strong>Applications:</strong><ul class="chat-list">${bestTopic.applications.map(a => `<li>${a}</li>`).join('')}</ul>`
          : '';
        const ref = bestTopic.furtherReading
          ? `<div class="rag-citation-box"><span class="rag-citation-title">📚 Reference:</span> ${bestTopic.furtherReading}</div>`
          : '';

        return `<div class="chat-topic-header"><strong>${bestTopic.title}</strong> <span class="chat-topic-badge">${bestTopic.category}</span></div><br>` +
          `${bestTopic.definition}${mathBlock}${intuition}${apps}${ref}`;
      }
    }

    // ── 5. RAG from Literature Corpus ─────────────────────────
    if (qTrim.length > 3) {
      const docs = this.retrieveRelevantLiterature(query, 2);
      if (docs.length > 0) {
        const primary   = docs[0];
        const secondary = docs[1];
        let out = `<div class="chat-topic-header"><strong>From Research Archive:</strong> <span class="chat-topic-badge">${primary.doc}</span></div><br>${primary.full.slice(0, 700)}`;
        if (secondary) {
          out += `<br><br><strong>Also from ${secondary.doc}:</strong><br>${secondary.snippet.slice(0, 350)}`;
        }
        out += `<div class="rag-citation-box"><span class="rag-citation-title">📚 Sources:</span> ${docs.map(d => d.doc).join(' • ')}</div>`;
        return out;
      }
    }

    // ── 6. Live Circuit Context Fallback ─────────────────────
    let circuitContext = '';
    if (window.circuitUI && window.circuitUI.grid) {
      const grid     = window.circuitUI.grid;
      const allGates = grid.flat().filter(Boolean);
      const gateNames = [...new Set(allGates)];
      if (allGates.length > 0) {
        circuitContext = `<br><br>📊 <strong>Your current circuit</strong> has <strong>${allGates.length} gate${allGates.length > 1 ? 's' : ''}</strong> placed: <code>${gateNames.join(', ')}</code>.`;
      }
    }
    let stateContext = '';
    if (window.circuitUI && window.circuitUI.engine) {
      const engine = window.circuitUI.engine;
      const dirac  = engine.getDiracNotation ? engine.getDiracNotation() : '';
      if (dirac && dirac !== '|000⟩') {
        stateContext = ` Live statevector: <code>${dirac}</code>.`;
      }
    }

    // ── 7. Algorithm Zoo Hint ─────────────────────────────────
    let algoHint = '';
    if (window.QuantumKnowledgeEngine) {
      try {
        const ke = new window.QuantumKnowledgeEngine();
        if (ke.algorithmZoo) {
          const algoMatch = Object.values(ke.algorithmZoo).find(a =>
            a.name && a.name.toLowerCase().includes(firstWord)
          );
          if (algoMatch) {
            algoHint = `<br><br><strong>🔬 Closest Algorithm Match: ${algoMatch.name}</strong><br>Speedup: ${algoMatch.speedup || 'N/A'} | Class: ${algoMatch.class || 'N/A'}<br>${algoMatch.description || ''}`;
          }
        }
      } catch (e) { /* ignore */ }
    }

    // ── 8. General Intelligent Fallback ──────────────────────
    const generalTopics = {
      physics: /\b(physics|newton|einstein|relativity|gravity|force|mass|energy|wave|particle|light|photon|atom|nucleus|electron|proton|neutron|molecule)\b/i,
      coding:  /\b(code|coding|program|javascript|python|java|c\+\+|algorithm|function|array|loop|class|object|debug|compile|software|api|html|css)\b/i,
      math:    /\b(math|algebra|calculus|derivative|integral|matrix|vector|probability|statistics|equation|theorem|proof|geometry|trigonometry)\b/i,
      ai:      /\b(ai|artificial intelligence|machine learning|deep learning|neural network|llm|gpt|transformer|training|model|dataset)\b/i,
      science: /\b(biology|chemistry|evolution|dna|gene|cell|reaction|element|periodic|universe|galaxy|star|planet|cosmos|climate)\b/i,
    };

    for (const [domain, rx] of Object.entries(generalTopics)) {
      if (rx.test(query)) {
        const domainLabels = { physics:'Physics', coding:'Programming', math:'Mathematics', ai:'Artificial Intelligence', science:'Science' };
        return `<strong>Ananta AI</strong> — <em>${domainLabels[domain]} Query</em><br><br>` +
          `I have offline knowledge on quantum physics and computing topics, but for a full, detailed answer about general <strong>${domainLabels[domain]}</strong>, I recommend connecting a <strong>Gemini</strong> or <strong>OpenAI</strong> API key (⚙️ settings) — it's free at <a href="https://aistudio.google.com/app/apikey" target="_blank" class="chat-arxiv-link">Google AI Studio ↗</a>.<br><br>` +
          `<strong>Quantum-relevant tip:</strong> ${domain === 'physics' ? 'Quantum mechanics is the deepest layer of physics! Ask me about wave-particle duality, superposition, or the measurement problem.' : domain === 'math' ? 'Quantum computing is deeply mathematical! Ask me about Hilbert spaces, unitary matrices, or eigenvalue decomposition.' : domain === 'coding' ? 'Quantum programming uses frameworks like Qiskit, Cirq, or PennyLane. Ask me how quantum circuits are written in code!' : domain === 'ai' ? 'Quantum Machine Learning (QML) is a hot research frontier! Ask me about the HHL algorithm or quantum kernel methods.' : 'Quantum biology is emerging! Ask me about quantum effects in photosynthesis or avian magnetic navigation.'}`
          + `${circuitContext}${stateContext}${algoHint}`;
      }
    }

    // ── 9. Ultimate Fallback ──────────────────────────────────
    return `<strong>Ananta AI</strong> — answering: <em>"${qTrim.slice(0, 60)}${qTrim.length > 60 ? '...' : ''}"</em><br><br>` +
      `I couldn't find a specific offline match for this query.${circuitContext}${stateContext}${algoHint}<br><br>` +
      `<strong>Try asking about:</strong><ul class="chat-list">` +
      `<li>Quantum topics: <em>superposition, entanglement, Grover's search, VQE, QAOA, error correction</em></li>` +
      `<li>Research papers: <em>Feynman 1982, Google Supremacy, Shor's algorithm, NISQ</em></li>` +
      `<li>Or connect a <strong>Gemini</strong>/<strong>OpenAI</strong> API key (⚙️) to ask absolutely anything!</li>` +
      `</ul>`;
  }

  // ─────────────────────────────────────────────────────────────
  //  UI HELPERS
  // ─────────────────────────────────────────────────────────────

  showTypingIndicator(targetHistory = this.chatHistory) {
    if (!targetHistory) targetHistory = this.inTabChatHistory || this.chatHistory;
    if (!targetHistory) return null;
    const id          = 'typing-' + Date.now();
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble chat-ai chat-typing';
    typingBubble.id = id;
    typingBubble.innerHTML = `
      <div class="chat-sender-label">Ananta Quantum Co-Pilot</div>
      <div class="typing-dots">
        <span></span><span></span><span></span>
        <em class="typing-hint">Analyzing circuit &amp; retrieving quantum knowledge...</em>
      </div>
    `;
    targetHistory.appendChild(typingBubble);
    targetHistory.scrollTop = targetHistory.scrollHeight;
    return id;
  }

  removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  addChatMessage(content, sender, targetHistory = this.chatHistory) {
    if (!targetHistory) targetHistory = this.inTabChatHistory || this.chatHistory;
    if (!targetHistory) return;
    const msg = document.createElement('div');
    msg.className = `chat-bubble chat-${sender}`;
    const label = sender === 'ai' ? 'Ananta Quantum Co-Pilot' : 'You';
    msg.innerHTML = `
      <div class="chat-sender-label">${label}</div>
      <div class="chat-text">${content}</div>
    `;
    targetHistory.appendChild(msg);
    // Smooth scroll
    targetHistory.scrollTo({ top: targetHistory.scrollHeight, behavior: 'smooth' });
  }

  // ─────────────────────────────────────────────────────────────
  //  MARKDOWN RENDERER — Full support
  // ─────────────────────────────────────────────────────────────

  formatMarkdown(raw) {
    if (!raw) return '';

    // Escape HTML first
    let out = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Fenced code blocks (``` ... ```)
    out = out.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="chat-code-pre"><code class="lang-${lang || 'text'}">${code.trim()}</code></pre>`;
    });

    // Inline code
    out = out.replace(/`([^`\n]+)`/g, '<code class="chat-inline-code">$1</code>');

    // Headings
    out = out.replace(/^### (.+)$/gm, '<h5 class="chat-h3">$1</h5>');
    out = out.replace(/^## (.+)$/gm,  '<h4 class="chat-h2">$1</h4>');
    out = out.replace(/^# (.+)$/gm,   '<h3 class="chat-h1">$1</h3>');

    // Bold and italic
    out = out.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/\*(.+?)\*/g,     '<em>$1</em>');
    out = out.replace(/__(.+?)__/g,     '<strong>$1</strong>');
    out = out.replace(/_(.+?)_/g,       '<em>$1</em>');

    // Unordered lists
    out = out.replace(/(?:^|\n)((?:\s*[-*+] .+(?:\n|$))+)/g, (_, block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\s*[-*+]\s+/, '')}</li>`).join('');
      return `<ul class="chat-list">${items}</ul>`;
    });

    // Ordered lists
    out = out.replace(/(?:^|\n)((?:\s*\d+\. .+(?:\n|$))+)/g, (_, block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\s*\d+\.\s+/, '')}</li>`).join('');
      return `<ol class="chat-list">${items}</ol>`;
    });

    // Horizontal rules
    out = out.replace(/^---+$/gm, '<hr class="chat-hr">');

    // Line breaks
    out = out.replace(/\n\n/g, '<br><br>');
    out = out.replace(/\n/g,   '<br>');

    return out;
  }
}

window.QuantaAITutor = QuantaAITutor;
