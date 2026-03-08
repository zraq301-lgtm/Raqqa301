import { createPool } from '@vercel/postgres';

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
    
    const { 
        user_id, fcm_token, username, current_weight, height_cm, 
        period_date, pregnancy_status, medications, category, note 
    } = req.body;

    const activeUserId = user_id || 'init_user';
    const aiAdvice = note || `تم تحديث ملفك الصحي في رقة ✨`;
    let finalToken = fcm_token && fcm_token.trim() !== "" ? fcm_token : null;

    try {
        // 1. محاولة استعادة التوكن من القاعدة إذا لم يرسل في الطلب الحالي
        if (!finalToken) {
            const userLookup = await pool.query(
                'SELECT fcm_token FROM notifications WHERE user_id = $1 LIMIT 1',
                [activeUserId]
            );
            if (userLookup.rows.length > 0) {
                finalToken = userLookup.rows[0].fcm_token;
            }
        }

        // 2. التنفيذ المتوازي: الحفظ في نيون والإرسال إلى Make.com
        const results = await Promise.allSettled([
            // العملية الأولى: الحفظ/التحديث في Neon
            pool.query(`
                INSERT INTO notifications (
                    user_id, fcm_token, username, "الوزن_الحالي", "الطول_سم", 
                    title, body, "تاريخ_آخر_حيض", "ظرف_الحمل", "الأدوية_الموصوفة", created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    fcm_token = COALESCE(EXCLUDED.fcm_token, notifications.fcm_token),
                    username = EXCLUDED.username,
                    "الوزن_الحالي" = EXCLUDED."الوزن_الحالي",
                    "الطول_سم" = EXCLUDED."الطول_سم",
                    body = EXCLUDED.body,
                    "تاريخ_آخر_حيض" = EXCLUDED."تاريخ_آخر_حيض",
                    "ظرف_الحمل" = EXCLUDED."ظرف_الحمل",
                    "الأدوية_الموصوفة" = EXCLUDED."الأدوية_الموصوفة",
                    created_at = NOW();
            `, [
                activeUserId, finalToken, username || 'زائرة رقة',
                current_weight || null, height_cm || null, 
                category || "تحديث صحي", aiAdvice, 
                period_date || null, pregnancy_status || null, medications || null
            ]),

            // العملية الثانية: الإرسال لـ Make.com (يتم فقط في حال توفر التوكن)
            finalToken ? fetch('https://hook.eu1.make.com/e9aratm1mdbwa38cfoerzdgfoqbco6ky', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: category || "تحديث صحي", 
                    message: aiAdvice,             
                    fcm_token: finalToken,
                    username: username || "مستخدمة رقة",
                    user_id: activeUserId,
                    weight: current_weight,
                    height: height_cm,
                    period_date: period_date,
                    pregnancy_status: pregnancy_status,
                    medications: medications
                })
            }) : Promise.resolve("No Token Available to send to Make")
        ]);

        const dbResult = results[0];
        const makeResponse = results[1];

        // التحقق إذا فشل الحفظ في قاعدة البيانات
        if (dbResult.status === 'rejected') {
            console.error("Neon DB Error:", dbResult.reason);
            throw new Error("فشل الحفظ في قاعدة البيانات");
        }

        return res.status(200).json({ 
            success: true, 
            db_saved: true,
            make_sent: makeResponse.status === 'fulfilled' && finalToken !== null,
            user: activeUserId,
            token_used: !!finalToken
        });

    } catch (error) {
        console.error("Main Process Error:", error.message);
        return res.status(500).json({ error: "حدث خطأ أثناء معالجة الطلب: " + error.message });
    }
}
