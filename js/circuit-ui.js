/**
 * Circuit UI Controller
 * Handles drag-and-drop / click-to-place gate grid, wire state changes, probability bars, and code generation.
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

    this.initDOM();
    this.bindEvents();
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

        const currentGate = this.grid[q][c];
        if (currentGate) {
          slot.appendChild(this.createGateElement(currentGate, q, c));
          slot.classList.add('has-gate');
        }

        // Drag-and-drop target
        slot.addEventListener('dragover', (e) => {
          e.preventDefault();
          slot.classList.add('drag-over');
        });
        slot.addEventListener('dragleave', () => {
          slot.classList.remove('drag-over');
        });
        slot.addEventListener('drop', (e) => {
          e.preventDefault();
          slot.classList.remove('drag-over');
          const gateType = e.dataTransfer.getData('text/plain') || this.activeDragGate;
          if (gateType) {
            this.setGate(q, c, gateType);
          }
        });

        // Click to place if a palette item was selected
        slot.addEventListener('click', () => {
          if (window.selectedPaletteGate) {
            this.setGate(q, c, window.selectedPaletteGate);
          } else if (this.grid[q][c]) {
            // Click existing gate to remove
            this.setGate(q, c, null);
          }
        });

        wireTrack.appendChild(slot);
      }

      row.appendChild(wireTrack);
      this.gridContainer.appendChild(row);
    }
  }

  createGateElement(gateType, q, c) {
    const el = document.createElement('div');
    el.className = `gate-chip gate-${gateType.toLowerCase()}`;
    el.setAttribute('data-gate', gateType);
    el.setAttribute('title', `Click to remove | ${gateType}`);

    if (gateType === 'CX_CTRL') {
      el.innerHTML = '<span class="cnot-control-dot">●</span>';
      el.classList.add('gate-cnot-ctrl');
    } else if (gateType === 'CX_TGT') {
      el.innerHTML = '<span class="cnot-target-cross">⊕</span>';
      el.classList.add('gate-cnot-tgt');
    } else {
      el.textContent = gateType;
    }

    return el;
  }

  setGate(qubit, col, gateType) {
    if (gateType === 'CX') {
      // Special logic for 2-qubit CNOT:
      // If placed on q0, control is q0, target is q1. If on q1, target is q2.
      const ctrl = qubit;
      const tgt = (qubit + 1) % this.numQubits;

      // Clear existing in this column for both
      this.grid[ctrl][col] = 'CX_CTRL';
      this.grid[tgt][col] = 'CX_TGT';
    } else {
      this.grid[qubit][col] = gateType;
    }

    this.renderGrid();
    this.updateSimulation();
  }

  clearCircuit() {
    this.grid = Array.from({ length: this.numQubits }, () => Array(this.numCols).fill(null));
    this.renderGrid();
    this.updateSimulation();
  }

  loadPreset(gridData) {
    this.grid = gridData.map(row => [...row]);
    this.renderGrid();
    this.updateSimulation();
  }

  updateSimulation() {
    this.engine.runCircuit(this.grid);
    const probs = this.engine.getProbabilities();
    this.renderProbabilities(probs);

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
  }

  renderProbabilities(probs) {
    if (!this.probsContainer) return;
    this.probsContainer.innerHTML = '';

    probs.forEach(item => {
      const pct = (item.probability * 100).toFixed(1);
      const isDominant = item.probability > 0.05;

      const barRow = document.createElement('div');
      barRow.className = `prob-bar-row ${isDominant ? 'active-state' : 'inactive-state'}`;
      barRow.innerHTML = `
        <div class="prob-state-label">${item.state}</div>
        <div class="prob-bar-track">
          <div class="prob-bar-fill" style="width: ${pct}%"></div>
        </div>
        <div class="prob-val-label">${pct}%</div>
      `;
      this.probsContainer.appendChild(barRow);
    });
  }

  bindEvents() {
    // Gate Palette drag & click
    const paletteChips = document.querySelectorAll('.palette-gate-chip');
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
        setTimeout(() => copyQiskitBtn.textContent = 'Copy Qiskit', 2000);
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
