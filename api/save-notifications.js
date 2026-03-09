import admin from 'firebase-admin';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

export default async function (req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { 
    fcmToken, user_id, category, data_content, 
    ai_analysis, title, body, scheduled_for 
  } = req.body;

  try {
    // تحديد الحالة: هل هو إرسال فوري أم جدولة مستقبيلة؟
    const isScheduledRequest = scheduled_for ? true : false;

    // 1. الحفظ في نيون (Neon DB) لجميع الحالات
    const insertQuery = `
      INSERT INTO notifications (
        user_id, fcm_token, category, data_content, 
        ai_analysis, title, body, scheduled_for, is_sent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const values = [
      user_id || 1,
      fcmToken,
      category || 'general',
      data_content ? JSON.stringify(data_content) : null,
      ai_analysis || null,
      title || "رقة",
      body || "تنبيه جديد",
      scheduled_for || null, // الموعد المستقبلي
      !isScheduledRequest    // إذا كان فورياً يكون true (تم)، إذا كان مجدولاً يكون false (ينتظر)
    ];

    const dbResult = await pool.query(insertQuery, values);

    // 2. إدارة الإرسال بناءً على الحالة
    if (!isScheduledRequest) {
      // الحالة الأولى: إرسال فوري لـ Firebase
      if (fcmToken) {
        await admin.messaging().send({
          notification: { title: title || "رقة", body: body || "تنبيه لحظي" },
          token: fcmToken
        });
        return res.status(200).json({ success: true, mode: 'Instant_Sent', db_id: dbResult.rows[0].id });
      }
    } else {
      // الحالة الثانية: جدولة فقط (سيتم الإرسال عبر الـ Cron Job لاحقاً)
      console.log(`📅 تم حفظ موعد مستقبلي في نيون للسجل رقم: ${dbResult.rows[0].id}`);
      return res.status(200).json({ success: true, mode: 'Scheduled_Only', db_id: dbResult.rows[0].id });
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
