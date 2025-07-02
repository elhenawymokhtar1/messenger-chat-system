# 🔧 تحديث قاعدة البيانات يدوياً

## المشكلة الحالية
النظام يحاول البحث عن عمود `company_id` في جدول `facebook_settings` لكن هذا العمود غير موجود.

## الحل المؤقت المطبق ✅
تم تطبيق فلترة على مستوى التطبيق بدلاً من قاعدة البيانات، لذلك النظام يعمل الآن بشكل صحيح.

## للحصول على الحل النهائي (اختياري)

### 1. اذهب إلى Supabase Dashboard
1. افتح [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. اذهب إلى "SQL Editor"

### 2. شغل هذا SQL:

```sql
-- إنشاء جدول companies إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Egypt',
    status VARCHAR(20) DEFAULT 'active',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- إضافة بعض الشركات التجريبية
INSERT INTO companies (id, name, email, city, status, is_verified, created_at) 
VALUES 
    ('company-1', 'Swan Shop', 'info@swanshop.com', 'القاهرة', 'active', true, NOW() - INTERVAL '60 days'),
    ('company-2', 'سولا 127', 'info@sola127.com', 'الإسكندرية', 'active', true, NOW() - INTERVAL '45 days'),
    ('company-new', 'شركة جديدة للاختبار', 'info@newcompany.com', 'الجيزة', 'active', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- إضافة عمود company_id إلى facebook_settings
ALTER TABLE facebook_settings 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_facebook_settings_company_id ON facebook_settings(company_id);

-- ربط الصفحات الموجودة بالشركات
UPDATE facebook_settings 
SET company_id = CASE 
    WHEN page_id = '260345600493273' THEN 'company-1'  -- Swan Shop
    WHEN page_id = '240244019177739' THEN 'company-2'  -- سولا 127
    ELSE NULL
END
WHERE company_id IS NULL;

-- التحقق من النتيجة
SELECT 
    fs.page_id,
    fs.page_name,
    c.name as company_name,
    fs.company_id
FROM facebook_settings fs
LEFT JOIN companies c ON fs.company_id = c.id
ORDER BY c.name, fs.page_name;
```

### 3. بعد تشغيل SQL:
- ستحصل على عزل حقيقي في قاعدة البيانات
- سيتم ربط كل صفحة بشركة محددة
- سيعمل النظام بشكل أكثر كفاءة

## الحالة الحالية ✅

### ما يعمل الآن:
- [x] عزل كامل للصفحات بين الشركات
- [x] فلترة تلقائية على مستوى التطبيق
- [x] Swan Shop ترى صفحتها فقط
- [x] سولا 127 ترى صفحتها فقط
- [x] الشركات الجديدة لا ترى أي صفحات
- [x] رسائل ترحيبية للشركات الجديدة
- [x] واجهة اختبار تعمل بشكل مثالي

### كيفية الاختبار:
1. افتح: `http://localhost:8081/test-company-pages.html`
2. جرب التبديل بين الشركات
3. اذهب للإعدادات وتحقق من الصفحات المعروضة

## ملاحظة مهمة 💡
النظام يعمل بشكل مثالي الآن حتى بدون تحديث قاعدة البيانات. تحديث قاعدة البيانات اختياري لتحسين الأداء فقط.
