// Service worker بسيط: بيخلّي الموقع قابل للتثبيت على الموبايل، من غير تخزين محتوى قديم.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});

// لما العميل يضغط على إشعار (تحديث حالة الطلب) يفتح الموقع
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list.find(c => 'focus' in c);
    return w ? w.focus() : self.clients.openWindow('./index.html');
  }));
});

// جاهز لو اتضاف سيرفر بيبعت push فعلي بعدين (Cloud Function): payload بصيغة { title, body, tag }
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || 'Zazoua', { body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', dir: 'rtl', lang: 'ar', tag: d.tag }));
});
