import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppSwitcher from './AppSwitcher'; 
import './App.css';
import { initializeApp, getApps, getApp } from "firebase/app";
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAKjsgnoHnGGr3urhm6Kpu7RvxN2dp6sJQ",
  authDomain: "raqqa-43dc8.firebaseapp.com",
  projectId: "raqqa-43dc8",
  storageBucket: "raqqa-43dc8.firebasestorage.app",
  messagingSenderId: "162488255991",
  appId: "1:162488255991:android:73d6299f11a1b7aec61af2"
};

// تهيئة Firebase بأمان
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const Main = () => {
  
  // وظيفة الحفظ في نيون وإرسال ويب هوك لـ ميك (تعريفها خارج useEffect لمنع أخطاء الترتيب)
  const saveTokenToServer = async (tokenValue) => {
    try {
      const uId = localStorage.getItem('user_id') || 'user_' + Math.floor(Math.random() * 1000000);
      if (!localStorage.getItem('user_id')) localStorage.setItem('user_id', uId);

      const response = await CapacitorHttp.post({
        url: 'https://raqqa-hjl8.vercel.app/api/save-notifications', // الرابط الجديد الذي زودتني به
        headers: { 'Content-Type': 'application/json' },
        data: {
          fcm_token: tokenValue,
          user_id: uId,
          username: localStorage.getItem('username') || 'مستخدمة رقة',
          category: 'تسجيل تلقائي',
          note: 'تم استلام التوكن فور منح الصلاحية أو الدخول'
        }
      });
      console.log("تم الحفظ في نيون و ميك بنجاح:", response.data);
    } catch (err) {
      console.error("فشل إرسال البيانات للباك اند:", err);
    }
  };

  useEffect(() => {
    // تشغيل المنطق فقط على الهاتف
    if (Capacitor.isNativePlatform()) {
      
      const initPush = async () => {
        try {
          let permStatus = await PushNotifications.checkPermissions();
          
          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive === 'granted') {
            // التسجيل لجلب التوكن من فيربيس
            await PushNotifications.register();
          }
        } catch (error) {
          console.error("Push Init Error:", error);
        }
      };

      // 1. بدء عملية جلب الصلاحيات والتسجيل
      initPush();

      // 2. مستمع استلام التوكن (بمجرد أن يوافق المستخدم أو يسجل الدخول)
      PushNotifications.addListener('registration', (token) => {
        const fcmToken = token.value;
        console.log("FCM Token Generated:", fcmToken);
        
        // حفظ في الذاكرة المحلية فوراً
        localStorage.setItem('fcm_token', fcmToken);
        
        // تنفيذ الحفظ التلقائي في الباك اند و ميك و نيون
        saveTokenToServer(fcmToken);
      });

      // 3. معالجة أخطاء التسجيل
      PushNotifications.addListener('registrationError', (error) => {
        console.error("Error on registration: ", error.error);
      });

      // 4. استلام الإشعارات والتطبيق مفتوح
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
