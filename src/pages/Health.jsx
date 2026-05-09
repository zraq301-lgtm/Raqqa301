import React, { useState } from 'react';
import { CapacitorHttp } from '@capacitor/core';

const AddVideoForm = () => {
  const [formData, setFormData] = useState({ title: '', url: '', category: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: 'info', message: 'جاري رفع البيانات إلى سحابة رقة...' });

    const options = {
      url: 'https://raqqa301-qtjkbz74v-raqqs-projects.vercel.app/api/firebase-admin',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer zazo.tona.25sond.12'
      },
      data: formData,
    };

    try {
      // استخدام الاتصال الخارجي عبر CapacitorHttp لرفع الرابط
      const response = await CapacitorHttp.post(options);

      if (response.status === 200 || response.data.success) {
        setStatus({ type: 'success', message: '✅ تم حفظ الفيديو في فيربيس بنجاح!' });
        setFormData({ title: '', url: '', category: '' });
      } else {
        setStatus({ type: 'error', message: '❌ فشل الرفع: ' + (response.data.error || 'خطأ غير معروف') });
      }
    } catch (error) {
      setStatus({ type: 'error', message: '❌ خطأ في الاتصال بالخادم الخارجي' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <style>{`
        .admin-container {
          direction: rtl;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .glass-card h3 {
          color: #ad1457;
          margin-bottom: 25px;
          text-align: center;
          font-weight: 700;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .custom-input {
          width: 100%;
          padding: 12px 15px;
          border-radius: 12px;
          border: 1px solid #ddd;
          background: rgba(255, 255, 255, 0.9);
          transition: 0.3s;
          box-sizing: border-box;
          font-size: 14px;
        }
        .custom-input:focus {
          border-color: #ff4081;
          outline: none;
          box-shadow: 0 0 8px rgba(255, 64, 129, 0.2);
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(90deg, #ff4081, #ad1457);
          color: white;
          font-weight: bold;
          cursor: pointer;
          transition: 0.3s;
          margin-top: 10px;
        }
        .submit-btn:disabled {
          background: #ccc;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(173, 20, 87, 0.3);
        }
        .status-msg {
          margin-top: 20px;
          padding: 10px;
          border-radius: 8px;
          text-align: center;
          font-size: 13px;
        }
        .status-success { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .status-error { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
        .status-info { background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }
      `}</style>

      <div className="glass-card">
        <h3>✨ إضافة محتوى مرئي</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input 
              className="custom-input"
              placeholder="عنوان المقطع (مثلاً: الهدوء النفسي)" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required 
            />
          </div>

          <div className="form-group">
            <input 
              className="custom-input"
              placeholder="رابط يوتيوب URL" 
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              required 
            />
          </div>

          <div className="form-group">
            <select 
              className="custom-input"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
            >
              <option value="">اختر التصنيف</option>
              <option value="عقلي">🧠 عقلي</option>
              <option value="صحي">🏥 صحي</option>
              <option value="مشاعري">💖 مشاعري</option>
              <option value="حميمية">🕯️ حميمية</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جاري الحفظ...' : 'نشر الفيديو الآن'}
          </button>
        </form>

        {status.message && (
          <div className={`status-msg status-${status.type}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddVideoForm;
