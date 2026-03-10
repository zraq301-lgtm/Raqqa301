import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react'; // المكتبة موجودة في الـ package.json الخاص بك

const MedicalTipCard = () => {
  const [tip, setTip] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // 1. وظيفة جلب البيانات من Neon
  const fetchTip = useCallback(async () => {
    try {
      // استبدل هذا الرابط بمسار الـ API الخاص بك الذي يتصل بـ Neon
      const response = await axios.get('https://your-api.com/api/tips/random');
      
      if (response.data) {
        setTip(response.data);
        setIsVisible(true);

        // إخفاء تلقائي بعد 10 ثوانٍ إذا لم يتفاعل المستخدم
        setTimeout(() => {
          setIsVisible(false);
        }, 10000);
      }
    } catch (error) {
      console.error("Error fetching tip from Neon:", error);
    }
  }, []);

  // 2. المحرك التلقائي (Timer)
  useEffect(() => {
    // إظهار نصيحة أولى بعد 5 ثوانٍ من دخول التطبيق
    const initialDelay = setTimeout(fetchTip, 5000);

    // تكرار العملية كل ساعة (3600000 ms)
    const interval = setInterval(fetchTip, 3600000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [fetchTip]);

  return (
    <AnimatePresence>
      {isVisible && tip && (
        <motion.div
          // حركات الظهور والاختفاء
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 200, transition: { duration: 0.2 } }}
          
          // خاصية السحب للإغلاق (Drag to dismiss)
          drag="x"
          dragConstraints={{ left: 0, right: 300 }}
          onDragEnd={(e, info) => {
            if (info.offset.x > 100) setIsVisible(false);
          }}
          
          // تنسيقات Tailwind CSS
          className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 bg-white border-r-4 border-emerald-500 shadow-2xl rounded-2xl p-5 z-[9999] cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 text-emerald-600 font-bold">
              <Lightbulb size={20} />
              <span className="text-sm uppercase tracking-wider">نصيحة طبية سريعة</span>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="text-right">
            <p className="text-gray-800 text-lg leading-relaxed font-medium">
              {tip.content}
            </p>
          </div>

          <div className="mt-4 flex justify-between items-center">
             <span className="text-[10px] text-gray-400 font-light">
               اسحب الكارت لليمين للإخفاء
             </span>
             <div className="h-1 w-12 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 10, ease: "linear" }}
                  className="h-full bg-emerald-400"
                />
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MedicalTipCard;
