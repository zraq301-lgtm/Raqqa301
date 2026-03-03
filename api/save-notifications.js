import { createPool } from '@vercel/postgres';

const pool = createPool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { 
        user_id, fcm_token, username, current_weight, height_cm, 
        period_date, pregnancy_status, medications, category, note 
    } = req.body;

    // التأكد من وجود التوكن كحد أدنى لمعالجة الطلب
    if (!fcm_token || fcm_token === 'باطل' || fcm_token === '') {
        return res.status(400).json({ error: "fcm_token is required and valid" });
    }

    try {
        let aiAdvice = note || `تم تحديث بيانات جهازك في رقة ✨`;

        // 1. إرسال البيانات إلى Make (للتسجيل أو المعالجة)
        try {
            await fetch('https://hook.eu1.make.com/e9aratm1mdbwa38cfoerzdgfoqbco6ky', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id, 
                    fcm_token, 
                    category: category || "registration", 
                    current_weight, 
                    pregnancy_status 
                })
            });
        } catch (e) { 
            console.error("Make fetch error:", e); 
        }

        // 2. الحفظ الذكي في نيون (تحديث السجل إذا كان التوكن موجوداً مسبقاً)
        // نستخدم ON CONFLICT (fcm_token) لضمان عدم تكرار الأجهزة
        await pool.sql`
            INSERT INTO notifications (
                user_id, fcm_token, اسم_المستخدمة, الوزن_الحالي, 
                الطول_سم, تاريخ_آخر_حيض, ظرف_الحمل, الأدوية_الموصوفة, 
                title, body, created_at
            )
            VALUES (
                ${user_id || 'guest'}, 
                ${fcm_token}, 
                ${username || 'جهاز مسجل'}, 
                ${current_weight || null}, 
                ${height_cm || null}, 
                ${period_date || null}, 
                ${pregnancy_status || null}, 
                ${medications || null}, 
                ${'تحديث الجهاز: ' + (category || 'تلقائي')}, 
                ${aiAdvice}, 
                NOW()
            )
            ON CONFLICT (fcm_token) 
            DO UPDATE SET 
                user_id = EXCLUDED.user_id,
                اسم_المستخدمة = COALESCE(EXCLUDED.اسم_المستخدمة, notifications.اسم_المستخدمة),
                الوزن_الحالي = COALESCE(EXCLUDED.الوزن_الحالي, notifications.الوزن_الحالي),
                body = EXCLUDED.body,
                created_at = NOW();
        `;

        return res.status(200).json({ success: true, message: "تم تسجيل الجهاز وتحديث البيانات" });

    } catch (dbError) {
        console.error("Neon Database Error:", dbError);
        return res.status(500).json({ error: "فشل الحفظ في نيون", details: dbError.message });
    }
}
