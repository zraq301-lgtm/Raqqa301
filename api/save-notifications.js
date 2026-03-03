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
        period_date, cycle_days, pregnancy_status, breastfeeding_months,
        doctor_type, medications, category, note 
    } = req.body;

    try {
        let aiAdvice = `تم تحديث بياناتك في رقة ✨`;

        // 1. إرسال البيانات إلى Make (Integromat)
        // لاحظ استخدام الرابط الظاهر في سجلاتك
        try {
            const response = await fetch('https://hook.eu1.make.com/e9aratm1mdbwa38cfoerzdgfoqbco6ky', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id, 
                    fcm_token: fcm_token && fcm_token !== 'باطل' ? fcm_token : "", // تجنب إرسال "باطل"
                    category, 
                    current_weight, 
                    pregnancy_status 
                })
            });

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                if (data?.advice) aiAdvice = data.advice;
            } else {
                const textData = await response.text();
                console.log("Make response was text:", textData);
            }
        } catch (e) { 
            console.error("Make fetch error (ignored to save in DB):", e); 
        }

        // 2. الحفظ في نيون (Neon Database)
        // تم توحيد البيانات لتتطابق مع مشروع raqqa-43dc8
        await pool.sql`
            INSERT INTO notifications (
                user_id, fcm_token, اسم_المستخدمة, الوزن_الحالي, 
                الطول_سم, تاريخ_آخر_حيض, ظرف_الحمل, الأدوية_الموصوفة, 
                title, body, created_at
            )
            VALUES (
                ${user_id}, 
                ${fcm_token && fcm_token !== 'باطل' && fcm_token !== '' ? fcm_token : null}, 
                ${username || 'زائرة رقة'}, 
                ${current_weight || null}, 
                ${height_cm || null}, 
                ${period_date || null}, 
                ${pregnancy_status || null}, 
                ${medications || null}, 
                ${'تحديث: ' + (category || 'بيانات عامة')}, 
                ${aiAdvice}, 
                NOW()
            );
        `;

        return res.status(200).json({ success: true, advice: aiAdvice });

    } catch (dbError) {
        console.error("Neon Database Error:", dbError);
        return res.status(500).json({ error: "فشل الحفظ في نيون", details: dbError.message });
    }
}
