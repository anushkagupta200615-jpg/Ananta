/**
 * Quantum Engine - In-Browser Complex Matrix & Statevector Simulator
 * Supports up to 3 qubits with real-time state evolution, Bloch coordinates, and QASM export.
 */

class Complex {
  constructor(re = 0, im = 0) {
    this.re = re;
    this.im = im;
  }

  add(c) {
    return new Complex(this.re + c.re, this.im + c.im);
  }

  sub(c) {
    return new Complex(this.re - c.re, this.im - c.im);
  }

  mul(c) {
    return new Complex(
      this.re * c.re - this.im * c.im,
      this.re * c.im + this.im * c.re
    );
  }

  scale(s) {
    return new Complex(this.re * s, this.im * s);
  }

  conj() {
    return new Complex(this.re, -this.im);
  }

  absSq() {
    return this.re * this.re + this.im * this.im;
  }

  abs() {
    return Math.sqrt(this.absSq());
  }

  phase() {
    return Math.atan2(this.im, this.re);
  }
}

class QuantumCircuitEngine {
  constructor(numQubits = 3) {
    this.numQubits = numQubits;
    this.numStates = 1 << numQubits; // 2^N
    this.state = [];
    this.reset();
  }

  reset() {
    this.state = Array.from({ length: this.numStates }, (_, i) => 
      i === 0 ? new Complex(1, 0) : new Complex(0, 0)
    );
  }

