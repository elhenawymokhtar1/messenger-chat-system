# 📚 توثيق مشروع Facebook Reply Automator

## 🎯 نظرة عامة
نظام رد تلقائي ذكي لصفحات Facebook باستخدام Gemini AI مع إدارة الطلبات وإرسال الصور.

## 🏗️ هيكل المشروع

### 📁 الملفات الرئيسية
```
src/
├── services/
│   ├── geminiAi.ts          # خدمة Gemini AI
│   ├── facebookApi.ts       # خدمة Facebook API
│   ├── orderService.ts      # خدمة إدارة الطلبات
│   └── productImageService.ts # خدمة إدارة الصور
├── api/
│   └── server.ts           # خادم API المحلي
api/
└── process-message.js      # Webhook للـ Vercel
```

## ⚙️ الخدمات الأساسية

### 1. 🤖 Gemini AI Service (`geminiAi.ts`)
**الوظائف الرئيسية:**
- `processIncomingMessage()` - معالجة الرسائل الواردة
- `generateResponse()` - توليد الردود الذكية
- `checkAndCreateOrder()` - فحص وإنشاء الطلبات
- `sendImageToCustomer()` - إرسال الصور للعملاء

**الإعدادات المطلوبة:**
```typescript
interface GeminiSettings {
  api_key: string;
  model: string;
  prompt_template: string;
  is_enabled: boolean;
  max_tokens: number;
  temperature: number;
}
```

### 2. 📘 Facebook API Service (`facebookApi.ts`)
**الوظائف الرئيسية:**
- `sendMessage()` - إرسال رسائل نصية
- `sendImage()` - إرسال الصور (URL + File Upload)
- `getPageMessages()` - جلب رسائل الصفحة
- `saveFacebookSettings()` - حفظ إعدادات Facebook

**طرق إرسال الصور:**
1. **URL Attachment** (الطريقة الأولى)
2. **File Upload** (Fallback إذا فشلت الأولى)

### 3. 📦 Order Service (`orderService.ts`)
**الوظائف الرئيسية:**
- `extractCustomerInfo()` - استخراج بيانات العميل
- `analyzeConversationForOrder()` - تحليل المحادثة
- `createOrder()` - إنشاء طلب جديد
- `isOrderDataComplete()` - فحص اكتمال البيانات

**البيانات المطلوبة للطلب:**
- الاسم
- رقم الهاتف
- العنوان
- المقاس
- اللون

### 4. 🤖 Simple Gemini Service (مبسط)
**الوظائف الرئيسية:**
- `processMessage()` - معالجة الرسائل بـ AI
- `getProductInfo()` - جلب معلومات المنتجات
- تم حذف أنظمة الصور والألوان المعقدة

## 🔧 إعداد النظام

### 1. متغيرات البيئة
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_api_key
```

### 2. قاعدة البيانات (Supabase)
**الجداول المطلوبة:**
- `conversations` - المحادثات
- `messages` - الرسائل
- `orders` - الطلبات
- `auto_replies` - الردود التلقائية
- `facebook_settings` - إعدادات Facebook
- تم حذف جداول الصور والألوان - النظام مبسط

### 3. Facebook Webhook
**URL:** `https://fbautoar.vercel.app/api/process-message`
**Verify Token:** `facebook_verify_token_123`
**Events:** messages, messaging_postbacks, messaging_optins

## 🚀 تشغيل النظام

### التطوير المحلي
```bash
# تشغيل الواجهة
npm run dev

# تشغيل API المحلي
npm run api

# تشغيل كل شيء
npm run start:all
```

### النشر
```bash
# رفع على GitHub
git add .
git commit -m "message"
git push origin main

# النشر على Vercel تلقائي
```

## 🔍 استكشاف الأخطاء

### مشاكل شائعة:

#### 1. الصور لا تُرسل
**الأسباب المحتملة:**
- رابط الصورة غير صحيح
- مشاكل في Facebook API
- مشاكل في الشبكة

**الحلول:**
- تحقق من الـ logs في console
- تأكد من صحة روابط الصور
- النظام يحاول File Upload تلقائياً

#### 2. الطلبات لا تُنشأ
**الأسباب المحتملة:**
- بيانات ناقصة
- مشاكل في استخراج البيانات
- مشاكل في قاعدة البيانات

**الحلول:**
- تحقق من logs استخراج البيانات
- تأكد من صحة أنماط النصوص
- تحقق من اتصال قاعدة البيانات

#### 3. Webhook لا يعمل
**الأسباب المحتملة:**
- مشاكل في Vercel deployment
- خطأ في Verify Token
- مشاكل في Facebook settings

**الحلول:**
- تحقق من Vercel logs
- تأكد من صحة Verify Token
- أعد إعداد Facebook Webhook

## 📊 مراقبة النظام

### Logs مهمة للمراقبة:
```javascript
// في geminiAi.ts
console.log('🔍 Extracted customer info:', customerInfo);
console.log('✅ Order created successfully:', newOrder.order_number);

// في facebookApi.ts
console.log('📤 Facebook API response:', response.status);
console.log('✅ Image sent successfully');

// في orderService.ts
console.log('🔍 Current message extracted info:', currentMessageInfo);
```

### مؤشرات الأداء:
- عدد الرسائل المعالجة
- عدد الطلبات المنشأة
- معدل نجاح إرسال الصور
- أوقات الاستجابة

## 🔐 الأمان

### نقاط مهمة:
- لا تشارك API Keys في الكود
- استخدم متغيرات البيئة
- تحقق من صحة البيانات الواردة
- راقب الـ logs للأنشطة المشبوهة

## 📞 الدعم والصيانة

### للصيانة الدورية:
1. تحديث dependencies
2. مراجعة الـ logs
3. تحديث prompts الـ AI
4. نسخ احتياطي لقاعدة البيانات
5. مراقبة استهلاك API

### للمشاكل الطارئة:
1. تحقق من Vercel status
2. تحقق من Supabase status
3. تحقق من Facebook API status
4. راجع الـ logs الأخيرة
5. أعد تشغيل الخدمات إذا لزم الأمر
