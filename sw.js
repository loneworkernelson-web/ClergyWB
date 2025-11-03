// Define a name for the current cache
const CACHE_NAME = 'toku-hauora-cache-v1';

// List of files to cache
const FILES_TO_CACHE = [
    'index.html',
    'manifest.json',
    'https://i.postimg.cc/6pPSn3Fr/Clergy-Wellbeing.jpg', // Updated Logo 192
    'https://i.postimg.cc/6pPSn3Fr/Clergy-Wellbeing.jpg', // Updated Logo 512
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Install event: caches the files
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching app shell');
                // Use addAll for atomic caching
                return cache.addAll(FILES_TO_CACHE).catch(err => {
                    // This catch is important. If one file fails, addAll() rejects.
                    // This can happen if an external resource (like the font) is temporarily unavailable.
                    console.warn('[ServiceWorker] Caching failed on install:', err);
                    // You might want to retry or handle this, but for now, just log it.
                });
            })
    );
});

// Activate event: cleans up old caches
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
    return self.clients.claim(); // Makes the new SW take control immediately
});

// Fetch event: serves files from cache first, then network (Cache-First strategy)
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Not in cache - go to network
                return fetch(event.request)
                    .then((response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Check if the request is one of the files we want to cache
                        // This avoids caching every single request (e.g., from an extension)
                        // Updated this logic to be more permissive for placehold.co
                        const url = event.request.url;
                        if (FILES_TO_CACHE.includes(url) || url.startsWith(self.location.origin) || url.startsWith('https://placehold.co') || url.startsWith('https://fonts.gstatic.com')) {
                             // Clone the response
                            const responseToCache = response.clone();

                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return response;
                    }
                ).catch(err => {
                    // Network request failed
                    console.warn('[ServiceWorker] Fetch failed:', err);
                    // You could return a specific offline page here if you had one in the cache
                });
            })
    );
});

