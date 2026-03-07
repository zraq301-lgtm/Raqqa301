import { createPool } from '@vercel/postgres';

// الاتصال بقاعدة البيانات باستخدام الرابط المباشر من إعدادات Vercel
const pool = createPool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL
});

export default async function handler(req, res) {
    // إعدادات CORS للسماح بالطلبات
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    // استخراج البيانات من الطلب
    const { 
        user_id, fcm_token, username, current_weight, height_cm, 
        period_date, pregnancy_status, medications, category, note 
    } = req.body;

    // 1. التحقق من وجود fcm_token لمنع أخطاء الإرسال في Make
    if (!fcm_token || fcm_token.trim() === "") {
        console.error("خطأ: تم استلام طلب بدون fcm_token");
        return res.status(400).json({ 
            success: false, 
            error: "fcm_token is required. الجهاز لم يرسل معرف الإشعارات." 
        });
    }

    const activeUserId = user_id || 'new_device_init';
    const aiAdvice = note || `تم تحديث ملفك الصحي في رقة ✨`;

    try {
        // 2. إرسال البيانات إلى Make.com
        try {
            await fetch('https://hook.eu1.make.com/e9aratm1mdbwa38cfoerzdgfoqbco6ky', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: category || "تحديث صحي", 
                    message: aiAdvice,             
                    fcm_token: fcm_token,
                    username: username,
                    user_id: activeUserId,
                    note: aiAdvice
                })
            });
        } catch (e) { 
            console.error("Make Communication Error:", e); 
        }

        // 3. الحفظ في نيون (Neon) باستخدام أسماء الأعمدة العربية المكتشفة في صورك
        const query = `
            INSERT INTO notifications (
                user_id, fcm_token, username, الوزن_الحالي, الطول_سم, 
                title, body, تاريخ_آخر_حيض, ظرف_الحمل, الأدوية_الموصوفة, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                fcm_token = EXCLUDED.fcm_token,
                الوزن_الحالي = EXCLUDED.الوزن_الحالي,
                الطول_سم = EXCLUDED.الطول_سم,
                body = EXCLUDED.body,
                created_at = NOW();
        `;

        const values = [
            activeUserId, 
            fcm_token, 
            username || 'زائرة رقة',
            current_weight || null, 
            height_cm || null, 
            category || "تحديث صحي",
            aiAdvice,
            period_date || null,
            pregnancy_status || null,
            medications || null
        ];

        await pool.query(query, values);

        return res.status(200).json({ 
            success: true, 
            status: "تم الحفظ في نيون والإرسال لـ Make بنجاح",
            received_token: fcm_token 
        });

    } catch (dbError) {
        console.error("DB Error:", dbError.message);
        return res.status(500).json({ error: "فشل الحفظ في نيون: " + dbError.message });
    }
}
