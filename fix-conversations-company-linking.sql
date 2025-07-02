-- إصلاح ربط المحادثات بالشركات والصفحات
-- تاريخ الإنشاء: 25 يونيو 2025

-- 1. إضافة عمود page_id إلى جدول conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS page_id VARCHAR(255);

-- 2. إضافة عمود company_id إلى جدول conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- 3. إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_conversations_page_id ON conversations(page_id);
CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON conversations(company_id);

-- 4. إضافة مفتاح خارجي لربط page_id بجدول facebook_settings
-- ALTER TABLE conversations 
-- ADD CONSTRAINT fk_conversations_page_id 
-- FOREIGN KEY (page_id) REFERENCES facebook_settings(page_id);

-- 5. تحديث المحادثات الموجودة لربطها بالشركة الافتراضية
-- (يمكن تشغيل هذا يدوياً حسب الحاجة)

-- ربط المحادثات بصفحة Simple A42 والشركة 012@ttg.com
UPDATE conversations 
SET 
    page_id = '351400718067673',
    company_id = 'a37ce988-fd80-4a73-914f-63dc72b687e2'
WHERE page_id IS NULL OR company_id IS NULL;

-- 6. عرض النتائج
SELECT 
    c.id,
    c.customer_name,
    c.page_id,
    c.company_id,
    fs.page_name,
    comp.name as company_name
FROM conversations c
LEFT JOIN facebook_settings fs ON c.page_id = fs.page_id
LEFT JOIN companies comp ON c.company_id = comp.id
ORDER BY c.last_message_at DESC
LIMIT 10;
