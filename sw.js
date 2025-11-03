// A simple service worker for caching the app shell

const CACHE_NAME = 'taha-hinengaro-check-v1';
// This is the list of files that make up the "app shell"
const FILES_TO_CACHE = [
  'index.html', // Updated from clergy_wellbeing_app_html
  'manifest.json',
  'https.cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  // Note: The icon files are from a CDN and will be cached by the browser,
  // but for a production app, you'd add your local icon paths here.
];

// Install event: cache the app shell
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      // We use addAll which fetches and caches.
      // We use fetch with { cache: 'no-store' } for CDN resources
      // to ensure we get a fresh copy from the network for the cache.
      const cachePromises = FILES_TO_CACHE.map(urlToCache => {
        // Handle local files (like index.html and manifest.json)
        if (!urlToCache.startsWith('http')) {
          return cache.add(new Request(urlToCache, { cache: 'no-store' }));
        }
        
        // Handle CDN files
        return fetch(urlToCache, { cache: 'no-store' }).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch ${urlToCache}`);
          }
          return cache.put(urlToCache, response);
        });
      });
      return Promise.all(cachePromises);
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch event: serve from cache first, then network
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        // We found it in the cache!
        // console.log(`[ServiceWorker] Returning from cache: ${event.request.url}`);
        return response;
      }

      // Not in cache, so fetch from network
      // console.log(`[ServiceWorker] Fetching from network: ${event.request.url}`);
      return fetch(event.request).then((networkResponse) => {
        // We don't cache responses here, as the install step handles caching the app shell.
        // This is a simple cache-first strategy.
        // For dynamic content, you might want to add to cache here.
        return networkResponse;
      }).catch((error) => {
        console.error('[ServiceWorker] Fetch failed:', error);
        // You could return a simple offline fallback page here if you had one.
      });
    })
  );
});

