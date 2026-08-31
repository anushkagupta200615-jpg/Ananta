/**
 * QuantaAI - Intelligent Quantum Tutor & Real-Time Circuit Explainer
 * Integrates frontier Cloud LLMs (Google Gemini 1.5/2.0 Flash & OpenAI GPT-4o)
 * with real-time quantum circuit telemetry and in-browser deterministic expert fallback.
 */

class QuantaAITutor {
  constructor() {
    this.mode = 'beginner'; // 'beginner' (Intuitive ELI5) or 'academic' (Dirac / Math)
    this.explanationBox = document.getElementById('ai-explanation-text');
    this.chatHistory = document.getElementById('ai-chat-history');
    this.chatInput = document.getElementById('ai-chat-input');
    this.sendBtn = document.getElementById('btn-send-ai');
    this.modeToggle = document.getElementById('ai-mode-toggle');

    // LLM Provider Configuration
    this.llmProvider = localStorage.getItem('quanta_llm_provider') || 'local'; // 'gemini', 'openai', 'local'
    this.geminiApiKey = localStorage.getItem('quanta_gemini_api_key') || '';
    this.openaiApiKey = localStorage.getItem('quanta_openai_api_key') || '';
    this.geminiModel = 'gemini-1.5-flash';

    this.initLLMSettingsDOM();
    this.bindEvents();
    this.updateProviderBadge();
  }

  initLLMSettingsDOM() {
    this.settingsDrawer = document.getElementById('llm-settings-drawer');
    this.toggleSettingsBtn = document.getElementById('btn-toggle-llm-settings');
    this.providerSelect = document.getElementById('llm-provider-select');
    this.apiKeyInput = document.getElementById('llm-api-key-input');
    this.saveSettingsBtn = document.getElementById('btn-save-llm-settings');
    this.toggleVisibilityBtn = document.getElementById('btn-toggle-api-key-visibility');
    this.providerPill = document.getElementById('llm-active-pill');
    this.getKeyLink = document.getElementById('llm-get-key-link');
    this.apiKeyGroup = document.getElementById('api-key-group');

    // Populate saved values
    if (this.providerSelect) {
      this.providerSelect.value = this.llmProvider;
      this.updateApiKeyInputForProvider(this.llmProvider);
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

    // Chat Send Handlers
    if (this.sendBtn && this.chatInput) {
      this.sendBtn.addEventListener('click', () => this.handleUserMessage());
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleUserMessage();
      });
    }

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
    if (!this.providerPill) return;

    if (this.llmProvider === 'gemini') {
      if (this.geminiApiKey) {
        this.providerPill.className = 'llm-pill gemini';
        this.providerPill.textContent = 'Gemini Flash 🟢';
      } else {
        this.providerPill.className = 'llm-pill warning';
        this.providerPill.textContent = 'Gemini (Key Missing)';
      }
    } else if (this.llmProvider === 'openai') {
      if (this.openaiApiKey) {
        this.providerPill.className = 'llm-pill openai';
        this.providerPill.textContent = 'GPT-4o 🟢';
      } else {
        this.providerPill.className = 'llm-pill warning';
        this.providerPill.textContent = 'OpenAI (Key Missing)';
      }
    } else {
      this.providerPill.className = 'llm-pill local';
      this.providerPill.textContent = 'Offline Expert';
    }
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

  async handleUserMessage() {
    const text = this.chatInput.value.trim();
    if (!text) return;

    this.addChatMessage(text, 'user');
    this.chatInput.value = '';

    // Show typing indicator
    const typingId = this.showTypingIndicator();

    try {
      let reply = '';
      if (this.llmProvider === 'gemini' && this.geminiApiKey) {
        reply = await this.callGeminiAPI(text);
      } else if (this.llmProvider === 'openai' && this.openaiApiKey) {
        reply = await this.callOpenAIAPI(text);
      } else {
        // Fallback to local expert system
        await new Promise(r => setTimeout(r, 450));
        reply = this.generateLocalAIResponse(text);
      }

      this.removeTypingIndicator(typingId);
      this.addChatMessage(reply, 'ai');
    } catch (err) {
      console.error('LLM API Error:', err);
      this.removeTypingIndicator(typingId);
      // Informative fallback
      const fallbackReply = this.generateLocalAIResponse(text);
      const errorNote = `<div class="llm-error-tag">⚠️ Cloud LLM Request Failed (${err.message}). Using Offline Quantum Expert System:</div>`;
      this.addChatMessage(errorNote + fallbackReply, 'ai');
    }
  }

