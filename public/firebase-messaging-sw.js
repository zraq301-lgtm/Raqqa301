// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// استبدل هذه الإعدادات ببيانات مشروعك من Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// هذه الدالة تتعامل مع الإشعار عندما يكون التطبيق مغلقاً
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] استلمت إشعار في الخلفية:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // تأكد من وجود أيقونة بهذا الاسم في مجلد public
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
