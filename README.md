# 💬 نظام إدارة المحادثات - Facebook Messenger

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

نظام شامل لإدارة محادثات Facebook Messenger مع إمكانيات متقدمة لإرسال واستقبال الرسائل والصور والردود التلقائية بالذكاء الاصطناعي.

## 🆕 التحديثات الأخيرة (يوليو 2025)

### ✅ **تنظيف شامل للكودبيس:**
- 🗑️ **حذف الأنظمة غير المستخدمة**: إزالة ProductsVariants و IntegratedProducts
- 🤖 **تحسين نظام Gemini AI**: إصلاح مراجع قاعدة البيانات المعطلة
- 🧹 **تنظيف الكود**: حذف 2,883+ سطر كود غير مفيد
- ⚡ **تحسين الأداء**: كودبيس أنظف وأسرع
- 🔧 **إصلاح الأخطاء**: لا توجد مراجع معطلة أو imports مكسورة

## 🎯 نظرة عامة

هذا النظام يجمع بين قوة الذكاء الاصطناعي (Google Gemini) وتكامل Facebook Messenger لتوفير تجربة تفاعلية ذكية مع الرد التلقائي على استفسارات العملاء.

## ✨ المميزات الرئيسية

### ✅ **المميزات المكتملة:**
- 🤖 **ردود ذكية** باستخدام Google Gemini AI
- 🎨 **كشف الألوان التلقائي** من النصوص العربية والإنجليزية
- 📸 **إرسال الصور تلقائياً** عند طلب لون معين
- 💬 **إدارة المحادثات** مع حفظ التاريخ الكامل
- 🖥️ **واجهة إدارة سهلة** لإدارة الألوان والإعدادات
- 📊 **إحصائيات حقيقية** من قاعدة البيانات مع تحديث مباشر
- 🔗 **Webhooks فعالة** - استقبال الرسائل من Facebook تلقائياً
- 💾 **نظام حفظ دائم** للألوان مع إمكانية الإضافة والحذف
- 🔄 **تحديث مباشر** - Real-time updates للرسائل والمحادثات
- 🗄️ **قاعدة بيانات متكاملة** - Supabase مع جداول محسنة
- 📈 **لوحة تحكم ذكية** مع بيانات حقيقية ومؤشرات الأداء

### 🎨 **نظام الألوان المتقدم:**
- **كشف ذكي للألوان** من النصوص العربية والإنجليزية
- **إدارة مرنة للألوان** - إضافة وحذف وتعديل
- **صور عالية الجودة** مع روابط HTTPS آمنة
- **كلمات مفتاحية متعددة** لكل لون
- **حفظ دائم** في ملف JSON مع نسخ احتياطي تلقائي

## 🛠️ التقنيات المستخدمة

### **Frontend (React + TypeScript):**
- **Framework:** Vite + React 18 + TypeScript
- **UI Library:** shadcn/ui + Tailwind CSS
- **State Management:** React Hooks + TanStack Query
- **Routing:** React Router
- **Styling:** Tailwind CSS مع دعم RTL

### **Backend (Node.js + TypeScript):**
- **Runtime:** Node.js 18+
- **Framework:** Express.js + TypeScript
- **Process Manager:** tsx (development)
- **APIs:** RESTful APIs

### **Database & External Services:**
- **Database:** Supabase (PostgreSQL)
- **AI:** Google Gemini 1.5 Flash
- **Social:** Facebook Graph API
- **Storage:** External file hosting (HTTPS)

## 📋 متطلبات التشغيل

- **Node.js** 18+
- **npm** أو **yarn**
- **حساب Supabase** (قاعدة البيانات)
- **مفتاح Google Gemini AI**
- **Facebook Developer App** مع Page Access Token
- **صفحة Facebook** مع Messenger

## 🚀 التثبيت والتشغيل

### 1. استنساخ المشروع
```bash
git clone <YOUR_GIT_URL>
cd message-management-system
```

### 2. تثبيت التبعيات
```bash
npm install
```

### 3. إعداد متغيرات البيئة
```bash
# إنشاء ملف .env
cp .env.example .env

# تعديل الملف بالقيم الصحيحة
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 4. إعداد قاعدة البيانات
```bash
# تشغيل SQL في Supabase Dashboard
# إنشاء الجداول المطلوبة:
# - conversations
# - messages
# - gemini_settings
# - facebook_settings
```

### 5. تشغيل النظام
```bash
# تشغيل الواجهة الأمامية
npm run dev

# تشغيل خادم API الرئيسي (في terminal منفصل)
npm run api

# تشغيل خادم البيانات الحقيقية (في terminal منفصل)
node test-server.cjs
```

### 6. الوصول للنظام
- **الواجهة الأمامية:** `http://localhost:8082`
- **API Server الرئيسي:** `http://localhost:3002`
- **API Server البيانات الحقيقية:** `http://localhost:3005`

