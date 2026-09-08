/**
 * Quantum Time-Travel Debugger — Ananta (SIH Feature #1)
 */
class QuantumTimeDebugger {
  constructor(engine, circuitUI) {
    this.engine = engine;
    this.circuitUI = circuitUI;
    this.snapshots = [];
    this.currentStep = 0;
    this.noiseEnabled = false;
    this.t1Us = 50;
    this.t2Us = 30;
    this.gateTimeNs = 100;
    this.isPlaying = false;
    this.playTimer = null;
    this.particles = [];
    this.animFrame = null;
    this.particleCtx = null;
    this.particleCanvas = null;
    this.init();
  }

  init() {
    this._bindPanel();
    this._setupParticleCanvas();
    this._bindEvents();
  }

  _bindPanel() {
    this.stepLabel      = document.getElementById('qtd-step-label');
    this.gateLabel      = document.getElementById('qtd-gate-label');
    this.stateTable     = document.getElementById('qtd-state-table');
    this.entropyVal     = document.getElementById('qtd-entropy-val');
    this.purityBar      = document.getElementById('qtd-purity-bar');
    this.purityVal      = document.getElementById('qtd-purity-val');
    this.fidelityVal    = document.getElementById('qtd-fidelity-val');
    this.concurrenceMap = document.getElementById('qtd-concurrence-map');
    this.noiseBudget    = document.getElementById('qtd-noise-budget');
    this.diagnosticBox  = document.getElementById('qtd-diagnostic-box');
  }

  _setupParticleCanvas() {
    this.particleCanvas = document.getElementById('qtd-particle-canvas');
    if (this.particleCanvas) this.particleCtx = this.particleCanvas.getContext('2d');
  }

