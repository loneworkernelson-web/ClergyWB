const CACHE_NAME = 'hauora-cache-v13'; // Incremented version
// We now cache 'index.html', 'config.js', 'manifest.json'
// We *do not* cache the tailwind CDN, as it's better to let the browser
// handle that and it simplifies the service worker logic.
// The app will work offline, just unstyled.
const URLS_TO_CACHE = [
    'index.html',
    'config.js',
    'manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
    'https://loneworkernelson-web.github.io/ClergyWB/Toku%20Haura.png' // Icon
];

// Install event: cache the app shell
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Install v13');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Caching app shell');
                // We must fetch these resources.
                // Using 'no-cors' for CDNs is an option but can be unreliable.
                // We will try a standard fetch first.
                return cache.addAll(URLS_TO_CACHE);
            })
            .catch(err => {
                 console.error('[ServiceWorker] Caching failed on install:', err);
            })
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activate v13');
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
    
    const url = new URL(event.request.url);

    // Don't cache Firebase requests
    if (url.hostname.includes('firebase') || url.hostname.includes('googleapis.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Cache first, falling back to network
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // If not in cache, fetch from network
                return fetch(event.request).then(
                    response => {
                        // We don't cache new requests here to keep it simple,
                        // only what's defined in URLS_TO_CACHE on install.
                        return response;
                    }
                );
            })
    );
});