  // Common 1-Qubit matrices
  static get GATES() {
    const SQRT2_INV = 1 / Math.SQRT2;
    return {
      I: [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(1, 0)]
      ],
      X: [
        [new Complex(0, 0), new Complex(1, 0)],
        [new Complex(1, 0), new Complex(0, 0)]
      ],
      Y: [
        [new Complex(0, 0), new Complex(0, -1)],
        [new Complex(0, 1), new Complex(0, 0)]
      ],
      Z: [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(-1, 0)]
      ],
      H: [
        [new Complex(SQRT2_INV, 0), new Complex(SQRT2_INV, 0)],
        [new Complex(SQRT2_INV, 0), new Complex(-SQRT2_INV, 0)]
      ],
      S: [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(0, 1)]
      ],
      T: [
        [new Complex(1, 0), new Complex(0, 0)],
        [new Complex(0, 0), new Complex(SQRT2_INV, SQRT2_INV)]
      ]
    };
  }

  // Apply single qubit gate to target wire
  apply1QGate(gateName, targetQubit) {
    const matrix = QuantumCircuitEngine.GATES[gateName];
    if (!matrix) return;

    const newState = Array.from({ length: this.numStates }, () => new Complex(0, 0));
    const bitMask = 1 << (this.numQubits - 1 - targetQubit);

    for (let i = 0; i < this.numStates; i++) {
      if ((i & bitMask) === 0) {
        const i0 = i;
        const i1 = i | bitMask;

        const a0 = this.state[i0];
        const a1 = this.state[i1];

        // newState[i0] = M00*a0 + M01*a1
        newState[i0] = matrix[0][0].mul(a0).add(matrix[0][1].mul(a1));
        // newState[i1] = M10*a0 + M11*a1
        newState[i1] = matrix[1][0].mul(a0).add(matrix[1][1].mul(a1));
      }
    }

    this.state = newState;
  }

  // Apply Controlled-NOT (CX)
  applyCNOT(controlQubit, targetQubit) {
    if (controlQubit === targetQubit) return;
    const newState = Array.from({ length: this.numStates }, () => new Complex(0, 0));
    const ctrlMask = 1 << (this.numQubits - 1 - controlQubit);
    const tgtMask = 1 << (this.numQubits - 1 - targetQubit);

    for (let i = 0; i < this.numStates; i++) {
      if ((i & ctrlMask) !== 0) {
        // Control bit is 1, flip target bit
        const flipped = i ^ tgtMask;
        newState[flipped] = this.state[i];
      } else {
        // Control bit is 0, unchanged
        newState[i] = this.state[i];
      }
    }

    this.state = newState;
  }

  // Run circuit up to a specific time-step column (-1 for full circuit)
  runCircuitUpToCol(grid, upToCol = -1) {
    this.reset();
    if (!grid || !grid.length) return;

    const maxCols = grid[0].length;
    const limit = upToCol === -1 ? maxCols : Math.min(upToCol + 1, maxCols);

    for (let col = 0; col < limit; col++) {
      let cnotTarget = -1;
      let cnotControl = -1;

      for (let q = 0; q < this.numQubits; q++) {
        const cell = grid[q][col];
        if (cell === 'CX_CTRL') cnotControl = q;
        if (cell === 'CX_TGT') cnotTarget = q;
      }

      if (cnotControl !== -1 && cnotTarget !== -1) {
        this.applyCNOT(cnotControl, cnotTarget);
      }

      for (let q = 0; q < this.numQubits; q++) {
        const cell = grid[q][col];
        if (cell && cell !== 'CX_CTRL' && cell !== 'CX_TGT' && cell !== 'M') {
          this.apply1QGate(cell, q);
        }
      }
    }
  }

  // Run full series of time-step columns
  runCircuit(grid) {
    this.runCircuitUpToCol(grid, -1);
  }

  // Run Monte Carlo physical measurement sampling (1024 shots)
  sampleShots(numShots = 1024) {
    const probs = this.getProbabilities();
    const counts = {};
    probs.forEach(p => counts[p.state] = 0);

    const cdf = [];
    let cumulative = 0;
    for (let i = 0; i < probs.length; i++) {
      cumulative += probs[i].probability;
      cdf.push({ state: probs[i].state, cumulative });
    }

    for (let s = 0; s < numShots; s++) {
      const rand = Math.random();
      for (let i = 0; i < cdf.length; i++) {
        if (rand <= cdf[i].cumulative || i === cdf.length - 1) {
          counts[cdf[i].state]++;
          break;
        }
      }
    }

    return {
      totalShots: numShots,
      counts: counts,
      results: probs.map(p => ({
        state: p.state,
        theoreticalPct: (p.probability * 100).toFixed(1),
        measuredCount: counts[p.state],
        measuredPct: ((counts[p.state] / numShots) * 100).toFixed(1)
      }))
    };
  }

  // Compute 8x8 full density matrix rho = |psi><psi|
  getDensityMatrix() {
    const matrix = [];
    for (let i = 0; i < this.numStates; i++) {
      const row = [];
      const ai = this.state[i];
      for (let j = 0; j < this.numStates; j++) {
        const aj = this.state[j];
        // rho_ij = ai * aj* = (re_i + i*im_i)(re_j - i*im_j)
        const re = ai.re * aj.re + ai.im * aj.im;
        const im = ai.im * aj.re - ai.re * aj.im;
        const mag = Math.sqrt(re * re + im * im);
        row.push({
          re: parseFloat(re.toFixed(4)),
          im: parseFloat(im.toFixed(4)),
          mag: parseFloat(mag.toFixed(4)),
          isDiagonal: i === j
        });
      }
      matrix.push(row);
    }
    return matrix;
  }

  // Calculate Von Neumann Entanglement Entropy for bipartite split q0 vs (q1, q2)
  getEntanglementEntropy() {
    // Reduced density matrix for qubit 0 (2x2 matrix)
    let rho00 = 0, rho01_re = 0, rho01_im = 0, rho11 = 0;
    for (let i = 0; i < this.numStates; i++) {
      const bit0 = (i >> (this.numQubits - 1)) & 1;
      const magSq = this.state[i].absSq();
      if (bit0 === 0) {
        rho00 += magSq;
        // Off-diagonal with i ^ 4 (qubit 0 flipped)
        const j = i ^ (1 << (this.numQubits - 1));
        const ai = this.state[i];
        const aj = this.state[j];
        rho01_re += (ai.re * aj.re + ai.im * aj.im);
        rho01_im += (ai.im * aj.re - ai.re * aj.im);
      } else {
        rho11 += magSq;
      }
    }
    // Eigenvalues of 2x2 Hermitian matrix
    const tr = rho00 + rho11;
    const det = (rho00 * rho11) - (rho01_re * rho01_re + rho01_im * rho01_im);
    const disc = Math.max(0, (tr * tr) / 4 - det);
    const l1 = Math.max(0, tr / 2 + Math.sqrt(disc));
    const l2 = Math.max(0, tr / 2 - Math.sqrt(disc));

    let entropy = 0;
    if (l1 > 0.0001) entropy -= l1 * Math.log2(l1);
    if (l2 > 0.0001) entropy -= l2 * Math.log2(l2);
    return Math.max(0, parseFloat(entropy.toFixed(3)));
  }

  // Get Dirac Bra-Ket String formatted for live HUD
  getDiracNotation() {
    const probs = this.getProbabilities();
    const nonZero = probs.filter(p => p.probability > 0.005);
    if (nonZero.length === 0) return '|ψ⟩ = |000⟩';

    const terms = nonZero.map((p, idx) => {
      const ampVal = Math.sqrt(p.probability).toFixed(2);
      const phaseDeg = Math.round((p.phase / Math.PI) * 180);
      let prefix = idx === 0 ? '' : '+ ';
      if (Math.abs(phaseDeg - 180) < 15 || Math.abs(phaseDeg + 180) < 15) {
        prefix = idx === 0 ? '- ' : '- ';
      } else if (Math.abs(phaseDeg - 90) < 15) {
        return `${prefix}${ampVal}i ${p.state}`;
      } else if (Math.abs(phaseDeg + 90) < 15) {
        return `${idx === 0 ? '-' : '- '}${ampVal}i ${p.state}`;
      }
      return `${prefix}${ampVal} ${p.state}`;
    });

    return `|ψ⟩ = ${terms.join(' ')}`;
  }

  // Get probabilities for each basis state (|000>, |001>, etc.)
  getProbabilities() {
    return this.state.map((amp, idx) => {
      const bitString = idx.toString(2).padStart(this.numQubits, '0');
      return {
        state: `|${bitString}⟩`,
        index: idx,
        probability: amp.absSq(),
        real: amp.re,
        imag: amp.im,
        phase: amp.phase()
      };
    });
  }

  // Compute Bloch Sphere coordinates (x, y, z) for a specific qubit
  getBlochCoordinates(qubitIndex) {
    const bitMask = 1 << (this.numQubits - 1 - qubitIndex);
    let alpha = new Complex(0, 0); // state |0> for this qubit
    let beta = new Complex(0, 0);  // state |1> for this qubit

    for (let i = 0; i < this.numStates; i++) {
      if ((i & bitMask) === 0) {
        alpha = alpha.add(new Complex(this.state[i].absSq(), 0));
      } else {
        beta = beta.add(new Complex(this.state[i].absSq(), 0));
      }
    }

    // Single-qubit direct projection for pure or partial states
    // <X> = 2 * Re(alpha* * beta), <Y> = 2 * Im(alpha* * beta), <Z> = |alpha|^2 - |beta|^2
    // If numQubits == 1, exact coordinates:
    if (this.numQubits === 1) {
      const a = this.state[0];
      const b = this.state[1];
      const aConj = a.conj();
      const aConjB = aConj.mul(b);
      const x = 2 * aConjB.re;
      const y = 2 * aConjB.im;
      const z = a.absSq() - b.absSq();
      return { x, y, z, theta: Math.acos(Math.max(-1, Math.min(1, z))), phi: Math.atan2(y, x) };
    }

    // General density matrix reduced calculation
    let rho00 = 0, rho11 = 0;
    let rho01 = new Complex(0, 0);

    for (let i = 0; i < this.numStates; i++) {
      if ((i & bitMask) === 0) {
        const i1 = i | bitMask;
        rho00 += this.state[i].absSq();
        rho11 += this.state[i1].absSq();
        // rho01 += a0 * a1*
        const term = this.state[i].mul(this.state[i1].conj());
        rho01 = rho01.add(term);
      }
    }

    const x = 2 * rho01.re;
    const y = 2 * rho01.im;
    const z = rho00 - rho11;

    return {
      x,
      y,
      z,
      theta: Math.acos(Math.max(-1, Math.min(1, z))),
      phi: Math.atan2(y, x),
      p0: rho00,
      p1: rho11
    };
  }

  // Export to Qiskit (Python)
  toQiskit(grid) {
    let py = `# Generated by QuantaLearn (SIH26-26140)
from qiskit import QuantumCircuit, Aer, execute
import matplotlib.pyplot as plt

# Initialize ${this.numQubits}-qubit circuit
qc = QuantumCircuit(${this.numQubits}, ${this.numQubits})

`;
    const numCols = grid[0].length;
    for (let col = 0; col < numCols; col++) {
      let cnotControl = -1, cnotTarget = -1;
      for (let q = 0; q < this.numQubits; q++) {
        if (grid[q][col] === 'CX_CTRL') cnotControl = q;
        if (grid[q][col] === 'CX_TGT') cnotTarget = q;
      }
      if (cnotControl !== -1 && cnotTarget !== -1) {
        py += `qc.cx(${cnotControl}, ${cnotTarget})\n`;
      }
      for (let q = 0; q < this.numQubits; q++) {
        const gate = grid[q][col];
        if (!gate || gate === 'CX_CTRL' || gate === 'CX_TGT') continue;
        if (gate === 'M') {
          py += `qc.measure(${q}, ${q})\n`;
        } else {
          py += `qc.${gate.toLowerCase()}(${q})\n`;
        }
      }
    }

    py += `\n# Simulate using StatevectorSimulator
backend = Aer.get_backend('statevector_simulator')
job = execute(qc, backend)
result = job.result()
statevector = result.get_statevector()
print("Final Statevector:", statevector)
`;
    return py;
  }

  // Export to OpenQASM 2.0
  toQASM(grid) {
    let qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${this.numQubits}];\ncreg c[${this.numQubits}];\n\n`;
    const numCols = grid[0].length;
    for (let col = 0; col < numCols; col++) {
      let cnotControl = -1, cnotTarget = -1;
      for (let q = 0; q < this.numQubits; q++) {
        if (grid[q][col] === 'CX_CTRL') cnotControl = q;
        if (grid[q][col] === 'CX_TGT') cnotTarget = q;
      }
      if (cnotControl !== -1 && cnotTarget !== -1) {
        qasm += `cx q[${cnotControl}], q[${cnotTarget}];\n`;
      }
      for (let q = 0; q < this.numQubits; q++) {
        const gate = grid[q][col];
        if (!gate || gate === 'CX_CTRL' || gate === 'CX_TGT') continue;
        if (gate === 'M') {
          qasm += `measure q[${q}] -> c[${q}];\n`;
        } else {
          qasm += `${gate.toLowerCase()} q[${q}];\n`;
        }
      }
    }
    return qasm;
  }
}

window.QuantumCircuitEngine = QuantumCircuitEngine;
