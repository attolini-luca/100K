const SCHEDA = 'https://attolini-luca.github.io/100K/';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = {body: e.data ? e.data.text() : ''}; }
  e.waitUntil(self.registration.showNotification(d.title || '100K', {
    body: d.body || '', icon: 'icon-192.png', badge: 'badge-96.png', tag: d.tag || '100k',
    renotify: true, vibrate: [80, 40, 80], data: {url: d.url || SCHEDA}
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow((e.notification.data && e.notification.data.url) || SCHEDA));
});
