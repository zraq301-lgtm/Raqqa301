import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppSwitcher from './AppSwitcher'; 
import './App.css';
import { initializeApp, getApps, getApp } from "firebase/app";
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

/**
 * إعدادات Firebase لمشروع raqqa-43dc8
 */
const firebaseConfig = {
  apiKey: "AIzaSyAKjsgnoHnGGr3urhm6Kpu7RvxN2dp6sJQ",
  authDomain: "raqqa-43dc8.firebaseapp.com",
  projectId: "raqqa-43dc8",
  storageBucket: "raqqa-43dc8.firebasestorage.app",
  messagingSenderId: "162488255991",
  appId: "1:162488255991:android:73d6299f11a1b7aec61af2"
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
} else {
  getApp();
}

const Main = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      
      // إعداد OneSignal بطريقة لا تكسر الـ Build
      const setupOneSignal = () => {
        const OneSignal = window.OneSignal || (window.plugins && window.plugins.OneSignal);
        if (OneSignal) {
          OneSignal.setAppId("726fe629-0b1e-4294-9a4b-39cf50212b42");
          OneSignal.promptForPushNotificationsWithUserResponse((accepted) => {
            console.log("OneSignal Accepted: " + accepted);
          });
          const userId = localStorage.getItem('user_id') || 'guest_user';
          OneSignal.setExternalUserId(userId);
        } else {
          console.warn("OneSignal plugin not found");
        }
      };
      
      setupOneSignal();

      const setupPush = async () => {
        try {
          // 1. إنشاء قناة الإشعارات (مهم جداً لأندرويد)
          await PushNotifications.createChannel({
            id: 'fcm_default_channel',
            name: 'Default',
            description: 'قناة الإشعارات العامة لتطبيق رقة',
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
          console.error("خطأ أثناء إعداد الإشعارات: ", error);
        }
      };

      setupPush();

      // 2. الاستماع للتوكن والتسجيل في السيرفر
      PushNotifications.addListener('registration', async (token) => {
        localStorage.setItem('fcm_token', token.value);
        try {
          await CapacitorHttp.post({
            url: 'https://raqqa-hjl8.vercel.app/api/save-notifications',
            headers: { 'Content-Type': 'application/json' },
            data: {
              fcm_token: token.value,
              user_id: localStorage.getItem('user_id') || 'new_device_init',
              username: 'جهاز مسجل حديثاً',
              category: 'تسجيل تلقائي للجهاز',
              note: 'تم تفعيل مستمعات الإشعارات بنجاح'
            }
          });
        } catch (err) {
          console.error("فشل إرسال التوكن المبدئي:", err);
        }
      });

      // 3. دالة سماع الإشعار عند وصوله والتطبيق مفتوح (Foreground)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('وصل إشعار جديد:', notification);
        alert(`${notification.title}\n\n${notification.body}`);
      });

      // 4. دالة سماع الإشعار عند الضغط عليه (Action Performed)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('تم الضغط على الإشعار:', notification.notification);
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
}
