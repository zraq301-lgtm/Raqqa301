import admin from 'firebase-admin';

// إعداد بيانات الاعتماد (نفس التي تعمل لديك في كود الإشعارات)
const serviceAccount = {
  "type": "service_account",
  "project_id": "raqqa-43dc8",
  "client_email": "firebase-adminsdk-fbsvc@raqqa-43dc8.iam.gserviceaccount.com",
  "private_key": process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,
};

// تهيئة التطبيق إذا لم يكن مهيأً
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // استقبال طلبات POST فقط
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // استخراج البيانات بناءً على هيكل الصورة المرفقة
  // الفئات والعناوين باللغة العربية كما في Firestore لديك
  const { 
    category = 'عام',      // يقابل حقل "فئة"
    title = 'بدون عنوان',  // يقابل حقل "عنوان"
    videoUrl,             // يقابل حقل "URL"
    isFromMake = false    // إذا كنت ترفعه عبر Make.com
  } = req.body;

  // التأكد من وجود رابط الفيديو لأنه أساسي
  if (!videoUrl) {
    return res.status(400).json({ error: "Missing videoUrl" });
  }

  try {
    // بناء الكائن المراد رفعه (مطابق تماماً للصورة Screenshot_٢٠٢٦٠٥٠٩-٠٣٣٣٤٧.png)
    const videoData = {
      "فئة": category,
      "عنوان": title,
      "URL": videoUrl,
      "uploadedAt": admin.firestore.FieldValue.serverTimestamp() // طابع زمني
    };

    // الرفع إلى مجموعة "مقاطع فيديو" كما يظهر في Firestore لديك
    const docRef = await db.collection('مقاطع فيديو').add(videoData);

    // رد النجاح
    return res.status(200).json({ 
      success: true, 
      message: 'تم رفع الفيديو بنجاح',
      docId: docRef.id,
      source: isFromMake ? 'Make' : 'App'
    });

  } catch (error) {
    console.error('❌ Firestore Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
