/**
 * Ananta Quantum Knowledge Database
 * Comprehensive research-grade corpus of 80+ quantum computing topics,
 * algorithms, hardware physics, error-correction codes, and foundational mathematics.
 * Sources: Nielsen & Chuang, Preskill Lecture Notes, Dirac, Sakurai, arXiv landmark papers.
 */

const QUANTUM_TOPIC_DATABASE = [
  // ==========================================
  // 1. FOUNDATIONS & MATHEMATICAL FORMALISMS
  // ==========================================
  {
    keys: ['alpha', 'beta', 'probability amplitude', 'state amplitude', 'state coefficients', 'alpha and beta', 'statevector amplitudes'],
    title: 'Alpha & Beta: Quantum State Probability Amplitudes',
    category: 'Foundations',
    arxiv: null,
    definition: 'In a single-qubit quantum state |ψ⟩ = α|0⟩ + β|1⟩, α and β are complex probability amplitudes (α, β ∈ ℂ). By the Born rule, the probability of measuring basis state |0⟩ is |α|² and |1⟩ is |β|², satisfying the normalization constraint |α|² + |β|² = 1.',
    math: '|ψ⟩ = α|0⟩ + β|1⟩,   where α, β ∈ ℂ\nNormalization: |α|² + |β|² = 1\nP(|0⟩) = |α|² = α* · α\nP(|1⟩) = |β|² = β* · β\n\nBloch Sphere parametrization:\nα = cos(θ/2)\nβ = e^(iφ) · sin(θ/2)\nRelative phase φ determines quantum interference.',
    intuition: 'Unlike classical probabilities which are positive real numbers summing to 1, quantum amplitudes α and β are complex vectors with magnitude and direction (phase angle). This enables destructive interference (cancellation) or constructive interference (amplification) between computational paths, the foundation of all quantum speedups.',
    applications: ['Statevector calculation in quantum simulators', 'Unitary transformation |ψ′⟩ = U|ψ⟩', 'Measurement projection via the Born rule in physical QPUs', 'Phase estimation and amplitude amplification in Grover search'],
    preset: 'superposition',
    furtherReading: 'Nielsen & Chuang Ch. 1.2; Dirac "The Principles of Quantum Mechanics" Ch. 1'
  },
  {
    keys: ['superposition', 'superpose', 'quantum superposition', 'linear combination of states'],
    title: 'Quantum Superposition',
    category: 'Foundations',
    arxiv: null,
    definition: 'A principle derived from the linearity of the Hilbert space: if |0⟩ and |1⟩ are valid quantum states, any linear combination |ψ⟩ = α|0⟩ + β|1⟩ is also a valid physical state, with continuous amplitude degrees of freedom until projective measurement.',
    math: '|+⟩ = H|0⟩ = (|0⟩ + |1⟩)/√2     P(0) = P(1) = 0.50\n|-⟩ = H|1⟩ = (|0⟩ - |1⟩)/√2     ⟨Z⟩ = 0, ⟨X⟩ = +1\n|±i⟩ = (|0⟩ ± i|1⟩)/√2          ⟨Y⟩ = ±1\nGeneral n-qubit equal superposition: |ψ⟩ = (1/√2ⁿ) ∑_{x=0}^{2ⁿ-1} |x⟩',
    intuition: 'Superposition is not classical ignorance or a coin that is secretly heads or tails. It is a wave state where both possibilities coexist with definite relative phase, capable of interfering before any observation collapses it.',
    applications: ['Quantum parallelism in Deutsch-Jozsa, Simon, and Grover algorithms', 'Variational ansatz initialization in VQE and QAOA', 'Input state preparation for Quantum Fourier Transform (QFT)', 'Quantum sensing and Ramsey interferometry'],
    preset: 'superposition',
    furtherReading: 'Nielsen & Chuang Ch. 1.2; Sakurai "Modern Quantum Mechanics" Ch. 1'
  },
  {
    keys: ['entanglement', 'entangled', 'bell state', 'bell pair', 'epr', 'quantum entanglement', 'einstein podolsky rosen'],
    title: 'Quantum Entanglement & Bell States',
    category: 'Foundations',
    arxiv: 'arXiv:quant-ph/0101012',
    definition: 'A composite quantum state |ψ⟩_AB ∈ H_A ⊗ H_B is entangled if it cannot be factored as a product state |φ⟩_A ⊗ |χ⟩_B. The four orthonormal Bell states form a complete maximally entangled basis for a two-qubit Hilbert space.',
    math: '|Φ⁺⟩ = (|00⟩ + |11⟩)/√2    [Prepared via H(q0) followed by CNOT(q0→q1)]\n|Φ⁻⟩ = (|00⟩ - |11⟩)/√2\n|Ψ⁺⟩ = (|01⟩ + |10⟩)/√2\n|Ψ⁻⟩ = (|01⟩ - |10⟩)/√2    [Singlet state, invariant under all U⊗U]\n\nVon Neumann Entanglement Entropy: S(ρ_A) = -Tr(ρ_A log₂ ρ_A) = 1 ebit',
    intuition: 'Two entangled qubits behave as a single non-separable physical entity regardless of spatial separation. Measuring one qubit instantaneously collapses the joint wavefunction, correlating outcomes with certainty without transmitting superluminal classical data.',
    applications: ['Quantum teleportation and superdense coding protocols', 'Device-independent Quantum Key Distribution (E91)', 'Entanglement-assisted quantum error correction', 'Quantum metrology beating the Standard Quantum Limit (Heisenberg limit)'],
    preset: 'bell',
    furtherReading: 'Einstein, Podolsky, Rosen (1935) Phys. Rev. 47; Bennett et al. (1993) Phys. Rev. Lett. 70'
  },
  {
    keys: ['density matrix', 'density operator', 'mixed state', 'pure state', 'rho', 'partial trace'],
    title: 'Density Matrix Formalism & Partial Trace',
    category: 'Foundations',
    arxiv: null,
    definition: 'The density operator ρ characterizes pure states (ρ = |ψ⟩⟨ψ|) and statistical mixtures (ρ = ∑ p_i |ψ_i⟩⟨ψ_i|). It satisfies Hermiticity (ρ = ρ†), unit trace (Tr(ρ) = 1), and positive semidefiniteness (ρ ≥ 0). Subsystems are obtained by partial tracing: ρ_A = Tr_B(ρ_AB).',
    math: 'Pure state criterion: Tr(ρ²) = 1\nMixed state criterion: Tr(ρ²) < 1 (Purity γ = Tr(ρ²))\nExpectation value: ⟨O⟩ = Tr(ρ O)\nBloch representation: ρ = ½ (I + r_x X + r_y Y + r_z Z) with |r| ≤ 1\nVon Neumann Entropy: S(ρ) = -Tr(ρ log₂ ρ)',
    intuition: 'Statevectors |ψ⟩ can only describe systems about which we have complete quantum information. If a qubit is entangled with another or decohered by the environment, its local state is a mixed state described solely by a density matrix whose off-diagonal coherence terms have decayed.',
    applications: ['Modeling decoherence and open quantum system dynamics via Lindblad master equations', 'Quantifying entanglement via reduced density matrix purity', 'Quantum state tomography across superconducting quantum processors', 'Quantum channel capacity calculations'],
    preset: null,
    furtherReading: 'Nielsen & Chuang Ch. 2.4; Preskill Lecture Notes Ch. 2'
  },
  {
    keys: ['born rule', 'quantum measurement', 'projective measurement', 'wavefunction collapse', 'povm'],
    title: 'Quantum Measurement, Born Rule & POVMs',
    category: 'Foundations',
    arxiv: null,
    definition: 'Formulated by Max Born in 1926: projective measurement of state |ψ⟩ using observable M = ∑ m P_m yields outcome m with probability P(m) = ⟨ψ|P_m|ψ⟩ = Tr(P_m ρ), leaving post-measurement state |ψ′⟩ = P_m|ψ⟩ / √P(m). Generalized measurements use Positive Operator-Valued Measures (POVMs) satisfying ∑ E_m = I.',
    math: 'Projective probability: P(m) = ⟨ψ|P_m|ψ⟩, where P_m = |m⟩⟨m|, P_m² = P_m\nPost-measurement state: ρ′ = (P_m ρ P_m) / Tr(P_m ρ)\nPOVM probability: P(m) = Tr(E_m ρ),   E_m = M_m† M_m ≥ 0,   ∑ E_m = I',
    intuition: 'Measurement is fundamentally non-unitary and irreversible in the standard Copenhagen interpretation. It forces a superposition of potential outcomes into one realized eigenvalue, destroying relative phase information.',
    applications: ['Readout resonators in superconducting circuit QED', 'Quantum State Discrimination using unambiguous POVMs', 'Quantum Random Number Generation (QRNG)', 'Syndrome extraction in fault-tolerant stabilizer codes'],
    preset: null,
    furtherReading: 'Born (1926) Z. Phys. 37; Nielsen & Chuang Ch. 2.2; Sakurai Ch. 1'
  },
  {
    keys: ['no cloning', 'no cloning theorem', 'quantum cloning', 'cannot copy qubit'],
    title: 'No-Cloning & No-Deleting Theorems',
    category: 'Foundations',
    arxiv: null,
    definition: 'Proved by Wootters, Zurek, and Dieks (1982): there exists no unitary transformation U capable of cloning an arbitrary unknown quantum state: U(|ψ⟩|0⟩) ≠ |ψ⟩|ψ⟩ for all |ψ⟩. Linearity of quantum mechanics strictly forbids perfect copying.',
    math: 'Proof: Assume U|ψ⟩|0⟩ = |ψ⟩|ψ⟩ and U|φ⟩|0⟩ = |φ⟩|φ⟩.\nInner product: ⟨ψ|φ⟩ = ⟨ψ|⟨0| U† U |φ⟩|0⟩ = (⟨ψ|φ⟩)²\n⇒ ⟨ψ|φ⟩ = 0 or ⟨ψ|φ⟩ = 1.\nThus, cloning is possible only for orthogonal states, never for arbitrary unknown states.',
    intuition: 'Classical information (bits) can be duplicated endlessly without inspection. Quantum states carry phase relationships that would be destroyed by measurement; attempting to clone them unitarily violates the fundamental linearity of quantum theory.',
    applications: ['Foundational security of Quantum Key Distribution (BB84, E91)', 'Prevents eavesdroppers from intercepting and duplicating quantum signals', 'Necessitates entanglement-based teleportation to transfer states', 'Rules out classical replication for quantum error correction, requiring stabilizer codes'],
    preset: null,
    furtherReading: 'Wootters & Zurek (1982) Nature 299; Dieks (1982) Phys. Lett. A 92'
  },
  {
    keys: ['bloch sphere', 'bloch vector', 'state on bloch sphere', 'pauli vector'],
    title: 'Bloch Sphere Geometry & State Space',
    category: 'Foundations',
    arxiv: null,
    definition: 'A geometrical representation of the pure state space of a 2-level quantum system (qubit) as the surface of a unit sphere S² in ℝ³. The interior of the sphere represents mixed states with radius r < 1.',
    math: '|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩,   θ ∈ [0, π], φ ∈ [0, 2π)\nBloch vector components:\nr_x = ⟨X⟩ = sin(θ) cos(φ)\nr_y = ⟨Y⟩ = sin(θ) sin(φ)\nr_z = ⟨Z⟩ = cos(θ)\n\nSingle-qubit unitary rotation: R_n̂(α) = exp(-i α n̂·σ / 2) = cos(α/2)I - i sin(α/2)(n̂·σ)',
    intuition: 'Every pure qubit state is a point on the spherical shell: North pole is |0⟩, South pole is |1⟩, Equator holds equal superpositions (|+⟩, |+i⟩, |-⟩, |-i⟩). Single-qubit quantum gates are rigorous 3D spatial rotations of this sphere.',
    applications: ['Microwave Rabi pulse calibration in superconducting qubits', 'Visualization of single-qubit trajectories during gate operations', 'Dynamical decoupling sequence design (Carr-Purcell-Meiboom-Gill)', 'Geometric quantum computation using Berry phases'],
    preset: 'superposition',
    furtherReading: 'Nielsen & Chuang Ch. 1.2; Bloch (1946) Phys. Rev. 70'
  },
  {
    keys: ['schmidt decomposition', 'schmidt rank', 'schmidt number', 'singular value decomposition quantum'],
    title: 'Schmidt Decomposition & Bipartite Entanglement',
    category: 'Foundations',
    arxiv: null,
    definition: 'Any pure state |ψ⟩_AB of a bipartite quantum system can be written as |ψ⟩_AB = ∑_{i=1}^k λ_i |u_i⟩_A |v_i⟩_B, where λ_i > 0 are real Schmidt coefficients satisfying ∑ λ_i² = 1, and {|u_i⟩}, {|v_i⟩} are orthonormal sets.',
    math: '|ψ⟩_AB = ∑_{i=1}^k λ_i |u_i⟩_A |v_i⟩_B,   λ_i ≥ 0,   ∑ λ_i² = 1\nSchmidt rank k = number of non-zero coefficients λ_i\nState is entangled ⟺ Schmidt rank k > 1\nReduced density matrices share identical non-zero eigenvalues {λ_i²}:\nρ_A = ∑ λ_i² |u_i⟩⟨u_i|,    ρ_B = ∑ λ_i² |v_i⟩⟨v_i|',
    intuition: 'Schmidt decomposition proves that no matter how complex the bipartite state looks, there exist specific local measurement bases for Alice and Bob in which the state is purely diagonal with paired correlations.',
    applications: ['Characterizing entanglement depth in matrix product states (MPS)', 'DMRG (Density Matrix Renormalization Group) simulations', 'Quantifying bipartite entanglement in quantum cryptography', 'Entanglement distillation protocols'],
    preset: 'bell',
    furtherReading: 'Nielsen & Chuang Ch. 2.5; Preskill Notes Ch. 2'
  },
  {
    keys: ['decoherence', 't1 relaxation', 't2 dephasing', 't2 star', 'environmental noise', 'lindblad'],
    title: 'Decoherence, T₁ Relaxation & T₂ Dephasing',
    category: 'Hardware Physics',
    arxiv: null,
    definition: 'Decoherence describes the irreversible loss of quantum coherence resulting from coupling with an environmental bath. T₁ (longitudinal relaxation) measures energy decay |1⟩ → |0⟩. T₂ (transverse dephasing) measures the loss of quantum phase coherence, bounded by T₂ ≤ 2T₁.',
    math: 'T₁ Amplitude Damping: ρ₁₁(t) = ρ₁₁(0) e^(-t/T₁)\nT₂ Pure Dephasing: ρ₀₁(t) = ρ₀₁(0) e^(-t/T₂) where 1/T₂ = 1/(2T₁) + 1/T_φ\n\nLindblad Master Equation:\ndρ/dt = -i[H, ρ] + ∑_k ( L_k ρ L_k† - ½ {L_k† L_k, ρ} )\nWhere L_k are jump operators representing noise channels.',
    intuition: 'Think of T₁ as a spinning top falling down due to friction (energy loss). Think of T₂ as the direction of the spin becoming completely randomized (phase loss). In modern transmon processors, T₁ and T₂ typically range from 50 μs to 300 μs.',
    applications: ['Benchmark metric for quantum hardware quality (IBM Heron, Google Sycamore)', 'Determines maximum usable circuit depth before state decays into noise', 'Optimizing gate speeds to finish computation well within coherence window', 'Dynamical decoupling and zero-noise extrapolation (ZNE) error mitigation'],
    preset: null,
    furtherReading: 'Zurek (2003) Rev. Mod. Phys. 75; Preskill Lecture Notes Ch. 3'
  },
  {
    keys: ['bell inequality', 'chsh', 'chsh inequality', 'local realism', 'hidden variables', 'aspect experiment'],
    title: "Bell's Theorem & CHSH Inequality",
    category: 'Foundations',
    arxiv: null,
    definition: "Bell's theorem demonstrates that no physical theory of local hidden variables can reproduce all predictions of quantum mechanics. The Clauser-Horne-Shimony-Holt (CHSH) inequality bounds classical correlations by |S| ≤ 2, whereas quantum entanglement achieves Tsirelson's bound |S| = 2√2 ≈ 2.828.",
    math: 'CHSH Operator: C = A⊗B + A⊗B′ + A′⊗B - A′⊗B′\nClassical bound: |⟨C⟩| ≤ 2\nQuantum Tsirelson bound: |⟨C⟩| ≤ 2√2 ≈ 2.8284\nOptimal measurement angles for Bell state |Φ⁺⟩:\nA = Z, A′ = X, B = (Z + X)/√2, B′ = (Z - X)/√2\n⟨C⟩ = cos(π/4) + cos(π/4) + cos(π/4) - (-cos(π/4)) = 4/√2 = 2√2',
    intuition: 'Bell proved that nature is either non-local or counterfactually indefinite. Einstein\'s view that quantum particles contain hidden instructions predetermined before measurement was empirically disproven by Alain Aspect and Anton Zeilinger (Nobel Prize 2022).',
    applications: ['Device-independent quantum key distribution (DI-QKD)', 'Self-testing of quantum random number generators', 'Fundamental experimental verification of quantum processors', 'Testing quantum gravity and spacetime non-locality'],
    preset: 'bell',
    furtherReading: 'Bell (1964) Physics 1; Clauser et al. (1969) Phys. Rev. Lett. 23; Nobel Prize 2022 Citation'
  },

  // ==========================================
  // 2. QUANTUM GATES & CIRCUIT ARCHITECTURE
  // ==========================================
  {
    keys: ['pauli gates', 'pauli x', 'pauli y', 'pauli z', 'pauli matrices', 'sigma x y z'],
    title: 'Pauli Operators {X, Y, Z} & Clifford Algebra',
    category: 'Gate Library',
    arxiv: null,
    definition: 'The Pauli matrices {I, X, Y, Z} form an orthogonal basis for the vector space of 2×2 complex Hermitian matrices. They are unitary, Hermitian (X = X†), involutory (X² = I), and obey angular momentum commutation relations [σ_i, σ_j] = 2i ε_ijk σ_k.',
    math: 'X = [[0, 1], [1, 0]]     (Bit flip: X|0⟩ = |1⟩, X|1⟩ = |0⟩)\nY = [[0, -i], [i, 0]]    (Bit+Phase flip: Y|0⟩ = i|1⟩, Y|1⟩ = -i|0⟩)\nZ = [[1, 0], [0, -1]]    (Phase flip: Z|0⟩ = |0⟩, Z|1⟩ = -|1⟩)\n\nAnticommutation: {σ_i, σ_j} = 2 δ_ij I\nAlgebra: XY = iZ, YZ = iX, ZX = iY\nPauli group P_n: tensor products of n Pauli matrices with phases {±1, ±i}',
    intuition: 'Pauli gates are the cardinal rotations of quantum information: X rotates 180° around the X-axis (NOT gate), Z rotates 180° around the Z-axis (sign flip), and Y rotates 180° around the Y-axis. Any arbitrary single-qubit error decomposes into a linear combination of X, Y, and Z errors.',
    applications: ['Core error basis in quantum error correction (bit flip X, phase flip Z)', 'Hamiltonian encoding of molecular electrons via Jordan-Wigner transform', 'Expectation value measurement in VQE (measuring Pauli strings)', 'Dynamical decoupling sequences in hardware pulse control'],
    preset: null,
    furtherReading: 'Sakurai Ch. 1; Nielsen & Chuang Ch. 1.3'
  },
  {
    keys: ['hadamard', 'h gate', 'hadamard gate', 'hadamard transform'],
    title: 'Hadamard Gate (H) & Fourier Basis',
    category: 'Gate Library',
    arxiv: null,
    definition: 'The Hadamard gate is a single-qubit unitary that maps computational basis states {|0⟩, |1⟩} into the conjugate transversal basis {|+⟩, |-⟩}. Geometrically, it corresponds to a 180° rotation around the diagonal (X + Z)/√2 axis on the Bloch sphere.',
    math: 'H = (1/√2) [[1, 1], [1, -1]]\nH|0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2\nH|1⟩ = |-⟩ = (|0⟩ - |1⟩)/√2\nH² = I   (Self-inverse unitary)\nH X H = Z,    H Z H = X   (Conjugates X and Z)',
    intuition: 'Hadamard is the gateway into the quantum realm. It converts deterministic classical certainty (|0⟩) into maximum quantum uncertainty (50/50 superposition). When applied twice, constructive and destructive interference precisely restores the original state.',
    applications: ['Creating initial superposition in almost every quantum algorithm', 'Switching between X-basis and Z-basis syndrome measurements in QEC', 'Building block of the Quantum Fourier Transform', 'Used in phase kickback oracles'],
    preset: 'superposition',
    furtherReading: 'Nielsen & Chuang Ch. 1.3'
  },
  {
    keys: ['phase gate', 's gate', 't gate', 'pi over 8 gate', 'non-clifford', 't-gate'],
    title: 'Phase Gates (S, T) & Non-Clifford Resource',
    category: 'Gate Library',
    arxiv: null,
    definition: 'The Phase gate S = diag(1, i) performs a 90° rotation around the Z-axis. The T gate (π/8 gate) T = diag(1, e^(iπ/4)) performs a 45° rotation. The Clifford group (H, S, CNOT) can be simulated efficiently classically; adding the non-Clifford T gate yields universal quantum computation.',
    math: 'S = [[1, 0], [0, i]] = Z^(1/2),    S² = Z\nT = [[1, 0], [0, e^(iπ/4)]] = Z^(1/4),    T² = S,    T⁴ = Z,    T⁸ = I\n\nGottesman-Knill Theorem:\nCircuits containing ONLY Clifford gates {H, S, CNOT} can be simulated in polynomial time on a classical computer. Universal quantum advantage strictly requires non-Clifford resources (T gate or magic states).',
    intuition: 'Clifford gates only rotate states to 6 discrete poles/equators of the Bloch sphere. The T gate breaks this symmetry, allowing fine-grained rotations that fill the sphere densely. However, in fault-tolerant quantum computing, T gates cannot be done transversally and require expensive magic state distillation.',
    applications: ['Universal quantum circuit synthesis via Solovay-Kitaev algorithm', 'Magic state distillation in fault-tolerant surface codes', 'Fine rotation synthesis in Quantum Chemistry Trotter circuits', 'Quantum hardness benchmarks against classical tensor network simulators'],
    preset: null,
    furtherReading: 'Gottesman-Knill Theorem; Bravyi & Kitaev (2005) Phys. Rev. A 71; Nielsen & Chuang Ch. 4.5'
  },
  {
    keys: ['cnot', 'cx', 'controlled not', 'cnot gate', 'two qubit gate', 'controlled x'],
    title: 'Controlled-NOT (CNOT / CX) & Entangling Unitaries',
    category: 'Gate Library',
    arxiv: null,
    definition: 'A 2-qubit entangling gate that flips the target qubit if and only if the control qubit is in state |1⟩. In the computational basis {|00⟩, |01⟩, |10⟩, |11⟩}, it is represented by a 4×4 permutation matrix. Together with single-qubit rotations, CNOT forms a universal gate set.',
    math: 'CNOT = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]]\nAction on basis states: CNOT|c, t⟩ = |c, t ⊕ c⟩\nAction in X basis: CNOT reversed!\n(H ⊗ H) CNOT (H ⊗ H) = CNOT_{target→control}\n\nEntangling power: Creates Bell state from |+0⟩: CNOT(|+⟩|0⟩) = (|00⟩ + |11⟩)/√2',
    intuition: 'CNOT is the quantum equivalent of an XOR gate, but because it operates on superpositions, it can entangle two previously independent qubits. If the target is in the |−⟩ state, the CNOT kicks a minus sign back to the control qubit (phase kickback).',
    applications: ['Core entangler in all quantum algorithms and Bell state generation', 'Syndrome extraction in surface codes and Shor error correction', 'Parity measurement in quantum chemistry operators', 'Implemented in transmon hardware via Cross-Resonance (CR) interaction'],
    preset: 'bell',
    furtherReading: 'Barenco et al. (1995) Phys. Rev. A 52; Nielsen & Chuang Ch. 1.3'
  },
  {
    keys: ['toffoli', 'ccx', 'controlled controlled not', 'fredkin', 'cswap', 'reversible computing'],
    title: 'Toffoli (CCX) & Fredkin (CSWAP) Reversible Gates',
    category: 'Gate Library',
    arxiv: null,
    definition: 'The Toffoli gate (CCNOT / CCX) flips a target qubit if and only if both control qubits are 1: |c₁, c₂, t⟩ → |c₁, c₂, t ⊕ (c₁ · c₂)⟩. It is universal for classical reversible computation. The Fredkin gate (CSWAP) swaps two target qubits conditioned on a control qubit.',
    math: 'Toffoli: |c₁, c₂, t⟩ ↦ |c₁, c₂, t ⊕ (c₁ ∧ c₂)⟩\nDecomposition into 2-qubit gates:\nRequires at least 6 CNOT gates and several T gates (minimum T-count = 7 without ancilla).\n\nFredkin: |c, t₁, t₂⟩ ↦ |c, t₂, t₁⟩ if c=1, else unchanged\nConserves Hamming weight (number of 1s).',
    intuition: 'Classical NAND is irreversible because information is lost (erasing energy via Landauer\'s principle). Toffoli preserves reversibility while computing AND/NAND logic. In quantum circuits, Toffoli serves as the reversible arithmetic engine for modular exponentiation in Shor\'s algorithm.',
    applications: ['Arithmetic circuits in Shor\'s algorithm (modular addition, multiplication)', 'Quantum oracle construction for boolean satisfiability (SAT)', 'Reversible classical logic embedding in quantum registers', 'Error detection in classical-quantum fault tolerance schemes'],
    preset: null,
    furtherReading: 'Toffoli (1980) Tech. Report MIT; Fredkin & Toffoli (1982) Int. J. Theor. Phys. 21'
  },
  {
    keys: ['universal gate set', 'solovay kitaev', 'clifford plus t', 'universal quantum computing'],
    title: 'Universal Quantum Gate Sets & Solovay-Kitaev Theorem',
    category: 'Gate Library',
    arxiv: null,
    definition: 'A set of quantum gates is universal if any unitary operation U ∈ U(2ⁿ) can be approximated to arbitrary accuracy ε using a finite sequence of gates from the set. The Solovay-Kitaev theorem guarantees that any single-qubit gate can be approximated to error ε using O(logᶜ(1/ε)) gates from {H, S, T}.',
    math: 'Distance metric: Operator norm distance ||U - U_approx|| ≤ ε\nSolovay-Kitaev gate count: N = O(log^c(1/ε)),   where c ≈ 3.97 (improved to ~1.44 by modern algorithms)\nCanonical universal sets:\n1. Clifford + T: {H, S, CNOT, T}\n2. Barenco set: {All single-qubit unitaries U(2), CNOT}\n3. Discrete universal: {H, CNOT, T}',
    intuition: 'Just as NAND gates build any classical microprocessor, a tiny set of discrete quantum gates ({H, CNOT, T}) is mathematically sufficient to synthesize any multi-qubit transformation across exponential Hilbert space with polylogarithmic overhead.',
    applications: ['Quantum circuit compilers (Cirq, Qiskit, TKET)', 'Fault-tolerant resource estimation for Shor and VQE', 'Optimal synthesis of arbitrary SU(2) rotations in cryo-hardware', 'Minimizing circuit depth to avoid decoherence'],
    preset: null,
    furtherReading: 'Kitaev (1997) Russ. Math. Surv. 52; Dawson & Nielsen (2006) arXiv:quant-ph/0505030'
  },
  {
    keys: ['phase kickback', 'kickback', 'eigenphase kickback', 'phase kick'],
    title: 'Phase Kickback Mechanism',
    category: 'Quantum Phenomena',
    arxiv: null,
    definition: 'A fundamental quantum phenomenon where applying a controlled-unitary gate CU to an eigenstate |ψ⟩ of U with eigenvalue e^(iθ) transfers the phase shift θ directly onto the state of the control qubit, leaving the target register unchanged.',
    math: 'Let U|u⟩ = e^(iθ)|u⟩ (eigenstate relation).\nPrepare control in |+⟩ = (|0⟩ + |1⟩)/√2 and target in |u⟩:\n|Ψ₀⟩ = |+⟩ ⊗ |u⟩ = (1/√2) (|0⟩|u⟩ + |1⟩|u⟩)\nApply Controlled-U:\nCU |Ψ₀⟩ = (1/√2) (|0⟩|u⟩ + |1⟩ U|u⟩) = (1/√2) (|0⟩ + e^(iθ)|1⟩) ⊗ |u⟩\n\nThe phase e^(iθ) has been kicked back to the control qubit!',
    intuition: 'Even though the control qubit is ostensibly dictating what happens to the target, the target pushes back! By setting the target to an eigenstate, the interaction encodes information about the operator into the control qubit, which can then be read out using interference.',
    applications: ['Core mechanism of Quantum Phase Estimation (QPE)', 'Grover oracle marking target states: |x⟩|−⟩ → (-1)^f(x) |x⟩|−⟩', 'Deutsch-Jozsa and Bernstein-Vazirani single-query solutions', 'Shor\'s algorithm period-finding subroutine'],
    preset: null,
    furtherReading: 'Cleve, Ekert, Macchiavello, Mosca (1998) Proc. R. Soc. Lond. A 454; Nielsen & Chuang Ch. 5.1'
  },

  // ==========================================
  // 3. QUANTUM ALGORITHMS & COMPLEXITY
  // ==========================================
  {
    keys: ['deutsch jozsa', 'deutsch-jozsa', 'deutsch algorithm', 'constant vs balanced'],
    title: 'Deutsch-Jozsa Algorithm',
    category: 'Algorithms',
    arxiv: null,
    definition: 'Given a black-box oracle f: {0,1}ⁿ → {0,1} promised to be either constant (same output for all inputs) or balanced (returns 0 for half and 1 for half), the Deutsch-Jozsa algorithm determines which it is in exactly ONE quantum evaluation, whereas classical algorithms require up to 2ⁿ⁻¹ + 1 queries.',
    math: 'Initial state: |ψ₀⟩ = |0⟩⊗ⁿ |1⟩\nApply H⊗(n+1): |ψ₁⟩ = (1/√2ⁿ) ∑_{x} |x⟩ ⊗ |−⟩\nApply Oracle U_f: |ψ₂⟩ = (1/√2ⁿ) ∑_{x} (-1)^f(x) |x⟩ ⊗ |−⟩\nApply H⊗ⁿ on first register:\n|ψ₃⟩ = (1/2ⁿ) ∑_{x} ∑_{y} (-1)^(x·y + f(x)) |y⟩ ⊗ |−⟩\n\nAmplitude of |0⟩⊗ⁿ state is: C₀ = (1/2ⁿ) ∑_{x} (-1)^f(x)\n- If f is constant: |C₀| = 1  (Measures all zeros with 100% certainty)\n- If f is balanced: C₀ = 0  (Can never measure all zeros)',
    intuition: 'A classical computer must test multiple inputs one by one to see if the outputs change. The quantum computer evaluates all inputs simultaneously in superposition and uses constructive/destructive interference to test a global property (constant vs balanced) in a single query.',
    applications: ['Historical breakthrough: first exact exponential quantum query separation', 'Demonstrates phase kickback and global interference', 'Pedagogical foundation for quantum algorithm design at IIT/IISc', 'Theoretical basis for oracle separation between P and EQP'],
    preset: null,
    furtherReading: 'Deutsch & Jozsa (1992) Proc. R. Soc. Lond. A 439; Nielsen & Chuang Ch. 1.4'
  },
  {
    keys: ['bernstein vazirani', 'bernstein-vazirani', 'hidden bitstring', 'inner product oracle'],
    title: 'Bernstein-Vazirani Algorithm',
    category: 'Algorithms',
    arxiv: null,
    definition: 'Given an oracle f(x) = s · x (mod 2) for an unknown hidden bitstring s ∈ {0,1}ⁿ, the Bernstein-Vazirani algorithm discovers the entire n-bit string s in exactly ONE query, compared to n queries classically.',
    math: 'Oracle: U_f |x⟩|y⟩ = |x⟩|y ⊕ (s · x)⟩\nWith target initialized to |−⟩ = (|0⟩ - |1⟩)/√2:\nU_f (|x⟩|−⟩) = (-1)^(s · x) |x⟩|−⟩\n\nCircuit:\n1. Initialize: |0⟩⊗ⁿ |1⟩\n2. Hadamard layer: H⊗ⁿ |0⟩⊗ⁿ ⊗ H|1⟩ = (1/√2ⁿ) ∑_x |x⟩ |−⟩\n3. Oracle evaluation: (1/√2ⁿ) ∑_x (-1)^(s · x) |x⟩ |−⟩\n4. Hadamard layer on input register: H⊗ⁿ [ (1/√2ⁿ) ∑_x (-1)^(s · x) |x⟩ ] = |s⟩\n5. Measure: Yields s with probability 1.0!',
    intuition: 'Classically, you must query 1000...00, 0100...00, 0010...00 one bit at a time to read each bit of s. The quantum circuit sets up interference such that the phase shifts introduced by the dot product interfere constructively precisely on the state |s⟩.',
    applications: ['Exact O(n) to O(1) query complexity speedup demonstration', 'Subroutine in quantum cryptanalysis and secret-sharing verification', 'Benchmark circuit for testing gate fidelity and cross-talk across n qubits', 'Taught as foundational query complexity in IIT computer science programs'],
    preset: null,
    furtherReading: 'Bernstein & Vazirani (1997) SIAM J. Comput. 26; Nielsen & Chuang Ch. 1.4'
  },
  {
    keys: ['simon', "simon's algorithm", 'hidden subgroup', 'period finding xor'],
    title: "Simon's Algorithm & Exponential Query Separation",
    category: 'Algorithms',
    arxiv: null,
    definition: "Given an oracle f: {0,1}ⁿ → {0,1}ⁿ promised to satisfy f(x) = f(y) ⟺ x ⊕ y ∈ {0ⁿ, s} for a hidden period s, Simon's algorithm finds s using O(n) quantum queries, whereas any classical algorithm requires Ω(2^(n/2)) queries. It directly inspired Shor's algorithm.",
    math: 'Circuit execution produces random y ∈ {0,1}ⁿ such that y · s = 0 (mod 2).\nAfter O(n) independent runs, we obtain n-1 linearly independent equations:\n[ y₁ · s = 0 ]\n[ y₂ · s = 0 ]\n[ ...        ]\n[ yₙ₋₁ · s = 0 ]\n\nClassical Gaussian elimination over GF(2) uniquely solves for s in O(n³) classical steps.\nTotal complexity: O(n) quantum queries vs Ω(2^(n/2)) classical queries.',
    intuition: 'Simon\'s algorithm is the first proof of an exponential quantum speedup for a problem with a promise. By measuring the post-oracle superposition in the Hadamard basis, the quantum computer samples orthogonal vectors to the hidden period s.',
    applications: ['Historical precursor that directly led Peter Shor to discover his factoring algorithm', 'Breaking symmetric cryptosystems (e.g., Even-Mansour block cipher in quantum chosen-plaintext settings)', 'Proving the oracle separation BQP ⊄ BPP', 'Post-quantum security analysis of authenticated encryption schemes'],
    preset: null,
    furtherReading: 'Simon (1997) SIAM J. Comput. 26; Nielsen & Chuang Ch. 5.4'
  },
  {
    keys: ['quantum fourier transform', 'qft', 'fourier transform quantum', 'inverse qft'],
    title: 'Quantum Fourier Transform (QFT)',
    category: 'Algorithms',
    arxiv: 'arXiv:quant-ph/9508023',
    definition: 'The quantum analogue of the discrete Fourier transform (DFT). It transforms computational basis states |j⟩ into equal superpositions with phase coefficients e^(2πi j k / 2ⁿ). For N = 2ⁿ states, classical FFT requires O(n 2ⁿ) operations, while QFT executes in only O(n²) quantum gates.',
    math: 'QFT |j⟩ = (1/√2ⁿ) ∑_{k=0}^{2ⁿ-1} e^(2πi j k / 2ⁿ) |k⟩\n\nProduct representation (revealing factorized circuit):\n|j₁ j₂ ... jₙ⟩ ↦ (1/√2ⁿ) (|0⟩ + e^(2πi 0.jₙ)|1⟩) ⊗ (|0⟩ + e^(2πi 0.jₙ₋₁jₙ)|1⟩) ⊗ ... ⊗ (|0⟩ + e^(2πi 0.j₁j₂...jₙ)|1⟩)\n\nCircuit depth: n Hadamard gates and n(n-1)/2 controlled phase rotation gates R_k = diag(1, e^(2πi/2^k)). Total gates: O(n²).',
    intuition: 'The classical FFT maps a vector of 2ⁿ amplitudes to another vector in O(N log N) time. The QFT maps the quantum state itself into the frequency domain exponentially faster in O((log N)²) time, exposing hidden periodicity and phase.',
    applications: ['Quantum Phase Estimation (QPE) engine', 'Shor\'s integer factorization and discrete logarithm algorithms', 'Hamiltonian ground-state energy estimation in quantum chemistry', 'HHL quantum linear system solver'],
    preset: null,
    furtherReading: 'Coppersmith (1994) IBM Research Report RC19642; Nielsen & Chuang Ch. 5.1'
  },
  {
    keys: ['quantum phase estimation', 'qpe', 'phase estimation algorithm', 'eigenphase'],
    title: 'Quantum Phase Estimation (QPE)',
    category: 'Algorithms',
    arxiv: 'arXiv:quant-ph/9511026',
    definition: 'QPE estimates the unknown eigenphase θ of a unitary operator U given its eigenvector |u⟩ such that U|u⟩ = e^(2πi θ)|u⟩. Using an n-qubit ancilla register, QPE determines θ to n bits of precision with probability 1 - ε using O(n) controlled-U^(2^k) operations and one inverse QFT.',
    math: 'Eigenvalue equation: U|u⟩ = e^(2πi θ)|u⟩,   θ ∈ [0, 1)\nCircuit:\n1. Prepare |0⟩⊗ᵗ |u⟩\n2. H⊗ᵗ on counting register: (1/√2ᵗ) ∑_{k=0}^{2ᵗ-1} |k⟩ |u⟩\n3. Apply successive controlled-U^(2^j) gates via phase kickback:\n   State becomes: (1/√2ᵗ) ∑_{k=0}^{2ᵗ-1} e^(2πi θ k) |k⟩ |u⟩\n4. Apply Inverse QFT (QFT†) on counting register: Yields binary representation |θ̃⟩\n5. Measure counting register to obtain θ to t bits of precision.',
    intuition: 'QPE asks: "If I apply U repeatedly, at what frequency does the phase rotate?" By applying powers of U (1, 2, 4, 8...) conditioned on binary ancilla qubits, the phase is written into the register as a binary fraction, which QFT† unpacks into measurement probabilities.',
    applications: ['Calculates molecular ground state energies in quantum chemistry (FCI benchmark)', 'Subroutine for order-finding in Shor\'s factoring algorithm', 'Solves systems of linear equations in the HHL algorithm', 'Spectral analysis of physical quantum Hamiltonians at IISc/TIFR'],
    preset: null,
    furtherReading: 'Kitaev (1995) arXiv:quant-ph/9511026; Nielsen & Chuang Ch. 5.2'
  },
  {
    keys: ['shor', "shor's algorithm", 'factoring quantum', 'rsa quantum', 'order finding', 'discrete logarithm'],
    title: "Shor's Factoring & Discrete Logarithm Algorithm",
    category: 'Algorithms',
    arxiv: 'arXiv:quant-ph/9508027',
    definition: 'Published by Peter Shor in 1994: factors an n-bit composite integer N in polynomial time O(n³), providing an exponential speedup over the best classical algorithm (General Number Field Sieve, which takes sub-exponential time exp(O(n^(1/3) log^(2/3) n))). Breaks RSA, Diffie-Hellman, and ECC cryptography.',
    math: 'Reduction to order finding:\n1. Choose random a < N such that gcd(a, N) = 1.\n2. Quantum period finding: Find smallest r such that a^r ≡ 1 (mod N) using QPE with unitary U_a |y⟩ = |a·y mod N⟩.\n3. If r is even and a^(r/2) ≢ -1 (mod N):\n   Compute classical GCD: gcd(a^(r/2) - 1, N) and gcd(a^(r/2) + 1, N).\n   These yield non-trivial prime factors of N with probability ≥ 50%.\n\nPhysical resource estimates for RSA-2048:\nRequires ~20 million physical qubits with surface code QEC (Gidney & Ekerå 2021) or ~4000 logical qubits for ~8 hours of runtime.',
    intuition: 'Factoring numbers is classically hard, but finding the period of modular exponentiation is equivalent to finding a wave\'s frequency. Shor transforms factoring into a periodicity problem, which the Quantum Fourier Transform solves exponentially faster than classical brute-force searches.',
    applications: ['Cryptanalysis: breaches RSA, ElGamal, and Elliptic Curve Cryptography (ECC)', 'Spurred global standardization of Post-Quantum Cryptography (NIST PQC)', 'Motivates development of Quantum-Safe communications in Indian defense and banking sectors', 'Benchmark goal for full fault-tolerant quantum computers'],
    preset: null,
    furtherReading: 'Shor (1994) IEEE FOCS; Gidney & Ekerå (2021) Quantum 5, 433'
  },
  {
    keys: ['grover', "grover's algorithm", 'grover search', 'amplitude amplification', 'unstructured search'],
    title: "Grover's Search Algorithm & Amplitude Amplification",
    category: 'Algorithms',
    arxiv: 'arXiv:quant-ph/9605043',
    definition: 'Discovered by Lov Grover (1996): searches an unsorted database of N = 2ⁿ items for M marked items in O(√(N/M)) queries, achieving a provably optimal quadratic speedup over classical O(N) exhaustive search.',
    math: 'Grover Operator G = -D · O = (2|s⟩⟨s| - I) · (I - 2|w⟩⟨w|)\nWhere |s⟩ = (1/√N) ∑ |x⟩ is equal superposition and |w⟩ is the target.\n\nGeometric rotation in 2D subspace span{|w⟩, |w^⊥⟩}:\nInitial angle: sin(θ/2) = √(M/N)\nEach iteration rotates state by θ.\nOptimal iterations: R ≈ (π/4) √(N/M)\nSuccess probability: P_success = sin²((2R + 1) θ/2) ≈ 1.0',
    intuition: 'Start with all states equally likely. The oracle reflects the target state across the horizontal axis (multiplying its amplitude by -1). The diffusion operator then reflects all states across the average amplitude. This double reflection systematically pumps amplitude into the target while draining amplitude from incorrect answers.',
    applications: ['Pre-image and collision attacks against symmetric ciphers (effectively halves AES key length: AES-128 → 64-bit security)', 'Accelerating NP-complete constraint satisfaction and boolean SAT solvers', 'Quantum minimum/maximum finding and collision algorithms', 'Graph coloring and structural pattern matching in computational biology'],
    preset: 'grover',
    furtherReading: 'Grover (1996) STOC \'96; Boyer, Brassard, Høyer, Tapp (1998) Fortschr. Phys. 46'
  },
  {
    keys: ['vqe', 'variational quantum eigensolver', 'variational algorithm', 'molecular energy quantum'],
    title: 'Variational Quantum Eigensolver (VQE)',
    category: 'Quantum Machine Learning',
    arxiv: 'arXiv:1304.3061',
    definition: 'A hybrid quantum-classical NISQ algorithm proposed by Peruzzo et al. (2014) to find the ground state energy E₀ of a molecular Hamiltonian H. Based on the Rayleigh-Ritz variational principle: ⟨ψ(θ)|H|ψ(θ)⟩ ≥ E₀ for all parameters θ.',
    math: 'Variational Principle: E(θ) = ⟨ψ(θ)| H |ψ(θ)⟩ ≥ E₀\nHamiltonian decomposition into Pauli strings:\nH = ∑_i c_i P_i,   where P_i ∈ {I, X, Y, Z}⊗ⁿ\nExpected energy: E(θ) = ∑_i c_i ⟨ψ(θ)| P_i |ψ(θ)⟩\n\nParameter-Shift Rule for exact analytical gradients on hardware:\n∂E/∂θ_k = ½ [ E(θ + (π/2) e_k) - E(θ - (π/2) e_k) ]',
    intuition: 'Current quantum computers have too much noise for long algorithms like QPE. VQE delegates state preparation and Pauli measurements to a short-depth quantum circuit, while offloading parameter optimization (gradient descent) to a classical supercomputer, making it noise-resilient.',
    applications: ['Quantum chemistry: calculating ground-state dissociation curves of H₂, LiH, H₂O', 'Catalysis design: nitrogen fixation simulation for fertilizer manufacturing', 'Strongly correlated electron physics: Hubbard model ground states at IISc', 'Material science: discovering high-temperature superconductors'],
    preset: null,
    furtherReading: 'Peruzzo et al. (2014) Nat. Commun. 5; McArdle et al. (2020) Rev. Mod. Phys. 92'
  },
  {
    keys: ['qaoa', 'quantum approximate optimization', 'combinatorial optimization quantum', 'maxcut quantum'],
    title: 'Quantum Approximate Optimization Algorithm (QAOA)',
    category: 'Quantum Machine Learning',
    arxiv: 'arXiv:1411.4028',
    definition: 'Formulated by Farhi, Goldstone, and Gutmann (2014): a hybrid variational algorithm designed to solve combinatorial optimization problems (e.g., Max-Cut) by alternating between problem cost Hamiltonian H_C and non-commuting driver mixer Hamiltonian H_M for p layers.',
    math: 'State preparation for depth p:\n|γ, β⟩ = ∏_{k=1}^p [ e^(-i β_k H_M) e^(-i γ_k H_C) ] |+⟩⊗ⁿ\nCost Hamiltonian for Max-Cut: H_C = ½ ∑_{(i,j)∈E} (I - Z_i Z_j)\nMixer Hamiltonian: H_M = ∑_{i=1}^n X_i\nApproximation ratio: r = ⟨γ, β| H_C |γ, β⟩ / C_max  (lim_{p→∞} r = 1)',
    intuition: 'QAOA is a Trotterized, variational discretization of adiabatic quantum computing. By tuning the evolution times γ_k and β_k, the state navigates through quantum tunneling to find high-quality approximate solutions to NP-hard problems.',
    applications: ['Solving Max-Cut and Traveling Salesperson Problem (TSP)', 'Logistics, traffic routing, and supply chain scheduling optimization', 'Portfolio allocation in financial engineering (Tata/SBI research collaborations)', 'Telecommunications frequency assignment and channel allocation'],
    preset: null,
    furtherReading: 'Farhi, Goldstone, Gutmann (2014) arXiv:1411.4028; Bärtschi & Eidenbenz (2020) arXiv:2006.03744'
  },
  {
    keys: ['hhl', 'hhl algorithm', 'quantum linear systems', 'matrix inversion quantum'],
    title: 'HHL Algorithm (Quantum Linear Systems Solver)',
    category: 'Algorithms',
    arxiv: 'arXiv:0811.3171',
    definition: 'Formulated by Harrow, Hassidim, and Lloyd (2009): solves the quantum linear system problem A|x⟩ = |b⟩ for a sparse, well-conditioned N×N Hermitian matrix A in O(log(N) s² κ² / ε) time, achieving an exponential speedup over classical O(N s κ) solvers.',
    math: 'System: A|x⟩ = |b⟩ ⟹ |x⟩ = A⁻¹|b⟩ / ||A⁻¹|b⟩||\nSpectral decomposition of A: A = ∑_j λ_j |u_j⟩⟨u_j|\nState input: |b⟩ = ∑_j β_j |u_j⟩\nTarget output state: |x⟩ ∝ ∑_j (β_j / λ_j) |u_j⟩\n\nCore pipeline: QPE to extract eigenvalues λ_j → Controlled rotation of ancilla: |λ_j⟩|0⟩ ↦ |λ_j⟩ (C/λ_j |1⟩ + ... |0⟩) → Inverse QPE to uncompute eigenregister → Measure ancilla in |1⟩.',
    intuition: 'HHL does not output the full vector x (which would take O(N) time just to write down). Instead, it outputs a quantum state |x⟩ whose amplitudes encode the solution, allowing quantum measurement of global properties (like ⟨x|M|x⟩) exponentially faster.',
    applications: ['Quantum algorithm foundation for solving partial differential equations (PDEs)', 'Quantum regression, support vector machines, and Gaussian processes', 'Electromagnetic scattering and structural engineering simulations', 'Network flow analysis and electrical circuit simulation'],
    preset: null,
    furtherReading: 'Harrow, Hassidim, Lloyd (2009) Phys. Rev. Lett. 103; Aaronson (2015) Nature Physics 11'
  },
  {
    keys: ['quantum walk', 'quantum random walk', 'continuous time quantum walk', 'discrete quantum walk'],
    title: 'Quantum Random Walks (Discrete & Continuous)',
    category: 'Algorithms',
    arxiv: 'arXiv:quant-ph/0303081',
    definition: 'The quantum generalization of classical random walks. While a classical random walker spreads diffusively with standard deviation σ ∝ √t, a quantum walker spreads ballistically with σ ∝ t due to coherent constructive interference.',
    math: 'Continuous-time quantum walk (CTQW) on graph G=(V,E) with adjacency matrix A:\n|ψ(t)⟩ = exp(-i A t) |ψ(0)⟩\n\nDiscrete-time quantum walk (DTQW) with coin operator C and shift operator S:\nU = S · (C ⊗ I)\nVariance: Classical σ² = 2 D t,   Quantum σ² ∝ t²  (Ballistic quadratic speedup)',
    intuition: 'A classical walker flips a coin and takes a step left or right, wandering back and forth. A quantum walker\'s coin enters a superposition, walking in both directions simultaneously. Destructive interference suppresses staying near the origin, causing the wavepacket to shoot outwards at linear speed.',
    applications: ['Spatial search algorithms on graphs (quadratic speedup over classical random walks)', 'Element distinctness and graph isomorphism testing', 'Quantum simulation of coherent energy transport in photosynthesis (FMO complex)', 'Routing and community detection in complex networks'],
    preset: null,
    furtherReading: 'Aharonov et al. (1993) Phys. Rev. A 47; Kempe (2003) Contemp. Phys. 44'
  },

  // ==========================================
  // 4. QUANTUM HARDWARE & PHYSICS PLATFORMS
  // ==========================================
  {
    keys: ['superconducting qubit', 'transmon', 'josephson junction', 'cqed', 'circuit qed', 'ibm quantum hardware'],
    title: 'Superconducting Transmon Qubits & Circuit QED',
    category: 'Quantum Hardware',
    arxiv: 'arXiv:cond-mat/0703002',
    definition: 'The leading solid-state quantum computing platform (IBM, Google, Rigetti). Transmon qubits are non-linear LC resonant circuits built from superconducting thin films (niobium/aluminum) with Josephson junctions providing the non-linear inductance needed for anharmonic energy level spacing.',
    math: 'Transmon Hamiltonian: H = 4 E_C (n - n_g)² - E_J cos(φ)\nE_C = e² / (2 C_Σ)   (Charging energy)\nE_J = I_c Φ₀ / (2π)    (Josephson energy, E_J/E_C ≫ 50)\n\nTransition frequency: f₀₁ ≈ (√(8 E_J E_C) - E_C) / h ≈ 4 - 6 GHz\nAnharmonicity: α = f₁₂ - f₀₁ ≈ -E_C / h ≈ -200 to -350 MHz\nAllows isolated |0⟩ ↔ |1⟩ microwave addressing without leaking to |2⟩.',
    intuition: 'A harmonic LC circuit has equally spaced rungs: driving it with a photon excites it from 0 to 1, 1 to 2, 2 to 3 endlessly. A Josephson junction acts as a non-linear inductor, making the 0→1 transition different from the 1→2 transition, isolating a clean two-level quantum qubit.',
    applications: ['IBM Quantum Heron (156 qubits) & Google Sycamore (72 qubits)', 'Fast single-qubit microwave gates (~20 ns) and two-qubit cross-resonance gates (~200 ns)', 'Readout via dispersive coupling to coplanar waveguide (CPW) resonators', 'Platform of choice for surface code error correction demonstrations'],
    preset: null,
    furtherReading: 'Koch et al. (2007) Phys. Rev. A 76; Blais et al. (2021) Rev. Mod. Phys. 93'
  },
  {
    keys: ['trapped ion', 'trapped ions', 'ion trap', 'molmer sorensen', 'quantinuum', 'ionq'],
    title: 'Trapped Ion Qubits & Mølmer-Sørensen Gates',
    category: 'Quantum Hardware',
    arxiv: 'arXiv:quant-ph/9810040',
    definition: 'Qubits encoded in the hyperfine or optical clock states of atomic ions (e.g., ¹⁷¹Yb⁺, ⁴⁰Ca⁺, ¹³³Ba⁺) confined in ultra-high vacuum by oscillating RF electric fields (Paul traps). Entanglement is driven via laser pulses coupling ion electronic states to collective vibrational phonon modes (Mølmer-Sørensen gate).',
    math: 'Hyperfine clock transition: |0⟩ = |²S₁/₂, F=0, m_F=0⟩,  |1⟩ = |²S₁/₂, F=1, m_F=0⟩\nCoherence time T₂: > 1 hour (unaffected by magnetic fluctuations to 1st order)\n\nMølmer-Sørensen Hamiltonian:\nH_MS = ∑_{i<j} J_ij (σ_x^i ⊗ σ_x^j)\nGate Fidelity: 1-qubit > 99.99%, 2-qubit > 99.9% (highest physical fidelities worldwide)',
    intuition: 'Unlike artificial superconducting qubits fabricated on silicon chips that vary due to manufacturing defects, every single Yb-171 ion in the universe is fundamentally identical. Laser beams act as tweezers and optical gates, achieving all-to-all qubit connectivity via shared vibrational motion.',
    applications: ['Quantinuum H-Series (H2-1: 56 trapped ions with all-to-all connectivity)', 'IonQ Forte commercial trapped-ion QPUs', 'IISc & TIFR quantum optics laboratory experiments', 'Quantum simulation of long-range Ising spin chains and lattice gauge theories'],
    preset: null,
    furtherReading: 'Cirac & Zoller (1995) Phys. Rev. Lett. 74; Mølmer & Sørensen (1999) Phys. Rev. Lett. 82'
  },
  {
    keys: ['neutral atom', 'rydberg', 'rydberg atoms', 'optical tweezers', 'quera'],
    title: 'Neutral Atom Arrays & Rydberg Blockade',
    category: 'Quantum Hardware',
    arxiv: 'arXiv:1912.03848',
    definition: 'Neutral alkali/alkaline-earth atoms (⁸⁷Rb, ⁸⁸Sr) held in arbitrary 2D/3D arrays by optical tweezers. Entanglement is mediated by exciting atoms to high principal quantum number Rydberg states (n ~ 70), where strong electric dipole-dipole interactions create the "Rydberg blockade" effect.',
    math: 'Rydberg interaction potential: V(r) = C₆ / r⁶\nBlockade radius R_b: distance where V(R_b) = Ω (Rabi laser frequency)\nR_b = (C₆ / ℏΩ)^(1/6) ≈ 5 - 10 μm\n\nBlockade mechanism:\nIf atom 1 is excited to Rydberg state |r⟩, the transition energy of atom 2 is shifted by V(r) ≫ ℏΩ, preventing atom 2 from being excited. Enables fast controlled-phase gates.',
    intuition: 'Neutral atoms do not repel each other electrically, allowing hundreds of them to be packed in tight 2D optical lattices without crosstalk. When laser-pulsed into giant Rydberg atoms, they balloon 1000× in diameter, creating a strong blockade zone that entangles neighboring atoms.',
    applications: ['QuEra Aquila: 256-neutral-atom quantum processor operating via cloud', 'Harvard/MIT 2023 breakthrough: 48 logical qubits using neutral atoms', 'Quantum simulation of quantum spin liquids and non-equilibrium matter', 'Solving combinatorial Maximum Independent Set (MIS) problems natively'],
    preset: null,
    furtherReading: 'Jaksch et al. (2000) Phys. Rev. Lett. 85; Bluvstein et al. (2023) Nature 626'
  },
  {
    keys: ['photonic quantum computing', 'linear optical', 'loqc', 'klm protocol', 'squeezed light', 'xanadu'],
    title: 'Photonic Quantum Computing & Measurement-Based QC',
    category: 'Quantum Hardware',
    arxiv: 'arXiv:quant-ph/0006088',
    definition: 'Quantum information encoded in photons (polarization, path, time-bin, or continuous-variable squeezed states). Photons travel at the speed of light and do not suffer from thermal decoherence, operating at room temperature. Deterministic two-qubit gates are synthesized using measurement and quantum teleportation (KLM protocol).',
    math: 'Single-mode squeezed vacuum state:\n|ξ⟩ = S(ξ)|0⟩ = exp( ½ (ξ* a² - ξ a†²) ) |0⟩\nQuadrature variance: ΔX₁² = ½ e^(-2r) < ½  (sub-shot-noise squeezing)\n\nKLM Theorem (Knill, Laflamme, Milburn 2001):\nScalable universal quantum computing is possible using ONLY linear optical elements (beamsplitters, phase shifters), single-photon sources, and photodetectors, using teleportation gates.',
    intuition: 'Photons are the ultimate carriers of quantum information: they do not interact with air or heat, eliminating the need for bulky dilution refrigerators. However, because photons do not naturally interact with each other, entangling them requires clever measurement-induced non-linearities.',
    applications: ['Xanadu Borealis: 216-mode Gaussian Boson Sampling quantum supremacy', 'PsiQuantum silicon photonic fault-tolerant architecture', 'Quantum Key Distribution over optical fiber networks and satellite links', 'Measurement-based cluster state quantum computing'],
    preset: null,
    furtherReading: 'Knill, Laflamme, Milburn (2001) Nature 409; Kok et al. (2007) Rev. Mod. Phys. 79'
  },
  {
    keys: ['silicon spin qubit', 'quantum dot', 'spin qubit', 'semiconductor quantum computing'],
    title: 'Silicon Spin Qubits & Semiconductor Quantum Dots',
    category: 'Quantum Hardware',
    arxiv: 'arXiv:1905.02902',
    definition: 'Qubits encoded in the spin of single electrons or holes confined in electrostatically defined semiconductor quantum dots in isotopically purified Silicon (²⁸Si). Leveraging existing semiconductor CMOS foundries promises monolithic scaling to billions of qubits.',
    math: 'Zeeman splitting under external magnetic field B_z:\nH_Z = ½ g μ_B B_z σ_z\nLarmor frequency: f_L = g μ_B B_z / h ≈ 28 GHz / Tesla\nExchange coupling between neighboring dots:\nH_ex = J(t) S₁ · S₂ = ¼ J(t) (X₁X₂ + Y₁Y₂ + Z₁Z₂ - I)\nCoherence in purified ²⁸Si: T₂* > 100 μs, T₂ (echo) > 20 ms due to zero nuclear spin background.',
    intuition: 'A silicon spin qubit is essentially a single-electron transistor where the spin (up or down) of a solitary trapped electron represents 0 or 1. Because it builds on the exact same silicon manufacturing processes as Intel and TSMC microchips, it is the ultimate semiconductor candidate.',
    applications: ['Intel Tunnel Falls 12-qubit silicon spin chip', 'Silicon Quantum Computing (SQC Australia) atomic precision qubits', 'Integration with classical cryo-CMOS control electronics on same die', 'IIT Bombay & IISc Nanoelectronics semiconductor qubit research programs'],
    preset: null,
    furtherReading: 'Loss & DiVincenzo (1998) Phys. Rev. A 57; Vandersypen et al. (2017) npj Quantum Inf. 3'
  },
  {
    keys: ['topological quantum computing', 'majorana', 'majorana fermion', 'majorana zero mode', 'anyons', 'braiding'],
    title: 'Topological Quantum Computing & Majorana Zero Modes',
    category: 'Quantum Hardware',
    arxiv: 'arXiv:cond-mat/0010440',
    definition: 'A theoretical approach championed by Microsoft where qubits are encoded in non-Abelian anyonic quasi-particle excitations (Majorana Zero Modes) at the ends of topological superconductor nanowires. Gates are implemented by physically braiding worldlines of anyons, providing hardware-level topological protection against local decoherence.',
    math: 'Majorana operators: γ_i = γ_i†,   {γ_i, γ_j} = 2 δ_ij\nA single non-local Dirac fermion is split into two spatially separated Majoranas:\nc = ½ (γ₁ + i γ₂),    c† = ½ (γ₁ - i γ₂)\nParity state: n = c† c = 0 or 1\n\nBraiding operator for swapping anyons 1 and 2:\nB₁₂ = exp( (π/4) γ₁ γ₂ ) = (1/√2) (1 + γ₁ γ₂)\nPhase evolution depends strictly on winding topology, independent of geometric noise!',
    intuition: 'Ordinary qubits store data locally (like a dot on a page: easily erased by smudge). Topological qubits store information non-locally as a braided knot in the worldlines of anyons: shaking the table cannot undo the knot without wrapping all the way around, providing innate hardware error immunity.',
    applications: ['Microsoft Quantum topological qubit program (Majorana 1 architecture)', 'Immunity to local thermal fluctuations and stray electromagnetic noise', 'Bypasses massive physical qubit redundancy required by surface codes', 'Condensed matter frontier research at IISc theoretical physics department'],
    preset: null,
    furtherReading: 'Kitaev (2001) Phys.-Usp. 44; Nayak et al. (2008) Rev. Mod. Phys. 80'
  },

  // ==========================================
  // 5. QUANTUM ERROR CORRECTION & FAULT TOLERANCE
  // ==========================================
  {
    keys: ['surface code', 'toric code', 'qec', 'quantum error correction', 'stabilizer code', 'planar code'],
    title: 'Surface Codes & Stabilizer Formalism',
    category: 'Quantum Error Correction',
    arxiv: 'arXiv:1208.0928',
    definition: 'The leading quantum error correction architecture for 2D nearest-neighbor QPU lattices. Physical data qubits sit on edges, while syndrome ancilla qubits sit on vertices (Z-stabilizers detecting X bit flips) and plaquettes (X-stabilizers detecting Z phase flips). The code distance d tolerates up to ⌊(d-1)/2⌋ arbitrary physical errors.',
    math: 'Stabilizer generators for surface code:\nA_v = ∏_{i ∈ star(v)} Z_i    (Vertex / Star operator)\nB_p = ∏_{j ∈ boundary(p)} X_j   (Plaquette operator)\nCommutation: [A_v, B_p] = 0 for all v, p\n\nCode distance d: Logical X and Z strings span boundaries of length d.\nPhysical qubits needed: N = 2 d² - 2 d + 1\nFault-tolerant threshold: p_th ≈ 1% under depolarizing noise with MWPM decoding.',
    intuition: 'One logical qubit is spread across a chessboard grid of physical qubits. Measure parity stabilizers continuously without ever looking at the data qubits. If a physical qubit flips, the two adjacent measurement checks flash a warning signal (syndrome), telling a classical decoder where the error occurred.',
    applications: ['Google Quantum AI: suppressing quantum errors by scaling distance 3 to distance 5 (Nature 2023)', 'IBM Quantum roadmap targeting 1 fault-tolerant logical qubit with 10,000 physical qubits', 'Quantinuum fault-tolerant logical qubit demonstrations', 'Foundational focus of national quantum missions globally'],
    preset: null,
    furtherReading: 'Fowler et al. (2012) Phys. Rev. A 86; Google Quantum AI (2023) Nature 614'
  },
  {
    keys: ['shor code', 'shor 9 qubit code', '9 qubit code', 'first qec code'],
    title: 'Shor 9-Qubit Error Correction Code',
    category: 'Quantum Error Correction',
    arxiv: null,
    definition: 'Invented by Peter Shor in 1995: the first quantum error-correcting code. It concatenates a 3-qubit bit-flip code with a 3-qubit phase-flip code to encode 1 logical qubit into 9 physical qubits, capable of detecting and correcting any arbitrary single-qubit error (X, Y, or Z).',
    math: 'Logical basis states:\n|0_L⟩ = (1/2√2) (|000⟩ + |111⟩) ⊗ (|000⟩ + |111⟩) ⊗ (|000⟩ + |111⟩)\n|1_L⟩ = (1/2√2) (|000⟩ - |111⟩) ⊗ (|000⟩ - |111⟩) ⊗ (|000⟩ - |111⟩)\n\nStabilizer Generators (8 total):\nBit-flip checks: Z₁Z₂, Z₂Z₃, Z₄Z₅, Z₅Z₆, Z₇Z₈, Z₈Z₉\nPhase-flip checks: X₁X₂X₃X₄X₅X₆, X₄X₅X₆X₇X₈X₉',
    intuition: 'Shor proved that quantum error correction is physically possible despite the no-cloning theorem and continuous error angles. By discretizing arbitrary errors into Pauli X and Z operators and measuring syndromes non-destructively, quantum states can be protected indefinitely.',
    applications: ['Historical proof of principle enabling the entire field of fault-tolerant quantum computing', 'Canonical classroom example for teaching stabilizer theory at IIT/IISc', 'Demonstration of code concatenation and nested quantum protection', 'Basis for understanding modern CSS codes'],
    preset: null,
    furtherReading: 'Shor (1995) Phys. Rev. A 52; Nielsen & Chuang Ch. 10.2'
  },
  {
    keys: ['steane code', '7 qubit code', 'css code', 'color code'],
    title: 'Steane 7-Qubit CSS Code',
    category: 'Quantum Error Correction',
    arxiv: 'arXiv:quant-ph/9605011',
    definition: 'A Calderbank-Shor-Steane (CSS) code constructed from the classical [7, 4, 3] Hamming code. It encodes 1 logical qubit into 7 physical qubits with code distance d = 3. A crucial feature is that all Clifford group gates {H, S, CNOT} can be implemented transversally (bitwise).',
    math: 'Stabilizers derived from classical parity check matrix H_Hamming:\n[ 0 0 0 1 1 1 1 ]\n[ 0 1 1 0 0 1 1 ]\n[ 1 0 1 0 1 0 1 ]\n\n3 X-type stabilizers: X₄X₅X₆X₇, X₂X₃X₆X₇, X₁X₃X₅X₇\n3 Z-type stabilizers: Z₄Z₅Z₆Z₇, Z₂Z₃Z₆Z₇, Z₁Z₃Z₅Z₇\nLogical operators: X_L = X₁X₂X₃X₄X₅X₆X₇,  Z_L = Z₁Z₂Z₃Z₄Z₅Z₆Z₇',
    intuition: 'In the Steane code, the entire Clifford group is transversal: to do a logical Hadamard, you simply apply physical Hadamards to all 7 qubits individually! This eliminates error propagation between qubits during Clifford gate operations.',
    applications: ['Transversal Clifford gate implementations in trapped-ion QPUs', 'Color codes and topological extensions on triangular lattices', 'Fault-tolerant quantum memory demonstrations by Quantinuum', 'Benchmark for testing Eastin-Knill theorem limits'],
    preset: null,
    furtherReading: 'Steane (1996) Proc. R. Soc. Lond. A 452; Calderbank & Shor (1996) Phys. Rev. A 54'
  },
  {
    keys: ['qldpc', 'quantum ldpc', 'low density parity check', 'good quantum codes'],
    title: 'Quantum LDPC (Low-Density Parity-Check) Codes',
    category: 'Quantum Error Correction',
    arxiv: 'arXiv:2111.03654',
    definition: 'A revolutionary class of sparse quantum error-correcting codes where each check operator involves only O(1) physical qubits, and each qubit participates in O(1) checks. In 2021, Panteleev and Kalachev discovered asymptotically "good" qLDPC codes encoding k = Θ(N) logical qubits with distance d = Θ(N), drastically cutting hardware overhead.',
    math: 'Parity check matrix sparse condition: row weight ≤ w_r = O(1), col weight ≤ w_c = O(1)\nCSS commutation condition: H_X · H_Z^T = 0 (mod 2)\n\nComparison with Surface Code:\nSurface Code: k = 1 logical qubit per 2d² physical qubits (rate k/N → 0 as d → ∞)\nGood qLDPC: Constant non-zero encoding rate k/N > 0 and linear distance d ∝ N\nReduces qubit overhead by 10× to 50× compared to surface codes!',
    intuition: 'Surface codes are geometrically constrained to 2D local grids, forcing you to spend thousands of physical qubits to protect just one logical qubit. qLDPC codes use non-local connectivity (long-range couplers) to store dozens of logical qubits simultaneously within hundreds of physical qubits.',
    applications: ['Next-generation fault-tolerant architectures from IBM Quantum and QuEra', 'Massive reduction of physical qubit overhead for breaking RSA-2048', 'Hardware architectures with long-range optical or superconducting couplers', 'Theoretical computer science breakthrough uniting quantum code theory and graph topology'],
    preset: null,
    furtherReading: 'Panteleev & Kalachev (2021) IEEE Trans. Inf. Theory; Breuckmann & Eberhardt (2021) PRX Quantum 2'
  },
  {
    keys: ['magic state distillation', 'bravyi kitaev', 't state injection', 'eastin knill'],
    title: 'Magic State Distillation & Eastin-Knill Theorem',
    category: 'Quantum Error Correction',
    arxiv: 'arXiv:quant-ph/0403025',
    definition: 'The Eastin-Knill theorem proves that no quantum error-correcting code can implement a universal set of gates transversally (fault-tolerantly without spreading errors). To achieve universality, codes implement Clifford gates transversally and synthesize non-Clifford T gates via Magic State Distillation (Bravyi & Kitaev 2005).',
    math: 'Target Magic State: |T⟩ = cos(π/8)|0⟩ + sin(π/8)|1⟩ = T|+⟩\nDistillation protocol (15-to-1 factory):\nConsumes 15 noisy copies of |T⟩ with error rate ε and uses the [[15, 1, 3]] Reed-Muller code to output 1 purified copy with error rate O(ε³).\n\nGate Teleportation: A clean |T⟩ state + CNOT + S correction implements a fault-tolerant T gate on data.',
    intuition: 'Transversal gates are cheap and clean, but Eastin-Knill says you can never have a complete universal toolbox purely through transversal operations. Magic state distillation acts as an ultra-pure quantum refinery: feeding in many rough, noisy T states to distill out a diamond-pure T state that unlocks universal quantum computing.',
    applications: ['Dominates physical qubit footprint in fault-tolerant quantum computers (~90% of all qubits in a Shor factorization processor are dedicated to distillation factories)', 'T-count and T-depth compiler optimization algorithms', 'Bravyi-Haah and Litinski lattice surgery magic state factories', 'Benchmarking fault-tolerant thresholds in Google and IBM architectures'],
    preset: null,
    furtherReading: 'Eastin & Knill (2009) Phys. Rev. Lett. 102; Bravyi & Kitaev (2005) Phys. Rev. A 71; Litinski (2019) Quantum 3'
  },

  // ==========================================
  // 6. QUANTUM MACHINE LEARNING & INFORMATION
  // ==========================================
  {
    keys: ['quantum machine learning', 'qml', 'quantum neural network', 'qnn', 'pqc'],
    title: 'Quantum Machine Learning (QML) & Parameterized Circuits',
    category: 'Quantum Machine Learning',
    arxiv: 'arXiv:1611.09347',
    definition: 'An interdisciplinary field exploring quantum algorithms for machine learning tasks. Key architectures include Parameterized Quantum Circuits (PQCs) functioning as Quantum Neural Networks (QNNs), Quantum Support Vector Machines with quantum kernel estimation, and quantum feature mapping into high-dimensional Hilbert space.',
    math: 'Quantum Neural Network forward pass:\n|ψ(x, θ)⟩ = U(θ) Φ(x) |0⟩⊗ⁿ\nOutput expectation value: y_pred = ⟨ψ(x, θ)| M |ψ(x, θ)⟩\nLoss function: L(θ) = (1/N) ∑ (y_i - y_pred(x_i, θ))²\n\nQuantum Kernel Trick: k(x_i, x_j) = |⟨0| Φ†(x_i) Φ(x_j) |0⟩|²\nCalculated directly on quantum hardware via SWAP test or inversion circuit.',
    intuition: 'Classical neural networks learn weights by matrix multiplication. Quantum neural networks learn rotation angles θ on quantum gates. The input data is mapped into the exponentially large 2ⁿ-dimensional Hilbert space of a quantum register, potentially allowing classification of patterns that classical networks cannot separate.',
    applications: ['High-energy physics: LHC particle collision track classification at CERN', 'Quantum chemistry: predicting molecular atomization energies', 'Financial fraud detection and risk modeling (JPMorgan, Goldman Sachs)', 'IIT research: quantum generative modeling for synthetic medical data'],
    preset: null,
    furtherReading: 'Biamonte et al. (2017) Nature 549; Havlíček et al. (2019) Nature 567; Schuld & Petruccione (2021) "Machine Learning with Quantum Computers"'
  },
  {
    keys: ['barren plateau', 'barren plateaus', 'vanishing gradients qnn', 'qml trainability'],
    title: 'Barren Plateaus in Quantum Neural Networks',
    category: 'Quantum Machine Learning',
    arxiv: 'arXiv:1803.11173',
    definition: 'A fundamental trainability obstacle discovered by McClean et al. (2018): for randomly initialized deep parameterized quantum circuits, the gradient of the cost function vanishes exponentially with the number of qubits n: Var[∂E/∂θ_k] ∈ O(1/2ⁿ).',
    math: 'Variance of gradient under Haar-random state distribution:\nVar_θ [ ∂_k ⟨H⟩ ] ∝ (1/2ⁿ) · Tr(H²) / 2ⁿ\n\nGradient magnitude decays exponentially: |∂E/∂θ| ~ 2^(-n/2)\nRequires an exponential number of measurement shots O(2ⁿ) to resolve the gradient direction from shot noise, negating quantum speedup.',
    intuition: 'Hilbert space is unimaginably vast. A randomly initialized deep quantum circuit wanders into a completely uniform, flat desert where every direction looks identical. Without gradients, classical optimizers cannot determine which way is uphill or downhill.',
    applications: ['Designing shallow local cost functions to avoid global barren plateaus', 'Identity initialization and layer-by-layer pre-training of QNNs', 'Geometric quantum machine learning respecting problem symmetries', 'Crucial constraint for all QML research at academic institutes globally'],
    preset: null,
    furtherReading: 'McClean et al. (2018) Nat. Commun. 9; Cerezo et al. (2021) Nat. Commun. 12'
  },
  {
    keys: ['quantum teleportation', 'teleportation protocol', 'state transfer quantum'],
    title: 'Quantum Teleportation Protocol',
    category: 'Quantum Protocols',
    arxiv: 'arXiv:quant-ph/9605005',
    definition: 'Formulated by Bennett et al. (1993): transmits an unknown quantum state |ψ⟩ = α|0⟩ + β|1⟩ from Alice to Bob using one pre-shared Bell pair (|Φ⁺⟩) and 2 classical bits sent through a classical channel, destroying the original state in compliance with the no-cloning theorem.',
    math: 'Initial state: |ψ⟩_C ⊗ |Φ⁺⟩_AB = (α|0⟩ + β|1⟩) ⊗ (1/√2)(|00⟩ + |11⟩)\n1. Alice applies CNOT(C→A) followed by H(C).\n2. Total state expands into Bell basis:\n   ½ [ |00⟩_CA (α|0⟩ + β|1⟩)_B + |01⟩_CA (α|1⟩ + β|0⟩)_B + |10⟩_CA (α|0⟩ - β|1⟩)_B + |11⟩_CA (α|1⟩ - β|0⟩)_B ]\n3. Alice measures qubits C and A, obtaining 2 classical bits (m₁, m₂).\n4. Bob applies corrective Pauli operator Z^(m₁) X^(m₂) to qubit B.\n5. Bob\'s qubit becomes identically |ψ⟩!',
    intuition: 'Alice scans her unknown quantum particle against half of an entangled Bell pair. The measurement destroys the original quantum information locally while creating a 2-bit classical key. When Bob applies the key to his half of the entangled pair, the original state instantly emerges.',
    applications: ['Quantum network routing and quantum internet repeaters', 'Modular multi-core quantum processor interconnects', 'Fault-tolerant gate execution via gate teleportation (Gottesman-Chuang)', 'Satellite-to-ground quantum communications (Micius satellite)'],
    preset: null,
    furtherReading: 'Bennett et al. (1993) Phys. Rev. Lett. 70; Bouwmeester et al. (1997) Nature 390'
  },
  {
    keys: ['superdense coding', 'dense coding', 'two classical bits in one qubit'],
    title: 'Superdense Coding Protocol',
    category: 'Quantum Protocols',
    arxiv: null,
    definition: 'Formulated by Bennett and Wiesner (1992): the conjugate protocol to teleportation. Transmits 2 classical bits of information from Alice to Bob by sending only ONE physical qubit, provided Alice and Bob share a pre-established entangled Bell pair.',
    math: 'Shared state: |Φ⁺⟩ = (|00⟩ + |11⟩)/√2\nAlice encodes 2 classical bits b₁b₂ by applying local Pauli gate to her qubit:\n- 00: Apply I   ⟹ (|00⟩ + |11⟩)/√2 = |Φ⁺⟩\n- 01: Apply X   ⟹ (|10⟩ + |01⟩)/√2 = |Ψ⁺⟩\n- 10: Apply Z   ⟹ (|00⟩ - |11⟩)/√2 = |Φ⁻⟩\n- 11: Apply iY  ⟹ (|01⟩ - |10⟩)/√2 = |Ψ⁻⟩\n\nAlice sends her single qubit to Bob.\nBob performs Bell measurement (CNOT + H + measure): Decodes both bits b₁b₂ with 100% fidelity!',
    intuition: 'In classical physics, one particle carrying a 2-state degree of freedom can only carry 1 bit of information (Holevo bound). Entanglement doubles this capacity: Alice\'s single particle acts as a handle that steers the joint 4-dimensional entangled state.',
    applications: ['Doubling bandwidth in quantum communication links', 'Quantum network protocol verification', 'Fundamental demonstration of entanglement as a communication resource', 'Tested experimentally across fiber optics and free space optical links'],
    preset: 'bell',
    furtherReading: 'Bennett & Wiesner (1992) Phys. Rev. Lett. 69; Mattle et al. (1996) Phys. Rev. Lett. 76'
  },
  {
    keys: ['bb84', 'quantum key distribution', 'qkd', 'bennett brassard 1984', 'quantum cryptography'],
    title: 'BB84 Quantum Key Distribution (QKD)',
    category: 'Cryptography',
    arxiv: null,
    definition: 'The world\'s first quantum cryptographic protocol, invented by Charles Bennett and Gilles Brassard in 1984. Enables two parties (Alice and Bob) to generate a provably secure shared random cryptographic key, with security guaranteed by the laws of quantum mechanics (no-cloning theorem and collapse upon measurement).',
    math: 'Four quantum states across two non-orthogonal bases:\nComputational basis (Z): |0⟩, |1⟩\nHadamard basis (X): |+⟩, |−⟩\n\nProtocol Steps:\n1. Alice generates random bit a_k and random basis b_k ∈ {Z, X}, sending prepared photons to Bob.\n2. Bob measures each photon in a randomly chosen basis b′_k ∈ {Z, X}.\n3. Public Sifting: Alice and Bob publicly announce bases {b_k} and {b′_k}. They discard bits where bases disagreed (~50% retention).\n4. Error estimation: Compare sample bits. If Quantum Bit Error Rate (QBER) < 11%, no eavesdropper (Eve) was present.\n5. Error correction & Privacy amplification yield unconditionally secure key.',
    intuition: 'If Eve attempts to eavesdrop on the photon in transit, the Born rule forces her to guess the basis. If she guesses wrong, she inevitably collapses the state, introducing detectable errors (minimum 25% error rate on intercepted bits). Alice and Bob instantly detect her presence.',
    applications: ['Government and banking quantum-safe communication lines', 'Indian Defence Research and Development Organisation (DRDO) QKD links (100+ km)', 'Commercial QKD appliances (ID Quantique, Toshiba)', 'Satellite quantum cryptography networks (India National Quantum Mission)'],
    preset: null,
    furtherReading: 'Bennett & Brassard (1984) IEEE Conf. Computers, Systems and Signal Processing; Shor & Preskill (2000) Phys. Rev. Lett. 85'
  },
  {
    keys: ['e91', 'ekert protocol', 'entanglement qkd', 'ekert 1991'],
    title: 'E91 Entanglement-Based Quantum Key Distribution',
    category: 'Cryptography',
    arxiv: null,
    definition: 'Proposed by Artur Ekert in 1991: an entanglement-based QKD protocol where security is directly guaranteed by Bell\'s theorem. Alice and Bob receive halves of EPR entangled pairs and measure them along randomly chosen angles, proving the absence of eavesdropping via violation of the CHSH inequality.',
    math: 'Shared state source: Singlet state |Ψ⁻⟩ = (|01⟩ - |10⟩)/√2\nAlice measurement angles: a₁ = 0°, a₂ = 45°, a₃ = 90°\nBob measurement angles: b₁ = 45°, b₂ = 90°, b₃ = 135°\n\nCorrelation groups:\n- When orientations match: Results are perfectly anti-correlated ⟹ forms secret key.\n- When orientations differ: Used to compute CHSH test statistic S.\nIf |S| = 2√2, the entanglement is pure and eavesdropping is mathematically impossible.',
    intuition: 'In BB84, Alice prepares states; in E91, an untrusted source distributes entangled pairs. Even if Eve herself manufactured the pairs, the CHSH test proves whether the correlation is purely quantum. If Eve intercepted or holds correlations with the particles, |S| drops below 2√2, exposing her instantly.',
    applications: ['Device-Independent Quantum Key Distribution (DI-QKD)', 'Space-based satellite entanglement links across continents', 'Quantum network nodes with untrusted central quantum repeaters', 'Foundational protocol for experimental quantum information science'],
    preset: 'bell',
    furtherReading: 'Ekert (1991) Phys. Rev. Lett. 67; Aspect (2002) Nature 418'
  },
  {
    keys: ['post quantum cryptography', 'pqc', 'lattice cryptography', 'kyber', 'dilithium', 'nist pqc'],
    title: 'Post-Quantum Cryptography (PQC) & Lattice Standards',
    category: 'Cryptography',
    arxiv: null,
    definition: 'Classical cryptographic algorithms designed to run on existing digital computers that remain secure against attacks by both classical and fault-tolerant quantum computers (including Shor\'s and Grover\'s algorithms). In 2024, NIST finalized the first standards: ML-KEM (Kyber), ML-DSA (Dilithium), and SLH-DSA (SPHINCS+).',
    math: 'Hard Mathematical Problems underlying PQC:\n1. Learning With Errors (LWE) & Module-LWE:\n   Given A ∈ R_q^(k×l), find s ∈ R_q^l given b = A s + e (mod q) where e is small Gaussian noise.\n   Reduces to shortest vector problem (SVP) on high-dimensional lattices (no known quantum speedup).\n2. Classical RSA security: O(exp(n^(1/3))) ⟹ Shor breaks in O(n³)\n3. Lattice LWE security: Classical & Quantum both require O(exp(n)) lattice basis reduction steps (BKZ algorithm).',
    intuition: 'Shor\'s algorithm destroys RSA and ECC because they rely on hidden periodicities in abelian groups. Lattice cryptography is based on finding the nearest point in a 1000-dimensional grid of tilted dots with added noise. Quantum superposition offers no algebraic shortcut to navigate high-dimensional geometric noise.',
    applications: ['NIST FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) standards', 'HTTPS TLS 1.3 quantum-resistant cipher suites (Google Chrome, Cloudflare)', 'Transitioning critical banking and national security infrastructure globally', 'Protection against "Harvest Now, Decrypt Later" quantum adversary campaigns'],
    preset: null,
    furtherReading: 'NIST Post-Quantum Cryptography Standardization (2024); Regev (2009) J. ACM 56'
  },

  // ==========================================
  // 7. ANCIENT HERITAGE & ATOMIC TREATISES
  // ==========================================
  {
    keys: ['kanada', 'parmanu', 'parmanu vada', 'vaisheshika', 'maharshi kanada', 'indian atomic theory'],
    title: 'Maharshi Kanada: Parmanu Vada (Genesis of Atomic Theory)',
    category: 'Ancient Heritage',
    arxiv: null,
    definition: 'Founded by Maharshi Kanada in the 6th Century BCE in the Vaisheshika Sutra. Formulated the fundamental doctrine of Parmanu Vada: all physical matter (Dravya) is composed of eternal, indivisible, infinitesimal quantum units called Parmanu, which aggregate into binary compounds (Dyanuka) and ternary structures (Tryanuka) through vibrational kinetic force (Spandana).',
    math: 'Metaphysical Hierarchy of Material Formation:\n1 Parmanu (Indivisible Point Quantum)\n2 Parmanu ⟹ 1 Dyanuka (Diatomic Molecule)\n3 Dyanuka ⟹ 1 Tryanuka / Trasarenu (Triatomic Particle, visible in sunbeam)\n\nPrinciples:\n"सर्वं द्रव्यं परमाणु रूपम्" (All matter is fundamentally atomic)\nParmanu are uncaused, indestructible, and eternally in motion (Spandana).',
    intuition: 'Centuries before Democritus and Dalton, Indian natural philosophy postulated that matter cannot be divided infinitely without encountering an ultimate limit. If matter could be divided indefinitely, a mustard seed and Mount Meru would contain equal infinite parts. Hence, indivisible discrete quanta (Parmanu) must exist.',
    applications: ['Historical foundation of atomism and discrete state space', 'Epistemological framework of Indian natural philosophy', 'Celebrated in modern Indian scientific heritage programs at IISc and IITs', 'Comparative epistemology between ancient discrete logic and quantum mechanics'],
    preset: null,
    furtherReading: 'Kanada, Vaisheshika Sutra (c. 600 BCE); Sinha translation (1923) Sacred Books of the Hindus; Subbarayappa "A Concise History of Science in India"'
  },
  {
    keys: ['kapila', 'samkhya', 'prakriti', 'purusha', 'unmanifest potentiality', 'observer effect philosophy'],
    title: 'Sage Kapila: Samkhya & The Conscious Observer',
    category: 'Ancient Heritage',
    arxiv: null,
    definition: 'Expounded by Sage Kapila in the Samkhya Sutra (c. 700 BCE). Models physical nature (Prakriti) as a multi-dimensional matrix of unmanifest potentiality (Avyakta) characterized by three entangled dynamical qualities (Gunas: Sattva, Rajas, Tamas). Upon interaction with the conscious observer (Purusha), the unmanifest potential collapses into manifest macroscopic reality (Vyakta).',
    math: 'Dual Epistemic Framework:\nPrakriti (Quantum Potentiality Space) ⟷ Purusha (The Conscious Observer)\nEquilibrium State: Samyavastha of Gunas (No manifest phenomenon)\nPerturbation / Observation: Collapse of equilibrium into 23 manifest physical Tattvas\n\nDirect parallel to John von Neumann and Eugene Wigner\'s interpretation of the quantum measurement problem (observer-induced state collapse).',
    intuition: 'Erwin Schrödinger and Werner Heisenberg studied Indian philosophical texts extensively while developing quantum mechanics. Schrödinger famously noted that the fundamental idea of quantum superposition—an unmeasured system existing as pure potentiality until an observation occurs—closely mirrors Samkhya philosophy.',
    applications: ['Historical philosophical influences on early quantum pioneers (Schrödinger, Heisenberg, Bohr)', 'Philosophical analysis of the quantum measurement problem', 'Comparative cognitive models in quantum information science', 'Interdisciplinary curricula in Indian institutes of technology'],
    preset: 'bell',
    furtherReading: 'Kapila, Samkhya Pravachana Sutra; Schrödinger "My View of the World" (1964); Heisenberg "Physics and Philosophy" (1958)'
  }
];

if (typeof window !== 'undefined') {
  window.QUANTUM_TOPIC_DATABASE = QUANTUM_TOPIC_DATABASE;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUANTUM_TOPIC_DATABASE };
}
