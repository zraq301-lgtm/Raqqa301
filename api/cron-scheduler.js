import admin from 'firebase-admin';
import { Pool } from 'pg';

/**
 * إعداد الاتصال بقاعدة بيانات نيون باستخدام المتغير المذكور
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * إعداد Firebase Admin باستخدام المفتاح الخاص المخزن في Vercel
 */
const serviceAccount = {
  "type": "service_account",
  "project_id": "raqqa-43dc8",
  "client_email": "firebase-adminsdk-fbsvc@raqqa-43dc8.iam.gserviceaccount.com",
  "private_key": process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('❌ خطأ في تهيئة Firebase:', error.message);
  }
}

export default async function handler(req, res) {
  // التحقق من أن الطلب آمن (اختياري لـ Vercel Cron)
  // if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).end('Unauthorized');
  // }

  try {
    /**
     * 1. جلب الإشعارات المستحقة من نيون:
     * - التي لم تُرسل بعد (is_sent = false)
     * - التي حان موعدها أو تجاوزه (scheduled_for <= NOW)
     * - التي تمتلك توكن صالح
     */
    const query = `
      SELECT id, fcm_token, title, body 
      FROM notifications 
      WHERE is_sent = false 
      AND scheduled_for <= NOW() 
      AND fcm_token IS NOT NULL
      LIMIT 50; -- معالجة 50 إشعار في المرة الواحدة لضمان الأداء
    `;

    const result = await pool.query(query);
    const pendingNotes = result.rows;

    if (pendingNotes.length === 0) {
      return res.status(200).json({ message: "لا توجد إشعارات مجدولة للإرسال حالياً." });
    }

    const sentIds = [];
    const failedIds = [];

    // 2. حلقة الإرسال عبر Firebase
    for (const note of pendingNotes) {
      try {
        await admin.messaging().send({
          token: note.fcm_token,
          notification: {
            title: note.title || "تنبيه رقة",
            body: note.body || "لديك موعد جديد الآن"
          }
        });
        sentIds.push(note.id);
      } catch (fcmError) {
        console.error(`❌ فشل إرسال الإشعار رقم ${note.id}:`, fcmError.message);
        failedIds.push({ id: note.id, error: fcmError.message });
      }
    }

    /**
     * 3. تحديث حالة الإرسال في نيون
     * نحول حالة الإرسال إلى true للناجحين لكي لا يتكرر إرسالهم
     */
    if (sentIds.length > 0) {
      await pool.query(
        "UPDATE notifications SET is_sent = true WHERE id = ANY($1)", 
        [sentIds]
      );
    }

    return res.status(200).json({
      success: true,
      processed: pendingNotes.length,
      sent_successfully: sentIds.length,
      failed: failedIds.length
    });

  } catch (dbError) {
    console.error('❌ خطأ في قاعدة البيانات أو النظام:', dbError.message);
    return res.status(500).json({ error: dbError.message });
  }
}
