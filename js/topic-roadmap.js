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
            <span class="topic-badge-icon">⚡</span>
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
                <span class="topic-search-icon">🔍</span>
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
                  <span class="btn-arrow">➔</span>
                </button>
              </div>
            </form>

            <!-- Quick Suggested Topic Chips -->
            <div class="topic-suggested-row">
              <span class="suggested-label">Featured tracks & topics:</span>
              <button class="topic-chip highlight-chip" style="background:rgba(66,133,244,0.18);border-color:rgba(66,133,244,0.45);color:#8ab4f8;font-weight:600;" onclick="window.topicRoadmapManager.loadTopicById('beginner-track')">
                🌱 Beginner Roadmap Track
              </button>
              <button class="topic-chip highlight-chip" style="background:rgba(234,67,53,0.15);border-color:rgba(234,67,53,0.4);color:#f28b82;font-weight:600;" onclick="window.topicRoadmapManager.loadTopicById('advanced-track')">
                🚀 Advanced Roadmap Track
              </button>
              <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('I want to learn how to make quantum circuits, I have 0 prior knowledge')">
                🛠️ Circuits for Beginners
              </button>
              <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('I want to understand quantum entanglement and Bell states')">
                🔮 Entanglement & Bell Pairs
              </button>
              <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('Explain quantum teleportation protocol')">
                📡 Quantum Teleportation
              </button>
              <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('How does Grover search algorithm work?')">
                🔍 Grover Algorithm
              </button>
              <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('Quantum chemistry and VQE molecular simulation')">
                🧪 VQE Molecular Chemistry
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

  // Topic Matching Engine
  matchQueryToTopic(query) {
    const clean = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const queryWords = clean.split(/\s+/).filter(w => w.length > 1);

    let bestPattern = null;
    let bestScore = 0;

    this.topicPatterns.forEach(pattern => {
      let score = 0;

      pattern.keywords.forEach(kw => {
        const kwLower = kw.toLowerCase();
        // Exact substring match gives high confidence
        if (clean.includes(kwLower)) {
          score += kwLower.length > 5 ? 30 : 15;
        }

        // Word overlap match
        const kwParts = kwLower.split(/\s+/);
        kwParts.forEach(kp => {
          if (queryWords.includes(kp)) {
            score += 8;
          }
        });
      });

      if (score > bestScore) {
        bestScore = score;
        bestPattern = pattern;
      }
    });

    // Score threshold
    if (bestScore >= 8 && bestPattern) {
      const matchedModules = bestPattern.moduleIds.map(id => this.modules.find(m => m.id === id)).filter(Boolean);
      return {
        pattern: bestPattern,
        modules: matchedModules,
        score: bestScore
      };
    }

    return null;
  }

  // Render Curated Ordered Module Sequence with Waterfall Staggered Animation
  renderCuratedRoadmap(matchResult, query) {
    const { pattern, modules } = matchResult;
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
                <span class="curated-time-badge">⏱️ ${mod.timeEst}</span>
              </div>

              <h3 class="curated-card-title">${mod.title}</h3>
              <p class="curated-card-summary">${mod.summary}</p>

              <div class="curated-math-preview">
                <code>${mod.mathFormula}</code>
              </div>

              <div class="curated-card-footer">
                ${hasLab ? `
                  <div class="curated-lab-pill">
                    <span class="lab-icon">⚡</span>
                    <span>Interactive Circuit Lab Attached</span>
                  </div>
                ` : `
                  <div class="curated-theory-pill">
                    <span class="theory-icon">📖</span>
                    <span>Theoretical Foundations</span>
                  </div>
                `}

                <button class="btn-open-curated-module">
                  <span>Start Module ${mod.number}</span>
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
          <span class="results-tag">✅ PATHWAY ASSEMBLED</span>
          <span class="results-step-count">${modules.length} Ordered Steps to Mastery</span>
        </div>
        <h2 class="results-topic-title">${pattern.displayName}</h2>
        <p class="results-topic-desc">${pattern.description}</p>
        
        <div class="results-query-echo">
          <span class="echo-label">Matched Intent:</span>
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
        <div class="fallback-icon-halo">🔬</div>
        <h2 class="fallback-title">No Direct Single-Topic Match Found</h2>
        <p class="fallback-desc">
          We couldn't automatically map <em>"${query}"</em> to a single specialized pathway, but here are the fastest ways to continue your quantum journey:
        </p>

        <div class="fallback-options-grid">
          <!-- Option 1: Full Learning Roadmap -->
          <div class="fallback-action-card" onclick="window.switchView('docs')">
            <span class="action-card-icon">🗺️</span>
            <h4>Browse Full Learning Roadmap</h4>
            <p>Explore all 10 core modules in sequential order from Hilbert space to VQE algorithms.</p>
            <span class="action-card-link">Open Full Curriculum →</span>
          </div>

          <!-- Option 2: Ask Concept Doctor -->
          <div class="fallback-action-card" onclick="window.switchView('intuition')">
            <span class="action-card-icon">🩺</span>
            <h4>Ask the AI Concept Doctor</h4>
            <p>Type your exact confusing topic to get physical analogies and real-time interactive simulations.</p>
            <span class="action-card-link">Launch Concept Doctor →</span>
          </div>

          <!-- Option 3: Global Knowledge Search -->
          <div class="fallback-action-card" onclick="window.focusKnowledgeEngineSearch()">
            <span class="action-card-icon">🔍</span>
            <h4>Search Global Knowledge Base</h4>
            <p>Search across 80+ quantum computing topics, arXiv landmark papers, and 74 quantum algorithms.</p>
            <span class="action-card-link">Open Knowledge Search (/) →</span>
          </div>
        </div>

        <div class="fallback-quick-re-search">
          <span>Or try one of our popular topics:</span>
          <div class="re-search-chips">
            <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('quantum circuits for beginners')">Quantum Circuits</button>
            <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('bell state entanglement')">Bell Entanglement</button>
            <button class="topic-chip" onclick="window.topicRoadmapManager.setQueryAndSearch('grover algorithm')">Grover Search</button>
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
            <span class="reader-module-time">⏱️ ${mod.timeEst}</span>
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
                <div class="theory-section-tag">📐 Mathematical Formulation</div>
                <div class="theory-math-block">
                  <code>${mod.mathFormula}</code>
                </div>
              </div>

              <div class="theory-section">
                <div class="theory-section-tag">💡 Physical Intuition</div>
                <p class="theory-text">${mod.intuition}</p>
              </div>

              ${hasCircuitLab ? `
                <div class="theory-exercise-box">
                  <div class="exercise-header">
                    <span class="exercise-icon">⚡</span>
                    <h4>Hands-on Circuit Exercise</h4>
                  </div>
                  <p class="exercise-instructions">${mod.exerciseGoal}</p>
                  <div class="exercise-actions">
                    <button class="btn-load-exercise" onclick="window.topicRoadmapManager.loadExerciseIntoLab('${mod.circuitPreset}')">
                      ↻ Reset Exercise Circuit
                    </button>
                  </div>
                </div>
              ` : `
                <div class="theory-notice-box">
                  <span>📖 This module focuses on foundational theoretical principles. Next step in your pathway includes interactive circuit synthesis.</span>
                </div>
              `}

              <div class="theory-nav-footer">
                <button class="btn-view-doc-manual" onclick="window.switchView('docs'); window.scrollDocIntoView(null, '${mod.docId}')">
                  View Full Architecture Spec in Technical Manual ↗
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
}

if (typeof window !== 'undefined') {
  window.TopicRoadmapManager = TopicRoadmapManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TopicRoadmapManager };
}
