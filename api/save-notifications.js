import admin from 'firebase-admin';
import pkg from 'pg';
const { Pool } = pkg;

// إعداد الاتصال بـ نيون باستخدام المتغير DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { 
    fcmToken, user_id = 1, category = 'general', data_content = {}, 
    title = "رقة", body = "تنبيه جديد", scheduled_for = null 
  } = req.body;

  try {
    const isScheduled = !!scheduled_for;

    // 1. الحفظ في نيون (Neon DB)
    const query = `
      INSERT INTO notifications (
        user_id, fcm_token, category, data_content, 
        title, body, scheduled_for, is_sent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const values = [
      user_id, fcmToken, category, JSON.stringify(data_content),
      title, body, scheduled_for, !isScheduled
    ];

    const result = await pool.query(query, values);
    const dbId = result.rows[0].id;

    // 2. الإرسال لـ Firebase إذا لم يكن مجدولاً
    if (!isScheduled && fcmToken) {
      await admin.messaging().send({
        notification: { title, body },
        token: fcmToken
      });
      return res.status(200).json({ success: true, mode: 'Instant', db_id: dbId });
    }

    return res.status(200).json({ success: true, mode: 'Scheduled', db_id: dbId });

  } catch (error) {
    console.error('❌ Error Details:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
