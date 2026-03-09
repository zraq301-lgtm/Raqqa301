import admin from 'firebase-admin';

/**
 * إعدادات الحساب الخدمي - تم تحسين معالجة المفتاح الخاص
 * للتعامل مع رموز الأسطر الجديدة (\n) التي تظهر في سجلات Vercel
 */
const serviceAccount = {
  "type": "service_account",
  "project_id": "raqqa-43dc8",
  "client_email": "firebase-adminsdk-fbsvc@raqqa-43dc8.iam.gserviceaccount.com",
  // المعالجة المزدوجة تضمن قبول المفتاح سواء كان بأسطر حقيقية أو رموز \n
  "private_key": process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,
};

/**
 * دالة تهيئة Firebase Admin
 * تمنع إعادة التهيئة التي تسبب خطأ 500 وتضمن استقرار السيرفر
 */
function initializeFirebase() {
  if (!admin.apps.length) {
    try {
      if (!serviceAccount.private_key) {
        throw new Error("FIREBASE_PRIVATE_KEY مفقود من متغيرات البيئة في Vercel.");
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("✅ تم تهيئة Firebase Admin بنجاح باستخدام المفتاح الجديد.");
    } catch (error) {
      console.error('❌ خطأ حرج في تهيئة Firebase:', {
        message: error.message,
        stack: error.stack,
        time: new Date().toISOString()
      });
    }
  }
}

export default async function (req, res) {
  // تشغيل التهيئة عند كل طلب جديد
  initializeFirebase();

  // 1. السماح بطلبات POST فقط
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'الطريقة غير مسموحة، استخدم POST فقط.' });
  }

  // 2. استخراج البيانات من جسم الطلب
  const { fcmToken, title, body } = req.body;

  // 3. التحقق من وجود التوكن (لمنع خطأ 400)
  if (!fcmToken) {
    console.error("⚠️ طلب مرفوض: fcmToken مفقود.");
    return res.status(400).json({ error: 'fcmToken is required' });
  }

  // 4. فحص أمان المفتاح الخاص قبل محاولة الإرسال لجوجل
  if (!serviceAccount.private_key) {
    return res.status(500).json({ error: 'خطأ في إعدادات السيرفر: المفتاح الخاص غير متوفر.' });
  }

  try {
    // تجهيز رسالة الإشعار
    const message = {
      notification: { 
        title: title || "رقة", 
        body: body || "تنبيه جديد" 
      },
      token: fcmToken
    };

    // محاولة الإرسال الفعلية عبر FCM
    const response = await admin.messaging().send(message);
    
    console.log("🚀 نجاح: تم إرسال الإشعار بنجاح. ID:", response);
    return res.status(200).json({ success: true, messageId: response });

  } catch (error) {
    /**
     * سجل أخطاء مفصل يظهر في Vercel Logs
     * يساعد في معرفة ما إذا كان الخطأ من التوكن أو من صلاحيات المفتاح
     */
    console.error('❌ فشل إرسال الإشعار. التفاصيل:', {
      error_code: error.code,       // مثل 'app/invalid-credential' أو 'messaging/invalid-registration-token'
      error_message: error.message,
      token_preview: fcmToken.substring(0, 15) + "...",
      timestamp: new Date().toISOString()
    });

    // إرسال رد تفصيلي للمساعدة في التصحيح
    return res.status(500).json({ 
      error: 'فشل الإرسال لجوجل', 
      code: error.code,
      debug: error.message 
    });
  }
}
