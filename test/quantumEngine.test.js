/**
 * quantum-engine.js is a browser global (no module.exports, since it also
 * needs to load via a plain <script> tag) - it's loaded here into a real
 * vm context to test it exactly as the browser would run it. This verifies
 * the computeTotalUnitary() fix from this project's history: it used to be
 * hardcoded to exactly 3 qubits and had no SWAP/Toffoli support, so
 * U_total * |0...0> would silently diverge from the real simulated state
 * for any circuit using those gates or a different register size.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadEngine() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'quantum-engine.js'), 'utf8');
  const sandbox = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'quantum-engine.js' });
  return sandbox.QuantumCircuitEngine;
}

function buildGrid(numQubits, cols) {
  const grid = Array.from({ length: numQubits }, () => []);
  for (const col of cols) {
    for (let q = 0; q < numQubits; q++) grid[q].push(col[q] || null);
  }
  return grid;
}

function maxAmplitudeDiff(a, b) {
  let max = 0;
  for (let i = 0; i < a.length; i++) {
    max = Math.max(max, Math.abs(a[i].re - b[i].re), Math.abs(a[i].im - b[i].im));
  }
  return max;
}

function assertUnitaryMatchesSimulation(QuantumCircuitEngine, numQubits, cols, label) {
  const engine = new QuantumCircuitEngine(numQubits);
  engine.setNumQubits(numQubits);
  const grid = buildGrid(numQubits, cols);

  engine.runCircuitUpToCol(grid, -1);
  const simState = engine.state.map((c) => ({ re: c.re, im: c.im }));

  const unitaryResult = engine.computeTotalUnitary(grid, -1);
  const N = 1 << numQubits;
  const uState = Array.from({ length: N }, (_, i) => unitaryResult.matrix[i][0]);

  const diff = maxAmplitudeDiff(simState, uState);
  assert.ok(diff < 1e-6, `${label}: U_total|0...0> should match the real simulated state (max diff ${diff})`);
  assert.ok(unitaryResult.isUnitary, `${label}: computed matrix should itself be unitary`);
}

test('computeTotalUnitary matches simulation for a 2-qubit register with SWAP (no Toffoli possible at 2 qubits)', () => {
  const QuantumCircuitEngine = loadEngine();
  assertUnitaryMatchesSimulation(QuantumCircuitEngine, 2, [
    ['H', null],
    ['SWAP', 'SWAP']
  ], '2-qubit H+SWAP');
});

test('computeTotalUnitary matches simulation for a 4-qubit register with Toffoli + other single-qubit gates in the same column', () => {
  const QuantumCircuitEngine = loadEngine();
  assertUnitaryMatchesSimulation(QuantumCircuitEngine, 4, [
    ['X', 'X', null, 'H'],
    ['CX_CTRL', 'CX_CTRL', 'CX_TGT', 'X']
  ], '4-qubit Toffoli + others');
});

test('computeTotalUnitary matches simulation for a combined 4-qubit circuit: H, Toffoli, SWAP, and single-qubit gates in sequence', () => {
  const QuantumCircuitEngine = loadEngine();
  assertUnitaryMatchesSimulation(QuantumCircuitEngine, 4, [
    ['H', 'H', 'H', 'H'],
    ['CX_CTRL', null, 'CX_CTRL', 'CX_TGT'],
    ['SWAP', 'SWAP', null, null],
    ['S', 'T', 'Z', 'Y']
  ], '4-qubit combo Toffoli+SWAP+singles');
});

test('computeTotalUnitary still matches simulation for the original 3-qubit case (regression check)', () => {
  const QuantumCircuitEngine = loadEngine();
  assertUnitaryMatchesSimulation(QuantumCircuitEngine, 3, [
    ['H', null, 'X'],
    ['CX_CTRL', 'CX_TGT', null]
  ], '3-qubit CNOT + other qubit (originally-supported case)');
});
