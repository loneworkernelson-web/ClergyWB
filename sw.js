const CACHE_NAME = 'toku-hauora-cache-v3'; // Incremented version
const CACHE_FILES = [
  '/', // The root
  'TokuHauora_Corrected.html',
  'config.js',
  'tailwind.css', // This is the local file
  'manifest.json',
  'https://loneworkernelson-web.github.io/ClergyWB/Toku%20Haura.png', // App icon
  // External Libraries
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js', // Updated from 7.1.1 to 7
  // Firebase SDKs
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
];

// Install: Cache all critical files
self.addEventListener('install', (e) => {
  console.log('[ServiceWorker] Install');
  e.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      console.log('[ServiceWorker] Caching app shell');
      
      // We need to fetch all files.
      // For cross-origin files (CDNs), we must use 'cors' mode.
      const requests = CACHE_FILES.map(url => {
        // Use 'cors' mode for any URL that starts with 'http'
        const mode = url.startsWith('http') ? 'cors' : 'same-origin';
        const request = new Request(url, { mode: mode });
        
        return fetch(request).then(response => {
          if (!response.ok) {
            // For 'opaque' responses (like some 'cors' requests), we can't check status.
            // But if it's not opaque and not ok, it's an error.
            if (response.type !== 'opaque' && !response.ok) {
              throw new Error(`Failed to fetch ${url} - status ${response.status}`);
            }
          }
          // Put the valid response into the cache
          return cache.put(request, response);
        });
      });
      
      await Promise.all(requests);
      console.log('[ServiceWorker] All files cached successfully.');
      
    } catch (error) {
      console.error('[ServiceWorker] Caching failed on install:', error);
      // If caching fails, don't let this broken worker take over
      self.skipWaiting();
    }
  })());
});

// Activate: Clean up old caches
self.addEventListener('activate', (e) => {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(caches.keys().then((keyList) => {
    return Promise.all(keyList.map((key) => {
      // Delete all caches *except* the new one
      if (key !== CACHE_NAME) {
        console.log('[ServiceWorker] Removing old cache', key);
        return caches.delete(key);
      }
    }));
  }));
  return self.clients.claim();
});

// Fetch: Serve from cache, then network (Cache-First strategy)
self.addEventListener('fetch', (e) => {
  // We only want to cache GET requests
  if (e.request.method !== 'GET') {
    return;
  }
  
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    // console.log(`[ServiceWorker] Fetching resource: ${e.request.url}`);
    if (r) {
      // console.log(`[ServiceWorker] Serving from cache: ${e.request.url}`);
      return r;
    }

    // Not in cache, fetch from network
    try {
      const response = await fetch(e.request);
      
      // Don't cache firestore requests or non-OK responses
      if (!response || response.status !== 200 || response.type === 'error' || e.request.url.includes('firestore.googleapis.com')) {
        return response;
      }

      // Clone the response and cache it
      const cache = await caches.open(CACHE_NAME);
      // console.log(`[ServiceWorker] Caching new resource: ${e.request.url}`);
      cache.put(e.request, response.clone());
      return response;
    } catch (error) {
      console.error(`[ServiceWorker] Fetch failed: ${e.request.url}`, error);
      // You could return a fallback offline page here if you had one
    }
  })());
});
