/* Wiz Calculator: lets the app work with no internet.
   The first visit (online) saves the app, the icons and the fonts on the device.
   After that it opens from the saved copy, and quietly updates itself whenever there is a connection. */
const CACHE = 'wiz-calculator-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-512.png', 'icon-192.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () { /* a missing icon should not stop the app saving */ }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameSite = url.origin === self.location.origin;
  var fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameSite && !fonts) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    // show the saved copy straight away, and refresh it in the background when online
    var key = req.mode === 'navigate' ? 'index.html' : req;
    return cache.match(key, { ignoreSearch: true }).then(function (hit) {
      var fresh = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req.mode === 'navigate' ? 'index.html' : req, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || fresh;
    });
  }));
});
