const CACHE_NAME = 'hauora-cache-v4';
// We now cache the app shell and the CDN resources.
// We do NOT cache the tailwind.css file anymore.
const URLS_TO_CACHE = [
    'TokuHauora_Corrected.html', // This is the main HTML file
    'config.js',
    'manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
    'https://loneworkernelson-web.github.io/ClergyWB/Toku%20Haura.png' // Icon
];

// Install event: cache the app shell
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Install v4');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Caching app shell');
                
                // We must fetch these resources. 
                // Using 'no-cors' for CDNs is an option but can be unreliable if the CDN 
                // doesn't return an opaque response. We'll try a standard fetch first.
                // The main issue before was trying to cache a file that 404'd (tailwind.css)
                return cache.addAll(URLS_TO_CACHE);
            })
            .catch(err => {
                // This is a common error with CDNs that don't support CORS in 'addAll'
                // We'll try a more robust way by fetching individually.
                console.warn('[ServiceWorker] addAll failed, trying individual fetches:', err);
                return caches.open(CACHE_NAME).then(cache => {
                    const promises = URLS_TO_CACHE.map(url => {
                        // Use 'no-cors' for CDN assets as a fallback
                        const request = new Request(url, { mode: 'no-cors' });
                        return fetch(request).then(response => {
                            // Only cache valid responses
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
    console.log('[ServiceWorker] Activate v4');
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
    // We only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Use a "Cache first, falling back to network" strategy for all cached assets
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // console.log('[ServiceWorker] Fetching from cache:', event.request.url);
                    return cachedResponse;
                }

                // console.log('[ServiceWorker] Fetching from network:', event.request.url);
                return fetch(event.request).then(
                    response => {
                        // We don't cache Firebase requests or other dynamic content
                        return response;
                    }
                ).catch(err => {
                    console.error('[ServiceWorker] Fetch failed:', err);
                    // You could return a custom offline page here if you had one
                });
            })
    );
});
