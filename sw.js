/**
 * Growth90 Service Worker
 * Progressive Web App functionality with offline support
 */

const CACHE_NAME = 'growth90-v1.1.0';
const STATIC_CACHE_NAME = 'growth90-static-v1.1.0';
const DYNAMIC_CACHE_NAME = 'growth90-dynamic-v1.1.0';

// Define what to cache
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/critical.css',
    '/css/main.css',
    '/js/app.js',
    '/js/storage.js',
    '/js/onboarding.js',
    '/manifest.json',
    // Add other static assets as they are created
    '/favicon.ico'
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
    '/api/v1/content/',
    '/api/v1/learning-paths/',
    '/api/v1/assessments/'
];

// Assets that should never be cached
const NEVER_CACHE = [
    '/api/v1/auth/',
    '/api/v1/analytics/',
    '/api/v1/users/profile/update'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Force the waiting service worker to become the active service worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Service Worker: Failed to cache static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old cache versions
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName.startsWith('growth90-')) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // Ensure the service worker takes control immediately
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('❌ Service Worker: Activation failed:', error);
            })
    );
});

// Fetch event - DISABLED CACHING FOR DEVELOPMENT
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip caching for chrome-extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // ALWAYS fetch from network for development - no caching
    event.respondWith(
        fetch(request).catch(() => {
            // Only fallback to cache if network completely fails
            return caches.match(request) || new Response('Offline', { status: 503 });
        })
    );
});

// Main caching strategy handler
async function getCachedResponse(request) {
    const url = new URL(request.url);
    
    // Strategy 1: Cache First for static assets
    if (STATIC_ASSETS.includes(url.pathname) || 
        request.destination === 'style' || 
        request.destination === 'script' ||
        request.destination === 'manifest') {
        return cacheFirstStrategy(request);
    }
    
    // Strategy 2: Network First for API calls
    if (url.pathname.startsWith('/api/')) {
        return networkFirstStrategy(request);
    }
    
    // Strategy 3: Stale While Revalidate for other resources
    return staleWhileRevalidateStrategy(request);
}

// Cache First Strategy - for static assets
async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
        
    } catch (error) {
        console.error('Cache First Strategy failed:', error);
        // Return offline fallback if available
        return getOfflineFallback(request);
    }
}

// Network First Strategy - for API calls
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok && request.method === 'GET') {
            // Cache successful GET responses
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Add a header to indicate this is a cached response
            const headers = new Headers(cachedResponse.headers);
            headers.set('X-Cached-Response', 'true');
            
            return new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: headers
            });
        }
        
        // Return offline response for API calls
        return getOfflineApiResponse(request);
    }
}

// Stale While Revalidate Strategy - for other resources
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    // Get cached version immediately
    const cachedResponse = await cache.match(request);
    
    // Fetch new version in background
    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch((error) => {
            return cachedResponse;
        });
    
    // Return cached version immediately if available, otherwise wait for network
    return cachedResponse || fetchPromise;
}

