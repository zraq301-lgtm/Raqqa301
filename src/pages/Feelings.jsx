import React, { useState } from 'react';
import axios from 'axios';

const PostDashboard = () => {
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState('none'); // 'image', 'video', 'image_url', 'video_url'
  const [file, setFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = "https://raqqa-ruddy.vercel.app/api/save-post";

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // استخدام FormData لدعم رفع الملفات الحقيقية والنصوص معاً
    const formData = new FormData();
    formData.append('content', content);
    formData.append('mediaType', mediaType);

    if (file) {
      formData.append('file', file);
    } else if (mediaUrl) {
      formData.append('mediaUrl', mediaUrl);
    }

    try {
      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200) {
        setMessage('✅ تم رفع المنشور بنجاح إلى قاعدة بيانات Neon!');
        // تفريغ الحقول بعد النجاح
        setContent('');
        setFile(null);
        setMediaUrl('');
      }
    } catch (error) {
      setMessage('❌ فشل في عملية الرفع: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>لوحة تحكم إضافة منشور</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* حقل النص */}
        <label>محتوى المنشور (نص):</label>
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="ماذا يدور في ذهنك؟"
          style={styles.textarea}
        />

        {/* اختيار نوع الوسائط */}
        <label>إضافة وسائط:</label>
        <select 
          value={mediaType} 
          onChange={(e) => setMediaType(e.target.value)}
          style={styles.input}
        >
          <option value="none">بدون وسائط (نص فقط)</option>
          <option value="image">رفع صورة من الجهاز</option>
          <option value="video">رفع فيديو من الجهاز</option>
          <option value="image_url">رابط صورة خارجي</option>
          <option value="video_url">رابط فيديو خارجي</option>
        </select>

        {/* إظهار الحقل المناسب بناءً على النوع المختار */}
        {(mediaType === 'image' || mediaType === 'video') && (
          <input type="file" onChange={handleFileChange} style={styles.input} accept={mediaType === 'image' ? "image/*" : "video/*"} />
        )}

        {(mediaType === 'image_url' || mediaType === 'video_url') && (
          <input 
            type="url" 
            placeholder="ضع الرابط هنا..." 
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            style={styles.input}
          />
        )}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'جاري الرفع...' : 'نشر الآن'}
        </button>
      </form>

      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};

// تنسيقات بسيطة
const styles = {
  container: { maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', direction: 'rtl', fontFamily: 'Arial' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  textarea: { minHeight: '100px', padding: '10px', borderRadius: '4px' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc' },
  button: { padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  message: { marginTop: '20px', fontWeight: 'bold', textAlign: 'center' }
};

export default PostDashboard;
