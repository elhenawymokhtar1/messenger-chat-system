-- ===================================
-- 📝 جدول سجل أنشطة المدير الأساسي
-- ===================================

CREATE TABLE IF NOT EXISTS super_admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 👤 معرف المدير الأساسي
    admin_id UUID NOT NULL REFERENCES system_admins(id) ON DELETE CASCADE,
    
    -- 🎯 نوع النشاط
    action VARCHAR(100) NOT NULL, -- login, login_as_company, view_company, etc.
    
    -- 📋 تفاصيل النشاط
    details JSONB DEFAULT '{}', -- تفاصيل إضافية عن النشاط
    
    -- 🌐 معلومات الشبكة
    ip_address INET, -- عنوان IP
    user_agent TEXT, -- معلومات المتصفح
    
    -- 📅 وقت النشاط
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_super_admin_logs_admin_id ON super_admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_super_admin_logs_action ON super_admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_super_admin_logs_created_at ON super_admin_logs(created_at);

-- إنشاء فهرس مركب للبحث المتقدم
CREATE INDEX IF NOT EXISTS idx_super_admin_logs_admin_action_date 
ON super_admin_logs(admin_id, action, created_at DESC);

-- تعليق على الجدول
COMMENT ON TABLE super_admin_logs IS 'سجل جميع أنشطة المدير الأساسي للنظام';
COMMENT ON COLUMN super_admin_logs.action IS 'نوع النشاط: login, login_as_company, view_companies, etc.';
COMMENT ON COLUMN super_admin_logs.details IS 'تفاصيل إضافية بصيغة JSON';

-- ===================================
-- 🔧 دوال مساعدة
-- ===================================

-- دالة لتنظيف السجلات القديمة (أكثر من 6 أشهر)
CREATE OR REPLACE FUNCTION cleanup_old_super_admin_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM super_admin_logs 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على إحصائيات أنشطة المدير الأساسي
CREATE OR REPLACE FUNCTION get_super_admin_activity_stats(
    admin_id_param UUID DEFAULT NULL,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    action VARCHAR(100),
    count BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sal.action,
        COUNT(*) as count,
        MAX(sal.created_at) as last_activity
    FROM super_admin_logs sal
    WHERE 
        (admin_id_param IS NULL OR sal.admin_id = admin_id_param)
        AND sal.created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY sal.action
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 📊 إدراج بيانات تجريبية (اختيارية)
-- ===================================

-- يمكن إضافة بيانات تجريبية هنا إذا لزم الأمر
