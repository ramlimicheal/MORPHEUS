(function(){
  'use strict';
  window.MORPHEUS = window.MORPHEUS || {};

  var deferredPrompt = null;
  var banner = document.getElementById('pwa-install-banner');
  var installBtn = document.getElementById('pwa-install-btn');
  var dismissBtn = document.getElementById('pwa-dismiss-btn');

  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(reg) {
        console.log('[PWA] Service worker registered:', reg.scope);
      }).catch(function(err) {
        console.warn('[PWA] SW registration failed:', err);
      });
    });
  }

  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    if (banner && !localStorage.getItem('morpheus_pwa_dismissed')) {
      banner.classList.add('visible');
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', function() {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function(result) {
        if (result.outcome === 'accepted') {
          console.log('[PWA] App installed');
        }
        deferredPrompt = null;
        if (banner) banner.classList.remove('visible');
      });
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', function() {
      if (banner) banner.classList.remove('visible');
      localStorage.setItem('morpheus_pwa_dismissed', '1');
    });
  }

  window.addEventListener('appinstalled', function() {
    if (banner) banner.classList.remove('visible');
    deferredPrompt = null;
  });

  MORPHEUS.PWA = { installed: false };
})();
