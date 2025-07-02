# 🚀 إعداد الـ Webhook مع Ngrok

## 📋 الخطوات:

### 1. 🔽 تحميل وتثبيت Ngrok
```bash
# الطريقة الأولى: npm
npm install -g ngrok

# الطريقة الثانية: تحميل مباشر
# اذهب إلى: https://ngrok.com/download
```

### 2. 🔑 إنشاء حساب مجاني (اختياري)
- اذهب إلى: https://dashboard.ngrok.com/signup
- احصل على الـ authtoken
- قم بتفعيله:
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### 3. 🏃‍♂️ تشغيل الخادم المحلي
```bash
# في terminal أول
npm run dev
```

### 4. 🌐 تشغيل Ngrok
```bash
# في terminal ثاني
ngrok http 8080
```

### 5. 📋 نسخ الـ URL
ستحصل على شيء مثل:
```
https://abc123.ngrok.io
```

### 6. ⚙️ إعداد Facebook Webhook
1. اذهب إلى Facebook Developer Console
2. اختر تطبيقك
3. اذهب إلى Webhooks
4. أضف الـ URL:
```
https://abc123.ngrok.io/webhook/facebook
```
5. أضف Verify Token: `facebook_webhook_verify_token`

### 7. ✅ اختبار الـ Webhook
- أرسل رسالة لصفحة Facebook
- تحقق من console logs في الخادم

## 🔧 إعدادات إضافية:

### إعداد subdomain ثابت (مدفوع):
```bash
ngrok http 8080 --subdomain=myapp
# سيعطيك: https://myapp.ngrok.io
```

### إعداد ملف config:
```yaml
# ~/.ngrok2/ngrok.yml
version: "2"
authtoken: YOUR_AUTHTOKEN
tunnels:
  webhook:
    addr: 8080
    proto: http
    subdomain: myapp
```

### تشغيل بالـ config:
```bash
ngrok start webhook
```

## 🚨 نصائح مهمة:

### 1. 🔒 الأمان:
- لا تشارك الـ ngrok URL مع أحد
- استخدم verify token قوي
- راقب الـ logs باستمرار

### 2. 📊 المراقبة:
- افتح: http://localhost:4040
- لمراقبة جميع الطلبات الواردة

### 3. 🔄 إعادة التشغيل:
- عند إعادة تشغيل ngrok، الـ URL سيتغير
- ستحتاج لتحديث Facebook Webhook URL

## 🎯 للإنتاج:

### استخدم خدمة مدفوعة مثل:
- Railway: $5/شهر
- Vercel: مجاني للمشاريع الصغيرة
- DigitalOcean: $5/شهر

## 🆘 حل المشاكل الشائعة:

### المشكلة: "command not found: ngrok"
```bash
# تأكد من التثبيت
npm list -g ngrok

# أو أعد التثبيت
npm uninstall -g ngrok
npm install -g ngrok
```

### المشكلة: "tunnel session failed"
```bash
# تحقق من الـ authtoken
ngrok config check

# أو أعد إضافة الـ token
ngrok config add-authtoken YOUR_TOKEN
```

### المشكلة: Facebook لا يستقبل الـ webhook
1. تأكد من أن الخادم يعمل على port 8080
2. تأكد من أن ngrok يشير للـ port الصحيح
3. تأكد من أن الـ webhook endpoint صحيح: `/webhook/facebook`
4. تأكد من الـ verify token

## 📞 الدعم:
إذا واجهت أي مشكلة، أخبرني وسأساعدك! 🚀
