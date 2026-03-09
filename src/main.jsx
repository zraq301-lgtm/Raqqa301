import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppSwitcher from './AppSwitcher'; 
import './App.css';
import { initializeApp, getApps } from "firebase/app";
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

// إعدادات Firebase المربوطة بمشروع raqqa-43dc8
const firebaseConfig = {
  apiKey: "AIzaSyAKjsgnoHnGGr3urhm6Kpu7RvxN2dp6sJQ",
  authDomain: "raqqa-43dc8.firebaseapp.com",
  projectId: "raqqa-43dc8", // يطابق ملف الخدمة الجديد
  storageBucket: "raqqa-43dc8.firebasestorage.app",
  messagingSenderId: "162488255991", // معرف الإرسال الصحيح للمشروع
  appId: "1:162488255991:android:73d6299f11a1b7aec61af2"
};

// تهيئة Firebase في الواجهة الأمامية بأمان
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const Main = () => {
  
  // وظيفة الحفظ وإرسال التوكن للباك اند (Vercel)
  const saveTokenToServer = async (tokenValue) => {
    // التحقق من وجود التوكن لمنع أخطاء 400 في السيرفر
    if (!tokenValue) {
      console.log("⚠️ التوكن غير متوفر بعد، تم إلغاء الإرسال.");
      return;
    }

    try {
      // 1. حفظ التوكن في الذاكرة المحلية لاستخدام الصفحات الداخلية
      localStorage.setItem('fcm_token', tokenValue);
      
      // 2. إنشاء أو جلب معرف المستخدم
      const uId = localStorage.getItem('user_id') || 'user_' + Math.floor(Math.random() * 1000000);
      if (!localStorage.getItem('user_id')) localStorage.setItem('user_id', uId);

      // 3. إرسال البيانات إلى Vercel API المحدث بالمفتاح الجديد
      const response = await CapacitorHttp.post({
        url: 'https://raqqa-hjl8.vercel.app/api/save-notifications', 
        headers: { 'Content-Type': 'application/json' },
        data: {
          fcmToken: tokenValue, // الحقل الذي ينتظره الباك اند
          user_id: uId,
          username: localStorage.getItem('username') || 'زائرة رقة',
          category: 'تسجيل تلقائي عند الفتح',
          note: 'تم التحديث بالمفتاح الجديد a2263' // علامة اختيارية للتأكد من التحديث
        }
      });
      console.log("✅ استجابة السيرفر:", response.data);
    } catch (err) {
      console.error("❌ فشل إرسال البيانات للباك اند:", err);
    }
  };

  useEffect(() => {
    // تشغيل منطق الإشعارات فقط على منصات الهواتف
    if (Capacitor.isNativePlatform()) {
      
      const initPush = async () => {
        try {
          let permStatus = await PushNotifications.checkPermissions();
          
          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive === 'granted') {
            // طلب التوكن من خوادم Firebase
            await PushNotifications.register();
          }
        } catch (error) {
          console.error("Push Init Error:", error);
        }
      };

      initPush();

      // مستمع استلام التوكن الناجح
      PushNotifications.addListener('registration', (token) => {
        const fcmToken = token.value;
        console.log("🚀 FCM Token Generated:", fcmToken);
        saveTokenToServer(fcmToken);
      });

      // معالجة أخطاء التسجيل (مثل عدم توفر خدمات جوجل)
      PushNotifications.addListener('registrationError', (error) => {
        console.error("Registration Error: ", error.error);
      });

      // إظهار تنبيه عند استلام إشعار والتطبيق مفتوح
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        alert(`${notification.title}\n${notification.body}`);
      });
    }
  }, []);

  return (
    <BrowserRouter>
      <AppSwitcher />
    </BrowserRouter>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<Main />);
}
