import { put } from '@vercel/blob';
import admin from 'firebase-admin';

// دمج بيانات مفتاح الخدمة مباشرة داخل الكود لضمان العمل 100%
const serviceAccount = {
  "type": "service_account",
  "project_id": "raqqa-43dc8",
  "private_key_id": "02968f4d0446e8974b40068db5c6e5b517b05d61",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQChCweCK0S8M21O\n0WoK0yYJz9CuHncVnKCKt8QJTKyO7MG0rS5quO8I10Mp4fzLd6qI2sUquhIBhl7U\niLYcuoFlSv9EzGv5ha0F9u8XD5DaeDR94CH+Waklayq/f0ZLHcXJRnpOb7SJUjg4\nGOP4zyPz8DWnTVtB3EbMLoHQbCd98l1P+uTskXFh5cIw16GCFhTVKuDTEar676Ts\nWUMRPLh+i3yFfAz4GMGdaRxRgyrYGhLkCMfDti5oIW6w6y1XRky3VmIl+a6eF5dT\n/8t34w9G5e9j+9Hy8YZT1TAxSYNhPjApL+xvvyULjmgIDZelWjpdpRtz94ebiGO4\n6lgpIab5AgMBAAECggEAAsAo2cvyJbpFo87fHi321HxSksTFsS5ujgv/Os7u1Bae\nZN7/39YGjCq8FJEt84440RNWgokw0UqZoEzw+lrjpqaiJ0tMDVQfjU5nTUgoZ9jd\ngahkQD9JDLDwxxpOCa6poAtWf7Q3+8/2Epw3OZrVIP+hdPj05fI0mdxx/my4fHXS\nOzhkgDNBbGJTPAF7QU7Y/BNsgK2yKQHCcim5TBRLWZ4nN5wkBrvFrzt/AM2JR5TD\nor4x9QUt9u+/iWx7PtCsmx04JrJ2DDtmp4FXWpfjxuYVqaG+SvioAzo21mkFIm3S\na5LsXP4vEhnrWLpQ4zQK93hMrAuqfxcvsb2mrbn4gQKBgQDM7Lqe0Ln73C8J7u7Q\nkB0UV5EKs5rINQD9kjvr2854qUnLSR/MS5KS2YeepVAGFUjK+zrQk5iuVRKzuGm4\nUY/vCI+mGv3CjMEdxfOuxhU2EdmSvhDAGa8RxgQNdfplfXqQlrgef8AQvRcvKAii\nzTjyu8pgOc/uPYqw5m5KS7UmgQKBgQDJLmv9lwXxRhQdwLPIu0pEHgaQmoQon3jT\ny2VrJotWwGpo72+EmQQ28Koe1kzL09ElQoWX//iu5xHwMI+2TiSAqja1M3d6XDD3\nMHQH5dz45t1oSnXK/RdZZNtE824YYk1HCEFUzab1Xe8LN0m9aK8Iy1S9CPbZFkCH\nIPa2YxB0eQKBgEJ/s5Oj4iaT7gPIMGEn0vft7phNbjX31Ulz8dP48UiAjvzTzujJ\nwVe8FWFq/cvrjkKoQg67RrmTy8zcVBpHBXEpEwxxB9XhPS2/NfOKPgncwwD2gpME\nAqa+3kPL/CSBEovnDPqAtD/6TJK16A+Ejy1duS9+szX5bI85R6L+bFuBAoGBAJkx\n+Vfc1dCZbZ4ObJjxTac7OgKJNxP8A7U70Bnc+wPvd9g6Y7AUGSqA7vqWc1pPDJcT\n5ckOSV9eY8GEKRtIu/EiLJClBVkutLa2tdSBzFfY7UaKVNJjEZGoBHSn7fExgekS\nNzWNeJKlme7vhf5upcLLmtZr6hT7Jd4AUv4lx5T5AoGAYvBGdoSxfEEg6RCyhTzH\nQrprecjX+AxhHEwheOEDsKoNJfoE5Z7L8jX09BRhr25dhaWmi42DYPN9BqtQD7cj\n43x8o9Mg80BgCvrmCab2aZJ4QenMwyrY89p2zV6qyBr051HphUIjZgfKaViNO39K\nV/1HY8YfE3I3HqzF7jtRwsw=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@raqqa-43dc8.iam.gserviceaccount.com",
  "client_id": "110757452901578643348",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40raqqa-43dc8.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

const initFirebase = () => {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (error) {
      console.error("Firebase Init Error:", error.message);
      return false;
    }
  }
  return true;
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    if (!initFirebase()) {
      return res.status(500).json({ error: "فشل تهيئة Firebase الداخلي" });
    }

    const { title, message, fcm_token, file_data, file_name } = req.body;

    // معالجة Vercel Blob للصور
    let fileUrl = "";
    if (file_data) {
      try {
        const blob = await put(file_name || `img_${Date.now()}.png`, Buffer.from(file_data, 'base64'), { 
          access: 'public' 
        });
        fileUrl = blob.url;
      } catch (blobError) {
        console.error("Blob Error:", blobError.message);
      }
    }

    if (!fcm_token) {
      return res.status(400).json({ error: "fcm_token is missing" });
    }

    const payload = {
      notification: {
        title: title || "تنبيه من رقة",
        body: message || "لديك رسالة جديدة",
      },
      token: fcm_token
    };

    if (fileUrl) payload.notification.image = fileUrl;

    await admin.messaging().send(payload);

    return res.status(200).json({ 
      success: true, 
      info: "تم الإرسال باستخدام المفتاح المدمج",
      image_url: fileUrl 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
