// Service worker بسيط: بيخلّي الموقع قابل للتثبيت على الموبايل، من غير تخزين محتوى قديم.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
