import React, { useState, useEffect } from 'react';
import App from './App';
import ProfileSetup from './pages/ProfileSetup';

// استخدام مكتبة firebase التي أضفتها في package.json
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// 1. إعدادات Firebase الخاصة بمشروعك
const firebaseConfig = {
  apiKey: "AIzaSyCT2wRZgzPv1Xg3M41ZhN7-_RGze_HrZkk",
  authDomain: "raqqa-43dc8.firebaseapp.com",
  projectId: "raqqa-43dc8",
  storageBucket: "raqqa-43dc8.firebasestorage.app",
  messagingSenderId: "162488255991",
  appId: "1:162488255991:web:74fe1680fc6cb5bbc61af2"
};

// تهيئة Firebase
const firebaseApp = initializeApp(firebaseConfig);
let messaging = null;

// التحقق من دعم المتصفح قبل تشغيل Messaging
try {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    messaging = getMessaging(firebaseApp);
  }
} catch (e) {
  console.error("Firebase Messaging غير مدعوم في هذا البيئة:", e);
}

function AppSwitcher() {
  const [isRegistered, setIsRegistered] = useState(() => {
    try {
      return localStorage.getItem('isProfileComplete') === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const setupWebPush = async () => {
      // التأكد من وجود دعم للإشعارات
      if (!("Notification" in window) || !messaging) {
        console.warn("هذا الجهاز أو المتصفح لا يدعم إشعارات الويب.");
        return;
      }

      try {
        // طلب الإذن - هذه هي اللحظة التي تظهر فيها الرسالة في الـ APK
        const permission = await Notification.requestPermission();
        console.log("حالة الإذن الحالي:", permission);
        
        if (permission === 'granted') {
          // جلب التوكن باستخدام مفتاح VAPID الذي زودتني به
          const currentToken = await getToken(messaging, { 
            vapidKey: "USA0sr7ibILdXx1IdNyUIZGNAZxosK9trp5z96f45Nk" 
          });

          if (currentToken) {
            console.log('FCM Token Ready:', currentToken);
            
            // إرسال التوكن إلى Neon لإصلاح مشكلة الـ NULL
            try {
              const response = await fetch('/api/update-fcm-token', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: localStorage.getItem('userId'),
                  fcmToken: currentToken
                }),
              });

              if (response.ok) {
                console.log('تم تحديث التوكن في نيون بنجاح');
              }
            } catch (fetchError) {
              console.error("خطأ في الاتصال بالباك إند:", fetchError);
            }
          }
        } else {
          console.warn("تم رفض إذن الإشعارات من قبل المستخدم.");
        }
      } catch (err) {
        console.error("حدث خطأ أثناء إعداد Firebase Messaging:", err);
      }
    };

    setupWebPush();

    // الاستماع للإشعارات والتطبيق مفتوح
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('إشعار جديد:', payload);
      });
    }

    // إدارة زر الرجوع في الأندرويد
    const setupBackButton = async () => {
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
          const { App: CapApp } = await import('@capacitor/app');
          CapApp.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
              CapApp.exitApp();
            } else {
              window.history.back();
            }
          });
        } catch (e) {
          console.error("خطأ في Capacitor BackButton:", e);
        }
      }
    };

    setupBackButton();
  }, []);

  const handleComplete = () => {
    localStorage.setItem('isProfileComplete', 'true');
    setIsRegistered(true);
  };

  return (
    <div className="switcher-wrapper" style={{ minHeight: '100vh' }}>
      {isRegistered ? <App /> : <ProfileSetup onComplete={handleComplete} />}
    </div>
  );
}

export default AppSwitcher;
