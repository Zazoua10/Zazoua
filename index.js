// Cloud Function: بتبعت إشعار لكل الأجهزة المسجّلة كل ما يتسجل أوردر جديد
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const DEAD_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token'
]);

exports.notifyNewOrder = onDocumentCreated('orders/{orderId}', async (event) => {
  const o = event.data && event.data.data();
  if (!o) return;

  const db = getFirestore();
  const snap = await db.collection('adminTokens').get();
  // id الوثيقة = التوكن نفسه (admin.html بيكتب كده)، فبنستخدمه مرجع للحذف
  const entries = snap.docs
    .map(d => ({ docId: d.id, token: d.get('token') || d.id }))
    .filter(e => e.token);
  if (!entries.length) return;

  const name = (o.customer && o.customer.name) || 'عميل';
  const total = Number(o.total);
  const totalText = Number.isFinite(total) ? total.toFixed(2) : String(o.total ?? '');

  // FCM بيقبل 500 توكن كحد أقصى في الطلب الواحد
  const CHUNK = 500;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const part = entries.slice(i, i + CHUNK);
    const res = await getMessaging().sendEachForMulticast({
      tokens: part.map(e => e.token),
      // data-only عشان الـ service worker يعرض الإشعار دايمًا
      data: {
        title: '🛍️ طلب جديد',
        body: `${name} — ${totalText} ج.م`,
        orderId: String(o.orderId || event.params.orderId)
      }
    });

    // امسح التوكنز اللي بقت غير صالحة
    const batch = db.batch();
    let deletes = 0;
    res.responses.forEach((r, idx) => {
      const code = r.error && r.error.code;
      if (!r.success && DEAD_CODES.has(code)) {
        batch.delete(db.collection('adminTokens').doc(part[idx].docId));
        deletes++;
      }
    });
    if (deletes) await batch.commit();
  }
});
