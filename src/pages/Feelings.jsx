const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage('');

  try {
    // 1. تحضير البيانات ككائن عادي (JSON)
    const postData = {
      content: content,
      mediaType: mediaType,
      mediaUrl: mediaUrl,
    };

    // 2. إذا كان هناك ملف حقيقي (اختياري - يحتاج معالجة خاصة في Capacitor)
    // لكن للروابط، نرسل JSON مباشرة
    const response = await axios.post(API_URL, postData, {
      headers: { 
        'Content-Type': 'application/json' 
      }
    });

    if (response.status === 200 || response.status === 201) {
      setMessage('✅ تم الرفع بنجاح!');
      setContent('');
      setMediaUrl('');
    }
  } catch (error) {
    // طباعة الخطأ بالتفصيل في الكونسول لمعرفة السبب الحقيقي من السيرفر
    console.error("Server Error:", error.response?.data);
    setMessage('❌ فشل في عملية الرفع: ' + (error.response?.data?.error || error.message));
  } finally {
    setLoading(false);
  }
};
