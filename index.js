// Cloud Function: بتبعت إشعار لكل الأجهزة المسجّلة كل ما يتسجل أوردر جديد
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

exports.notifyNewOrder = onDocumentCreated('orders/{orderId}', async (event) => {
  const o = event.data && event.data.data();
  if (!o) return;
  const db = getFirestore();
  const snap = await db.collection('adminTokens').get();
  const tokens = snap.docs.map(d => d.get('token')).filter(Boolean);
  if (!tokens.length) return;

  const name = (o.customer && o.customer.name) || 'عميل';
  const res = await getMessaging().sendEachForMulticast({
    tokens,
    // data-only عشان الـ service worker يعرض الإشعار دايمًا
    data: {
      title: '🛍️ طلب جديد',
      body: `${name} — ${o.total} ج.م`,
      orderId: String(o.orderId || event.params.orderId)
    }
  });

  // امسح التوكنز اللي بقت غير صالحة
  const dead = [];
  res.responses.forEach((r, i) => {
    const code = r.error && r.error.code;
    if (!r.success && (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token')) dead.push(tokens[i]);
  });
  await Promise.all(dead.map(t => db.collection('adminTokens').doc(t).delete()));
});
