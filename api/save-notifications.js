import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    // أضفنا استلام fcm_token من ريكت
    const { user_id, category, value, note, fcm_token } = req.body;

    try {
        // 1. تحديث الـ Token في جدول المستخدمين (لإزالة قيمة NULL)
        if (fcm_token) {
            await sql`
                UPDATE users 
                SET fcm_token = ${fcm_token} 
                WHERE id = ${user_id};
            `;
        }

        // 2. الحفظ في جدول health_tracking
        await sql`
            INSERT INTO health_tracking (user_id, category, numeric_value, text_note)
            VALUES (${user_id}, ${category}, ${value}, ${note});
        `;

        let aiAdvice = `تم تسجيل ${category} بنجاح في رقة ✨`;

        // 3. جلب نصيحة من GROQ (أو اترك المهمة لجيمناي عبر Make)
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "mixtral-8x7b-32768",
                    messages: [
                        { role: "system", content: "أنتِ طبيبة رقة. قدمي نصيحة طبية قصيرة جداً ورقيقة." },
                        { role: "user", content: `الفئة: ${category}، القيمة: ${value}` }
                    ]
                })
            });
            const data = await response.json();
            if (data?.choices?.[0]) {
                aiAdvice = data.choices[0].message.content;
            }
        } catch (aiError) {
            console.error("AI Error:", aiError);
        }

        // 4. حفظ الإشعار في قاعدة البيانات
        await sql`
            INSERT INTO notifications (user_id, title, body)
            VALUES (${user_id}, 'تنبيه من رقة ✨', ${aiAdvice});
        `;

        // 5. إرسال البيانات فوراً إلى Make.com عبر Webhook (ليقوم جيمناي بدوره)
        try {
            await fetch('رابط_الـ_Webhook_الخاص_بك_من_Make', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user_id,
                    fcm_token: fcm_token,
                    category: category,
                    value: value,
                    advice: aiAdvice
                }),
            });
        } catch (webhookError) {
            console.error("Make Webhook Error:", webhookError);
        }

        return res.status(200).json({ success: true, advice: aiAdvice });

    } catch (dbError) {
        console.error("Database Error:", dbError);
        return res.status(500).json({ error: "فشل في الاتصال بقاعدة البيانات" });
    }
}
