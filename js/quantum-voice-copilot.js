/**
 * Ananta Quantum Studio — Live AI Voice & Video Camera Quantum Copilot
 * 
 * Features:
 *  - Real-time webcam picture-in-picture video stream (getUserMedia).
 *  - Continuous Speech-to-Circuit parsing via Web Speech API (webkitSpeechRecognition).
 *  - High-precision NLP intent matcher supporting single-qubit gates, 2-qubit CNOTs,
 *    quantum algorithms (Bell state, GHZ, Teleportation, Grover, QFT), and circuit controls.
 *  - Real-time HUD with live transcription subtitles, action feedback pill, and TTS audio synthesis.
 *  - Animated audio waveform visualizer fallback when webcam is unavailable or permissions denied.
 *  - Text command input fallback for quiet environments.
 */

class QuantumVoiceCopilot {
  constructor() {
    this.isActive = false;
    this.isCameraOn = false;
    this.isListening = false;
    this.speechSynthesisEnabled = true;
    this.mediaStream = null;
    this.recognition = null;
    this.waveAnimId = null;
    this.wavePhase = 0;
    this.recentActions = [];

    this._bindEvents();
  }

  _bindEvents() {
    // Expose global singleton
    window.quantumVoiceCopilot = this;
  }

  toggle() {
    if (this.isActive) {
      this.close();
    } else {
      this.open();
    }
  }

  async open() {
    const hud = document.getElementById('quantum-copilot-hud');
    if (!hud) return;

    this.isActive = true;
    hud.style.display = 'flex';
    hud.classList.add('copilot-hud-active');

    // Update trigger button active state in Composer
    const btn = document.getElementById('btn-voice-camera');
    if (btn) btn.classList.add('active');

    // 1. Start Webcam (with fallback)
    await this.startCamera();

    // 2. Start Speech Recognition
    this.startListening();

    this._setSubtitle('Ready! Say: "Make Bell state", "Add Hadamard on 0", or "Run simulation"');
    this._speak('Quantum Voice and Vision Copilot active. What circuit would you like to build?');
  }

  close() {
    this.isActive = false;
    const hud = document.getElementById('quantum-copilot-hud');
    if (hud) {
      hud.style.display = 'none';
      hud.classList.remove('copilot-hud-active');
    }

    const btn = document.getElementById('btn-voice-camera');
    if (btn) btn.classList.remove('active');

    this.stopCamera();
    this.stopListening();
  }

