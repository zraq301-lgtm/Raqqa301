import React, { useEffect, useState } from 'react';
import { CapacitorHttp } from '@capacitor/core';

const Health = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const options = {
      url: 'https://raqqa301-qtjkbz74v-raqqs-projects.vercel.app/api/firebase-admin', // رابط الـ API
      headers: { 
        'Authorization': 'Bearer zazo.tona.25sond.12',
        'Content-Type': 'application/json' 
      },
    };

    try {
      // استخدام الاتصال الخارجي عبر كاباسيتور
      const response = await CapacitorHttp.get(options);
      
      if (response.status === 200) {
        setData(response.data);
      }
    } catch (error) {
      console.error('حدث خطأ أثناء جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="loader">جاري التحميل...</div>;

  return (
    <div className="health-page">
      <h2>قائمة الفيديوهات الصحية</h2>
      <div className="video-list">
        {data.map((item) => (
          <div key={item.id} className="video-card">
            <h4>{item.title}</h4>
            <p>الفئة: {item.category}</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer">مشاهدة الفيديو</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Health;
