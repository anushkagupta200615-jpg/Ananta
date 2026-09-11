/**
 * Ananta Quantum Circuit Tutor & Error Doctor (SIH Problem Statement 26140)
 *
 * Grounded AI Quantum Tutor that:
 *  1. Detects circuit pathologies (self-cancelling gates, premature collapse, idle wires, ineffective CNOTs)
 *  2. Accurately explains WHAT the user is making (algorithm / state identification)
 *  3. Computes mathematical entanglement and statevector diagnostics without hallucinations
 *  4. Provides conversational tutoring and pedagogical guidance
 *  5. Operates independently from Voice Copilot so they never interrupt each other
 */

class CircuitTutor {
  constructor(circuitUI) {
    this.circuitUI = circuitUI || window.circuitUI;
    this.isLoading = false;
    this.lastAuditResult = null;
    this.autoAuditEnabled = true;
    this.auditDebounceTimer = null;

    if (typeof document !== 'undefined') {
      this.initDOM();
      this.bindEvents();
    }
  }

  initDOM() {
    this.tutorPanel = document.getElementById('intel-tutor-panel');
    this.makingTitleEl = document.getElementById('tutor-making-title');
    this.makingDescEl = document.getElementById('tutor-making-desc');
    this.healthBadgeEl = document.getElementById('tutor-health-badge');
    this.errorsContainerEl = document.getElementById('tutor-errors-container');
    this.entanglementDescEl = document.getElementById('tutor-entanglement-desc');
    this.guidanceDescEl = document.getElementById('tutor-guidance-desc');
    this.questionInputEl = document.getElementById('tutor-question-input');
    this.btnAnalyzeEl = document.getElementById('btn-tutor-analyze');
    this.btnAskEl = document.getElementById('btn-tutor-ask');
    this.autoAuditCheckbox = document.getElementById('tutor-auto-audit-toggle');
  }

