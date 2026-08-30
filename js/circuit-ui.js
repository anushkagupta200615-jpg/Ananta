/**
 * Circuit UI Controller - Enhanced for Ananta Quantum Studio
 * Handles drag-and-drop / click-to-place gate grid, wire state changes,
 * step-by-step playback ("Quantum Time Machine"), phase clock dials,
 * live Dirac Bra-Ket math HUD, and Monte Carlo 1024-shot measurement laboratory.
 */

class CircuitUI {
  constructor(engine, blochSphere) {
    this.engine = engine;
    this.bloch = blochSphere;
    this.numQubits = 3;
    this.numCols = 6;
    this.selectedQubitForBloch = 0;

    // Grid: grid[qubit][col] - Initialized with Bell State (|000⟩ + |110⟩)/√2 by default so the simulator is alive immediately!
    this.grid = [
      ['H', 'CX_CTRL', null, null, null, null],
      [null, 'CX_TGT', null, null, null, null],
      [null, null, null, null, null, null]
    ];
    this.activeDragGate = null;

    // Step-by-Step Playback Controller (-1 = full circuit, 0 = init |000⟩, 1..6 = after col 0..5)
    this.playbackStep = -1;
    this.isPlaying = false;
    this.playInterval = null;

    // Guided Algorithm Tour Controller
    this.currentTour = null;
    this.tourStep = 0;
    this.isTourAutoPlaying = false;
    this.tourAutoTimer = null;

    // Quantum Audio Synthesizer
    this.audio = window.QuantumAudioSynthesizer ? new window.QuantumAudioSynthesizer() : null;

    this.initDOM();
    this.bindEvents();
    this.bindStepperEvents();
    this.bindMeasurementEvents();
    this.bindTourEvents();
    this.bindAudioEvents();
    this.bindBlochPillEvents();
    this.initAnalyticsDeck();
    this.updateSimulation();
  }

  initDOM() {
    this.gridContainer = document.getElementById('circuit-grid');
    this.paletteContainer = document.getElementById('gate-palette');
    this.probsContainer = document.getElementById('probability-bars');
    this.qubitSelect = document.getElementById('bloch-qubit-select');
    this.coordsBadge = document.getElementById('bloch-coords');
    this.qiskitCodeBlock = document.getElementById('qiskit-code');
    this.qasmCodeBlock = document.getElementById('qasm-code');
    this.diracHud = document.getElementById('dirac-math-hud');
    this.densityContainer = document.getElementById('density-matrix-container');
    this.densityEntropyBadge = document.getElementById('density-entropy-badge');
    this.tourBar = document.getElementById('guided-algo-tour-bar');

    this.renderGrid();
  }

  setGate(qubit, col, gateName) {
    this.placeGate(gateName, qubit, col);
  }

  renderGrid() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = '';

    for (let q = 0; q < this.numQubits; q++) {
      const row = document.createElement('div');
      row.className = 'circuit-wire-row';
      row.setAttribute('data-qubit', q);

      // Qubit Label
      const label = document.createElement('div');
      label.className = 'wire-label';
      label.innerHTML = `<span class="wire-name">q<sub>${q}</sub></span> <span class="wire-state">|0⟩</span>`;
      row.appendChild(label);

      // Wire track with continuous luminous quantum line
      const wireTrack = document.createElement('div');
      wireTrack.className = 'wire-track';

      for (let c = 0; c < this.numCols; c++) {
        const slot = document.createElement('div');
        slot.className = 'gate-slot';
        slot.setAttribute('data-qubit', q);
        slot.setAttribute('data-col', c);
        slot.id = `slot-${q}-${c}`;

        // If step playback is active, highlight active column
        if (this.playbackStep >= 1 && c === (this.playbackStep - 1)) {
          slot.classList.add('active-step-col');
        }

        // Render placed gate if any
        const gate = this.grid[q][c];
        if (gate) {
          slot.classList.add('has-gate');
          slot.appendChild(this.createGateElement(gate, q, c));
        } else if (window.selectedPaletteGate) {
          slot.classList.add('ready-to-place');
        }

        // Dragover / Drop handlers
        slot.addEventListener('dragover', (e) => {
          e.preventDefault();
          slot.classList.add('drag-hover');
        });
        slot.addEventListener('dragleave', () => slot.classList.remove('drag-hover'));
        slot.addEventListener('drop', (e) => {
          e.preventDefault();
          slot.classList.remove('drag-hover');
          const droppedGate = e.dataTransfer.getData('text/plain') || this.activeDragGate;
          if (droppedGate) {
            this.placeGate(droppedGate, q, c);
          }
        });

        // Click to place, remove, or guide
        slot.addEventListener('click', () => {
          if (window.selectedPaletteGate) {
            this.placeGate(window.selectedPaletteGate, q, c);
          } else if (this.grid[q][c]) {
            this.removeGate(q, c);
          } else {
            const hint = document.getElementById('palette-hint-text');
            if (hint) {
              hint.innerHTML = '👉 <strong>Select a gate first:</strong> Click H, ⊕, X, or Z on the left to arm it!';
              const bar = document.getElementById('palette-hint-bar');
              if (bar) {
                bar.classList.add('hint-alert');
                setTimeout(() => bar.classList.remove('hint-alert'), 1200);
              }
            }
          }
        });

        wireTrack.appendChild(slot);
      }

      row.appendChild(wireTrack);
      this.gridContainer.appendChild(row);
    }

