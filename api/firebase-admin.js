import admin from 'firebase-admin';

// 1. إعداد بيانات الاعتماد الخاصة بـ Firebase
const serviceAccount = {
  "type": "service_account",
  "project_id": "raqqa-43dc8",
  "client_email": "firebase-adminsdk-fbsvc@raqqa-43dc8.iam.gserviceaccount.com",
  // معالجة مفتاح الخصوصية لضمان عمله في بيئة الإنتاج (Vercel)
  "private_key": process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,
};

// 2. تهيئة التطبيق (مرة واحدة فقط)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // 3. التحقق من هوية الطلب (Bearer Token)
  const expectedSecret = "zazo.tona.25sond.12"; 
  const authHeader = req.headers['authorization'];

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'غير مسموح بالدخول - Unauthorized' });
  }

  // 4. حصر الوظيفة في الإضافة فقط (POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'عذراً، هذه النهاية مخصصة للإضافة فقط' });
  }

  try {
    const { title, url, category } = req.body;

    // التحقق من البيانات المرسلة
    if (!title || !url) {
      return res.status(400).json({ error: 'العنوان والرابط حقول إجبارية' });
    }

    // 5. إضافة البيانات إلى Firestore (مجموعة videos)
    const docRef = await db.collection('videos').add({
      title: title,
      url: url,
      category: category || "عام",
      created_at: admin.firestore.FieldValue.serverTimestamp() // توقيت الخادم
    });

    // الاستجابة في حال النجاح
    return res.status(200).json({ 
      success: true, 
      id: docRef.id,
      message: "تم حفظ الفيديو بنجاح في قاعدة البيانات" 
    });

  } catch (error) {
    // معالجة الأخطاء
    console.error("Firebase Add Error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء الرفع: " + error.message });
  }
}
