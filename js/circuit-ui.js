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

    // Grid: grid[qubit][col]
    this.grid = Array.from({ length: this.numQubits }, () => Array(this.numCols).fill(null));
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

      // Wire track with slots
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
          slot.appendChild(this.createGateElement(gate, q, c));
        }

        // Dragover / Drop handlers
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', (e) => {
          e.preventDefault();
          const droppedGate = e.dataTransfer.getData('text/plain') || this.activeDragGate;
          if (droppedGate) {
            this.placeGate(droppedGate, q, c);
          }
        });

        slot.addEventListener('click', () => {
          if (window.selectedPaletteGate) {
            this.placeGate(window.selectedPaletteGate, q, c);
          } else if (this.grid[q][c]) {
            this.removeGate(q, c);
          }
        });

        wireTrack.appendChild(slot);
      }

      row.appendChild(wireTrack);
      this.gridContainer.appendChild(row);
    }
  }

  createGateElement(gateName, qubit, col) {
    const el = document.createElement('div');
    el.className = `placed-gate gate-color-${gateName.toLowerCase()}`;
    el.setAttribute('data-gate', gateName);

    if (gateName === 'CX_CTRL') {
      el.className += ' gate-cx-ctrl';
      el.innerHTML = '<span class="cnot-dot">●</span>';
    } else if (gateName === 'CX_TGT') {
      el.className += ' gate-cx-tgt';
      el.innerHTML = '<span class="cnot-cross">⊕</span>';
    } else {
      el.textContent = gateName;
    }

    el.title = `${gateName} on q[${qubit}] col ${col + 1} (Click to remove)`;
    return el;
  }

  placeGate(gateName, qubit, col) {
    if (gateName === 'CX') {
      // Find other qubit for CNOT target
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
        if (window.selectedPaletteGate === gate) {
          window.selectedPaletteGate = null;
          chip.classList.remove('selected-palette');
        } else {
          paletteChips.forEach(c => c.classList.remove('selected-palette'));
          window.selectedPaletteGate = gate;
          chip.classList.add('selected-palette');
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
            cellDiv.style.background = `rgba(15, 98, 254, ${Math.min(1, mag * 1.1)})`;
          } else {
            cellDiv.style.background = `rgba(0, 240, 255, ${Math.min(0.9, mag * 0.95)})`;
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
