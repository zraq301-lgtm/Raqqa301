import admin from 'firebase-admin';
import { Pool } from 'pg';

/**
 * إعداد اتصال Neon DB باستخدام المتغير DATABASE_URL
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * إعدادات الحساب الخدمي لـ Firebase
 */
const serviceAccount = {
  "type": "service_account",
  "project_id": "raqqa-43dc8",
  "client_email": "firebase-adminsdk-fbsvc@raqqa-43dc8.iam.gserviceaccount.com",
  "private_key": process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,
};

/**
 * دالة تهيئة Firebase Admin
 */
function initializeFirebase() {
  if (!admin.apps.length) {
    try {
      if (!serviceAccount.private_key) {
        throw new Error("FIREBASE_PRIVATE_KEY مفقود من متغيرات البيئة.");
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("✅ تم تهيئة Firebase Admin بنجاح.");
    } catch (error) {
      console.error('❌ خطأ في تهيئة Firebase:', error.message);
    }
  }
}

export default async function (req, res) {
  initializeFirebase();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'استخدم POST فقط.' });
  }

  // استخراج المدخلات الشاملة للجداول الجديدة
  const { 
    fcmToken, 
    user_id, 
    category, 
    data_content, 
    ai_analysis, 
    title, 
    body, 
    scheduled_for 
  } = req.body;

  if (!fcmToken) {
    console.error("⚠️ fcmToken مفقود.");
    return res.status(400).json({ error: 'fcmToken is required' });
  }

  try {
    /**
     * 1. حفظ البيانات في نيون (Neon DB) في الجدول الجديد
     */
    const insertQuery = `
      INSERT INTO notifications (
        user_id, fcm_token, category, data_content, 
        ai_analysis, title, body, scheduled_for, is_sent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const isScheduled = scheduled_for ? true : false;
    const values = [
      user_id || 1,
      fcmToken,
      category || 'general',
      data_content ? JSON.stringify(data_content) : null,
      ai_analysis || null,
      title || "رقة",
      body || "تنبيه جديد",
      scheduled_for || null,
      !isScheduled // إذا كان مجدولاً للمستقبل يكون false، وإذا كان فورياً يكون true
    ];

    const dbResult = await pool.query(insertQuery, values);
    const dbId = dbResult.rows[0].id;
    console.log("🔹 تم حفظ البيانات في نيون بنجاح. معرف السجل:", dbId);

    /**
     * 2. الإرسال الفوري عبر Firebase (فقط إذا لم يكن الإشعار مجدولاً لوقت لاحق)
     */
    let firebaseResponse = null;
    if (!isScheduled) {
      const message = {
        notification: { 
          title: title || "رقة", 
          body: body || "تنبيه جديد" 
        },
        token: fcmToken
      };
      firebaseResponse = await admin.messaging().send(message);
      console.log("🚀 نجاح الإرسال الفوري لـ Firebase. ID:", firebaseResponse);
    } else {
      console.log("📅 تم جدولة الإشعار في نيون لموعد:", scheduled_for);
    }

    return res.status(200).json({ 
      success: true, 
      db_id: dbId, 
      messageId: firebaseResponse,
      mode: isScheduled ? 'scheduled' : 'instant'
    });

  } catch (error) {
    console.error('❌ خطأ في السيرفر:', error);
    return res.status(500).json({ 
      error: 'فشل في المعالجة', 
      debug: error.message 
    });
  }
}