## 📖 دليل الاستخدام

### 1. الإعداد الأولي

#### **إعداد Gemini AI:**
1. اذهب إلى صفحة **الإعدادات**
2. أدخل **Gemini API Key** من [Google AI Studio](https://aistudio.google.com)
3. اختر النموذج: `gemini-1.5-flash`
4. اضبط الإعدادات (Temperature: 0.7, Max Tokens: 1000)
5. اضغط **حفظ الإعدادات**

#### **إعداد Facebook:**
1. في نفس صفحة **الإعدادات**
2. أدخل **Page Access Token** من Facebook Developer
3. أدخل **Verify Token** للـ Webhook
4. أدخل **Page ID** للصفحة المطلوبة
5. اضغط **حفظ الإعدادات**

### 2. إدارة الألوان

#### **إضافة منتج جديد:**
1. اذهب إلى صفحة **إدارة المنتجات**
2. اضغط **إضافة منتج جديد**
3. أدخل:
   - **اسم المنتج** (مثل: حذاء رياضي)
   - **الفئة** (مثل: أحذية)
   - **السعر** (مثل: 150)
   - **الوصف** (اختياري)
4. اضغط **إضافة المنتج**

#### **حذف أو تعديل لون:**
1. في قائمة الألوان المتاحة
2. اضغط **🗑️** لحذف اللون
3. أو اضغط **✏️** للتعديل

### 3. اختبار النظام

#### **اختبار كشف الألوان:**
1. في صفحة **إدارة صور المنتجات**
2. في تبويب **🧪 اختبار النظام**
3. اكتب رسالة مثل: "عايز اشوف الأحمر"
4. اضغط **اختبار**
5. شاهد النتيجة والصورة المرسلة

### 4. إدارة المحادثات
1. اذهب إلى صفحة **المحادثات**
2. اختر محادثة من القائمة
3. اقرأ الرسائل والردود الذكية
4. شاهد الصور المرسلة تلقائياً

## 🔧 إعداد Facebook API

### 1. إنشاء Facebook App
1. اذهب إلى [Facebook Developers](https://developers.facebook.com/)
2. أنشئ تطبيق جديد من نوع **Business**
3. أضف منتج **Messenger**
4. احصل على **Page Access Token** من إعدادات الصفحة
5. اضبط الأذونات المطلوبة:
   - `pages_messaging`
   - `pages_read_engagement`
   - `pages_manage_metadata`

### 2. إعداد Webhooks
```bash
# URL للـ Webhook (يجب أن يكون HTTPS للإنتاج)
https://your-domain.com/webhook

# Events المطلوبة:
- messages
- messaging_postbacks
```

## 🎨 كيف يعمل النظام

### مثال تطبيقي:
1. **العميل يرسل:** "عايز اشوف الأحمر"
2. **Gemini يرد:** "حبيبتي يا قمر 😍 اهو يا عسل اللون الأحمر ❤️✨"
3. **النظام يكتشف:** كلمة "أحمر" في رد Gemini
4. **النظام يرسل:** صورة المنتج الأحمر تلقائياً
5. **العميل يشاهد:** الرد النصي + صورة المنتج

### الألوان المدعومة حالياً:
- 🤍 **أبيض** (White) - `أبيض، ابيض، white`
- ❤️ **أحمر** (Red) - `أحمر، احمر، red`
- 🖤 **أسود** (Black) - `أسود، اسود، black`
- 💙 **أزرق** (Blue) - `أزرق، ازرق، blue، كحلي`
- 🤎 **بيج** (Beige) - `بيج، beige`
- 🐪 **جملي** (Camel) - `جملي، camel`

## 📁 هيكل المشروع

```
src/
├── api/                    # خدمات API الخلفية
│   ├── server.ts          # الخادم الرئيسي
│   ├── process-message.ts # معالجة الرسائل
│   ├── categories.ts      # إدارة الفئات

├── services/              # الخدمات الأساسية
│   ├── simpleGeminiService.ts # خدمة Gemini AI (مبسط)
│   ├── facebookApi.ts     # خدمة Facebook API
│   ├── orderService.ts    # خدمة إدارة الطلبات
│   └── nameUpdateService.ts # خدمة تحديث الأسماء
├── pages/                 # صفحات الواجهة
│   ├── Index.tsx          # الصفحة الرئيسية

│   ├── Conversations.tsx  # إدارة المحادثات
│   └── Categories.tsx     # إدارة الفئات
├── components/            # المكونات المشتركة
│   ├── Navigation.tsx     # شريط التنقل
│   ├── GeminiSettings.tsx # إعدادات Gemini
│   └── ui/               # مكونات واجهة المستخدم
└── integrations/          # تكاملات خارجية
    └── supabase/         # إعدادات Supabase
```

## 🗄️ قاعدة البيانات

### الجداول الرئيسية:
- **`conversations`** - المحادثات مع العملاء
- **`messages`** - الرسائل المتبادلة
- **`gemini_settings`** - إعدادات Gemini AI
- **`facebook_settings`** - إعدادات Facebook API

### ملفات البيانات:
- تم تبسيط النظام - لا توجد ملفات بيانات خارجية

## 📚 التوثيق الإضافي

للحصول على معلومات تفصيلية أكثر:

- 📖 **[التوثيق الشامل](SYSTEM_DOCUMENTATION.md)** - شرح مفصل لجميع مكونات النظام
- 📡 **[توثيق APIs](API_DOCUMENTATION.md)** - دليل شامل لجميع APIs المتاحة
- 🔧 **[دليل استكشاف الأخطاء](TROUBLESHOOTING_GUIDE.md)** - حلول للمشاكل الشائعة

## 🚨 استكشاف الأخطاء السريع

### المشاكل الشائعة:

#### **Gemini لا يرد:**
```bash
# تحقق من مفتاح API
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models
```

#### **الصور لا تُرسل:**
```bash
# تحقق من رابط الصورة
curl -I https://files.easy-orders.net/image.jpg
```

#### **النظام لا يعمل:**
```bash
# إعادة تشغيل سريعة
npm run api &
npm run dev &
```

## 🆕 **آخر التحديثات (يونيو 2025)**

### 📊 **لوحة التحكم الذكية الجديدة:**
- ✅ **إحصائيات حقيقية** من قاعدة البيانات
- ✅ **تحديث مباشر** للبيانات مع أزرار التحديث
- ✅ **مؤشرات الأداء** (إجمالي الرسائل، الردود الآلية، المحادثات النشطة، معدل الاستجابة)
- ✅ **رسائل حديثة حقيقية** مع أسماء العملاء والأوقات الدقيقة
- ✅ **معالجة الأخطاء الذكية** مع بيانات افتراضية عند فشل الاتصال
- ✅ **خادم API منفصل** (test-server.cjs) للبيانات الحقيقية

### 🔧 **التحسينات التقنية:**
- 🚀 **أداء محسن** لجلب البيانات
- 🛡️ **استقرار أعلى** مع معالجة شاملة للأخطاء
- 📱 **واجهة محسنة** مع مؤشرات التحميل
- 🔄 **تحديث تلقائي** للبيانات كل فترة

## 🎯 الميزات القادمة

- 📊 **تحليلات متقدمة** للمبيعات والألوان الأكثر طلباً
- 🛒 **نظام الطلبات** المتكامل مع تتبع الحالة
- 📱 **تطبيق موبايل** لإدارة النظام
- 🤖 **ذكاء اصطناعي محسن** لفهم أفضل للطلبات
- 🌐 **دعم متعدد اللغات** (إنجليزي، فرنسي، إلخ)

## 📞 الدعم والمساهمة

### للحصول على المساعدة:
- 📧 **فتح Issue** في GitHub للمشاكل التقنية
- 📖 **مراجعة التوثيق** للحصول على إجابات سريعة
- 🧪 **اختبار المميزات** قبل الإبلاغ عن مشاكل

### للمساهمة في التطوير:
1. **Fork** المشروع
2. **إنشاء branch** جديد للميزة
3. **Commit** التغييرات مع وصف واضح
4. **Push** وفتح **Pull Request**

---

## 🏆 الإنجازات

### ✅ **تم تطويره بنجاح:**
- **نظام ذكي متكامل** للرد على العملاء
- **كشف ألوان دقيق** بنسبة عالية من النجاح
- **واجهة سهلة الاستخدام** مع دعم كامل للعربية
- **نظام حفظ موثوق** مع نسخ احتياطي تلقائي
- **تكامل مثالي** مع Facebook و Gemini AI

**🎉 نظام جاهز للاستخدام الفعلي مع العملاء!**

---

## 🚀 **رفع المشروع على GitHub**

### استنساخ المشروع:
```bash
git clone https://github.com/elhenawymokhtar1/facebook-reply-system.git
cd facebook-reply-system
npm install
```

### تشغيل النظام:
```bash
# تشغيل الخادم الخلفي
cd src/api && npx tsx server.ts

# تشغيل الواجهة الأمامية (في terminal آخر)
npm run dev
```

### الوصول للنظام:
- 🌐 **الواجهة الرئيسية:** http://localhost:8080
- 🧪 **صفحة الاختبار:** http://localhost:8080/simple-test-chat
- ⚙️ **إعدادات Gemini:** http://localhost:8080/facebook-ai-settings

**⭐ إذا أعجبك المشروع، لا تنس إعطاؤه نجمة على GitHub!**
