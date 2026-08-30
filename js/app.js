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
    if (text) text.textContent = isDark ? 'Light' : 'Dark';

    localStorage.setItem('ananta_theme', theme);
  }

  window.toggleTheme = function() {
    const current = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(current);
  };

  const savedTheme = localStorage.getItem('ananta_theme') || 'light';
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
  // 8. Determine Initial Active View
  // ==========================================
  const isLoggedIn = updateNavUser();
  const hash = window.location.hash.replace('#', '');

  if (hash && ['overview', 'simulator', 'algorithms', 'ai-assistant', 'challenges', 'docs'].includes(hash)) {
    switchView(hash);
  } else if (isLoggedIn) {
    // If logged in and no specific hash, jump straight into Simulator
    switchView('simulator');
  } else {
    // If not logged in, present Login view
    switchView('login');
  }
});
