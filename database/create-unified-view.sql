-- إنشاء View موحد لصفحات Facebook
-- تاريخ الإنشاء: 11 يوليو 2025
-- الهدف: جمع البيانات من facebook_settings و facebook_pages في view واحد

-- حذف View إذا كان موجوداً
DROP VIEW IF EXISTS facebook_pages_all;

-- إنشاء View موحد
CREATE VIEW facebook_pages_all AS
SELECT 
    id,
    company_id,
    page_id,
    page_name,
    access_token,
    webhook_enabled,
    webhook_url,
    webhook_verify_token,
    auto_reply_enabled,
    welcome_message,
    is_active,
    created_at,
    updated_at,
    'facebook_settings' as source_table
FROM facebook_settings

UNION ALL

SELECT 
    id,
    company_id,
    page_id,
    page_name,
    access_token,
    COALESCE(webhook_verified, FALSE) as webhook_enabled,
    NULL as webhook_url,
    NULL as webhook_verify_token,
    FALSE as auto_reply_enabled,
    NULL as welcome_message,
    is_active,
    created_at,
    updated_at,
    'facebook_pages' as source_table
FROM facebook_pages;

-- إنشاء فهرس للأداء (إذا كان مدعوماً)
-- CREATE INDEX IF NOT EXISTS idx_facebook_pages_all_company_id ON facebook_pages_all(company_id);

-- تعليق توضيحي
-- هذا View يجمع البيانات من الجدولين بدون تغيير الجداول الأصلية
-- يمكن استخدامه في APIs الجديدة بينما الأدوات القديمة تستمر في العمل