  bindEvents() {
    if (this.btnAnalyzeEl) {
      this.btnAnalyzeEl.addEventListener('click', () => this.runAudit());
    }

    if (this.btnAskEl && this.questionInputEl) {
      this.btnAskEl.addEventListener('click', () => this.askQuestion());
      this.questionInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.askQuestion();
      });
    }

    if (this.autoAuditCheckbox) {
      this.autoAuditCheckbox.addEventListener('change', (e) => {
        this.autoAuditEnabled = e.target.checked;
      });
    }
  }

  /**
   * Called by CircuitUI whenever gates change.
   * Debounces audit so fast edits don't spam the backend.
   */
  onCircuitChanged() {
    if (!this.autoAuditEnabled) return;
    clearTimeout(this.auditDebounceTimer);
    this.auditDebounceTimer = setTimeout(() => {
      // If tutor panel is currently visible, run live audit
      const isVisible = this.tutorPanel && this.tutorPanel.style.display !== 'none';
      if (isVisible) {
        this.runAudit();
      }
    }, 800);
  }

  togglePanel() {
    if (!this.circuitUI) this.circuitUI = window.circuitUI;
    if (this.circuitUI && this.circuitUI.setPedagogyMode) {
      this.circuitUI.setPedagogyMode('tutor');
    }
    const deck = document.getElementById('quantum-intelligence-deck');
    if (deck) deck.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this.runAudit();
  }

  /**
   * Deterministic Static Analysis of the Circuit Grid
   * 100% mathematical certainty, 0% hallucination.
   */
  detectDeterministicErrors(grid) {
    if (!grid || !grid.length) return [];
    const numQubits = grid.length;
    const numCols = grid[0].length;
    const errors = [];

    // Collect all gates placed
    const allGates = [];
    for (let q = 0; q < numQubits; q++) {
      for (let c = 0; c < numCols; c++) {
        const cell = grid[q][c];
        if (cell && cell !== '') {
          allGates.push({ qubit: q, col: c, gate: cell });
        }
      }
    }

    // 1. Premature Measurement (gates placed after Measurement 'M')
    for (let q = 0; q < numQubits; q++) {
      let measureCol = -1;
      for (let c = 0; c < numCols; c++) {
        const cell = grid[q][c];
        if (cell === 'M' || cell === 'MEASURE') {
          measureCol = c;
        } else if (measureCol !== -1 && cell && cell !== '') {
          errors.push({
            type: 'error',
            title: `Premature Measurement on Wire q[${q}]`,
            location: `Wire q[${q}], column t=${c + 1}`,
            desc: `Qubit q[${q}] was measured at t=${measureCol + 1}, but gate '${cell}' was placed afterward at t=${c + 1}. Projective Born measurement irreversibly collapses the superposition into a classical bit, destroying quantum advantage.`,
            fix: `Move the Measure gate to the end of wire q[${q}] or remove intermediate measurements.`
          });
        }
      }
    }

    // 2. Self-Inverse Gate Redundancy (U² = I)
    const selfInv = ['H', 'X', 'Y', 'Z'];
    for (let q = 0; q < numQubits; q++) {
      let lastG = null;
      let lastC = -1;
      for (let c = 0; c < numCols; c++) {
        const cell = grid[q][c];
        if (!cell || cell === '') continue;
        if (cell === 'CX_CTRL' || cell === 'CX_TGT' || cell === 'SWAP') {
          lastG = null;
          continue;
        }
        if (selfInv.includes(cell)) {
          if (lastG === cell) {
            errors.push({
              type: 'warning',
              title: `Self-Cancelling Redundancy (${cell}² = I) on Wire q[${q}]`,
              location: `Wire q[${q}], columns t=${lastC + 1} and t=${c + 1}`,
              desc: `Consecutive '${cell}' gates on wire q[${q}] undo each other identically (${cell} · ${cell} = I). This adds unneeded circuit depth and burns qubit coherence time without changing the output state.`,
              fix: `Delete both duplicate '${cell}' gates to shorten circuit depth and preserve T₁ coherence.`
            });
            lastG = null;
            continue;
          }
          lastG = cell;
          lastC = c;
        } else {
          lastG = null;
        }
      }
    }

    // 3. Ineffective CNOT/Toffoli (a control wire never leaves ground state
    // |0> before this gate, so it can never fire). Must collect ALL controls
    // in the column, not just the last one seen - a Toffoli has two, and a
    // single ctrlQ variable overwritten in the scan loop silently dropped
    // the first one, mislabeling every Toffoli in this diagnostic as a
    // plain "CNOT" (same class of bug already fixed in runCircuitUpToCol,
    // computeTotalUnitary, and the QASM/code exporters elsewhere in this
    // codebase - this check was missed in that pass).
    for (let c = 0; c < numCols; c++) {
      const controls = [];
      let tgtQ = -1;
      for (let q = 0; q < numQubits; q++) {
        if (grid[q][c] === 'CX_CTRL') controls.push(q);
        if (grid[q][c] === 'CX_TGT') tgtQ = q;
      }
      if (controls.length > 0 && tgtQ !== -1) {
        // A Toffoli only flips its target when BOTH controls are |1> at
        // once - any single grounded control is enough to disable it, so
        // report every control with no prior gate on its wire, not just one.
        const grounded = controls.filter((ctrlQ) => grid[ctrlQ].slice(0, c).filter((g) => g && g !== '').length === 0);
        if (grounded.length > 0) {
          const gateName = controls.length === 2 ? 'Toffoli' : 'CNOT';
          const groundedList = grounded.map((q) => `q[${q}]`).join(', ');
          const plural = grounded.length > 1;
          errors.push({
            type: 'warning',
            title: `Ineffective ${gateName} (Control Wire${plural ? 's' : ''} ${groundedList} in Ground State |0⟩)`,
            location: controls.length === 2
              ? `Column t=${c + 1} (Toffoli: controls q[${controls[0]}], q[${controls[1]}] → target q[${tgtQ}])`
              : `Column t=${c + 1} between q[${controls[0]}] and q[${tgtQ}]`,
            desc: `${gateName} was triggered while control qubit${plural ? 's' : ''} ${groundedList} ${plural ? 'are' : 'is'} resting in classical state |0⟩ with no prior gate on that wire.${controls.length === 2 ? ' A Toffoli only flips its target when BOTH controls are |1⟩ simultaneously, so a single grounded control is enough to disable it entirely.' : ' Since the control is never active, the target qubit never flips.'} No new entanglement is generated by this gate.`,
            fix: `Add a Hadamard (H) gate on wire${plural ? 's' : ''} ${groundedList} before column t=${c + 1} to create superposition there.`
          });
        }
      }
    }

    // 4. Idle Qubit Detection
    if (allGates.length > 0) {
      for (let q = 0; q < numQubits; q++) {
        const qGates = allGates.filter(g => g.qubit === q);
        if (qGates.length === 0) {
          errors.push({
            type: 'info',
            title: `Idle Qubit Wire q[${q}]`,
            location: `Wire q[${q}]`,
            desc: `Qubit q[${q}] has no operations placed on it. It will remain in state |0⟩ throughout the simulation.`,
            fix: `Add gates to wire q[${q}] or scale down register size using the '−' button.`
          });
        }
      }
    }

    // 5. Deep Circuit Depth Warning (Decoherence risk)
    const activeCols = new Set(allGates.map(g => g.col));
    if (activeCols.size > 10) {
      errors.push({
        type: 'warning',
        title: `High Circuit Depth (${activeCols.size} steps)`,
        location: `Entire register`,
        desc: `Circuit depth exceeds 10 unitary time slices. On superconducting transmon hardware (T₁ ≈ 50 µs), long depth introduces significant phase accumulation errors and depolarizing noise.`,
        fix: `Use the Universal Transpiler & AI Circuit Doctor to optimize gate count or apply Dynamical Decoupling.`
      });
    }

    return errors;
  }

  formatGridStructure(grid) {
    if (!grid || !grid.length) return '(empty circuit)';
    const lines = [];
    for (let q = 0; q < grid.length; q++) {
      const ops = [];
      for (let c = 0; c < grid[q].length; c++) {
        const cell = grid[q][c];
        if (cell && cell !== '') {
          ops.push(`${cell} (t=${c + 1})`);
        }
      }
      lines.push(`q[${q}]: ${ops.length > 0 ? ops.join(' -> ') : '(idle)'}`);
    }
    return lines.join('\n');
  }

  async runAudit(userQuestion = '') {
    if (this.isLoading) return;
    this.isLoading = true;

    if (this.btnAnalyzeEl) {
      this.btnAnalyzeEl.disabled = true;
      this.btnAnalyzeEl.innerHTML = '<span class="tutor-spinner"></span> Analyzing Circuit…';
    }

    try {
      const ui = this.circuitUI || window.circuitUI;
      const grid = ui ? ui.grid : [];
      const engine = ui ? ui.engine : null;

      const numQubits = grid.length || 3;
      const allCells = grid.flat().filter(c => c && c !== '');
      const activeDepth = grid[0] ? grid[0].filter((_, col) => grid.some(row => row[col])).length : 0;

      // Extract ground truth math from Quantum Engine
      let diracNotation = '|000⟩';
      let probabilities = {};
      let mathMetrics = {
        concurrence: 0,
        entropy: 0,
        purity: 1.0,
        entanglementClass: 'Separable Pure State'
      };

      if (engine) {
        diracNotation = engine.getDiracNotation() || '|000⟩';
        const probs = engine.getProbabilities();
        if (probs) {
          const numStates = 1 << numQubits;
          probs.forEach((p, idx) => {
            if (p > 0.001) {
              const bin = idx.toString(2).padStart(numQubits, '0');
              probabilities[`|${bin}⟩`] = Math.round(p * 1000) / 1000;
            }
          });
        }
        mathMetrics.concurrence = engine.getConcurrence ? engine.getConcurrence() : (engine.getEntanglementEntropy() > 0.1 ? 1.0 : 0.0);
        mathMetrics.entropy = engine.getEntanglementEntropy ? engine.getEntanglementEntropy() : 0;
        mathMetrics.purity = 1.0;
        mathMetrics.entanglementClass = mathMetrics.concurrence > 0.1 ? 'Entangled Subsystem' : 'Separable State';
      }

      const deterministicErrors = this.detectDeterministicErrors(grid);
      const gridStructure = this.formatGridStructure(grid);

      const payload = {
        gridStructure,
        grid, // raw gate grid: lets the backend ground its analysis in a real
              // simulation instead of guessing from the text summary
        numQubits,
        activeDepth,
        diracNotation,
        probabilities,
        mathMetrics,
        deterministicErrors,
        userQuestion: userQuestion || ''
      };

      // Call Backend API
      const base = (window.anantaBackend && window.anantaBackend.baseUrl) || '';
      let auditResult = null;

      try {
        const res = await fetch(`${base}/api/ai/tutor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: 'circuit-tutor', payload })
        });

        if (res.ok) {
          const data = await res.json();
          auditResult = data.result || data.audit || data;
        } else {
          // If server returned non-200, use deterministic local fallback
          auditResult = this.generateLocalFallback(payload);
        }
      } catch (netErr) {
        console.warn('[CircuitTutor] Network call to /api/ai/tutor failed, using grounded local analysis:', netErr.message);
        auditResult = this.generateLocalFallback(payload);
      }

      this.lastAuditResult = auditResult;
      this.renderAuditResults(auditResult);

    } catch (err) {
      console.error('[CircuitTutor] Error running circuit audit:', err);
    } finally {
      this.isLoading = false;
      if (this.btnAnalyzeEl) {
        this.btnAnalyzeEl.disabled = false;
        this.btnAnalyzeEl.innerHTML = '⚡ Analyze My Circuit';
      }
    }
  }

  askQuestion() {
    if (!this.questionInputEl) return;
    const question = this.questionInputEl.value.trim();
    if (!question) return;
    this.runAudit(question);
  }

  /**
   * Reads the actual gate composition out of a grid, mirroring
   * ananta-backend/utils/quantumState.js's readGateComposition/describeCircuit
   * for the case this file cannot reach that Node module: a pure network
   * failure reaching /api/ai/tutor. Grounds the description in which gates are
   * really on the board instead of guessing from Dirac-notation text — that
   * guess is how "H, T, Y" once became "Uniform Superposition State".
   */
  describeGridLocally(grid, numQubits, mathMetrics) {
    const GATE_NAMES = { H: 'Hadamard', X: 'Pauli-X', Y: 'Pauli-Y', Z: 'Pauli-Z', S: 'Phase (S)', T: 'π/8 Phase (T)' };
    const n = numQubits || (grid ? grid.length : 1);
    const numCols = grid && grid[0] ? grid[0].length : 0;
    const singleGateCounts = {};
    let cnotCount = 0, toffoliCount = 0, swapCount = 0, danglingIssue = null;

    const wireHasGate = new Array(n).fill(false);
    for (let col = 0; col < numCols; col++) {
      const controls = [];
      let target = -1;
      const swapWires = [];
      for (let q = 0; q < n; q++) {
        const cell = grid[q] ? grid[q][col] : null;
        if (!cell || cell === 'M') continue;
        if (cell === 'CX_CTRL') { controls.push(q); wireHasGate[q] = true; continue; }
        if (cell === 'CX_TGT') { target = q; wireHasGate[q] = true; continue; }
        if (cell === 'SWAP') { swapWires.push(q); wireHasGate[q] = true; continue; }
        singleGateCounts[cell] = (singleGateCounts[cell] || 0) + 1;
        wireHasGate[q] = true;
      }
      // Two controls sharing a target is a Toffoli, not a second CNOT — must
      // not be collapsed down to "the last control seen".
      if (controls.length === 2 && target !== -1) toffoliCount++;
      else if (controls.length === 1 && target !== -1) cnotCount++;
      else if (controls.length > 0 || target !== -1) {
        danglingIssue = `The controlled gate at time step ${col + 1} is missing its ${controls.length === 0 ? 'control' : 'target'} wire, so it does nothing.`;
      }
      if (swapWires.length === 2) swapCount++;
    }
    // Wires that actually carry a gate, not the register's total width — a
    // Bell pair built inside a wider register (idle spare wires) is still one.
    const activeWires = wireHasGate.filter(Boolean).length;

    const concurrence = parseFloat(mathMetrics?.concurrence || 0);
    const entropy = parseFloat(mathMetrics?.entropy || 0);
    const entangled = concurrence > 0.1;
    const distinctGates = Object.keys(singleGateCounts);
    const totalGates = distinctGates.reduce((s, g) => s + singleGateCounts[g], 0) + cnotCount + toffoliCount + swapCount;

    if (danglingIssue) {
      return { summary: 'Incomplete Circuit', purpose: danglingIssue, entanglementAnalysis: 'Not applicable until the circuit above is fixed.', hasError: true };
    }
    if (totalGates === 0) {
      return {
        summary: 'Empty Circuit (Ground State)',
        purpose: `All ${n} qubits are in the ground state |${'0'.repeat(n)}⟩. Add gates from the palette to begin.`,
        entanglementAnalysis: 'Not applicable — no gates have been placed yet.'
      };
    }

    const onlyH = distinctGates.length === 1 && distinctGates[0] === 'H' && swapCount === 0;
    let summary, purpose;
    if (onlyH && activeWires === 2 && singleGateCounts.H === 1 && cnotCount === 1) {
      summary = 'Bell State Preparation (Bipartite Entanglement)';
      purpose = 'A Hadamard puts one qubit into superposition, then a CNOT entangles it with the second qubit, producing a maximally entangled EPR pair. Used in quantum key distribution and teleportation.';
    } else if (onlyH && activeWires === 3 && singleGateCounts.H === 1 && cnotCount === 2) {
      summary = 'GHZ State (Tripartite Entanglement)';
      purpose = 'A Hadamard followed by a chain of two CNOTs spreads superposition across all three qubits into a single maximally entangled state. Used in quantum secret sharing and metrology.';
    } else {
      const parts = distinctGates.map(g => `${GATE_NAMES[g] || g} (×${singleGateCounts[g]})`);
      if (cnotCount) parts.push(`CNOT (×${cnotCount})`);
      if (toffoliCount) parts.push(`Toffoli (×${toffoliCount})`);
      if (swapCount) parts.push(`SWAP (×${swapCount})`);
      const nameList = distinctGates.concat(
        cnotCount ? ['CNOT'] : [], toffoliCount ? ['Toffoli'] : [], swapCount ? ['SWAP'] : []
      ).join(', ');
      summary = `Custom ${n}-Qubit Circuit: ${nameList}`;
      purpose = `Applies ${parts.join(', ')} across a ${n}-qubit register. ` +
        (entangled ? 'The resulting state is entangled — measuring one qubit affects the others.'
                   : 'The resulting state is separable — each qubit can be described independently.');
    }

    const entanglementAnalysis = entangled
      ? `Entangled: Concurrence C = ${concurrence.toFixed(2)}, von Neumann Entropy S = ${entropy.toFixed(2)} ebits. Subsystems cannot be described independently.`
      : 'Separable: every qubit is in a definite pure state independent of the others (entropy ≈ 0).';

    return { summary, purpose, entanglementAnalysis };
  }

  // Real quantum-mechanical facts about each gate (textbook definitions,
  // not claims about the user's specific circuit) - used to ground
  // gate-lookup questions ("what does T do?") in the offline fallback.
  static GATE_EXPLANATIONS = {
    H: 'Hadamard (H) creates an equal superposition: |0⟩ → (|0⟩+|1⟩)/√2. It\'s the standard way to start superposition, and combined with a CNOT it produces entanglement.',
    X: 'Pauli-X is the quantum NOT gate: it flips |0⟩↔|1⟩ (a π rotation about the Bloch sphere\'s X-axis).',
    Y: 'Pauli-Y rotates by π about the Bloch sphere\'s Y-axis: it flips the bit and applies a phase (i on |0⟩→|1⟩, -i on |1⟩→|0⟩).',
    Z: 'Pauli-Z is a phase flip: it leaves |0⟩ unchanged and multiplies |1⟩ by -1. It has no effect on a qubit that isn\'t already in superposition.',
    S: 'The Phase gate (S) applies a 90° (π/2) phase to |1⟩. It\'s the square root of Z (S² = Z).',
    T: 'The T gate applies a 45° (π/4) phase to |1⟩. It\'s the square root of S (T² = S) and, alongside H and CNOT, is what makes a gate set universal for fault-tolerant computation.',
    CX: 'CNOT (controlled-X) flips the target qubit only when the control qubit is |1⟩. It\'s the standard two-qubit entangling gate — a Hadamard followed by a CNOT produces a Bell pair.',
    CNOT: 'CNOT (controlled-X) flips the target qubit only when the control qubit is |1⟩. It\'s the standard two-qubit entangling gate — a Hadamard followed by a CNOT produces a Bell pair.',
    SWAP: 'SWAP exchanges the full quantum states (not just labels) of two qubits, including any superposition or entanglement they carry.',
    TOFFOLI: 'The Toffoli gate (CCX) flips the target qubit only when BOTH control qubits are |1⟩ — a reversible AND gate, used in arithmetic circuits and some error-correcting codes.',
    CCX: 'The Toffoli gate (CCX) flips the target qubit only when BOTH control qubits are |1⟩ — a reversible AND gate, used in arithmetic circuits and some error-correcting codes.',
    M: 'Measurement collapses the qubit\'s superposition into a definite classical bit (0 or 1), with probabilities given by the Born rule |amplitude|². This is irreversible — any superposition or entanglement on that wire is destroyed.',
    MEASURE: 'Measurement collapses the qubit\'s superposition into a definite classical bit (0 or 1), with probabilities given by the Born rule |amplitude|². This is irreversible — any superposition or entanglement on that wire is destroyed.'
  };

  // Answers the student's actual typed question using only data already
  // computed from the real circuit grid/statevector (described, errors,
  // mathMetrics, diracNotation) - this runs when the AI backend is
  // unreachable, so every claim here must be grounded in that real data
  // rather than a generic canned string, or the question was effectively
  // being ignored (which is exactly what used to happen here).
  answerQuestionLocally(question, { described, errors, mathMetrics, diracNotation, numQubits }) {
    const q = (question || '').toLowerCase();
    if (!q) return null;

    // 1. Direct gate lookup ("what does the T gate do?", "explain CNOT")
    const gateMatch = Object.keys(CircuitTutor.GATE_EXPLANATIONS).find((key) => {
      const pattern = new RegExp(`\\b${key.toLowerCase()}\\b`);
      return pattern.test(q);
    });
    if (gateMatch && /what|explain|mean|do(es)?\b/.test(q)) {
      return `${CircuitTutor.GATE_EXPLANATIONS[gateMatch]} (Offline analysis — the AI tutor backend is unreachable right now, so this is a reference definition rather than a comment on your specific circuit.)`;
    }

    // 2. Correctness / validity ("is this right?", "does this work?")
    if (/\b(right|correct|valid|proper|wrong|good|work(s|ing)?|mistake)\b/.test(q)) {
      const errCount = errors.filter(e => e.severity === 'error').length;
      const warnCount = errors.filter(e => e.severity === 'warning').length;
      if (errCount > 0) {
        const first = errors.find(e => e.severity === 'error');
        return `Based on a real check of your circuit grid: no, there's ${errCount} genuine error to fix first — "${first.title}" at ${first.location}. ${first.explanation} Suggested fix: ${first.suggestedFix}`;
      }
      if (warnCount > 0) {
        return `Your circuit is logically valid (every gate is well-formed and unitary), but there ${warnCount === 1 ? 'is' : 'are'} ${warnCount} efficiency warning${warnCount === 1 ? '' : 's'} — see the Error Doctor panel above. It builds: ${described.summary}.`;
      }
      return `Yes — it's a valid, well-formed circuit: ${described.summary}. ${described.purpose}`;
    }

    // 3. What is this circuit / what am I building
    if (/what\s+(is|does|am\s+i|have\s+i)|purpose|building/.test(q)) {
      return `${described.summary}. ${described.purpose}`;
    }

    // 4. Entanglement / correlation questions
    if (/entangl|correlat|separable|bell|ghz/.test(q)) {
      return described.entanglementAnalysis;
    }

    // 5. Error / issue / bug questions
    if (/error|issue|bug|problem|fix/.test(q)) {
      if (errors.length === 0) return 'No issues detected — the deterministic static analysis found no premature measurements, dangling controls, or idle wires.';
      return errors.map(e => `[${e.severity.toUpperCase()}] ${e.title} (${e.location}): ${e.explanation} → ${e.suggestedFix}`).join(' | ');
    }

    // 6. State / probability / measurement outcome questions
    if (/state|probabilit|outcome|measure|amplitude/.test(q)) {
      return `The current statevector is ${diracNotation} across ${numQubits} qubits. ${described.entanglementAnalysis}`;
    }

    // No pattern matched - be honest that this is a limited offline mode
    // rather than pretending to have answered the specific question.
    return `Offline mode (AI tutor backend unreachable) can't parse that question freely, but here's what's grounded in your real circuit: ${described.summary}. ${described.purpose} ${errors.length ? `${errors.length} diagnostic(s) found — see above.` : 'No issues detected.'}`;
  }

  generateLocalFallback(payload) {
    const deterministicErrors = payload.deterministicErrors || [];
    const errors = deterministicErrors.map(err => ({
      severity: err.type === 'error' ? 'error' : (err.type === 'warning' ? 'warning' : 'optimization'),
      title: err.title || 'Circuit Inefficiency',
      location: err.location || 'Circuit grid',
      explanation: err.desc || 'Operation affects compilation depth or coherence.',
      suggestedFix: err.fix || 'Review gate placement.'
    }));

    const described = Array.isArray(payload.grid)
      ? this.describeGridLocally(payload.grid, payload.numQubits, payload.mathMetrics)
      : {
          summary: 'Custom Quantum Circuit',
          purpose: 'The gate grid was not available to this offline analysis, so no specific claim about it can be grounded.',
          entanglementAnalysis: 'Unknown — not computed offline.'
        };

    if (described.hasError) {
      errors.unshift({ severity: 'error', title: 'Incomplete Gate', location: 'Circuit grid', explanation: described.purpose, suggestedFix: 'Complete or remove the incomplete gate.' });
    }

    let tutorGuidance;
    if (payload.userQuestion) {
      tutorGuidance = this.answerQuestionLocally(payload.userQuestion, {
        described, errors, mathMetrics: payload.mathMetrics, diracNotation: payload.diracNotation, numQubits: payload.numQubits
      });
    }
    if (!tutorGuidance) {
      tutorGuidance = errors.length > 0
        ? `You have ${errors.length} diagnostic recommendation(s). Review the highlighted findings above to optimize circuit depth and avoid unwanted state collapse.`
        : 'Your quantum circuit logic is sound and unitary! Try experimenting with relative phase (Phase S or T gates) or adding a CNOT to a third wire to observe entanglement scaling.';
    }

    return {
      circuitSummary: described.summary,
      circuitPurpose: described.purpose,
      isHealthy: !errors.some(e => e.severity === 'error'),
      healthBadge: errors.length === 0 ? 'Healthy Circuit (100% Sound)' : `${errors.length} Issue(s) Detected`,
      errors,
      entanglementAnalysis: described.entanglementAnalysis,
      tutorGuidance
    };
  }

  renderAuditResults(data) {
    if (!data) return;

    // 1. Health Badge
    if (this.healthBadgeEl) {
      const isHealthy = data.isHealthy !== false && (!data.errors || data.errors.length === 0);
      this.healthBadgeEl.className = `tutor-health-pill ${isHealthy ? 'healthy' : 'warning'}`;
      this.healthBadgeEl.innerHTML = isHealthy
        ? '🟢 Circuit Healthy (100% Sound)'
        : `⚠️ ${data.healthBadge || `${data.errors.length} Issue(s) Detected`}`;
    }

    // 2. What You Are Making
    if (this.makingTitleEl) {
      this.makingTitleEl.textContent = data.circuitSummary || 'Custom Quantum Circuit';
    }
    if (this.makingDescEl) {
      this.makingDescEl.textContent = data.circuitPurpose || 'Unitary evolution of quantum state.';
    }

    // 3. Errors Container
    if (this.errorsContainerEl) {
      const errs = data.errors || [];
      if (errs.length === 0) {
        this.errorsContainerEl.innerHTML = `
          <div class="tutor-clean-state">
            <span class="tutor-clean-icon">✨</span>
            <div class="tutor-clean-text">
              <strong>Zero Pathologies Detected</strong>
              <p>No redundant gates, premature measurements, or idle qubit anomalies found. Unitary logic is completely sound!</p>
            </div>
          </div>
        `;
      } else {
        this.errorsContainerEl.innerHTML = errs.map(err => {
          const sevClass = err.severity === 'error' ? 'sev-error' : (err.severity === 'warning' ? 'sev-warning' : 'sev-info');
          const sevIcon = err.severity === 'error' ? '🔴 Error' : (err.severity === 'warning' ? '🟡 Warning' : 'ℹ️ Optimization');
          return `
            <div class="tutor-error-card ${sevClass}">
              <div class="tutor-error-header">
                <span class="tutor-sev-badge ${sevClass}">${sevIcon}</span>
                <strong class="tutor-error-title">${escapeHtml(err.title || 'Diagnostic Finding')}</strong>
                ${err.location ? `<span class="tutor-error-loc">${escapeHtml(err.location)}</span>` : ''}
              </div>
              <p class="tutor-error-desc">${escapeHtml(err.explanation || '')}</p>
              ${err.suggestedFix ? `
                <div class="tutor-error-fix">
                  <span class="fix-label">Suggested Fix:</span>
                  <span class="fix-text">${escapeHtml(err.suggestedFix)}</span>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
      }
    }

    // 4. Entanglement Assessment
    if (this.entanglementDescEl) {
      this.entanglementDescEl.textContent = data.entanglementAnalysis || 'Evaluating subsystem entropy.';
    }

    // 5. Tutor Guidance
    if (this.guidanceDescEl) {
      this.guidanceDescEl.textContent = data.tutorGuidance || 'Continue exploring quantum algorithms.';
    }
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Instantiate globally
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.circuitTutor = new CircuitTutor(window.circuitUI);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CircuitTutor;
}
