import admin from 'firebase-admin';

const serviceAccount = {
  "type": "service_account",
  "project_id": "raqqa-43dc8",
  "client_email": "firebase-adminsdk-fbsvc@raqqa-43dc8.iam.gserviceaccount.com",
  // التأكد من جلب المفتاح الخاص من إعدادات فيرسل بأمان
  "private_key": process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
};

// منع إعادة تهيئة التطبيق إذا كان يعمل بالفعل لتجنب خطأ 500
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase Admin Init Error:', error.message);
  }
}

// تصدير الدالة بنظام ES Modules المتوافق مع Vite
export default async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fcmToken, title, body } = req.body;

  // التحقق من وصول التوكن لمنع فشل الدالة
  if (!fcmToken) {
    return res.status(400).json({ error: 'Missing fcmToken' });
  }

  try {
    const response = await admin.messaging().send({
      notification: { 
        title: title || "رقة", 
        body: body || "تنبيه جديد" 
      },
      token: fcmToken
    });
    return res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    // إرسال تفاصيل الخطأ للمساعدة في تتبع المشكلة
    return res.status(500).json({ error: error.message });
  }
}
