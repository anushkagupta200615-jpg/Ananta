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

    this.initDOM();
    this.bindEvents();
    this.bindStepperEvents();
    this.bindMeasurementEvents();
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
}

window.CircuitUI = CircuitUI;
