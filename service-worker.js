// Service Worker for Meditation Timer PWA
// Comprehensive offline support with intelligent caching

const CACHE_VERSION = 6;
const CACHE_NAME = `meditation-timer-v${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_NAME}`;
const RUNTIME_CACHE = `runtime-${CACHE_NAME}`;

// Core assets that must be cached for offline functionality
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './script.js',
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
    let notificationData = {
        title: 'Mindfulness Reminder',
        body: 'Time for your practice',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'sma-reminder',
        data: {}
    };
    
    if (event.data) {
        try {
            const payload = event.data.json();
            notificationData = { ...notificationData, ...payload };
        } catch (error) {
            console.error('Failed to parse push payload:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            data: notificationData.data,
            requireInteraction: false,
            actions: [
                {
                    action: 'open',
                    title: 'Open App',
                    icon: '/icon-192.png'
                }
            ]
        })
    );
});

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
