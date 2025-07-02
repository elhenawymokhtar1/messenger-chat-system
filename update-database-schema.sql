-- إضافة عمود company_id إلى جدول facebook_settings
-- هذا سيربط كل صفحة Facebook بشركة محددة

-- 1. إضافة عمود company_id
ALTER TABLE facebook_settings 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 2. إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_facebook_settings_company_id ON facebook_settings(company_id);

-- 3. إضافة قيد unique لضمان عدم تكرار الصفحة لنفس الشركة
ALTER TABLE facebook_settings 
ADD CONSTRAINT IF NOT EXISTS unique_page_per_company 
UNIQUE (page_id, company_id);

-- 4. تحديث الصفحات الموجودة (اختياري - يمكن تشغيله يدوياً)
-- UPDATE facebook_settings SET company_id = 'YOUR_DEFAULT_COMPANY_ID' WHERE company_id IS NULL;

-- 5. التحقق من النتيجة
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'facebook_settings' 
AND column_name = 'company_id';
