# 🌐 دليل إدارة ngrok للصور

## ⚠️ المشاكل المحتملة

### 1. تغيير ngrok URL
- **المشكلة**: عند إعادة تشغيل ngrok، يتغير الرابط
- **النتيجة**: الصور لن تعمل حتى تحديث الرابط

### 2. انقطاع ngrok
- **المشكلة**: إذا توقف ngrok، الصور لن تعمل
- **النتيجة**: العملاء لن يروا الصور

## ✅ الحلول

### الحل السريع (يومي)
```bash
# 1. تشغيل ngrok
ngrok http 3002

# 2. تحديث الرابط تلقائياً
node update-ngrok-url.js

# 3. إعادة تشغيل الخادم
# Ctrl+C ثم
node --import tsx/esm src/api/server-mysql.ts
```

### الحل المتوسط (أسبوعي)
```bash
# استخدام نطاق ثابت (يتطلب حساب ngrok مدفوع)
ngrok http 3002 --domain=your-app.ngrok.app
```

### الحل الدائم (شهري)
1. **استخدام VPS أو خدمة سحابية**
2. **رابط ثابت مثل**: `https://your-app.com`
3. **لا حاجة لـ ngrok**

## 🔧 خطوات التحديث اليدوي

### عند تغيير ngrok URL:

1. **انسخ الرابط الجديد من ngrok**
   ```
   https://abc-123-456.ngrok-free.app
   ```

2. **حدث ملف .env**
   ```env
   PUBLIC_URL=https://abc-123-456.ngrok-free.app
   ```

3. **أعد تشغيل الخادم**
   ```bash
   # أوقف الخادم: Ctrl+C
   # شغل الخادم:
   node --import tsx/esm src/api/server-mysql.ts
   ```

## 🚨 علامات المشكلة

### الصور لا تظهر للعملاء:
- ✅ تحقق من ngrok يعمل
- ✅ تحقق من PUBLIC_URL في .env
- ✅ تحقق من إعادة تشغيل الخادم

### رسالة خطأ في Facebook:
```
"فشل تحميل المرفق"
```
- 🔧 الحل: تحديث ngrok URL

## 📱 اختبار سريع

```bash
# اختبار الرابط
curl https://your-ngrok-url.ngrok-free.app/uploads/images/test.png

# يجب أن يعطي 200 OK أو 404 (ملف غير موجود)
# إذا أعطى خطأ اتصال، المشكلة في ngrok
```

## 🎯 التوصية

**للاستخدام اليومي**: استخدم الحل التلقائي
**للإنتاج**: انتقل لخادم دائم

---
*آخر تحديث: اليوم*
