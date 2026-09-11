/**
 * Backend statevector simulator.
 *
 * Exists so the voice agent can answer numerical questions ("what's the
 * probability of 11?", "how entangled is qubit 0?") from an actual computation
 * instead of letting a language model invent plausible-looking numbers.
 *
 * Conventions deliberately mirror js/quantum-engine.js so the backend and the
 * on-screen circuit never disagree:
 *   - Big-endian qubit order: qubit 0 is the MOST significant bit, so basis
 *     index i has qubit q at bit (numQubits - 1 - q).
 *   - Grid is grid[qubit][column]; each column applies its CNOT (CX_CTRL +
 *     CX_TGT pair) first, then all single-qubit gates.
 *   - 'M' is a readout marker, not a unitary, so it is skipped.
 */

const SQRT1_2 = 1 / Math.SQRT2;

// Each gate is [[a,b],[c,d]] with entries as [re, im].
const GATES_1Q = {
  I: [[[1, 0], [0, 0]], [[0, 0], [1, 0]]],
  X: [[[0, 0], [1, 0]], [[1, 0], [0, 0]]],
  Y: [[[0, 0], [0, -1]], [[0, 1], [0, 0]]],
  Z: [[[1, 0], [0, 0]], [[0, 0], [-1, 0]]],
  H: [[[SQRT1_2, 0], [SQRT1_2, 0]], [[SQRT1_2, 0], [-SQRT1_2, 0]]],
  S: [[[1, 0], [0, 0]], [[0, 0], [0, 1]]],
  T: [[[1, 0], [0, 0]], [[0, 0], [SQRT1_2, SQRT1_2]]]
};

function mulAdd(accRe, accIm, aRe, aIm, bRe, bIm) {
  return [accRe + aRe * bRe - aIm * bIm, accIm + aRe * bIm + aIm * bRe];
}

class StateVector {
  constructor(numQubits) {
    this.numQubits = numQubits;
    this.numStates = 1 << numQubits;
    this.re = new Float64Array(this.numStates);
    this.im = new Float64Array(this.numStates);
    this.re[0] = 1;
  }

  maskFor(qubit) {
    return 1 << (this.numQubits - 1 - qubit);
  }

  apply1Q(gateName, qubit) {
    const g = GATES_1Q[gateName];
    if (!g || qubit < 0 || qubit >= this.numQubits) return false;

    const mask = this.maskFor(qubit);
    const re = new Float64Array(this.numStates);
    const im = new Float64Array(this.numStates);

    for (let i = 0; i < this.numStates; i++) {
      const bit = (i & mask) ? 1 : 0;
      const partner = i ^ mask;
      const i0 = bit ? partner : i;
      const i1 = bit ? i : partner;

      // amplitude_out[i] = g[bit][0] * amp[i0] + g[bit][1] * amp[i1]
      let [accRe, accIm] = mulAdd(0, 0, g[bit][0][0], g[bit][0][1], this.re[i0], this.im[i0]);
      [accRe, accIm] = mulAdd(accRe, accIm, g[bit][1][0], g[bit][1][1], this.re[i1], this.im[i1]);
      re[i] = accRe;
      im[i] = accIm;
    }

    this.re = re;
    this.im = im;
    return true;
  }

  applyCNOT(control, target) {
    if (control === target || control < 0 || target < 0) return false;
    if (control >= this.numQubits || target >= this.numQubits) return false;

    const cMask = this.maskFor(control);
    const tMask = this.maskFor(target);

    for (let i = 0; i < this.numStates; i++) {
      const j = i ^ tMask;
      if ((i & cMask) && i < j) {
        let tr = this.re[i]; let ti = this.im[i];
        this.re[i] = this.re[j]; this.im[i] = this.im[j];
        this.re[j] = tr; this.im[j] = ti;
      }
    }
    return true;
  }

  applySWAP(qA, qB) {
    if (qA === qB) return false;
    const aMask = this.maskFor(qA);
    const bMask = this.maskFor(qB);

    for (let i = 0; i < this.numStates; i++) {
      const aBit = (i & aMask) ? 1 : 0;
      const bBit = (i & bMask) ? 1 : 0;
      if (aBit === bBit) continue;
      const j = i ^ aMask ^ bMask;
      if (i < j) {
        let tr = this.re[i]; let ti = this.im[i];
        this.re[i] = this.re[j]; this.im[i] = this.im[j];
        this.re[j] = tr; this.im[j] = ti;
      }
    }
    return true;
  }

  /** Basis-state probabilities, keyed by bitstring with qubit 0 leftmost. */
  probabilities() {
    const out = [];
    for (let i = 0; i < this.numStates; i++) {
      const p = this.re[i] * this.re[i] + this.im[i] * this.im[i];
      out.push({
        state: i.toString(2).padStart(this.numQubits, '0'),
        probability: p,
        amplitude: { re: this.re[i], im: this.im[i] }
      });
    }
    return out;
  }

