import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppSwitcher from './AppSwitcher'; 
import './App.css';
import { initializeApp, getApps, getApp } from "firebase/app";
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

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

// تهيئة Firebase بطريقة آمنة تمنع التكرار والتعليق
if (!getApps().length) {
  initializeApp(firebaseConfig);
} else {
  getApp();
}

const Main = () => {
  useEffect(() => {
    // تشغيل منطق الإشعارات فقط في بيئة الأندرويد/iOS الحقيقية
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
          // لا نعطل التطبيق في حال فشل الإشعارات
        }
      };

      setupPush();

      // الاستماع للتوكن وحفظه في LocalStorage
      PushNotifications.addListener('registration', (token) => {
        localStorage.setItem('fcm_token', token.value);
        console.log('FCM Token Registered:', token.value);
      });

      // التعامل مع أخطاء التسجيل لمنع تعليق الصفحة
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

// استهداف عنصر الـ root
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Main />);
} else {
  console.error("لم يتم العثور على عنصر 'root' في ملف HTML.");
}
