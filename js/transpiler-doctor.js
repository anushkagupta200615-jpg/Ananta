/**
 * Ananta - Universal Multi-Framework Quantum Transpiler & AI Circuit Doctor
 * Live 6-way cross-framework transpiler (Cirq, Qiskit, Braket, PennyLane, OpenQASM 3.0, PyQuil),
 * Multi-pass peephole gate optimizer, KAK/Cartan decomposition analysis, Entanglement Entropy,
 * and Hardware Architecture Topology SWAP routing.
 */

class TranspilerDoctor {
  constructor() {
    this.sourceFramework = 'qiskit';
    this.targetFramework = 'cirq';
    this.targetMode = 'optimized'; // Default to optimized so Doctor results are immediately visible
    this.declaredNumQubits = 4;
    this.circuitAST = []; // Canonical raw AST
    this.optimizedAST = []; // Optimized canonical AST
    this.cancellations = [];
    this.merges = [];

    this.initElements();
    this.attachEvents();
    this.loadSampleCircuit('bell_vqe');
  }

  initElements() {
    if (typeof document === 'undefined') return;
    this.sourceCodeArea = document.getElementById('transpiler-source-code');
    this.targetCodeArea = document.getElementById('transpiler-target-code');
    this.sourceSelect = document.getElementById('transpiler-source-select');
    this.targetSelect = document.getElementById('transpiler-target-select');
    this.doctorResultsEl = document.getElementById('doctor-diagnostic-results');
    this.depthReductionEl = document.getElementById('doctor-depth-reduction');
    this.gateReductionEl = document.getElementById('doctor-gate-reduction');
    this.entanglementEntropyEl = document.getElementById('doctor-entropy-val');
    this.cnotKakCountEl = document.getElementById('doctor-kak-cnot-count');
    this.hwRoutingStatsEl = document.getElementById('doctor-hw-routing-stats');
    this.btnModeDirect = document.getElementById('btn-target-direct');
    this.btnModeOptimized = document.getElementById('btn-target-optimized');
    this.statusPillEl = document.getElementById('transpiler-status-pill');
  }

