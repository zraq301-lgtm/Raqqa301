import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCT2wRZgzPv1Xg3M41ZhN7-_RGze_HrZkk",
  authDomain: "raqqa-43dc8.firebaseapp.com",
  projectId: "raqqa-43dc8",
  storageBucket: "raqqa-43dc8.firebasestorage.app",
  messagingSenderId: "162488255991",
  appId: "1:162488255991:web:74fe1680fc6cb5bbc61af2"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// دالة لجلب التوكن وإرساله لـ Make
export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const currentToken = await getToken(messaging, { 
        vapidKey: "ضع_هنا_مفتاح_VAPID" // سأخبرك كيف تجلبه في الخطوة القادمة
      });
      if (currentToken) {
        console.log("Token generated:", currentToken);
        return currentToken;
      }
    }
  } catch (err) {
    console.log("An error occurred while retrieving token:", err);
  }
};

// الاستماع للإشعارات أثناء فتح التطبيق
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
