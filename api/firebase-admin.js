import admin from 'firebase-admin';

// إعداد Firebase (نفس إعداداتك السابقة)
const serviceAccount = {
  "type": "service_account",
  "project_id": "raqqa-43dc8",
  "client_email": "firebase-adminsdk-fbsvc@raqqa-43dc8.iam.gserviceaccount.com",
  "private_key": process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,
};

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // التحقق من مفتاح الأمان
  const expectedSecret = "zazo.tona.25sond.12"; 
  const authHeader = req.headers['authorization'];

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }

  // السماح فقط بطريقة POST للإضافة
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, url, category } = req.body;

    // التحقق من وجود البيانات
    if (!title || !url) {
      return res.status(400).json({ error: 'العنوان والرابط مطلوبان' });
    }

    // إضافة البيانات إلى Firestore بنفس هيكل الصورة
    const docRef = await db.collection('videos').add({
      title: title,
      url: url,
      category: category || "عام",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ 
      success: true, 
      message: "تم إضافة الفيديو بنجاح", 
      id: docRef.id 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
