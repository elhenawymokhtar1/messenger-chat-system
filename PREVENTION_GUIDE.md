# 🛡️ دليل الوقاية من المشاكل - نظام Facebook Messenger

## 📋 المشاكل المحتملة والحلول الوقائية

### 1. 🔑 مشكلة انتهاء صلاحية Facebook Access Tokens

#### ❌ **المشكلة:**
- Facebook Access Tokens لها مدة صلاحية محدودة (عادة 60 يوم)
- عند انتهاء الصلاحية، تتوقف الردود الآلية

#### ✅ **الحلول الوقائية:**

##### أ) مراقبة يومية:
```bash
# تشغيل فحص يومي للـ Tokens
node token-monitor.js
```

##### ب) إعداد تنبيهات:
- إضافة تنبيه في التقويم كل 45 يوم
- فحص أسبوعي لحالة جميع الـ Tokens

##### ج) تجديد استباقي:
- تجديد الـ Tokens قبل انتهاء صلاحيتها بأسبوع
- الاحتفاظ بنسخة احتياطية من الـ Tokens الصحيحة

#### 🔧 **خطوات التجديد:**
1. اذهب إلى: https://developers.facebook.com/tools/explorer/
2. اختر التطبيق والصفحة
3. أضف الصلاحيات: `pages_messaging`, `pages_read_engagement`
4. انسخ الـ Token الجديد
5. حدث الـ Token في النظام

---

### 2. 🔗 مشكلة ربط المحادثات بالشركات

#### ❌ **المشكلة:**
- المحادثات الجديدة قد لا ترتبط بالشركة الصحيحة
- المحادثات القديمة قد تفقد الربط

#### ✅ **الحلول الوقائية:**

##### أ) إصلاح تلقائي:
```bash
# تشغيل إصلاح تلقائي للمحادثات
node auto-fix-conversations.js
```

##### ب) فحص دوري:
```bash
# فحص شامل للنظام
node run-health-check.js
```

##### ج) تحسين الكود:
- إضافة `company_id` تلقائياً عند إنشاء محادثة جديدة
- التحقق من الربط عند كل رسالة جديدة

---

### 3. 📊 مراقبة صحة النظام

#### 🔍 **فحص يومي:**
```bash
# فحص شامل يومي
node run-health-check.js
```

#### 📈 **مؤشرات الصحة:**
- ✅ جميع Facebook Tokens صحيحة
- ✅ جميع المحادثات مرتبطة بشركات
- ✅ الردود الآلية تعمل
- ✅ قاعدة البيانات متسقة

---

### 4. 🚨 خطة الطوارئ

#### عند اكتشاف مشكلة:

##### أ) Facebook Token منتهي:
1. **فوري**: تجديد الـ Token من Facebook Developer Console
2. **تحديث**: استخدام الـ Token الجديد في النظام
3. **اختبار**: إرسال رسالة تجريبية للتأكد

##### ب) محادثات غير مرتبطة:
1. **تشغيل**: `node auto-fix-conversations.js`
2. **تحقق**: `node run-health-check.js`
3. **إصلاح يدوي**: للمحادثات التي لم يتم إصلاحها تلقائياً

##### ج) توقف النظام:
1. **فحص**: حالة الخادم والاتصال
2. **إعادة تشغيل**: الخدمات المتوقفة
3. **تحقق**: من الـ Webhook و API

---

### 5. 📅 جدولة المهام الوقائية

#### يومياً:
- [ ] فحص Facebook Tokens
- [ ] مراجعة المحادثات الجديدة
- [ ] تحقق من عمل الردود الآلية

#### أسبوعياً:
- [ ] فحص شامل للنظام
- [ ] إصلاح المحادثات غير المرتبطة
- [ ] مراجعة إحصائيات الاستخدام

#### شهرياً:
- [ ] تجديد Facebook Tokens (قبل انتهاء الصلاحية)
- [ ] نسخ احتياطية من قاعدة البيانات
- [ ] تحديث النظام والمكتبات

---

### 6. 🛠️ أدوات المراقبة

#### الملفات المطلوبة:
- `token-monitor.js` - مراقبة Facebook Tokens
- `auto-fix-conversations.js` - إصلاح المحادثات
- `run-health-check.js` - فحص شامل للنظام

#### أوامر سريعة:
```bash
# فحص سريع
node run-health-check.js

# إصلاح المحادثات
node auto-fix-conversations.js

# مراقبة Tokens
node token-monitor.js
```

---

### 7. 📞 جهات الاتصال للطوارئ

#### عند حدوث مشكلة تقنية:
- **المطور**: [معلومات الاتصال]
- **Facebook Support**: https://developers.facebook.com/support/
- **Supabase Support**: https://supabase.com/support

#### معلومات مهمة للاحتفاظ بها:
- معرفات الصفحات (Page IDs)
- معرفات التطبيقات (App IDs)
- بيانات اتصال قاعدة البيانات
- معلومات الخادم

---

## ✅ خلاصة الوقاية

### للشركات الجديدة:
1. **إنشاء Facebook Page Access Token** صحيح
2. **ربط الصفحة بالشركة** في النظام
3. **اختبار الردود الآلية** قبل التشغيل
4. **إضافة الشركة لجدولة المراقبة**

### للشركات الموجودة:
1. **مراقبة دورية** لحالة الـ Tokens
2. **فحص ربط المحادثات** بانتظام
3. **تجديد استباقي** للـ Tokens
4. **نسخ احتياطية** من البيانات المهمة

---

**💡 نصيحة مهمة:** 
تشغيل `node run-health-check.js` مرة واحدة يومياً يمنع 90% من المشاكل المحتملة!
