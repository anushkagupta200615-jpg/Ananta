/**
 * QuantaAI - Intelligent Quantum Tutor & Real-Time Circuit Explainer
 * Translates circuit state vectors, matrix operations, and quantum phenomena into plain English or formal Dirac notation.
 */

class QuantaAITutor {
  constructor() {
    this.mode = 'beginner'; // 'beginner' or 'academic'
    this.explanationBox = document.getElementById('ai-explanation-text');
    this.chatHistory = document.getElementById('ai-chat-history');
    this.chatInput = document.getElementById('ai-chat-input');
    this.sendBtn = document.getElementById('btn-send-ai');
    this.modeToggle = document.getElementById('ai-mode-toggle');

    this.bindEvents();
  }

  bindEvents() {
    if (this.modeToggle) {
      this.modeToggle.addEventListener('change', (e) => {
        this.mode = e.target.checked ? 'academic' : 'beginner';
        const label = document.getElementById('ai-mode-label');
        if (label) {
          label.textContent = this.mode === 'academic' ? 'Academic (Math / Dirac)' : 'Intuitive (Beginner ELI5)';
        }
        if (window.circuitUI) {
          window.circuitUI.updateSimulation();
        }
      });
    }

    if (this.sendBtn && this.chatInput) {
      this.sendBtn.addEventListener('click', () => this.handleUserMessage());
      this.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleUserMessage();
      });
    }

    // Pre-set prompt chips
    const promptChips = document.querySelectorAll('.prompt-chip');
    promptChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        if (query) {
          this.respondToPrompt(query);
        }
      });
    });
  }

  onCircuitChanged(grid, probs, blochCoords, selectedQubit) {
    const explanation = this.analyzeCircuit(grid, probs, blochCoords, selectedQubit);
    this.renderExplanation(explanation);
  }

  analyzeCircuit(grid, probs, bloch, selectedQubit) {
    // Check if circuit is empty
    const allGates = grid.flat().filter(Boolean);
    if (allGates.length === 0) {
      if (this.mode === 'beginner') {
        return {
          title: "Ground State (|000⟩)",
          summary: "Your circuit is currently at rest in the classical ground state |000⟩.",
          details: "Think of this like a light switch turned firmly OFF with 100% certainty. To experience quantum behavior, try dragging an <strong>H (Hadamard)</strong> gate onto Qubit 0 to put it into superposition!"
        };
      } else {
        return {
          title: "Initial Pure State |0⟩⊗3",
          summary: "Statevector: |ψ⟩ = 1.00|000⟩ + 0.00|001⟩ + ... + 0.00|111⟩.",
          details: "All qubits reside in the computational basis ground state |0⟩ with density operator ρ = |000⟩⟨000|. Trace distance to ground is zero."
        };
      }
    }

    // Check for Bell State: H on q0, CX_CTRL on q0, CX_TGT on q1
    const hasH0 = grid[0].some(g => g === 'H');
    const hasCX = grid[0].some((g, c) => g === 'CX_CTRL' && grid[1][c] === 'CX_TGT');
    const p000 = probs.find(p => p.state === '|000⟩')?.probability || 0;
    const p110 = probs.find(p => p.state === '|110⟩')?.probability || 0;
    const p011 = probs.find(p => p.state === '|011⟩')?.probability || 0;

    // Check equal superposition on 2 qubits
    const nonZeroProbs = probs.filter(p => p.probability > 0.08);

    if (hasH0 && hasCX && nonZeroProbs.length === 2) {
      if (this.mode === 'beginner') {
        return {
          title: "Quantum Entanglement Created (Bell State)",
          summary: "You have created 'spooky action at a distance'! Qubit 0 and Qubit 1 are inextricably linked.",
          details: "Notice that there are only two possible outcomes: both are 0 (|000⟩) or both are 1. You will never observe one as 0 and the other as 1! If you measure Qubit 0 here, Qubit 1's state is instantly determined, even if separated by galaxies."
        };
      } else {
        return {
          title: "Maximally Entangled Bell Pair |Φ⁺⟩",
          summary: "Statevector: |ψ⟩ = 1/√2 (|00⟩ + |11⟩) ⊗ |0⟩₂.",
          details: "The reduced density matrix for Qubit 0 has Tr(ρ₀²) = 0.5 < 1, confirming it is in a mixed state locally despite the global system being pure. Von Neumann entropy S(ρ₀) = 1 bit (maximum entanglement)."
        };
      }
    }

    // Check single qubit Hadamard (Superposition)
    if (hasH0 && !hasCX && nonZeroProbs.length === 2) {
      if (this.mode === 'beginner') {
        return {
          title: "Equal Superposition (Quantum Coin Flip)",
          summary: "Qubit 0 is now in a 50/50 superposition.",
          details: "Unlike a classical bit that is either 0 or 1, Qubit 0 behaves like a spinning coin in mid-air. It exists in both states simultaneously until observed! Notice on the Bloch Sphere, the vector has rotated from the North Pole down to the equator (+X axis)."
        };
      } else {
        return {
          title: "Hadamard Transformation H|0⟩ = |+⟩",
          summary: "|ψ⟩ = 1/√2 (|0⟩ + |1⟩) = |+⟩ on Qubit 0.",
          details: "The Hadamard unitary H = 1/√2 [[1, 1], [1, -1]] rotates the Z-basis state into the X-basis. Expectation values: ⟨X⟩ = 1.0, ⟨Y⟩ = 0.0, ⟨Z⟩ = 0.0."
        };
      }
    }

    // Check Pauli-X (Bit Flip)
    const hasX = grid[selectedQubit].some(g => g === 'X');
    if (hasX && nonZeroProbs.length === 1 && bloch.z < -0.9) {
      if (this.mode === 'beginner') {
        return {
          title: "Quantum Bit Flip (Pauli-X)",
          summary: "Pauli-X flipped the qubit from |0⟩ to |1⟩.",
          details: "This is the quantum equivalent of a classical NOT gate. On the Bloch Sphere, the state vector has flipped 180 degrees from the North Pole (|0⟩) straight down to the South Pole (|1⟩)."
        };
      } else {
        return {
          title: "Pauli-X Unitary Transformation X|0⟩ = |1⟩",
          summary: "Pauli-X = [[0, 1], [1, 0]] acts as σₓ reflection across the X-Z plane.",
          details: "⟨Z⟩ eigenvalue flipped from +1 to -1. Measurement in computational basis yields state |1⟩ with probability 1.0."
        };
      }
    }

    // General state description
    const activeStatesStr = nonZeroProbs.map(p => `${p.state} (${(p.probability * 100).toFixed(0)}%)`).join(', ');
    if (this.mode === 'beginner') {
      return {
        title: "Active Multi-Qubit Interference",
        summary: `The circuit produces outcomes: ${activeStatesStr}.`,
        details: `Quantum gates are rotating phase angles and shifting probability amplitudes across the computational basis states. Try tweaking or removing a gate to watch the probability distribution re-balance in real time!`
      };
    } else {
      return {
        title: "Unitary Evolution U_total |000⟩",
        summary: `Superposition across ${nonZeroProbs.length} basis states: ${activeStatesStr}.`,
        details: `The circuit executes the composite unitary U = ∏ U_t. Normalized statevector amplitude satisfies ∑ |c_i|² = 1.00.`
      };
    }
  }

  renderExplanation(exp) {
    if (!this.explanationBox) return;
    this.explanationBox.innerHTML = `
      <div class="exp-card">
        <div class="exp-badge">Live Analysis</div>
        <h4 class="exp-title">${exp.title}</h4>
        <p class="exp-summary">${exp.summary}</p>
        <p class="exp-details">${exp.details}</p>
      </div>
    `;
  }

  handleUserMessage() {
    const text = this.chatInput.value.trim();
    if (!text) return;

    this.addChatMessage(text, 'user');
    this.chatInput.value = '';

    // Generate AI response
    setTimeout(() => {
      const reply = this.generateAIResponse(text);
      this.addChatMessage(reply, 'ai');
    }, 450);
  }

  respondToPrompt(promptText) {
    this.addChatMessage(promptText, 'user');
    setTimeout(() => {
      const reply = this.generateAIResponse(promptText);
      this.addChatMessage(reply, 'ai');
    }, 350);
  }

  generateAIResponse(query) {
    const q = query.toLowerCase();

    if (q.includes('superposition')) {
      return `<strong>Superposition</strong> is the fundamental ability of a quantum system to exist in multiple states simultaneously until it is measured.<br><br>
In classical computing, a bit is strictly 0 or 1 (like a light switch). In quantum computing, a qubit is a linear combination of both states: <code>|ψ⟩ = α|0⟩ + β|1⟩</code>, where |α|² and |β|² are the probabilities of finding the qubit in 0 or 1. Applying a <strong>Hadamard (H)</strong> gate rotates a state into equal superposition!`;
    }

    if (q.includes('bell') || q.includes('entangle')) {
      return `<strong>Quantum Entanglement</strong> occurs when two or more qubits become correlated such that the quantum state of one cannot be described independently of the other.<br><br>
In our simulator, you create a <strong>Bell State</strong> by placing a <strong>Hadamard (H)</strong> gate on Qubit 0 (putting it in superposition), followed by a <strong>CNOT (CX)</strong> gate targeting Qubit 1. This yields <code>1/√2 (|00⟩ + |11⟩)</code>. Measuring Qubit 0 instantly determines the state of Qubit 1, regardless of spatial separation.`;
    }

    if (q.includes('grover')) {
      return `<strong>Grover's Algorithm</strong> provides a quadratic speedup for searching an unsorted database of N items in O(√N) time compared to classical O(N).<br><br>
It works through two key steps repeatedly applied:
1. <strong>The Quantum Oracle:</strong> Flips the phase (negative sign) of the target state we are searching for.
2. <strong>The Diffusion Operator (Inversion about the mean):</strong> Uses quantum constructive interference to amplify the probability of the marked state while causing destructive interference on all non-marked states.`;
    }

    if (q.includes('bloch') || q.includes('sphere')) {
      return `The <strong>Bloch Sphere</strong> is a geometric representation of a 2-level quantum state (a single qubit).<br><br>
- The <strong>North Pole</strong> corresponds to pure state |0⟩.
- The <strong>South Pole</strong> corresponds to pure state |1⟩.
- The <strong>Equator</strong> represents equal superposition states with varying phases (like |+⟩, |-⟩, |+i⟩, |-i⟩).
- Applying single-qubit gates corresponds directly to 3D rotations of the state vector arrow around the sphere!`;
    }

    if (q.includes('hadamard') || q.includes('h gate')) {
      return `The <strong>Hadamard (H) gate</strong> is the 'gateway to quantum computing'. It transforms basis states into superpositions:<br><br>
- <code>H|0⟩ = (|0⟩ + |1⟩)/√2 = |+⟩</code>
- <code>H|1⟩ = (|0⟩ - |1⟩)/√2 = |-⟩</code><br>
It has the unique property of being its own inverse: applying H twice in a row returns the qubit back to its original state!`;
    }

    if (q.includes('decoherence') || q.includes('noise')) {
      return `<strong>Quantum Decoherence</strong> is the loss of quantum coherence caused by unwanted interactions between a qubit and its surrounding environment (thermal vibrations, magnetic fields, etc.).<br><br>
Decoherence causes delicate superposition and entanglement to decay into classical noise. Modern quantum error correction (QEC) and fault-tolerant architectures are being engineered to overcome this challenge.`;
    }

    return `That's an insightful quantum computing question! In this platform, every gate you place alters the statevector amplitudes and rotates the 3D Bloch sphere. Try experimenting with the presets in the <strong>Algorithm Labs</strong> tab to see how canonical algorithms harness superposition, phase shifts, and entanglement!`;
  }

  addChatMessage(content, sender) {
    if (!this.chatHistory) return;
    const msg = document.createElement('div');
    msg.className = `chat-bubble chat-${sender}`;
    msg.innerHTML = `
      <div class="chat-sender-label">${sender === 'ai' ? 'QuantaAI Co-Pilot' : 'You'}</div>
      <div class="chat-text">${content}</div>
    `;
    this.chatHistory.appendChild(msg);
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
  }
}

window.QuantaAITutor = QuantaAITutor;