    // Render vertical CNOT quantum entanglement connectors
    setTimeout(() => this.renderCnotConnectors(), 10);
  }

  renderCnotConnectors() {
    document.querySelectorAll('.cnot-vertical-connector').forEach(el => el.remove());

    for (let c = 0; c < this.numCols; c++) {
      let ctrlQubit = -1;
      let tgtQubit = -1;
      for (let q = 0; q < this.numQubits; q++) {
        if (this.grid[q][c] === 'CX_CTRL') ctrlQubit = q;
        if (this.grid[q][c] === 'CX_TGT') tgtQubit = q;
      }

      if (ctrlQubit !== -1 && tgtQubit !== -1) {
        const topQ = Math.min(ctrlQubit, tgtQubit);
        const botQ = Math.max(ctrlQubit, tgtQubit);
        const topSlot = document.getElementById(`slot-${topQ}-${c}`);
        const botSlot = document.getElementById(`slot-${botQ}-${c}`);

        if (topSlot && botSlot) {
          const rectTop = topSlot.getBoundingClientRect();
          const rectBot = botSlot.getBoundingClientRect();
          const gridRect = this.gridContainer.getBoundingClientRect();

          const connector = document.createElement('div');
          connector.className = 'cnot-vertical-connector';
          const topPos = (rectTop.top + rectTop.height / 2) - gridRect.top;
          const height = (rectBot.top + rectBot.height / 2) - (rectTop.top + rectTop.height / 2);
          const leftPos = (rectTop.left + rectTop.width / 2) - gridRect.left;

          connector.style.top = `${topPos}px`;
          connector.style.left = `${leftPos}px`;
          connector.style.height = `${height}px`;

          this.gridContainer.appendChild(connector);
        }
      }
    }
  }

  createGateElement(gateName, qubit, col) {
    const el = document.createElement('div');
    const cssName = gateName.toLowerCase().replace('_ctrl', '-ctrl').replace('_tgt', '-tgt');
    el.className = `placed-gate gate-chip gate-${cssName}`;
    el.setAttribute('data-gate', gateName);

    if (gateName === 'CX_CTRL') {
      el.className += ' gate-cnot-ctrl';
      el.innerHTML = '<span class="cnot-dot">●</span><span class="gate-sublabel">CTRL</span>';
    } else if (gateName === 'CX_TGT') {
      el.className += ' gate-cnot-tgt';
      el.innerHTML = '<span class="cnot-cross">⊕</span><span class="gate-sublabel">TGT</span>';
    } else {
      const sublabels = {
        'H': 'Superpos',
        'X': 'NOT Flip',
        'Y': 'Pauli-Y',
        'Z': 'Phase',
        'S': '90° Phase',
        'T': '45° Phase',
        'M': 'Measure'
      };
      const displayKey = gateName === 'M' ? '∿' : gateName;
      el.innerHTML = `
        <span class="gate-main-letter">${displayKey}</span>
        <span class="gate-sublabel">${sublabels[gateName] || ''}</span>
      `;
    }

    const del = document.createElement('span');
    del.className = 'gate-delete-x';
    del.textContent = '✕';
    del.title = 'Remove gate';
    el.appendChild(del);

    el.title = `${gateName} on Wire q[${qubit}], Column ${col + 1} (Click to remove)`;
    return el;
  }

  runInteractiveSimulation() {
    const btn = document.getElementById('btn-run-calc');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⚡ Simulating Wavefunction...';
      btn.classList.add('sim-active');
    }

    if (this.audio && this.audio.isEnabled) {
      this.audio.playStatevectorChord(this.engine.getProbabilities());
    }

    // Visual wave packet sweep across columns
    for (let c = 0; c < this.numCols; c++) {
      setTimeout(() => {
        for (let q = 0; q < this.numQubits; q++) {
          const s = document.getElementById(`slot-${q}-${c}`);
          if (s) {
            s.classList.add('pulse-sweep');
            setTimeout(() => s.classList.remove('pulse-sweep'), 280);
          }
        }
      }, c * 75);
    }

    setTimeout(() => {
      this.updateSimulation();
      if (btn) {
        btn.innerHTML = '✓ Simulation Complete (100% Fidelity)';
        btn.classList.remove('sim-active');
        btn.classList.add('sim-done');
        setTimeout(() => {
          btn.innerHTML = 'Run Circuit Simulation ⚡';
          btn.disabled = false;
          btn.classList.remove('sim-done');
        }, 1200);
      }
    }, this.numCols * 75 + 100);
  }

  placeGate(gateName, qubit, col) {
    if (gateName === 'CX') {
      const targetQubit = (qubit + 1) % this.numQubits;
      this.grid[qubit][col] = 'CX_CTRL';
      this.grid[targetQubit][col] = 'CX_TGT';
    } else {
      this.grid[qubit][col] = gateName;
    }

    this.renderGrid();
    this.updateSimulation();
  }

  removeGate(qubit, col) {
    const current = this.grid[qubit][col];
    if (current === 'CX_CTRL' || current === 'CX_TGT') {
      for (let q = 0; q < this.numQubits; q++) {
        const c = this.grid[q][col];
        if (c === 'CX_CTRL' || c === 'CX_TGT') {
          this.grid[q][col] = null;
        }
      }
    } else {
      this.grid[qubit][col] = null;
    }

    this.renderGrid();
    this.updateSimulation();
  }

  clearCircuit() {
    this.playbackStep = -1;
    this.stopPlayback();
    this.grid = Array.from({ length: this.numQubits }, () => Array(this.numCols).fill(null));
    this.renderGrid();
    this.updateSimulation();
  }

  loadPreset(gridData) {
    this.playbackStep = -1;
    this.stopPlayback();
    this.grid = gridData.map(row => [...row]);
    this.renderGrid();
    this.updateSimulation();
  }

  loadCircuit(gridData) {
    this.loadPreset(gridData);
  }

  // =========================================================================
  // STEP-BY-STEP PLAYBACK CONTROLLER ("Quantum Time Machine")
  // =========================================================================
  bindStepperEvents() {
    const btnStart = document.getElementById('btn-step-start');
    const btnPrev = document.getElementById('btn-step-prev');
    const btnPlay = document.getElementById('btn-step-play');
    const btnNext = document.getElementById('btn-step-next');
    const btnEnd = document.getElementById('btn-step-end');

    if (btnStart) btnStart.addEventListener('click', () => this.seekStep(0));
    if (btnPrev) btnPrev.addEventListener('click', () => this.stepBackward());
    if (btnPlay) btnPlay.addEventListener('click', () => this.togglePlayPause());
    if (btnNext) btnNext.addEventListener('click', () => this.stepForward());
    if (btnEnd) btnEnd.addEventListener('click', () => this.seekStep(this.numCols));
  }

  seekStep(stepIndex) {
    this.playbackStep = stepIndex;
    this.updateSimulation();
    this.renderGrid();
    this.updateStepperDisplay();
  }

  stepForward() {
    if (this.playbackStep === -1) this.playbackStep = 0;
    if (this.playbackStep < this.numCols) {
      this.seekStep(this.playbackStep + 1);
    }
  }

  stepBackward() {
    if (this.playbackStep > 0) {
      this.seekStep(this.playbackStep - 1);
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  startPlayback() {
    this.isPlaying = true;
    const playBtn = document.getElementById('btn-step-play');
    if (playBtn) playBtn.innerHTML = '⏸ Pause';

    if (this.playbackStep === -1 || this.playbackStep >= this.numCols) {
      this.seekStep(0);
    }

    this.playInterval = setInterval(() => {
      if (this.playbackStep < this.numCols) {
        this.stepForward();
      } else {
        this.stopPlayback();
      }
    }, 850);
  }

  stopPlayback() {
    this.isPlaying = false;
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    const playBtn = document.getElementById('btn-step-play');
    if (playBtn) playBtn.innerHTML = '▶ Play';
  }

  updateStepperDisplay() {
    const counter = document.getElementById('step-counter-display');
    if (!counter) return;

    if (this.playbackStep === -1 || this.playbackStep === this.numCols) {
      counter.innerHTML = `<strong>Full Circuit State</strong> (Step ${this.numCols} of ${this.numCols})`;
    } else if (this.playbackStep === 0) {
      counter.innerHTML = `<strong>Initial Ground State</strong> (|000⟩ Before Gates)`;
    } else {
      counter.innerHTML = `<strong>Step ${this.playbackStep} of ${this.numCols}</strong> (Column ${this.playbackStep} Evaluated)`;
    }
  }

  // =========================================================================
  // SIMULATION PIPELINE & DIAGNOSTICS
  // =========================================================================
  updateSimulation() {
    // Run up to current playback step or full circuit
    if (this.playbackStep === -1 || this.playbackStep >= this.numCols) {
      this.engine.runCircuit(this.grid);
    } else if (this.playbackStep === 0) {
      this.engine.reset();
    } else {
      this.engine.runCircuitUpToCol(this.grid, this.playbackStep - 1);
    }

    const probs = this.engine.getProbabilities();
    this.renderProbabilities(probs);

    // Update Dirac Math HUD
    if (this.diracHud) {
      this.diracHud.textContent = this.engine.getDiracNotation();
    }

    // Update Bloch Sphere for chosen qubit
    const blochCoords = this.engine.getBlochCoordinates(this.selectedQubitForBloch);
    if (this.bloch) {
      this.bloch.updateCoordinates(blochCoords);
    }

    // Update Coordinate Badges
    if (this.coordsBadge) {
      this.coordsBadge.innerHTML = `
        <span class="badge-item"><strong>X:</strong> ${blochCoords.x.toFixed(2)}</span>
        <span class="badge-item"><strong>Y:</strong> ${blochCoords.y.toFixed(2)}</span>
        <span class="badge-item"><strong>Z:</strong> ${blochCoords.z.toFixed(2)}</span>
        <span class="badge-item state-amp"><strong>|0⟩:</strong> ${(blochCoords.p0 !== undefined ? blochCoords.p0 : 1).toFixed(2)}</span>
        <span class="badge-item state-amp"><strong>|1⟩:</strong> ${(blochCoords.p1 !== undefined ? blochCoords.p1 : 0).toFixed(2)}</span>
      `;
    }

    // Check for Multi-Qubit Entanglement in Circuit
    this.updateEntanglementBadge(probs);

    // Update Export Code
    if (this.qiskitCodeBlock) {
      this.qiskitCodeBlock.textContent = this.engine.toQiskit(this.grid);
    }
    if (this.qasmCodeBlock) {
      this.qasmCodeBlock.textContent = this.engine.toQASM(this.grid);
    }

    // Trigger AI explanation update
    if (window.quantaAI) {
      window.quantaAI.onCircuitChanged(this.grid, probs, blochCoords, this.selectedQubitForBloch);
    }

    // Check gamified missions
    if (window.missionManager) {
      window.missionManager.evaluate(this.grid, probs);
    }

    // Update Hardware Studio (Noise & Skills)
    if (window.hwStudio) {
      window.hwStudio.updateNoiseDisplay();
      window.hwStudio.checkSkillUnlocks();
    }

    // Render Quantum Density Matrix Heatmap
    this.renderDensityMatrix();

    // Render Academic Suite (Unitary Matrix, LaTeX Derivations, Entanglement Metrics)
    this.renderUnitaryInspector();
    this.renderAnalyticalDerivation();
    this.renderEntanglementMetrics();

    // Play Quantum State Harmony Audio if enabled
    if (this.audio && this.audio.isEnabled) {
      this.audio.playStatevectorChord(probs);
    }

    // Update Guided Algorithm Tour banner
    if (this.currentTour) {
      this.updateTourBanner();
    }

    this.updateStepperDisplay();
  }

  updateEntanglementBadge(probs) {
    const badge = document.getElementById('entanglement-status-indicator');
    if (!badge) return;

    // Check if state is in Bell or GHZ pattern (e.g. 000 and 110 or 00 and 11)
    const activeStates = probs.filter(p => p.probability > 0.05);
    const isBell = activeStates.length === 2 && Math.abs(activeStates[0].probability - 0.5) < 0.1 && Math.abs(activeStates[1].probability - 0.5) < 0.1;

    if (isBell) {
      badge.style.display = 'inline-flex';
      badge.innerHTML = `⚡ Entangled Bell State Detected`;
    } else {
      badge.style.display = 'none';
    }
  }

  // =========================================================================
  // STATEVECTOR PROBABILITIES & PHASE CLOCKS (Q-Sphere Representation)
  // =========================================================================
  renderProbabilities(probs) {
    if (!this.probsContainer) return;
    this.probsContainer.innerHTML = '';

    probs.forEach(item => {
      const pct = (item.probability * 100).toFixed(1);
      const isDominant = item.probability > 0.05;

      const barRow = document.createElement('div');
      barRow.className = `prob-bar-row ${isDominant ? 'active-state' : 'inactive-state'}`;
      
      // Build Phase Clock SVG
      const phaseClockHtml = this.createPhaseClockSVG(item);

      barRow.innerHTML = `
        <div class="prob-state-label">${item.state}</div>
        ${phaseClockHtml}
        <div class="prob-bar-track">
          <div class="prob-bar-fill" style="width: ${pct}%"></div>
        </div>
        <div class="prob-val-label">${pct}%</div>
      `;
      this.probsContainer.appendChild(barRow);
    });
  }

  createPhaseClockSVG(item) {
    const rad = item.phase;
    const deg = Math.round((rad / Math.PI) * 180);
    const amp = Math.sqrt(item.probability);
    const cx = 11, cy = 11;
    const radius = 8;
    const nx = cx + Math.cos(rad) * (radius * Math.max(0.35, amp));
    const ny = cy + Math.sin(rad) * (radius * Math.max(0.35, amp));

    let color = '#00f0ff'; // 0 rad
    if (Math.abs(deg) > 150) color = '#fa4d56'; // pi rad (inverted)
    else if (deg > 45 && deg <= 135) color = '#ee5396'; // +pi/2 (i)
    else if (deg < -45 && deg >= -135) color = '#a56eff'; // -pi/2 (-i)

    return `
      <div class="phase-clock-wrap" title="Basis State: ${item.state} | Phase: ${deg}° (${(rad / Math.PI).toFixed(2)}π rad) | Amplitude: ${amp.toFixed(2)}">
        <svg viewBox="0 0 22 22" width="20" height="20" class="phase-clock-svg">
          <circle cx="11" cy="11" r="8.5" fill="none" stroke="var(--border-color)" stroke-width="1.2" />
          <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="${color}" stroke-width="2" stroke-linecap="round" />
          <circle cx="${cx}" cy="${cy}" r="2" fill="${color}" />
        </svg>
        <span class="phase-clock-val" style="color: ${color}">${deg}°</span>
      </div>
    `;
  }

  // =========================================================================
  // PHYSICAL MEASUREMENT LABORATORY (1024 SHOTS MONTE CARLO)
  // =========================================================================
  bindMeasurementEvents() {
    const btnShots = document.getElementById('btn-run-shots');
    if (btnShots) {
      btnShots.addEventListener('click', () => this.runMeasurementShots());
    }
  }

  runMeasurementShots() {
    const resultsBox = document.getElementById('shots-results-container');
    const btn = document.getElementById('btn-run-shots');
    if (!resultsBox) return;

    if (btn) {
      btn.textContent = 'Measuring 1024 Particles...';
      btn.disabled = true;
    }

    setTimeout(() => {
      const shotsData = this.engine.sampleShots(1024);
      if (btn) {
        btn.textContent = 'Run 1024 Physical Shots 🎲';
        btn.disabled = false;
      }
      this.renderShotsResults(shotsData);
    }, 350);
  }

  renderShotsResults(shotsData) {
    const container = document.getElementById('shots-results-container');
    if (!container) return;
    container.innerHTML = '';

    const activeResults = shotsData.results.filter(r => r.measuredCount > 0);

    if (activeResults.length === 0) {
      container.innerHTML = `<div style="font-size:12px; color:var(--text-dim);">No physical shots registered yet. Click "Run 1024 Physical Shots".</div>`;
      return;
    }

    // Play crisp measurement detector collapse sound
    if (this.audio && this.audio.isEnabled && activeResults[0]) {
      this.audio.playMeasurementClick(activeResults[0].state);
    }

    activeResults.forEach(item => {
      const row = document.createElement('div');
      row.className = 'shot-result-row';
      row.innerHTML = `
        <div class="shot-state-name">${item.state}</div>
        <div class="shot-bar-wrapper">
          <div class="shot-bar-fill" style="width: ${item.measuredPct}%;"></div>
        </div>
        <div class="shot-metrics">
          <strong>${item.measuredCount}</strong> shots (${item.measuredPct}%)
          <span class="shot-expected-tag">Theory: ${item.theoreticalPct}%</span>
        </div>
      `;
      container.appendChild(row);
    });
  }

  bindEvents() {
    // Gate Palette drag & click
    const paletteChips = document.querySelectorAll('.gate-btn');
    paletteChips.forEach(chip => {
      const gate = chip.getAttribute('data-gate');

      chip.addEventListener('dragstart', (e) => {
        this.activeDragGate = gate;
        e.dataTransfer.setData('text/plain', gate);
      });

      chip.addEventListener('click', () => {
        const hintEl = document.getElementById('palette-hint-text');
        const slots = document.querySelectorAll('.gate-slot:not(.has-gate)');

        if (window.selectedPaletteGate === gate) {
          window.selectedPaletteGate = null;
          chip.classList.remove('selected-palette');
          slots.forEach(s => s.classList.remove('ready-to-place'));
          if (hintEl) hintEl.innerHTML = '💡 <strong>How to build:</strong> Click a gate above, then click a slot on wires q0, q1, or q2.';
        } else {
          paletteChips.forEach(c => c.classList.remove('selected-palette'));
          window.selectedPaletteGate = gate;
          chip.classList.add('selected-palette');
          slots.forEach(s => s.classList.add('ready-to-place'));
          if (hintEl) hintEl.innerHTML = `🎯 <strong>Armed: [ ${gate} ]</strong> - Click any slot on wires q0, q1, or q2 to place. (Click ${gate} again to cancel)`;
        }
      });
    });

    // Bloch Qubit Selector
    if (this.qubitSelect) {
      this.qubitSelect.addEventListener('change', (e) => {
        this.selectedQubitForBloch = parseInt(e.target.value, 10);
        this.updateSimulation();
      });
    }

    // Clear Circuit Button
    const clearBtn = document.getElementById('btn-clear-circuit') || document.getElementById('btn-clear-circ');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearCircuit());
    }

    // Copy Code Buttons
    const copyQiskitBtn = document.getElementById('btn-copy-qiskit');
    if (copyQiskitBtn) {
      copyQiskitBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(this.qiskitCodeBlock.textContent);
        copyQiskitBtn.textContent = 'Copied!';
        setTimeout(() => copyQiskitBtn.textContent = 'Copy Python', 2000);
      });
    }

    const copyQasmBtn = document.getElementById('btn-copy-qasm');
    if (copyQasmBtn) {
      copyQasmBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(this.qasmCodeBlock.textContent);
        copyQasmBtn.textContent = 'Copied!';
        setTimeout(() => copyQasmBtn.textContent = 'Copy QASM', 2000);
      });
    }
  }

  // =========================================================================
  // QUANTUM DENSITY MATRIX (ρ = |ψ⟩⟨ψ|) HEATMAP
  // =========================================================================
  renderDensityMatrix() {
    if (!this.densityContainer) return;
    const matrix = this.engine.getDensityMatrix();
    const entropy = this.engine.getEntanglementEntropy();

    if (this.densityEntropyBadge) {
      this.densityEntropyBadge.textContent = `Entropy S = ${entropy.toFixed(2)}`;
      if (entropy > 0.05) {
        this.densityEntropyBadge.style.color = '#00f0ff';
      } else {
        this.densityEntropyBadge.style.color = 'var(--text-dim)';
      }
    }

    this.densityContainer.innerHTML = '';
    const table = document.createElement('div');
    table.className = 'density-matrix-table';

    for (let r = 0; r < 8; r++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'density-matrix-row';

      for (let c = 0; c < 8; c++) {
        const cell = matrix[r][c];
        const cellDiv = document.createElement('div');
        cellDiv.className = 'density-cell' + (cell.isDiagonal ? ' diag-cell' : '');

        // Color intensity based on magnitude
        const mag = cell.mag;
        if (mag > 0.005) {
          if (cell.isDiagonal) {
            cellDiv.style.background = `rgba(16, 185, 129, ${Math.min(1, mag * 1.1)})`;
          } else {
            cellDiv.style.background = `rgba(6, 182, 212, ${Math.min(0.9, mag * 0.95)})`;
          }
        } else {
          cellDiv.style.background = 'transparent';
        }

        const stateR = `|${r.toString(2).padStart(3, '0')}⟩`;
        const stateC = `⟨${c.toString(2).padStart(3, '0')}|`;
        cellDiv.title = `ρ(${stateR}, ${stateC})\nRe: ${cell.re.toFixed(3)}\nIm: ${cell.im.toFixed(3)}\n|ρ|: ${cell.mag.toFixed(3)}`;

        rowDiv.appendChild(cellDiv);
      }
      table.appendChild(rowDiv);
    }
    this.densityContainer.appendChild(table);
  }

  // =========================================================================
  // 1. UNITARY MATRIX (U_total) INSPECTOR
  // =========================================================================
  renderUnitaryInspector() {
    const gridEl = document.getElementById('unitary-matrix-grid');
    const invariantsBar = document.getElementById('unitary-invariants-bar');
    if (!gridEl) return;

    const uData = this.engine.computeTotalUnitary(this.grid, this.playbackStep);
    this.lastUnitaryData = uData;

    if (invariantsBar) {
      invariantsBar.innerHTML = `
        <div class="matrix-invariant-chip ${uData.isUnitary ? 'chip-verified' : 'chip-warn'}">
          <span class="chip-label">Unitarity:</span>
          <strong>${uData.isUnitary ? 'U†U = I (Conserved ✓)' : 'Norm Degraded'}</strong>
        </div>
        <div class="matrix-invariant-chip">
          <span class="chip-label">det(U):</span>
          <code>${uData.detStr}</code>
        </div>
        <div class="matrix-invariant-chip">
          <span class="chip-label">Tr(U):</span>
          <code>${uData.traceStr}</code>
        </div>
        <div class="matrix-actions-group">
          <button class="btn-copy-matrix-chip" id="btn-copy-latex-matrix" title="Copy LaTeX pmatrix code for papers and homework">LaTeX Matrix 📋</button>
          <button class="btn-copy-matrix-chip" id="btn-copy-numpy-matrix" title="Copy NumPy complex array code">NumPy Array 📋</button>
        </div>
      `;

      const btnLatex = document.getElementById('btn-copy-latex-matrix');
      if (btnLatex) {
        btnLatex.addEventListener('click', () => {
          navigator.clipboard.writeText(uData.latexCode);
          btnLatex.textContent = 'Copied LaTeX! ✓';
          setTimeout(() => btnLatex.textContent = 'LaTeX Matrix 📋', 1800);
        });
      }
      const btnNumPy = document.getElementById('btn-copy-numpy-matrix');
      if (btnNumPy) {
        btnNumPy.addEventListener('click', () => {
          navigator.clipboard.writeText(uData.numpyCode);
          btnNumPy.textContent = 'Copied NumPy! ✓';
          setTimeout(() => btnNumPy.textContent = 'NumPy Array 📋', 1800);
        });
      }
    }

    // Build 8x8 Table
    const basisLabels = ['000', '001', '010', '011', '100', '101', '110', '111'];
    let html = '<table class="unitary-table"><thead><tr><th>⟨out|in⟩</th>';
    for (let j = 0; j < 8; j++) {
      html += `<th>|${basisLabels[j]}⟩</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let i = 0; i < 8; i++) {
      html += `<tr><th>⟨${basisLabels[i]}|</th>`;
      for (let j = 0; j < 8; j++) {
        const c = uData.matrix[i][j];
        const mag = c.abs();
        let cls = 'u-cell-zero';
        if (mag > 0.99) cls = 'u-cell-one';
        else if (mag > 0.01) cls = 'u-cell-active';

        const re = Math.abs(c.re) < 1e-3 ? 0 : c.re;
        const im = Math.abs(c.im) < 1e-3 ? 0 : c.im;
        let str = '0';
        if (Math.abs(re - 1) < 1e-3 && im === 0) str = '1';
        else if (Math.abs(re + 1) < 1e-3 && im === 0) str = '-1';
        else if (re === 0 && Math.abs(im - 1) < 1e-3) str = 'i';
        else if (re === 0 && Math.abs(im + 1) < 1e-3) str = '-i';
        else if (Math.abs(mag - 0.707) < 0.02) {
          str = (re < 0 || im < 0 ? '-' : '') + '1/√2';
        } else if (mag > 0.001) {
          str = c.re.toFixed(2) + (im !== 0 ? (im > 0 ? '+' : '') + c.im.toFixed(2) + 'i' : '');
        }

        html += `<td class="u-cell ${cls}" title="Row |${basisLabels[i]}⟩, Col |${basisLabels[j]}⟩: ${c.re.toFixed(4)}${c.im >= 0 ? '+' : ''}${c.im.toFixed(4)}i">${str}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    gridEl.innerHTML = html;
  }

  // =========================================================================
  // 2. STEP-BY-STEP ANALYTICAL DERIVATION GENERATOR
  // =========================================================================
  renderAnalyticalDerivation() {
    const container = document.getElementById('derivation-steps-container');
    const btnCopyLatex = document.getElementById('btn-copy-latex-derivation');
    if (!container) return;

    const derivation = this.engine.generateAnalyticalDerivation(this.grid, this.playbackStep);
    this.lastDerivationData = derivation;

    let html = '';
    derivation.steps.forEach((st) => {
      html += `
        <div class="derivation-step-item">
          <div class="step-badge-row">
            <span class="step-num-pill">Step ${st.stepNum}</span>
            <span class="step-op-title">${st.operation}</span>
          </div>
          <div class="step-equation-box">
            <code>${st.dirac}</code>
          </div>
          <p class="step-desc-text">${st.explanation}</p>
        </div>
      `;
    });
    container.innerHTML = html;

    if (btnCopyLatex) {
      btnCopyLatex.onclick = () => {
        navigator.clipboard.writeText(derivation.fullLatex);
        btnCopyLatex.textContent = 'Copied LaTeX Proof! ✓';
        setTimeout(() => btnCopyLatex.textContent = 'Copy LaTeX Proof 📋', 2000);
      };
    }
  }

  // =========================================================================
  // 3. RIGOROUS QUANTUM ENTANGLEMENT & PURITY METRICS
  // =========================================================================
  renderEntanglementMetrics() {
    const panel = document.getElementById('entanglement-metrics-panel');
    if (!panel) return;

    const m = this.engine.getAdvancedEntanglementMetrics();

    panel.innerHTML = `
      <div class="entangle-summary-banner">
        <div class="entangle-class-tag">
          <span class="entangle-icon">⚛️</span>
          <div>
            <span class="entangle-eyebrow">Quantum State Classification</span>
            <h4 class="entangle-class-name">${m.entanglementClass}</h4>
          </div>
        </div>
        <div class="schmidt-pill">
          <span>Schmidt Rank: <strong>${m.schmidtRank}</strong></span>
        </div>
      </div>

      <div class="entangle-gauges-grid">
        <div class="entangle-gauge-card">
          <div class="gauge-header">
            <span class="gauge-title">Wootters Concurrence C(ρ₀₁)</span>
            <span class="gauge-val">${m.concurrence.toFixed(3)}</span>
          </div>
          <div class="gauge-bar-track">
            <div class="gauge-bar-fill fill-cyan" style="width: ${(m.concurrence * 100).toFixed(0)}%"></div>
          </div>
          <span class="gauge-note">C=1.0: Bell State | C=0.0: Separable</span>
        </div>

        <div class="entangle-gauge-card">
          <div class="gauge-header">
            <span class="gauge-title">Von Neumann Entropy S(ρ₀)</span>
            <span class="gauge-val">${m.vonNeumannEntropy.toFixed(3)}</span>
          </div>
          <div class="gauge-bar-track">
            <div class="gauge-bar-fill fill-magenta" style="width: ${(m.vonNeumannEntropy * 100).toFixed(0)}%"></div>
          </div>
          <span class="gauge-note">Bipartite entanglement across q0 vs (q1, q2)</span>
        </div>

        <div class="entangle-gauge-card">
          <div class="gauge-header">
            <span class="gauge-title">State Purity γ = Tr(ρ²)</span>
            <span class="gauge-val">${m.purity.toFixed(3)}</span>
          </div>
          <div class="gauge-bar-track">
            <div class="gauge-bar-fill fill-green" style="width: ${(m.purity * 100).toFixed(0)}%"></div>
          </div>
          <span class="gauge-note">γ=1.0: Pure State | γ < 1.0: Mixed under decoherence</span>
        </div>

        <div class="entangle-gauge-card">
          <div class="gauge-header">
            <span class="gauge-title">Mutual Information I(q₀ : q₁)</span>
            <span class="gauge-val">${m.mutualInformation.toFixed(3)}</span>
          </div>
          <div class="gauge-bar-track">
            <div class="gauge-bar-fill fill-blue" style="width: ${(Math.min(2, m.mutualInformation) / 2 * 100).toFixed(0)}%"></div>
          </div>
          <span class="gauge-note">Total classical and quantum correlations</span>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 4. ANALYTICS DECK TAB SWITCHER
  // =========================================================================
  initAnalyticsDeck() {
    const tabs = document.querySelectorAll('.analytics-deck-tab');
    const panels = document.querySelectorAll('.analytics-deck-panel');
    if (!tabs || tabs.length === 0) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-deck-tab');
        if (!target) return;

        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const activePanel = document.getElementById(`deck-panel-${target}`);
        if (activePanel) {
          activePanel.classList.add('active');
        }

        // If bloch sphere selected, trigger canvas resize
        if (target === 'bloch' && this.bloch) {
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            const coords = this.engine.getBlochCoordinates(this.selectedQubitForBloch);
            this.bloch.updateCoordinates(coords);
          }, 50);
        }
      });
    });
  }

  // =========================================================================
  // BLOCH QUICK PILL BUTTONS
  // =========================================================================
  bindBlochPillEvents() {
    const pills = document.querySelectorAll('.bloch-pill-btn');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedQubitForBloch = parseInt(pill.dataset.qubit, 10);
        if (this.qubitSelect) {
          this.qubitSelect.value = this.selectedQubitForBloch.toString();
        }
        this.updateSimulation();
      });
    });
  }

  // =========================================================================
  // QUANTUM AUDIO EVENTS
  // =========================================================================
  bindAudioEvents() {
    const audioBtn = document.getElementById('btn-toggle-quantum-audio');
    if (!audioBtn || !this.audio) return;

    audioBtn.addEventListener('click', () => {
      const isEnabled = this.audio.toggleAudio();
      audioBtn.classList.toggle('audio-active', isEnabled);
      const icon = document.getElementById('audio-btn-icon');
      if (icon) icon.textContent = isEnabled ? '🔊' : '🔇';
      audioBtn.title = isEnabled ? 'Quantum sound synthesis active (Click to mute)' : 'Click to hear quantum state harmony';

      if (isEnabled) {
        this.audio.playStatevectorChord(this.engine.getProbabilities());
      }
    });
  }

  // =========================================================================
  // GUIDED ALGORITHM TOUR CONTROLLER
  // =========================================================================
  bindTourEvents() {
    const btnNext = document.getElementById('btn-tour-next');
    const btnPrev = document.getElementById('btn-tour-prev');
    const btnExit = document.getElementById('btn-tour-exit');
    const btnAuto = document.getElementById('btn-tour-auto');

    if (btnNext) btnNext.addEventListener('click', () => this.nextTourStep());
    if (btnPrev) btnPrev.addEventListener('click', () => this.prevTourStep());
    if (btnExit) btnExit.addEventListener('click', () => this.exitTour());
    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        if (this.isTourAutoPlaying) {
          this.stopTourAutoPlay();
        } else {
          this.startTourAutoPlay();
        }
      });
    }
  }

  startAlgorithmTour(algo) {
    this.currentTour = algo;
    this.tourStep = 0;
    this.stopTourAutoPlay();

    if (this.tourBar) {
      this.tourBar.style.display = 'block';
    }

    // Seek playback to first step
    this.playbackStep = 1;
    this.renderGrid();
    this.updateSimulation();
    this.updateTourBanner();
  }

  updateTourBanner() {
    if (!this.currentTour) return;
    const titleEl = document.getElementById('tour-algo-title');
    const badgeEl = document.getElementById('tour-step-badge');
    const textEl = document.getElementById('tour-explanation-text');

    const steps = this.currentTour.tourSteps || this.generateDefaultTourSteps(this.currentTour);
    const total = steps.length;
    const idx = Math.min(this.tourStep, total - 1);
    const cur = steps[idx];

    if (titleEl) titleEl.textContent = this.currentTour.title;
    if (badgeEl) badgeEl.textContent = `Step ${idx + 1} of ${total}`;
    if (textEl && cur) {
      textEl.innerHTML = `<strong>${cur.title}:</strong> ${cur.text}`;
    }
  }

  generateDefaultTourSteps(algo) {
    // Generate intelligent tour steps based on gates in each column
    const steps = [];
    for (let c = 0; c < this.numCols; c++) {
      const colGates = [];
      for (let q = 0; q < this.numQubits; q++) {
        const g = algo.grid[q][c];
        if (g) colGates.push(`q${q}: ${g}`);
      }
      if (colGates.length > 0) {
        steps.push({
          step: c + 1,
          col: c,
          title: `Column ${c + 1} Evaluation`,
          text: `Executing operations: ${colGates.join(', ')}. Observe the live Dirac math equation and phase clock dials adjusting to the new state.`
        });
      }
    }
    if (steps.length === 0) {
      steps.push({ step: 1, col: 0, title: 'Ground State', text: 'All qubits initialized in |000⟩.' });
    }
    return steps;
  }

  nextTourStep() {
    if (!this.currentTour) return;
    const steps = this.currentTour.tourSteps || this.generateDefaultTourSteps(this.currentTour);
    if (this.tourStep < steps.length - 1) {
      this.tourStep++;
      const cur = steps[this.tourStep];
      this.playbackStep = cur.col !== undefined ? cur.col + 1 : this.tourStep + 1;
      this.renderGrid();
      this.updateSimulation();
      this.updateTourBanner();
    } else {
      // Finished tour
      this.stopTourAutoPlay();
      this.playbackStep = -1; // Full circuit
      this.renderGrid();
      this.updateSimulation();
      const badgeEl = document.getElementById('tour-step-badge');
      if (badgeEl) badgeEl.textContent = 'Tour Complete ✓';
    }
  }

  prevTourStep() {
    if (!this.currentTour) return;
    const steps = this.currentTour.tourSteps || this.generateDefaultTourSteps(this.currentTour);
    if (this.tourStep > 0) {
      this.tourStep--;
      const cur = steps[this.tourStep];
      this.playbackStep = cur.col !== undefined ? cur.col + 1 : this.tourStep + 1;
      this.renderGrid();
      this.updateSimulation();
      this.updateTourBanner();
    }
  }

  startTourAutoPlay() {
    this.isTourAutoPlaying = true;
    const btnAuto = document.getElementById('btn-tour-auto');
    if (btnAuto) {
      btnAuto.textContent = 'Pause ⏸';
      btnAuto.classList.add('tour-playing');
    }
    this.tourAutoTimer = setInterval(() => {
      const steps = this.currentTour.tourSteps || this.generateDefaultTourSteps(this.currentTour);
      if (this.tourStep >= steps.length - 1) {
        this.stopTourAutoPlay();
      } else {
        this.nextTourStep();
      }
    }, 2200);
  }

  stopTourAutoPlay() {
    this.isTourAutoPlaying = false;
    if (this.tourAutoTimer) {
      clearInterval(this.tourAutoTimer);
      this.tourAutoTimer = null;
    }
    const btnAuto = document.getElementById('btn-tour-auto');
    if (btnAuto) {
      btnAuto.textContent = 'Auto-Play ⏩';
      btnAuto.classList.remove('tour-playing');
    }
  }

  exitTour() {
    this.stopTourAutoPlay();
    this.currentTour = null;
    if (this.tourBar) {
      this.tourBar.style.display = 'none';
    }
    this.playbackStep = -1;
    this.renderGrid();
    this.updateSimulation();
  }
}

window.CircuitUI = CircuitUI;
