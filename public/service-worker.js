// This is a minimal service worker that allows the app to be installable as a PWA.

const CACHE_NAME = 'pil-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/manifest-full.json',
    '/manifest-qrapp.json',
    '/PIL.png',
    '/logo192.png',
    '/logo512.png'
];

// Install a service worker
/* eslint-disable-next-line no-restricted-globals */
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Cache and return requests
/* eslint-disable-next-line no-restricted-globals */
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Update a service worker
/* eslint-disable-next-line no-restricted-globals */
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
