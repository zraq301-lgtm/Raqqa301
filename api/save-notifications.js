const admin = require('firebase-admin');

// القسم الذي ينفع نشره (قيم عامة من ملفك)
const serviceAccount = {
  "type": "service_account",
  "project_id": "raqqa-43dc8", // القيمة من ملفك
  "client_email": "firebase-adminsdk-fbsvc@raqqa-43dc8.iam.gserviceaccount.com", // من ملفك
  // القيم الحساسة التي لا تنشر (سنجلبها من إعدادات فيرسل)
  "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// تهيئة التطبيق مرة واحدة
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { fcmToken, title, body } = req.body;

  const message = {
    notification: {
      title: title || "رقة",
      body: body || "تنبيه جديد"
    },
    token: fcmToken
  };

  try {
    const response = await admin.messaging().send(message);
    return res.status(200).json({ success: true, response });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