  /**
   * Reduced single-qubit description via partial trace, expressed as a Bloch
   * vector. Eigenvalues of a one-qubit density matrix are (1 +/- r)/2 with
   * r the Bloch radius, so entropy and purity follow without eigendecomposition.
   */
  qubitReduced(qubit) {
    const mask = this.maskFor(qubit);
    let p0 = 0, p1 = 0, offRe = 0, offIm = 0;

    for (let i = 0; i < this.numStates; i++) {
      const amp2 = this.re[i] * this.re[i] + this.im[i] * this.im[i];
      if (i & mask) {
        p1 += amp2;
      } else {
        p0 += amp2;
        const j = i | mask;
        // rho01 = sum psi_{0,env} * conj(psi_{1,env})
        offRe += this.re[i] * this.re[j] + this.im[i] * this.im[j];
        offIm += this.im[i] * this.re[j] - this.re[i] * this.im[j];
      }
    }

    const x = 2 * offRe;
    const y = -2 * offIm;
    const z = p0 - p1;
    const r = Math.min(1, Math.sqrt(x * x + y * y + z * z));

    const lPlus = (1 + r) / 2;
    const lMinus = (1 - r) / 2;
    const term = (l) => (l > 1e-12 ? -l * Math.log2(l) : 0);

    return {
      qubit,
      prob0: p0,
      prob1: p1,
      bloch: { x, y, z },
      purity: (1 + r * r) / 2,
      entropy: term(lPlus) + term(lMinus)
    };
  }
}

/**
 * Executes a circuit grid, matching js/quantum-engine.js column semantics.
 * Returns the final state plus anything structurally wrong with the circuit,
 * so the agent can explain real problems rather than speculate.
 */
function simulateGrid(grid, numQubits) {
  const n = Math.max(1, Math.min(12, numQubits || (grid ? grid.length : 1)));
  const sv = new StateVector(n);
  const issues = [];
  let gateCount = 0;
  let depth = 0;

  if (!Array.isArray(grid) || grid.length === 0) {
    return { state: sv, gateCount: 0, depth: 0, issues: [{ code: 'EMPTY_CIRCUIT', message: 'The circuit has no gates yet — every qubit is still in |0>.' }] };
  }

  const numCols = grid[0] ? grid[0].length : 0;

  for (let col = 0; col < numCols; col++) {
    let control = -1, target = -1, columnUsed = false;
    const swapWires = [];

    for (let q = 0; q < n; q++) {
      const cell = grid[q] ? grid[q][col] : null;
      if (cell === 'CX_CTRL') control = q;
      else if (cell === 'CX_TGT') target = q;
      else if (cell === 'SWAP') swapWires.push(q);
    }

    if (control !== -1 && target !== -1) {
      sv.applyCNOT(control, target);
      gateCount++;
      columnUsed = true;
    } else if (control !== -1 || target !== -1) {
      issues.push({
        code: 'DANGLING_CNOT',
        column: col,
        message: `The CNOT at time step ${col + 1} is missing its ${control === -1 ? 'control' : 'target'} wire, so it does nothing.`
      });
    }

    if (swapWires.length === 2) {
      sv.applySWAP(swapWires[0], swapWires[1]);
      gateCount++;
      columnUsed = true;
    } else if (swapWires.length === 1) {
      issues.push({
        code: 'DANGLING_SWAP',
        column: col,
        message: `The SWAP at time step ${col + 1} only covers one wire; a SWAP needs exactly two.`
      });
    }

    for (let q = 0; q < n; q++) {
      const cell = grid[q] ? grid[q][col] : null;
      if (!cell || cell === 'CX_CTRL' || cell === 'CX_TGT' || cell === 'SWAP') continue;
      if (cell === 'M') { columnUsed = true; continue; }

      if (sv.apply1Q(cell, q)) {
        gateCount++;
        columnUsed = true;
      } else {
        issues.push({ code: 'UNKNOWN_GATE', column: col, qubit: q, message: `"${cell}" on qubit ${q} is not a gate this simulator knows.` });
      }
    }

    if (columnUsed) depth++;
  }

  if (gateCount === 0 && issues.length === 0) {
    issues.push({ code: 'EMPTY_CIRCUIT', message: 'The circuit has no gates yet — every qubit is still in |0>.' });
  }

  return { state: sv, gateCount, depth, issues };
}

/**
 * Full numerical snapshot the agent can quote from: probabilities, dominant
 * outcomes, per-qubit reduced state, and whether the register is entangled.
 */
function analyzeCircuit(grid, numQubits) {
  const { state, gateCount, depth, issues } = simulateGrid(grid, numQubits);
  const probabilities = state.probabilities();

  const significant = probabilities
    .filter(p => p.probability > 1e-9)
    .sort((a, b) => b.probability - a.probability);

  const qubits = [];
  for (let q = 0; q < state.numQubits; q++) qubits.push(state.qubitReduced(q));

  // A pure global state with mixed subsystems is entangled; entropy is the
  // standard witness, so use the largest single-qubit entropy.
  const maxEntropy = qubits.reduce((m, q) => Math.max(m, q.entropy), 0);

  return {
    numQubits: state.numQubits,
    gateCount,
    depth,
    issues,
    probabilities: significant,
    allProbabilities: probabilities,
    qubits,
    entangled: maxEntropy > 1e-6,
    maxSingleQubitEntropy: maxEntropy
  };
}

module.exports = { StateVector, simulateGrid, analyzeCircuit, GATES_1Q };
