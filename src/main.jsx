import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppSwitcher from './AppSwitcher'; 
import './App.css';
import { initializeApp, getApps, getApp } from "firebase/app";
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor, CapacitorHttp } from '@capacitor/core'; // أضفنا CapacitorHttp هنا

/**
 * إعدادات Firebase المحدثة لمشروع raqqa-43dc8
 */
const firebaseConfig = {
  apiKey: "AIzaSyAKjsgnoHnGGr3urhm6Kpu7RvxN2dp6sJQ", //
  authDomain: "raqqa-43dc8.firebaseapp.com",
  projectId: "raqqa-43dc8", //
  storageBucket: "raqqa-43dc8.firebasestorage.app", //
  messagingSenderId: "162488255991", //
  appId: "1:162488255991:android:73d6299f11a1b7aec61af2" //
};

// تهيئة Firebase بطريقة آمنة
if (!getApps().length) {
  initializeApp(firebaseConfig);
} else {
  getApp();
}

const Main = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const setupPush = async () => {
        try {
          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
          }
        } catch (error) {
          console.error("خطأ أثناء إعداد الإشعارات: ", error);
        }
      };

      setupPush();

      // الاستماع للتوكن وحفظه فوراً في السيرفر (التسجيل المبدئي)
      PushNotifications.addListener('registration', async (token) => {
        // 1. التخزين المحلي للاستخدام في الصفحات الأخرى
        localStorage.setItem('fcm_token', token.value);
        console.log('FCM Token Registered:', token.value);

        // 2. إرسال فوري إلى Vercel لحفظه في Neon وإرساله لـ Make
        try {
          const options = {
            url: 'https://raqqa-hjl8.vercel.app/api/save-notifications',
            headers: { 'Content-Type': 'application/json' },
            data: {
              fcm_token: token.value,
              user_id: localStorage.getItem('user_id') || 'new_device_init',
              username: 'جهاز مسجل حديثاً',
              category: 'تسجيل تلقائي للجهاز',
              note: 'تم حفظ التوكن فور تشغيل التطبيق'
            }
          };

          const response = await CapacitorHttp.post(options);
          console.log("تم التسجيل المبدئي للجهاز بنجاح:", response.data);
        } catch (err) {
          console.error("فشل إرسال التوكن المبدئي:", err);
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Registration error: ', error);
      });
    }
  }, []);

  return (
    <React.StrictMode>
      <BrowserRouter>
        <AppSwitcher />
      </BrowserRouter>
    </React.StrictMode>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Main />);
} else {
  console.error("لم يتم العثور على عنصر 'root' في ملف HTML.");
}
