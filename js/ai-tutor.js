/**
 * QuantaAI - Intelligent Quantum Tutor & Real-Time Circuit Explainer
 * Integrates frontier Cloud LLMs (Google Gemini 1.5/2.0 Flash & OpenAI GPT-4o)
 * with real-time quantum circuit telemetry and in-browser deterministic expert fallback.
 */

class QuantaAITutor {
  constructor() {
    this.mode = 'beginner'; // 'beginner' (Intuitive ELI5) or 'academic' (Dirac / Math)
    
    // Standalone console DOM elements
    this.explanationBox = document.getElementById('ai-explanation-text');
    this.chatHistory = document.getElementById('ai-chat-history');
    this.chatInput = document.getElementById('ai-chat-input');
    this.sendBtn = document.getElementById('btn-send-ai');
    this.modeToggle = document.getElementById('ai-mode-toggle');

    // In-tab drawer DOM elements
    this.inTabChatHistory = document.getElementById('in-tab-chat-history');
    this.inTabChatInput = document.getElementById('in-tab-chat-input');
    this.inTabSendBtn = document.getElementById('btn-send-in-tab-ai');
    this.inTabModeToggle = document.getElementById('in-tab-mode-toggle');
    this.inTabProviderPill = document.getElementById('in-tab-llm-pill');

    // LLM Provider Configuration (Priority: config.js -> localStorage)
    const envConfig = window.ANANTA_CONFIG || {};
    this.geminiApiKey = (envConfig.GEMINI_API_KEY && !envConfig.GEMINI_API_KEY.includes('PASTE_YOUR')) ? envConfig.GEMINI_API_KEY : (localStorage.getItem('quanta_gemini_api_key') || '');
    this.openaiApiKey = envConfig.OPENAI_API_KEY || localStorage.getItem('quanta_openai_api_key') || '';
    this.llmProvider = localStorage.getItem('quanta_llm_provider') || (this.geminiApiKey ? 'gemini' : (envConfig.DEFAULT_PROVIDER || 'local'));
    this.geminiModel = 'gemini-1.5-flash';

    this.initLLMSettingsDOM();
    this.initInTabLLMSettingsDOM();
    this.bindEvents();
    this.updateProviderBadge();
  }

  initLLMSettingsDOM() {
    this.toggleSettingsBtn = document.getElementById('btn-toggle-llm-settings');
    this.providerPill = document.getElementById('llm-active-pill');
    this.settingsDrawer = document.getElementById('llm-settings-drawer');
    this.providerSelect = document.getElementById('llm-provider-select');
    this.apiKeyGroup = document.getElementById('api-key-group');
    this.apiKeyInput = document.getElementById('llm-api-key-input');
    this.toggleVisibilityBtn = document.getElementById('btn-toggle-api-key-visibility');
    this.getKeyLink = document.getElementById('llm-get-key-link');
    this.saveSettingsBtn = document.getElementById('btn-save-llm-settings');

    if (this.providerSelect) {
      this.providerSelect.value = this.llmProvider;
      this.updateApiKeyInputForProvider(this.llmProvider);
    }
  }