  _bindEvents() {
    const safe = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    const safeChange = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('change', fn); };
    const safeInput  = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('input', fn); };

    safe('btn-qtd-capture', () => this.captureAndOpen());
    safe('btn-qtd-play',    () => this.togglePlay());
    safe('btn-qtd-prev',    () => this.stepTo(this.currentStep - 1));
    safe('btn-qtd-next',    () => this.stepTo(this.currentStep + 1));
    safe('btn-qtd-first',   () => this.stepTo(0));
    safe('btn-qtd-last',    () => this.stepTo(this.snapshots.length - 1));
    safe('btn-qtd-diagnose',() => this.runDiagnostics());

    safeChange('qtd-noise-toggle', (e) => {
      this.noiseEnabled = e.target.checked;
      const noiseSection = document.getElementById('qtd-noise-section');
      if (noiseSection) noiseSection.style.display = this.noiseEnabled ? 'block' : 'none';
      if (this.snapshots.length > 0) this.captureAndOpen();
    });

    safeInput('qtd-t1-slider', (e) => {
      this.t1Us = parseFloat(e.target.value);
      const lbl = document.getElementById('qtd-t1-val');
      if (lbl) lbl.textContent = this.t1Us + ' us';
      if (this.noiseEnabled && this.snapshots.length > 0) this.captureAndOpen();
    });

    const track = document.getElementById('qtd-scrubber-track');
    if (track) {
      track.addEventListener('click', (e) => {
        const rect = track.getBoundingClientRect();
        const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.stepTo(Math.round(pct * (this.snapshots.length - 1)));
      });
    }
  }

  captureAndOpen() {
    if (!this.circuitUI || !this.engine) return;
    const grid = this.circuitUI.grid;

    // Check if circuit has at least one gate placed
    const hasGates = grid && grid.some(row => row.some(cell => cell && cell !== ''));
    if (!hasGates) {
      alert('⚠️ Your circuit is empty!\n\nPlease add at least one gate in the Composer tab first, then click "Debug Current Circuit".');
      return;
    }

    // Sync engine qubit count to match the circuit grid
    if (grid.length !== this.engine.numQubits) {
      this.engine.setNumQubits(grid.length);
    }

    this.snapshots = this._captureSnapshots(grid);
    if (this.snapshots.length < 2) return; // need at least initial + 1 gate step

    const wrap = document.getElementById('debugger-panel-wrapper');
    if (wrap) { wrap.classList.remove('qtd-hidden'); wrap.classList.add('qtd-visible'); }

    // Hide the empty-state placeholder
    const emptyState = document.getElementById('qtd-empty-state');
    if (emptyState) emptyState.style.display = 'none';

    this.renderScrubber();
    this.stepTo(0);
  }

  _captureSnapshots(grid) {
    if (!grid || !grid.length) return [];
    const numCols = grid[0].length;
    const snaps = [];
    this.engine.reset();
    snaps.push(this._snapNow(grid, -1)); // initial state
    for (let col = 0; col < numCols; col++) {
      // Skip columns that have no gates placed
      const hasGateInCol = grid.some(row => row[col] && row[col] !== '');
      if (!hasGateInCol) continue;
      this.engine.runCircuitUpToCol(grid, col);
      if (this.noiseEnabled) this._injectNoise();
      snaps.push(this._snapNow(grid, col));
    }
    return snaps;
  }

  _snapNow(grid, col) {
    const probs       = this.engine.getProbabilities();
    const entropy     = this.engine.getEntanglementEntropy();
    const purity      = this._purity();
    const concurrence = this._concurrence();
    const gateDesc    = col >= 0 ? this._describeCol(grid, col) : 'Initial state |0...0>';
    const noiseInfo   = this.noiseEnabled ? this._noiseInfo() : null;
    return { col, probs, entropy, purity, concurrence, gateDesc, noiseInfo,
             fidelity: this.noiseEnabled ? Math.max(0, purity * 100) : 100 };
  }

  _describeCol(grid, col) {
    const names = { H:'Hadamard (H)', X:'Pauli-X', Y:'Pauli-Y', Z:'Pauli-Z',
                    S:'Phase (S)', T:'pi/8 Gate (T)', M:'Measure', CX_CTRL:'CNOT-Ctrl', CX_TGT:'CNOT-Tgt' };
    const parts = [];
    for (let q = 0; q < grid.length; q++) {
      const c = grid[q][col];
      if (c) parts.push((names[c] || c) + ' on q' + q);
    }
    return parts.join(' - ') || 'Identity';
  }

  _purity() {
    let p = 0;
    for (const a of this.engine.state) p += a.absSq() * a.absSq();
    if (this.noiseEnabled) p -= Math.random() * 0.04;
    return parseFloat(Math.min(1, Math.max(0, p)).toFixed(4));
  }

  _concurrence() {
    if (this.engine.numQubits < 2) return 0;
    const q0m = 1 << (this.engine.numQubits - 1);
    const q1m = 1 << (this.engine.numQubits - 2);
    let a00={re:0,im:0}, a01={re:0,im:0}, a10={re:0,im:0}, a11={re:0,im:0};
    for (let i = 0; i < this.engine.numStates; i++) {
      const b0 = (i & q0m) ? 1 : 0, b1 = (i & q1m) ? 1 : 0;
      const a = this.engine.state[i];
      if (!b0&&!b1){a00.re+=a.re;a00.im+=a.im;}
      else if(!b0&&b1){a01.re+=a.re;a01.im+=a.im;}
      else if(b0&&!b1){a10.re+=a.re;a10.im+=a.im;}
      else{a11.re+=a.re;a11.im+=a.im;}
    }
    const cr = a00.re*a11.re - a00.im*a11.im - (a01.re*a10.re - a01.im*a10.im);
    const ci = a00.re*a11.im + a00.im*a11.re - (a01.re*a10.im + a01.im*a10.re);
    return parseFloat(Math.min(1, Math.max(0, 2*Math.sqrt(cr*cr+ci*ci))).toFixed(4));
  }

  _injectNoise() {
    const p = 1 - Math.exp(-(this.gateTimeNs/1000) / this.t1Us);
    for (const amp of this.engine.state) {
      if (Math.random() < p * 0.4) { amp.re *= (1 - p*0.2); amp.im *= (1 - p*0.2); }
    }
  }

  _noiseInfo() {
    const gtUs = this.gateTimeNs / 1000;
    const t1l = (1 - Math.exp(-gtUs / this.t1Us)) * 100;
    const t2l = (1 - Math.exp(-gtUs / this.t2Us)) * 100;
    return { t1Loss: t1l.toFixed(2), t2Loss: t2l.toFixed(2), totalLoss: (t1l + t2l).toFixed(2) };
  }

  stepTo(step) {
    if (!this.snapshots.length) return;
    this.currentStep = Math.max(0, Math.min(this.snapshots.length - 1, step));
    this._renderStep(this.snapshots[this.currentStep]);
    this._updateThumb();
    this._emitParticles(this.snapshots[this.currentStep]);
  }

  togglePlay() {
    const btn = document.getElementById('btn-qtd-play');
    if (this.isPlaying) {
      this.isPlaying = false;
      clearInterval(this.playTimer);
      if (btn) btn.textContent = 'Play';
    } else {
      this.isPlaying = true;
      if (btn) btn.textContent = 'Pause';
      if (this.currentStep >= this.snapshots.length - 1) this.currentStep = 0;
      this.playTimer = setInterval(() => {
        if (this.currentStep >= this.snapshots.length - 1) {
          this.isPlaying = false;
          clearInterval(this.playTimer);
          if (btn) btn.textContent = 'Play';
          return;
        }
        this.stepTo(this.currentStep + 1);
      }, 900);
    }
  }

  _renderStep(snap) {
    if (!snap) return;
    if (this.stepLabel) this.stepLabel.textContent =
      snap.col < 0 ? 'Step 0 - Initial State' : 'Step ' + (snap.col + 1) + ' / ' + (this.snapshots.length - 1);
    if (this.gateLabel) this.gateLabel.textContent = snap.gateDesc;
    this._renderTable(snap.probs);
    this._renderEntropyArc(snap.entropy);
    this._renderPurity(snap.purity);
    if (this.fidelityVal) {
      this.fidelityVal.textContent = snap.fidelity.toFixed(1) + '%';
      this.fidelityVal.className = 'qtd-fidelity-num ' +
        (snap.fidelity > 80 ? 'fid-good' : snap.fidelity > 50 ? 'fid-warn' : 'fid-bad');
    }
    this._renderConcurrence(snap.concurrence, snap.entropy);
    this._renderNoiseBudget(snap.noiseInfo);
  }

  _renderTable(probs) {
    if (!this.stateTable) return;
    const nz = (probs || []).filter(p => p.probability > 0.0005);
    if (!nz.length) {
      this.stateTable.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-dim);padding:12px">State collapsed</td></tr>';
      return;
    }
    this.stateTable.innerHTML = nz.map(p => {
      const pct  = (p.probability * 100).toFixed(1);
      const amp  = Math.sqrt(p.probability).toFixed(3);
      const ph   = p.phase ? Math.round(p.phase * 180 / Math.PI) : 0;
      const barW = Math.round(p.probability * 100);
      const col  = p.probability > 0.4 ? '#34d399' : p.probability > 0.15 ? '#60a5fa' : '#a78bfa';
      return '<tr class="qtd-state-row">' +
        '<td class="qtd-ket"><span class="ket-sym">|</span>' + p.state + '<span class="ket-sym">></span></td>' +
        '<td class="qtd-amp">' + amp + '</td>' +
        '<td class="qtd-phase">' + ph + 'deg</td>' +
        '<td class="qtd-prob-cell">' +
        '<div class="qtd-prob-track"><div class="qtd-prob-fill" style="width:' + barW + '%;background:' + col + '"></div></div>' +
        '<span class="qtd-prob-num">' + pct + '%</span>' +
        '</td></tr>';
    }).join('');
  }

  _renderEntropyArc(entropy) {
    const path = document.getElementById('qtd-entropy-arc-path');
    if (!path) return;
    const pct = Math.min(1, entropy);
    const r = 52, circ = 2 * Math.PI * r * 0.75;
    path.style.strokeDasharray = (pct * circ) + ' ' + circ;
    path.style.stroke = 'hsl(' + Math.round(210 - pct * 160) + ', 90%, 60%)';
    if (this.entropyVal) this.entropyVal.textContent = entropy.toFixed(3) + ' ebits';
    const pctEl = document.getElementById('qtd-entropy-pct');
    if (pctEl) pctEl.textContent = Math.round(entropy * 100) + '%';
  }

  _renderPurity(purity) {
    if (this.purityBar) {
      this.purityBar.style.width = Math.round(purity * 100) + '%';
      this.purityBar.style.background = purity > 0.9 ? '#34d399' : purity > 0.6 ? '#fbbf24' : '#f87171';
    }
    if (this.purityVal) this.purityVal.textContent = (purity * 100).toFixed(1) + '%';
  }

  _renderConcurrence(C, S) {
    if (!this.concurrenceMap) return;
    const color = C > 0.7 ? '#34d399' : C > 0.3 ? '#60a5fa' : '#475569';
    const sw = (1 + C * 4).toFixed(1);
    this.concurrenceMap.innerHTML =
      '<svg viewBox="0 0 220 70" width="100%">' +
      '<circle cx="30" cy="35" r="12" fill="rgba(96,165,250,0.12)" stroke="#60a5fa" stroke-width="1.5"/>' +
      '<text x="30" y="39" text-anchor="middle" fill="var(--text-primary)" font-size="11" font-weight="600">q0</text>' +
      '<circle cx="110" cy="35" r="12" fill="rgba(96,165,250,0.12)" stroke="' + color + '" stroke-width="' + (1+C).toFixed(1) + '"/>' +
      '<text x="110" y="39" text-anchor="middle" fill="var(--text-primary)" font-size="11" font-weight="600">q1</text>' +
      '<circle cx="190" cy="35" r="12" fill="rgba(96,165,250,0.12)" stroke="#60a5fa" stroke-width="1.5"/>' +
      '<text x="190" y="39" text-anchor="middle" fill="var(--text-primary)" font-size="11" font-weight="600">q2</text>' +
      '<line x1="42" y1="35" x2="98" y2="35" stroke="' + color + '" stroke-width="' + sw + '" stroke-linecap="round" opacity="' + (0.3+C*0.7).toFixed(2) + '"/>' +
      '<text x="70" y="22" text-anchor="middle" fill="' + color + '" font-size="9.5" font-family="monospace">C=' + C.toFixed(3) + '</text>' +
      '<line x1="122" y1="35" x2="178" y2="35" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.5"/>' +
      '<text x="150" y="22" text-anchor="middle" fill="#64748b" font-size="9.5" font-family="monospace">S=' + S.toFixed(3) + '</text>' +
      '</svg>';
  }

  _renderNoiseBudget(ni) {
    const sec = document.getElementById('qtd-noise-section');
    if (sec) sec.style.display = (this.noiseEnabled && ni) ? 'block' : 'none';
    if (!this.noiseBudget || !ni) return;
    this.noiseBudget.innerHTML =
      '<div class="qtd-noise-row"><span>T1 Relaxation</span><span class="qtd-noise-val qtd-noise-t1">' + ni.t1Loss + '%</span></div>' +
      '<div class="qtd-noise-row"><span>T2 Dephasing</span><span class="qtd-noise-val qtd-noise-t2">' + ni.t2Loss + '%</span></div>' +
      '<div class="qtd-noise-row qtd-noise-total"><span>Total Fidelity Loss</span><span class="qtd-noise-val">' + ni.totalLoss + '%</span></div>';
  }

  renderScrubber() {
    const container = document.getElementById('qtd-scrubber-markers');
    if (!container || !this.snapshots.length) return;
    container.innerHTML = '';
    const icons = { Hadamard:'H', CNOT:'X', 'Pauli-X':'X', 'Pauli-Y':'Y', 'Pauli-Z':'Z',
                    'Phase':'S', 'pi/8':'T', 'Measure':'M' };
    this.snapshots.forEach((snap, i) => {
      const pct = this.snapshots.length > 1 ? (i / (this.snapshots.length - 1)) * 100 : 0;
      const m = document.createElement('div');
      m.className = 'qtd-marker';
      m.style.left = pct + '%';
      m.title = snap.gateDesc;
      let icon = 'o';
      for (const key of Object.keys(icons)) {
        if (snap.gateDesc.indexOf(key) !== -1) { icon = icons[key]; break; }
      }
      if (i === 0) icon = '*';
      m.innerHTML = '<div class="qtd-marker-dot" data-step="' + i + '">' + icon + '</div>';
      m.addEventListener('click', () => this.stepTo(i));
      container.appendChild(m);
    });
  }

  _updateThumb() {
    const thumb = document.getElementById('qtd-scrubber-thumb');
    if (thumb && this.snapshots.length > 1) {
      thumb.style.left = ((this.currentStep / (this.snapshots.length - 1)) * 100) + '%';
    }
    document.querySelectorAll('.qtd-marker-dot').forEach((el, i) => {
      el.classList.toggle('qtd-marker-active', i === this.currentStep);
    });
  }

  _emitParticles(snap) {
    if (!this.particleCtx || !this.particleCanvas) return;
    const canvas = this.particleCanvas;
    canvas.width  = canvas.offsetWidth  || 300;
    canvas.height = canvas.offsetHeight || 50;
    this.particleCtx.clearRect(0, 0, canvas.width, canvas.height);
    if (!this.noiseEnabled || !snap.noiseInfo) return;
    const loss = Math.min(1, parseFloat(snap.noiseInfo.totalLoss) / 8);
    const count = Math.floor(loss * 25);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * canvas.width, y: canvas.height * 0.6,
        vx: (Math.random() - 0.5) * 2.5, vy: -(Math.random() * 3 + 0.5),
        alpha: 0.85, r: Math.random() * 2.5 + 1,
        h: Math.floor(Math.random() * 60 + 170)
      });
    }
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this._drawParticles();
  }

  _drawParticles() {
    if (!this.particleCtx || !this.particleCanvas) return;
    const ctx = this.particleCtx;
    ctx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
    this.particles = this.particles.filter(p => p.alpha > 0.02);
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + p.h + ', 90%, 65%, ' + p.alpha + ')';
      ctx.fill();
      p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.alpha -= 0.022;
    }
    if (this.particles.length > 0) {
      this.animFrame = requestAnimationFrame(() => this._drawParticles());
    }
  }

  runDiagnostics() {
    if (!this.diagnosticBox || !this.snapshots.length) return;
    this.diagnosticBox.style.display = 'block';
    const final = this.snapshots[this.snapshots.length - 1];
    const issues = [];

    if (final.purity < 0.8) {
      issues.push({ s: 'error', icon: 'RED', text:
        'High decoherence: purity = ' + (final.purity*100).toFixed(1) + '%. Try Dynamical Decoupling or reducing circuit depth.' });
    }
    const peakE = Math.max.apply(null, this.snapshots.map(s => s.entropy));
    if (peakE > 0.5 && final.entropy < 0.1) {
      issues.push({ s: 'warning', icon: 'WARN', text:
        'Entanglement collapse: peak = ' + peakE.toFixed(3) + ' -> final = ' + final.entropy.toFixed(3) + ' ebits. Check for premature measurement.' });
    }
    const grid = this.circuitUI && this.circuitUI.grid;
    if (grid) {
      let cnotCount = 0;
      grid.forEach(row => row.forEach(c => { if (c === 'CX_CTRL') cnotCount++; }));
      if (cnotCount > 3) issues.push({ s: 'warning', icon: 'WARN', text:
        cnotCount + ' CNOT gates detected - 2-qubit gates carry 10-50x higher error rates. Use Transpiler Doctor to optimize.' });
    }
    if (issues.length === 0) issues.push({ s: 'success', icon: 'OK', text:
      'Circuit is healthy! Purity = ' + (final.purity*100).toFixed(1) + '%, entropy = ' + final.entropy.toFixed(3) + ' ebits. Expected hardware fidelity > 85%.' });

    const colorMap = { error: '#f87171', warning: '#fbbf24', success: '#34d399' };
    this.diagnosticBox.innerHTML = '<div class="qtd-diag-title">AI Circuit Diagnostics</div>' +
      issues.map(iss =>
        '<div class="qtd-diag-issue" style="border-left:3px solid ' + colorMap[iss.s] + ';padding:8px 10px;margin-bottom:8px;background:rgba(0,0,0,0.2);border-radius:6px">' +
        '<strong style="color:' + colorMap[iss.s] + '">' + iss.icon + '</strong> <span>' + iss.text + '</span>' +
        '</div>'
      ).join('');
  }

  openDebugger() {
    if (window.switchTab) {
      window.switchTab('debugger');
    } else if (window.switchView) {
      window.switchView('debugger');
    }
    const grid = this.circuitUI && this.circuitUI.grid;
    const hasGates = grid && grid.some(row => row.some(cell => cell && cell !== ''));
    if (hasGates) {
      setTimeout(() => this.captureAndOpen(), 50);
    }
  }
}

window.QuantumTimeDebugger = QuantumTimeDebugger;

window.openDebuggerFromComposer = function() {
  if (window.quantumDebugger) {
    window.quantumDebugger.openDebugger();
  } else if (window.switchTab) {
    window.switchTab('debugger');
  } else if (window.switchView) {
    window.switchView('debugger');
  }
};
