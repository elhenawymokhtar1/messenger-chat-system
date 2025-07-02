-- إضافة عمود company_id إلى جدول facebook_settings لربط الصفحات بالشركات
-- تاريخ الإنشاء: 24 يونيو 2025

-- إضافة عمود company_id إلى جدول facebook_settings
ALTER TABLE facebook_settings 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_facebook_settings_company_id ON facebook_settings(company_id);

-- تحديث الصفحات الموجودة لربطها بشركة افتراضية (إذا لزم الأمر)
-- يمكن تشغيل هذا يدوياً حسب الحاجة:
-- UPDATE facebook_settings SET company_id = 'YOUR_COMPANY_ID' WHERE company_id IS NULL;

-- إضافة قيد unique لضمان عدم تكرار الصفحة لنفس الشركة
-- ALTER TABLE facebook_settings ADD CONSTRAINT unique_page_per_company UNIQUE (page_id, company_id);

COMMENT ON COLUMN facebook_settings.company_id IS 'معرف الشركة المالكة لهذه الصفحة';