  async startCamera() {
    const videoEl = document.getElementById('copilot-video-feed');
    const canvas = document.getElementById('copilot-wave-canvas');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: false // audio is captured by SpeechRecognition engine
      });

      this.mediaStream = stream;
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.style.display = 'block';
        videoEl.play().catch(() => {});
      }
      if (canvas) canvas.style.display = 'none';
      this.isCameraOn = true;
      this._updateCameraBtn(true);
      this._cancelWaveAnimation();
    } catch (err) {
      console.warn('[QuantumVoiceCopilot] Webcam not available or permission denied:', err);
      this.isCameraOn = false;
      if (videoEl) {
        videoEl.srcObject = null;
        videoEl.style.display = 'none';
      }
      if (canvas) canvas.style.display = 'block';
      this._updateCameraBtn(false);
      this._startWaveAnimation();
    }
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    const videoEl = document.getElementById('copilot-video-feed');
    if (videoEl) {
      videoEl.srcObject = null;
      videoEl.style.display = 'none';
    }
    this.isCameraOn = false;
    this._cancelWaveAnimation();
    this._updateCameraBtn(false);
  }

  toggleCamera() {
    if (this.isCameraOn) {
      this.stopCamera();
      const canvas = document.getElementById('copilot-wave-canvas');
      if (canvas) canvas.style.display = 'block';
      this._startWaveAnimation();
    } else {
      this.startCamera();
    }
  }

  _updateCameraBtn(isOn) {
    const btn = document.getElementById('copilot-btn-cam');
    if (btn) {
      btn.title = isOn ? 'Turn off camera (switch to waveform)' : 'Turn on camera';
      btn.style.opacity = isOn ? '1' : '0.6';
    }
  }

  _startWaveAnimation() {
    this._cancelWaveAnimation();
    const canvas = document.getElementById('copilot-wave-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      this.wavePhase += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark futuristic background
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Multi-sine audio visualizer waves
      const waves = [
        { color: 'rgba(59, 130, 246, 0.5)', freq: 0.02, speed: 1.2, amp: 22 },
        { color: 'rgba(168, 85, 247, 0.6)', freq: 0.03, speed: 1.8, amp: 18 },
        { color: 'rgba(16, 185, 129, 0.7)', freq: 0.04, speed: 2.2, amp: 14 }
      ];

      waves.forEach(w => {
        ctx.beginPath();
        ctx.strokeStyle = w.color;
        ctx.lineWidth = 2;
        const cy = canvas.height / 2;
        for (let x = 0; x < canvas.width; x++) {
          const y = cy + Math.sin(x * w.freq + this.wavePhase * w.speed) * w.amp * (this.isListening ? 1.4 : 0.4);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // AI Avatar orb in center
      ctx.beginPath();
      const orbRadius = 24 + Math.sin(this.wavePhase * 2) * 3;
      ctx.arc(canvas.width / 2, canvas.height / 2, orbRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Voice Copilot Active', canvas.width / 2, canvas.height / 2 + 45);

      this.waveAnimId = requestAnimationFrame(draw);
    };

    draw();
  }

  _cancelWaveAnimation() {
    if (this.waveAnimId) {
      cancelAnimationFrame(this.waveAnimId);
      this.waveAnimId = null;
    }
  }

  startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[QuantumVoiceCopilot] Web Speech API not supported in this browser.');
      this._setSubtitle('Speech recognition not supported in this browser. You can type commands below!');
      this._updateStatus('⌨️ TYPE COMMAND', 'warning');
      return;
    }

    if (this.recognition) {
      try { this.recognition.abort(); } catch (e) {}
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this._updateStatus('🟢 LISTENING', 'listening');
      this._updateMicBtn(true);
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this._processTranscript(text);
        } else {
          interim += text;
        }
      }
      if (interim) {
        this._setSubtitle(`Hearing: "${interim.trim()}..."`);
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        this._setSubtitle('Microphone access blocked. Enable microphone in browser settings or type below.');
        this._updateStatus('⚠️ MIC BLOCKED', 'error');
        this.isListening = false;
        this._updateMicBtn(false);
      } else if (event.error !== 'no-speech') {
        console.warn('[QuantumVoiceCopilot] Speech error:', event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.isActive && this.isListening) {
        // Continuous listening auto-restart
        try {
          this.recognition.start();
        } catch (e) {}
      } else {
        this.isListening = false;
        this._updateStatus('⏸️ MUTED', 'muted');
        this._updateMicBtn(false);
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('[QuantumVoiceCopilot] Failed to start recognition:', e);
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
    this._updateStatus('⏸️ MUTED', 'muted');
    this._updateMicBtn(false);
  }

  toggleMic() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  _updateMicBtn(isOn) {
    const btn = document.getElementById('copilot-btn-mic');
    if (btn) {
      btn.title = isOn ? 'Mute microphone' : 'Unmute microphone';
      btn.style.opacity = isOn ? '1' : '0.6';
    }
  }

  toggleSpeechFeedback() {
    this.speechSynthesisEnabled = !this.speechSynthesisEnabled;
    const btn = document.getElementById('copilot-btn-tts');
    if (btn) {
      btn.title = this.speechSynthesisEnabled ? 'Voice feedback: ON' : 'Voice feedback: OFF';
      btn.style.opacity = this.speechSynthesisEnabled ? '1' : '0.5';
    }
    if (this.speechSynthesisEnabled) {
      this._speak('Voice confirmation enabled.');
    }
  }

  _speak(text) {
    if (!this.speechSynthesisEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }

  _updateStatus(text, type) {
    const pill = document.getElementById('copilot-live-pill');
    if (!pill) return;
    pill.textContent = text;
    pill.className = 'copilot-live-pill copilot-pill-' + type;
  }

  _setSubtitle(text) {
    const el = document.getElementById('copilot-sub-text');
    if (el) el.textContent = text;
  }

  _setActionFeedback(text, isSuccess = true) {
    const box = document.getElementById('copilot-action-box');
    const textEl = document.getElementById('copilot-act-text');
    if (!box || !textEl) return;
    box.style.display = 'flex';
    box.className = 'copilot-action-box ' + (isSuccess ? 'act-success' : 'act-warn');
    textEl.textContent = text;

    // Flash glow on HUD frame
    const hud = document.getElementById('quantum-copilot-hud');
    if (hud) {
      hud.classList.add('copilot-hud-pulse');
      setTimeout(() => hud.classList.remove('copilot-hud-pulse'), 600);
    }
  }

  executeTextCommand() {
    const input = document.getElementById('copilot-text-input');
    if (!input || !input.value.trim()) return;
    const cmd = input.value.trim();
    input.value = '';
    this.executeSpokenCommand(cmd);
  }

  executeSpokenCommand(transcript) {
    this._setSubtitle(`Command: "${transcript}"`);
    this._processTranscript(transcript);
  }

  // -------------------------------------------------------------
  // Natural Language Quantum Circuit Command Parser
  // -------------------------------------------------------------
  _processTranscript(rawText) {
    const text = rawText.toLowerCase().trim();
    if (!text) return;

    console.log('[QuantumVoiceCopilot] Parsing command:', text);
    const ui = window.circuitUI;
    if (!ui) {
      this._setActionFeedback('Circuit UI not loaded yet.', false);
      return;
    }

    // 1. Algorithms & Canonical Presets
    if (/\b(bell\s*state|bell\s*pair|entangle|bell)\b/.test(text)) {
      this._buildBellState();
      return;
    }

    if (/\b(ghz|greenberger|ghz\s*state)\b/.test(text)) {
      this._buildGHZState();
      return;
    }

    if (/\b(teleport|teleportation)\b/.test(text)) {
      this._buildTeleportation();
      return;
    }

    if (/\b(grover|grover's|search\s*algorithm)\b/.test(text)) {
      this._buildGrover();
      return;
    }

    if (/\b(qft|fourier\s*transform|quantum\s*fourier)\b/.test(text)) {
      this._buildQFT();
      return;
    }

    if (/\b(vqe|variational)\b/.test(text)) {
      this._buildVQE();
      return;
    }

    if (/\b(chsh|bell\s*test|inequality)\b/.test(text)) {
      this._buildCHSH();
      return;
    }

    // 2. High-level Circuit Actions
    if (/\b(clear\s*all|clear\s*circuit|reset|reset\s*circuit|wipe|clean|start\s*over)\b/.test(text)) {
      ui.clearCircuit();
      this._setActionFeedback('Cleared entire quantum circuit.');
      this._speak('Circuit reset to ground state.');
      return;
    }

    if (/\b(run\s*simulation|run|simulate|execute|calculate|fire)\b/.test(text)) {
      ui.runInteractiveSimulation();
      this._setActionFeedback('Executed quantum statevector simulation.');
      this._speak('Running quantum simulation.');
      return;
    }

    if (/\b(add\s*qubit|new\s*qubit|more\s*qubits)\b/.test(text)) {
      ui.addQubit();
      this._setActionFeedback(`Added qubit. Register is now ${ui.numQubits} qubits.`);
      this._speak(`Added qubit. Total is now ${ui.numQubits}.`);
      return;
    }

    if (/\b(remove\s*qubit|delete\s*qubit|less\s*qubits)\b/.test(text)) {
      ui.removeQubit();
      this._setActionFeedback(`Removed qubit. Register is now ${ui.numQubits} qubits.`);
      this._speak(`Removed qubit. Total is now ${ui.numQubits}.`);
      return;
    }

    // 3. Two-Qubit CNOT / CX Wiring
    // e.g. "add cnot from 0 to 1", "cnot between 0 and 1", "cnot qubit 0 qubit 1", "controlled not from 0 to 1"
    if (/\b(cnot|cx|controlled\s*not)\b/.test(text)) {
      this._parseAndPlaceCNOT(text);
      return;
    }

    // 4. Two-Qubit SWAP Gate
    if (/\b(swap|exchange)\b/.test(text)) {
      this._parseAndPlaceSWAP(text);
      return;
    }

    // 5. Toffoli / CCX Gate
    if (/\b(toffoli|ccx|controlled\s*controlled\s*not)\b/.test(text)) {
      this._parseAndPlaceToffoli(text);
      return;
    }

    // 6. Single Qubit Gates (H, X, Y, Z, S, T, M)
    const singleGate = this._matchSingleGate(text);
    if (singleGate) {
      const q = this._extractQubit(text);
      const col = this._extractColumn(text, q);
      this._placeSingleGate(singleGate, q, col);
      return;
    }

    // 7. Remove Gate at specific location
    if (/\b(remove|delete|erase|drop)\b/.test(text)) {
      const q = this._extractQubit(text);
      const col = this._extractColumn(text, q, false);
      if (col !== -1) {
        ui.removeGate(q, col);
        this._setActionFeedback(`Removed gate at Qubit ${q}, Column ${col + 1}.`);
        this._speak(`Removed gate on qubit ${q}.`);
        return;
      }
    }

    // Unrecognized intent
    this._setActionFeedback(`Didn't understand "${rawText}". Try: "Make Bell state" or "Add H on 0"`, false);
  }

  // -------------------------------------------------------------
  // Gate & Parameter Helpers
  // -------------------------------------------------------------
  _matchSingleGate(text) {
    if (/\b(hadamard|h\s*gate|letter\s*h)\b/.test(text)) return 'H';
    if (/\b(pauli\s*x|not\s*gate|bit\s*flip|x\s*gate)\b/.test(text)) return 'X';
    if (/\b(pauli\s*y|y\s*gate)\b/.test(text)) return 'Y';
    if (/\b(pauli\s*z|phase\s*flip|z\s*gate)\b/.test(text)) return 'Z';
    if (/\b(s\s*gate|phase\s*gate)\b/.test(text)) return 'S';
    if (/\b(t\s*gate|pi\s*over\s*8)\b/.test(text)) return 'T';
    if (/\b(measure|measurement|meter)\b/.test(text)) return 'M';
    return null;
  }

  _extractQubit(text) {
    // Look for explicit "qubit 0", "q0", "line 1", "zero", "one", etc.
    const patterns = [
      { regex: /\b(?:qubit|q|line|wire|register)\s*([0-7])\b/, parse: m => parseInt(m[1], 10) },
      { regex: /\b(?:qubit|q|line|wire|register)\s*(zero|one|two|three|four|five|six|seven)\b/, parse: m => this._wordToNum(m[1]) },
      { regex: /\b(first|1st)\s*(?:qubit|line|wire)?\b/, parse: () => 0 },
      { regex: /\b(second|2nd)\s*(?:qubit|line|wire)?\b/, parse: () => 1 },
      { regex: /\b(third|3rd)\s*(?:qubit|line|wire)?\b/, parse: () => 2 },
      { regex: /\b(fourth|4th)\s*(?:qubit|line|wire)?\b/, parse: () => 3 },
      { regex: /\bon\s*([0-7])\b/, parse: m => parseInt(m[1], 10) },
      { regex: /\bon\s*(zero|one|two|three|four|five|six|seven)\b/, parse: m => this._wordToNum(m[1]) }
    ];

    for (const p of patterns) {
      const match = text.match(p.regex);
      if (match) {
        const val = p.parse(match);
        if (val >= 0 && val < (window.circuitUI?.numQubits || 3)) return val;
      }
    }
    return 0; // default to qubit 0
  }

  _extractColumn(text, qubit, findEmptyIfMissing = true) {
    const colMatch = text.match(/\b(?:column|col|slot|step)\s*(\d+)\b/);
    if (colMatch) {
      return Math.max(0, parseInt(colMatch[1], 10) - 1);
    }
    if (!findEmptyIfMissing) return -1;

    // Find first empty column on this qubit
    const ui = window.circuitUI;
    if (ui && ui.grid && ui.grid[qubit]) {
      for (let c = 0; c < ui.numCols; c++) {
        if (!ui.grid[qubit][c]) return c;
      }
    }
    return 0;
  }

  _wordToNum(word) {
    const map = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
    return map[word] !== undefined ? map[word] : 0;
  }

  _placeSingleGate(gateName, qubit, col) {
    const ui = window.circuitUI;
    if (!ui) return;

    ui.placeGate(gateName, qubit, col);
    const gateFullNames = {
      H: 'Hadamard (H)',
      X: 'Pauli-X (Bit-flip)',
      Y: 'Pauli-Y',
      Z: 'Pauli-Z (Phase-flip)',
      S: 'Phase Gate (S)',
      T: 'T-Gate (π/8)',
      M: 'Measurement'
    };

    const name = gateFullNames[gateName] || gateName;
    this._setActionFeedback(`Placed ${name} on Qubit ${qubit} (Col ${col + 1}).`);
    this._speak(`Placed ${name} on qubit ${qubit}.`);
  }

  _parseAndPlaceCNOT(text) {
    const ui = window.circuitUI;
    if (!ui) return;

    // Extract numbers in order of appearance
    const nums = [];
    const numMatches = text.matchAll(/\b([0-7]|zero|one|two|three|four|five|six|seven)\b/g);
    for (const m of numMatches) {
      const n = isNaN(m[1]) ? this._wordToNum(m[1]) : parseInt(m[1], 10);
      if (n >= 0 && n < ui.numQubits) {
        nums.push(n);
      }
    }

    let ctrlQ = 0;
    let tgtQ = 1;
    if (nums.length >= 2) {
      ctrlQ = nums[0];
      tgtQ = nums[1];
    } else if (nums.length === 1) {
      ctrlQ = nums[0];
      tgtQ = (ctrlQ + 1) % ui.numQubits;
    }

    // Find column where both qubits are empty
    let col = -1;
    for (let c = 0; c < ui.numCols; c++) {
      if (!ui.grid[ctrlQ][c] && !ui.grid[tgtQ][c]) {
        col = c;
        break;
      }
    }
    if (col === -1) col = 0;

    ui.grid[ctrlQ][col] = 'CX_CTRL';
    ui.grid[tgtQ][col] = 'CX_TGT';
    ui.renderGrid();
    ui.updateSimulation();

    // Trigger shockwave animation on placed gates
    const slot1 = document.getElementById(`slot-${ctrlQ}-${col}`);
    const slot2 = document.getElementById(`slot-${tgtQ}-${col}`);
    if (slot1) slot1.classList.add('gate-shockwave');
    if (slot2) slot2.classList.add('gate-shockwave');
    setTimeout(() => {
      if (slot1) slot1.classList.remove('gate-shockwave');
      if (slot2) slot2.classList.remove('gate-shockwave');
    }, 600);

    this._setActionFeedback(`Wired CNOT: Control Q${ctrlQ} ➔ Target Q${tgtQ} (Col ${col + 1}).`);
    this._speak(`Added CNOT from qubit ${ctrlQ} to qubit ${tgtQ}.`);
  }

  _parseAndPlaceSWAP(text) {
    const ui = window.circuitUI;
    if (!ui) return;
    const nums = [];
    const numMatches = text.matchAll(/\b([0-7]|zero|one|two|three|four|five|six|seven)\b/g);
    for (const m of numMatches) {
      const n = isNaN(m[1]) ? this._wordToNum(m[1]) : parseInt(m[1], 10);
      if (n >= 0 && n < ui.numQubits) nums.push(n);
    }
    const q1 = nums[0] !== undefined ? nums[0] : 0;
    const q2 = nums[1] !== undefined ? nums[1] : 1;

    let col = -1;
    for (let c = 0; c < ui.numCols; c++) {
      if (!ui.grid[q1][c] && !ui.grid[q2][c]) {
        col = c;
        break;
      }
    }
    if (col === -1) col = 0;

    ui.grid[q1][col] = 'SWAP';
    ui.grid[q2][col] = 'SWAP';
    ui.renderGrid();
    ui.updateSimulation();

    this._setActionFeedback(`Placed SWAP between Qubit ${q1} and Qubit ${q2}.`);
    this._speak(`Placed SWAP gate between qubit ${q1} and qubit ${q2}.`);
  }

  _parseAndPlaceToffoli(text) {
    const ui = window.circuitUI;
    if (!ui) return;
    if (ui.numQubits < 3) {
      ui.addQubit();
    }
    let col = -1;
    for (let c = 0; c < ui.numCols; c++) {
      if (!ui.grid[0][c] && !ui.grid[1][c] && !ui.grid[2][c]) {
        col = c;
        break;
      }
    }
    if (col === -1) col = 0;

    ui.grid[0][col] = 'CX_CTRL';
    ui.grid[1][col] = 'CX_CTRL';
    ui.grid[2][col] = 'CX_TGT';
    ui.renderGrid();
    ui.updateSimulation();

    this._setActionFeedback('Constructed 3-Qubit Toffoli (CCX) gate on Q0, Q1, Q2.');
    this._speak('Added Toffoli gate.');
  }

  // -------------------------------------------------------------
  // Algorithm Preset Builders
  // -------------------------------------------------------------
  _buildBellState() {
    const ui = window.circuitUI;
    if (!ui) return;

    ui.clearCircuit();
    ui.placeGate('H', 0, 0);
    ui.grid[0][1] = 'CX_CTRL';
    ui.grid[1][1] = 'CX_TGT';
    ui.renderGrid();
    ui.updateSimulation();

    this._setActionFeedback('Synthesized Bell State |Φ⁺⟩ = (|00⟩ + |11⟩)/√2.');
    this._speak('Bell state created. Maximally entangled two-qubit pair.');
  }

  _buildGHZState() {
    const ui = window.circuitUI;
    if (!ui) return;

    if (ui.numQubits < 3) {
      ui.addQubit();
    }
    ui.clearCircuit();
    ui.placeGate('H', 0, 0);
    ui.grid[0][1] = 'CX_CTRL';
    ui.grid[1][1] = 'CX_TGT';
    ui.grid[1][2] = 'CX_CTRL';
    ui.grid[2][2] = 'CX_TGT';
    ui.renderGrid();
    ui.updateSimulation();

    this._setActionFeedback('Synthesized 3-Qubit GHZ State |GHZ⟩ = (|000⟩ + |111⟩)/√2.');
    this._speak('Three-qubit GHZ entangled state created.');
  }

  _buildTeleportation() {
    const ui = window.circuitUI;
    if (!ui) return;
    if (ui.numQubits < 3) ui.addQubit();

    const teleportGrid = [
      ['H', null, 'CX_CTRL', 'H', null, null, null, null],
      [null, 'H', 'CX_TGT', null, 'CX_CTRL', null, null, null],
      [null, null, 'CX_TGT', null, 'CX_TGT', null, null, null]
    ];
    ui.loadPreset(teleportGrid, 'teleport');
    this._setActionFeedback('Loaded Quantum Teleportation Protocol circuit.');
    this._speak('Quantum teleportation protocol loaded.');
  }

  _buildGrover() {
    const ui = window.circuitUI;
    if (!ui) return;
    const groverGrid = [
      ['H', 'Z', 'H', 'X', 'H', null, null, null],
      ['H', 'CX_TGT', 'H', 'X', 'H', null, null, null]
    ];
    ui.loadPreset(groverGrid, 'grover');
    this._setActionFeedback('Loaded 2-Qubit Grover Search Algorithm.');
    this._speak('Grover search algorithm loaded.');
  }

  _buildQFT() {
    const ui = window.circuitUI;
    if (!ui) return;
    if (ui.numQubits < 3) ui.addQubit();
    const qftGrid = [
      ['H', 'S', 'T', null, null, null, null, null],
      [null, null, 'H', 'S', null, null, null, null],
      [null, null, null, null, 'H', null, null, null]
    ];
    ui.loadPreset(qftGrid, 'qft');
    this._setActionFeedback('Loaded 3-Qubit Quantum Fourier Transform (QFT).');
    this._speak('Quantum Fourier Transform loaded.');
  }

  _buildVQE() {
    const ui = window.circuitUI;
    if (!ui) return;
    const vqeGrid = [
      ['X', 'H', 'CX_CTRL', 'H', null, null, null, null],
      [null, 'H', 'CX_TGT', 'S', null, null, null, null]
    ];
    ui.loadPreset(vqeGrid, 'vqe');
    this._setActionFeedback('Loaded VQE Hardware-Efficient Ansatz.');
    this._speak('Variational quantum eigensolver ansatz loaded.');
  }

  _buildCHSH() {
    const ui = window.circuitUI;
    if (!ui) return;
    const chshGrid = [
      ['H', 'CX_CTRL', 'H', null, null, null, null, null],
      [null, 'CX_TGT', 'S', 'H', null, null, null, null]
    ];
    ui.loadPreset(chshGrid, 'chsh');
    this._setActionFeedback('Loaded CHSH Bell Inequality Violation Test.');
    this._speak('Bell inequality violation circuit loaded.');
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (!window.quantumVoiceCopilot) {
    window.quantumVoiceCopilot = new QuantumVoiceCopilot();
  }
});
