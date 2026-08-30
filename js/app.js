/**
 * Ananta Coordinator
 * Tab routing, authentication state, gate operations binding, and interactive state management.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Quantum Simulation Engine (3 Qubits)
  const engine = new QuantumCircuitEngine(3);

  // 2. Initialize 3D Bloch Sphere
  let blochVisualizer = null;
  try {
    blochVisualizer = new BlochSphereVisualizer('bloch-sphere-canvas');
  } catch (err) {
    console.error('Three.js initialization:', err);
  }

  // 3. Initialize Circuit UI
  const circuitUI = new CircuitUI(engine, blochVisualizer);
  window.circuitUI = circuitUI;

  // 4. Initialize AI Mentor
  const aiTutor = new QuantaAITutor();
  window.quantaAI = aiTutor;

  // 5. Initialize Missions
  const missionManager = new MissionManager();
  window.missionManager = missionManager;

  // 6. Navigation Tabs Routing
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.viewport-section');

  function switchView(tabKey) {
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
      } else {
        sec.classList.remove('active');
      }
    });

    // Handle Bloch canvas resize when entering simulator
    if (tabKey === 'simulator' && blochVisualizer) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
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

  // Brand Logo Click -> Overview
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
  // Authentication & Google Login Flow
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
        if (userContainer && loginBtn) {
          userContainer.style.display = 'flex';
          loginBtn.style.display = 'none';
          if (userAvatar) userAvatar.textContent = user.avatar || user.name.charAt(0).toUpperCase();
          if (userName) userName.textContent = user.name;
        }
      } catch (e) {
        console.error('Error parsing user session', e);
      }
    } else {
      if (userContainer && loginBtn) {
        userContainer.style.display = 'none';
        loginBtn.style.display = 'inline-block';
      }
    }
  }

  // Check login on startup
  updateNavUser();

  // Navigation Sign In Button
  const navLoginBtn = document.getElementById('nav-login-btn');
  if (navLoginBtn) {
    navLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('login');
    });
  }

  // Google OAuth Dialog Controls
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
  // Circuit Controls & Preset Buttons
  // ==========================================

  const btnClearCirc = document.getElementById('btn-clear-circ');
  if (btnClearCirc) {
    btnClearCirc.addEventListener('click', () => circuitUI.clearCircuit());
  }

  const btnBellPreset = document.getElementById('btn-preset-bell');
  if (btnBellPreset) {
    btnBellPreset.addEventListener('click', () => {
      circuitUI.loadPreset(ALGORITHM_PRESETS['bell-state'].grid);
    });
  }

  const btnGroverPreset = document.getElementById('btn-preset-grover');
  if (btnGroverPreset) {
    btnGroverPreset.addEventListener('click', () => {
      circuitUI.loadPreset(ALGORITHM_PRESETS['grover'].grid);
    });
  }

  const btnSuperposPreset = document.getElementById('btn-preset-superpos');
  if (btnSuperposPreset) {
    btnSuperposPreset.addEventListener('click', () => {
      circuitUI.clearCircuit();
      circuitUI.setGate(0, 0, 'H');
      circuitUI.setGate(1, 0, 'H');
      circuitUI.setGate(2, 0, 'H');
    });
  }

  // ==========================================
  // Bind Operations Palette Buttons (.gate-btn)
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
        btn.style.outline = '2px solid #0f62fe';
      }
    });
  });

  // ==========================================
  // Algorithm Presets Grid
  // ==========================================
  const algoContainer = document.getElementById('algorithm-cards-container');
  if (algoContainer) {
    algoContainer.innerHTML = '';
    Object.values(ALGORITHM_PRESETS).forEach(algo => {
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

  // Initial State: Apply Hadamard on q0 to demonstrate active quantum state
  setTimeout(() => {
    circuitUI.setGate(0, 0, 'H');
  }, 100);

  // Check URL hash for direct routing (#simulator, #algorithms, #login, etc.)
  const hash = window.location.hash.replace('#', '');
  if (hash && ['overview', 'simulator', 'algorithms', 'ai-assistant', 'challenges', 'docs', 'login'].includes(hash)) {
    switchView(hash);
  }
});
