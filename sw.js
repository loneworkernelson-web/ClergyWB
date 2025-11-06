const CACHE_NAME = 'hauora-cache-v6'; // Incremented version
// We now cache 'index.html' instead of the old name
const URLS_TO_CACHE = [
    'index.html', // THIS IS THE CRITICAL CHANGE
    'config-b.js',
    'manifest-b.json',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
    'https://loneworkernelson-web.github.io/ClergyWB/Toku%20Haura.png' // Icon
];

// Install event: cache the app shell
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Install v5');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Caching app shell');
                // We must fetch these resources.
                return cache.addAll(URLS_TO_CACHE);
            })
            .catch(err => {
                console.warn('[ServiceWorker] addAll failed, trying individual fetches:', err);
                return caches.open(CACHE_NAME).then(cache => {
                    const promises = URLS_TO_CACHE.map(url => {
                        // Use 'no-cors' for CDN assets as a fallback
                        const request = new Request(url, { mode: 'no-cors' }); 
                        return fetch(request).then(response => {
                            if (response.status === 200 || response.status === 0) { // status 0 for opaque
                                return cache.put(url, response);
                            }
                            console.warn(`[ServiceWorker] Skipping cache for: ${url} (Status: ${response.status})`);
                        }).catch(fetchErr => {
                            console.error(`[ServiceWorker] Failed to fetch and cache: ${url}`, fetchErr);
                        });
                    });
                    return Promise.all(promises);
                });
            })
            .catch(err => {
                 console.error('[ServiceWorker] Caching failed on install:', err);
            })
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activate v5');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event: serve from cache, fall back to network
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    // Cache first, falling back to network
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request);
            })
    );
});
