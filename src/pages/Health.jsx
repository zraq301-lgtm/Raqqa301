import React, { useState } from 'react';

function AddVideoForm() {
  const [formData, setFormData] = useState({ title: '', url: '', category: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('جاري الرفع...');

    try {
      const response = await fetch('/api/add-video', { // استبدله برابط الـ API الخاص بك
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer zazo.tona.25sond.12'
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setStatus('✅ تم رفع الفيديو بنجاح إلى فيربيس!');
        setFormData({ title: '', url: '', category: '' });
      } else {
        setStatus('❌ فشل الرفع: ' + data.error);
      }
    } catch (error) {
      setStatus('❌ حدث خطأ في الاتصال');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', textAlign: 'right' }}>
      <h3>إضافة فيديو جديد لعالم رقة</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          placeholder="عنوان الفيديو" 
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required 
        />
        <input 
          placeholder="رابط الفيديو (YouTube)" 
          value={formData.url}
          onChange={(e) => setFormData({...formData, url: e.target.value})}
          required 
        />
        <select 
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
        >
          <option value="">اختر الفئة</option>
          <option value="عقلي">عقلي</option>
          <option value="صحي">صحي</option>
          <option value="مشاعري">مشاعري</option>
        </select>
        <button type="submit" style={{ backgroundColor: '#ff4081', color: '#fff', border: 'none', padding: '10px' }}>
          رفع إلى فيربيس
        </button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}

export default AddVideoForm;
