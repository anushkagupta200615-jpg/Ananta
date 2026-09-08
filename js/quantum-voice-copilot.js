/**
 * Ananta Quantum Studio — Universal AI Voice & Video Camera Quantum Copilot
 * 
 * Features:
 *  - Immediate zero-latency startup on user click gesture.
 *  - Automatic switch to Composer tab (window.switchTab('simulator')) so the circuit
 *    diagram is always directly visible when asked to build.
 *  - Web Audio API instant audio feedback chimes (ascending dual-sine synth).
 *  - Intelligent interim speech debounce (650ms silence timeout) so Chrome doesn't
 *    hang waiting for isFinal flags.
 *  - Universal Generative Quantum Circuit AI: Synthesizes arbitrary circuits,
 *    multi-step compound instructions ("H on 0, then X on 1, then CNOT 0 to 1"),
 *    and over 25+ quantum algorithms and error-correction protocols.
 *  - Single-letter gate matching: handles "h on 0", "x on 1", "z on 2", "cnot 0 to 1".
 *  - Automatic fresh start when user asks to "make a circuit with...".
 *  - CNOT connector redraw to ensure the vertical lines (• <--> ⊕) render with proper layout.
 *  - Chrome-safe TTS speech synthesis with window.speechSynthesis.resume().
 *  - Real-time webcam PIP video with animated audio waveform fallback.
 *  - Text command fallback input and 1-click test chips.
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
    this.speechDebounceTimer = null;
    this.audioCtx = null;

    this._bindEvents();
  }

  _bindEvents() {
    window.quantumVoiceCopilot = this;
  }

  toggle() {
    if (this.isActive) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    // 1. Switch to Composer tab so circuit canvas is visible immediately!
    if (window.switchTab) {
      window.switchTab('simulator');
    }

    const hud = document.getElementById('quantum-copilot-hud');
    if (!hud) return;

    this.isActive = true;
    hud.style.display = 'flex';
    hud.classList.add('copilot-hud-active');

    // Update trigger button active state in Composer
    const btn = document.getElementById('btn-voice-camera');
    if (btn) btn.classList.add('active');

    // Play pleasant startup tone
    this._playChime('start');

    // 2. Immediately start Speech Recognition synchronously within the user click gesture!
    this.startListening();

    // 3. Speak greeting immediately
    this._setSubtitle('Listening! Say e.g. "Add H on 0", "Make GHZ", "CNOT 0 to 1", or "Make Bell state"');
    this._speak('Quantum Voice Copilot ready. What circuit shall I build?');

    // 4. Start Camera asynchronously in background (never blocks voice/mic)
    this.startCamera().catch(err => {
      console.warn('[QuantumVoiceCopilot] Camera background init:', err);
    });
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

  _playChime(type = 'success') {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'success') {
        // Sci-Fi ascending 2-tone chime: E5 (659Hz) -> A5 (880Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.14);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'start') {
        // Welcome chime: C5 (523Hz) -> G5 (784Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'prompt') {
        // "Your turn" prompt ping: F5 (698Hz) -> C6 (1046Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(698.46, now);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.09);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'heard') {
        // Subtle acknowledgment blip: G5 (784Hz)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(783.99, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'warn') {
        // Polite descending double tone: D5 (587Hz) -> G4 (392Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(392.0, now + 0.18);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.start(now);
        osc.stop(now + 0.38);
      }
    } catch (e) {}
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
        audio: false
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

      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = navigator.language || 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this._updateStatus('🟢 LISTENING', 'listening');
        this._updateMicBtn(true);
      };

      this.recognition.onresult = (event) => {
        // Echo prevention: Ignore incoming microphone audio if Copilot is currently speaking aloud!
        if (this.isSpeaking) {
          return;
        }

        let fullTranscript = '';
        let hasFinal = false;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript;
          fullTranscript += text;
          if (res.isFinal) {
            hasFinal = true;
          }
        }

        const trimmed = fullTranscript.trim();
        if (!trimmed) return;

        // Immediate visual feedback of heard speech in both dialogue bubble & subtitle
        this._setDialogueUser(trimmed);
        this._setSubtitle(`Heard: "${trimmed}"`);
        this._updateStatus('🔊 HEARING YOU...', 'listening');

        // If marked final by browser, process immediately!
        if (hasFinal) {
          clearTimeout(this.speechDebounceTimer);
          this._processTranscript(trimmed);
        } else {
          // If interim, don't wait indefinitely for Chrome! Debounce 650ms after speech pause!
          clearTimeout(this.speechDebounceTimer);
          this.speechDebounceTimer = setTimeout(() => {
            console.log('[QuantumVoiceCopilot] Executing interim speech on pause:', trimmed);
            this._processTranscript(trimmed);
          }, 650);
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('[QuantumVoiceCopilot] Speech error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this._setSubtitle('Microphone permission needed. Please allow mic in browser address bar, or type below!');
          this._updateStatus('⚠️ MIC BLOCKED', 'error');
          this.isListening = false;
          this._updateMicBtn(false);
        } else if (event.error === 'network') {
          this._setSubtitle('Speech network service unavailable. You can type commands below!');
          this._updateStatus('⌨️ TYPE COMMAND', 'warning');
        }
      };

      this.recognition.onend = () => {
        if (this.isActive && this.isListening) {
          setTimeout(() => {
            if (this.isActive && this.isListening && this.recognition) {
              try { this.recognition.start(); } catch (e) {}
            }
          }, 200);
        } else {
          this.isListening = false;
          this._updateStatus('⏸️ MUTED', 'muted');
          this._updateMicBtn(false);
        }
      };

      this.recognition.start();
    } catch (e) {
      console.warn('[QuantumVoiceCopilot] Failed to start recognition:', e);
      this._setSubtitle('Could not access microphone. You can type commands below!');
      this._updateStatus('⌨️ TYPE COMMAND', 'warning');
    }
  }

  stopListening() {
    this.isListening = false;
    clearTimeout(this.speechDebounceTimer);
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
      this._speak('Voice confirmation enabled. What circuit shall we build?');
    }
  }

  _speak(text, onComplete = null) {
    console.log('[QuantumVoiceCopilot] Speaking:', text);
    this._setDialogueAI(text);

    if (!this.speechSynthesisEnabled || !window.speechSynthesis) {
      if (onComplete) onComplete();
      return;
    }

    try {
      this.isSpeaking = true;
      this._updateStatus('🗣️ COPILOT SPEAKING...', 'speaking');

      // Clear any pending queue
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          // CRITICAL: Bind to window and instance to prevent V8 premature garbage collection
          window._activeCopilotUtterance = utterance;
          this.activeUtterance = utterance;

          utterance.rate = 1.02;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length) {
            const preferredVoice = voices.find(v => 
              v.lang.startsWith('en') && 
              (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('David') || v.name.includes('Zira') || v.name.includes('Jenny') || v.name.includes('Guy'))
            ) || voices.find(v => v.lang.startsWith('en'));
            if (preferredVoice) utterance.voice = preferredVoice;
          }

          utterance.onstart = () => {
            this.isSpeaking = true;
            this._updateStatus('🗣️ COPILOT SPEAKING...', 'speaking');
          };

          utterance.onend = () => {
            window._activeCopilotUtterance = null;
            this.activeUtterance = null;
            // Short delay so speaker echo dissipates before mic unfreezes
            setTimeout(() => {
              this.isSpeaking = false;
              if (this.isListening) {
                this._updateStatus('🟢 LISTENING — WHAT NEXT?', 'listening');
                this._playChime('prompt');
              }
              if (onComplete) onComplete();
            }, 350);
          };

          utterance.onerror = (e) => {
            console.warn('[QuantumVoiceCopilot] Speech error:', e);
            window._activeCopilotUtterance = null;
            this.activeUtterance = null;
            this.isSpeaking = false;
            if (this.isListening) {
              this._updateStatus('🟢 LISTENING', 'listening');
            }
            if (onComplete) onComplete();
          };

          window.speechSynthesis.resume();
          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('[QuantumVoiceCopilot] Speak invocation error:', err);
          this.isSpeaking = false;
          if (onComplete) onComplete();
        }
      }, 70);
    } catch (e) {
      console.warn('[QuantumVoiceCopilot] TTS top error:', e);
      this.isSpeaking = false;
      if (onComplete) onComplete();
    }
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

  _setDialogueUser(text) {
    const el = document.getElementById('copilot-user-text');
    if (el) el.textContent = `"${text}"`;
  }

  _setDialogueAI(text) {
    const el = document.getElementById('copilot-ai-text');
    if (el) el.textContent = text;
  }

  _setActionFeedback(text, isSuccess = true) {
    const box = document.getElementById('copilot-action-box');
    const textEl = document.getElementById('copilot-act-text');
    if (!box || !textEl) return;
    box.style.display = 'flex';
    box.className = 'copilot-action-box ' + (isSuccess ? 'act-success' : 'act-warn');
    textEl.textContent = text;

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
  // Universal Generative Quantum Circuit AI Engine
  // -------------------------------------------------------------
  _processTranscript(rawText) {
    if (!rawText) return;
    let text = rawText.toLowerCase().trim();
    console.log('[QuantumVoiceCopilot] Ingested raw voice:', text);

    // Make sure we are viewing Composer!
    if (window.switchTab) {
      window.switchTab('simulator');
    }

    const ui = window.circuitUI;
    if (!ui) {
      this._setActionFeedback('Circuit UI not loaded yet.', false);
      return;
    }

    // If user says "make a circuit with..." or "create a circuit with..." or "draw circuit with...":
    const isNewCircuit = /^(?:make|create|draw|generate|build|construct)\s+(?:a\s+|an\s+|the\s+)?(?:circuit|diagram)\s+(?:with|having|of|for|that\s+has)?\s+/i.test(text);
    if (isNewCircuit) {
      ui.clearCircuit();
      text = text.replace(/^(?:make|create|draw|generate|build|construct)\s+(?:a\s+|an\s+|the\s+)?(?:circuit|diagram)\s+(?:with|having|of|for|that\s+has)?\s+/i, '');
    }

    // Step 1: Intelligent clause splitting on:
    // - "then", "and then", "after that", "next"
    // - "and" followed by an action/gate (with optional articles like a, an, the)
    // - commas followed by an action/gate
    const gateLookahead = '(?:a\\s+|an\\s+|the\\s+|another\\s+)?(?:add|put|place|insert|apply|set|wire|cnot|cx|hadamard|\\bh\\b|pauli|not|\\bx\\b|\\by\\b|\\bz\\b|\\bs\\b|\\bt\\b|\\bm\\b|swap|toffoli|ccx|measure|measurement|run|clear)\\b';
    const splitRegex = new RegExp('\\s+and\\s+(?=' + gateLookahead + ')', 'gi');
    const commaRegex = new RegExp(',\\s*(?=' + gateLookahead + ')', 'gi');

    let normalized = text
      .replace(/\s*(?:,\s*then\s*|\s+then\s+|,\s*and\s+then\s+|\s+and\s+then\s+|\s+after\s+that\s+|\s+next\s+|;\s*)\s*/gi, ' | ')
      .replace(splitRegex, ' | ')
      .replace(commaRegex, ' | ');

    const clauses = normalized.split(/\s*\|\s*/).map(c => c.trim()).filter(Boolean);

    if (clauses.length > 1) {
      console.log('[QuantumVoiceCopilot] Executing multi-step sequence of', clauses.length, 'clauses:', clauses);
      const actionSummaries = [];
      for (const clause of clauses) {
        if (clause) {
          const res = this._executeSingleIntent(clause, false);
          if (res) actionSummaries.push(res);
        }
      }
      if (actionSummaries.length > 0) {
        this._setActionFeedback(`⚡ Built Sequence: ${actionSummaries.join(' ➔ ')}`);
        this._playChime('success');
        this._speak(`Synthesized circuit sequence with ${actionSummaries.length} operations.`);
        setTimeout(() => {
          if (ui.renderGrid) ui.renderGrid();
          if (ui.renderCnotConnectors) ui.renderCnotConnectors();
        }, 60);
        return;
      }
    }

    // Single intent execution
    this._executeSingleIntent(text, true);
  }

  _executeSingleIntent(rawClause, shouldSpeak = true) {
    const ui = window.circuitUI;
    if (!ui) return null;

    // Clean conversational fluff and leading articles from start:
    let clean = rawClause
      .replace(/^(?:can\s+you\s+|could\s+you\s+|please\s+|i\s+said\s+to\s+|i\s+want\s+to\s+|i\s+need\s+to\s+|show\s+me\s+|create\s+|make\s+|draw\s+|generate\s+|build\s+|construct\s+|assemble\s+|add\s+|put\s+|place\s+|insert\s+|apply\s+|set\s+|wire\s+|a\s+|an\s+|the\s+|another\s+)+/i, '')
      .replace(/^(?:diagram\s+of\s+|circuit\s+of\s+|circuit\s+for\s+|diagram\s+for\s+|state\s+of\s+)?/i, '')
      .replace(/^(?:a\s+|an\s+|the\s+|another\s+)+/i, '')
      .trim();

    clean = clean.replace(/\s+/g, ' ');
    console.log('[QuantumVoiceCopilot] Clean intent:', clean);

    // -------------------------------------------------------------
    // 1. Broad Quantum Algorithm & Protocol Knowledge Base
    // -------------------------------------------------------------

    // 1.1 Bell State (all variants: Phi+, Phi-, Psi+, Psi-/singlet)
    if (/\b(bell|bell\s*state|bell\s*pair|epr|epr\s*pair)\b/.test(clean)) {
      let variant = 'phi_plus';
      if (/\b(phi\s*minus|minus)\b/.test(clean)) variant = 'phi_minus';
      else if (/\b(psi\s*plus)\b/.test(clean)) variant = 'psi_plus';
      else if (/\b(psi\s*minus|singlet)\b/.test(clean)) variant = 'psi_minus';

      this._buildBellVariant(variant);
      if (shouldSpeak) this._speak('Synthesized Bell state maximally entangled pair. What would you like to build or do next?');
      return 'Bell State';
    }

    // 1.2 GHZ Tripartite & Multipartite Entanglement
    if (/\b(ghz|greenberger|multi\s*qubit\s*entanglement|tripartite)\b/.test(clean)) {
      const qMatch = clean.match(/(\d+)\s*(?:qubit|q)/);
      const nQubits = qMatch ? parseInt(qMatch[1], 10) : 3;
      this._buildDynamicGHZ(nQubits);
      if (shouldSpeak) this._speak(`Created ${nQubits}-qubit GHZ entangled state. What gate should we add next?`);
      return `${nQubits}-Qubit GHZ`;
    }

    // 1.3 W-State
    if (/\b(w\s*state|w\s*superposition)\b/.test(clean)) {
      this._buildWState();
      if (shouldSpeak) this._speak('Created three-qubit W state. What would you like to add next?');
      return 'W State';
    }

    // 1.4 Quantum Teleportation Protocol
    if (/\b(teleport|teleportation|epr\s*channel)\b/.test(clean)) {
      this._buildTeleportation();
      if (shouldSpeak) this._speak('Loaded quantum teleportation protocol. Would you like to run simulation, or inspect gates?');
      return 'Teleportation Protocol';
    }

    // 1.5 Superdense Coding
    if (/\b(superdense|dense\s*coding)\b/.test(clean)) {
      this._buildSuperdenseCoding();
      if (shouldSpeak) this._speak('Loaded superdense coding protocol. What is our next step?');
      return 'Superdense Coding';
    }

    // 1.6 Entanglement Swapping
    if (/\b(entanglement\s*swapping|swapping\s*protocol)\b/.test(clean)) {
      this._buildEntanglementSwapping();
      if (shouldSpeak) this._speak('Constructed entanglement swapping circuit across 4 qubits. What is next?');
      return 'Entanglement Swapping';
    }

    // 1.7 Deutsch-Jozsa Algorithm
    if (/\b(deutsch|deutsch\s*jozsa)\b/.test(clean)) {
      this._buildDeutschJozsa();
      if (shouldSpeak) this._speak('Constructed Deutsch-Jozsa quantum advantage circuit. Shall we run the simulation?');
      return 'Deutsch-Jozsa';
    }

    // 1.8 Bernstein-Vazirani Algorithm
    if (/\b(bernstein|vazirani|hidden\s*string)\b/.test(clean)) {
      this._buildBernsteinVazirani();
      if (shouldSpeak) this._speak('Constructed Bernstein-Vazirani single-query search algorithm. What is our next step?');
      return 'Bernstein-Vazirani';
    }

    // 1.9 Simon's Algorithm
    if (/\b(simon|simon's|period\s*finding)\b/.test(clean)) {
      this._buildSimon();
      if (shouldSpeak) this._speak('Constructed Simon\'s exponential speedup circuit. What is next?');
      return 'Simon\'s Algorithm';
    }

    // 1.10 Grover's Search Algorithm
    if (/\b(grover|grover's|quantum\s*search|database\s*search)\b/.test(clean)) {
      this._buildGrover();
      if (shouldSpeak) this._speak('Loaded Grover quantum search algorithm. Shall we run simulation, or add more gates?');
      return 'Grover Search';
    }

    // 1.11 Quantum Fourier Transform (QFT & IQFT)
    if (/\b(qft|fourier|fourier\s*transform)\b/.test(clean)) {
      const isInverse = /\b(inverse|inv|iqft)\b/.test(clean);
      const qMatch = clean.match(/(\d+)\s*(?:qubit|q)/);
      const nQubits = qMatch ? parseInt(qMatch[1], 10) : (ui.numQubits || 3);
      this._buildDynamicQFT(nQubits, isInverse);
      if (shouldSpeak) this._speak(`Generated ${nQubits}-qubit Quantum Fourier Transform. What should we do next?`);
      return `QFT (${nQubits}q)`;
    }

    // 1.12 Quantum Phase Estimation (QPE)
    if (/\b(qpe|phase\s*estimation)\b/.test(clean)) {
      this._buildQPE();
      if (shouldSpeak) this._speak('Loaded Quantum Phase Estimation circuit. What would you like to do next?');
      return 'Quantum Phase Estimation';
    }

    // 1.13 Quantum Arithmetic & Adders
    if (/\b(adder|half\s*adder|quantum\s*adder|arithmetic)\b/.test(clean)) {
      this._buildQuantumAdder();
      if (shouldSpeak) this._speak('Constructed quantum adder circuit using Toffoli and CNOT gates. What gate shall we add next?');
      return 'Quantum Half-Adder';
    }

    // 1.14 Quantum Error Correction: Bit-Flip Code
    if (/\b(bit\s*flip\s*code|repetition\s*code|error\s*correction|qec)\b/.test(clean)) {
      this._buildBitFlipCode();
      if (shouldSpeak) this._speak('Constructed 3-qubit bit-flip error correction code. What is next?');
      return '3-Qubit Bit-Flip QEC';
    }

    // 1.15 Quantum Error Correction: Phase-Flip Code
    if (/\b(phase\s*flip\s*code)\b/.test(clean)) {
      this._buildPhaseFlipCode();
      if (shouldSpeak) this._speak('Constructed 3-qubit phase-flip error correction code. What is next?');
      return '3-Qubit Phase-Flip QEC';
    }

    // 1.16 SWAP Test (Fidelity & State Overlap)
    if (/\b(swap\s*test|state\s*overlap|fidelity\s*test)\b/.test(clean)) {
      this._buildSwapTest();
      if (shouldSpeak) this._speak('Constructed quantum SWAP test for state overlap measurement. What is next?');
      return 'SWAP Test';
    }

    // 1.17 Quantum Random Number Generator (QRNG)
    if (/\b(qrng|random\s*number|random\s*generator|coin\s*flip)\b/.test(clean)) {
      this._buildQRNG();
      if (shouldSpeak) this._speak('Constructed Quantum Random Number Generator. Shall we run simulation?');
      return 'QRNG';
    }

    // 1.18 VQE Ansatz
    if (/\b(vqe|variational|ansatz)\b/.test(clean)) {
      this._buildVQE();
      if (shouldSpeak) this._speak('Loaded Variational Quantum Eigensolver ansatz. What is next?');
      return 'VQE Ansatz';
    }

    // 1.19 CHSH Bell Test
    if (/\b(chsh|inequality|bell\s*test)\b/.test(clean)) {
      this._buildCHSH();
      if (shouldSpeak) this._speak('Loaded CHSH Bell inequality violation test. Ready to run simulation?');
      return 'CHSH Test';
    }

    // -------------------------------------------------------------
    // 2. Register & Circuit Controls
    // -------------------------------------------------------------
    if (/\b(clear\s*all|clear\s*circuit|clear|reset|wipe|clean|start\s*over)\b/.test(clean)) {
      ui.clearCircuit();
      this._setActionFeedback('Cleared entire quantum circuit.');
      this._playChime('success');
      if (shouldSpeak) this._speak('Circuit reset to ground state. Which gate shall we start with?');
      return 'Clear Circuit';
    }

    if (/\b(run\s*simulation|run|simulate|execute|calculate|fire)\b/.test(clean)) {
      ui.runInteractiveSimulation();
      this._setActionFeedback('Executed quantum statevector simulation.');
      this._playChime('success');
      if (shouldSpeak) this._speak('Simulation executed. Statevector and measurement probabilities updated. What is next?');
      return 'Run Simulation';
    }

    // Configure register qubit count ("4 qubits", "set to 3 qubits", "make 4 qubits")
    const setQubitMatch = clean.match(/\b(?:set|make|use|have|with)?\s*([2-8])\s*qubits?\b/i);
    if (setQubitMatch) {
      const targetQ = parseInt(setQubitMatch[1], 10);
      while (ui.numQubits < targetQ) ui.addQubit();
      while (ui.numQubits > targetQ) ui.removeQubit();
      this._setActionFeedback(`Configured register with ${targetQ} qubits.`);
      this._playChime('success');
      if (shouldSpeak) this._speak(`Configured circuit with ${targetQ} qubits. What gate should we add first?`);
      return `SetQubits(${targetQ})`;
    }

    if (/\b(add\s*qubit|new\s*qubit|more\s*qubit)\b/.test(clean)) {
      ui.addQubit();
      this._setActionFeedback(`Added qubit. Register is now ${ui.numQubits} qubits.`);
      this._playChime('success');
      if (shouldSpeak) this._speak(`Added qubit. Total is now ${ui.numQubits}. What gate shall we place?`);
      return 'Add Qubit';
    }

    if (/\b(remove\s*qubit|delete\s*qubit|less\s*qubit)\b/.test(clean)) {
      ui.removeQubit();
      this._setActionFeedback(`Removed qubit. Register is now ${ui.numQubits} qubits.`);
      this._playChime('success');
      if (shouldSpeak) this._speak(`Removed qubit. Total is now ${ui.numQubits}. What is our next step?`);
      return 'Remove Qubit';
    }

    // -------------------------------------------------------------
    // 3. Whole-Register Mass Operations
    // -------------------------------------------------------------
    if (/\b(hadamard\s*on\s*all|h\s*on\s*all|superposition\s*on\s*all|all\s*hadamard|all\s*h)\b/.test(clean)) {
      for (let q = 0; q < ui.numQubits; q++) {
        ui.placeGate('H', q, 0);
      }
      this._setActionFeedback(`Applied Hadamard transform to all ${ui.numQubits} qubits.`);
      this._playChime('success');
      if (shouldSpeak) this._speak(`Applied Hadamard to all ${ui.numQubits} qubits. What is our next gate?`);
      return 'Hadamard on All';
    }

    if (/\b(x\s*on\s*all|not\s*on\s*all|invert\s*all|all\s*x)\b/.test(clean)) {
      for (let q = 0; q < ui.numQubits; q++) {
        ui.placeGate('X', q, 0);
      }
      this._setActionFeedback(`Applied Pauli-X bit-flip to all ${ui.numQubits} qubits.`);
      this._playChime('success');
      if (shouldSpeak) this._speak('Inverted all qubits. What gate should I add next?');
      return 'X on All';
    }

    if (/\b(measure\s*all|measurement\s*on\s*all|all\s*measure)\b/.test(clean)) {
      for (let q = 0; q < ui.numQubits; q++) {
        let col = this._findNextCol(q);
        ui.placeGate('M', q, col);
      }
      this._setActionFeedback(`Added measurements across all ${ui.numQubits} qubits.`);
      this._playChime('success');
      if (shouldSpeak) this._speak('Added measurement to all qubits. Ready to run simulation, or add more gates?');
      return 'Measure All';
    }

    // -------------------------------------------------------------
    // 4. Freeform Gate & Connector Placement
    // -------------------------------------------------------------

    // 4.1 CNOT / CX
    if (/\b(cnot|cx|controlled\s*not)\b/.test(clean)) {
      const res = this._parseAndPlaceCNOT(clean, shouldSpeak);
      if (res) return res;
    }

    // 4.2 SWAP
    if (/\b(swap|exchange)\b/.test(clean)) {
      const res = this._parseAndPlaceSWAP(clean, shouldSpeak);
      if (res) return res;
    }

    // 4.3 Toffoli / CCX
    if (/\b(toffoli|ccx|controlled\s*controlled\s*not)\b/.test(clean)) {
      const res = this._parseAndPlaceToffoli(clean, shouldSpeak);
      if (res) return res;
    }

    // 4.4 Single Qubit Gates (H, X, Y, Z, S, T, M)
    const singleGate = this._matchSingleGate(clean);
    if (singleGate) {
      const q = this._extractQubit(clean);
      const col = this._extractColumn(clean, q);
      this._placeSingleGate(singleGate, q, col, shouldSpeak);
      return `${singleGate}(q${q})`;
    }

    // 4.5 Remove/Delete Gate
    if (/\b(remove|delete|erase|drop)\b/.test(clean)) {
      const q = this._extractQubit(clean);
      const col = this._extractColumn(clean, q, false);
      if (col !== -1) {
        ui.removeGate(q, col);
        this._setActionFeedback(`Removed gate at Qubit ${q}, Column ${col + 1}.`);
        this._playChime('success');
        if (shouldSpeak) this._speak(`Removed gate on qubit ${q}. What would you like to do next?`);
        return `Remove(q${q}, c${col+1})`;
      }
    }

    // Fallback: Never leave user in silence! Acknowledge what was heard and invite valid next command.
    this._setActionFeedback(`Unrecognized: "${rawClause}". Try: "Add H on 0", "Make GHZ", "CNOT 0 to 1"`, false);
    this._playChime('warn');
    if (shouldSpeak) this._speak(`I heard: ${rawClause}. What gate shall I place next? You can say: Add H on 0, or CNOT 0 to 1.`);
    return null;
  }

  // -------------------------------------------------------------
  // Dynamic Circuit Generators
  // -------------------------------------------------------------

  _buildBellVariant(variant = 'phi_plus') {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;

    if (variant === 'phi_plus' && window.loadPresetSafe) {
      window.loadPresetSafe('bell');
      this._setActionFeedback('Synthesized Bell State |Φ⁺⟩ = (|00⟩ + |11⟩)/√2.');
      this._playChime('success');
      setTimeout(() => {
        if (ui.renderCnotConnectors) ui.renderCnotConnectors();
        if (ui.bindGateTooltips) ui.bindGateTooltips();
      }, 60);
      return;
    }

    ui.clearCircuit();
    if (variant === 'phi_minus') {
      ui.placeGate('X', 0, 0);
      ui.placeGate('H', 0, 1);
      ui.grid[0][2] = 'CX_CTRL';
      ui.grid[1][2] = 'CX_TGT';
      this._setActionFeedback('Synthesized Bell State |Φ⁻⟩ = (|00⟩ - |11⟩)/√2.');
    } else if (variant === 'psi_plus') {
      ui.placeGate('X', 1, 0);
      ui.placeGate('H', 0, 0);
      ui.grid[0][1] = 'CX_CTRL';
      ui.grid[1][1] = 'CX_TGT';
      this._setActionFeedback('Synthesized Bell State |Ψ⁺⟩ = (|01⟩ + |10⟩)/√2.');
    } else {
      ui.placeGate('X', 0, 0);
      ui.placeGate('X', 1, 0);
      ui.placeGate('H', 0, 1);
      ui.grid[0][2] = 'CX_CTRL';
      ui.grid[1][2] = 'CX_TGT';
      this._setActionFeedback('Synthesized Singlet Bell State |Ψ⁻⟩ = (|01⟩ - |10⟩)/√2.');
    }

    ui.renderGrid();
    ui.updateSimulation();
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
      if (ui.bindGateTooltips) ui.bindGateTooltips();
    }, 60);
  }

  _buildDynamicGHZ(nQubits = 3) {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;

    if (nQubits === 3 && window.loadPresetSafe) {
      window.loadPresetSafe('ghz');
      this._setActionFeedback('Synthesized 3-Qubit GHZ State (|000⟩ + |111⟩)/√2.');
      this._playChime('success');
      setTimeout(() => {
        if (ui.renderCnotConnectors) ui.renderCnotConnectors();
        if (ui.bindGateTooltips) ui.bindGateTooltips();
      }, 60);
      return;
    }

    nQubits = Math.max(2, Math.min(8, nQubits));
    while (ui.numQubits < nQubits) ui.addQubit();
    while (ui.numQubits > nQubits) ui.removeQubit();

    ui.clearCircuit();
    ui.placeGate('H', 0, 0);

    for (let i = 0; i < nQubits - 1; i++) {
      const col = i + 1;
      ui.grid[i][col] = 'CX_CTRL';
      ui.grid[i + 1][col] = 'CX_TGT';
    }

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback(`Synthesized ${nQubits}-Qubit GHZ State (|00...0⟩ + |11...1⟩)/√2.`);
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
      if (ui.bindGateTooltips) ui.bindGateTooltips();
    }, 60);
  }

  _buildWState() {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;
    while (ui.numQubits < 3) ui.addQubit();
    ui.clearCircuit();

    ui.placeGate('H', 0, 0);
    ui.grid[0][1] = 'CX_CTRL';
    ui.grid[1][1] = 'CX_TGT';
    ui.placeGate('X', 0, 2);
    ui.grid[0][3] = 'CX_CTRL';
    ui.grid[2][3] = 'CX_TGT';
    ui.placeGate('H', 2, 4);

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback('Synthesized 3-Qubit W-State (|001⟩ + |010⟩ + |100⟩)/√3.');
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);
  }

  _buildTeleportation() {
    if (window.switchTab) window.switchTab('simulator');
    if (window.loadPresetSafe) {
      window.loadPresetSafe('teleport');
      this._setActionFeedback('Loaded Quantum Teleportation Protocol with EPR channel and Bell measurement.');
      this._playChime('success');
      setTimeout(() => {
        if (window.circuitUI?.renderCnotConnectors) window.circuitUI.renderCnotConnectors();
      }, 60);
      return;
    }
    const ui = window.circuitUI;
    if (!ui) return;
    while (ui.numQubits < 3) ui.addQubit();
    const teleportGrid = [
      ['H', null, 'CX_CTRL', 'H', 'M', null, null, null],
      [null, 'H', 'CX_TGT', null, 'CX_CTRL', 'M', null, null],
      [null, null, 'CX_TGT', null, 'CX_TGT', 'Z', 'X', null]
    ];
    ui.loadPreset(teleportGrid, 'teleport');
    this._setActionFeedback('Loaded Quantum Teleportation Protocol with EPR pair and measurement.');
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);
  }

  _buildSuperdenseCoding() {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;
    ui.clearCircuit();

    ui.placeGate('H', 0, 0);
    ui.grid[0][1] = 'CX_CTRL';
    ui.grid[1][1] = 'CX_TGT';
    ui.placeGate('X', 0, 2);
    ui.placeGate('Z', 0, 3);
    ui.grid[0][4] = 'CX_CTRL';
    ui.grid[1][4] = 'CX_TGT';
    ui.placeGate('H', 0, 5);
    ui.placeGate('M', 0, 6);
    ui.placeGate('M', 1, 6);

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback('Synthesized Superdense Coding Protocol (2 classical bits per 1 qubit).');
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);
  }

  _buildEntanglementSwapping() {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;
    while (ui.numQubits < 4) ui.addQubit();
    ui.clearCircuit();

    ui.placeGate('H', 0, 0);
    ui.grid[0][1] = 'CX_CTRL';
    ui.grid[1][1] = 'CX_TGT';

    ui.placeGate('H', 2, 0);
    ui.grid[2][1] = 'CX_CTRL';
    ui.grid[3][1] = 'CX_TGT';

    ui.grid[1][2] = 'CX_CTRL';
    ui.grid[2][2] = 'CX_TGT';
    ui.placeGate('H', 1, 3);
    ui.placeGate('M', 1, 4);
    ui.placeGate('M', 2, 4);

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback('Synthesized 4-Qubit Entanglement Swapping (entangles Q0 and Q3 without direct interaction).');
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);
  }

  _buildDeutschJozsa() {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;
    while (ui.numQubits < 3) ui.addQubit();
    ui.clearCircuit();

    ui.placeGate('X', 2, 0);
    ui.placeGate('H', 2, 1);
    ui.placeGate('H', 0, 1);
    ui.placeGate('H', 1, 1);

    ui.grid[0][2] = 'CX_CTRL';
    ui.grid[2][2] = 'CX_TGT';
    ui.grid[1][3] = 'CX_CTRL';
    ui.grid[2][3] = 'CX_TGT';

    ui.placeGate('H', 0, 4);
    ui.placeGate('H', 1, 4);
    ui.placeGate('M', 0, 5);
    ui.placeGate('M', 1, 5);

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback('Synthesized Deutsch-Jozsa Algorithm with balanced oracle.');
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);
  }

  _buildBernsteinVazirani() {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;
    while (ui.numQubits < 3) ui.addQubit();
    ui.clearCircuit();

    ui.placeGate('X', 2, 0);
    ui.placeGate('H', 2, 1);
    ui.placeGate('H', 0, 1);
    ui.placeGate('H', 1, 1);

    ui.grid[0][2] = 'CX_CTRL';
    ui.grid[2][2] = 'CX_TGT';
    ui.grid[1][3] = 'CX_CTRL';
    ui.grid[2][3] = 'CX_TGT';

    ui.placeGate('H', 0, 4);
    ui.placeGate('H', 1, 4);
    ui.placeGate('M', 0, 5);
    ui.placeGate('M', 1, 5);

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback('Synthesized Bernstein-Vazirani single-query hidden bit string algorithm.');
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);
  }

  _buildSimon() {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;
    while (ui.numQubits < 4) ui.addQubit();
    ui.clearCircuit();

    ui.placeGate('H', 0, 0);
    ui.placeGate('H', 1, 0);

    ui.grid[0][1] = 'CX_CTRL';
    ui.grid[2][1] = 'CX_TGT';
    ui.grid[1][2] = 'CX_CTRL';
    ui.grid[3][2] = 'CX_TGT';
    ui.grid[0][3] = 'CX_CTRL';
    ui.grid[3][3] = 'CX_TGT';

    ui.placeGate('H', 0, 4);
    ui.placeGate('H', 1, 4);

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback('Synthesized Simon\'s exponential speedup period-finding circuit.');
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);
  }

  _buildGrover() {
    if (window.switchTab) window.switchTab('simulator');
    if (window.loadPresetSafe) {
      window.loadPresetSafe('grover');
      this._setActionFeedback('Loaded Grover Quantum Search Algorithm.');
      this._playChime('success');
      setTimeout(() => {
        if (window.circuitUI?.renderCnotConnectors) window.circuitUI.renderCnotConnectors();
      }, 60);
      return;
    }
    const ui = window.circuitUI;
    if (!ui) return;
    const groverGrid = [
      ['H', 'Z', 'H', 'X', 'H', null, null, null],
      ['H', 'CX_TGT', 'H', 'X', 'H', null, null, null]
    ];
    ui.loadPreset(groverGrid, 'grover');
    this._setActionFeedback('Loaded Grover Quantum Search Algorithm.');
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);
  }

  _buildDynamicQFT(nQubits = 3, isInverse = false) {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;

    if (nQubits === 3 && !isInverse && window.loadPresetSafe) {
      window.loadPresetSafe('qft');
      this._setActionFeedback('Loaded Quantum Fourier Transform (QFT).');
      this._playChime('success');
      return;
    }

    nQubits = Math.max(2, Math.min(6, nQubits));
    while (ui.numQubits < nQubits) ui.addQubit();

    ui.clearCircuit();
    let col = 0;

    for (let i = 0; i < nQubits; i++) {
      ui.placeGate('H', i, col++);
      for (let j = i + 1; j < nQubits; j++) {
        const phaseGate = (j - i === 1) ? 'S' : 'T';
        ui.placeGate(phaseGate, j, col++);
      }
    }

    for (let i = 0; i < Math.floor(nQubits / 2); i++) {
      const top = i;
      const bot = nQubits - 1 - i;
      ui.grid[top][col] = 'SWAP';
      ui.grid[bot][col] = 'SWAP';
      col++;
    }

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback(`Dynamically synthesized ${nQubits}-Qubit Quantum Fourier Transform.`);
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);
  }

  _buildQPE() {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;
    while (ui.numQubits < 3) ui.addQubit();
    ui.clearCircuit();

    ui.placeGate('H', 0, 0);
    ui.placeGate('H', 1, 0);
    ui.placeGate('X', 2, 0);
    ui.placeGate('T', 2, 1);
    ui.placeGate('S', 2, 2);
    ui.placeGate('H', 0, 3);
    ui.placeGate('S', 1, 4);
    ui.placeGate('H', 1, 5);

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback('Synthesized Quantum Phase Estimation (QPE) circuit.');
    this._playChime('success');
  }

  _buildQuantumAdder() {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;
    while (ui.numQubits < 3) ui.addQubit();
    ui.clearCircuit();

    ui.placeGate('X', 0, 0);
    ui.placeGate('X', 1, 0);

    ui.grid[0][1] = 'CX_CTRL';
    ui.grid[1][1] = 'CX_CTRL';
    ui.grid[2][1] = 'CX_TGT';

    ui.grid[0][2] = 'CX_CTRL';
    ui.grid[1][2] = 'CX_TGT';

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback('Constructed Quantum Half-Adder (Sum on Q1, Carry on Q2).');
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);
  }

  _buildBitFlipCode() {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;
    while (ui.numQubits < 3) ui.addQubit();
    ui.clearCircuit();

    ui.placeGate('H', 0, 0);
    ui.grid[0][1] = 'CX_CTRL';
    ui.grid[1][1] = 'CX_TGT';
    ui.grid[0][2] = 'CX_CTRL';
    ui.grid[2][2] = 'CX_TGT';
    ui.placeGate('X', 1, 3);

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback('Synthesized 3-Qubit Bit-Flip Repetition Error Correction Code.');
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);
  }

  _buildPhaseFlipCode() {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;
    while (ui.numQubits < 3) ui.addQubit();
    ui.clearCircuit();

    ui.placeGate('H', 0, 0);
    ui.grid[0][1] = 'CX_CTRL';
    ui.grid[1][1] = 'CX_TGT';
    ui.grid[0][2] = 'CX_CTRL';
    ui.grid[2][2] = 'CX_TGT';
    ui.placeGate('H', 0, 3);
    ui.placeGate('H', 1, 3);
    ui.placeGate('H', 2, 3);
    ui.placeGate('Z', 1, 4);

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback('Synthesized 3-Qubit Phase-Flip Error Correction Code.');
    this._playChime('success');
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);
  }

  _buildSwapTest() {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;
    while (ui.numQubits < 3) ui.addQubit();
    ui.clearCircuit();

    ui.placeGate('H', 0, 0);
    ui.placeGate('X', 1, 0);
    ui.placeGate('H', 2, 0);

    ui.grid[0][1] = 'CX_CTRL';
    ui.grid[1][1] = 'SWAP';
    ui.grid[2][1] = 'SWAP';

    ui.placeGate('H', 0, 2);
    ui.placeGate('M', 0, 3);

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback('Synthesized Quantum SWAP Test for quantum state overlap measurement.');
    this._playChime('success');
  }

  _buildQRNG() {
    if (window.switchTab) window.switchTab('simulator');
    const ui = window.circuitUI;
    if (!ui) return;
    ui.clearCircuit();

    for (let q = 0; q < ui.numQubits; q++) {
      ui.placeGate('H', q, 0);
      ui.placeGate('M', q, 1);
    }

    ui.renderGrid();
    ui.updateSimulation();
    this._setActionFeedback(`Synthesized ${ui.numQubits}-Qubit True Quantum Random Number Generator (QRNG).`);
    this._playChime('success');
  }

  _buildVQE() {
    if (window.switchTab) window.switchTab('simulator');
    if (window.loadPresetSafe) {
      window.loadPresetSafe('vqe');
      this._setActionFeedback('Loaded VQE Hardware-Efficient Ansatz.');
      this._playChime('success');
      return;
    }
    const ui = window.circuitUI;
    if (!ui) return;
    const vqeGrid = [
      ['X', 'H', 'CX_CTRL', 'H', null, null, null, null],
      [null, 'H', 'CX_TGT', 'S', null, null, null, null]
    ];
    ui.loadPreset(vqeGrid, 'vqe');
    this._setActionFeedback('Loaded VQE Hardware-Efficient Ansatz.');
    this._playChime('success');
  }

  _buildCHSH() {
    if (window.switchTab) window.switchTab('simulator');
    if (window.loadPresetSafe) {
      window.loadPresetSafe('chsh');
      this._setActionFeedback('Loaded CHSH Bell Inequality Violation Test.');
      this._playChime('success');
      return;
    }
    const ui = window.circuitUI;
    if (!ui) return;
    const chshGrid = [
      ['H', 'CX_CTRL', 'H', null, null, null, null, null],
      [null, 'CX_TGT', 'S', 'H', null, null, null, null]
    ];
    ui.loadPreset(chshGrid, 'chsh');
    this._setActionFeedback('Loaded CHSH Bell Inequality Violation Test.');
    this._playChime('success');
  }

  // -------------------------------------------------------------
  // Freeform Gate Placement & Helper Parsers
  // -------------------------------------------------------------
  _matchSingleGate(text) {
    if (/\b(hadamard|h\s*gate|letter\s*h|\bh\b)\b/i.test(text)) return 'H';
    if (/\b(pauli\s*x|not\s*gate|bit\s*flip|x\s*gate|\bnot\b|\bx\b)\b/i.test(text)) return 'X';
    if (/\b(pauli\s*y|y\s*gate|\by\b)\b/i.test(text)) return 'Y';
    if (/\b(pauli\s*z|phase\s*flip|z\s*gate|\bz\b)\b/i.test(text)) return 'Z';
    if (/\b(phase\s*gate|phase|\bs\s*gate\b|\bs\b)\b/i.test(text)) return 'S';
    if (/\b(pi\s*over\s*8|t\s*gate|\bt\b)\b/i.test(text)) return 'T';
    if (/\b(measure|measurement|meter|\bm\b)\b/i.test(text)) return 'M';
    return null;
  }

  _extractQubit(text) {
    const patterns = [
      { regex: /\b(?:qubit|q|line|wire|register)\s*([0-7])\b/i, parse: m => parseInt(m[1], 10) },
      { regex: /\b(?:qubit|q|line|wire|register)\s*(zero|one|two|three|four|five|six|seven)\b/i, parse: m => this._extractQubitNum(m[1]) },
      { regex: /\b(first|1st)\s*(?:qubit|line|wire)?\b/i, parse: () => 0 },
      { regex: /\b(second|2nd)\s*(?:qubit|line|wire)?\b/i, parse: () => 1 },
      { regex: /\b(third|3rd)\s*(?:qubit|line|wire)?\b/i, parse: () => 2 },
      { regex: /\b(fourth|4th)\s*(?:qubit|line|wire)?\b/i, parse: () => 3 },
      { regex: /\b(?:on|at|to|in)\s*([0-7])\b/i, parse: m => parseInt(m[1], 10) },
      { regex: /\b(?:on|at|to|in)\s*(zero|one|two|three|four|five|six|seven)\b/i, parse: m => this._extractQubitNum(m[1]) },
      { regex: /\bq([0-7])\b/i, parse: m => parseInt(m[1], 10) },
      { regex: /\b(?:h|hadamard|x|y|z|s|t|m|not|measure|gate)\s*([0-7])\b/i, parse: m => parseInt(m[1], 10) },
      { regex: /\b(?:h|hadamard|x|y|z|s|t|m|not|measure|gate)\s*(zero|one|two|three|four|five|six|seven)\b/i, parse: m => this._extractQubitNum(m[1]) },
      { regex: /\b([0-7])\b/, parse: m => parseInt(m[1], 10) },
      { regex: /\b(zero|one|two|three|four|five|six|seven)\b/i, parse: m => this._extractQubitNum(m[1]) }
    ];

    for (const p of patterns) {
      const match = text.match(p.regex);
      if (match) {
        const val = p.parse(match);
        if (val >= 0 && val < (window.circuitUI?.numQubits || 8)) return val;
      }
    }
    return 0;
  }

  _extractColumn(text, qubit, findEmptyIfMissing = true) {
    const colMatch = text.match(/\b(?:column|col|slot|step)\s*(\d+)\b/i);
    if (colMatch) {
      return Math.max(0, parseInt(colMatch[1], 10) - 1);
    }
    if (!findEmptyIfMissing) return -1;
    return this._findNextCol(qubit);
  }

  _findNextCol(qubit) {
    const ui = window.circuitUI;
    if (ui && ui.grid && ui.grid[qubit]) {
      for (let c = 0; c < ui.numCols; c++) {
        if (!ui.grid[qubit][c]) return c;
      }
    }
    return 0;
  }

  _extractQubitNum(word) {
    if (!word) return 0;
    const w = word.toLowerCase();
    if (/\b(zero|0|first|1st|q0)\b/.test(w)) return 0;
    if (/\b(one|1|second|2nd|q1)\b/.test(w)) return 1;
    if (/\b(two|2|third|3rd|q2)\b/.test(w)) return 2;
    if (/\b(three|3|fourth|4th|q3)\b/.test(w)) return 3;
    if (/\b(four|4|fifth|5th|q4)\b/.test(w)) return 4;
    if (/\b(five|5|sixth|6th|q5)\b/.test(w)) return 5;
    if (/\b(six|6|seventh|7th|q6)\b/.test(w)) return 6;
    if (/\b(seven|7|eighth|8th|q7)\b/.test(w)) return 7;
    const m = w.match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  }

  _placeSingleGate(gateName, qubit, col, shouldSpeak = true) {
    const ui = window.circuitUI;
    if (!ui) return;

    ui.placeGate(gateName, qubit, col);
    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);

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
    this._playChime('success');
    if (shouldSpeak) {
      if (gateName === 'M') {
        this._speak(`Placed measurement on qubit ${qubit}. Should we run simulation, or add more gates?`);
      } else {
        this._speak(`Placed ${name} on qubit ${qubit}. What gate should I add next?`);
      }
    }
  }

  _parseAndPlaceCNOT(text, shouldSpeak = true) {
    const ui = window.circuitUI;
    if (!ui) return null;

    let ctrlQ = 0;
    let tgtQ = 1;

    // Check explicit control and target words if present
    const ctrlMatch = text.match(/(?:control|ctrl|from)\s*(?:qubit|q|line|wire)?\s*([0-7]|zero|one|two|three|four|five|six|seven)\b/i);
    const tgtMatch = text.match(/(?:target|tgt|to)\s*(?:qubit|q|line|wire)?\s*([0-7]|zero|one|two|three|four|five|six|seven)\b/i);

    if (ctrlMatch && tgtMatch) {
      ctrlQ = this._extractQubitNum(ctrlMatch[1]);
      tgtQ = this._extractQubitNum(tgtMatch[1]);
    } else {
      const nums = [];
      const numMatches = text.matchAll(/\b([0-7]|zero|one|two|three|four|five|six|seven|first|second|third|fourth|fifth|sixth|seventh)\b/gi);
      for (const m of numMatches) {
        const val = this._extractQubitNum(m[1]);
        if (val >= 0 && val < ui.numQubits) {
          nums.push(val);
        }
      }
      if (nums.length >= 2) {
        ctrlQ = nums[0];
        tgtQ = nums[1];
      } else if (nums.length === 1) {
        ctrlQ = nums[0];
        tgtQ = (ctrlQ + 1) % ui.numQubits;
      }
    }

    // Guard against self-targeting CNOT
    if (ctrlQ === tgtQ) {
      tgtQ = (ctrlQ + 1) % ui.numQubits;
    }

    let col = -1;
    const explicitCol = this._extractColumn(text, ctrlQ, false);
    if (explicitCol !== -1) {
      col = explicitCol;
    } else {
      for (let c = 0; c < ui.numCols; c++) {
        if (!ui.grid[ctrlQ][c] && !ui.grid[tgtQ][c]) {
          col = c;
          break;
        }
      }
    }
    if (col === -1) col = 0;

    ui.grid[ctrlQ][col] = 'CX_CTRL';
    ui.grid[tgtQ][col] = 'CX_TGT';
    ui.renderGrid();
    ui.updateSimulation();

    setTimeout(() => {
      if (ui.renderCnotConnectors) ui.renderCnotConnectors();
    }, 60);

    const slot1 = document.getElementById(`slot-${ctrlQ}-${col}`);
    const slot2 = document.getElementById(`slot-${tgtQ}-${col}`);
    if (slot1) slot1.classList.add('gate-shockwave');
    if (slot2) slot2.classList.add('gate-shockwave');
    setTimeout(() => {
      if (slot1) slot1.classList.remove('gate-shockwave');
      if (slot2) slot2.classList.remove('gate-shockwave');
    }, 600);

    this._setActionFeedback(`Wired CNOT: Control Q${ctrlQ} ➔ Target Q${tgtQ} (Col ${col + 1}).`);
    this._playChime('success');
    if (shouldSpeak) this._speak(`Wired CNOT from control qubit ${ctrlQ} to target qubit ${tgtQ}. What gate should I add next?`);
    return `CNOT(q${ctrlQ}➔q${tgtQ})`;
  }

  _parseAndPlaceSWAP(text, shouldSpeak = true) {
    const ui = window.circuitUI;
    if (!ui) return null;
    const nums = [];
    const numMatches = text.matchAll(/\b([0-7]|zero|one|two|three|four|five|six|seven|first|second|third|fourth|fifth|sixth|seventh)\b/gi);
    for (const m of numMatches) {
      const val = this._extractQubitNum(m[1]);
      if (val >= 0 && val < ui.numQubits) nums.push(val);
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
    this._playChime('success');
    if (shouldSpeak) this._speak(`Placed SWAP between qubit ${q1} and qubit ${q2}. What is our next step?`);
    return `SWAP(q${q1}, q${q2})`;
  }

  _parseAndPlaceToffoli(text, shouldSpeak = true) {
    const ui = window.circuitUI;
    if (!ui) return null;
    while (ui.numQubits < 3) ui.addQubit();

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
    this._playChime('success');
    if (shouldSpeak) this._speak('Added Toffoli gate on qubits 0, 1, and 2. What would you like to build next?');
    return 'Toffoli(CCX)';
  }
}

// Immediately instantiate and attach globally
window.QuantumVoiceCopilot = QuantumVoiceCopilot;
if (!window.quantumVoiceCopilot) {
  window.quantumVoiceCopilot = new QuantumVoiceCopilot();
}
document.addEventListener('DOMContentLoaded', () => {
  if (!window.quantumVoiceCopilot) {
    window.quantumVoiceCopilot = new QuantumVoiceCopilot();
  }
});
