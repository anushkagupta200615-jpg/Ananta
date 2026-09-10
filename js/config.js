// Ananta Quantum Studio - Secrets & API Configuration
(function() {
  const _k = 'QVEuQWI4Uk42TFozV0wtZ2JnOUh0bldoVzFJNG5qY3JWTkVWMFBReEVHQ2JwYmdvRHdHdmc=';
  const _dec = typeof atob === 'function' ? atob(_k) : '';
  window.ANANTA_CONFIG = {
    GEMINI_API_KEY: (typeof localStorage !== 'undefined' && localStorage.getItem('ananta_gemini_key')) || _dec,
    OPENAI_API_KEY: '',
    DEFAULT_PROVIDER: 'gemini'
  };
})();
