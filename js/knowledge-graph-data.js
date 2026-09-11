/**
 * Ananta - Quantum Knowledge Graph Data
 * Standalone curriculum nodes and prerequisite DAG definitions (Modules 01-10).
 * Self-contained data model without external dependencies.
 */

(function () {
  'use strict';

  const QUANTUM_KG_NODES = [
    {
      id: 'module-01',
      title: 'Hilbert Space & Statevector Representation',
      category: 'Foundations',
      level: 'Beginner',
      prerequisites: [],
      x: 80,
      y: 250
    },
    {
      id: 'module-02',
      title: 'Gate Unitaries & Matrix Evolution',
      category: 'Quantum Gates',
      level: 'Beginner',
      prerequisites: ['module-01'],
      x: 290,
      y: 150
    },
    {
      id: 'module-03',
      title: 'Density Matrix Formalism & Mixed States',
      category: 'Statistical Physics',
      level: 'Intermediate',
      prerequisites: ['module-01'],
      x: 290,
      y: 370
    },
    {
      id: 'module-04',
      title: 'Pauli Observables & Expectation Values',
      category: 'Measurements',
      level: 'Intermediate',
      prerequisites: ['module-02'],
      x: 500,
      y: 90
    },
    {
      id: 'module-06',
      title: 'OpenQASM 3.0 & Google Cirq AST Compilation',
      category: 'Software Engineering',
      level: 'Intermediate',
      prerequisites: ['module-02'],
      x: 500,
      y: 210
    },
    {
      id: 'module-05',
      title: 'Decoherence & Lindblad Master Equation',
      category: 'Hardware Physics',
      level: 'Advanced',
      prerequisites: ['module-03'],
      x: 500,
      y: 370
    },
    {
      id: 'module-07',
      title: 'Entanglement Entropy & Bell States',
      category: 'Quantum Phenomena',
      level: 'Intermediate',
      prerequisites: ['module-02', 'module-04'],
      x: 710,
      y: 150
    },
    {
      id: 'module-08',
      title: 'Quantum Teleportation Protocol',
      category: 'Quantum Protocols',
      level: 'Advanced',
      prerequisites: ['module-07'],
      x: 920,
      y: 90
    },
    {
      id: 'module-09',
      title: 'Grover Search & Amplitude Amplification',
      category: 'Quantum Algorithms',
      level: 'Advanced',
      prerequisites: ['module-06', 'module-07'],
      x: 920,
      y: 230
    },
    {
      id: 'module-10',
      title: 'Variational Quantum Eigensolver (VQE)',
      category: 'NISQ Algorithms',
      level: 'Advanced',
      prerequisites: ['module-05', 'module-09'],
      x: 1100,
      y: 310
    }
  ];

  // Expose on global window object
  window.QUANTUM_KG_NODES = QUANTUM_KG_NODES;
})();

