/**
 * Ananta - Topic-Specific Learning Journey & Adaptive Roadmap
 * Matches user query against prerequisite-mapped curriculum modules,
 * renders staggered waterfall module cards, and conditionally renders
 * side-by-side live Circuit Designer exercises.
 */

class TopicRoadmapManager {
  constructor() {
    this.container = typeof document !== 'undefined' ? document.getElementById('view-topic-roadmap') : null;
    this.currentCuratedModules = [];
    this.activeModule = null;
    this.isDockedInSplit = false;

    // Define Master Curriculum Modules (10 Core Modules corresponding to #docs)
    this.modules = [
      {
        id: 'module-01',
        docId: 'doc-sec-hilbert',
        number: 'Module 01',
        title: 'Hilbert Space & Statevector Representation',
        category: 'Foundations',
        level: 'Beginner',
        timeEst: '15 mins',
        summary: 'Understand complex probability amplitudes, the Born rule, and continuous statevectors in 2^n dimensional Hilbert space.',
        circuitPreset: null,
        mathFormula: '|ψ⟩ = α|0⟩ + β|1⟩,   where |α|² + |β|² = 1',
        intuition: 'A qubit is not a classical bit with uncertainty. It is a unit vector on the complex sphere where amplitudes can constructively or destructively interfere.'
      },
      {
        id: 'module-02',
        docId: 'doc-sec-unitaries',
        number: 'Module 02',
        title: 'Gate Unitaries & Matrix Evolution',
        category: 'Quantum Gates',
        level: 'Beginner',
        timeEst: '20 mins',
        summary: 'Learn single-qubit rotations (H, X, Y, Z, S, T) and multi-qubit Kronecker expansions that preserve quantum norm.',
        circuitPreset: 'superposition',
        mathFormula: 'U · U† = I,   |+⟩ = H|0⟩ = (|0⟩ + |1⟩)/√2',
        intuition: 'Every quantum gate is a reversible rotation in Hilbert space. Applying H puts the qubit into equal superposition.',
        exerciseGoal: 'Arm the Hadamard (H) gate and place it on Qubit 0. Observe measurement probabilities become 50% for |0⟩ and 50% for |1⟩.'
      },
      {
        id: 'module-03',
        docId: 'doc-sec-density',
        number: 'Module 03',
        title: 'Density Matrix Formalism & Mixed States',
        category: 'Statistical Physics',
        level: 'Intermediate',
        timeEst: '25 mins',
        summary: 'Explore pure vs mixed quantum states, partial trace over entangled subsystems, and von Neumann entropy.',
        circuitPreset: null,
        mathFormula: 'ρ = ∑ p_i |ψ_i⟩⟨ψ_i|,   Tr(ρ) = 1,   Tr(ρ²) ≤ 1',
        intuition: 'When a qubit is entangled or decohered, it can no longer be described by a statevector alone. The density matrix tracks classical mixture and quantum coherences.'
      },
      {
        id: 'module-04',
        docId: 'doc-sec-pauli',
        number: 'Module 04',
        title: 'Pauli Observables & Expectation Values',
        category: 'Measurements',
        level: 'Intermediate',
        timeEst: '20 mins',
        summary: 'Calculate expectation values ⟨Z⟩, ⟨X⟩, ⟨Y⟩ from physical projective measurements and density matrices.',
        circuitPreset: 'superposition',
        mathFormula: '⟨O⟩ = ⟨ψ|O|ψ⟩ = Tr(ρ O),   ⟨Z⟩ = P(0) - P(1)',
        intuition: 'Pauli observables quantify the projection of the quantum state along the Bloch sphere coordinate axes.',
        exerciseGoal: 'Switch on Pauli Observables on the left panel to watch ⟨Z⟩ drop to 0 and ⟨X⟩ rise to +1 when H is applied.'
      },
      {
        id: 'module-05',
        docId: 'doc-sec-decoherence',
        number: 'Module 05',
        title: 'Decoherence & Lindblad Master Equation',
        category: 'Hardware Physics',
        level: 'Advanced',
        timeEst: '30 mins',
        summary: 'Model energy relaxation (T1) and transverse dephasing (T2) in physical superconducting transmon qubits.',
        circuitPreset: null,
        mathFormula: 'dρ/dt = -i[H, ρ] + ∑ (L_k ρ L_k† - ½ {L_k† L_k, ρ})',
        intuition: 'Quantum systems are not isolated. Coupling to thermal electromagnetic environments causes phase information to leak out exponentially.'
      },
      {
        id: 'module-06',
        docId: 'doc-sec-circuit-qasm',
        number: 'Module 06',
        title: 'OpenQASM 3.0 & Google Cirq AST Compilation',
        category: 'Software Engineering',
        level: 'Intermediate',
        timeEst: '25 mins',
        summary: 'Master syntax translation between Python SDKs (Cirq, Qiskit, Braket) and standard hardware assembly languages.',
        circuitPreset: 'bell',
        mathFormula: 'OPENQASM 3.0; qubit[2] q; h q[0]; cx q[0], q[1];',
        intuition: 'Transpilers map mathematical unitary matrices into hardware-native pulse sequences and gate topologies.',
        exerciseGoal: 'Synthesize a 2-qubit circuit and inspect the generated Cirq / QASM code export.'
      },
      {
        id: 'module-07',
        docId: 'doc-sec-entanglement',
        number: 'Module 07',
        title: 'Entanglement Entropy & Bell States',
        category: 'Quantum Phenomena',
        level: 'Intermediate',
        timeEst: '25 mins',
        summary: 'Construct the four maximally entangled Einstein-Podolsky-Rosen (EPR) Bell states and measure entanglement entropy.',
        circuitPreset: 'bell',
        mathFormula: '|Φ⁺⟩ = (|00⟩ + |11⟩)/√2,   S(ρ_A) = 1.000 ebit',
        intuition: 'Entangled qubits exhibit correlations that cannot be explained by any local classical variables, violating Bell inequalities.',
        exerciseGoal: 'Place an H gate on Qubit 0 followed by a CNOT (control on q0, target on q1) to generate the |Φ⁺⟩ Bell pair.'
      },
      {
        id: 'module-08',
        docId: 'doc-sec-teleportation',
        number: 'Module 08',
        title: 'Quantum Teleportation Protocol',
        category: 'Quantum Protocols',
        level: 'Advanced',
        timeEst: '30 mins',
        summary: 'Transmit an unknown quantum state using a pre-shared Bell pair, Bell-state measurement, and 2 classical bits.',
        circuitPreset: 'teleport',
        mathFormula: '|ψ⟩ ⊗ |Φ⁺⟩ → Bell Measurement → Pauli Correction (X^b Z^a)',
        intuition: 'Information is transferred without moving physical matter, respecting the No-Cloning theorem because the source state is destroyed.',
        exerciseGoal: 'Load the Teleportation preset in the circuit designer to trace amplitude transfer from q0 to q2.'
      },
      {
        id: 'module-09',
        docId: 'doc-sec-grover',
        number: 'Module 09',
        title: 'Grover Search & Amplitude Amplification',
        category: 'Quantum Algorithms',
        level: 'Advanced',
        timeEst: '35 mins',
        summary: 'Achieve quadratic speedup O(√N) for unstructured database search using phase oracles and diffusion inversion.',
        circuitPreset: 'grover',
        mathFormula: 'G = (2|ψ⟩⟨ψ| - I) · O_f,   Iterations ≈ (π/4)√N',
        intuition: 'By inverting target states around the average mean amplitude, the probability of measuring the correct answer surges toward 100%.',
        exerciseGoal: 'Observe the Grover diffusion operator amplify the marked basis state in the probability distribution.'
      },
      {
        id: 'module-10',
        docId: 'doc-sec-vqe',
        number: 'Module 10',
        title: 'Variational Quantum Eigensolver (VQE)',
        category: 'NISQ Algorithms',
        level: 'Advanced',
        timeEst: '35 mins',
        summary: 'Hybrid quantum-classical optimization to calculate molecular ground state energies and chemical binding curves.',
        circuitPreset: 'vqe',
        mathFormula: 'E(θ) = ⟨ψ(θ)|H_molecule|ψ(θ)⟩ ≥ E_ground',
        intuition: 'The quantum processor computes state energy efficiently while a classical optimizer tunes gate parameters iteratively.',
        exerciseGoal: 'Inspect the VQE ansatz circuit for Hydrogen H2 and run the variational energy evaluation.'
      }
    ];

    // Predefined Topic Matching Knowledge Matrix
    this.topicPatterns = [
      {
        topicId: 'beginner-track',
        displayName: 'Beginner Feature Roadmap: Foundations & Quantum Gates',
        description: 'Guided foundational pathway covering Hilbert space geometry, single-qubit rotations, Pauli observables, and compiling your first circuits.',
        keywords: [
          'beginner', 'beginner roadmap', 'beginner track', 'foundations', 'start', 'intro', 'introduction',
          'beginner to advanced', 'basics', 'zero knowledge', 'getting started', 'learn quantum'
        ],
        moduleIds: ['module-01', 'module-02', 'module-04', 'module-06']
      },
      {
        topicId: 'advanced-track',
        displayName: 'Advanced Feature Roadmap: Entanglement, NISQ & VQE Chemistry',
        description: 'Advanced graduate-level pathway covering density matrices, Lindblad noise, Bell entanglement, Grover search, and VQE molecular chemistry.',
        keywords: [
          'advanced', 'advanced roadmap', 'advanced track', 'nisq', 'vqe chemistry', 'master equation',
          'entanglement', 'teleportation', 'grover', 'expert', 'graduate', 'ftqc'
        ],
        moduleIds: ['module-03', 'module-05', 'module-07', 'module-08', 'module-09', 'module-10']
      },
      {
        topicId: 'circuits-basics',
        displayName: 'Quantum Circuits & Gate Fundamentals',
        description: 'Complete zero-to-hero onboarding to quantum gates, state vectors, and building your first quantum circuit.',
        keywords: [
          'circuit', 'circuits', 'make quantum circuits', '0 prior knowledge', 'zero prior knowledge',
          'learn circuits', 'build circuit', 'how to make', 'gate', 'gates', 'hadamard', 'cnot', 'quantum logic', 'unitary'
        ],
        moduleIds: ['module-01', 'module-02', 'module-06']
      },
      {
        topicId: 'entanglement-bell',
        displayName: 'Quantum Entanglement & Bell Pairs',
        description: 'Master non-local correlation, Einstein-Podolsky-Rosen paradox, and creating entangled qubit registers.',
        keywords: [
          'entangle', 'entanglement', 'bell', 'bell state', 'bell states', 'bell pair', 'epr',
          'spooky', 'superdense', 'correlated', 'chsh'
        ],
        moduleIds: ['module-01', 'module-02', 'module-07']
      },
      {
        topicId: 'teleportation',
        displayName: 'Quantum Teleportation & Protocols',
        description: 'Understand how quantum information is transmitted across distant nodes using shared entanglement.',
        keywords: [
          'teleport', 'teleportation', 'quantum teleportation', 'transfer state', 'quantum network',
          'quantum internet', 'channel'
        ],
        moduleIds: ['module-01', 'module-02', 'module-07', 'module-08']
      },
      {
        topicId: 'grover-search',
        displayName: 'Grover Search & Amplitude Amplification',
        description: 'Learn how quantum oracles and diffusion operators achieve quadratic speedup over classical search.',
        keywords: [
          'grover', 'grover search', 'search algorithm', 'amplitude amplification', 'oracle',
          'diffusion', 'unstructured search', 'database search'
        ],
        moduleIds: ['module-01', 'module-02', 'module-09']
      },
      {
        topicId: 'vqe-chemistry',
        displayName: 'VQE & Quantum Molecular Chemistry',
        description: 'Explore variational algorithms, parameterized ansatz circuits, and estimating molecular ground state energies.',
        keywords: [
          'vqe', 'chemistry', 'molecule', 'molecular', 'variational', 'eigensolver',
          'hydrogen', 'ground state', 'hamiltonian', 'parameter shift', 'nisq'
        ],
        moduleIds: ['module-01', 'module-04', 'module-10']
      },
      {
        topicId: 'noise-decoherence',
        displayName: 'Decoherence, Noise & Mixed States',
        description: 'Study open quantum systems, T1 relaxation, T2 dephasing, and density matrix formalism.',
        keywords: [
          'noise', 'decoherence', 'lindblad', 'density matrix', 'mixed state', 't1', 't2',
          'dephasing', 'relaxation', 'open system', 'purity', 'fidelity'
        ],
        moduleIds: ['module-01', 'module-03', 'module-05']
      },
      {
        topicId: 'programming-transpilation',
        displayName: 'Quantum Programming with Cirq & OpenQASM',
        description: 'Hands-on cross-framework development compiling quantum circuits into OpenQASM and Google Cirq.',
        keywords: [
          'programming', 'python', 'cirq', 'qasm', 'openqasm', 'qiskit', 'code',
          'transpile', 'compiler', 'ast', 'software'
        ],
        moduleIds: ['module-01', 'module-02', 'module-06']
      },
      {
        topicId: 'algorithms-advantage',
        displayName: 'Quantum Algorithm Speedups & Complexity',
        description: 'Understand how quantum parallelism, phase kickback, and interference enable asymptotic speedups.',
        keywords: [
          'algorithm', 'algorithms', 'speedup', 'advantage', 'complexity', 'polynomial',
          'exponential', 'parallelism', 'quantum computing'
        ],
        moduleIds: ['module-01', 'module-02', 'module-07', 'module-09', 'module-10']
      }
    ];

    this.initDOM();
  }

