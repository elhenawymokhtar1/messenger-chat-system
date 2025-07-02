-- إصلاح العلاقة بين المتاجر والشركات
-- تاريخ الإنشاء: 26 يونيو 2025
-- الهدف: ربط كل متجر بشركة واحدة (العلاقة الصحيحة)

-- ===================================
-- 🔧 إضافة عمود company_id إلى جدول stores
-- ===================================

-- 1. إضافة عمود company_id إلى جدول stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 2. إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_stores_company_id ON stores(company_id);

-- 3. إضافة قيد unique لضمان عدم تكرار slug المتجر داخل نفس الشركة
ALTER TABLE stores 
DROP CONSTRAINT IF EXISTS stores_slug_key;

ALTER TABLE stores 
ADD CONSTRAINT unique_store_slug_per_company 
UNIQUE (company_id, slug);

-- ===================================
-- 📊 ربط المتاجر الموجودة بالشركات
-- ===================================

-- 4. ربط المتاجر الموجودة بشركة افتراضية (يمكن تعديل هذا حسب الحاجة)
-- أولاً: إنشاء شركة افتراضية إذا لم تكن موجودة
INSERT INTO companies (id, name, email, phone, status, is_verified, created_at, updated_at)
VALUES (
    'default-company-id',
    'الشركة الافتراضية',
    'default@company.com',
    '+20123456789',
    'active',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 5. ربط جميع المتاجر الموجودة بالشركة الافتراضية
UPDATE stores 
SET company_id = 'default-company-id'
WHERE company_id IS NULL;

-- ===================================
-- 🔍 التحقق من النتائج
-- ===================================

-- 6. عرض المتاجر مع الشركات المرتبطة بها
SELECT 
    s.id as store_id,
    s.name as store_name,
    s.slug as store_slug,
    c.name as company_name,
    c.email as company_email,
    s.is_active as store_active
FROM stores s
LEFT JOIN companies c ON s.company_id = c.id
ORDER BY c.name, s.name;

-- 7. إحصائيات الشركات والمتاجر
SELECT 
    c.name as company_name,
    c.email as company_email,
    COUNT(s.id) as total_stores,
    COUNT(CASE WHEN s.is_active = true THEN 1 END) as active_stores
FROM companies c
LEFT JOIN stores s ON c.id = s.company_id
GROUP BY c.id, c.name, c.email
ORDER BY total_stores DESC;

-- ===================================
-- 📝 ملاحظات مهمة
-- ===================================

/*
الآن العلاقة أصبحت صحيحة:
- كل متجر مرتبط بشركة واحدة (company_id)
- الشركة الواحدة يمكن أن تملك عدة متاجر
- جميع منتجات المتجر ستكون مرتبطة بالشركة عبر store_id
- هذا يضمن عزل البيانات بين الشركات

العلاقات الآن:
companies (1) ←→ (many) stores
companies (1) ←→ (many) facebook_settings  
stores (1) ←→ (many) products
stores (1) ←→ (many) categories
stores (1) ←→ (many) orders
*/
