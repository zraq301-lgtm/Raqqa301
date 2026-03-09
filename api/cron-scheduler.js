import admin from 'firebase-admin';
import pkg from 'pg';
const { Pool } = pkg;

// إعداد الاتصال بـ نيون مع حل تحذير SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { 
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined 
  }
});

// تهيئة Firebase Admin
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
  try {
    /**
     * منطق البحث المطور:
     * 1. جلب الإشعارات التي حان وقتها الآن (is_sent = false AND scheduled_for <= NOW)
     * 2. جلب الإشعارات التي ستأتي بعد 24 إلى 72 ساعة (تذكير مسبق)
     */
    const query = `
      SELECT id, fcm_token, title, body, scheduled_for, category
      FROM notifications 
      WHERE is_sent = false 
      AND fcm_token IS NOT NULL
      AND (
        -- الحالة الأولى: مواعيد حان وقتها الآن
        scheduled_for <= NOW()
        OR 
        -- الحالة الثانية: مواعيد قادمة بين 24 و 72 ساعة (تنبيه مسبق)
        (scheduled_for BETWEEN (NOW() + INTERVAL '24 hours') AND (NOW() + INTERVAL '72 hours'))
      )
      LIMIT 100;
    `;

    const result = await pool.query(query);
    const pendingNotes = result.rows;

    if (pendingNotes.length === 0) {
      return res.status(200).json({ message: "لا توجد مواعيد حالية أو قريبة للإرسال." });
    }

    const sentIds = [];

    for (const note of pendingNotes) {
      try {
        // تخصيص نص الرسالة إذا كان التنبيه مسبقاً (اختياري)
        let messageTitle = note.title || "رقة";
        let messageBody = note.body;

        const isAhead = new Date(note.scheduled_for) > new Date();
        if (isAhead) {
          messageTitle = `تذكير: ${messageTitle}`;
          messageBody = `يقترب موعد: ${messageBody} (خلال الأيام القادمة)`;
        }

        await admin.messaging().send({
          token: note.fcm_token,
          notification: {
            title: messageTitle,
            body: messageBody
          }
        });
        
        // ملاحظة: إذا كان التنبيه مسبقاً، قد ترغب في عدم تحويل is_sent لـ true 
        // إلا عند الموعد الأصلي، لكن لمنع التكرار سنقوم بتحديثها هنا.
        sentIds.push(note.id);
      } catch (fcmError) {
        console.error(`❌ فشل الإرسال للرقم ${note.id}:`, fcmError.message);
      }
    }

    // تحديث الحالة لضمان عدم تكرار الإرسال في الدورة القادمة (بعد 10 دقائق)
    if (sentIds.length > 0) {
      await pool.query(
        "UPDATE notifications SET is_sent = true WHERE id = ANY($1)", 
        [sentIds]
      );
    }

    return res.status(200).json({
      success: true,
      sent_count: sentIds.length,
      details: "تم معالجة المواعيد الآنية والمستقبلية (24-72 ساعة)"
    });

  } catch (dbError) {
    console.error('❌ خطأ في المحرك:', dbError.message);
    return res.status(500).json({ error: dbError.message });
  }
}
