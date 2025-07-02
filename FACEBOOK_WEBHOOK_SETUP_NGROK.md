# 🚀 إعداد Facebook Webhook مع ngrok

## ✅ الحالة الحالية
- **ngrok يعمل:** ✅
- **API Server يعمل:** ✅ (port 3002)
- **URL العام:** `https://bf5f-2c0f-fc88-48-b02-6c70-2c28-20fd-e03a.ngrok-free.app`

## 🔧 خطوات إعداد Facebook Webhook

### 1️⃣ اذهب إلى Facebook Developer Console
```
https://developers.facebook.com/
```

### 2️⃣ اختر تطبيقك > Messenger > Settings

### 3️⃣ في قسم Webhooks، اضغط "Edit Callback URL"

### 4️⃣ أدخل هذه المعلومات:
```
Callback URL: https://bf5f-2c0f-fc88-48-b02-6c70-2c28-20fd-e03a.ngrok-free.app/webhook
Verify Token: facebook_verify_token_123
```

### 5️⃣ اختر Webhook Fields:
- ✅ messages
- ✅ messaging_postbacks
- ✅ messaging_optins
- ✅ message_deliveries
- ✅ message_reads

### 6️⃣ اضغط "Verify and Save"

## 🧪 اختبار الإعداد

### اختبار سريع:
```bash
.\test-ngrok-webhook.bat
```

### اختبار يدوي:
1. افتح المتصفح واذهب إلى:
   ```
   https://bf5f-2c0f-fc88-48-b02-6c70-2c28-20fd-e03a.ngrok-free.app/health
   ```

2. يجب أن ترى:
   ```json
   {"status":"OK","service":"Facebook Reply Automator API"}
   ```

### اختبار Facebook Verification:
```
https://bf5f-2c0f-fc88-48-b02-6c70-2c28-20fd-e03a.ngrok-free.app/webhook?hub.mode=subscribe&hub.verify_token=facebook_verify_token_123&hub.challenge=test123
```

يجب أن يرجع: `test123`

## 📱 اختبار الرسائل

1. **اذهب إلى صفحة Facebook الخاصة بك**
2. **أرسل رسالة من حساب آخر**
3. **راقب اللوج في terminal API Server**
4. **تحقق من ملف `webhook-debug.log`**

## 📊 مراقبة النشاط

### في terminal ngrok:
- راقب عدد الـ connections
- ستزيد عند استقبال webhooks

### في terminal API Server:
- ستظهر رسائل مثل:
  ```
  🔥🔥🔥 FACEBOOK WEBHOOK RECEIVED! 🔥🔥🔥
  📨 Received Facebook webhook: {...}
  ```

### في ملف اللوج:
```bash
Get-Content webhook-debug.log -Wait -Tail 5
```

## ⚠️ ملاحظات مهمة

1. **لا تغلق terminal ngrok** - سيتوقف الويب هوك
2. **لا تغلق terminal API Server** - لن تتم معالجة الرسائل
3. **URL ngrok يتغير** عند إعادة التشغيل (في النسخة المجانية)
4. **احتفظ بـ ngrok يعمل** طوال فترة الاختبار

## 🎯 الخطوات التالية

1. ✅ **اختبر الويب هوك** مع Facebook
2. 📱 **أرسل رسائل تجريبية** للصفحة
3. 🤖 **تحقق من ردود Gemini AI**
4. 📊 **راقب الأداء** في اللوج

---
**🎉 الويب هوك جاهز للعمل مع ngrok!**
