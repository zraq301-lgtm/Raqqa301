import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppSwitcher from './AppSwitcher'; 
import './App.css';
import { initializeApp, getApps, getApp } from "firebase/app";
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
// استيراد مكتبة OneSignal
import OneSignal from 'onesignal-cordova-plugin';

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
      
      // --- إعداد OneSignal بالمعرف الجديد ---
      const setupOneSignal = () => {
        // تم تحديث المعرف هنا كما طلبت بالضبط
        OneSignal.setAppId("cd7a8168-5e86-4fa8-a32d-58791213b25a");

        // طلب إذن الإشعارات
        OneSignal.promptForPushNotificationsWithUserResponse((accepted) => {
          console.log("OneSignal status: " + accepted);
        });

        // ربط هوية المستخدم (اختياري)
        const userId = localStorage.getItem('user_id') || 'guest_user';
        OneSignal.setExternalUserId(userId);
      };
      
      setupOneSignal();

      const setupPush = async () => {
        try {
          // 1. إنشاء قناة الإشعارات لأندرويد
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
          console.error("خطأ في إعداد الإشعارات: ", error);
        }
      };

      setupPush();

      // 2. الاستماع للتوكن وتسجيله
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
              note: 'تم تفعيل المستمعات بنجاح'
            }
          });
        } catch (err) {
          console.error("فشل إرسال التوكن:", err);
        }
      });

      // 3. الاستماع عند وصول إشعار (والتطبيق مفتوح)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('إشعار جديد:', notification);
        alert(`${notification.title}\n\n${notification.body}`);
      });

      // 4. الاستماع عند الضغط على الإشعار
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('تم فتح الإشعار:', notification.notification);
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
