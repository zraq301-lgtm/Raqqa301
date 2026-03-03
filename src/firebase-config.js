import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// إعدادات مشروعك المستخرجة
const firebaseConfig = {
  apiKey: "AIzaSyCT2wRZgzPv1Xg3M41ZhN7-_RGze_HrZkk",
  authDomain: "raqqa-43dc8.firebaseapp.com",
  projectId: "raqqa-43dc8",
  storageBucket: "raqqa-43dc8.firebasestorage.app",
  messagingSenderId: "162488255991",
  appId: "1:162488255991:web:74fe1680fc6cb5bbc61af2"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * دالة طلب الإذن وجلب التوكن
 * هذا التوكن هو "العنوان" الذي سيستخدمه Make لإرسال الإشعارات
 */
export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const currentToken = await getToken(messaging, { 
        // المفتاح الذي زودتني به
        vapidKey: "USA0sr7ibILdXx1IdNyUIZGNAZxosK9trp5z96f45Nk" 
      });
      
      if (currentToken) {
        console.log("تم توليد التوكن بنجاح:", currentToken);
        return currentToken;
      } else {
        console.log("لم يتم الحصول على توكن، تأكد من إعدادات الـ Browser.");
      }
    } else {
      console.log("المستخدم رفض إعطاء إذن للإشعارات.");
    }
  } catch (err) {
    console.error("خطأ أثناء جلب التوكن:", err);
  }
  return null;
};

// الاستماع للإشعارات في حال كان التطبيق مفتوحاً (Foreground)
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("وصل إشعار جديد:", payload);
      resolve(payload);
    });
  });
