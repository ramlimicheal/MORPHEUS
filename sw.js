const CACHE_NAME = 'morpheus-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/morpheus.css',
  '/css/responsive.css',
  '/manifest.json',
  '/js/lottie.min.js',
  '/js/memory.js',
  '/js/audio-engine.js',
  '/js/ambient-engine.js',
  '/js/visualizer.js',
  '/js/rhythm-engine.js',
  '/js/vision-board.js',
  '/js/session.js',
  '/js/protocols.js',
  '/js/analytics.js',
  '/js/presets.js',
  '/js/breathing.js',
  '/js/guided-voice.js',
  '/js/reminder.js',
  '/js/mixer.js',
  '/js/pwa.js',
  '/js/app.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // Network-first for HTML
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request).then(function(r) {
          return r || caches.match('/index.html');
        });
      })
    );
    return;
  }

  // Cache-first for audio, animations, and static assets
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      });
    })
  );
});
