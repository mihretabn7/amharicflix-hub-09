
// Service Worker version
const CACHE_VERSION = 'v1';
const CACHE_NAME = `amharicflix-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...', event);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...', event);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extension/chrome requests
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('chrome-extension') ||
    event.request.url.includes('browser-sync')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if available
      if (response) {
        return response;
      }

      // Clone the request because it's a stream and can only be consumed once
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then((response) => {
          // Check for valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it's a stream too and can only be consumed once
          const responseToCache = response.clone();

          // Don't cache API calls or dynamic content
          if (!event.request.url.includes('/api/') && !event.request.url.includes('supabase')) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // If both cache and network fail, serve offline page
          if (event.request.url.includes('page')) {
            return caches.match('/').then(response => response || new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            }));
          }
          return new Response('Network error occurred', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Notification received', event);
  const data = event.data.json();
  
  const options = {
    body: data.content,
    icon: '/icon-192x192.png',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - open the app at the right URL
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const url = notification.data.url;
  
  notification.close();
  
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
