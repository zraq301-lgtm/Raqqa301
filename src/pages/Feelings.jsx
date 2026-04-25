import React, { useState } from 'react';
import axios from 'axios';

const PostDashboard = () => {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedSection, setSelectedSection] = useState("bouh-display-1");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // حقول خاصة بالحذف
  const [deleteId, setDeleteId] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const API_URL = "https://raqqa-ruddy.vercel.app/api/save-post";
  const DELETE_URL = "https://raqqa-ruddy.vercel.app/api/delete-post"; // تأكد من صحة هذا الرابط في الـ API لديك

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl.trim()) {
      setMessage("⚠️ يرجى كتابة نص أو وضع رابط");
      return;
    }

    setLoading(true);
    setMessage('');

    const payload = {
      content: content,
      section: selectedSection,
      type: mediaUrl ? "رابط" : "نصي",
      external_link: mediaUrl 
    };

    try {
      const response = await axios.post(API_URL, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200 || response.status === 201) {
        setMessage('✅ تم النشر بنجاح! سيظهر الفيديو الآن في الواجهة.');
        setContent('');
        setMediaUrl('');
      }
    } catch (error) {
      setMessage('❌ فشل في عملية الرفع: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // دالة الحذف
  const handleDelete = async () => {
    if (!deleteId) {
      alert("يرجى إدخال رقم الـ ID للحذف");
      return;
    }

    if (!window.confirm("هل أنتِ متأكدة من حذف هذا المنشور نهائياً؟")) return;

    setDeleteLoading(true);
    try {
      const response = await axios.delete(`${DELETE_URL}?id=${deleteId}`);
      if (response.status === 200) {
        alert("✅ تم حذف المنشور بنجاح");
        setDeleteId('');
      }
    } catch (error) {
      alert("❌ فشل الحذف: " + (error.response?.data?.message || error.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>لوحة تحكم رقة</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <label>القسم:</label>
        <select 
          value={selectedSection} 
          onChange={(e) => setSelectedSection(e.target.value)}
          style={styles.input}
        >
          <option value="bouh-display-1">حكايات لا تنتهي</option>
          <option value="bouh-display-2">ملاذ القلوب</option>
          <option value="bouh-display-3">قوة لترعيك</option>
        </select>

        <label>محتوى المنشور (نص):</label>
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="اكتبي هنا..."
          style={styles.textarea}
        />

        <label>رابط الفيديو أو الصورة (YouTube/Neon):</label>
        <input 
          type="url" 
          placeholder="ضعي الرابط هنا..." 
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          style={styles.input}
        />

        <button type="submit" disabled={loading} style={{...styles.button, backgroundColor: loading ? '#ccc' : '#ff4d7d'}}>
          {loading ? 'جاري النشر...' : 'نشر الآن'}
        </button>
      </form>

      {message && <p style={{...styles.message, color: message.includes('✅') ? '#2ecc71' : '#e74c3c'}}>{message}</p>}

      <hr style={{ margin: '30px 0', border: '0.5px solid #eee' }} />

      {/* قسم الحذف الجديد */}
      <div style={styles.deleteSection}>
        <h3 style={{ color: '#e74c3c', fontSize: '1rem', marginBottom: '10px' }}>حذف منشور (Danger Zone)</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="number" 
            placeholder="رقم الـ ID..." 
            value={deleteId}
            onChange={(e) => setDeleteId(e.target.value)}
            style={{ ...styles.input, flex: 1 }}
          />
          <button 
            onClick={handleDelete} 
            disabled={deleteLoading}
            style={{ ...styles.button, backgroundColor: '#e74c3c', padding: '10px 20px', fontSize: '0.9rem' }}
          >
            {deleteLoading ? 'جاري...' : 'حذف'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '500px', margin: '40px auto', padding: '30px', borderRadius: '30px', direction: 'rtl', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 15px 35px rgba(255, 77, 125, 0.1)', background: '#fff', border: '1px solid #ff4d7d11' },
  title: { textAlign: 'center', color: '#ff4d7d', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  textarea: { minHeight: '120px', padding: '15px', borderRadius: '15px', border: '1px solid #f0f0f0', outline: 'none', background: '#fafafa', fontSize: '1rem' },
  input: { padding: '12px', borderRadius: '12px', border: '1px solid #f0f0f0', outline: 'none', background: '#fafafa' },
  button: { padding: '15px', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: '0.3s' },
  message: { marginTop: '20px', fontWeight: 'bold', textAlign: 'center' },
  deleteSection: { background: '#fff5f5', padding: '15px', borderRadius: '20px', border: '1px dashed #e74c3c' }
};

export default PostDashboard;
