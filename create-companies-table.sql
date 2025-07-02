-- إنشاء جدول companies
-- تاريخ الإنشاء: 24 يونيو 2025

-- 1. إنشاء جدول companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Egypt',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 2. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(email);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);

-- 3. إضافة بعض الشركات التجريبية
INSERT INTO companies (id, name, email, phone, website, address, city, status, is_verified, created_at) 
VALUES 
    ('company-1', 'Swan Shop', 'info@swanshop.com', '+201234567890', 'https://swanshop.com', 'القاهرة، مصر', 'القاهرة', 'active', true, NOW() - INTERVAL '60 days'),
    ('company-2', 'سولا 127', 'info@sola127.com', '+201234567891', 'https://sola127.com', 'الإسكندرية، مصر', 'الإسكندرية', 'active', true, NOW() - INTERVAL '45 days'),
    ('company-new', 'شركة جديدة للاختبار', 'info@newcompany.com', '+201234567892', 'https://newcompany.com', 'الجيزة، مصر', 'الجيزة', 'active', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. الآن إضافة عمود company_id إلى facebook_settings
ALTER TABLE facebook_settings 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 5. إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_facebook_settings_company_id ON facebook_settings(company_id);

-- 6. ربط الصفحات الموجودة بالشركات (اختياري)
-- يمكن تشغيل هذا يدوياً حسب الحاجة:
UPDATE facebook_settings 
SET company_id = CASE 
    WHEN page_id = '260345600493273' THEN 'company-1'  -- Swan Shop
    WHEN page_id = '240244019177739' THEN 'company-2'  -- سولا 127
    ELSE NULL
END
WHERE company_id IS NULL;

-- 7. التحقق من النتيجة
SELECT 
    'companies' as table_name,
    COUNT(*) as record_count
FROM companies
UNION ALL
SELECT 
    'facebook_settings' as table_name,
    COUNT(*) as record_count
FROM facebook_settings;

-- 8. عرض الصفحات مع الشركات
SELECT 
    fs.page_id,
    fs.page_name,
    c.name as company_name,
    fs.company_id
FROM facebook_settings fs
LEFT JOIN companies c ON fs.company_id = c.id
ORDER BY c.name, fs.page_name;
