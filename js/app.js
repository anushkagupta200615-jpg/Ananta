/**
 * Ananta Coordinator
 * Tab routing, dual theme (light/dark) toggle, authentication state,
 * and quantum simulation engine bindings.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. Dual Theme System (Light & Dark)
  // ==========================================
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
      document.body.setAttribute('data-theme', 'light');
    }
    
    const icon = document.getElementById('theme-toggle-icon');
    const text = document.getElementById('theme-toggle-text');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    if (text) text.textContent = isDark ? 'White' : 'Black';

    localStorage.setItem('ananta_theme', theme);
  }

  window.toggleTheme = function() {
    const current = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(current);
  };

  const savedTheme = localStorage.getItem('ananta_theme') || 'dark';
  applyTheme(savedTheme);

  // ==========================================
  // 2. Quantum Engine & Visualizers
  // ==========================================
  const engine = new QuantumCircuitEngine(3);

  let blochVisualizer = null;
  try {
    blochVisualizer = new BlochSphereVisualizer('bloch-sphere-canvas');
  } catch (err) {
    console.error('Three.js initialization:', err);
  }

  const circuitUI = new CircuitUI(engine, blochVisualizer);
  window.circuitUI = circuitUI;

  const aiTutor = new QuantaAITutor();
  window.quantaAI = aiTutor;

  const missionManager = new MissionManager();
  window.missionManager = missionManager;

  const intuitionLab = new IntuitionLab();
  window.intuitionLab = intuitionLab;

  const conceptDoctor = new ConceptDoctor();
  window.conceptDoctor = conceptDoctor;

  const hwStudio = new HardwareControlStudio(engine, circuitUI);
  window.hwStudio = hwStudio;

  const algorithmLibrary = new AlgorithmLibrary();
  window.algorithmLibrary = algorithmLibrary;

  // Initialize Living Rishi Quantum Canvas
  if (window.RishiQuantumCanvas) {
    try {
      window.rishiCanvasMain = new window.RishiQuantumCanvas('rishi-quantum-canvas-main', 'rishi-photo-card-main');
    } catch (err) {
      console.warn('Rishi canvas init:', err);
    }
  }

  // ==========================================
  // 3. View & Tab Routing
  // ==========================================
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.viewport-section');

  function switchView(tabKey) {
    if (!tabKey) tabKey = 'simulator';

    navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabKey) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    sections.forEach(sec => {
      if (sec.id === `view-${tabKey}`) {
        sec.classList.add('active');
        sec.style.display = 'block';
      } else {
        sec.classList.remove('active');
        sec.style.display = 'none';
      }
    });

    // Resize Bloch sphere & refresh microwave pulse canvas when entering simulator
    if (tabKey === 'simulator') {
      if (blochVisualizer) {
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          if (circuitUI) circuitUI.updateSimulation();
        }, 60);
      }
      if (window.hwStudio) {
        setTimeout(() => window.hwStudio.initPulseCanvas(), 80);
      }
    }

    // Refresh Rishi Canvas on login tab switch
    if (tabKey === 'login' && window.rishiCanvasMain) {
      setTimeout(() => window.rishiCanvasMain.initSize(), 50);
    }

    // Refresh Wave Canvas and Doctor Canvas when entering Intuition Lab
    if (tabKey === 'intuition') {
      if (window.intuitionLab) setTimeout(() => window.intuitionLab.initWaveCanvas(), 60);
      if (window.conceptDoctor) setTimeout(() => window.conceptDoctor.loadConcept(window.conceptDoctor.currentConceptId), 80);
    }

    // Refresh Skill Tree when entering Challenges tab
    if (tabKey === 'challenges' && window.hwStudio) {
      setTimeout(() => window.hwStudio.renderSkillTree(), 50);
    }

    // Refresh Algorithm Library when entering Algorithms tab
    if (tabKey === 'algorithms' && window.algorithmLibrary) {
      setTimeout(() => window.algorithmLibrary.render(), 40);
    }
  }
  window.switchView = switchView;

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.getAttribute('data-tab');
      switchView(tab);
    });
  });

  // Logo Click -> Overview
  const navLogoBtn = document.getElementById('nav-logo-btn');
  if (navLogoBtn) {
    navLogoBtn.addEventListener('click', () => switchView('overview'));
  }

  // Quick Action Buttons
  const quickLaunch = document.getElementById('btn-quick-launch');
  if (quickLaunch) {
    quickLaunch.addEventListener('click', () => switchView('simulator'));
  }

  const heroLaunch = document.getElementById('btn-hero-launch');
  if (heroLaunch) {
    heroLaunch.addEventListener('click', () => switchView('simulator'));
  }

  const heroAlgos = document.getElementById('btn-hero-algorithms');
  if (heroAlgos) {
    heroAlgos.addEventListener('click', () => switchView('algorithms'));
  }

  // ==========================================
  // 4. Authentication & Google Login Flow
  // ==========================================
  function updateNavUser() {
    const userJson = localStorage.getItem('ananta_user');
    const userContainer = document.getElementById('nav-user-container');
    const loginBtn = document.getElementById('nav-login-btn');
    const userAvatar = document.getElementById('nav-user-avatar');
    const userName = document.getElementById('nav-user-name');

    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (userContainer) userContainer.style.display = 'flex';
        if (loginBtn) loginBtn.style.display = 'none';
        if (userAvatar) userAvatar.textContent = user.avatar || (user.name ? user.name.charAt(0).toUpperCase() : 'A');
        if (userName) userName.textContent = user.name || 'User';
        return true;
      } catch (e) {
        console.error('Error parsing user session', e);
      }
    }
    if (userContainer) userContainer.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'inline-block';
    return false;
  }

  const navLoginBtn = document.getElementById('nav-login-btn');
  if (navLoginBtn) {
    navLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('login');
    });
  }

  // Google OAuth Dialog
  window.openGoogleDialog = () => {
    const modal = document.getElementById('google-modal');
    if (modal) modal.classList.add('active');
  };

  window.closeGoogleDialog = () => {
    const modal = document.getElementById('google-modal');
    if (modal) modal.classList.remove('active');
  };

  window.selectGoogleAccount = (name, email) => {
    const user = {
      name: name,
      email: email,
      provider: 'google',
      avatar: name.charAt(0).toUpperCase(),
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem('ananta_user', JSON.stringify(user));
    window.closeGoogleDialog();
    updateNavUser();
    switchView('simulator');
  };

  window.loginFromForm = () => {
    const emailInput = document.getElementById('login-email');
    const email = emailInput ? emailInput.value : 'developer@ananta-quantum.io';
    const name = email.split('@')[0];
    const user = {
      name: name,
      email: email,
      provider: 'email',
      avatar: name.charAt(0).toUpperCase(),
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem('ananta_user', JSON.stringify(user));
    updateNavUser();
    switchView('simulator');
  };

  window.logoutUser = () => {
    localStorage.removeItem('ananta_user');
    updateNavUser();
    switchView('login');
  };

  const guestEntry = document.getElementById('btn-guest-entry');
  if (guestEntry) {
    guestEntry.addEventListener('click', () => {
      const user = {
        name: 'Guest User',
        email: 'guest@ananta-quantum.io',
        provider: 'guest',
        avatar: 'G',
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem('ananta_user', JSON.stringify(user));
      updateNavUser();
      switchView('simulator');
    });
  }

  // ==========================================
  // 5. Circuit Controls & Safe Preset Helpers
  // ==========================================
  window.loadPresetSafe = function(presetKey) {
    if (!circuitUI) return;
    let targetGrid = null;
    let targetAlgo = null;

    if (presetKey === 'bell' || presetKey === 'bell_phi_plus') {
      targetGrid = [
        ['H', 'CX_CTRL', null, null, null, null],
        [null, 'CX_TGT', null, null, null, null],
        [null, null, null, null, null, null]
      ];
      const lbl = document.getElementById('circuit-filename-label');
      if (lbl) lbl.textContent = 'bell_state.qc';
      if (window.ALGORITHM_CATALOG) targetAlgo = window.ALGORITHM_CATALOG.find(a => a.id === 'bell_phi_plus');
    } else if (presetKey === 'grover' || presetKey === 'grover_2qubit') {
      targetGrid = [
        ['H', 'Z', 'H', 'X', 'H', null],
        ['H', 'CX_TGT', 'H', 'X', 'H', null],
        [null, null, null, null, null, null]
      ];
      const lbl = document.getElementById('circuit-filename-label');
      if (lbl) lbl.textContent = 'grover_search.qc';
      if (window.ALGORITHM_CATALOG) targetAlgo = window.ALGORITHM_CATALOG.find(a => a.id === 'grover_2qubit');
    } else if (presetKey === 'superposition') {
      targetGrid = [
        ['H', null, null, null, null, null],
        ['H', null, null, null, null, null],
        ['H', null, null, null, null, null]
      ];
      const lbl = document.getElementById('circuit-filename-label');
      if (lbl) lbl.textContent = 'uniform_superposition.qc';
      if (window.ALGORITHM_CATALOG) targetAlgo = window.ALGORITHM_CATALOG.find(a => a.id === 'superposition_3' || a.id === 'superposition');
    } else if (presetKey === 'qft') {
      // 3-qubit QFT: H + controlled-SWAP sequence
      targetGrid = [
        ['H', 'S', 'T', null, null, null],
        [null, null, 'H', 'S', null, null],
        [null, null, null, null, 'H', null]
      ];
      const lbl = document.getElementById('circuit-filename-label');
      if (lbl) lbl.textContent = 'quantum_fourier_transform.qc';
    } else if (window.ALGORITHM_CATALOG) {
      targetAlgo = window.ALGORITHM_CATALOG.find(a => a.id === presetKey);
      if (targetAlgo) targetGrid = targetAlgo.grid;
    }

    if (targetGrid) {
      circuitUI.loadCircuit(targetGrid);
      if (targetAlgo && circuitUI.startAlgorithmTour) {
        circuitUI.startAlgorithmTour(targetAlgo);
      }
    }
  };

  const btnClearCirc = document.getElementById('btn-clear-circ');
  if (btnClearCirc) {
    btnClearCirc.addEventListener('click', () => {
      circuitUI.clearCircuit();
      const lbl = document.getElementById('circuit-filename-label');
      if (lbl) lbl.textContent = 'untitled_circuit.qc';
    });
  }

  // Scroll to composer helper (used by KE load buttons)
  window.scrollToComposer = function() {
    switchView('simulator');
    const composerEl = document.getElementById('view-simulator');
    if (composerEl) composerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ==========================================
  // 6. Quantum Knowledge Engine
  // ==========================================
  const keEngine = window.QuantumKnowledgeEngine ? new window.QuantumKnowledgeEngine() : null;
  if (keEngine) {
    const keInput = document.getElementById('ke-search-input');
    const keBtn = document.getElementById('btn-ke-search');
    const keResultPanel = document.getElementById('ke-result-panel');
    const keResultInner = document.getElementById('ke-result-inner');
    const keCollapseBtn = document.getElementById('btn-ke-collapse');
    const keBar = document.getElementById('knowledge-engine-bar');

    function runKESearch(query) {
      if (!query || query.trim().length < 2) return;
      const topic = keEngine.search(query);
      if (!keResultPanel || !keResultInner) return;
      if (topic) {
        keResultInner.innerHTML = keEngine.renderCard(topic);
        keResultPanel.style.display = 'block';
        keResultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        keResultInner.innerHTML = `
          <div class="ke-no-result">
            <div class="ke-no-result-icon">🔭</div>
            <h4>No topic found for "<em>${query}</em>"</h4>
            <p>Try: superposition, entanglement, VQE, QFT, Grover's algorithm, decoherence, surface codes, Shor's algorithm, phase kickback, Bloch sphere, quantum teleportation, QAOA, T gate, no-cloning theorem, density matrix...</p>
          </div>`;
        keResultPanel.style.display = 'block';
      }
    }

    if (keBtn) keBtn.addEventListener('click', () => runKESearch(keInput ? keInput.value : ''));
    if (keInput) {
      keInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runKESearch(keInput.value); });
    }

    // Quick chip buttons
    document.querySelectorAll('.ke-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const topic = chip.getAttribute('data-topic');
        if (keInput) keInput.value = topic;
        runKESearch(topic);
      });
    });

    // Collapse toggle
    if (keCollapseBtn && keBar) {
      keCollapseBtn.addEventListener('click', () => {
        const isCollapsed = keBar.classList.toggle('ke-collapsed');
        keCollapseBtn.textContent = isCollapsed ? 'v Expand' : '^ Collapse';
      });
    }
  }

  // ==========================================
  // 7. Pauli Expectation Gauges
  // ==========================================
  function renderPauliGauges() {
    const gaugesGrid = document.getElementById('pauli-gauges-grid');
    if (!gaugesGrid || !engine) return;

    const expectations = engine.computePauliExpectations();
    gaugesGrid.innerHTML = '';

    expectations.forEach(({ qubit, Z, X, Y }) => {
      const card = document.createElement('div');
      card.className = 'pauli-qubit-card';

      const fmt = v => (v >= 0 ? '+' : '') + v.toFixed(3);
      const bar = (v, cls) => {
        const pct = Math.round(((v + 1) / 2) * 100);
        const fill = Math.round(Math.abs(v) * 50);
        const side = v >= 0 ? 'right' : 'left';
        return `<div class="pauli-bar-track">
          <div class="pauli-bar-fill ${cls}" style="width:${fill}px; ${side === 'right' ? 'left:50%' : 'right:50%'}"></div>
          <div class="pauli-bar-center"></div>
        </div>`;
      };

      card.innerHTML = `
        <div class="pauli-qubit-label">q[${qubit}]</div>
        <div class="pauli-row">
          <span class="pauli-obs pauli-obs-z">Z</span>
          <span class="pauli-val">${fmt(Z)}</span>
          ${bar(Z, 'pbar-z')}
        </div>
        <div class="pauli-row">
          <span class="pauli-obs pauli-obs-x">X</span>
          <span class="pauli-val">${fmt(X)}</span>
          ${bar(X, 'pbar-x')}
        </div>
        <div class="pauli-row">
          <span class="pauli-obs pauli-obs-y">Y</span>
          <span class="pauli-val">${fmt(Y)}</span>
          ${bar(Y, 'pbar-y')}
        </div>
      `;
      gaugesGrid.appendChild(card);
    });
  }

  // Hook into existing circuit update events
  const origUpdateVis = window._quantaUpdateVisualizers;
  window._renderPauliGauges = renderPauliGauges;
  // Initial render
  setTimeout(renderPauliGauges, 600);

  // ==========================================
  // 8. Framework Code Export Tabs (Qiskit / QASM / PennyLane)
  // ==========================================
  const exportTabBtns = document.querySelectorAll('.export-tab-btn');
  const exportCodeEl = document.getElementById('qiskit-code');
  const exportCopyBtn = document.getElementById('btn-copy-qiskit');
  const exportFrameworkLabel = document.getElementById('export-framework-label');
  let activeExportTab = 'qiskit';

  function updateExportCode() {
    if (!circuitUI || !exportCodeEl) return;
    const grid = circuitUI.getGrid ? circuitUI.getGrid() : circuitUI.grid;
    if (!grid) return;

    let code = '';
    if (activeExportTab === 'qiskit') {
      code = engine.toQiskit(grid);
      if (exportFrameworkLabel) exportFrameworkLabel.textContent = 'Qiskit 1.x compatible';
    } else if (activeExportTab === 'qasm') {
      code = engine.toQASM(grid);
      if (exportFrameworkLabel) exportFrameworkLabel.textContent = 'OpenQASM 2.0 - IBM Cloud ready';
    } else if (activeExportTab === 'pennylane') {
      code = engine.toPennyLane(grid);
      if (exportFrameworkLabel) exportFrameworkLabel.textContent = 'PennyLane >= 0.38 (Xanadu)';
    }
    exportCodeEl.textContent = code;
  }

  exportTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      exportTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeExportTab = btn.getAttribute('data-export');
      updateExportCode();
    });
  });

  if (exportCopyBtn) {
    exportCopyBtn.addEventListener('click', () => {
      const code = exportCodeEl ? exportCodeEl.textContent : '';
      navigator.clipboard.writeText(code).then(() => {
        exportCopyBtn.textContent = 'Copied!';
        setTimeout(() => { exportCopyBtn.textContent = 'Copy Code'; }, 2000);
      }).catch(() => {
        exportCopyBtn.textContent = 'Copy Code';
      });
    });
  }

  // Patch existing copy buttons if they exist
  const oldQasmBtn = document.getElementById('btn-copy-qasm');
  if (oldQasmBtn) {
    oldQasmBtn.addEventListener('click', () => {
      if (!circuitUI) return;
      const grid = circuitUI.getGrid ? circuitUI.getGrid() : circuitUI.grid;
      if (!grid) return;
      navigator.clipboard.writeText(engine.toQASM(grid)).then(() => {
        oldQasmBtn.textContent = 'Copied!';
        setTimeout(() => { oldQasmBtn.textContent = 'Copy QASM'; }, 2000);
      });
    });
  }

  // Initial export code population
  setTimeout(updateExportCode, 500);

  // Re-render exports and gauges after circuit changes
  // Patch into existing circuitUI state update
  if (circuitUI && circuitUI.onStateUpdate) {
    const origUpdate = circuitUI.onStateUpdate.bind(circuitUI);
    circuitUI.onStateUpdate = function(...args) {
      origUpdate(...args);
      updateExportCode();
      renderPauliGauges();
    };
  }



  // ==========================================
  // 8. Research Library Engine
  // ==========================================
  const researchGrid = document.getElementById('research-grid-container');
  const searchInput = document.getElementById('research-search-input');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  const catPills = document.querySelectorAll('.cat-pill');
  const resultsCounter = document.getElementById('research-results-count');

  let activeCategory = 'all';
  let searchQuery = '';

  function renderResearchLibrary() {
    if (!researchGrid || !window.QUANTUM_RESEARCH_PAPERS) return;

    // Filter papers
    const filtered = window.QUANTUM_RESEARCH_PAPERS.filter(p => {
      const matchesCat = activeCategory === 'all' || p.category === activeCategory;
      if (!matchesCat) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = p.title && p.title.toLowerCase().includes(q);
      const authorMatch = p.authors && p.authors.toLowerCase().includes(q);
      const abstractMatch = p.abstract && p.abstract.toLowerCase().includes(q);
      const venueMatch = p.venue && p.venue.toLowerCase().includes(q);
      const yearMatch = p.year && p.year.toString().includes(q);
      const arxivMatch = p.arxiv && p.arxiv.toLowerCase().includes(q);
      return titleMatch || authorMatch || abstractMatch || venueMatch || yearMatch || arxivMatch;
    });

    // Update counts
    updateCategoryCounts();

    if (resultsCounter) {
      resultsCounter.textContent = `Showing ${filtered.length} of ${window.QUANTUM_RESEARCH_PAPERS.length} publications`;
    }

    if (filtered.length === 0) {
      researchGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;">
          <h3 style="font-size: 18px; margin-bottom: 8px; color: var(--text-white);">No matching publications found</h3>
          <p style="font-size: 13px; color: var(--text-dim);">Try adjusting your search query or switching categories.</p>
        </div>
      `;
      return;
    }

    researchGrid.innerHTML = '';
    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'paper-card';

      const catBadgeClass = `badge-${p.category}`;
      const catBadgeLabel = p.category.replace('-', ' ').toUpperCase();

      const simulateBtn = p.circuitPreset ? `
        <button class="btn-paper-simulate" onclick="window.loadCircuitFromPaper('${p.circuitPreset}')">
          ⚡ Simulate in Ananta
        </button>
      ` : '';

      const pdfLink = p.pdfUrl ? `
        <a href="${p.pdfUrl}" target="_blank" rel="noopener noreferrer" class="btn-paper-pdf">
          📄 View PDF / Source ↗
        </a>
      ` : '';

      card.innerHTML = `
        <div class="paper-top-row">
          <span class="paper-badge ${catBadgeClass}">${catBadgeLabel}</span>
          <span class="paper-year">${p.year}</span>
        </div>
        <h3 class="paper-title">${p.title}</h3>
        <div class="paper-authors">${p.authors}</div>
        <div class="paper-venue">${p.venue}</div>
        <p class="paper-abstract">${p.abstract}</p>
        <div class="paper-actions-bar">
          ${simulateBtn}
          <button class="btn-paper-cite" onclick="window.openBibtexModal('${p.id}')">
            Cite BibTeX
          </button>
          ${pdfLink}
        </div>
      `;
      researchGrid.appendChild(card);
    });
  }

  function updateCategoryCounts() {
    if (!window.QUANTUM_RESEARCH_PAPERS) return;
    const all = window.QUANTUM_RESEARCH_PAPERS.length;
    const counts = { all };

    window.QUANTUM_RESEARCH_PAPERS.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    Object.keys(counts).forEach(cat => {
      const el = document.getElementById(`count-${cat}`);
      if (el) el.textContent = counts[cat];
    });
  }

  // Category pill handlers
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-cat');
      renderResearchLibrary();
    });
  });

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'inline-block' : 'none';
      }
      renderResearchLibrary();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      renderResearchLibrary();
    });
  }

  // BibTeX Modal Handlers
  window.openBibtexModal = function(paperId) {
    const paper = window.QUANTUM_RESEARCH_PAPERS.find(p => p.id === paperId);
    if (!paper) return;

    const modal = document.getElementById('bibtex-modal');
    const titleEl = document.getElementById('bibtex-modal-title');
    const codeEl = document.getElementById('bibtex-code-content');
    const copyBtn = document.getElementById('btn-copy-bibtex');

    if (titleEl) titleEl.textContent = `BibTeX: ${paper.title}`;
    if (codeEl) codeEl.textContent = paper.bibtex;
    if (copyBtn) copyBtn.textContent = 'Copy Citation to Clipboard';
    if (modal) modal.classList.add('active');
  };

  window.closeBibtexModal = function() {
    const modal = document.getElementById('bibtex-modal');
    if (modal) modal.classList.remove('active');
  };

  window.copyBibtex = function() {
    const codeEl = document.getElementById('bibtex-code-content');
    const copyBtn = document.getElementById('btn-copy-bibtex');
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent);
      if (copyBtn) {
        copyBtn.textContent = 'Copied to Clipboard!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy Citation to Clipboard';
        }, 2000);
      }
    }
  };

  window.loadCircuitFromPaper = function(presetKey) {
    window.loadPresetSafe(presetKey);
    switchView('simulator');
  };

  // Initial render of research library
  renderResearchLibrary();

  // ==========================================
  // 9. Determine Initial Active View & Routing
  // ==========================================
  const validTabs = ['overview', 'simulator', 'algorithms', 'intuition', 'research', 'ai-assistant', 'challenges', 'docs', 'login'];
  const isLoggedIn = updateNavUser();
  const hash = window.location.hash.replace('#', '');

  if (hash && validTabs.includes(hash)) {
    switchView(hash);
  } else if (isLoggedIn) {
    switchView('simulator');
  } else {
    switchView('login');
  }

  // Listen for hash changes dynamically
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '');
    if (h && validTabs.includes(h)) {
      switchView(h);
    }
  });
});
