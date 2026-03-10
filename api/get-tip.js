import pg from 'pg';

export default async function handler(req, res) {
  // إعداد الاتصال باستخدام المتغير المطلوب
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: process.env.POSTGRES_PRISMA_URL,
    ssl: {
      rejectUnauthorized: false // مطلوب للاتصال بـ Neon/Vercel Postgres
    }
  });

  try {
    // 1. الاستعلام لجلب نصيحة واحدة عشوائية بناءً على الجدول الذي أنشأناه
    const query = 'SELECT content FROM medical_tips ORDER BY RANDOM() LIMIT 1;';
    
    const result = await pool.query(query);

    // 2. التحقق من وجود بيانات
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'لا توجد نصائح في قاعدة البيانات حالياً' });
    }

    // 3. إرسال النصيحة كـ JSON
    const randomTip = result.rows[0];
    
    // إعدادات الـ CORS لضمان وصول تطبيق React للبيانات
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(randomTip);

  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء الاتصال بقاعدة البيانات' });
  } finally {
    // إغلاق الاتصال لتوفير موارد Neon
    await pool.end();
  }
}