  async respondToPrompt(promptText) {
    this.addChatMessage(promptText, 'user');
    const typingId = this.showTypingIndicator();

    try {
      let reply = '';
      if (this.llmProvider === 'gemini' && this.geminiApiKey) {
        reply = await this.callGeminiAPI(promptText);
      } else if (this.llmProvider === 'openai' && this.openaiApiKey) {
        reply = await this.callOpenAIAPI(promptText);
      } else {
        await new Promise(r => setTimeout(r, 350));
        reply = this.generateLocalAIResponse(promptText);
      }
      this.removeTypingIndicator(typingId);
      this.addChatMessage(reply, 'ai');
    } catch (err) {
      this.removeTypingIndicator(typingId);
      const fallbackReply = this.generateLocalAIResponse(promptText);
      this.addChatMessage(fallbackReply, 'ai');
    }
  }

  // Call Google Gemini API (Gemini 1.5 / 2.0 Flash)
  async callGeminiAPI(userQuery) {
    const telemetry = this.buildCircuitTelemetry();
    const systemPrompt = `You are QuantaAI, a world-class Quantum Computing Research Mentor and Educator.
You assist university students and quantum software developers in mastering quantum mechanics, circuit synthesis, algorithm design, and hardware physics.
${telemetry}

Guidelines:
- If the mode is "Intuitive (ELI5)", use vivid, memorable physical analogies (e.g., spinning coins, water wave interference, polarized sunglasses).
- If the mode is "Academic", provide rigorous Dirac bra-ket notation, unitary matrices, and density matrix derivations.
- Connect your explanation directly to the student's active circuit state when relevant.
- NEVER use em dashes anywhere in your response. Use hyphens, colons, or parentheses instead.
- Keep responses concise, clear, and structured with bold highlights and code tags.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${encodeURIComponent(this.geminiApiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nStudent's Question:\n${userQuery}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600
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

    return this.formatMarkdown(rawText);
  }

  // Call OpenAI API (GPT-4o / GPT-4o-mini)
  async callOpenAIAPI(userQuery) {
    const telemetry = this.buildCircuitTelemetry();
    const systemPrompt = `You are QuantaAI, an expert Quantum Computing Research Mentor and Educator.
${telemetry}
Guidelines:
- Explain clearly with rich conceptual clarity.
- NEVER use em dashes anywhere in your response.
- Format with clean HTML (strong, code, ul/li).`;

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
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) throw new Error('Empty response from OpenAI');

    return this.formatMarkdown(rawText);
  }

  // Deterministic local quantum expert response generator (100% offline, zero-latency)
  generateLocalAIResponse(query) {
    const q = query.toLowerCase();

    if (q.includes('alpha') || q.includes('beta') || q.includes('amplitude')) {
      return `<strong>Quantum State Amplitudes (α and β):</strong><br><br>
In a qubit state <code>|ψ⟩ = α|0⟩ + β|1⟩</code>:
<ul>
  <li><strong>α (Alpha)</strong> is the complex probability amplitude of measuring the qubit in state <code>|0⟩</code>. The measurement probability is <code>P(0) = |α|²</code>.</li>
  <li><strong>β (Beta)</strong> is the complex probability amplitude of measuring state <code>|1⟩</code>. The measurement probability is <code>P(1) = |β|²</code>.</li>
  <li><strong>Normalization Rule:</strong> <code>|α|² + |β|² = 1</code> (total probability is always 100%).</li>
  <li><strong>Complex Interference:</strong> Unlike classical probabilities, α and β are complex numbers (having both magnitude and phase angle <code>e^(iφ)</code>), allowing them to interfere constructively or destructively to give quantum computers their exponential advantage!</li>
</ul>`;
    }

    if (q.includes('superposition')) {
      return `<strong>Superposition</strong> is the ability of a quantum system to exist in a linear combination of basis states simultaneously until measurement.<br><br>
In classical computing, a bit is strictly 0 or 1. In quantum computing, a qubit is defined as: <code>|ψ⟩ = α|0⟩ + β|1⟩</code>, where |α|² and |β|² represent measurement probabilities. Applying a <strong>Hadamard (H)</strong> gate rotates a state into equal superposition!`;
    }

    if (q.includes('bell') || q.includes('entangle')) {
      return `<strong>Quantum Entanglement</strong> occurs when two or more qubits become correlated such that the state of one cannot be described independently of the others.<br><br>
In this simulator, you create a <strong>Bell State</strong> by placing a <strong>Hadamard (H)</strong> gate on Qubit 0, followed by a <strong>CNOT (CX)</strong> gate targeting Qubit 1. This yields <code>1/√2 (|00⟩ + |11⟩)</code>. Measuring Qubit 0 instantly determines Qubit 1, regardless of spatial distance.`;
    }

    if (q.includes('grover')) {
      return `<strong>Grover's Algorithm</strong> delivers a quadratic speedup for searching an unsorted database of N items in O(√N) oracle queries compared to classical O(N).<br><br>
It works through two alternating operations:
1. <strong>Quantum Oracle:</strong> Flips the quantum phase (negative sign) of the target state.
2. <strong>Diffusion Operator:</strong> Inverts all amplitudes about their mean, causing destructive interference on wrong states and amplifying the target to ~100% probability.`;
    }

    if (q.includes('bloch') || q.includes('sphere')) {
      return `The <strong>Bloch Sphere</strong> is a geometric 3D representation of a single qubit's state space:<br><br>
- <strong>North Pole:</strong> Ground state |0⟩.<br>
- <strong>South Pole:</strong> Excited state |1⟩.<br>
- <strong>Equator:</strong> Equal superposition states with varying relative phases (|+⟩, |-⟩, |+i⟩, |-i⟩).<br>
- Single-qubit unitary gates correspond directly to 3D spatial rotations around the X, Y, or Z axes!`;
    }

    if (q.includes('hadamard') || q.includes('h gate')) {
      return `The <strong>Hadamard (H) gate</strong> is the fundamental building block of quantum computation. It transforms computational basis states into superpositions:<br><br>
- <code>H|0⟩ = (|0⟩ + |1⟩)/√2 = |+⟩</code><br>
- <code>H|1⟩ = (|0⟩ - |1⟩)/√2 = |-⟩</code><br>
Hadamard is its own inverse: applying H twice returns the qubit to its original state!`;
    }

    if (q.includes('teleport')) {
      return `<strong>Quantum Teleportation</strong> transmits an unknown quantum state between two parties using pre-shared entanglement and 2 classical bits.<br><br>
Alice performs a Bell measurement on her qubit and half of an entangled pair, sends the 2 classical measurement outcomes to Bob, who applies Pauli corrections (X, Z) to reconstruct the exact state on his qubit.`;
    }

    if (q.includes('decoherence') || q.includes('noise')) {
      return `<strong>Quantum Decoherence</strong> is the decay of quantum superpositions into classical probability distributions caused by thermal and electromagnetic noise in the environment.<br><br>
In our <strong>Hardware Physics Lab</strong>, you can simulate realistic T₁ relaxation, T₂ dephasing, and test Dynamic Decoupling sequences to mitigate these physical errors.`;
    }

    return `That is a great quantum computing question. In this studio, every gate you place transforms the statevector amplitudes and rotates the 3D Bloch sphere. To explore how algorithms leverage interference and entanglement, check the <strong>Algorithm Labs</strong> tab or ask about specific gates like H, X, Z, or CNOT!`;
  }

  showTypingIndicator() {
    if (!this.chatHistory) return null;
    const id = 'typing-' + Date.now();
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble chat-ai chat-typing';
    typingBubble.id = id;
    typingBubble.innerHTML = `
      <div class="chat-sender-label">QuantaAI Co-Pilot</div>
      <div class="typing-dots">
        <span></span><span></span><span></span>
        <em class="typing-hint">Analyzing circuit telemetry & generating explanation...</em>
      </div>
    `;
    this.chatHistory.appendChild(typingBubble);
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    return id;
  }

  removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  addChatMessage(content, sender) {
    if (!this.chatHistory) return;
    const msg = document.createElement('div');
    msg.className = `chat-bubble chat-${sender}`;
    msg.innerHTML = `
      <div class="chat-sender-label">${sender === 'ai' ? 'QuantaAI Co-Pilot' : 'You'}</div>
      <div class="chat-text">${content}</div>
    `;
    this.chatHistory.appendChild(msg);
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
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
