const ALGORITHM_CATALOG = [
  {
    "id": "superposition",
    "category": "Foundational",
    "title": "Equal Superposition (Hadamard)",
    "subtitle": "H Gate",
    "desc": "A single Hadamard gate rotates |0> by 45 degrees on the Bloch sphere, placing the qubit in a perfect 50/50 superposition of |0> and |1>.",
    "realWorld": "Quantum random number generation. The output is a fundamentally unpredictable random bit.",
    "math": "|psi> = 1/sqrt(2) (|0> + |1>) = |+>",
    "difficulty": "Beginner",
    "tags": [
      "Single Qubit",
      "Superposition"
    ],
    "grid": [
      [
        "H",
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "pauli_x",
    "category": "Foundational",
    "title": "Pauli-X (Quantum NOT Gate)",
    "subtitle": "X Gate",
    "desc": "The quantum NOT gate flips |0> to |1>. Equivalent to a 180 degree rotation around the X-axis of the Bloch sphere.",
    "realWorld": "Qubit initialization and reset in quantum error correction codes.",
    "math": "|0> to |1>,  X = [[0,1],[1,0]]",
    "difficulty": "Beginner",
    "tags": [
      "Single Qubit",
      "Gates"
    ],
    "grid": [
      [
        "X",
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "pauli_y",
    "category": "Foundational",
    "title": "Pauli-Y Rotation",
    "subtitle": "Y Gate",
    "desc": "Applies a 180 degree rotation around the Y-axis, combining a bit flip with a phase flip.",
    "realWorld": "Used in dynamical decoupling sequences (XY-4, XY-8) to suppress dephasing noise in superconducting processors.",
    "math": "|psi> to Y|psi>,  Y = [[0,-i],[i,0]]",
    "difficulty": "Beginner",
    "tags": [
      "Single Qubit",
      "Phase"
    ],
    "grid": [
      [
        "Y",
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "pauli_z",
    "category": "Foundational",
    "title": "Pauli-Z (Phase Flip)",
    "subtitle": "Z Gate",
    "desc": "Applies a 180 degree phase flip. |0> stays unchanged but |1> acquires a minus sign. Invisible in the computational basis but crucial for interference.",
    "realWorld": "Phase kickback mechanism used in Grover search and Quantum Fourier Transform.",
    "math": "|0> to |0>,  |1> to -|1>",
    "difficulty": "Beginner",
    "tags": [
      "Single Qubit",
      "Phase"
    ],
    "grid": [
      [
        "H",
        "Z",
        "H",
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "s_gate",
    "category": "Foundational",
    "title": "S Gate (Phase pi/2)",
    "subtitle": "S = T^2",
    "desc": "Applies a 90 degree rotation around the Z-axis. S = sqrt(Z) = T^2. Used in QFT as controlled phase rotation.",
    "realWorld": "Core building block of QFT-based algorithms including Shor's factoring algorithm.",
    "math": "|0> to |0>,  |1> to i|1>",
    "difficulty": "Beginner",
    "tags": [
      "Single Qubit",
      "Phase"
    ],
    "grid": [
      [
        "H",
        "S",
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "t_gate",
    "category": "Foundational",
    "title": "T Gate (Phase pi/4)",
    "subtitle": "Magic Gate",
    "desc": "Applies a 45 degree phase rotation. The T gate is non-Clifford, enabling universal quantum computation.",
    "realWorld": "T-gate count is the standard metric of quantum circuit complexity in fault-tolerant quantum computing.",
    "math": "|0> to |0>,  |1> to exp(i*pi/4)|1>",
    "difficulty": "Intermediate",
    "tags": [
      "Single Qubit",
      "Universal"
    ],
    "grid": [
      [
        "H",
        "T",
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "superposition_3",
    "category": "Foundational",
    "title": "Full 3-Qubit Superposition",
    "subtitle": "Uniform Distribution",
    "desc": "Applies Hadamard to all 3 qubits, creating uniform superposition across all 8 basis states with 12.5% each.",
    "realWorld": "Initial state preparation for Grover Algorithm and Quantum Amplitude Amplification.",
    "math": "|psi> = 1/sqrt(8) * sum_i |i> for i in {0...7}",
    "difficulty": "Beginner",
    "tags": [
      "Multi Qubit",
      "Superposition"
    ],
    "grid": [
      [
        "H",
        null,
        null,
        null,
        null,
        null
      ],
      [
        "H",
        null,
        null,
        null,
        null,
        null
      ],
      [
        "H",
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "bell_phi_plus",
    "category": "Entanglement",
    "title": "Bell State |Phi+> (EPR Pair)",
    "subtitle": "H + CNOT",
    "desc": "Creates the maximally entangled Bell state. Measuring either qubit instantly determines the other regardless of distance.",
    "realWorld": "Quantum Key Distribution, quantum teleportation, loophole-free Bell inequality tests.",
    "math": "|Phi+> = 1/sqrt(2) (|00> + |11>)",
    "difficulty": "Intermediate",
    "tags": [
      "Entanglement",
      "Bell State"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        null,
        null,
        null,
        null
      ],
      [
        null,
        "CX_TGT",
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "bell_phi_minus",
    "category": "Entanglement",
    "title": "Bell State |Phi->",
    "subtitle": "Anti-Correlated Phase",
    "desc": "Second Bell state with relative minus sign. Correlated |00> and |11> outcomes but with phase difference of -1.",
    "realWorld": "One of four Bell basis states used in quantum teleportation classical correction.",
    "math": "|Phi-> = 1/sqrt(2) (|00> - |11>)",
    "difficulty": "Intermediate",
    "tags": [
      "Entanglement",
      "Bell State"
    ],
    "grid": [
      [
        "X",
        "H",
        "CX_CTRL",
        null,
        null,
        null
      ],
      [
        null,
        null,
        "CX_TGT",
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "bell_psi_plus",
    "category": "Entanglement",
    "title": "Bell State |Psi+>",
    "subtitle": "Anti-Correlated Outcomes",
    "desc": "Third Bell state: measuring qubit 0 as 0 guarantees qubit 1 measures as 1. Qubits are always anti-correlated.",
    "realWorld": "Superdense coding: sending 2 classical bits using 1 qubit and 1 entangled pair.",
    "math": "|Psi+> = 1/sqrt(2) (|01> + |10>)",
    "difficulty": "Intermediate",
    "tags": [
      "Entanglement",
      "Bell State"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        null,
        null,
        null,
        null
      ],
      [
        "X",
        "CX_TGT",
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "bell_psi_minus",
    "category": "Entanglement",
    "title": "Bell State |Psi-> (Singlet)",
    "subtitle": "Maximum Anti-Correlation",
    "desc": "The singlet state, antisymmetric under qubit exchange with special symmetry properties.",
    "realWorld": "Ekert E91 quantum cryptography protocol. Violation of Bell inequality.",
    "math": "|Psi-> = 1/sqrt(2) (|01> - |10>)",
    "difficulty": "Intermediate",
    "tags": [
      "Entanglement",
      "Bell State"
    ],
    "grid": [
      [
        "H",
        "Z",
        "CX_CTRL",
        null,
        null,
        null
      ],
      [
        "X",
        null,
        "CX_TGT",
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "ghz",
    "category": "Entanglement",
    "title": "GHZ State (3-Qubit)",
    "subtitle": "Greenberger-Horne-Zeilinger",
    "desc": "The 3-qubit GHZ state maximally entangles all three qubits. Measuring any one instantly collapses all three.",
    "realWorld": "Quantum secret sharing, distributed quantum computing, multi-party entanglement demonstration.",
    "math": "|GHZ> = 1/sqrt(2) (|000> + |111>)",
    "difficulty": "Intermediate",
    "tags": [
      "Entanglement",
      "GHZ",
      "Multi-Qubit"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        null,
        null,
        null,
        null
      ],
      [
        null,
        "CX_TGT",
        "CX_CTRL",
        null,
        null,
        null
      ],
      [
        null,
        null,
        "CX_TGT",
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "grover_2qubit",
    "category": "Search & Optimization",
    "title": "Grover Search (2-Qubit)",
    "subtitle": "Oracle + Diffusion, O(sqrt(N))",
    "desc": "Searches N=4 items in O(sqrt(N))=2 oracle calls vs classical O(N)=4. Uses amplitude amplification to boost target state |11>.",
    "realWorld": "Database search, constraint satisfaction, quantum-enhanced optimization heuristics.",
    "math": "Search 4 items in 2 oracle queries (classical: 4)",
    "difficulty": "Advanced",
    "tags": [
      "Search",
      "Grover",
      "Amplitude Amplification"
    ],
    "grid": [
      [
        "H",
        "Z",
        "H",
        "X",
        "H",
        null
      ],
      [
        "H",
        "CX_TGT",
        "H",
        "X",
        "H",
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "grover_3qubit",
    "category": "Search & Optimization",
    "title": "Grover Search (3-Qubit)",
    "subtitle": "Oracle marks |111>",
    "desc": "Extends Grover to 3 qubits (N=8). After 2-3 iterations, the target state |111> has dramatically boosted probability.",
    "realWorld": "Quantum speedup for NP-hard problems. Searching molecular configuration spaces in drug discovery.",
    "math": "Search 8 items in ~2.2 oracle calls (classical: 8)",
    "difficulty": "Expert",
    "tags": [
      "Search",
      "Grover"
    ],
    "grid": [
      [
        "H",
        "Z",
        "H",
        "CX_CTRL",
        null,
        null
      ],
      [
        "H",
        "Z",
        "H",
        null,
        "CX_CTRL",
        null
      ],
      [
        "H",
        "Z",
        "H",
        "CX_TGT",
        "CX_TGT",
        null
      ]
    ]
  },
  {
    "id": "amplitude_amplification",
    "category": "Search & Optimization",
    "title": "Amplitude Amplification",
    "subtitle": "General Grover Framework",
    "desc": "General form of Grover algorithm. Any state preparation routine A replaces Hadamard, amplifying any target subspace.",
    "realWorld": "Quantum Monte Carlo methods for financial risk analysis and derivative pricing.",
    "math": "Ao = -A S0 A-dagger Sx,  O(1/sqrt(eps)) queries",
    "difficulty": "Advanced",
    "tags": [
      "Search",
      "Amplitude Amplification"
    ],
    "grid": [
      [
        "H",
        "X",
        "H",
        "X",
        null,
        null
      ],
      [
        "H",
        "X",
        "CX_TGT",
        "X",
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "teleportation",
    "category": "Communication",
    "title": "Quantum Teleportation",
    "subtitle": "State Transfer via Entanglement",
    "desc": "Transfers exact quantum state of Qubit 0 to Qubit 2 using shared entanglement and 2 classical bits. No physical qubit crosses.",
    "realWorld": "Quantum internet repeater networks. Long-distance quantum key distribution. Connecting quantum computers.",
    "math": "EPR + Bell measurement + classical correction = state transfer",
    "difficulty": "Advanced",
    "tags": [
      "Communication",
      "Teleportation"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        "H",
        "M",
        null,
        null
      ],
      [
        null,
        "CX_TGT",
        null,
        "M",
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        "X",
        "Z"
      ]
    ]
  },
  {
    "id": "superdense_coding",
    "category": "Communication",
    "title": "Superdense Coding",
    "subtitle": "2 Classical Bits via 1 Qubit",
    "desc": "Encodes 2 classical bits into a single qubit using a pre-shared entangled pair. Maximally efficient.",
    "realWorld": "Achieves Shannon capacity of 2 bits per qubit in an entangled quantum channel.",
    "math": "1 ebit + 1 qubit = 2 classical bits",
    "difficulty": "Advanced",
    "tags": [
      "Communication",
      "Entanglement"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        "Z",
        "X",
        "CX_CTRL",
        "H"
      ],
      [
        null,
        "CX_TGT",
        null,
        null,
        "CX_TGT",
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "bb84_qkd",
    "category": "Communication",
    "title": "BB84 Quantum Key Distribution",
    "subtitle": "Unconditionally Secure Keys",
    "desc": "Alice and Bob share a secret key guaranteed secure by quantum mechanics. Any eavesdropper inevitably disturbs the state.",
    "realWorld": "Commercial QKD networks in China (2000 km backbone), Europe (SECOQC), US DoD networks.",
    "math": "Eve detection rate: 25% bit errors per qubit intercepted",
    "difficulty": "Intermediate",
    "tags": [
      "Cryptography",
      "QKD"
    ],
    "grid": [
      [
        "H",
        "M",
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "deutsch_balanced",
    "category": "Oracle Algorithms",
    "title": "Deutsch-Jozsa (Balanced Oracle)",
    "subtitle": "1-Query Exponential Speedup",
    "desc": "Determines if oracle f is constant or balanced in ONE quantum query vs 2^(n-1)+1 classical queries.",
    "realWorld": "The first proven quantum speedup (1992). Foundation of all quantum algorithm theory.",
    "math": "O(1) queries vs classical O(2^(n-1)+1)",
    "difficulty": "Intermediate",
    "tags": [
      "Oracle",
      "Deutsch-Jozsa"
    ],
    "grid": [
      [
        "H",
        "X",
        "H",
        null,
        null,
        null
      ],
      [
        "X",
        "H",
        "CX_TGT",
        "H",
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "deutsch_constant",
    "category": "Oracle Algorithms",
    "title": "Deutsch-Jozsa (Constant Oracle)",
    "subtitle": "Constant Function Query",
    "desc": "Tests the constant oracle (f(x)=0 for all x). Output register measures |0...0> with certainty.",
    "realWorld": "Demonstrates quantum deterministic advantage vs probabilistic classical algorithms.",
    "math": "f(x) = 0 for all x: output |0...0>",
    "difficulty": "Intermediate",
    "tags": [
      "Oracle",
      "Deutsch-Jozsa"
    ],
    "grid": [
      [
        "H",
        null,
        "H",
        null,
        null,
        null
      ],
      [
        "X",
        "H",
        null,
        "H",
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "bernstein_vazirani",
    "category": "Oracle Algorithms",
    "title": "Bernstein-Vazirani Algorithm",
    "subtitle": "Find Hidden Bitstring in 1 Query",
    "desc": "Recovers secret bitstring s in f(x) = s.x mod 2 in ONE quantum query vs classical n queries.",
    "realWorld": "Demonstrates quantum linear advantage for learning problems. Related to quantum ML speedups.",
    "math": "f(x) = s.x mod 2: recover s in 1 query vs n classical",
    "difficulty": "Advanced",
    "tags": [
      "Oracle",
      "Bernstein-Vazirani"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        "H",
        null,
        null,
        null
      ],
      [
        "H",
        "CX_CTRL",
        "H",
        null,
        null,
        null
      ],
      [
        "X",
        "H",
        "CX_TGT",
        "H",
        null,
        null
      ]
    ]
  },
  {
    "id": "simon",
    "category": "Oracle Algorithms",
    "title": "Simon Algorithm",
    "subtitle": "Exponential Oracle Speedup",
    "desc": "Finds hidden period s such that f(x)=f(x XOR s) in O(n) quantum queries vs O(2^(n/2)) classical.",
    "realWorld": "Precursor to Shor algorithm. Shows quantum efficiently learns hidden linear structure.",
    "math": "f(x)=f(x XOR s): O(n) queries vs O(2^(n/2)) classical",
    "difficulty": "Expert",
    "tags": [
      "Oracle",
      "Simon",
      "Period Finding"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        "H",
        null,
        null,
        null
      ],
      [
        "H",
        null,
        "CX_CTRL",
        "H",
        null,
        null
      ],
      [
        null,
        "CX_TGT",
        "CX_TGT",
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "qft_3",
    "category": "Phase Estimation & QFT",
    "title": "Quantum Fourier Transform (3-Qubit)",
    "subtitle": "Quantum DFT",
    "desc": "Maps computational basis states to their discrete Fourier transform using Hadamard and controlled phase rotations.",
    "realWorld": "Core subroutine of Shor factoring, quantum phase estimation, and quantum simulation.",
    "math": "QFT|j> = 1/sqrt(N) * sum_k exp(2*pi*i*j*k/N)|k>",
    "difficulty": "Expert",
    "tags": [
      "QFT",
      "Shor",
      "Phase Estimation"
    ],
    "grid": [
      [
        "H",
        "S",
        "T",
        null,
        "H",
        null
      ],
      [
        null,
        "CX_CTRL",
        null,
        "H",
        "S",
        null
      ],
      [
        null,
        null,
        "CX_CTRL",
        "CX_TGT",
        "CX_TGT",
        "H"
      ]
    ]
  },
  {
    "id": "phase_estimation",
    "category": "Phase Estimation & QFT",
    "title": "Quantum Phase Estimation",
    "subtitle": "Eigenvalue Estimation",
    "desc": "Estimates eigenphase phi of U|psi>=exp(2*pi*i*phi)|psi> with exponential precision using H, controlled-U, and inverse QFT.",
    "realWorld": "Quantum chemistry: computing molecular ground state energies for drug design.",
    "math": "U|psi>=exp(2*pi*i*phi)|psi>: measure phi in binary",
    "difficulty": "Expert",
    "tags": [
      "Phase Estimation",
      "QFT",
      "Chemistry"
    ],
    "grid": [
      [
        "H",
        null,
        "CX_CTRL",
        "H",
        null,
        null
      ],
      [
        "H",
        "CX_CTRL",
        null,
        null,
        "H",
        null
      ],
      [
        null,
        "CX_TGT",
        "CX_TGT",
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "vqe_ansatz",
    "category": "Phase Estimation & QFT",
    "title": "VQE Ansatz (Quantum Chemistry)",
    "subtitle": "Variational Quantum Eigensolver",
    "desc": "Parameterized circuit that minimizes energy expectation value via classical-quantum hybrid optimization.",
    "realWorld": "Computing binding energies for drug molecules. Nitrogenase enzyme simulation for room-temperature fertilizer synthesis.",
    "math": "min(theta) <psi(theta)|H|psi(theta)> = ground state energy",
    "difficulty": "Expert",
    "tags": [
      "VQE",
      "Variational",
      "Chemistry"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        "T",
        "CX_CTRL",
        null,
        null
      ],
      [
        null,
        "CX_TGT",
        "S",
        null,
        "CX_CTRL",
        null
      ],
      [
        "X",
        null,
        "H",
        "CX_TGT",
        "CX_TGT",
        null
      ]
    ]
  },
  {
    "id": "bit_flip_code",
    "category": "Quantum Error Correction",
    "title": "3-Qubit Bit Flip Code",
    "subtitle": "Repetition Code",
    "desc": "Encodes a logical qubit across 3 physical qubits. Syndrome measurement corrects any single bit flip error.",
    "realWorld": "Fault-tolerant quantum computing. Basis for the 9-qubit Shor code and surface codes.",
    "math": "alpha|0>+beta|1> to alpha|000>+beta|111> (distance-3 code)",
    "difficulty": "Advanced",
    "tags": [
      "Error Correction",
      "Fault Tolerance"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        "CX_CTRL",
        null,
        null,
        null
      ],
      [
        null,
        "CX_TGT",
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        "CX_TGT",
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "phase_flip_code",
    "category": "Quantum Error Correction",
    "title": "3-Qubit Phase Flip Code",
    "subtitle": "Hadamard Basis Repetition",
    "desc": "Corrects phase flip (Z) errors by encoding in the Hadamard basis. Detects and corrects a single Z error on any qubit.",
    "realWorld": "Combined with bit flip code in Shor 9-qubit code protecting against arbitrary single-qubit errors.",
    "math": "H(x3) applied to bit flip code: corrects Z errors",
    "difficulty": "Advanced",
    "tags": [
      "Error Correction",
      "Phase Error"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        "CX_CTRL",
        "H",
        null,
        null
      ],
      [
        "H",
        "CX_TGT",
        null,
        "H",
        null,
        null
      ],
      [
        "H",
        null,
        "CX_TGT",
        "H",
        null,
        null
      ]
    ]
  },
  {
    "id": "swap_test",
    "category": "Advanced & NISQ",
    "title": "SWAP Test (Quantum Fingerprinting)",
    "subtitle": "State Similarity Comparison",
    "desc": "Uses ancilla qubit and controlled-SWAP to estimate overlap |<psi|phi>|^2 between two quantum states.",
    "realWorld": "Quantum machine learning for similarity comparison (k-NN, SVM). Quantum protocol verification.",
    "math": "P(0) = (1 + |<psi|phi>|^2) / 2",
    "difficulty": "Advanced",
    "tags": [
      "NISQ",
      "Machine Learning",
      "SWAP"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        "H",
        null,
        null,
        null
      ],
      [
        null,
        "CX_TGT",
        null,
        null,
        null,
        null
      ],
      [
        "X",
        "CX_TGT",
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "quantum_walk",
    "category": "Advanced & NISQ",
    "title": "Discrete Quantum Walk",
    "subtitle": "Quadratic Diffusion Speedup",
    "desc": "Quantum analog of random walk. Propagates with quantum interference, spreading quadratically faster than classical diffusion.",
    "realWorld": "Quantum walk search algorithms (Ambainis 2004). Graph connectivity testing. Quantum transport simulation.",
    "math": "Coin: H|c>, Shift: S|c,p> = |c, p+-1>",
    "difficulty": "Expert",
    "tags": [
      "Quantum Walk",
      "Search",
      "Transport"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        "H",
        "CX_CTRL",
        null,
        null
      ],
      [
        null,
        "CX_TGT",
        null,
        "CX_TGT",
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "qaoa_maxcut",
    "category": "Advanced & NISQ",
    "title": "QAOA (Max-Cut Approximation)",
    "subtitle": "Quantum Approximate Optimization",
    "desc": "Alternating problem and mixer Hamiltonians approximate solutions to combinatorial optimization problems like Max-Cut.",
    "realWorld": "Vehicle routing, logistics, portfolio optimization, network design. Tested on IBM Quantum and Google Sycamore.",
    "math": "|gamma,beta> = U_B(beta) U_C(gamma) |+>^n",
    "difficulty": "Expert",
    "tags": [
      "NISQ",
      "QAOA",
      "Optimization"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        "S",
        "CX_CTRL",
        "T",
        null
      ],
      [
        "H",
        "CX_TGT",
        "T",
        null,
        "CX_CTRL",
        null
      ],
      [
        "H",
        null,
        "S",
        "CX_TGT",
        "CX_TGT",
        null
      ]
    ]
  },
  {
    "id": "no_cloning",
    "category": "Advanced & NISQ",
    "title": "No-Cloning Theorem Demo",
    "subtitle": "Quantum States Cannot Be Copied",
    "desc": "Shows why unknown quantum state cannot be perfectly copied. CNOT copies only basis states, fails for superpositions.",
    "realWorld": "Foundation of quantum cryptography security. No quantum virus can spread. Quantum money cannot be counterfeited.",
    "math": "No unitary U: U|psi>|0> = |psi>|psi> for all |psi>",
    "difficulty": "Intermediate",
    "tags": [
      "No-Cloning",
      "Cryptography",
      "Foundations"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        null,
        null,
        null,
        null
      ],
      [
        null,
        "CX_TGT",
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  },
  {
    "id": "quantum_eraser",
    "category": "Advanced & NISQ",
    "title": "Quantum Eraser",
    "subtitle": "Restoring Lost Interference",
    "desc": "Measurement destroys interference; erasing which-path information restores it. Demonstrates reversibility of quantum measurement.",
    "realWorld": "Foundational test of complementarity. Delayed-choice quantum eraser experiments with photons.",
    "math": "Tr(rho_A): mixed if measured, pure if erased",
    "difficulty": "Advanced",
    "tags": [
      "Foundations",
      "Measurement",
      "Interference"
    ],
    "grid": [
      [
        "H",
        "CX_CTRL",
        "H",
        null,
        "H",
        null
      ],
      [
        null,
        "CX_TGT",
        null,
        "H",
        "CX_TGT",
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ]
  }
];


// ============================================================
// ALGORITHM LIBRARY CLASS
// ============================================================
class AlgorithmLibrary {
  constructor() {
    this.currentCategory = 'All';
    this.categories = ['All','Foundational','Entanglement','Search & Optimization','Communication','Oracle Algorithms','Phase Estimation & QFT','Quantum Error Correction','Advanced & NISQ'];
    this.difficultyColors = {
      'Beginner':     { text: '#10b981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.3)' },
      'Intermediate': { text: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.3)' },
      'Advanced':     { text: '#f97316', bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.3)' },
      'Expert':       { text: '#fa4d56', bg: 'rgba(250,77,86,0.10)', border: 'rgba(250,77,86,0.3)' },
    };
    this.render();
  }

  render() {
    const container = document.getElementById('algorithm-cards-container');
    if (!container) return;
    container.innerHTML = '';

    const filterBar = document.createElement('div');
    filterBar.className = 'algo-filter-bar';
    filterBar.innerHTML = '<span class="algo-filter-label">Filter by Category:</span>';
    const grid = document.createElement('div');
    grid.className = 'algo-cards-grid';
    grid.id = 'algo-cards-grid';

    this.categories.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = 'algo-cat-chip' + (cat === this.currentCategory ? ' active' : '');
      chip.textContent = cat;
      chip.addEventListener('click', () => {
        this.currentCategory = cat;
        filterBar.querySelectorAll('.algo-cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.renderCards(grid);
      });
      filterBar.appendChild(chip);
    });
    container.appendChild(filterBar);

    const statsBar = document.createElement('div');
    statsBar.className = 'algo-stats-bar';
    statsBar.innerHTML =
      '<div class="algo-stat"><span class="algo-stat-num">' + ALGORITHM_CATALOG.length + '</span><span class="algo-stat-lbl">Total Algorithms</span></div>' +
      '<div class="algo-stat"><span class="algo-stat-num">' + (this.categories.length - 1) + '</span><span class="algo-stat-lbl">Categories</span></div>' +
      '<div class="algo-stat"><span class="algo-stat-num">100%</span><span class="algo-stat-lbl">Simulator Ready</span></div>';
    container.appendChild(statsBar);
    container.appendChild(grid);
    this.renderCards(grid);
  }

  renderCards(grid) {
    grid.innerHTML = '';
    const filtered = this.currentCategory === 'All'
      ? ALGORITHM_CATALOG
      : ALGORITHM_CATALOG.filter(a => a.category === this.currentCategory);

    filtered.forEach(algo => {
      const diff = this.difficultyColors[algo.difficulty] || this.difficultyColors['Beginner'];
      const card = document.createElement('div');
      card.className = 'algo-card';

      card.innerHTML =
        '<div class="algo-card-top">' +
          '<div class="algo-header-row">' +
            '<div class="algo-category-tag">' + algo.category + '</div>' +
            '<span class="algo-difficulty-badge" style="color:' + diff.text + ';background:' + diff.bg + ';border:1px solid ' + diff.border + ';">' + algo.difficulty + '</span>' +
          '</div>' +
          '<h3 class="algo-title">' + algo.title + '</h3>' +
          '<span class="algo-subtitle">' + algo.subtitle + '</span>' +
        '</div>' +
        '<div class="algo-card-body">' +
          '<p class="algo-desc">' + algo.desc + '</p>' +
          '<div class="algo-math-box"><span class="algo-math-label">Math</span><code class="algo-math-text">' + algo.math + '</code></div>' +
          '<div class="algo-real-world"><span class="algo-rw-label">Real World</span><p class="algo-rw-text">' + algo.realWorld + '</p></div>' +
        '</div>' +
        '<div class="algo-circuit-preview"><div class="circuit-preview-label">Circuit Preview</div>' + this.buildMiniCircuit(algo.grid) + '</div>' +
        '<div class="algo-card-actions">' +
          '<div class="algo-tags-row">' + algo.tags.map(t => '<span class="algo-tag">' + t + '</span>').join('') + '</div>' +
          '<button class="btn-run-in-sim">&#9654; Run in Simulator</button>' +
        '</div>';

      card.querySelector('.btn-run-in-sim').addEventListener('click', (e) => {
        e.stopPropagation();
        this.loadIntoSimulator(algo);
      });
      grid.appendChild(card);
    });
  }

  buildMiniCircuit(grid) {
    const gc = { H:'#0f62fe',X:'#10b981',Y:'#8b5cf6',Z:'#ea580c',S:'#0891b2',T:'#06b6d4',M:'#f97316',CX_CTRL:'#00f0ff',CX_TGT:'#00f0ff' };
    const gl = { H:'H', X:'X', Y:'Y', Z:'Z', S:'S', T:'T', M:'M', CX_CTRL:'ctrl', CX_TGT:'tgt' };
    let html = '<div class="mini-circuit-grid">';
    grid.forEach((row, r) => {
      html += '<div class="mini-circuit-row"><span class="mini-wire-label">q' + r + '</span><div class="mini-wire-line">';
      row.forEach(g => {
        if (g) {
          const c = gc[g] || '#6b7280';
          html += '<span class="mini-gate" style="background:' + c + '20;border:1px solid ' + c + ';color:' + c + ';" title="' + g + '">' + (gl[g] || g) + '</span>';
        } else {
          html += '<span class="mini-wire-gap"></span>';
        }
      });
      html += '</div></div>';
    });
    return html + '</div>';
  }

  loadIntoSimulator(algo) {
    if (!window.circuitUI) return;
    if (window.circuitUI.loadCircuit) {
      window.circuitUI.loadCircuit(algo.grid);
    } else {
      window.circuitUI.grid = algo.grid.map(row => [...row]);
      if (window.circuitUI.renderGrid) window.circuitUI.renderGrid();
      if (window.circuitUI.updateSimulation) window.circuitUI.updateSimulation();
    }
    const simTab = document.querySelector('[data-tab="simulator"]');
    if (simTab) simTab.click();
    this.showLoadBanner(algo.title, algo.math);
  }

  showLoadBanner(title, math) {
    const ex = document.getElementById('algo-load-banner');
    if (ex) ex.remove();
    const b = document.createElement('div');
    b.id = 'algo-load-banner';
    b.className = 'algo-load-banner';
    b.innerHTML = '<div class="banner-icon">&#128300;</div><div class="banner-text"><strong>' + title + '</strong><code>' + math + '</code></div>';
    document.body.appendChild(b);
    setTimeout(() => b.classList.add('banner-show'), 20);
    setTimeout(() => { b.classList.remove('banner-show'); setTimeout(() => b.remove(), 400); }, 4000);
  }
}

// ============================================================
// MISSION MANAGER
// ============================================================
class MissionManager {
  constructor() {
    this.missions = [
      {
        id: 1,
        title: 'Mission 1: The Quantum Coin Flip',
        desc: 'Put Qubit 0 into equal superposition using a Hadamard (H) gate.',
        hint: "Drag the 'H' gate from the palette onto Qubit 0, column 1.",
        check: (grid, probs) => grid[0].some(g => g === 'H') && probs.filter(p => p.probability > 0.4).length >= 2,
        completed: false
      },
      {
        id: 2,
        title: 'Mission 2: Spooky Entanglement',
        desc: 'Create a Bell pair (|Phi+>) using H on Qubit 0 and CNOT across Qubits 0 and 1.',
        hint: "H on q[0], then CX with q[0] as control and q[1] as target.",
        check: (grid, probs) => {
          const hasH = grid[0].some(g => g === 'H');
          const hasCX = grid[0].some((g, c) => g === 'CX_CTRL' && grid[1][c] === 'CX_TGT');
          const p00 = probs.find(p => p.state === '|000\u27e9')?.probability || 0;
          return hasH && hasCX && p00 > 0.4;
        },
        completed: false
      },
      {
        id: 3,
        title: 'Mission 3: The Quantum NOT Gate',
        desc: 'Flip Qubit 0 from state |0> to state |1> using a Pauli-X gate.',
        hint: "Drag the 'X' gate onto Qubit 0.",
        check: (grid, probs) => {
          const hasX = grid[0].some(g => g === 'X');
          const p1 = probs.find(p => p.state.startsWith('|1'))?.probability || 0;
          return hasX && p1 > 0.9;
        },
        completed: false
      },
      {
        id: 4,
        title: 'Mission 4: Interference Cancellation',
        desc: 'Demonstrate that H is its own inverse by applying H twice on Qubit 0 to return to |0>.',
        hint: "Place 'H' in column 1 and another 'H' in column 2 on Qubit 0.",
        check: (grid, probs) => {
          const hCount = grid[0].filter(g => g === 'H').length;
          const p0 = probs.find(p => p.state === '|000\u27e9')?.probability || 0;
          return hCount >= 2 && p0 > 0.9;
        },
        completed: false
      },
      {
        id: 5,
        title: 'Mission 5: GHZ Tri-Entanglement',
        desc: 'Entangle all 3 qubits into a GHZ state using H and two CNOT gates.',
        hint: "H on q[0], CX from q[0] to q[1], then CX from q[1] to q[2].",
        check: (grid, probs) => {
          const p000 = probs.find(p => p.state === '|000\u27e9')?.probability || 0;
          const p111 = probs.find(p => p.state === '|111\u27e9')?.probability || 0;
          return p000 > 0.4 && p111 > 0.4;
        },
        completed: false
      },
      {
        id: 6,
        title: 'Mission 6: Phase Alchemist',
        desc: 'Use T or S gates to add a complex phase without changing state probabilities.',
        hint: "Place H then S or T on any qubit and watch the phase clocks rotate.",
        check: (grid) => grid.some(row => row.some(g => g === 'T' || g === 'S')),
        completed: false
      }
    ];
    this.activeMission = 0;
    this.renderMissions();
  }

  renderMissions() {
    const listEl = document.getElementById('missions-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    this.missions.forEach((m, idx) => {
      const card = document.createElement('div');
      card.className = 'mission-card' + (m.completed ? ' mission-completed' : '') + (idx === this.activeMission ? ' mission-active' : '');
      card.innerHTML =
        '<div class="mission-header">' +
          '<span class="mission-status-icon">' + (m.completed ? '\u2713' : idx + 1) + '</span>' +
          '<h4 class="mission-title">' + m.title + '</h4>' +
        '</div>' +
        '<p class="mission-desc">' + m.desc + '</p>' +
        '<div class="mission-hint"><strong>Hint:</strong> ' + m.hint + '</div>' +
        '<button class="btn-load-mission">' + (m.completed ? 'Solved (Retry)' : 'Attempt Mission \u2192') + '</button>';
      card.querySelector('.btn-load-mission').addEventListener('click', () => {
        this.activeMission = idx;
        if (window.circuitUI) {
          window.circuitUI.clearCircuit();
          const t = document.querySelector('[data-tab="simulator"]');
          if (t) t.click();
        }
        this.renderMissions();
      });
      listEl.appendChild(card);
    });
    this.updateProgressBar();
  }

  evaluate(grid, probs) {
    const cur = this.missions[this.activeMission];
    if (cur && !cur.completed && cur.check(grid, probs)) {
      cur.completed = true;
      this.showSuccessNotification(cur.title);
      this.renderMissions();
    }
  }

  showSuccessNotification(title) {
    const t = document.createElement('div');
    t.className = 'mission-toast';
    t.innerHTML = '<div class="toast-icon">\ud83c\udfc6</div><div><strong>Mission Completed!</strong><div>' + title + '</div></div>';
    document.body.appendChild(t);
    setTimeout(() => { t.classList.add('toast-fade'); setTimeout(() => t.remove(), 600); }, 3000);
  }

  updateProgressBar() {
    const s = this.missions.filter(m => m.completed).length;
    const n = this.missions.length;
    const p = (s / n) * 100;
    const f = document.getElementById('missions-progress-fill');
    const l = document.getElementById('missions-progress-label');
    if (f) f.style.width = p + '%';
    if (l) l.textContent = s + ' / ' + n + ' Completed (' + p.toFixed(0) + '%)';
  }
}

// loadCircuit patch
document.addEventListener('DOMContentLoaded', () => {
  if (window.circuitUI && !window.circuitUI.loadCircuit) {
    window.circuitUI.loadCircuit = function(grid) {
      this.grid = grid.map(row => [...row]);
      if (this.renderGrid) this.renderGrid();
      if (this.updateSimulation) this.updateSimulation();
    };
  }
});

window.ALGORITHM_CATALOG = ALGORITHM_CATALOG;
window.AlgorithmLibrary = AlgorithmLibrary;
window.MissionManager = MissionManager;
