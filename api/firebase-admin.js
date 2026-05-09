const admin = require('firebase-admin');

// إعداد الاتصال بـ Firebase باستخدام المفتاح الخاص
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "YOUR_PROJECT_ID", // استبدله بـ ID مشروعك
      clientEmail: "YOUR_CLIENT_EMAIL",
      // استبدال الرموز التعبيرية للسطر الجديد إذا كان المفتاح مخزن كـ string
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

/**
 * دالة لرفع بيانات الفيديو بناءً على التصميم في الصورة
 * @param {string} category - الفئة (مثل: عقلي)
 * @param {string} title - العنوان (مثل: الهدوء النفسي)
 * @param {string} videoUrl - رابط الفيديو (URL)
 */
async function uploadVideoLink(category, title, videoUrl) {
  try {
    // بناءً على الصورة، المجموعة هي "مقاطع فيديو"
    const collectionRef = db.collection('مقاطع فيديو');

    const newVideo = {
      فئة: category,
      عنوان: title,
      URL: videoUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp() // طابع زمني للتنظيم
    };

    const res = await collectionRef.add(newVideo);
    console.log(`تمت إضافة الفيديو بنجاح! المعرف: ${res.id}`);
    return res.id;
  } catch (error) {
    console.error("خطأ أثناء الرفع:", error);
    throw error;
  }
}

// مثال للاستخدام بناءً على بيانات الصورة:
// uploadVideoLink("عقلي", "الهدوء النفسي - حياة صحية", "https://youtu.be/...");
