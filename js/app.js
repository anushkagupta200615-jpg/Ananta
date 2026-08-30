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

    // Resize Bloch sphere when entering simulator
    if (tabKey === 'simulator' && blochVisualizer) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (circuitUI) circuitUI.updateSimulation();
      }, 60);
    }

    // Refresh Wave Canvas when entering Intuition Lab
    if (tabKey === 'intuition' && window.intuitionLab) {
      setTimeout(() => window.intuitionLab.initWaveCanvas(), 60);
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
    if (window.ALGORITHM_PRESETS && window.ALGORITHM_PRESETS[presetKey]) {
      circuitUI.loadPreset(window.ALGORITHM_PRESETS[presetKey].grid);
    } else if (presetKey === 'superposition') {
      circuitUI.clearCircuit();
      circuitUI.setGate(0, 0, 'H');
      circuitUI.setGate(1, 0, 'H');
      circuitUI.setGate(2, 0, 'H');
    }
  };

  const btnClearCirc = document.getElementById('btn-clear-circ');
  if (btnClearCirc) {
    btnClearCirc.addEventListener('click', () => circuitUI.clearCircuit());
  }

  // ==========================================
  // 6. Bind Operations Palette Buttons
  // ==========================================
  const gateBtns = document.querySelectorAll('.gate-btn');
  gateBtns.forEach(btn => {
    const gate = btn.getAttribute('data-gate');

    btn.addEventListener('dragstart', (e) => {
      circuitUI.activeDragGate = gate;
      e.dataTransfer.setData('text/plain', gate);
    });

    btn.addEventListener('click', () => {
      if (window.selectedPaletteGate === gate) {
        window.selectedPaletteGate = null;
        btn.style.outline = 'none';
      } else {
        gateBtns.forEach(b => b.style.outline = 'none');
        window.selectedPaletteGate = gate;
        btn.style.outline = '2px solid var(--accent-blue)';
      }
    });
  });

  // ==========================================
  // 7. Algorithm Presets Grid
  // ==========================================
  const algoContainer = document.getElementById('algorithm-cards-container');
  if (algoContainer && window.ALGORITHM_PRESETS) {
    algoContainer.innerHTML = '';
    Object.values(window.ALGORITHM_PRESETS).forEach(algo => {
      const card = document.createElement('div');
      card.className = 'algo-card';
      card.innerHTML = `
        <div class="algo-card-badge">${algo.difficulty}</div>
        <h3 class="algo-card-title">${algo.title}</h3>
        <p class="algo-card-desc">${algo.desc}</p>
        <div class="algo-card-math">${algo.math}</div>
        <button class="btn-load-algo" data-algo="${algo.id}">
          Open in Simulator
        </button>
      `;
      card.querySelector('.btn-load-algo').addEventListener('click', () => {
        circuitUI.loadPreset(algo.grid);
        switchView('simulator');
      });
      algoContainer.appendChild(card);
    });
  }

  // Initial State: Apply Hadamard on q0
  setTimeout(() => {
    circuitUI.setGate(0, 0, 'H');
  }, 100);

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