  initInTabLLMSettingsDOM() {
    this.inTabProviderSelect = document.getElementById('in-tab-provider-select');
    this.inTabApiKeyInput = document.getElementById('in-tab-api-key-input');
    this.inTabSaveSettingsBtn = document.getElementById('btn-save-in-tab-llm');
    this.inTabToggleVisibilityBtn = document.getElementById('btn-toggle-in-tab-key');
    this.inTabApiKeyGroup = document.getElementById('in-tab-api-key-group');

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

  bindEvents() {
    // Mode Switcher: Intuitive (ELI5) vs Academic (Dirac)
    if (this.modeToggle) {
      this.modeToggle.addEventListener('change', (e) => {
        this.mode = e.target.checked ? 'academic' : 'beginner';
        const label = document.getElementById('ai-mode-label');
        if (label) {
          label.textContent = this.mode === 'academic' ? 'Academic (Math / Dirac)' : 'Intuitive (Beginner ELI5)';
        }
        if (window.circuitUI) {
          window.circuitUI.updateSimulation();
        }
      });
    }

    // Toggle LLM Settings Drawer
    if (this.toggleSettingsBtn && this.settingsDrawer) {
      this.toggleSettingsBtn.addEventListener('click', () => {
        const isHidden = this.settingsDrawer.style.display === 'none';
        this.settingsDrawer.style.display = isHidden ? 'block' : 'none';
      });
    }

    // Provider Change Handler
    if (this.providerSelect) {
      this.providerSelect.addEventListener('change', (e) => {
        this.updateApiKeyInputForProvider(e.target.value);
      });
    }

    // Toggle API Key Password Visibility
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

        // Notify user in chat
        let providerName = 'Offline Expert System';
        if (chosenProvider === 'gemini') providerName = 'Google Gemini 1.5/2.0 Flash';
        if (chosenProvider === 'openai') providerName = 'OpenAI GPT-4o';

        this.addChatMessage(`AI Mentor configured: Connected to <strong>${providerName}</strong> with live quantum circuit telemetry injection. Ask me anything!`, 'ai');
      });
    }

    // Chat Send Handlers (Standalone console)
    if (this.sendBtn && this.chatInput) {
      this.sendBtn.addEventListener('click', () => this.handleUserMessage(this.chatInput, this.chatHistory));
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleUserMessage(this.chatInput, this.chatHistory);
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
        if (e.key === 'Enter') this.handleUserMessage(this.inTabChatInput, this.inTabChatHistory);
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

        // Sync with standalone inputs
        if (this.providerSelect) this.providerSelect.value = chosenProvider;
        this.updateApiKeyInputForProvider(chosenProvider);

        this.updateProviderBadge();
        const settingsBox = document.getElementById('in-tab-llm-settings-box');
        if (settingsBox) settingsBox.style.display = 'none';

        let providerName = 'Offline Expert System';
        if (chosenProvider === 'gemini') providerName = 'Google Gemini 1.5/2.0 Flash';
        if (chosenProvider === 'openai') providerName = 'OpenAI GPT-4o';

        this.addChatMessage(`Co-Pilot configured: Connected to <strong>${providerName}</strong> with live quantum circuit telemetry injection.`, 'ai', this.inTabChatHistory);
      });
    }

    // In-Tab Prompt Chips
    document.querySelectorAll('.in-tab-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-ai-query');
        if (query) {
          this.respondToPrompt(query, this.inTabChatHistory);
        }
      });
    });

    // Pre-set prompt chips
    const promptChips = document.querySelectorAll('.prompt-chip');
    promptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        if (query) {
          this.respondToPrompt(query);
        }
      });
    });
  }

  updateProviderBadge() {
    const pills = [this.providerPill, this.inTabProviderPill].filter(Boolean);
    pills.forEach(pill => {
      if (this.llmProvider === 'gemini') {
        if (this.geminiApiKey) {
          pill.className = 'llm-pill gemini';
          pill.textContent = 'Gemini Flash 🟢';
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
        pill.textContent = 'Offline Expert (797 chunks)';
      }
    });
  }

  onCircuitChanged(grid, probs, blochCoords, selectedQubit) {
    const explanation = this.analyzeCircuit(grid, probs, blochCoords, selectedQubit);
    this.renderExplanation(explanation);
  }

  // Deterministic local real-time circuit state analyzer for the live explanation card
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
          details: "Notice that there are only two possible outcomes: both are 0 (|000⟩) or both are 1. Measuring Qubit 0 here instantly determines Qubit 1's state, even if separated by light-years."
        };
      } else {
        return {
          title: "Maximally Entangled Bell Pair |Φ⁺⟩",
          summary: "Statevector: |ψ⟩ = 1/√2 (|00⟩ + |11⟩) ⊗ |0⟩₂.",
          details: "The reduced density matrix for Qubit 0 has Tr(ρ₀²) = 0.5 < 1, confirming it is in a mixed state locally despite the global system being pure. Von Neumann entropy S = 1 bit (maximum entanglement)."
        };
      }
    }

    if (hasH0 && !hasCX && nonZeroProbs.length === 2) {
      if (this.mode === 'beginner') {
        return {
          title: "Equal Superposition (Quantum Coin Flip)",
          summary: "Qubit 0 is now in a 50/50 superposition.",
          details: "Unlike a classical bit that is either 0 or 1, Qubit 0 behaves like a spinning coin in mid-air. It exists in both states simultaneously until observed! On the Bloch Sphere, the vector has rotated to the equator (+X axis)."
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
          details: "This is the quantum equivalent of a classical NOT gate. On the Bloch Sphere, the state vector has flipped 180 degrees from the North Pole (|0⟩) straight down to the South Pole (|1⟩)."
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

  // Extract live circuit telemetry to inject into LLM prompts
  buildCircuitTelemetry() {
    let telemetry = "Live Circuit Telemetry from Student's Browser:\n";

    if (window.circuitUI && window.circuitUI.grid) {
      const grid = window.circuitUI.grid;
      telemetry += "- Gate Placements:\n";
      for (let q = 0; q < 3; q++) {
        const gates = [];
        for (let col = 0; col < 6; col++) {
          if (grid[q][col]) gates.push(`Col ${col + 1}: ${grid[q][col]}`);
        }
        telemetry += `  Wire q${q}: ${gates.length > 0 ? gates.join(', ') : 'Empty wire (|0⟩)'}\n`;
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

    telemetry += `- Student's Selected Learning Mode: ${this.mode === 'academic' ? 'Academic (Math / Dirac Formalism)' : 'Intuitive (ELI5 / Real-World Analogies)'}\n`;
    return telemetry;
  }

  // Semantic / keyword chunk retriever for RAG grounding from D:\Ananta-Quantum-Library corpus
  retrieveRelevantLiterature(query, maxResults = 2) {
    if (typeof window === 'undefined' || !Array.isArray(window.QUANTUM_LITERATURE_CORPUS)) {
      return [];
    }

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

  async handleUserMessage(inputEl = this.chatInput, historyEl = this.chatHistory) {
    const text = inputEl ? inputEl.value.trim() : '';
    if (!text) return;

    this.addChatMessage(text, 'user', historyEl);
    if (inputEl) inputEl.value = '';

    // Show typing indicator
    const typingId = this.showTypingIndicator(historyEl);

    try {
      let reply = '';
      if (this.llmProvider === 'gemini' && this.geminiApiKey) {
        reply = await this.callGeminiAPI(text);
      } else if (this.llmProvider === 'openai' && this.openaiApiKey) {
        reply = await this.callOpenAIAPI(text);
      } else {
        // Fallback to local expert system
        await new Promise(r => setTimeout(r, 380));
        reply = this.generateLocalAIResponse(text);
      }

      this.removeTypingIndicator(typingId);
      this.addChatMessage(reply, 'ai', historyEl);
    } catch (err) {
      console.error('LLM API Error:', err);
      this.removeTypingIndicator(typingId);
      const fallbackReply = this.generateLocalAIResponse(text);
      const errorNote = `<div class="llm-error-tag">⚠️ Cloud LLM Request Failed (${err.message}). Using Offline Quantum Knowledge System:</div>`;
      this.addChatMessage(errorNote + fallbackReply, 'ai', historyEl);
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

  // Call Google Gemini API (Gemini 1.5 / 2.0 Flash) with RAG grounding & versatile intelligence
  async callGeminiAPI(userQuery) {
    const telemetry = this.buildCircuitTelemetry();
    const retrievedDocs = this.retrieveRelevantLiterature(userQuery, 2);
    let ragGrounding = "";
    if (retrievedDocs.length > 0 && userQuery.trim().length > 3) {
      ragGrounding = "\n\nRelevant Quantum Library Excerpts:\n" +
        retrievedDocs.map(d => `Source: ${d.doc}\nExcerpt: ${d.snippet}`).join('\n\n');
    }

    const systemPrompt = `You are Ananta AI, a helpful, brilliant, and versatile AI assistant with deep mastery in Quantum Computing, Physics, Computer Science, Software Engineering, and general problem solving.

Core Behavior:
1. Answer ANY question or conversational message naturally, accurately, and helpfully, whether it is about quantum computing, general science, programming, math, everyday topics, or casual greetings.
2. Greetings & Casual Chat: If the user greets you (e.g., "hi", "hello", "hey", "how are you", "what's up"), reply warmly, naturally, and conversationally in 1-2 friendly sentences. NEVER say "that's a great question" to a simple greeting.
3. Quantum & Physics Inquiries: Provide deep, intuitive, and accurate explanations. If the student's learning mode is "Intuitive (ELI5)", use vivid physical analogies. If "Academic (Dirac)", provide rigorous bra-ket Dirac notation, matrix algebra, and formal derivations.
4. Circuit Telemetry: Reference the live circuit state below when relevant to the user's inquiry. If the user asks about general or non-quantum topics, answer directly without forcing circuit references.
5. Formatting: Use clean markdown with bold highlights and code blocks. Never use em dashes anywhere (use hyphens, colons, or parentheses instead).

${telemetry}${ragGrounding}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${encodeURIComponent(this.geminiApiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [
              { text: userQuery }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty response received from Gemini');

    let formatted = this.formatMarkdown(rawText);
    if (retrievedDocs.length > 0 && userQuery.trim().length > 3) {
      formatted += `<div class="rag-citation-box"><span class="rag-citation-title">📚 Grounded in Quantum Literature:</span>${retrievedDocs.map(d => d.doc).join(' • ')}</div>`;
    }
    return formatted;
  }

  // Call OpenAI API (GPT-4o / GPT-4o-mini) with versatile intelligence & RAG grounding
  async callOpenAIAPI(userQuery) {
    const telemetry = this.buildCircuitTelemetry();
    const retrievedDocs = this.retrieveRelevantLiterature(userQuery, 2);
    let ragGrounding = "";
    if (retrievedDocs.length > 0 && userQuery.trim().length > 3) {
      ragGrounding = "\n\nRelevant Quantum Library Excerpts:\n" +
        retrievedDocs.map(d => `Source: ${d.doc}\nExcerpt: ${d.snippet}`).join('\n\n');
    }

    const systemPrompt = `You are Ananta AI, a helpful, brilliant, and versatile AI assistant with deep mastery in Quantum Computing, Physics, Computer Science, and general problem solving.

Core Behavior:
1. Answer ANY question or conversational message naturally, accurately, and helpfully, whether it is about quantum computing, general science, programming, math, everyday topics, or casual greetings.
2. Greetings & Casual Chat: If the user greets you (e.g., "hi", "hello", "hey", "how are you"), reply warmly and conversationally in 1-2 friendly sentences. NEVER say "that's a great question" to a simple greeting.
3. Quantum & Physics Queries: Provide insightful explanations. If learning mode is "Intuitive (ELI5)", use vivid analogies. If "Academic (Dirac)", use rigorous bra-ket mathematics and derivations.
4. Active Circuit Context: Reference the live circuit state when relevant. If the user asks about general or non-quantum topics, answer directly without forcing circuit references.
5. Formatting: Use clean markdown styling. Never use em dashes anywhere (use hyphens, colons, or parentheses instead).

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
        temperature: 0.7,
        max_tokens: 800
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
      formatted += `<div class="rag-citation-box"><span class="rag-citation-title">📚 Grounded in Quantum Literature:</span>${retrievedDocs.map(d => d.doc).join(' • ')}</div>`;
    }
    return formatted;
  }

  // Dynamic offline response — handles greetings, identity, quantum research DB, and fallbacks
  generateLocalAIResponse(query) {
    const qTrim = (query || '').trim();
    const qLow = qTrim.toLowerCase();

    // ── Check 0: Natural greetings and small talk ──
    const greetingMatch = /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening|day)|sup|yo|howdy)\b/i.test(qLow);
    if (greetingMatch) {
      return `<strong>Hello!</strong> 👋 I am your Ananta AI Assistant. I can help answer any questions across quantum mechanics, algorithms, coding, mathematics, or physics. What would you like to explore or work on today?`;
    }

    const identityMatch = /^(who\s+are\s+you|what\s+can\s+you\s+do|what\s+is\s+this|help)\b/i.test(qLow);
    if (identityMatch) {
      return `<strong>I am Ananta AI</strong> — your intelligent research and circuit assistant.<br><br>` +
        `• <strong>Quantum Circuit Synthesis:</strong> Ask about quantum gates (H, X, CNOT, Phase), Bell states, Grover's search, Shor's algorithm, or live circuit telemetry.<br>` +
        `• <strong>Physics & Intuition:</strong> Ask about superposition, entanglement, decoherence, or tunneling.<br>` +
        `• <strong>Any Question:</strong> For full unconstrained web/AI responses across all general topics, connect your Gemini or OpenAI API key in the ⚙️ settings drawer!`;
    }

    // ── Step 1: Search the research-grade QuantumKnowledgeEngine ──────────────
    if (window.QuantumKnowledgeEngine) {
      try {
        const ke = new window.QuantumKnowledgeEngine();
        const topic = ke.search(query);
        if (topic) {
          const apps = (topic.applications && topic.applications.length > 0)
            ? `<strong>Applications:</strong><ul>${topic.applications.map(a => `<li>${a}</li>`).join('')}</ul>`
            : '';
          const mathBlock = topic.math
            ? `<br><strong>Formula:</strong><pre class="ai-code-pre">${topic.math}</pre>`
            : '';
          const intuition = topic.intuition
            ? `<br><em style="color:var(--text-dim)">${topic.intuition}</em>`
            : '';

          return `<strong>${topic.title}</strong> <em>[${topic.category}]</em><br><br>${topic.definition}${mathBlock}${intuition}<br>${apps}<small style="color:var(--google-blue)">Reference: ${topic.furtherReading || 'Nielsen & Chuang, Cambridge University Press'}</small>`;
        }
      } catch (e) { console.warn('KE error:', e); }
    }

    // ── Step 2: RAG retrieval from D:\Ananta-Quantum-Library corpus ───────────
    if (qTrim.length > 3) {
      const docs = this.retrieveRelevantLiterature(query, 2);
      if (docs.length > 0) {
        const primary = docs[0];
        const secondary = docs[1];
        let out = `<strong>From your Quantum Library (${primary.doc}):</strong><br><br>${primary.full.slice(0, 900)}`;
        if (secondary) {
          out += `<br><br><strong>Also from ${secondary.doc}:</strong><br>${secondary.snippet.slice(0, 400)}`;
        }
        out += `<br><br><div class="rag-citation-box"><span class="rag-citation-title">📚 Grounded in your literature corpus (D:\\Ananta-Quantum-Library)</span>${docs.map(d => d.doc).join(' • ')}</div>`;
        return out;
      }
    }

    // ── Step 3: Live circuit-aware dynamic response ───────────────────────────
    let circuitContext = '';
    if (window.circuitUI && window.circuitUI.grid) {
      const grid = window.circuitUI.grid;
      const allGates = grid.flat().filter(Boolean);
      const gateNames = [...new Set(allGates)];
      if (allGates.length > 0) {
        circuitContext = ` Your current circuit has <strong>${allGates.length} gate${allGates.length > 1 ? 's' : ''}</strong> placed: <code>${gateNames.join(', ')}</code>.`;
      }
    }

    let stateContext = '';
    if (window.circuitUI && window.circuitUI.engine) {
      const engine = window.circuitUI.engine;
      const dirac = engine.getDiracNotation ? engine.getDiracNotation() : '';
      if (dirac && dirac !== '|000⟩') {
        stateContext = ` Live statevector: <code>${dirac}</code>.`;
      }
    }

    // Offer algorithm zoo if query matches an algorithm-like keyword
    let algoHint = '';
    if (window.QuantumKnowledgeEngine) {
      try {
        const ke = new window.QuantumKnowledgeEngine();
        if (ke.algorithmZoo) {
          const algoMatch = Object.values(ke.algorithmZoo).find(a =>
            a.name && a.name.toLowerCase().includes(qLow.split(' ')[0])
          );
          if (algoMatch) {
            algoHint = `<br><br><strong>Closest Algorithm Match: ${algoMatch.name}</strong><br>` +
              `Speedup: ${algoMatch.speedup || 'N/A'} | Class: ${algoMatch.class || 'N/A'}<br>${algoMatch.description || ''}`;
          }
        }
      } catch (e) {}
    }

    return `<strong>Ananta AI Assistant</strong> — answering query: <em>"${query}"</em>.<br><br>` +
      `No specific quantum match was found in the offline library for this search.${circuitContext}${stateContext}${algoHint}<br><br>` +
      `<strong>Tips:</strong><ul>` +
      `<li>Connect a <strong>Gemini</strong> or <strong>OpenAI</strong> API key in the ⚙️ settings drawer to ask <em>any</em> general or advanced question.</li>` +
      `<li>Or ask about specific quantum topics: <em>superposition, entanglement, VQE, Shor's algorithm, Grover's search, Bloch sphere</em>.</li></ul>`;
  }

  showTypingIndicator(targetHistory = this.chatHistory) {
    if (!targetHistory) targetHistory = this.inTabChatHistory || this.chatHistory;
    if (!targetHistory) return null;
    const id = 'typing-' + Date.now();
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble chat-ai chat-typing';
    typingBubble.id = id;
    typingBubble.innerHTML = `
      <div class="chat-sender-label">Ananta Quantum Co-Pilot</div>
      <div class="typing-dots">
        <span></span><span></span><span></span>
        <em class="typing-hint">Analyzing circuit telemetry & retrieving quantum literature...</em>
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
    msg.innerHTML = `
      <div class="chat-sender-label">${sender === 'ai' ? 'Ananta Quantum Co-Pilot' : 'You'}</div>
      <div class="chat-text">${content}</div>
    `;
    targetHistory.appendChild(msg);
    targetHistory.scrollTop = targetHistory.scrollHeight;
  }

  formatMarkdown(raw) {
    if (!raw) return '';
    let out = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n- /g, '<br>• ')
      .replace(/\n/g, '<br>');
    return out;
  }
}

window.QuantaAITutor = QuantaAITutor;
