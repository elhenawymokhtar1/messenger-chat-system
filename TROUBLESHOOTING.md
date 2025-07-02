# 🔧 دليل استكشاف الأخطاء وحلها

## 🚨 المشاكل الشائعة وحلولها

### 🖼️ مشاكل الصور

#### الصور لا تظهر للعملاء
**الأعراض:**
- الصورة ترفع بنجاح في النظام
- رسالة "فشل تحميل المرفق" في Facebook

**الأسباب:**
- ngrok URL قديم أو متوقف
- الخادم لا يستطيع الوصول للصور

**الحلول:**
```bash
# 1. تحقق من ngrok
curl https://your-ngrok-url.ngrok-free.app

# 2. إذا لم يعمل، حدث الرابط
node update-ngrok-url.js

# 3. أعد تشغيل الخادم
# Ctrl+C ثم
node --import tsx/esm src/api/server-mysql.ts

# 4. اختبر رابط صورة
curl https://your-ngrok-url.ngrok-free.app/uploads/images/filename.png
```

#### الصور لا تظهر في الواجهة
**الأعراض:**
- الرسائل تظهر كـ "رسالة بدون نص"
- لا توجد صور في المحادثة

**الحلول:**
```bash
# فحص قاعدة البيانات
node check-messages.js

# تحقق من image_url في قاعدة البيانات
# يجب أن يكون مملوء وليس NULL
```

### 💬 مشاكل الرسائل

#### الرسائل لا ترسل
**الأعراض:**
- خطأ 500 عند إرسال رسالة
- رسالة "فشل في إرسال الرسالة"

**الحلول:**
```bash
# 1. تحقق من Facebook Access Token
# في إعدادات الشركة

# 2. تحقق من إعدادات Webhook
# في Facebook Developer Console

# 3. راجع سجلات الخادم
# ابحث عن أخطاء في Console
```

#### الرسائل لا تستقبل
**الأعراض:**
- لا تصل رسائل جديدة من العملاء
- Webhook لا يعمل

**الحلول:**
```bash
# 1. تحقق من Webhook URL
# يجب أن يكون: https://your-ngrok-url.ngrok-free.app/webhook

# 2. تحقق من Verify Token
# في Facebook Developer Console

# 3. اختبر Webhook
curl -X POST https://your-ngrok-url.ngrok-free.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "message"}'
```

### 🗄️ مشاكل قاعدة البيانات

#### خطأ اتصال قاعدة البيانات
**الأعراض:**
- "Connection refused"
- "Access denied"

**الحلول:**
```bash
# 1. تحقق من إعدادات .env
MYSQL_HOST=193.203.168.103
MYSQL_USER=u384034873_conversations
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=u384034873_conversations

# 2. اختبر الاتصال
node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: 'your_password',
  database: 'u384034873_conversations'
}).then(() => console.log('✅ اتصال ناجح')).catch(console.error);
"
```

#### الجداول غير موجودة
**الأعراض:**
- "Table doesn't exist"
- خطأ SQL

**الحلول:**
```sql
-- تحقق من الجداول الموجودة
SHOW TABLES;

-- إذا كانت مفقودة، شغل ملف إنشاء الجداول
mysql -u username -p < database/mysql-schema.sql
```

### 🌐 مشاكل ngrok

#### ngrok لا يعمل
**الأعراض:**
- "connection refused" عند الوصول لـ ngrok URL
- الصور لا تعمل

**الحلول:**
```bash
# 1. تأكد من تشغيل ngrok
ngrok http 3002

# 2. تحقق من البورت الصحيح
# يجب أن يكون 3002

# 3. تحقق من الرابط
# انسخ الرابط من ngrok terminal
```

#### ngrok URL تغير
**الأعراض:**
- الصور كانت تعمل والآن لا تعمل
- رابط قديم في .env

**الحلول:**
```bash
# الطريقة التلقائية
node update-ngrok-url.js

# الطريقة اليدوية
# 1. انسخ الرابط الجديد من ngrok
# 2. حدث PUBLIC_URL في .env
# 3. أعد تشغيل الخادم
```

### 🤖 مشاكل الذكاء الاصطناعي

#### Gemini AI لا يرد
**الأعراض:**
- لا توجد ردود تلقائية
- خطأ في API Key

**الحلول:**
```bash
# 1. تحقق من API Key في إعدادات الشركة
# 2. تحقق من تفعيل الردود التلقائية
# 3. تحقق من quota في Google AI Studio
```

### 🔧 أدوات التشخيص

#### فحص شامل للنظام
```bash
# 1. فحص قاعدة البيانات
node check-messages.js

# 2. فحص ngrok
curl https://your-ngrok-url.ngrok-free.app

# 3. فحص الخادم
curl http://localhost:3002/api/health

# 4. فحص الواجهة
curl http://localhost:8081
```

#### فحص ملفات النظام
```bash
# تحقق من وجود الملفات المهمة
ls -la src/api/server-mysql.ts
ls -la .env
ls -la uploads/images/

# تحقق من صلاحيات الملفات
chmod 755 uploads/
chmod 644 uploads/images/*
```

### 📊 مراقبة الأداء

#### سجلات مفيدة
```bash
# سجلات الخادم
# راقب Console للأخطاء

# سجلات ngrok
# راقب ngrok terminal للطلبات

# سجلات قاعدة البيانات
# راقب أخطاء MySQL
```

### 🚨 حالات الطوارئ

#### النظام لا يعمل نهائياً
```bash
# 1. أعد تشغيل كل شيء
pkill -f ngrok
pkill -f node

# 2. شغل من جديد
ngrok http 3002 &
node update-ngrok-url.js
node --import tsx/esm src/api/server-mysql.ts &
npm run dev &
```

#### فقدان البيانات
```bash
# 1. تحقق من قاعدة البيانات
mysql -u username -p -e "SELECT COUNT(*) FROM messages"

# 2. استعادة من نسخة احتياطية (إذا متوفرة)
mysql -u username -p < backup.sql
```

### 📞 طلب المساعدة

#### معلومات مطلوبة عند طلب المساعدة:
1. **وصف المشكلة** بالتفصيل
2. **رسائل الخطأ** الكاملة
3. **خطوات إعادة إنتاج المشكلة**
4. **سجلات Console** ذات الصلة
5. **إعدادات النظام** (بدون كلمات مرور)

#### ملفات مفيدة للمراجعة:
- `src/api/server-mysql.ts` - الخادم الرئيسي
- `.env` - إعدادات النظام
- `package.json` - التبعيات
- سجلات Console

---
*آخر تحديث: ديسمبر 2024*
*دليل شامل لحل جميع المشاكل المحتملة* 🔧