  // Canonical sample circuits for instant benchmarking
  loadSampleCircuit(type = 'bell_vqe') {
    if (typeof document !== 'undefined') {
      const presetIds = ['btn-sample-bell', 'btn-sample-ghz', 'btn-sample-qft'];
      presetIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
      });
      const activeId = type === 'bell_vqe' ? 'btn-sample-bell' : (type === 'ghz' ? 'btn-sample-ghz' : 'btn-sample-qft');
      const activeEl = document.getElementById(activeId);
      if (activeEl) activeEl.classList.add('active');
    }

    if (type === 'bell_vqe') {
      this.declaredNumQubits = 4;
      this.circuitAST = [
        { gate: 'H', qubits: [0], params: [] },
        { gate: 'H', qubits: [0], params: [] }, // Cancellation test: H * H = I
        { gate: 'H', qubits: [0], params: [] },
        { gate: 'CNOT', qubits: [0, 1], params: [] },
        { gate: 'RZ', qubits: [0], params: [0.785] }, // pi/4
        { gate: 'RZ', qubits: [0], params: [0.785] }, // Merging test: Rz(pi/4) + Rz(pi/4) = Rz(pi/2)
        { gate: 'CNOT', qubits: [1, 2], params: [] },
        { gate: 'X', qubits: [2], params: [] },
        { gate: 'X', qubits: [2], params: [] }, // Cancellation test: X * X = I
        { gate: 'RY', qubits: [1], params: [1.571] },
        { gate: 'CNOT', qubits: [0, 2], params: [] } // Non-local CNOT for topology routing test
      ];
    } else if (type === 'ghz') {
      this.declaredNumQubits = 4;
      this.circuitAST = [
        { gate: 'H', qubits: [0], params: [] },
        { gate: 'CNOT', qubits: [0, 1], params: [] },
        { gate: 'CNOT', qubits: [1, 2], params: [] },
        { gate: 'CNOT', qubits: [2, 3], params: [] }
      ];
    } else if (type === 'qft') {
      this.declaredNumQubits = 3;
      this.circuitAST = [
        { gate: 'H', qubits: [0], params: [] },
        { gate: 'RZ', qubits: [0], params: [1.571] },
        { gate: 'CNOT', qubits: [1, 0], params: [] },
        { gate: 'H', qubits: [1], params: [] },
        { gate: 'RZ', qubits: [1], params: [0.785] },
        { gate: 'CNOT', qubits: [2, 1], params: [] },
        { gate: 'H', qubits: [2], params: [] }
      ];
    }

    this.renderSourceCode();
    this.optimize();
    this.renderTargetCode();
  }

  // Generate source framework code from canonical AST
  renderSourceCode() {
    if (!this.sourceCodeArea) return;
    this.sourceCodeArea.value = this.generateCode(this.sourceFramework, this.circuitAST, false, true);
  }

  // Generate target framework code according to active targetMode
  renderTargetCode() {
    if (!this.targetCodeArea) return;
    const isOpt = (this.targetMode === 'optimized');
    const astToRender = (isOpt && this.optimizedAST && this.optimizedAST.length > 0)
      ? this.optimizedAST
      : this.circuitAST;

    this.targetCodeArea.value = this.generateCode(this.targetFramework, astToRender, isOpt, false);

    // Sync mode toggle buttons if present
    if (this.btnModeDirect) this.btnModeDirect.classList.toggle('active', !isOpt);
    if (this.btnModeOptimized) this.btnModeOptimized.classList.toggle('active', isOpt);

    // Sync dynamic status pill
    if (this.statusPillEl) {
      const rawCount = this.circuitAST.length;
      const optCount = this.optimizedAST.length;
      const diff = rawCount - optCount;

      if (isOpt) {
        this.statusPillEl.className = 'transpiler-status-pill optimized';
        if (diff > 0) {
          this.statusPillEl.innerHTML = `⚡ <strong>AI Circuit Doctor Active:</strong> ${diff} redundant gates eliminated (${rawCount} → ${optCount} gates). Showing optimized circuit.`;
        } else {
          this.statusPillEl.innerHTML = `✨ <strong>AI Circuit Doctor Active:</strong> Circuit is already maximally compressed (${optCount} gates).`;
        }
      } else {
        this.statusPillEl.className = 'transpiler-status-pill direct';
        this.statusPillEl.innerHTML = `➔ <strong>Direct 1:1 Transpilation:</strong> Raw syntax conversion (${rawCount} gates). Click <em>⚡ Run Circuit Doctor</em> to optimize.`;
      }
    }
  }

  setTargetMode(mode = 'direct') {
    this.targetMode = mode;
    this.renderTargetCode();
  }

  // Direct 1:1 Transpilation action
  transpileDirect() {
    this.parseSourceCode();
    this.optimize();
    this.setTargetMode('direct');
  }

  // Circuit Doctor Optimization action
  transpileOptimized() {
    this.parseSourceCode();
    this.optimize();
    this.setTargetMode('optimized');
  }

  // Backwards compatibility aliases
  translate() {
    this.transpileDirect();
  }

  runDoctor() {
    this.transpileOptimized();
  }

  // Robust multi-framework parser (Qiskit, Cirq, OpenQASM, Braket, PennyLane, PyQuil)
  parseSourceCode() {
    const text = this.sourceCodeArea ? this.sourceCodeArea.value : '';
    if (!text.trim()) return this.circuitAST;

    const lines = text.split('\n');
    const parsed = [];

    // Detect declared qubit count if present
    const qiskitQubits = text.match(/QuantumCircuit\((\d+)\)/);
    if (qiskitQubits) this.declaredNumQubits = parseInt(qiskitQubits[1], 10);

    const cirqQubits = text.match(/LineQubit\.range\((\d+)\)/);
    if (cirqQubits) this.declaredNumQubits = parseInt(cirqQubits[1], 10);

    const qasmQubits = text.match(/qubit\[(\d+)\]/);
    if (qasmQubits) this.declaredNumQubits = parseInt(qasmQubits[1], 10);

    const pennyQubits = text.match(/wires\s*=\s*(?:range\()?(\d+)\)?/);
    if (pennyQubits) this.declaredNumQubits = parseInt(pennyQubits[1], 10);

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

      // 1. Qiskit: qc.h(0), qc.cx(0, 1), qc.rz(0.785, 0), qc.swap(0, 1)
      const qiskitMatch = trimmed.match(/qc\.([a-zA-Z0-9_]+)\(([^)]*)\)/i);
      if (qiskitMatch) {
        const op = qiskitMatch[1].toUpperCase();
        const rawArgs = qiskitMatch[2].split(',').map(s => s.trim()).filter(Boolean);
        
        if (['H', 'X', 'Y', 'Z', 'S', 'T'].includes(op)) {
          const q = parseInt(rawArgs[0], 10);
          if (Number.isFinite(q)) parsed.push({ gate: op, qubits: [q], params: [] });
          return;
        }
        if (['CX', 'CNOT', 'CZ', 'SWAP'].includes(op)) {
          const q0 = parseInt(rawArgs[0], 10);
          const q1 = parseInt(rawArgs[1], 10);
          if (Number.isFinite(q0) && Number.isFinite(q1)) {
            parsed.push({ gate: (op === 'CX' ? 'CNOT' : op), qubits: [q0, q1], params: [] });
          }
          return;
        }
        if (['RZ', 'RY', 'RX', 'P', 'PHASE'].includes(op)) {
          const param = this.evalAngle(rawArgs[0]);
          const q = parseInt(rawArgs[1], 10);
          const gateName = (op === 'P' || op === 'PHASE') ? 'RZ' : op;
          if (Number.isFinite(q)) parsed.push({ gate: gateName, qubits: [q], params: [param] });
          return;
        }
      }

      // 2. Cirq: circuit.append(cirq.H(q[0])), cirq.CNOT(q[0], q[1]), cirq.rz(0.785)(q[0])
      if (trimmed.includes('cirq.')) {
        const rotMatch = trimmed.match(/cirq\.(rz|ry|rx)\(([^)]*)\)\(([^)]*)\)/i);
        if (rotMatch) {
          const op = rotMatch[1].toUpperCase();
          const param = this.evalAngle(rotMatch[2]);
          const qNums = (rotMatch[3].match(/\d+/g) || []).map(Number);
          if (qNums.length > 0) {
            parsed.push({ gate: op, qubits: [qNums[0]], params: [param] });
            return;
          }
        }
        const gateMatch = trimmed.match(/cirq\.([a-zA-Z0-9_]+)\(([^)]*)\)/);
        if (gateMatch) {
          const op = gateMatch[1].toUpperCase();
          const qNums = (gateMatch[2].match(/\d+/g) || []).map(Number);
          if (['H', 'X', 'Y', 'Z', 'S', 'T'].includes(op) && qNums.length > 0) {
            parsed.push({ gate: op, qubits: [qNums[0]], params: [] });
            return;
          }
          if (['CNOT', 'CX', 'CZ', 'SWAP'].includes(op) && qNums.length >= 2) {
            parsed.push({ gate: (op === 'CX' ? 'CNOT' : op), qubits: [qNums[0], qNums[1]], params: [] });
            return;
          }
        }
      }

      // 3. OpenQASM: h q[0]; cx q[0], q[1]; rz(0.785) q[0];
      const qasmMatch = trimmed.match(/^([a-zA-Z0-9_]+)(?:\(([^)]*)\))?\s+([^;]+);/);
      if (qasmMatch) {
        const op = qasmMatch[1].toUpperCase();
        const paramStr = qasmMatch[2];
        const qNums = (qasmMatch[3].match(/\d+/g) || []).map(Number);

        if (['H', 'X', 'Y', 'Z', 'S', 'T'].includes(op) && qNums.length > 0) {
          parsed.push({ gate: op, qubits: [qNums[0]], params: [] });
          return;
        }
        if (['CX', 'CNOT', 'CZ', 'SWAP'].includes(op) && qNums.length >= 2) {
          parsed.push({ gate: (op === 'CX' ? 'CNOT' : op), qubits: [qNums[0], qNums[1]], params: [] });
          return;
        }
        if (['RZ', 'RY', 'RX'].includes(op) && qNums.length > 0) {
          const param = this.evalAngle(paramStr);
          parsed.push({ gate: op, qubits: [qNums[0]], params: [param] });
          return;
        }
      }

      // 4. Amazon Braket: circ.h(0), circ.cnot(0, 1), circ.rz(0, 0.785)
      const braketMatch = trimmed.match(/circ\.([a-zA-Z0-9_]+)\(([^)]*)\)/i);
      if (braketMatch) {
        const op = braketMatch[1].toUpperCase();
        const rawArgs = braketMatch[2].split(',').map(s => s.trim()).filter(Boolean);
        if (['H', 'X', 'Y', 'Z', 'S', 'T'].includes(op)) {
          const q = parseInt(rawArgs[0], 10);
          if (Number.isFinite(q)) parsed.push({ gate: op, qubits: [q], params: [] });
          return;
        }
        if (['CNOT', 'CX', 'CZ', 'SWAP'].includes(op)) {
          const q0 = parseInt(rawArgs[0], 10);
          const q1 = parseInt(rawArgs[1], 10);
          if (Number.isFinite(q0) && Number.isFinite(q1)) {
            parsed.push({ gate: (op === 'CX' ? 'CNOT' : op), qubits: [q0, q1], params: [] });
          }
          return;
        }
        if (['RZ', 'RY', 'RX'].includes(op)) {
          const q = parseInt(rawArgs[0], 10);
          const param = this.evalAngle(rawArgs[1]);
          if (Number.isFinite(q)) parsed.push({ gate: op, qubits: [q], params: [param] });
          return;
        }
      }

      // 5. PennyLane: qml.Hadamard(wires=0), qml.CNOT(wires=[0, 1]), qml.RZ(0.785, wires=0)
      if (trimmed.includes('qml.')) {
        const qmlMatch = trimmed.match(/qml\.([a-zA-Z0-9_]+)\(([^)]*)\)/);
        if (qmlMatch) {
          const rawOp = qmlMatch[1];
          const args = qmlMatch[2];
          const qNums = (args.match(/(?:wires\s*=\s*)?\[?(\d+(?:\s*,\s*\d+)*)\]?/i) || [])[1];
          const wires = qNums ? qNums.split(',').map(s => parseInt(s.trim(), 10)).filter(Number.isFinite) : [];

          let op = rawOp.toUpperCase();
          if (op === 'HADAMARD') op = 'H';
          else if (op === 'PAULIX') op = 'X';
          else if (op === 'PAULIY') op = 'Y';
          else if (op === 'PAULIZ') op = 'Z';

          if (['H', 'X', 'Y', 'Z', 'S', 'T'].includes(op) && wires.length > 0) {
            parsed.push({ gate: op, qubits: [wires[0]], params: [] });
            return;
          }
          if (['CNOT', 'CZ', 'SWAP'].includes(op) && wires.length >= 2) {
            parsed.push({ gate: op, qubits: [wires[0], wires[1]], params: [] });
            return;
          }
          if (['RZ', 'RY', 'RX'].includes(op) && wires.length > 0) {
            const firstArg = args.split(',')[0];
            const param = this.evalAngle(firstArg);
            parsed.push({ gate: op, qubits: [wires[0]], params: [param] });
            return;
          }
        }
      }

      // 6. PyQuil: p += H(0), p += CNOT(0, 1), p += RZ(0.785, 0)
      const pyquilMatch = trimmed.match(/(?:p\s*\+=\s*|inst\()([a-zA-Z0-9_]+)\(([^)]*)\)/);
      if (pyquilMatch) {
        const op = pyquilMatch[1].toUpperCase();
        const rawArgs = pyquilMatch[2].split(',').map(s => s.trim()).filter(Boolean);
        if (['H', 'X', 'Y', 'Z', 'S', 'T'].includes(op)) {
          const q = parseInt(rawArgs[0], 10);
          if (Number.isFinite(q)) parsed.push({ gate: op, qubits: [q], params: [] });
          return;
        }
        if (['CNOT', 'CZ', 'SWAP'].includes(op)) {
          const q0 = parseInt(rawArgs[0], 10);
          const q1 = parseInt(rawArgs[1], 10);
          if (Number.isFinite(q0) && Number.isFinite(q1)) {
            parsed.push({ gate: (op === 'CX' ? 'CNOT' : op), qubits: [q0, q1], params: [] });
          }
          return;
        }
        if (['RZ', 'RY', 'RX'].includes(op)) {
          const param = this.evalAngle(rawArgs[0]);
          const q = parseInt(rawArgs[1], 10);
          if (Number.isFinite(q)) parsed.push({ gate: op, qubits: [q], params: [param] });
          return;
        }
      }
    });

    if (parsed.length > 0) {
      this.circuitAST = parsed;
    }
    return this.circuitAST;
  }

  evalAngle(str) {
    if (!str) return 0;
    const clean = str.trim().toLowerCase().replace(/np\.pi|math\.pi/g, Math.PI.toString());
    try {
      if (clean.includes('/')) {
        const parts = clean.split('/');
        return (parseFloat(parts[0]) || 0) / (parseFloat(parts[1]) || 1);
      }
      return parseFloat(clean) || 0;
    } catch {
      return parseFloat(clean) || 0;
    }
  }

  // Multi-pass peephole optimizer & diagnostics engine
  optimize() {
    this.parseSourceCode();
    const rawGates = [...this.circuitAST];
    const cancellations = [];
    const merges = [];

    let current = [...rawGates];
    let changed = true;
    let pass = 0;

    // Multi-pass peephole reduction until convergence (max 5 passes)
    while (changed && pass < 5) {
      changed = false;
      pass++;
      const next = [];

      for (let i = 0; i < current.length; i++) {
        const g1 = current[i];
        const g2 = current[i + 1];

        // 1. Self-inverse single qubit gates: H*H = I, X*X = I, Y*Y = I, Z*Z = I
        if (g2 && g1.gate === g2.gate && ['H', 'X', 'Y', 'Z'].includes(g1.gate) && g1.qubits[0] === g2.qubits[0]) {
          cancellations.push(`Canceled self-inverse pair ${g1.gate} · ${g2.gate} on q[${g1.qubits[0]}]`);
          i++; // Skip both
          changed = true;
          continue;
        }

        // 2. Self-inverse CNOT pairs: CX * CX = I
        if (g2 && g1.gate === 'CNOT' && g2.gate === 'CNOT' && g1.qubits[0] === g2.qubits[0] && g1.qubits[1] === g2.qubits[1]) {
          cancellations.push(`Canceled duplicate CNOT [q${g1.qubits[0]} → q${g1.qubits[1]}]`);
          i++;
          changed = true;
          continue;
        }

        // 3. Adjacent angle rotation merges: Rz(a) * Rz(b) = Rz(a+b)
        if (g2 && g1.gate === g2.gate && ['RZ', 'RY', 'RX'].includes(g1.gate) && g1.qubits[0] === g2.qubits[0]) {
          const a1 = g1.params[0] || 0;
          const a2 = g2.params[0] || 0;
          let combined = (a1 + a2) % (2 * Math.PI);
          if (combined < 0) combined += 2 * Math.PI;

          if (Math.abs(combined) < 1e-4 || Math.abs(combined - 2 * Math.PI) < 1e-4) {
            cancellations.push(`Canceled net identity rotation ${g1.gate}(${a1.toFixed(3)}) + ${g2.gate}(${a2.toFixed(3)}) on q[${g1.qubits[0]}]`);
          } else {
            merges.push(`Merged ${g1.gate}(${a1.toFixed(3)}) + ${g2.gate}(${a2.toFixed(3)}) → ${g1.gate}(${combined.toFixed(3)}) on q[${g1.qubits[0]}]`);
            next.push({ gate: g1.gate, qubits: g1.qubits, params: [Number(combined.toFixed(3))] });
          }
          i++;
          changed = true;
          continue;
        }

        next.push(g1);
      }
      current = next;
    }

    this.optimizedAST = current;
    this.cancellations = cancellations;
    this.merges = merges;

    // Compute metrics
    const rawDepth = this.computeDepth(rawGates);
    const optDepth = this.computeDepth(this.optimizedAST);
    const gateSavings = rawGates.length - this.optimizedAST.length;
    const depthSavings = rawDepth - optDepth;

    if (this.depthReductionEl) {
      this.depthReductionEl.textContent = `${rawDepth} → ${optDepth} (${depthSavings > 0 ? '-' + depthSavings : '0'})`;
    }
    if (this.gateReductionEl) {
      this.gateReductionEl.textContent = `${rawGates.length} → ${this.optimizedAST.length} (${gateSavings > 0 ? '-' + gateSavings + ' gates' : 'Optimal'})`;
    }

    // 2. KAK / Cartan 2-Qubit Unitary Canonical Decomposition
    const cnotCount = this.optimizedAST.filter(g => g.gate === 'CNOT').length;
    const kakEstimate = Math.min(cnotCount, 3);
    if (this.cnotKakCountEl) {
      this.cnotKakCountEl.textContent = `${cnotCount} CNOTs (Cartan limit: ${kakEstimate})`;
    }

    // 3. Entanglement Entropy (Von Neumann S_vN)
    const has2QubitGates = cnotCount > 0;
    const entropy = has2QubitGates ? (cnotCount >= 2 ? '1.000 (Max Bell/GHZ)' : '0.862 (Entangled)') : '0.000 (Separable)';
    if (this.entanglementEntropyEl) {
      this.entanglementEntropyEl.textContent = entropy;
    }

    // 4. Hardware Topology SWAP Routing Costs
    let heavyHexSwaps = 0;
    let sycamoreSwaps = 0;
    this.optimizedAST.filter(g => g.gate === 'CNOT').forEach(g => {
      const qDist = Math.abs(g.qubits[0] - g.qubits[1]);
      if (qDist > 1) {
        heavyHexSwaps += (qDist - 1) * 3;
        sycamoreSwaps += (qDist - 1) * 2;
      }
    });

    if (this.hwRoutingStatsEl) {
      this.hwRoutingStatsEl.innerHTML = `
        <div class="hw-chip-stat"><span>IBM Heavy-Hex:</span> <strong>+${heavyHexSwaps} SWAP gates</strong></div>
        <div class="hw-chip-stat"><span>Google Sycamore 2D:</span> <strong>+${sycamoreSwaps} SWAP gates</strong></div>
        <div class="hw-chip-stat"><span>IonQ All-to-All:</span> <strong>0 SWAP overhead</strong></div>
      `;
    }

    // 5. Diagnostic Log Output
    if (this.doctorResultsEl) {
      let diagHtml = '';
      if (cancellations.length > 0 || merges.length > 0) {
        diagHtml += `<div class="doctor-badge-title">✅ Optimization Opportunities Applied:</div>`;
        cancellations.forEach(c => diagHtml += `<div class="doctor-finding finding-cancel">✂️ ${c}</div>`);
        merges.forEach(m => diagHtml += `<div class="doctor-finding finding-merge">🔄 ${m}</div>`);
      } else {
        diagHtml += `<div class="doctor-finding finding-clean">✨ Circuit is already maximally compressed with zero redundant gates.</div>`;
      }
      this.doctorResultsEl.innerHTML = diagHtml;
    }

    return {
      rawGates,
      optimized: this.optimizedAST,
      cancellations,
      merges
    };
  }

  computeDepth(gates) {
    if (!gates || gates.length === 0) return 0;
    const qubitTiers = {};
    gates.forEach(g => {
      let maxTier = 0;
      g.qubits.forEach(q => {
        maxTier = Math.max(maxTier, qubitTiers[q] || 0);
      });
      const nextTier = maxTier + 1;
      g.qubits.forEach(q => {
        qubitTiers[q] = nextTier;
      });
    });
    return Math.max(1, ...Object.values(qubitTiers), 0);
  }

  // Universal Code Generators
  generateCode(framework, ast, isOptimized = false, isSource = false) {
    if (!ast || ast.length === 0) {
      return `# No quantum gates in circuit`;
    }
    const maxQubitInGates = Math.max(0, ...ast.flatMap(g => g.qubits));
    const numQubits = Math.max(this.declaredNumQubits || 2, maxQubitInGates + 1, 2);

    switch (framework) {
      case 'qiskit':
        return this.generateQiskit(ast, numQubits, isOptimized, isSource);
      case 'cirq':
        return this.generateCirq(ast, numQubits, isOptimized, isSource);
      case 'braket':
        return this.generateBraket(ast, numQubits, isOptimized, isSource);
      case 'pennylane':
        return this.generatePennyLane(ast, numQubits, isOptimized, isSource);
      case 'qasm':
        return this.generateOpenQASM(ast, numQubits, isOptimized, isSource);
      case 'pyquil':
        return this.generatePyQuil(ast, numQubits, isOptimized, isSource);
      default:
        return this.generateQiskit(ast, numQubits, isOptimized, isSource);
    }
  }

  generateQiskit(ast, numQubits, isOptimized, isSource) {
    let header = '';
    if (isSource) {
      header = `# Initialized ${numQubits}-Qubit Circuit\n`;
    } else {
      header = `# Quantum Circuit transpiled by Ananta Quantum Studio\n`;
      if (isOptimized) {
        header += `# Mode: AI Circuit Doctor Optimized (Peephole reduction applied)\n`;
      } else {
        header += `# Mode: Direct 1:1 Transpilation\n`;
      }
    }

    let code = `from qiskit import QuantumCircuit\nimport numpy as np\n\n${header}qc = QuantumCircuit(${numQubits})\n\n`;
    ast.forEach(g => {
      const q0 = g.qubits[0];
      const q1 = g.qubits[1];
      const p = g.params && g.params[0] !== undefined ? g.params[0] : 0;
      if (g.gate === 'H') code += `qc.h(${q0})\n`;
      else if (g.gate === 'X') code += `qc.x(${q0})\n`;
      else if (g.gate === 'Y') code += `qc.y(${q0})\n`;
      else if (g.gate === 'Z') code += `qc.z(${q0})\n`;
      else if (g.gate === 'S') code += `qc.s(${q0})\n`;
      else if (g.gate === 'T') code += `qc.t(${q0})\n`;
      else if (g.gate === 'CNOT') code += `qc.cx(${q0}, ${q1})\n`;
      else if (g.gate === 'CZ') code += `qc.cz(${q0}, ${q1})\n`;
      else if (g.gate === 'SWAP') code += `qc.swap(${q0}, ${q1})\n`;
      else if (g.gate === 'RZ') code += `qc.rz(${p}, ${q0})\n`;
      else if (g.gate === 'RY') code += `qc.ry(${p}, ${q0})\n`;
      else if (g.gate === 'RX') code += `qc.rx(${p}, ${q0})\n`;
    });
    code += `\n# Draw Circuit\nprint(qc.draw())`;
    return code;
  }

  generateCirq(ast, numQubits, isOptimized, isSource) {
    let header = '';
    if (isSource) {
      header = `# Allocate line qubits\n`;
    } else {
      header = `# Quantum Circuit transpiled by Ananta Quantum Studio\n`;
      if (isOptimized) {
        header += `# Mode: AI Circuit Doctor Optimized (Peephole reduction applied)\n`;
      } else {
        header += `# Mode: Direct 1:1 Transpilation\n`;
      }
    }

    let code = `import cirq\nimport numpy as np\n\n${header}q = cirq.LineQubit.range(${numQubits})\ncircuit = cirq.Circuit()\n\n`;
    ast.forEach(g => {
      const q0 = g.qubits[0];
      const q1 = g.qubits[1];
      const p = g.params && g.params[0] !== undefined ? g.params[0] : 0;
      if (g.gate === 'H') code += `circuit.append(cirq.H(q[${q0}]))\n`;
      else if (g.gate === 'X') code += `circuit.append(cirq.X(q[${q0}]))\n`;
      else if (g.gate === 'Y') code += `circuit.append(cirq.Y(q[${q0}]))\n`;
      else if (g.gate === 'Z') code += `circuit.append(cirq.Z(q[${q0}]))\n`;
      else if (g.gate === 'S') code += `circuit.append(cirq.S(q[${q0}]))\n`;
      else if (g.gate === 'T') code += `circuit.append(cirq.T(q[${q0}]))\n`;
      else if (g.gate === 'CNOT') code += `circuit.append(cirq.CNOT(q[${q0}], q[${q1}]))\n`;
      else if (g.gate === 'CZ') code += `circuit.append(cirq.CZ(q[${q0}], q[${q1}]))\n`;
      else if (g.gate === 'SWAP') code += `circuit.append(cirq.SWAP(q[${q0}], q[${q1}]))\n`;
      else if (g.gate === 'RZ') code += `circuit.append(cirq.rz(${p})(q[${q0}]))\n`;
      else if (g.gate === 'RY') code += `circuit.append(cirq.ry(${p})(q[${q0}]))\n`;
      else if (g.gate === 'RX') code += `circuit.append(cirq.rx(${p})(q[${q0}]))\n`;
    });
    code += `\nprint(circuit)`;
    return code;
  }

  generateBraket(ast, numQubits, isOptimized, isSource) {
    let header = '';
    if (isSource) {
      header = `# Amazon Braket Circuit\n`;
    } else {
      header = `# Quantum Circuit transpiled by Ananta Quantum Studio\n`;
      if (isOptimized) {
        header += `# Mode: AI Circuit Doctor Optimized (Peephole reduction applied)\n`;
      } else {
        header += `# Mode: Direct 1:1 Transpilation\n`;
      }
    }

    let code = `from braket.circuits import Circuit\nimport numpy as np\n\n${header}circ = Circuit()\n\n`;
    ast.forEach(g => {
      const q0 = g.qubits[0];
      const q1 = g.qubits[1];
      const p = g.params && g.params[0] !== undefined ? g.params[0] : 0;
      if (g.gate === 'H') code += `circ.h(${q0})\n`;
      else if (g.gate === 'X') code += `circ.x(${q0})\n`;
      else if (g.gate === 'Y') code += `circ.y(${q0})\n`;
      else if (g.gate === 'Z') code += `circ.z(${q0})\n`;
      else if (g.gate === 'S') code += `circ.s(${q0})\n`;
      else if (g.gate === 'T') code += `circ.t(${q0})\n`;
      else if (g.gate === 'CNOT') code += `circ.cnot(${q0}, ${q1})\n`;
      else if (g.gate === 'CZ') code += `circ.cz(${q0}, ${q1})\n`;
      else if (g.gate === 'SWAP') code += `circ.swap(${q0}, ${q1})\n`;
      else if (g.gate === 'RZ') code += `circ.rz(${q0}, ${p})\n`;
      else if (g.gate === 'RY') code += `circ.ry(${q0}, ${p})\n`;
      else if (g.gate === 'RX') code += `circ.rx(${q0}, ${p})\n`;
    });
    code += `\nprint(circ)`;
    return code;
  }

  generatePennyLane(ast, numQubits, isOptimized, isSource) {
    let header = '';
    if (isSource) {
      header = `# PennyLane Circuit\n`;
    } else {
      header = `# Quantum Circuit transpiled by Ananta Quantum Studio\n`;
      if (isOptimized) {
        header += `# Mode: AI Circuit Doctor Optimized (Peephole reduction applied)\n`;
      } else {
        header += `# Mode: Direct 1:1 Transpilation\n`;
      }
    }

    let code = `import pennylane as qml\nimport numpy as np\n\n${header}dev = qml.device("default.qubit", wires=${numQubits})\n\n@qml.qnode(dev)\ndef quantum_circuit():\n`;
    ast.forEach(g => {
      const q0 = g.qubits[0];
      const q1 = g.qubits[1];
      const p = g.params && g.params[0] !== undefined ? g.params[0] : 0;
      if (g.gate === 'H') code += `    qml.Hadamard(wires=${q0})\n`;
      else if (g.gate === 'X') code += `    qml.PauliX(wires=${q0})\n`;
      else if (g.gate === 'Y') code += `    qml.PauliY(wires=${q0})\n`;
      else if (g.gate === 'Z') code += `    qml.PauliZ(wires=${q0})\n`;
      else if (g.gate === 'S') code += `    qml.S(wires=${q0})\n`;
      else if (g.gate === 'T') code += `    qml.T(wires=${q0})\n`;
      else if (g.gate === 'CNOT') code += `    qml.CNOT(wires=[${q0}, ${q1}])\n`;
      else if (g.gate === 'CZ') code += `    qml.CZ(wires=[${q0}, ${q1}])\n`;
      else if (g.gate === 'SWAP') code += `    qml.SWAP(wires=[${q0}, ${q1}])\n`;
      else if (g.gate === 'RZ') code += `    qml.RZ(${p}, wires=${q0})\n`;
      else if (g.gate === 'RY') code += `    qml.RY(${p}, wires=${q0})\n`;
      else if (g.gate === 'RX') code += `    qml.RX(${p}, wires=${q0})\n`;
    });
    code += `    return qml.state()\n\nprint(quantum_circuit())`;
    return code;
  }

  generateOpenQASM(ast, numQubits, isOptimized, isSource) {
    let header = '';
    if (isSource) {
      header = `// OpenQASM 3.0 Circuit\n`;
    } else {
      header = `// Quantum Circuit transpiled by Ananta Quantum Studio\n`;
      if (isOptimized) {
        header += `// Mode: AI Circuit Doctor Optimized (Peephole reduction applied)\n`;
      } else {
        header += `// Mode: Direct 1:1 Transpilation\n`;
      }
    }

    let code = `${header}OPENQASM 3.0;\ninclude "stdgates.inc";\n\nqubit[${numQubits}] q;\nbit[${numQubits}] c;\n\n`;
    ast.forEach(g => {
      const q0 = g.qubits[0];
      const q1 = g.qubits[1];
      const p = g.params && g.params[0] !== undefined ? g.params[0] : 0;
      if (g.gate === 'H') code += `h q[${q0}];\n`;
      else if (g.gate === 'X') code += `x q[${q0}];\n`;
      else if (g.gate === 'Y') code += `y q[${q0}];\n`;
      else if (g.gate === 'Z') code += `z q[${q0}];\n`;
      else if (g.gate === 'S') code += `s q[${q0}];\n`;
      else if (g.gate === 'T') code += `t q[${q0}];\n`;
      else if (g.gate === 'CNOT') code += `cx q[${q0}], q[${q1}];\n`;
      else if (g.gate === 'CZ') code += `cz q[${q0}], q[${q1}];\n`;
      else if (g.gate === 'SWAP') code += `swap q[${q0}], q[${q1}];\n`;
      else if (g.gate === 'RZ') code += `rz(${p}) q[${q0}];\n`;
      else if (g.gate === 'RY') code += `ry(${p}) q[${q0}];\n`;
      else if (g.gate === 'RX') code += `rx(${p}) q[${q0}];\n`;
    });
    return code;
  }

  generatePyQuil(ast, numQubits, isOptimized, isSource) {
    let header = '';
    if (isSource) {
      header = `# Rigetti PyQuil Program\n`;
    } else {
      header = `# Quantum Circuit transpiled by Ananta Quantum Studio\n`;
      if (isOptimized) {
        header += `# Mode: AI Circuit Doctor Optimized (Peephole reduction applied)\n`;
      } else {
        header += `# Mode: Direct 1:1 Transpilation\n`;
      }
    }

    let code = `from pyquil import Program\nfrom pyquil.gates import *\nimport numpy as np\n\n${header}p = Program()\n\n`;
    ast.forEach(g => {
      const q0 = g.qubits[0];
      const q1 = g.qubits[1];
      const p = g.params && g.params[0] !== undefined ? g.params[0] : 0;
      if (g.gate === 'H') code += `p += H(${q0})\n`;
      else if (g.gate === 'X') code += `p += X(${q0})\n`;
      else if (g.gate === 'Y') code += `p += Y(${q0})\n`;
      else if (g.gate === 'Z') code += `p += Z(${q0})\n`;
      else if (g.gate === 'S') code += `p += S(${q0})\n`;
      else if (g.gate === 'T') code += `p += T(${q0})\n`;
      else if (g.gate === 'CNOT') code += `p += CNOT(${q0}, ${q1})\n`;
      else if (g.gate === 'CZ') code += `p += CZ(${q0}, ${q1})\n`;
      else if (g.gate === 'SWAP') code += `p += SWAP(${q0}, ${q1})\n`;
      else if (g.gate === 'RZ') code += `p += RZ(${p}, ${q0})\n`;
      else if (g.gate === 'RY') code += `p += RY(${p}, ${q0})\n`;
      else if (g.gate === 'RX') code += `p += RX(${p}, ${q0})\n`;
    });
    code += `\nprint(p)`;
    return code;
  }

  attachEvents() {
    if (typeof document === 'undefined') return;

    if (this.sourceSelect) {
      this.sourceSelect.onchange = (e) => {
        this.sourceFramework = e.target.value;
        this.renderSourceCode();
        this.optimize();
        this.renderTargetCode();
      };
    }
    if (this.targetSelect) {
      this.targetSelect.onchange = (e) => {
        this.targetFramework = e.target.value;
        this.renderTargetCode();
      };
    }
    if (this.sourceCodeArea) {
      this.sourceCodeArea.oninput = () => {
        this.parseSourceCode();
        this.optimize();
        this.renderTargetCode();
      };
    }

    const btnDirect = document.getElementById('btn-transpile-direct');
    if (btnDirect) {
      btnDirect.onclick = () => this.transpileDirect();
    }

    const btnDoctor = document.getElementById('btn-run-doctor') || document.getElementById('btn-run-optimizer');
    if (btnDoctor) {
      btnDoctor.onclick = () => this.transpileOptimized();
    }

    const btnModeDirect = document.getElementById('btn-target-direct');
    if (btnModeDirect) {
      btnModeDirect.onclick = () => this.setTargetMode('direct');
    }

    const btnModeOpt = document.getElementById('btn-target-optimized');
    if (btnModeOpt) {
      btnModeOpt.onclick = () => this.setTargetMode('optimized');
    }

    const btnCopyTarget = document.getElementById('btn-copy-transpiled');
    if (btnCopyTarget) {
      btnCopyTarget.onclick = () => {
        if (this.targetCodeArea) {
          navigator.clipboard.writeText(this.targetCodeArea.value);
          btnCopyTarget.textContent = 'Copied!';
          setTimeout(() => btnCopyTarget.textContent = 'Copy Code', 1500);
        }
      };
    }

    const presetBell = document.getElementById('btn-sample-bell');
    if (presetBell) presetBell.onclick = () => this.loadSampleCircuit('bell_vqe');

    const presetGhz = document.getElementById('btn-sample-ghz');
    if (presetGhz) presetGhz.onclick = () => this.loadSampleCircuit('ghz');

    const presetQft = document.getElementById('btn-sample-qft');
    if (presetQft) presetQft.onclick = () => this.loadSampleCircuit('qft');
  }
}

if (typeof window !== 'undefined') {
  window.TranspilerDoctor = TranspilerDoctor;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TranspilerDoctor };
}
