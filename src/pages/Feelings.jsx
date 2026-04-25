import React, { useState } from 'react';
import axios from 'axios';

const PostDashboard = () => {
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState('none'); 
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

    try {
      // 1. تحضير البيانات ككائن عادي (JSON)
      const postData = {
        content: content,
        mediaType: mediaType,
        mediaUrl: mediaUrl,
      };

      // 2. إرسال الطلب بصيغة JSON
      const response = await axios.post(API_URL, postData, {
        headers: { 
          'Content-Type': 'application/json' 
        }
      });

      if (response.status === 200 || response.status === 201) {
        setMessage('✅ تم الرفع بنجاح!');
        setContent('');
        setMediaUrl('');
        setFile(null);
      }
    } catch (error) {
      console.error("Server Error:", error.response?.data);
      setMessage('❌ فشل في عملية الرفع: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>لوحة تحكم إضافة منشور</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <label>محتوى المنشور (نص):</label>
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="ماذا يدور في ذهنك؟"
          style={styles.textarea}
        />

        <label>إضافة وسائط:</label>
        <select 
          value={mediaType} 
          onChange={(e) => setMediaType(e.target.value)}
          style={styles.input}
        >
          <option value="none">بدون وسائط (نص فقط)</option>
          <option value="image_url">رابط صورة خارجي</option>
          <option value="video_url">رابط فيديو خارجي</option>
        </select>

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

// التصدير الافتراضي الضروري لـ Vercel
export default PostDashboard;
