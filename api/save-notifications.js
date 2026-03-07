import { createPool } from '@vercel/postgres';

// الاتصال بقاعدة البيانات
const pool = createPool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL
});

export default async function handler(req, res) {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    // استخراج البيانات القادمة من التطبيق
    const { 
        user_id, fcm_token, username, current_weight, height_cm, 
        period_date, pregnancy_status, medications, category, note 
    } = req.body;

    const activeUserId = user_id || 'init_user';
    const aiAdvice = note || `تم تحديث ملفك الصحي في رقة ✨`;
    
    // متغير لحمل التوكن النهائي (سواء جاء من الطلب أو من قاعدة البيانات)
    let finalToken = fcm_token && fcm_token.trim() !== "" ? fcm_token : null;

    try {
        // --- التعديل الذكي الجديد ---
        // 1. إذا كان التوكن مفقوداً (طلب من صفحة داخلية)، نبحث عنه في نيون باستخدام user_id
        if (!finalToken) {
            const userLookup = await pool.query(
                'SELECT fcm_token FROM notifications WHERE user_id = $1 LIMIT 1',
                [activeUserId]
            );
            if (userLookup.rows.length > 0 && userLookup.rows[0].fcm_token) {
                finalToken = userLookup.rows[0].fcm_token;
                console.log("استعادة التوكن من نيون للمستخدم:", activeUserId);
            }
        }

        // 2. إرسال البيانات إلى Make.com
        // نرسل الطلب فقط إذا توفر التوكن (لمنع خطأ Bad Request)
        if (finalToken) {
            try {
                await fetch('https://hook.eu1.make.com/e9aratm1mdbwa38cfoerzdgfoqbco6ky', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        title: category || "تحديث صحي", 
                        message: aiAdvice,             
                        fcm_token: finalToken, // التوكن المستعاد أو الجديد
                        username: username || "مستخدمة رقة",
                        user_id: activeUserId,
                        note: aiAdvice,
                        weight: current_weight,
                        height: height_cm
                    })
                });
            } catch (e) { 
                console.error("Make Error:", e.message); 
            }
        }

        // 3. الحفظ في نيون (Neon) باستخدام الأعمدة العربية
        const query = `
            INSERT INTO notifications (
                user_id, fcm_token, username, الوزن_الحالي, الطول_سم, 
                title, body, تاريخ_آخر_حيض, ظرف_الحمل, الأدوية_الموصوفة, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                fcm_token = COALESCE(EXCLUDED.fcm_token, notifications.fcm_token),
                الوزن_الحالي = COALESCE(EXCLUDED.الوزن_الحالي, notifications.الوزن_الحالي),
                الطول_سم = COALESCE(EXCLUDED.الطول_سم, notifications.الطول_سم),
                body = EXCLUDED.body,
                created_at = NOW();
        `;

        const values = [
            activeUserId, 
            finalToken, // نستخدم التوكن النهائي لضمان عدم ضياعه
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
            status: "تمت معالجة البيانات بنجاح",
            token_found: !!finalToken,
            user: activeUserId
        });

    } catch (dbError) {
        console.error("Neon DB Error:", dbError.message);
        return res.status(500).json({ error: "فشل في قاعدة البيانات: " + dbError.message });
    }
}
