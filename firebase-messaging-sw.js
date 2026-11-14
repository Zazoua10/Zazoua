// Service worker لإشعارات الأوردرات الجديدة وانت بره الموقع (FCM)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDsQTX9rCxxT7Dl-OhDSkrce85lM_yDaf4",
  authDomain: "zazoua-b4d33.firebaseapp.com",
  projectId: "zazoua-b4d33",
  storageBucket: "zazoua-b4d33.firebasestorage.app",
  messagingSenderId: "990100552162",
  appId: "1:990100552162:web:5b886a47ef93ff3ad7a1bb"
});

const messaging = firebase.messaging();

// الرسالة بتيجي data-only، فبنعرض الإشعار هنا
messaging.onBackgroundMessage(payload => {
  const d = payload.data || {};
  self.registration.showNotification(d.title || 'طلب جديد 🛍️', {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.orderId || 'new-order',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    dir: 'rtl',
    lang: 'ar',
    data: { url: self.registration.scope.replace(/firebase-push\/?$/, '') + 'admin.html' }
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || 'admin.html';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list.find(c => c.url.includes('admin'));
    return w ? w.focus() : self.clients.openWindow(url);
  }));
});
