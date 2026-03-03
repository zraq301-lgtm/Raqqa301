import React, { useEffect } from 'react'; // أضفنا useEffect لطلب الإذن عند التشغيل
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppSwitcher from './AppSwitcher'; 
import './App.css';
import { initializeApp } from "firebase/app";
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * تم تحديث الإعدادات لترتبط بمشروع raqqa-43dc8
 */
const firebaseConfig = {
  apiKey: "AIzaSyAKjsgnoHnGGr3urhm6Kpu7RvxN2dp6sJQ", //
  authDomain: "raqqa-43dc8.firebaseapp.com",
  projectId: "raqqa-43dc8", //
  storageBucket: "raqqa-43dc8.firebasestorage.app", //
  messagingSenderId: "162488255991", //
  appId: "1:162488255991:android:73d6299f11a1b7aec61af2" //
};

// تهيئة Firebase
initializeApp(firebaseConfig);

const Main = () => {
  useEffect(() => {
    // تشغيل منطق الإشعارات فقط إذا كان التطبيق يعمل كـ Native (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      const setupPush = async () => {
        let permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        }
      };

      setupPush();

      // الاستماع للتوكن وحفظه في LocalStorage لارساله لـ Vercel لاحقاً
      PushNotifications.addListener('registration', (token) => {
        localStorage.setItem('fcm_token', token.value);
        console.log('FCM Token Registered:', token.value);
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

// التأكد من استهداف عنصر الـ root بشكل صحيح
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<Main />);
} else {
  console.error("لم يتم العثور على عنصر 'root' في ملف HTML.");
}
