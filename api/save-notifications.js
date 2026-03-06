import { createPool } from '@vercel/postgres';

// الاتصال بقاعدة البيانات
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

    const activeUserId = user_id || 'init_user';

    try {
        let aiAdvice = note || `تم تحديث ملفك الصحي في رقة ✨`;

        // 1. إرسال البيانات إلى Make
        try {
            await fetch('https://hook.eu1.make.com/e9aratm1mdbwa38cfoerzdgfoqbco6ky', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: activeUserId, fcm_token, username, category, note: aiAdvice })
            });
        } catch (e) { console.error("Make Error:", e); }

        // 2. الحفظ في نيون (تأكد أنك نفذت أمر RENAME COLUMN في نيون)
        await pool.sql`
            INSERT INTO notifications (user_id, fcm_token, username, current_weight, height_cm, title, body, created_at)
            VALUES (${activeUserId}, ${fcm_token}, ${username}, ${current_weight}, ${height_cm}, ${category}, ${aiAdvice}, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                fcm_token = EXCLUDED.fcm_token,
                username = COALESCE(EXCLUDED.username, notifications.username),
                body = EXCLUDED.body,
                created_at = NOW();
        `;

        return res.status(200).json({ success: true });
    } catch (dbError) {
        return res.status(500).json({ error: dbError.message });
    }
}
