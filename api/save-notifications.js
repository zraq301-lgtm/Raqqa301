import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { user_id, category, value, note, fcm_token } = req.body;

    try {
        // 1. الحفظ في جدول health_tracking
        await sql`
            INSERT INTO health_tracking (user_id, category, numeric_value, text_note)
            VALUES (${user_id}, ${category}, ${value}, ${note});
        `;

        let aiAdvice = `تم تسجيل ${category} بنجاح في رقة ✨`;

        // 2. جلب نصيحة من Make (التي تحتوي على Gemini)
        try {
            const response = await fetch('https://hook.eu1.make.com/e9aratm1mdbwa38cfoerzdgfoqbco6ky', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: user_id,
                    fcm_token: fcm_token, // إرسال التوكن لضمان عدم وجود NULL
                    category: category,
                    value: value,
                    note: note
                })
            });
            
            // استلام الرد من موديول Webhook response
            const data = await response.json();
            if (data?.advice) {
                aiAdvice = data.advice;
            }
        } catch (aiError) {
            console.error("Make/Gemini Error:", aiError);
        }

        // 3. حفظ الإشعار في قاعدة البيانات
        await sql`
            INSERT INTO notifications (user_id, title, body)
            VALUES (${user_id}, 'تنبيه من رقة ✨', ${aiAdvice});
        `;

        return res.status(200).json({ success: true, advice: aiAdvice });

    } catch (dbError) {
        console.error("Database Error:", dbError);
        return res.status(500).json({ error: "فشل في الاتصال بقاعدة البيانات" });
    }
}
