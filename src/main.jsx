import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppSwitcher from './AppSwitcher'; 
import './App.css';

/**
 * تم تنظيف هذا الملف بالكامل من أي مكتبات إشعارات خارجية.
 * منطق الإشعارات (Firebase Push Notifications) موجود الآن داخل AppSwitcher 
 * لضمان عمله فقط في بيئة الموبايل وتجنب تعليق التطبيق.
 */

const Main = () => {
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
