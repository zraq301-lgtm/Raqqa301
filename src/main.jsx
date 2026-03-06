import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppSwitcher from './AppSwitcher'; 
import './App.css';
import { initializeApp, getApps, getApp } from "firebase/app";
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

/**
 * إعدادات Firebase - محرك استقبال البيانات
 */
const firebaseConfig = {
  apiKey: "AIzaSyAKjsgnoHnGGr3urhm6Kpu7RvxN2dp6sJQ",
  authDomain: "raqqa-43dc8.firebaseapp.com",
  projectId: "raqqa-43dc8",
  storageBucket: "raqqa-43dc8.firebasestorage.app",
  messagingSenderId: "162488255991",
  appId: "1:162488255991:android:73d6299f11a1b7aec61af2"
};

// تهيئة Firebase لضمان عدم حدوث تصادم
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const Main = () => {
  useEffect(() => {
    // تشغيل المحرك فقط إذا كنا على منصة حقيقية (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      
      // إعداد OneSignal بطريقة ديناميكية لمنع الشاشة البيضاء
      const setupOneSignal = async () => {
        try {
          // استدعاء المكتبة برمجياً فقط في بيئة الهاتف
          const OneSignal = (await import('onesignal-cordova-plugin')).default;
          
          OneSignal.setAppId("cd7a8168-5e86-4fa8-a32d-58791213b25a");

          OneSignal.promptForPushNotificationsWithUserResponse((accepted) => {
            console.log("OneSignal status: " + accepted);
          });

          const userId = localStorage.getItem('user_id') || 'guest_user';
          OneSignal.setExternalUserId(userId);
        } catch (e) {
          console.error("OneSignal Error:", e);
        }
      };
      
      setupOneSignal();

      // إعداد Capacitor Push Notifications (للحصول على التوكن وإرساله لنيون)
      const setupPush = async () => {
        try {
          await PushNotifications.createChannel({
            id: 'fcm_default_channel',
            name: 'Default',
            importance: 5,
            visibility: 1,
            sound: 'default',
            vibration: true
          });

          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
          }
        } catch (error) {
          console.error("Push Setup Error: ", error);
        }
      };

      setupPush();

      // المستمع (Listener) لإرسال التوكن لـ Vercel/Neon
      PushNotifications.addListener('registration', async (token) => {
        console.log('Token registered:', token.value);
        localStorage.setItem('fcm_token', token.value);
        
        try {
          await CapacitorHttp.post({
            url: 'https://raqqa-hjl8.vercel.app/api/save-notifications',
            headers: { 'Content-Type': 'application/json' },
            data: {
              fcm_token: token.value,
              user_id: localStorage.getItem('user_id') || 'new_device_init',
              username: localStorage.getItem('username') || 'مستخدمة رقة',
              category: 'تسجيل تلقائي للجهاز',
              note: 'تم ربط المحرك بنجاح'
            }
          });
        } catch (err) {
          console.error("فشل إرسال التوكن للسيرفر:", err);
        }
      });

      // التعامل مع الإشعارات أثناء فتح التطبيق
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