  loadTopicById(topicId) {
    this.initDOM();
    const pattern = this.topicPatterns.find(p => p.topicId === topicId);
    if (pattern) {
      const matchedModules = pattern.moduleIds.map(id => this.modules.find(m => m.id === id)).filter(Boolean);
      const matchResult = {
        pattern,
        modules: matchedModules,
        score: 100
      };
      const inputEl = document.getElementById('topic-user-query');
      if (inputEl) inputEl.value = pattern.displayName;
      this.closeModuleReader();
      const resultsContainer = document.getElementById('topic-roadmap-results');
      if (resultsContainer) {
        resultsContainer.style.display = 'block';
        this.renderCuratedRoadmap(matchResult, pattern.displayName);
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  initDOM() {
    if (!this.container && typeof document !== 'undefined') {
      this.container = document.getElementById('view-topic-roadmap');
    }
    if (!this.container) return;
    if (!this.container.innerHTML || this.container.innerHTML.trim() === '') {
      this.renderLandingView();
    }
  }

  // Initial clean, minimal landing layout
  renderLandingView() {
    this.container.innerHTML = `
      <div class="topic-roadmap-container">
        
        <!-- Minimal Centered Hero -->
        <div class="topic-entry-hero">
          <div class="topic-sparkle-halo"></div>
          <div class="topic-pill-badge">
            <span class="topic-badge-dot"></span>
            <span>Adaptive Quantum Learning Path</span>
          </div>

          <h1 class="topic-entry-heading">
            Already have a topic in mind?<br />
            <span class="heading-gradient">Let's kickstart your quantum journey</span>
          </h1>

          <p class="topic-entry-subtext">
            Enter any concept, curiosity, or learning goal. Our adaptive engine will assemble an ordered prerequisite pathway from foundational state vectors to live hands-on circuit labs.
          </p>

          <!-- Single Centered Text Input Form -->
          <div class="topic-input-container">
            <form id="topic-roadmap-form" onsubmit="event.preventDefault(); window.topicRoadmapManager.handleSearch();">
              <div class="topic-input-wrapper">
                <span class="topic-search-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input
                  type="text"
                  id="topic-user-query"
                  class="topic-search-field"
                  placeholder="e.g., I want to learn how to make quantum circuits, I have 0 prior knowledge"
                  autocomplete="off"
                  spellcheck="false"
                />
                <button type="submit" class="btn-topic-generate" id="btn-generate-roadmap">
                  <span>Generate Roadmap</span>
                  <span class="btn-arrow">→</span>
                </button>
              </div>
            </form>

            <!-- Quick Suggested Topic Chips -->
            <div class="topic-suggested-row">
              <span class="suggested-label">Featured tracks & topics:</span>
              <button class="topic-chip highlight-chip chip-beginner" onclick="window.topicRoadmapManager.loadTopicById('beginner-track')">
                Beginner Roadmap Track
              </button>
              <button class="topic-chip highlight-chip chip-advanced" onclick="window.topicRoadmapManager.loadTopicById('advanced-track')">
                Advanced Roadmap Track
              </button>
              <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('I want to learn how to make quantum circuits, I have 0 prior knowledge')">
                Circuit Fundamentals
              </button>
              <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('I want to understand quantum entanglement and Bell states')">
                Entanglement & Bell States
              </button>
              <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('Explain quantum teleportation protocol')">
                Quantum Teleportation
              </button>
              <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('How does Grover search algorithm work?')">
                Grover Search
              </button>
              <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('Quantum chemistry and VQE molecular simulation')">
                VQE Molecular Chemistry
              </button>
            </div>
          </div>
        </div>

        <!-- Dynamic Results Stage (Populated after search) -->
        <div id="topic-roadmap-results" class="topic-results-stage" style="display: none;"></div>

        <!-- Dynamic Module Detail Split Stage (Populated when clicking a module) -->
        <div id="topic-module-detail-stage" class="topic-module-split-stage" style="display: none;"></div>

      </div>
    `;

    // Re-bind enter key and auto-focus
    if (typeof document !== 'undefined') {
      const inputEl = document.getElementById('topic-user-query');
      if (inputEl) {
        setTimeout(() => inputEl.focus(), 150);
      }
    }
  }

  setQueryAndSearch(query) {
    const inputEl = document.getElementById('topic-user-query');
    if (inputEl) {
      inputEl.value = query;
      this.handleSearch();
    }
  }

  handleSearch() {
    const inputEl = document.getElementById('topic-user-query');
    if (!inputEl) return;
    const query = inputEl.value.trim();
    if (!query) return;

    // Reset module reader split view if open
    this.closeModuleReader();

    // Match query against topicPatterns
    const match = this.matchQueryToTopic(query);
    const resultsContainer = document.getElementById('topic-roadmap-results');
    if (!resultsContainer) return;

    resultsContainer.style.display = 'block';

    if (match) {
      this.renderCuratedRoadmap(match, query);
    } else {
      this.renderFallbackView(query);
    }

    // Smooth scroll down to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Intelligent Knowledge & Topic Matching Engine
  matchQueryToTopic(query) {
    const clean = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const queryWords = clean.split(/\s+/).filter(w => w.length > 0);

    // 1. Detect User's Prior Knowledge Level
    const beginnerPhrases = [
      '0 prior', 'zero prior', 'no prior', '0 knowledge', 'zero knowledge', 'no knowledge',
      'no experience', 'from scratch', 'beginner', 'novice', 'new to', 'starter', 'basics',
      'never studied', 'high school', '101', 'start from zero', 'freshman', 'absolute beginner',
      '0 background', 'zero background', 'no background', 'start from scratch'
    ];
    const intermediatePhrases = [
      'know basics', 'know basic', 'know linear algebra', 'know python', 'know coding',
      'know gates', 'know hadamard', 'know cnot', 'know superposition', 'know math',
      'intermediate', 'some knowledge', 'moderate', 'already know', 'familiar with',
      'have experience', 'developer', 'undergraduate', 'learned basics', 'know single qubit',
      'some prior', 'basic knowledge', 'basics known'
    ];
    const advancedPhrases = [
      'advanced', 'expert', 'graduate', 'phd', 'researcher', 'know statevector',
      'know entanglement', 'know density matrix', 'postgrad', 'mastery', 'know hamiltonian',
      'know qft', 'know shor', 'advanced background', 'know algorithms'
    ];

    let detectedLevel = 'BEGINNER'; // Default assumption
    let levelRationale = 'Assembled full foundational scaffolding (Hilbert spaces to circuit synthesis)';

    if (advancedPhrases.some(p => clean.includes(p))) {
      detectedLevel = 'ADVANCED';
      levelRationale = 'Accelerated track skipping foundational math; focused on advanced quantum protocols & NISQ algorithms';
    } else if (intermediatePhrases.some(p => clean.includes(p))) {
      detectedLevel = 'INTERMEDIATE';
      levelRationale = 'Adapted for intermediate background (knows math/gates); accelerated past introductory 101 definitions';
    } else if (beginnerPhrases.some(p => clean.includes(p))) {
      detectedLevel = 'BEGINNER';
      levelRationale = 'Zero-to-hero onboarding starting from fundamental complex statevectors & Dirac notation';
    }

    // 2. Define Concept & Topic Knowledge Domain Scaffoldings
    const topicDomains = [
      {
        key: 'circuits',
        name: 'Quantum Circuits & Gate Fundamentals',
        keywords: ['circuit', 'circuits', 'gate', 'gates', 'hadamard', 'cnot', 'logic', 'unitary', 'composer', 'wire', 'qubit', 'qubits'],
        modulesByLevel: {
          BEGINNER: ['module-01', 'module-02', 'module-06'],
          INTERMEDIATE: ['module-02', 'module-04', 'module-06'],
          ADVANCED: ['module-06', 'module-07']
        },
        description: 'Complete hands-on pathway to building, simulating, and transpiling multi-qubit quantum circuits.'
      },
      {
        key: 'entanglement',
        name: 'Quantum Entanglement & Bell Pairs',
        keywords: ['entangle', 'entanglement', 'bell', 'bell state', 'bell states', 'epr', 'spooky', 'correlated', 'chsh'],
        modulesByLevel: {
          BEGINNER: ['module-01', 'module-02', 'module-07'],
          INTERMEDIATE: ['module-02', 'module-06', 'module-07'],
          ADVANCED: ['module-04', 'module-07']
        },
        description: 'Master non-local correlations, Einstein-Podolsky-Rosen paradox, and creating maximally entangled states.'
      },
      {
        key: 'teleportation',
        name: 'Quantum Teleportation & State Transfer Protocol',
        keywords: ['teleport', 'teleportation', 'transfer state', 'quantum internet', 'channel', 'state transfer'],
        modulesByLevel: {
          BEGINNER: ['module-01', 'module-02', 'module-07', 'module-08'],
          INTERMEDIATE: ['module-02', 'module-07', 'module-08'],
          ADVANCED: ['module-07', 'module-08', 'module-09']
        },
        description: 'Understand how quantum statevectors are transmitted across distant nodes using shared entanglement & classical bits.'
      },
      {
        key: 'grover',
        name: 'Grover Search & Amplitude Amplification',
        keywords: ['grover', 'search', 'oracle', 'diffusion', 'unstructured', 'amplitude amplification', 'database'],
        modulesByLevel: {
          BEGINNER: ['module-01', 'module-02', 'module-07', 'module-09'],
          INTERMEDIATE: ['module-02', 'module-07', 'module-09'],
          ADVANCED: ['module-07', 'module-09']
        },
        description: 'Learn how quantum phase oracles and diffusion operators achieve quadratic speedup over classical search.'
      },
      {
        key: 'vqe',
        name: 'VQE & Molecular Quantum Chemistry',
        keywords: ['vqe', 'chemistry', 'molecule', 'molecular', 'variational', 'eigensolver', 'hydrogen', 'hamiltonian', 'ground state', 'nisq', 'chemical'],
        modulesByLevel: {
          BEGINNER: ['module-01', 'module-02', 'module-04', 'module-10'],
          INTERMEDIATE: ['module-04', 'module-06', 'module-10'],
          ADVANCED: ['module-03', 'module-05', 'module-10']
        },
        description: 'Explore variational hybrid algorithms, parameterized ansatz circuits, and estimating molecular ground state energies.'
      },
      {
        key: 'noise',
        name: 'Decoherence, Noise Channels & Lindblad Physics',
        keywords: ['noise', 'decoherence', 'lindblad', 't1', 't2', 'relaxation', 'dephasing', 'open system', 'error', 'cryo', 'hardware', 'fidelity'],
        modulesByLevel: {
          BEGINNER: ['module-01', 'module-02', 'module-03', 'module-05'],
          INTERMEDIATE: ['module-03', 'module-04', 'module-05'],
          ADVANCED: ['module-03', 'module-05']
        },
        description: 'Study open quantum systems, energy relaxation (T1), dephasing (T2), and density matrix master equations.'
      },
      {
        key: 'density',
        name: 'Density Matrix Formalism & Statistical States',
        keywords: ['density', 'density matrix', 'mixed state', 'pure state', 'trace', 'entropy', 'von neumann', 'statistical'],
        modulesByLevel: {
          BEGINNER: ['module-01', 'module-02', 'module-03'],
          INTERMEDIATE: ['module-01', 'module-03', 'module-04'],
          ADVANCED: ['module-03', 'module-05']
        },
        description: 'Explore pure vs mixed quantum states, partial trace over entangled subsystems, and von Neumann entropy.'
      },
      {
        key: 'programming',
        name: 'Quantum Programming with Cirq & OpenQASM 3.0',
        keywords: ['program', 'programming', 'cirq', 'qasm', 'openqasm', 'python', 'code', 'transpile', 'compiler', 'sdk', 'software', 'assembly'],
        modulesByLevel: {
          BEGINNER: ['module-01', 'module-02', 'module-06'],
          INTERMEDIATE: ['module-02', 'module-06'],
          ADVANCED: ['module-06', 'module-07']
        },
        description: 'Hands-on cross-framework compilation between Google Cirq, Python SDKs, and OpenQASM hardware assembly.'
      },
      {
        key: 'observables',
        name: 'Pauli Observables & Expectation Values',
        keywords: ['pauli', 'observable', 'observables', 'expectation', 'measurement', 'measure', 'z axis', 'x axis', 'born'],
        modulesByLevel: {
          BEGINNER: ['module-01', 'module-02', 'module-04'],
          INTERMEDIATE: ['module-02', 'module-04'],
          ADVANCED: ['module-03', 'module-04']
        },
        description: 'Calculate expectation values from projective measurements, density matrices, and Bloch coordinate projections.'
      },
      {
        key: 'math',
        name: 'Hilbert Space & Complex Statevector Mathematics',
        keywords: ['hilbert', 'statevector', 'math', 'mathematics', 'dirac', 'bra', 'ket', 'complex', 'vector', 'linear algebra', 'amplitudes', 'superposition'],
        modulesByLevel: {
          BEGINNER: ['module-01', 'module-02', 'module-03'],
          INTERMEDIATE: ['module-01', 'module-03'],
          ADVANCED: ['module-01', 'module-03', 'module-05']
        },
        description: 'Formal mathematical specifications in complex Hilbert spaces, probability amplitudes, and unitary transformations.'
      },
      {
        key: 'algorithms',
        name: 'Quantum Algorithms & Asymptotic Speedups',
        keywords: ['algorithm', 'algorithms', 'speedup', 'advantage', 'complexity', 'polynomial', 'exponential', 'shor', 'qft', 'simon', 'deutsch'],
        modulesByLevel: {
          BEGINNER: ['module-01', 'module-02', 'module-07', 'module-09', 'module-10'],
          INTERMEDIATE: ['module-02', 'module-06', 'module-07', 'module-09', 'module-10'],
          ADVANCED: ['module-07', 'module-09', 'module-10']
        },
        description: 'Understand how quantum parallelism, phase kickback, and constructive interference achieve computational advantage.'
      }
    ];

    // Score topics across domains
    let bestDomain = null;
    let bestDomainScore = 0;

    topicDomains.forEach(domain => {
      let score = 0;
      domain.keywords.forEach(kw => {
        if (clean.includes(kw)) {
          score += kw.length > 5 ? 25 : 12;
        }
        const kwParts = kw.split(/\s+/);
        kwParts.forEach(kp => {
          if (queryWords.includes(kp)) score += 6;
        });
      });
      if (score > bestDomainScore) {
        bestDomainScore = score;
        bestDomain = domain;
      }
    });

    // Check if query was purely level-focused (e.g. "I have 0 prior knowledge", "I am a beginner", "advanced track")
    if (bestDomainScore < 10) {
      if (detectedLevel === 'BEGINNER') {
        return {
          pattern: {
            displayName: 'Adaptive Beginner Roadmap: Foundations & Quantum Gates',
            description: 'Customized for learners starting with zero prior background: master Hilbert space geometry, single-qubit rotations, and compiling your first circuits.'
          },
          modules: ['module-01', 'module-02', 'module-04', 'module-06'].map(id => this.modules.find(m => m.id === id)),
          detectedLevel,
          levelRationale,
          score: 20
        };
      } else if (detectedLevel === 'ADVANCED') {
        return {
          pattern: {
            displayName: 'Adaptive Advanced Roadmap: Multi-Qubit NISQ & Algorithms',
            description: 'Customized for advanced learners: dives straight into density matrices, Lindblad noise, Bell entanglement, Grover search, and VQE chemistry.'
          },
          modules: ['module-03', 'module-05', 'module-07', 'module-08', 'module-09', 'module-10'].map(id => this.modules.find(m => m.id === id)),
          detectedLevel,
          levelRationale,
          score: 20
        };
      } else if (detectedLevel === 'INTERMEDIATE') {
        return {
          pattern: {
            displayName: 'Adaptive Intermediate Roadmap: Circuit Engineering & Entanglement',
            description: 'Customized for intermediate learners: bypasses basic definitions and explores Pauli observables, OpenQASM coding, and Bell pair creation.'
          },
          modules: ['module-02', 'module-04', 'module-06', 'module-07', 'module-08'].map(id => this.modules.find(m => m.id === id)),
          detectedLevel,
          levelRationale,
          score: 20
        };
      }
    }

    if (bestDomain && bestDomainScore >= 6) {
      const moduleIds = bestDomain.modulesByLevel[detectedLevel] || bestDomain.modulesByLevel['BEGINNER'];
      const matchedModules = moduleIds.map(id => this.modules.find(m => m.id === id)).filter(Boolean);

      return {
        pattern: {
          displayName: `${bestDomain.name} (${detectedLevel === 'BEGINNER' ? 'Beginner Scaffolded Track' : (detectedLevel === 'INTERMEDIATE' ? 'Intermediate Accelerated Track' : 'Advanced Direct Track')})`,
          description: bestDomain.description
        },
        modules: matchedModules,
        detectedLevel,
        levelRationale,
        score: bestDomainScore
      };
    }

    return null;
  }

  // Render Curated Ordered Module Sequence with Waterfall Staggered Animation
  renderCuratedRoadmap(matchResult, query) {
    const { pattern, modules, detectedLevel = 'BEGINNER', levelRationale = '' } = matchResult;
    this.currentCuratedModules = modules;
    const resultsContainer = document.getElementById('topic-roadmap-results');
    if (!resultsContainer) return;

    let cardsHtml = '';
    modules.forEach((mod, idx) => {
      const stepNum = idx + 1;
      const isPrereq = idx === 0 && modules.length > 1;
      const stepType = isPrereq ? 'Prerequisite Foundation' : (idx === modules.length - 1 ? 'Target Mastery Goal' : 'Core Concept');
      const hasLab = Boolean(mod.circuitPreset);

      cardsHtml += `
        <div class="waterfall-card-wrapper" style="--stagger-index: ${idx};">
          <div class="curated-module-card ${hasLab ? 'has-circuit-lab' : ''}" onclick="window.topicRoadmapManager.openModuleReader('${mod.id}')">
            
            <div class="curated-card-sidebar">
              <div class="curated-step-circle">${stepNum}</div>
              ${stepNum < modules.length ? '<div class="curated-timeline-stem"></div>' : ''}
            </div>

            <div class="curated-card-main">
              <div class="curated-card-header">
                <div class="curated-badge-group">
                  <span class="curated-step-tag">${stepType}</span>
                  <span class="curated-module-badge">${mod.number}</span>
                  <span class="curated-level-badge level-${mod.level.toLowerCase()}">${mod.level}</span>
                </div>
                <span class="curated-time-badge">${mod.timeEst}</span>
              </div>

              <h3 class="curated-card-title">${mod.title}</h3>
              <p class="curated-card-summary">${mod.summary}</p>

              <div class="curated-math-preview">
                <code>${mod.mathFormula}</code>
              </div>

              <div class="curated-card-footer">
                ${hasLab ? `
                  <div class="curated-lab-pill">
                    <span class="lab-pill-dot"></span>
                    <span>Interactive Circuit Lab Attached</span>
                  </div>
                ` : `
                  <div class="curated-theory-pill">
                    <span class="theory-pill-dot"></span>
                    <span>Theoretical Foundations</span>
                  </div>
                `}

                <button class="btn-open-curated-module">
                  <span>Start ${mod.number}</span>
                  <span class="open-arrow">→</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      `;
    });

    resultsContainer.innerHTML = `
      <div class="curated-results-header">
        <div class="curated-header-top">
          <span class="results-tag">ADAPTIVE PATHWAY ASSEMBLED</span>
          <span class="results-level-badge level-${detectedLevel.toLowerCase()}">${detectedLevel} TRACK</span>
          <span class="results-step-count">${modules.length} Ordered Steps to Mastery</span>
        </div>
        <h2 class="results-topic-title">${pattern.displayName}</h2>
        <p class="results-topic-desc">${pattern.description}</p>
        
        ${levelRationale ? `
          <div class="results-rationale-box">
            <span class="rationale-accent-bar"></span>
            <span class="rationale-text"><strong>Adaptive Reasoning:</strong> ${levelRationale}</span>
          </div>
        ` : ''}

        <div class="results-query-echo">
          <span class="echo-label">Matched Query:</span>
          <span class="echo-text">"${query}"</span>
        </div>
      </div>

      <div class="waterfall-module-list">
        ${cardsHtml}
      </div>

      <div class="curated-bottom-actions">
        <p>Want to explore the entire curriculum without topic filtering?</p>
        <button class="btn-view-full-roadmap" onclick="window.switchView('docs')">
          Browse Full Learning Roadmap (All 10 Modules) →
        </button>
      </div>
    `;
  }

  // Graceful Fallback Message when no direct keyword is found
  renderFallbackView(query) {
    const resultsContainer = document.getElementById('topic-roadmap-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
      <div class="topic-fallback-card">
        <div class="fallback-header-badge">NO DIRECT PATHWAY MATCH</div>
        <h2 class="fallback-title">Explore Related Quantum Learning Resources</h2>
        <p class="fallback-desc">
          We couldn't automatically map <em>"${query}"</em> to a single specialized pathway, but here are the fastest ways to continue your quantum journey:
        </p>

        <div class="fallback-options-grid">
          <!-- Option 1: Full Learning Roadmap -->
          <div class="fallback-action-card" onclick="window.switchView('docs')">
            <h4>Browse Full Learning Roadmap</h4>
            <p>Explore all 10 core modules in sequential order from Hilbert space to VQE algorithms.</p>
            <span class="action-card-link">Open Full Curriculum →</span>
          </div>

          <!-- Option 2: Ask Concept Doctor -->
          <div class="fallback-action-card" onclick="window.switchView('intuition')">
            <h4>Ask the AI Concept Doctor</h4>
            <p>Type your exact confusing topic to get physical analogies and real-time interactive simulations.</p>
            <span class="action-card-link">Launch Concept Doctor →</span>
          </div>

          <!-- Option 3: Global Knowledge Search -->
          <div class="fallback-action-card" onclick="window.focusKnowledgeEngineSearch()">
            <h4>Search Global Knowledge Base</h4>
            <p>Search across 80+ quantum computing topics, arXiv landmark papers, and 74 quantum algorithms.</p>
            <span class="action-card-link">Open Knowledge Search (/) →</span>
          </div>
        </div>

        <div class="fallback-quick-re-search">
          <span>Or explore popular tracks:</span>
          <div class="re-search-chips">
            <button class="topic-chip" onclick="window.topicRoadmapManager.loadTopicById('beginner-track')">Beginner Roadmap</button>
            <button class="topic-chip" onclick="window.topicRoadmapManager.loadTopicById('advanced-track')">Advanced Roadmap</button>
            <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('quantum circuits for beginners')">Quantum Circuits</button>
            <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('bell state entanglement')">Bell Entanglement</button>
            <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('grover search algorithm')">Grover Search</button>
            <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('vqe molecular chemistry')">VQE Chemistry</button>
          </div>
        </div>
      </div>
    `;
  }

  // Open specific module reader (with conditional side-by-side Circuit Designer)
  openModuleReader(moduleId) {
    const mod = this.modules.find(m => m.id === moduleId);
    if (!mod) return;
    this.activeModule = mod;

    const detailStage = document.getElementById('topic-module-detail-stage');
    const resultsStage = document.getElementById('topic-roadmap-results');
    if (!detailStage) return;

    if (resultsStage) resultsStage.style.display = 'none';
    detailStage.style.display = 'block';

    const hasCircuitLab = Boolean(mod.circuitPreset);

    detailStage.innerHTML = `
      <div class="module-reader-wrapper ${hasCircuitLab ? 'reader-split-layout' : 'reader-full-layout'}">
        
        <!-- Top Navigation Bar -->
        <div class="module-reader-top-bar">
          <button class="btn-back-to-roadmap" onclick="window.topicRoadmapManager.backToCuratedRoadmap()">
            ← Back to Curated Roadmap
          </button>
          <div class="reader-meta-group">
            <span class="reader-module-num">${mod.number}</span>
            <span class="reader-module-cat">${mod.category}</span>
            <span class="reader-module-time">${mod.timeEst}</span>
          </div>
        </div>

        <!-- Split Content Area -->
        <div class="module-reader-body">
          
          <!-- Column 1: Educational Theory & Exercise Instructions -->
          <div class="reader-theory-column">
            <div class="theory-content-card">
              <div class="theory-header-box">
                <span class="theory-badge">${mod.level} Track</span>
                <h1 class="theory-title">${mod.title}</h1>
                <p class="theory-lead-summary">${mod.summary}</p>
              </div>

              <div class="theory-section">
                <div class="theory-section-tag">Mathematical Formulation</div>
                <div class="theory-math-block">
                  <code>${mod.mathFormula}</code>
                </div>
              </div>

              <div class="theory-section">
                <div class="theory-section-tag">Physical Intuition</div>
                <p class="theory-text">${mod.intuition}</p>
              </div>

              ${hasCircuitLab ? `
                <div class="theory-exercise-box">
                  <div class="exercise-header">
                    <span class="exercise-icon-dot"></span>
                    <h4>Hands-on Circuit Exercise</h4>
                  </div>
                  <p class="exercise-instructions">${mod.exerciseGoal}</p>
                  <div class="exercise-actions">
                    <button class="btn-load-exercise" onclick="window.topicRoadmapManager.loadExerciseIntoLab('${mod.circuitPreset}')">
                      Reset Circuit Exercise
                    </button>
                  </div>
                </div>
              ` : `
                <div class="theory-notice-box">
                  <span>This module establishes foundational theoretical principles. Interactive circuit synthesis is available in subsequent modules.</span>
                </div>
              `}

              <div class="theory-nav-footer">
                <button class="btn-view-doc-manual" onclick="window.switchView('docs'); window.scrollDocIntoView(null, '${mod.docId}')">
                  View Technical Manual Specification ↗
                </button>
              </div>
            </div>
          </div>

          <!-- Column 2: Side-by-Side Embedded Circuit Designer (Conditional) -->
          ${hasCircuitLab ? `
            <div class="reader-lab-column">
              <div class="split-lab-header">
                <div class="lab-title-group">
                  <span class="live-dot"></span>
                  <span class="lab-title">Live Quantum Circuit Composer</span>
                </div>
                <span class="lab-preset-label">Active: ${mod.circuitPreset.toUpperCase()} Exercise</span>
              </div>
              
              <!-- Dock Target for Circuit Designer Component -->
              <div id="topic-lab-dock-target" class="topic-lab-dock-target">
                <!-- Re-parented live from #view-simulator -->
              </div>
            </div>
          ` : ''}

        </div>

      </div>
    `;

    // If module has circuit lab, dock the existing Circuit Designer component
    if (hasCircuitLab) {
      this.dockCircuitDesigner(mod.circuitPreset);
    }

    // Scroll smoothly to top of reader
    detailStage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Dock existing Circuit Designer without duplicating any component code
  dockCircuitDesigner(presetKey) {
    const dockTarget = document.getElementById('topic-lab-dock-target') || document.querySelector('.topic-lab-dock-target');
    const simCol = document.querySelector('#view-simulator .studio-two-col');
    if (!dockTarget || !simCol) return;

    // Move DOM node into dock target
    dockTarget.appendChild(simCol);
    this.isDockedInSplit = true;

    // Load matching exercise preset
    if (presetKey && typeof window !== 'undefined') {
      if (window.loadPresetSafe) {
        window.loadPresetSafe(presetKey);
      } else if (window.circuitUI && window.circuitUI.loadPreset) {
        window.circuitUI.loadPreset(presetKey);
      }
    }
  }

  // Un-dock Circuit Designer back to #view-simulator
  undockCircuitDesigner() {
    if (!this.isDockedInSplit) return;
    const simContainer = document.querySelector('#view-simulator .studio-workspace-container') || document.getElementById('view-simulator');
    const simCol = document.querySelector('.reader-lab-column .studio-two-col') || document.querySelector('#topic-lab-dock-target .studio-two-col');
    
    if (simContainer && simCol) {
      // Re-insert right before analytics deck or at original location
      const analyticsDeck = document.querySelector('#view-simulator .composer-analytics-deck') || document.querySelector('#view-simulator .studio-analytics-deck');
      if (analyticsDeck && analyticsDeck.parentNode === simContainer) {
        simContainer.insertBefore(simCol, analyticsDeck);
      } else {
        simContainer.appendChild(simCol);
      }
    }
    this.isDockedInSplit = false;
  }

  loadExerciseIntoLab(presetKey) {
    if (presetKey && typeof window !== 'undefined') {
      if (window.loadPresetSafe) {
        window.loadPresetSafe(presetKey);
      } else if (window.circuitUI && window.circuitUI.loadPreset) {
        window.circuitUI.loadPreset(presetKey);
      }
    }
  }

  backToCuratedRoadmap() {
    this.closeModuleReader();
    const resultsStage = document.getElementById('topic-roadmap-results');
    if (resultsStage) {
      resultsStage.style.display = 'block';
      resultsStage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  closeModuleReader() {
    this.undockCircuitDesigner();
    const detailStage = document.getElementById('topic-module-detail-stage');
    if (detailStage) {
      detailStage.style.display = 'none';
      detailStage.innerHTML = '';
    }
    this.activeModule = null;
  }

  // -------------------------------------------------------------------
  // Voice-Activated Roadmap Entry Point
  // Called by QuantumVoiceCopilot._executeRoadmapIntent()
  // -------------------------------------------------------------------

  /**
   * Populates the search input, runs the match engine, and renders the
   * visual flow-diagram view. Returns metadata for the voice copilot to
   * speak back.
   * @param {string} topicQuery - extracted topic string from voice
   * @returns {{ count: number, trackName: string }}
   */
  voiceActivatedRoadmap(topicQuery) {
    this.initDOM();

    // Populate search input
    const inputEl = document.getElementById('topic-user-query');
    if (inputEl) inputEl.value = topicQuery;

    // Close any open module reader
    this.closeModuleReader();

    // Run matcher
    const match = this.matchQueryToTopic(topicQuery);
    const resultsContainer = document.getElementById('topic-roadmap-results');
    if (!resultsContainer) {
      return { count: 0, trackName: topicQuery };
    }

    resultsContainer.style.display = 'block';

    if (match) {
      // Render DIAGRAM view (voice default)
      this.renderRoadmapDiagram(match, topicQuery);
      resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return { count: match.modules.length, trackName: match.pattern.displayName };
    } else {
      this.renderFallbackView(topicQuery);
      resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return { count: 0, trackName: topicQuery };
    }
  }

  // -------------------------------------------------------------------
  // Toggle between Card and Diagram views
  // -------------------------------------------------------------------
  toggleRoadmapView(mode) {
    const cardBtn = document.getElementById('rmv-btn-cards');
    const diagBtn = document.getElementById('rmv-btn-diagram');
    const cardView = document.getElementById('rmv-card-view');
    const diagView = document.getElementById('rmv-diagram-view');

    if (!cardView || !diagView) return;

    if (mode === 'diagram') {
      cardView.style.display = 'none';
      diagView.style.display = 'block';
      if (cardBtn) { cardBtn.classList.remove('rmv-toggle-active'); }
      if (diagBtn) { diagBtn.classList.add('rmv-toggle-active'); }
    } else {
      diagView.style.display = 'none';
      cardView.style.display = 'block';
      if (cardBtn) { cardBtn.classList.add('rmv-toggle-active'); }
      if (diagBtn) { diagBtn.classList.remove('rmv-toggle-active'); }
    }
  }

  // -------------------------------------------------------------------
  // Visual Flow-Diagram Renderer
  // -------------------------------------------------------------------

  /**
   * Renders the visual SVG flow-diagram roadmap alongside the regular
   * waterfall card list. Defaults to diagram view when called from voice.
   */
  renderRoadmapDiagram(matchResult, query) {
    const { pattern, modules, detectedLevel = 'BEGINNER', levelRationale = '' } = matchResult;
    this.currentCuratedModules = modules;
    const resultsContainer = document.getElementById('topic-roadmap-results');
    if (!resultsContainer) return;

    // ── Level colors ──────────────────────────────────────────
    const levelColors = {
      Beginner:     { node: '#0d9488', glow: 'rgba(13,148,136,0.55)', badge: '#14b8a6', text: '#ccfbf1' },
      Intermediate: { node: '#7c3aed', glow: 'rgba(124,58,237,0.55)', badge: '#8b5cf6', text: '#ede9fe' },
      Advanced:     { node: '#c2410c', glow: 'rgba(194,65,12,0.55)',  badge: '#f97316', text: '#ffedd5' },
    };

    // ── Build card HTML (same as renderCuratedRoadmap) ────────
    let cardsHtml = '';
    modules.forEach((mod, idx) => {
      const stepNum = idx + 1;
      const isPrereq = idx === 0 && modules.length > 1;
      const stepType = isPrereq ? 'Prerequisite Foundation' : (idx === modules.length - 1 ? 'Target Mastery Goal' : 'Core Concept');
      const hasLab = Boolean(mod.circuitPreset);

      cardsHtml += `
        <div class="waterfall-card-wrapper" style="--stagger-index: ${idx};">
          <div class="curated-module-card ${hasLab ? 'has-circuit-lab' : ''}" onclick="window.topicRoadmapManager.openModuleReader('${mod.id}')">
            <div class="curated-card-sidebar">
              <div class="curated-step-circle">${stepNum}</div>
              ${stepNum < modules.length ? '<div class="curated-timeline-stem"></div>' : ''}
            </div>
            <div class="curated-card-main">
              <div class="curated-card-header">
                <div class="curated-badge-group">
                  <span class="curated-step-tag">${stepType}</span>
                  <span class="curated-module-badge">${mod.number}</span>
                  <span class="curated-level-badge level-${mod.level.toLowerCase()}">${mod.level}</span>
                </div>
                <span class="curated-time-badge">${mod.timeEst}</span>
              </div>
              <h3 class="curated-card-title">${mod.title}</h3>
              <p class="curated-card-summary">${mod.summary}</p>
              <div class="curated-math-preview"><code>${mod.mathFormula}</code></div>
              <div class="curated-card-footer">
                ${hasLab ? `
                  <div class="curated-lab-pill">
                    <span class="lab-pill-dot"></span>
                    <span>Interactive Circuit Lab Attached</span>
                  </div>
                ` : `
                  <div class="curated-theory-pill">
                    <span class="theory-pill-dot"></span>
                    <span>Theoretical Foundations</span>
                  </div>
                `}
                <button class="btn-open-curated-module">
                  <span>Start ${mod.number}</span>
                  <span class="open-arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    // ── Build SVG diagram ──────────────────────────────────────
    const svgDiagram = this._buildRoadmapSVG(modules, levelColors);

    // ── Assemble full HTML ─────────────────────────────────────
    resultsContainer.innerHTML = `
      <div class="curated-results-header">
        <div class="curated-header-top">
          <span class="results-tag">ADAPTIVE PATHWAY ASSEMBLED</span>
          <span class="results-level-badge level-${detectedLevel.toLowerCase()}">${detectedLevel} TRACK</span>
          <span class="results-step-count">${modules.length} Ordered Steps to Mastery</span>
        </div>
        <h2 class="results-topic-title">${pattern.displayName}</h2>
        <p class="results-topic-desc">${pattern.description}</p>

        ${levelRationale ? `
          <div class="results-rationale-box">
            <span class="rationale-accent-bar"></span>
            <span class="rationale-text"><strong>Adaptive Reasoning:</strong> ${levelRationale}</span>
          </div>
        ` : ''}

        <div class="results-query-echo">
          <span class="echo-label">Matched Query:</span>
          <span class="echo-text">"${query}"</span>
        </div>

        <!-- View Toggle -->
        <div class="rmv-toggle-group" role="group" aria-label="Switch roadmap view">
          <button id="rmv-btn-cards" class="rmv-toggle-btn"
            onclick="window.topicRoadmapManager.toggleRoadmapView('cards')">
            📋 Module Cards
          </button>
          <button id="rmv-btn-diagram" class="rmv-toggle-btn rmv-toggle-active"
            onclick="window.topicRoadmapManager.toggleRoadmapView('diagram')">
            🗺 Flow Diagram
          </button>
        </div>
      </div>

      <!-- Diagram View (default when voice-activated) -->
      <div id="rmv-diagram-view" class="rmv-diagram-view">
        ${svgDiagram}
      </div>

      <!-- Card View (hidden by default when coming from voice) -->
      <div id="rmv-card-view" class="rmv-card-view" style="display:none;">
        <div class="waterfall-module-list">${cardsHtml}</div>
      </div>

      <div class="curated-bottom-actions">
        <p>Want to explore the entire curriculum without topic filtering?</p>
        <button class="btn-view-full-roadmap" onclick="window.switchView('docs')">
          Browse Full Learning Roadmap (All 10 Modules) →
        </button>
      </div>
    `;

    // Trigger staggered node entry animations
    setTimeout(() => {
      const nodes = resultsContainer.querySelectorAll('.rdg-node');
      nodes.forEach((node, i) => {
        node.style.animationDelay = `${i * 120}ms`;
        node.classList.add('rdg-node-animate');
      });
    }, 80);
  }

  /**
   * Builds the SVG roadmap flow diagram.
   * Layout: left-to-right row of 3, then wraps to new row.
   */
  _buildRoadmapSVG(modules, levelColors) {
    const COLS = 3;          // max nodes per row
    const NODE_W = 220;      // node width
    const NODE_H = 130;      // node height
    const COL_GAP = 80;      // horizontal gap between nodes
    const ROW_GAP = 90;      // vertical gap between rows
    const PAD = 30;          // canvas padding

    const rows = Math.ceil(modules.length / COLS);
    const cols = Math.min(modules.length, COLS);
    const svgW = cols * (NODE_W + COL_GAP) - COL_GAP + PAD * 2;
    const svgH = rows * (NODE_H + ROW_GAP) - ROW_GAP + PAD * 2;

    // Node positions
    const positions = modules.map((_, i) => {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      // Zigzag: even rows go left→right, odd rows right→left
      const actualCol = (row % 2 === 0) ? col : (Math.min(modules.length - row * COLS, COLS) - 1 - col);
      return {
        x: PAD + actualCol * (NODE_W + COL_GAP),
        y: PAD + row * (NODE_H + ROW_GAP),
      };
    });

    // Build arrow paths between consecutive nodes
    let arrowDefs = `
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" opacity="0.85"/>
        </marker>
        <filter id="node-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
    `;

    let arrows = '';
    for (let i = 0; i < modules.length - 1; i++) {
      const from = positions[i];
      const to   = positions[i + 1];

      const fromRow = Math.floor(i / COLS);
      const toRow   = Math.floor((i + 1) / COLS);

      let x1, y1, x2, y2, pathD;

      if (fromRow === toRow) {
        // Same row → horizontal arrow
        const fromDir = (fromRow % 2 === 0) ? 1 : -1;
        x1 = from.x + (fromDir > 0 ? NODE_W : 0);
        y1 = from.y + NODE_H / 2;
        x2 = to.x + (fromDir > 0 ? 0 : NODE_W);
        y2 = to.y + NODE_H / 2;
        // Bezier for smooth curve
        const cx1 = x1 + fromDir * 30, cy1 = y1, cx2 = x2 - fromDir * 30, cy2 = y2;
        pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
      } else {
        // Row transition → vertical arrow from bottom of from-node to top of to-node
        x1 = from.x + NODE_W / 2;
        y1 = from.y + NODE_H;
        x2 = to.x + NODE_W / 2;
        y2 = to.y;
        const midY = (y1 + y2) / 2;
        pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
      }

      arrows += `
        <path class="rdg-arrow" d="${pathD}"
          fill="none" stroke="#6366f1" stroke-width="2.5"
          stroke-dasharray="7 5" marker-end="url(#arrowhead)" opacity="0.78"/>
      `;
    }

    // Build nodes
    let nodesSVG = '';
    modules.forEach((mod, i) => {
      const pos  = positions[i];
      const lc   = levelColors[mod.level] || levelColors['Beginner'];
      const cx   = pos.x + NODE_W / 2;
      const cy   = pos.y + NODE_H / 2;
      const step = i + 1;

      nodesSVG += `
        <g class="rdg-node" data-module-id="${mod.id}"
          onclick="window.topicRoadmapManager.openModuleReader('${mod.id}')"
          style="cursor:pointer;"
          role="button" tabindex="0" aria-label="Open ${mod.number}: ${mod.title}">

          <!-- Glow backing -->
          <rect x="${pos.x - 6}" y="${pos.y - 6}"
            width="${NODE_W + 12}" height="${NODE_H + 12}"
            rx="18" fill="${lc.glow}" class="rdg-node-glow"/>

          <!-- Node body -->
          <rect x="${pos.x}" y="${pos.y}"
            width="${NODE_W}" height="${NODE_H}"
            rx="14"
            fill="#0d1225"
            stroke="${lc.node}"
            stroke-width="1.8"
            class="rdg-node-rect"/>

          <!-- Step number circle -->
          <circle cx="${pos.x + 24}" cy="${pos.y + 22}" r="13"
            fill="${lc.badge}" opacity="0.9"/>
          <text x="${pos.x + 24}" y="${pos.y + 27}"
            text-anchor="middle" font-size="11" font-weight="700"
            fill="#fff" font-family="Inter,sans-serif">${step}</text>

          <!-- Level badge pill -->
          <rect x="${pos.x + 42}" y="${pos.y + 11}"
            width="${mod.level.length * 7 + 14}" height="22"
            rx="11" fill="${lc.badge}" opacity="0.18"/>
          <text x="${pos.x + 49 + mod.level.length * 3.5}" y="${pos.y + 26}"
            text-anchor="middle" font-size="10" font-weight="600"
            fill="${lc.text}" font-family="Inter,sans-serif">${mod.level.toUpperCase()}</text>

          <!-- Module number label -->
          <text x="${pos.x + 12}" y="${pos.y + 56}"
            font-size="10" fill="#64748b" font-family="Inter,sans-serif"
            font-weight="500">${mod.number}</text>

          <!-- Title (word-wrap via 2 tspans) -->
          ${this._svgWordWrap(mod.title, pos.x + 12, pos.y + 71, NODE_W - 20, 13, '#e2e8f0')}

          <!-- Time estimate -->
          <text x="${pos.x + NODE_W - 10}" y="${pos.y + NODE_H - 10}"
            text-anchor="end" font-size="10" fill="#475569"
            font-family="Inter,sans-serif">⏱ ${mod.timeEst}</text>

          <!-- Circuit lab indicator dot -->
          ${mod.circuitPreset ? `
            <circle cx="${pos.x + 12}" cy="${pos.y + NODE_H - 12}" r="4"
              fill="#10b981" opacity="0.9"/>
            <text x="${pos.x + 20}" y="${pos.y + NODE_H - 9}"
              font-size="9" fill="#10b981"
              font-family="Inter,sans-serif">Circuit Lab</text>
          ` : ''}
        </g>
      `;
    });

    return `
      <div class="rdg-scroll-wrapper">
        <svg class="rdg-svg"
          viewBox="0 0 ${svgW} ${svgH}"
          width="${svgW}" height="${svgH}"
          xmlns="http://www.w3.org/2000/svg"
          role="img" aria-label="Roadmap flow diagram">
          ${arrowDefs}
          ${arrows}
          ${nodesSVG}
        </svg>

        <p class="rdg-click-hint">
          Click any node to open its full module reader with theory, math, and hands-on circuit lab.
        </p>
      </div>
    `;
  }

  /**
   * SVG text word-wrap helper — splits title into max 2 lines.
   */
  _svgWordWrap(text, x, y, maxWidth, fontSize, fill) {
    const avgCharW = fontSize * 0.58;
    const maxChars = Math.floor(maxWidth / avgCharW);

    if (text.length <= maxChars) {
      return `<text x="${x}" y="${y}" font-size="${fontSize}" fill="${fill}"
        font-family="Inter,sans-serif" font-weight="600">${text}</text>`;
    }

    // Find best split point near the middle
    const mid = Math.floor(text.length / 2);
    let splitAt = text.lastIndexOf(' ', mid + 10);
    if (splitAt < 1) splitAt = text.indexOf(' ', mid);
    if (splitAt < 1) splitAt = maxChars;

    const line1 = text.slice(0, splitAt).trim();
    const line2 = text.slice(splitAt).trim();

    return `<text x="${x}" y="${y}" font-size="${fontSize}" fill="${fill}"
      font-family="Inter,sans-serif" font-weight="600">
      <tspan x="${x}" dy="0">${line1}</tspan>
      <tspan x="${x}" dy="${fontSize + 2}">${line2}</tspan>
    </text>`;
  }
}


if (typeof window !== 'undefined') {
  window.TopicRoadmapManager = TopicRoadmapManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TopicRoadmapManager };
}
