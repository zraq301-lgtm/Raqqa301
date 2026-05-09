import admin from 'firebase-admin';

// التأكد من أن المتغيرات البيئية موجودة لتجنب توقف الخادم (خطأ 500)
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = "firebase-adminsdk-fbsvc@raqqa-43dc8.iam.gserviceaccount.com";
const projectId = "raqqa-43dc8";

if (!privateKey) {
  throw new Error("خطأ: FIREBASE_PRIVATE_KEY غير معرف في إعدادات Vercel");
}

// تهيئة Firebase Admin بطريقة تمنع تكرار التهيئة وتدعم الإصدار 12
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        // معالجة المفتاح بشكل دقيق جداً
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase initialization error', error);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  const expectedSecret = "zazo.tona.25sond.12"; 
  const authHeader = req.headers['authorization'];

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { title, url, category } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    // إضافة الفيديو إلى مجموعة 'videos'
    const docRef = await db.collection('videos').add({
      title,
      url,
      category: category || "عام",
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ 
      success: true, 
      id: docRef.id 
    });

  } catch (error) {
    // إرسال تفاصيل الخطأ لكي تظهر لك في التطبيق بدلاً من خطأ 500 مبهم
    return res.status(500).json({ error: error.message });
  }
}
