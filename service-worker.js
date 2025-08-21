// Service Worker for Meditation Timer PWA
// Comprehensive offline support with intelligent caching

const CACHE_VERSION = 16;
const CACHE_NAME = `meditation-timer-v${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_NAME}`;
const RUNTIME_CACHE = `runtime-${CACHE_NAME}`;

// Core assets that must be cached for offline functionality
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './src/App.js',
    './src/PracticeConfig.js',
    './src/DataManager.js',
    './src/UIManager.js',
    './src/PushNotificationManager.js',
    './src/SMAManager.js',
    './src/db.js',
    './src/SessionBuilder.js',
    './src/Stats.js',
    './src/timerUtils.js',
    './src/utils.js',
    './src/Timer.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './bell.mp3',
    './bell.ogg'
];

// External dependencies to cache
const EXTERNAL_ASSETS = [
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install event - cache all required resources
self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            // Cache static assets
            const staticCache = await caches.open(STATIC_CACHE);
            await staticCache.addAll(STATIC_ASSETS);
            
            // Cache external assets with error handling
            const runtimeCache = await caches.open(RUNTIME_CACHE);
            for (const url of EXTERNAL_ASSETS) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        await runtimeCache.put(url, response);
                    }
                } catch (error) {
                    console.warn(`Failed to cache ${url}:`, error);
                }
            }
            
            // Skip waiting to activate immediately
            await self.skipWaiting();
        })()
    );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            // Clean up old caches
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter(name => name.startsWith('meditation-timer-') && 
                           !name.includes(`v${CACHE_VERSION}`))
                    .map(name => caches.delete(name))
            );
            
            // Take control of all clients
            await self.clients.claim();
        })()
    );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    event.respondWith(
        (async () => {
            // Check if request is for static assets
            if (STATIC_ASSETS.includes(url.pathname) || 
                url.pathname.endsWith('.html') ||
                url.pathname.endsWith('.css') ||
                url.pathname.endsWith('.js') ||
                url.pathname.endsWith('.mp3') ||
                url.pathname.endsWith('.ogg')) {
                
                // Try cache first for static assets
                const cached = await caches.match(request);
                if (cached) return cached;
                
                // If not in cache, try network and cache it
                try {
                    const response = await fetch(request);
                    if (response.ok) {
                        const cache = await caches.open(STATIC_CACHE);
                        cache.put(request, response.clone());
                    }
                    return response;
                } catch (error) {
                    // Return offline page if available
                    return caches.match('./index.html');
                }
            }
            
            // For external resources (like Chart.js)
            if (request.url.includes('cdn.jsdelivr.net')) {
                const cached = await caches.match(request);
                if (cached) return cached;
                
                try {
                    const response = await fetch(request);
                    if (response.ok) {
                        const cache = await caches.open(RUNTIME_CACHE);
                        cache.put(request, response.clone());
                    }
                    return response;
                } catch (error) {
                    // Return cached version or error
                    return new Response('External resource not available offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                }
            }
            
            // For all other requests, try network first, fall back to cache
            try {
                const response = await fetch(request);
                if (response.ok && request.url.startsWith('http')) {
                    const cache = await caches.open(RUNTIME_CACHE);
                    cache.put(request, response.clone());
                }
                return response;
            } catch (error) {
                const cached = await caches.match(request);
                return cached || new Response('Offline', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            }
        })()
    );
});

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
    event.waitUntil((async () => {
        const defaultOptions = {
            title: 'Mindfulness Reminder',
            body: 'Time for your practice',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'sma-reminder',
            data: { type: 'sma' }
        };

        let dueIds = [];
        if (event.data) {
            try {
                const payload = event.data.json();
                if (Array.isArray(payload?.due)) {
                    dueIds = payload.due;
                } else if (payload?.smaId) {
                    dueIds = [payload.smaId];
                }
            } catch (e) {
                console.warn('Push payload parse error:', e);
            }
        }

        // If no IDs provided, show generic
        if (dueIds.length === 0) {
            return self.registration.showNotification(defaultOptions.title, defaultOptions);
        }

        // Try to look up names in IndexedDB
        let names = [];
        try {
            const db = await openSmaDB();
            if (db) {
                names = await Promise.all(dueIds.map(id => getSmaNameById(db, id)));
                names = names.filter(Boolean);
            }
        } catch (err) {
            console.warn('IndexedDB lookup failed:', err);
        }

        // If we have names, show one per ID (limit to 3 to avoid spam)
        if (names.length > 0) {
            const toShow = names.slice(0, 3);
            for (const name of toShow) {
                await self.registration.showNotification(defaultOptions.title, {
                    ...defaultOptions,
                    body: name
                });
            }
            // If more pending beyond 3, indicate there are more
            if (names.length > 3) {
                await self.registration.showNotification(defaultOptions.title, {
                    ...defaultOptions,
                    body: `${names.length - 3} more reminders`
                });
            }
            return;
        }

        // Fallback to generic if no names found
        return self.registration.showNotification(defaultOptions.title, defaultOptions);
    })());
});

// IndexedDB helpers for SW lookup
function openSmaDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MeditationTimerDB', 3);
        request.onerror = () => resolve(null);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
            // Do not create schema here; SW relies on app to create 'smas'
        };
    });
}

function getSmaNameById(db, id) {
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction(['smas'], 'readonly');
            const store = tx.objectStore('smas');
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result?.name || null);
            req.onerror = () => resolve(null);
        } catch (e) {
            resolve(null);
        }
    });
}

// Notification click event - handle user interaction with notifications
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(clientList => {
            const scopeUrl = self.registration.scope || (location.origin + location.pathname.replace(/service-worker\.js$/, ''));
            const targetUrl = scopeUrl.endsWith('/') ? scopeUrl : scopeUrl + '/';
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url.startsWith(targetUrl)) {
                    return client.focus();
                }
            }
            
            // Otherwise, open the app
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// Message event - handle cache updates
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_CHART_JS') {
        event.waitUntil(
            (async () => {
                const cache = await caches.open(RUNTIME_CACHE);
                try {
                    const response = await fetch(EXTERNAL_ASSETS[0]);
                    if (response.ok) {
                        await cache.put(EXTERNAL_ASSETS[0], response);
                        event.ports[0].postMessage({ success: true });
                    }
                } catch (error) {
                    event.ports[0].postMessage({ success: false, error: error.message });
                }
            })()
        );
    }
});
