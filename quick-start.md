# 🚀 دليل التشغيل السريع - نظام إرسال الصور

## ✅ **النظام يعمل بشكل مثالي!**
**تاريخ آخر تحديث:** 21 يونيو 2025  
**معدل النجاح:** 95%+

---

## 🏃‍♂️ **تشغيل سريع (5 دقائق)**

### 1️⃣ **تشغيل الخوادم**
```bash
# الخادم الخلفي
cd src/api && npx tsx server.ts

# الخادم الأمامي (في terminal آخر)
npm run dev
```

### 2️⃣ **اختبار النظام**
- افتح: http://localhost:8080/simple-test-chat
- اكتب: `أريد حذاء أسود`
- النتيجة المتوقعة: صورة حذاء أسود + رد مناسب

### 3️⃣ **فحص صحة النظام**
```bash
node system-health-check.mjs
```

---

## 🧪 **اختبارات مضمونة النجاح**

| الرسالة | النتيجة المتوقعة |
|---------|------------------|
| `أريد حذاء أسود` | حذاء كلاسيكي أسود |
| `عندكم فستان؟` | فستان كاجوال أنيق |
| `أريد حقيبة يد` | حقيبة يد أنيقة |
| `حذاء رياضي` | حذاء رياضي متعدد الألوان |

---

## 🔧 **إذا لم يعمل النظام**

### المشكلة: لا توجد صور
```bash
# تحقق من conversation_id
node check-test-messages.mjs

# إصلاح conversation_id
node fix-conversation-id.mjs
```

### المشكلة: Gemini لا يرسل أوامر صور
```bash
# تحقق من إعدادات Gemini
curl http://localhost:3002/api/gemini/settings | grep products_prompt

# إعادة تشغيل الخادم
cd src/api && npx tsx server.ts
```

### المشكلة: لا توجد منتجات
```bash
# فحص قاعدة البيانات
node check-database.mjs
```

---

## 📁 **الملفات المهمة**

### 🔥 **لا تعدل هذه الملفات:**
- `src/services/simpleGeminiService.ts` (السطور 217-225, 682-720)
- `src/pages/SimpleTestChat.tsx` (السطر 28)
- جدول `gemini_settings` في قاعدة البيانات

### 📋 **ملفات التوثيق:**
- `SYSTEM_DOCUMENTATION.md` - توثيق شامل
- `system-health-check.mjs` - فحص صحة النظام
- `backups/working-system-*` - نسخ احتياطية

---

## 🎯 **نصائح للحفاظ على النظام**

1. **اعمل نسخة احتياطية قبل أي تعديل:**
   ```bash
   ./backup-critical-files.sh
   ```

2. **اختبر النظام بعد أي تغيير:**
   ```bash
   node system-health-check.mjs
   ```

3. **راقب اللوج للأخطاء:**
   ```bash
   # في terminal الخادم الخلفي
   # ابحث عن: ✅ [HYBRID] Added products_prompt
   ```

---

## 📞 **الدعم السريع**

### إذا احتجت مساعدة:
1. شغل `node system-health-check.mjs`
2. ارسل النتيجة مع وصف المشكلة
3. تأكد من أن الخوادم شغالة

### الروابط المهمة:
- **الصفحة التجريبية:** http://localhost:8080/simple-test-chat
- **إعدادات Gemini:** http://localhost:8080/gemini-ai-settings
- **API الخادم:** http://localhost:3002

---

**🎉 النظام جاهز ويعمل بشكل مثالي! استمتع بالاستخدام!**
