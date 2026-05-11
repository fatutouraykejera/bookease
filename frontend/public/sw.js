const CACHE_NAME = 'bookease-v1';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install — cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // For API requests — network first, queue if offline
  if (url.hostname.includes('onrender.com')) {
    event.respondWith(
      fetch(request).catch(() => {
        // If offline and it's a POST (booking), save to queue
        if (request.method === 'POST') {
          return saveToOfflineQueue(request).then(() =>
            new Response(JSON.stringify({
              offline: true,
              message: 'You are offline. Your booking will be submitted when you reconnect.'
            }), { headers: { 'Content-Type': 'application/json' } })
          );
        }
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // For app files — cache first, fall back to network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Save booking to IndexedDB when offline
async function saveToOfflineQueue(request) {
  const body = await request.json();
  const db = await openDB();
  const tx = db.transaction('queue', 'readwrite');
  tx.objectStore('queue').add({ url: request.url, body, timestamp: Date.now() });
  return tx.complete;
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('bookease-offline', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('queue', { autoIncrement: true });
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = reject;
  });
}

// Background sync — submit queued bookings when back online
self.addEventListener('sync', event => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncOfflineBookings());
  }
});

async function syncOfflineBookings() {
  const db = await openDB();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  const all = await new Promise(res => { const r = store.getAll(); r.onsuccess = () => res(r.result); });

  for (const item of all) {
    try {
      await fetch(item.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body)
      });
      store.delete(item.id);
    } catch (e) {
      console.log('Still offline, will retry');
    }
  }
}