// Offline fallback responses
async function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    if (request.destination === 'document') {
        // Return cached index.html for navigation requests
        const cachedPage = await caches.match('/index.html');
        if (cachedPage) {
            return cachedPage;
        }
        
        // Return basic offline page
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Growth90 - Offline</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        text-align: center; 
                        padding: 2rem; 
                        background: #f7f3e9;
                        color: #1f2937;
                    }
                    .offline-container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 2rem;
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
                    .offline-title { color: #1e3a8a; margin-bottom: 1rem; }
                    .retry-btn {
                        background: #1e3a8a;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 6px;
                        cursor: pointer;
                        margin-top: 1rem;
                    }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <div class="offline-icon">📡</div>
                    <h1 class="offline-title">You're Offline</h1>
                    <p>It looks like you're not connected to the internet. Don't worry - your learning progress is saved locally and will sync when you're back online.</p>
                    <p>You can still access previously viewed content and continue learning!</p>
                    <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
                </div>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
    
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

// Offline API response
function getOfflineApiResponse(request) {
    const url = new URL(request.url);
    
    // Return appropriate offline responses based on API endpoint
    if (url.pathname.includes('/learning-paths/')) {
        return new Response(JSON.stringify({
            error: 'offline',
            message: 'This content is not available offline. Please connect to the internet to access new learning materials.',
            cached: false
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    if (url.pathname.includes('/assessments/')) {
        return new Response(JSON.stringify({
            error: 'offline',
            message: 'Assessments require an internet connection. Your progress will be saved and synced when you reconnect.',
            cached: false
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    return new Response(JSON.stringify({
        error: 'offline',
        message: 'This feature is not available offline.',
        cached: false
    }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
    });
}

// Background sync for form submissions and progress updates
self.addEventListener('sync', (event) => {
    
    if (event.tag === 'progress-sync') {
        event.waitUntil(syncProgress());
    }
    
    if (event.tag === 'assessment-sync') {
        event.waitUntil(syncAssessments());
    }
});

// Sync progress data when online
async function syncProgress() {
    try {
        
        // Get pending progress data from IndexedDB
        const pendingData = await getPendingSyncData('progress');
        
        for (const data of pendingData) {
            try {
                const response = await fetch('/api/v1/progress/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    await removeSyncData('progress', data.id);
                }
            } catch (error) {
                console.error('❌ Failed to sync progress item:', error);
            }
        }
        
    } catch (error) {
        console.error('❌ Progress sync failed:', error);
        throw error; // Re-throw to trigger retry
    }
}

// Sync assessment data when online
async function syncAssessments() {
    try {
        
        const pendingData = await getPendingSyncData('assessments');
        
        for (const data of pendingData) {
            try {
                const response = await fetch('/api/v1/assessments/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    await removeSyncData('assessments', data.id);
                }
            } catch (error) {
                console.error('❌ Failed to sync assessment item:', error);
            }
        }
        
    } catch (error) {
        console.error('❌ Assessment sync failed:', error);
        throw error;
    }
}

// Helper functions for sync data management
async function getPendingSyncData(type) {
    // This would typically interface with IndexedDB
    // For now, return empty array
    return [];
}

async function removeSyncData(type, id) {
    // This would remove synced data from IndexedDB
}

// Push notification handling
self.addEventListener('push', (event) => {
    
    const options = {
        body: 'You have new learning content available!',
        icon: './icons/icon-192x192.png',
        badge: './icons/badge-72x72.png',
        data: {
            url: '/'
        },
        actions: [
            {
                action: 'open',
                title: 'Open Growth90'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };
    
    if (event.data) {
        try {
            const payload = event.data.json();
            options.body = payload.message || options.body;
            options.data = payload.data || options.data;
        } catch (error) {
            console.error('❌ Failed to parse push payload:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification('Growth90', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Open new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Periodic background sync for maintenance
self.addEventListener('periodicsync', (event) => {
    
    if (event.tag === 'content-refresh') {
        event.waitUntil(refreshContent());
    }
    
    if (event.tag === 'cache-cleanup') {
        event.waitUntil(cleanupCaches());
    }
});

// Refresh cached content
async function refreshContent() {
    try {
        
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const requests = await cache.keys();
        
        // Refresh API content
        for (const request of requests) {
            if (request.url.includes('/api/v1/content/')) {
                try {
                    const response = await fetch(request);
                    if (response.ok) {
                        await cache.put(request, response);
                    }
                } catch (error) {
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Content refresh failed:', error);
    }
}

// Clean up old cache entries
async function cleanupCaches() {
    try {
        
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const requests = await cache.keys();
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
                const dateHeader = response.headers.get('date');
                if (dateHeader && new Date(dateHeader).getTime() < oneWeekAgo) {
                    await cache.delete(request);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Cache cleanup failed:', error);
    }
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Service Worker unhandled rejection:', event.reason);
    event.preventDefault();
});

