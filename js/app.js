/**
 * Ananta Coordinator
 * Tab routing, dual theme (light/dark) toggle, authentication state,
 * and quantum simulation engine bindings.
 */

/* ---- Mobile Navigation ---- */
window.toggleMobileNav = function() {
  const drawer = document.getElementById('mobile-nav-drawer');
  const overlay = document.getElementById('mobile-nav-overlay');
  const btn = document.getElementById('hamburger-btn');
  if (!drawer) return;
  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    btn && btn.classList.remove('is-open');
    document.body.style.overflow = '';
  } else {
    drawer.classList.add('open');
    overlay.classList.add('open');
    btn && btn.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
};
window.closeMobileNav = function() {
  const drawer = document.getElementById('mobile-nav-drawer');
  const overlay = document.getElementById('mobile-nav-overlay');
  const btn = document.getElementById('hamburger-btn');
  if (!drawer) return;
  drawer.classList.remove('open');
  overlay.classList.remove('open');
  btn && btn.classList.remove('is-open');
  document.body.style.overflow = '';
};

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

    // Normalize tabKey
    if (tabKey === 'hardware') tabKey = 'overview';
    if (tabKey === 'software') tabKey = 'simulator';

    // If already logged in and navigating to login, redirect to overview
    if (tabKey === 'login') {
      const userJson = localStorage.getItem('ananta_user');
      if (userJson) {
        tabKey = 'overview';
      }
    }

    // Update active class on nav items
    navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabKey) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Also highlight dropdown parent if a child view is selected
    const learnTabs = ['overview', 'docs', 'intuition', 'ai-assistant'];
    const learnNav = document.querySelector('.nav-item[data-tab="overview"]');
    if (learnNav && learnTabs.includes(tabKey)) {
      learnNav.classList.add('active');
    }

    // Toggle viewport sections
    sections.forEach(sec => {
      if (sec.id === `view-${tabKey}`) {
        sec.classList.add('active');
        sec.style.display = 'block';
      } else {
        sec.classList.remove('active');
        sec.style.display = 'none';
      }
    });

    // Sync URL hash safely without duplicate entries
    if (window.location.hash !== '#' + tabKey) {
      try {
        window.history.replaceState(null, '', '#' + tabKey);
      } catch (err) {
        window.location.hash = tabKey;
      }
    }

    // Scroll viewport to top on tab switch
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Stop background canvas render loops when tab is not active
    if (tabKey !== 'login' && window.rishiCanvasMain && window.rishiCanvasMain.stop) {
      window.rishiCanvasMain.stop();
    }
    if (tabKey !== 'simulator') {
      if (blochVisualizer && blochVisualizer.stop) blochVisualizer.stop();
      if (window.hwStudio && window.hwStudio.stopPulseAnimation) {
        window.hwStudio.stopPulseAnimation();
      }
    }
    if (tabKey !== 'intuition') {
      if (window.intuitionLab && window.intuitionLab.stopWaveAnimation) {
        window.intuitionLab.stopWaveAnimation();
      }
      if (window.conceptDoctor && window.conceptDoctor.stopAnimation) {
        window.conceptDoctor.stopAnimation();
      }
    }

    // Resize Bloch sphere & refresh microwave pulse canvas when entering simulator
    if (tabKey === 'simulator') {
      if (blochVisualizer) {
        if (blochVisualizer.start) blochVisualizer.start();
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          if (circuitUI) circuitUI.updateSimulation();
        }, 60);
      }
      if (window.hwStudio) {
        setTimeout(() => window.hwStudio.initPulseCanvas(), 80);
      }
    }

    // Refresh & start Rishi Canvas on login tab switch
    if (tabKey === 'login' && window.rishiCanvasMain) {
      setTimeout(() => {
        window.rishiCanvasMain.initSize();
        window.rishiCanvasMain.start();
      }, 50);
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
  window.switchTab = switchView;

  // Bind click on all nav items and dropdown links
  document.querySelectorAll('.nav-item, .dropdown-link').forEach(item => {
    item.addEventListener('click', (e) => {
      const tab = item.getAttribute('data-tab');
      if (tab) {
        e.preventDefault();
        switchView(tab);
      }
    });
  });

  // Bind click on mobile nav drawer items
  document.querySelectorAll('.mobile-nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', (e) => {
      const tab = item.getAttribute('data-tab');
      if (tab) {
        e.preventDefault();
        window.closeMobileNav();
        switchView(tab);
      }
    });
  });

  // Listen for browser hash changes (back/forward or URL typing)
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '');
    const valid = ['overview', 'simulator', 'algorithms', 'intuition', 'research', 'ai-assistant', 'challenges', 'docs', 'login'];
    if (h && valid.includes(h)) {
      switchView(h);
    }
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
  // Privacy safeguard: automatically purge legacy hardcoded account from client localStorage
  try {
    const legacyUser = localStorage.getItem('ananta_user');
    if (legacyUser && legacyUser.toLowerCase().includes('anushkagupta')) {
      localStorage.removeItem('ananta_user');
    }
  } catch (e) {}

  function updateNavUser() {
    const userJson = localStorage.getItem('ananta_user');
    const userContainer = document.getElementById('nav-user-container');
    const loginBtn = document.getElementById('nav-login-btn');
    const userAvatar = document.getElementById('nav-user-avatar');
    const userName = document.getElementById('nav-user-name');
    const mobileSignin = document.getElementById('mobile-nav-signin-link');
    const mobileUserBox = document.getElementById('mobile-nav-user-box');
    const mobileGreeting = document.getElementById('mobile-user-greeting');

    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (userContainer) userContainer.style.display = 'flex';
        if (loginBtn) loginBtn.style.display = 'none';
        if (userAvatar) userAvatar.textContent = user.avatar || (user.name ? user.name.charAt(0).toUpperCase() : 'A');
        if (userName) userName.textContent = user.name || 'User';

        // Mobile drawer user state
        if (mobileSignin) mobileSignin.style.display = 'none';
        if (mobileUserBox) mobileUserBox.style.display = 'flex';
        if (mobileGreeting) mobileGreeting.textContent = `Signed in as ${user.name || 'User'}`;
        return true;
      } catch (e) {
        console.error('Error parsing user session', e);
      }
    }
    if (userContainer) userContainer.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (mobileSignin) mobileSignin.style.display = 'block';
    if (mobileUserBox) mobileUserBox.style.display = 'none';
    return false;
  }

  const navLoginBtn = document.getElementById('nav-login-btn');
  if (navLoginBtn) {
    navLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('login');
    });
  }

  // Auth Tab Switcher (Sign In vs Create Account)
  window.switchAuthTab = (tab) => {
    const btnSignin = document.getElementById('tab-btn-signin');
    const btnSignup = document.getElementById('tab-btn-signup');
    const formSignin = document.getElementById('form-signin');
    const formSignup = document.getElementById('form-signup');
    const errBanner = document.getElementById('auth-error-banner');
    if (errBanner) errBanner.style.display = 'none';

    if (tab === 'signin') {
      if (btnSignin) btnSignin.classList.add('active');
      if (btnSignup) btnSignup.classList.remove('active');
      if (formSignin) formSignin.style.display = 'flex';
      if (formSignup) formSignup.style.display = 'none';
    } else {
      if (btnSignup) btnSignup.classList.add('active');
      if (btnSignin) btnSignin.classList.remove('active');
      if (formSignup) formSignup.style.display = 'flex';
      if (formSignin) formSignin.style.display = 'none';
    }
  };

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
    switchView('overview');
  };

  window.promptCustomGoogleAccount = () => {
    const email = window.prompt('Enter your Google / Gmail address:');
    if (!email || !email.includes('@')) {
      if (email !== null) alert('Please enter a valid email address.');
      return;
    }
    const defaultName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const name = window.prompt('Enter your display name:', defaultName) || defaultName;
    window.selectGoogleAccount(name, email);
  };

  let pendingAuthUser = null;
  let currentOtp = null;
  let resendTimer = null;
  let countdownSeconds = 30;

  // Live Password Strength Checker
  window.checkPasswordStrength = (pass) => {
    const fillBar = document.getElementById('strength-fill-bar');
    const strengthText = document.getElementById('strength-text');
    const ruleLen = document.getElementById('rule-len');
    const ruleCase = document.getElementById('rule-case');
    const ruleNum = document.getElementById('rule-num');
    const ruleSym = document.getElementById('rule-sym');

    const hasLen = pass.length >= 8;
    const hasCase = /[a-z]/.test(pass) && /[A-Z]/.test(pass);
    const hasNum = /[0-9]/.test(pass);
    const hasSym = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass);

    if (ruleLen) {
      ruleLen.className = hasLen ? 'pw-rule valid' : 'pw-rule';
      ruleLen.textContent = (hasLen ? '✓' : '✕') + ' At least 8 characters';
    }
    if (ruleCase) {
      ruleCase.className = hasCase ? 'pw-rule valid' : 'pw-rule';
      ruleCase.textContent = (hasCase ? '✓' : '✕') + ' Uppercase & lowercase';
    }
    if (ruleNum) {
      ruleNum.className = hasNum ? 'pw-rule valid' : 'pw-rule';
      ruleNum.textContent = (hasNum ? '✓' : '✕') + ' At least one number';
    }
    if (ruleSym) {
      ruleSym.className = hasSym ? 'pw-rule valid' : 'pw-rule';
      ruleSym.textContent = (hasSym ? '✓' : '✕') + ' Special character';
    }

    let score = 0;
    if (hasLen) score += 25;
    if (hasCase) score += 25;
    if (hasNum) score += 25;
    if (hasSym) score += 25;

    if (fillBar) fillBar.style.width = score + '%';

    if (strengthText) {
      if (score <= 25) {
        strengthText.className = 'strength-text-weak';
        strengthText.textContent = 'Weak';
        if (fillBar) fillBar.style.background = '#ef4444';
      } else if (score <= 75) {
        strengthText.className = 'strength-text-medium';
        strengthText.textContent = 'Moderate';
        if (fillBar) fillBar.style.background = '#f59e0b';
      } else {
        strengthText.className = 'strength-text-strong';
        strengthText.textContent = 'Strong ✓';
        if (fillBar) fillBar.style.background = '#10b981';
      }
    }
    return score >= 75; // Requires at least 3 out of 4 criteria (strong)
  };

  window.togglePasswordVisibility = (inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  };

  function showAuthError(msg) {
    const errBanner = document.getElementById('auth-error-banner');
    const succBanner = document.getElementById('auth-success-banner');
    if (succBanner) succBanner.style.display = 'none';
    if (errBanner) {
      errBanner.textContent = msg;
      errBanner.style.display = 'block';
    } else {
      alert(msg);
    }
  }

  function showAuthSuccess(msg) {
    const errBanner = document.getElementById('auth-error-banner');
    const succBanner = document.getElementById('auth-success-banner');
    if (errBanner) errBanner.style.display = 'none';
    if (succBanner) {
      succBanner.textContent = msg;
      succBanner.style.display = 'block';
    }
  }

  // Generate a random secure 6-digit OTP
  function generate6DigitOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Transition to OTP Verification Panel
  function initiateOtpVerification(userObj) {
    pendingAuthUser = userObj;
    currentOtp = generate6DigitOtp();

    const stepCreds = document.getElementById('auth-step-credentials');
    const stepOtp = document.getElementById('auth-step-otp');
    const targetEmail = document.getElementById('otp-target-email');
    const toastOtp = document.getElementById('toast-otp-code');
    const errBanner = document.getElementById('auth-error-banner');
    if (errBanner) errBanner.style.display = 'none';

    if (targetEmail) targetEmail.textContent = userObj.email;
    if (toastOtp) toastOtp.textContent = currentOtp;

    if (stepCreds) stepCreds.style.display = 'none';
    if (stepOtp) stepOtp.style.display = 'block';

    // Clear previous OTP inputs
    for (let i = 1; i <= 6; i++) {
      const el = document.getElementById('otp-' + i);
      if (el) el.value = '';
    }
    const firstInput = document.getElementById('otp-1');
    if (firstInput) firstInput.focus();

    startResendCountdown();
  }

  function startResendCountdown() {
    clearInterval(resendTimer);
    countdownSeconds = 30;
    const btnResend = document.getElementById('btn-resend-otp');
    const cdSpan = document.getElementById('resend-countdown');
    if (btnResend) btnResend.disabled = true;

    resendTimer = setInterval(() => {
      countdownSeconds--;
      if (cdSpan) cdSpan.textContent = countdownSeconds + 's';
      if (countdownSeconds <= 0) {
        clearInterval(resendTimer);
        if (btnResend) {
          btnResend.disabled = false;
          btnResend.textContent = 'Resend OTP Now';
        }
      }
    }, 1000);
  }

  window.resendOtp = () => {
    if (countdownSeconds > 0) return;
    currentOtp = generate6DigitOtp();
    const toastOtp = document.getElementById('toast-otp-code');
    if (toastOtp) toastOtp.textContent = currentOtp;
    showAuthSuccess('A fresh 6-digit OTP has been sent to your Gmail inbox!');
    startResendCountdown();
  };

  window.autoFillOtp = () => {
    if (!currentOtp) return;
    for (let i = 0; i < 6; i++) {
      const el = document.getElementById('otp-' + (i + 1));
      if (el) el.value = currentOtp.charAt(i);
    }
    window.verifyOtpAndLogin();
  };

  window.cancelOtpFlow = () => {
    clearInterval(resendTimer);
    pendingAuthUser = null;
    currentOtp = null;
    const stepCreds = document.getElementById('auth-step-credentials');
    const stepOtp = document.getElementById('auth-step-otp');
    if (stepOtp) stepOtp.style.display = 'none';
    if (stepCreds) stepCreds.style.display = 'block';
  };

  // Setup auto-tabbing for OTP inputs
  document.addEventListener('DOMContentLoaded', () => {
    for (let i = 1; i <= 6; i++) {
      const input = document.getElementById('otp-' + i);
      if (input) {
        input.addEventListener('input', (e) => {
          if (input.value.length === 1 && i < 6) {
            const next = document.getElementById('otp-' + (i + 1));
            if (next) next.focus();
          }
        });
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !input.value && i > 1) {
            const prev = document.getElementById('otp-' + (i - 1));
            if (prev) prev.focus();
          } else if (e.key === 'Enter') {
            window.verifyOtpAndLogin();
          }
        });
      }
    }
  });

  // Verify OTP and complete login
  window.verifyOtpAndLogin = () => {
    let enteredCode = '';
    for (let i = 1; i <= 6; i++) {
      const el = document.getElementById('otp-' + i);
      if (el) enteredCode += el.value.trim();
    }

    if (enteredCode.length < 6) {
      showAuthError('Please enter all 6 digits of the OTP sent to your Gmail.');
      return;
    }

    if (enteredCode !== currentOtp) {
      showAuthError('Invalid OTP code. Please check your Gmail notification.');
      return;
    }

    // OTP Successful: Finalize registration and session
    if (pendingAuthUser) {
      if (pendingAuthUser.isNewAccount) {
        const accounts = JSON.parse(localStorage.getItem('ananta_registered_users') || '[]');
        const idx = accounts.findIndex(a => a.email.toLowerCase() === pendingAuthUser.email.toLowerCase());
        if (idx >= 0) {
          accounts[idx] = pendingAuthUser;
        } else {
          accounts.push(pendingAuthUser);
        }
        localStorage.setItem('ananta_registered_users', JSON.stringify(accounts));
      }

      const sessionUser = {
        name: pendingAuthUser.name,
        email: pendingAuthUser.email,
        provider: 'email_otp',
        avatar: pendingAuthUser.name.charAt(0).toUpperCase(),
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem('ananta_user', JSON.stringify(sessionUser));
      updateNavUser();
      
      // Return UI state to normal
      window.cancelOtpFlow();
      showAuthSuccess('Verification successful! Welcome to Ananta Studio.');
      setTimeout(() => {
        switchView('overview');
      }, 500);
    }
  };

  // Sign In Flow (Validates password, then sends Gmail OTP)
  window.startSignInFlow = () => {
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-pass');
    const email = emailInput ? emailInput.value.trim() : '';
    const pass = passInput ? passInput.value : '';

    if (!email || !email.includes('@')) {
      showAuthError('Please enter your valid Gmail / Email address.');
      return;
    }
    if (!pass) {
      showAuthError('Please enter your password.');
      return;
    }

    const accounts = JSON.parse(localStorage.getItem('ananta_registered_users') || '[]');
    const existing = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());

    let name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (existing) {
      if (existing.password && existing.password !== pass) {
        showAuthError('Incorrect password for this account. Please try again.');
        return;
      }
      name = existing.name || name;
    }

    // Pass password verification -> Trigger Gmail OTP
    initiateOtpVerification({
      name: name,
      email: email,
      password: pass,
      isNewAccount: false
    });
  };

  // Sign Up Flow (Checks for strong password, then sends Gmail OTP)
  window.startSignUpFlow = () => {
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passInput = document.getElementById('signup-pass');
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const pass = passInput ? passInput.value : '';

    if (!name) {
      showAuthError('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      showAuthError('Please enter a valid Gmail / Email address.');
      return;
    }
    
    // Check Password Strength
    const isStrong = window.checkPasswordStrength(pass);
    if (!isStrong) {
      showAuthError('Password is too weak! Must be at least 8 chars with uppercase, numbers, and symbols.');
      return;
    }

    // Proceed to OTP Verification before creating account
    initiateOtpVerification({
      name: name,
      email: email,
      password: pass,
      isNewAccount: true
    });
  };

  window.startOtpLoginDirect = () => {
    const emailInput = document.getElementById('login-email');
    const email = emailInput && emailInput.value.trim() ? emailInput.value.trim() : window.prompt('Enter your Gmail address to send OTP:');
    if (!email || !email.includes('@')) {
      showAuthError('A valid Gmail address is required for OTP login.');
      return;
    }
    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    initiateOtpVerification({
      name: name,
      email: email,
      password: '',
      isNewAccount: false
    });
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
        name: 'Guest Researcher',
        email: 'guest@ananta-quantum.io',
        provider: 'guest',
        avatar: 'G',
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem('ananta_user', JSON.stringify(user));
      updateNavUser();
      switchView('overview');
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
    } else if (presetKey === 'ghz') {
      targetGrid = [
        ['H', 'CX_CTRL', null, null, null, null],
        [null, 'CX_TGT', 'CX_CTRL', null, null, null],
        [null, null, 'CX_TGT', null, null, null]
      ];
      const lbl = document.getElementById('circuit-filename-label');
      if (lbl) lbl.textContent = 'ghz_state_tripartite.qc';
    } else if (presetKey === 'teleport') {
      targetGrid = [
        ['H', null, 'CX_CTRL', 'H', null, null],
        [null, 'H', 'CX_TGT', null, 'CX_CTRL', null],
        [null, null, 'CX_TGT', null, 'CX_TGT', null]
      ];
      const lbl = document.getElementById('circuit-filename-label');
      if (lbl) lbl.textContent = 'quantum_teleportation.qc';
    } else if (presetKey === 'grover' || presetKey === 'grover_2qubit') {
      targetGrid = [
        ['H', 'Z', 'H', 'X', 'H', null],
        ['H', 'CX_TGT', 'H', 'X', 'H', null],
        [null, null, null, null, null, null]
      ];
      const lbl = document.getElementById('circuit-filename-label');
      if (lbl) lbl.textContent = 'grover_search.qc';
      if (window.ALGORITHM_CATALOG) targetAlgo = window.ALGORITHM_CATALOG.find(a => a.id === 'grover_2qubit');
    } else if (presetKey === 'vqe') {
      targetGrid = [
        ['X', 'H', 'CX_CTRL', 'H', null, null],
        [null, 'H', 'CX_TGT', 'S', null, null],
        [null, null, null, null, null, null]
      ];
      const lbl = document.getElementById('circuit-filename-label');
      if (lbl) lbl.textContent = 'vqe_molecular_h2.qc';
    } else if (presetKey === 'chsh') {
      targetGrid = [
        ['H', 'CX_CTRL', 'H', null, null, null],
        [null, 'CX_TGT', 'S', 'H', null, null],
        [null, null, null, null, null, null]
      ];
      const lbl = document.getElementById('circuit-filename-label');
      if (lbl) lbl.textContent = 'chsh_bell_inequality.qc';
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

  // Drawer Toggle Handlers for Clean Workspace
  window.toggleKnowledgeEngineDrawer = function() {
    const drawer = document.getElementById('ke-collapsible-drawer');
    const btn = document.getElementById('btn-toggle-ke-drawer');
    if (!drawer) return;
    drawer.classList.toggle('drawer-open');
    if (drawer.classList.contains('drawer-open')) {
      const inp = document.getElementById('ke-search-input');
      if (inp) inp.focus();
      if (btn) btn.classList.add('active');
    } else {
      if (btn) btn.classList.remove('active');
    }
  };

  window.toggleHardwareLabDrawer = function() {
    const drawer = document.getElementById('hw-collapsible-drawer');
    const btn = document.getElementById('btn-toggle-hw-drawer');
    if (!drawer) return;
    drawer.classList.toggle('drawer-open');
    if (drawer.classList.contains('drawer-open')) {
      if (btn) btn.classList.add('active');
    } else {
      if (btn) btn.classList.remove('active');
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
  let activeExportTab = 'cirq';

  function updateExportCode() {
    if (!circuitUI || !exportCodeEl) return;
    const grid = circuitUI.getGrid ? circuitUI.getGrid() : circuitUI.grid;
    if (!grid) return;

    let code = '';
    if (activeExportTab === 'cirq') {
      code = engine.toCirq(grid);
      if (exportFrameworkLabel) exportFrameworkLabel.textContent = 'Google Cirq >= 1.3 - Willow & Sycamore QPU ready';
    } else if (activeExportTab === 'qiskit') {
      code = engine.toQiskit(grid);
      if (exportFrameworkLabel) exportFrameworkLabel.textContent = 'Qiskit 1.x compatible';
    } else if (activeExportTab === 'pennylane') {
      code = engine.toPennyLane(grid);
      if (exportFrameworkLabel) exportFrameworkLabel.textContent = 'PennyLane >= 0.38 (Xanadu)';
    } else if (activeExportTab === 'qasm') {
      code = engine.toQASM(grid);
      if (exportFrameworkLabel) exportFrameworkLabel.textContent = 'OpenQASM 2.0 standard';
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

  // ==========================================
  // 8B. QUANTUM ALGORITHM ZOO EXPLORER ENGINE
  // ==========================================
  let activeZooCategory = 'all';
  let zooSearchQuery = '';

  window.switchResearchMode = function(mode) {
    const papersSub = document.getElementById('research-papers-subview');
    const zooSub = document.getElementById('quantum-zoo-subview');
    const tabPapers = document.getElementById('tab-mode-papers');
    const tabZoo = document.getElementById('tab-mode-zoo');

    if (mode === 'zoo') {
      if (papersSub) papersSub.style.display = 'none';
      if (zooSub) zooSub.style.display = 'block';
      if (tabPapers) tabPapers.classList.remove('active');
      if (tabZoo) tabZoo.classList.add('active');
      renderZooLibrary();
    } else {
      if (papersSub) papersSub.style.display = 'block';
      if (zooSub) zooSub.style.display = 'none';
      if (tabPapers) tabPapers.classList.add('active');
      if (tabZoo) tabZoo.classList.remove('active');
      renderResearchLibrary();
    }
  };

  window.setZooCategory = function(cat) {
    activeZooCategory = cat;
    document.querySelectorAll('.zoo-cat-pill').forEach(pill => {
      if (pill.getAttribute('data-zoocat') === cat) pill.classList.add('active');
      else pill.classList.remove('active');
    });
    renderZooLibrary();
  };

  window.filterZooAlgorithms = function() {
    const input = document.getElementById('zoo-search-input');
    const clearBtn = document.getElementById('btn-clear-zoo-search');
    zooSearchQuery = input ? input.value.trim() : '';
    if (clearBtn) clearBtn.style.display = zooSearchQuery ? 'inline-block' : 'none';
    renderZooLibrary();
  };

  window.clearZooSearch = function() {
    const input = document.getElementById('zoo-search-input');
    const clearBtn = document.getElementById('btn-clear-zoo-search');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    zooSearchQuery = '';
    renderZooLibrary();
  };

  function renderZooLibrary() {
    const zooGrid = document.getElementById('zoo-grid-container');
    const resultsCounter = document.getElementById('zoo-results-count');
    if (!zooGrid || !window.QUANTUM_ALGORITHM_ZOO) return;

    const zoo = window.QUANTUM_ALGORITHM_ZOO;
    const algos = zoo.algorithms || [];
    const refs = zoo.references || {};

    const filtered = algos.filter(a => {
      const matchesCat = activeZooCategory === 'all' || a.category === activeZooCategory;
      if (!matchesCat) return false;

      if (!zooSearchQuery) return true;
      const q = zooSearchQuery.toLowerCase();
      const nameMatch = a.name && a.name.toLowerCase().includes(q);
      const descMatch = a.description && a.description.toLowerCase().includes(q);
      const speedupMatch = a.speedup && a.speedup.toLowerCase().includes(q);
      const catMatch = a.category && a.category.toLowerCase().includes(q);
      return nameMatch || descMatch || speedupMatch || catMatch;
    });

    if (resultsCounter) {
      resultsCounter.textContent = `Showing ${filtered.length} of ${algos.length} algorithms`;
    }

    if (filtered.length === 0) {
      zooGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;">
          <h3 style="font-size: 18px; margin-bottom: 8px; color: var(--text-white);">No matching algorithms found in Zoo</h3>
          <p style="font-size: 13px; color: var(--text-dim);">Try searching by problem type (e.g. 'search', 'matrix', 'factoring', 'graph', 'Hamiltonian').</p>
        </div>
      `;
      return;
    }

    zooGrid.innerHTML = '';
    filtered.forEach(a => {
      const card = document.createElement('div');
      card.className = 'zoo-card';

      // Speedup color class
      let speedupClass = 'speedup-poly';
      const spLower = (a.speedup || '').toLowerCase();
      if (spLower.includes('superpolynomial') || spLower.includes('exponential')) {
        speedupClass = 'speedup-superpoly';
      } else if (spLower.includes('constant')) {
        speedupClass = 'speedup-constant';
      }

      // Implementation buttons
      let implHtml = '';
      if (a.implementations && a.implementations.length > 0) {
        implHtml = `
          <div class="zoo-impl-row">
            <span class="zoo-impl-label">Implementations:</span>
            <div class="zoo-impl-links">
              ${a.implementations.map(impl => `
                <a href="${impl.url}" target="_blank" rel="noopener noreferrer" class="zoo-impl-chip">
                  ${impl.name} ↗
                </a>
              `).join('')}
            </div>
          </div>
        `;
      }

      // Citations HTML
      let citationsHtml = '';
      if (a.citations && a.citations.length > 0) {
        const citedRefs = a.citations.map(cId => refs[cId]).filter(Boolean);
        if (citedRefs.length > 0) {
          citationsHtml = `
            <details class="zoo-citations-details">
              <summary>📚 ${citedRefs.length} Cited Research Publication${citedRefs.length > 1 ? 's' : ''}</summary>
              <ul class="zoo-citations-list">
                ${citedRefs.map(r => `
                  <li>
                    <span class="cite-num">[${r.number}]</span>
                    <span class="cite-text">${r.citation}</span>
                    ${r.url ? `<a href="${r.url}" target="_blank" rel="noopener noreferrer" class="cite-link">arXiv / Source ↗</a>` : ''}
                  </li>
                `).join('')}
              </ul>
            </details>
          `;
        }
      }

      card.innerHTML = `
        <div class="zoo-card-header">
          <div class="zoo-cat-badge">${a.category.replace('Algorithms', '').trim()}</div>
          <span class="zoo-speedup-badge ${speedupClass}">${a.speedup}</span>
        </div>
        <h3 class="zoo-card-title">${a.name}</h3>
        <p class="zoo-card-desc">${a.description}</p>
        ${implHtml}
        ${citationsHtml}
      `;

      zooGrid.appendChild(card);
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
  } else if (!isLoggedIn) {
    switchView('login');
  } else {
    switchView('overview');
  }

  // DevSite Header Search Integration
  window.focusKnowledgeEngineSearch = function() {
    switchView('simulator');
    setTimeout(() => {
      const searchInput = document.getElementById('ke-search-input');
      const keBar = document.getElementById('knowledge-engine-container');
      if (keBar && keBar.classList.contains('ke-collapsed')) {
        keBar.classList.remove('ke-collapsed');
      }
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  // Google Quantum AI Smooth Section Scrolling
  window.scrollToSection = function(sectionId) {
    switchView('overview');
    setTimeout(() => {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  // 6-Milestone Interactive Roadmap Selection
  window.selectMilestone = function(idx) {
    const cards = document.querySelectorAll('.roadmap-card');
    cards.forEach(c => {
      if (parseInt(c.dataset.milestone) === idx) {
        c.classList.add('active');
        c.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        c.classList.remove('active');
      }
    });

    const nodes = document.querySelectorAll('.timeline-node');
    nodes.forEach((n, i) => {
      if (i + 1 === idx) {
        n.classList.add('active');
      } else {
        n.classList.remove('active');
      }
    });

    const progressBar = document.querySelector('.timeline-line-progress');
    if (progressBar) {
      const pct = Math.min(100, Math.max(0, ((idx - 1) / 5) * 100));
      progressBar.style.width = pct + '%';
    }
  };

  // Wire click events on roadmap cards
  document.querySelectorAll('.roadmap-card').forEach(card => {
    card.addEventListener('click', () => {
      const mId = parseInt(card.dataset.milestone);
      if (mId) window.selectMilestone(mId);
    });
  });

  // Interactive 3D Mouse Parallax for Floating Quantum Processor Chip
  const chipScene = document.getElementById('chip-scene');
  const chipCard = document.getElementById('chip-card');
  if (chipScene && chipCard) {
    chipScene.addEventListener('mousemove', (e) => {
      const rect = chipScene.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotX = 24 - (y / rect.height) * 28;
      const rotY = -18 + (x / rect.width) * 28;
      chipCard.style.animation = 'none';
      chipCard.style.transform = `perspective(900px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) rotateZ(12deg)`;
    });

    chipScene.addEventListener('mouseleave', () => {
      chipCard.style.animation = 'floatQuantumChip 7s ease-in-out infinite alternate';
    });
  }

  // =========================================================================
  // DOCUMENTATION SEARCH, SMOOTH SCROLL & SNIPPET COPY HELPERS
  // =========================================================================
  window.scrollDocIntoView = function(e, secId) {
    if (e && e.preventDefault) e.preventDefault();
    const el = document.getElementById(secId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update active pill
    document.querySelectorAll('.doc-nav-pill').forEach(pill => {
      if (pill.getAttribute('href') === `#${secId}`) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  };

  window.filterDocsSections = function(query) {
    const q = (query || '').toLowerCase().trim();
    const clearBtn = document.getElementById('docs-filter-clear');
    if (clearBtn) clearBtn.style.display = q ? 'inline-block' : 'none';

    const cards = document.querySelectorAll('.doc-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      if (!q || text.includes(q)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  };

  window.clearDocsFilter = function() {
    const input = document.getElementById('docs-filter-input');
    if (input) {
      input.value = '';
      window.filterDocsSections('');
    }
  };

  window.copySnippetText = function(btn) {
    if (!btn) return;
    const shell = btn.closest('.doc-code-shell');
    if (!shell) return;
    const code = shell.querySelector('code');
    if (!code) return;

    const textToCopy = code.innerText || code.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = btn.textContent;
      btn.textContent = 'Copied! ✓';
      btn.style.background = '#10b981';
      btn.style.color = '#ffffff';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy', err);
    });
  };
});

