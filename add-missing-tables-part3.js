#!/usr/bin/env node

/**
 * 🔧 إضافة الجداول المفقودة - الجزء الثالث والأخير
 * الميزات المتقدمة والأدوات الإضافية
 */

import mysql from 'mysql2/promise';

// إعدادات قاعدة البيانات
const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// SQL لإنشاء الجداول المفقودة - الجزء الثالث
const MISSING_TABLES_SQL_PART3 = `
-- ===================================
-- 🔗 جدول الـ Webhooks
-- ===================================
CREATE TABLE IF NOT EXISTS webhooks (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,

    -- 🔗 بيانات الـ Webhook
    name VARCHAR(255) NOT NULL COMMENT 'اسم الـ Webhook',
    url TEXT NOT NULL COMMENT 'رابط الـ Webhook',
    secret VARCHAR(255) COMMENT 'المفتاح السري للتحقق',
    
    -- 📊 الأحداث
    events JSON NOT NULL COMMENT 'الأحداث المشترك بها',
    
    -- 📈 الإعدادات
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    retry_count INT DEFAULT 3 COMMENT 'عدد المحاولات',
    timeout_seconds INT DEFAULT 30 COMMENT 'مهلة الانتظار',
    
    -- 📊 الإحصائيات
    total_calls INT DEFAULT 0 COMMENT 'إجمالي الاستدعاءات',
    successful_calls INT DEFAULT 0 COMMENT 'الاستدعاءات الناجحة',
    failed_calls INT DEFAULT 0 COMMENT 'الاستدعاءات الفاشلة',
    last_called_at TIMESTAMP NULL COMMENT 'آخر استدعاء',
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_webhooks_company (company_id),
    INDEX idx_webhooks_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='الـ Webhooks';

-- ===================================
-- 🔔 جدول الإشعارات
-- ===================================
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    user_id CHAR(36),

    -- 🔔 بيانات الإشعار
    title VARCHAR(255) NOT NULL COMMENT 'عنوان الإشعار',
    message TEXT NOT NULL COMMENT 'محتوى الإشعار',
    type VARCHAR(50) DEFAULT 'info' COMMENT 'info, success, warning, error',
    
    -- 📊 الحالة
    is_read BOOLEAN DEFAULT FALSE COMMENT 'تم قراءته',
    is_important BOOLEAN DEFAULT FALSE COMMENT 'مهم',
    
    -- 🔗 الربط
    related_type VARCHAR(50) COMMENT 'نوع العنصر المرتبط',
    related_id CHAR(36) COMMENT 'معرف العنصر المرتبط',
    
    -- 📅 التواريخ
    read_at TIMESTAMP NULL COMMENT 'تاريخ القراءة',
    expires_at TIMESTAMP NULL COMMENT 'تاريخ الانتهاء',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES company_users(id) ON DELETE CASCADE,
    INDEX idx_notifications_company (company_id),
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='الإشعارات';

-- ===================================
-- 📂 جدول الفئات (للتوافق مع النظام القديم)
-- ===================================
CREATE TABLE IF NOT EXISTS categories (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,

    -- 📂 بيانات الفئة
    name VARCHAR(255) NOT NULL COMMENT 'اسم الفئة',
    slug VARCHAR(255) NOT NULL COMMENT 'الرابط المختصر',
    description TEXT COMMENT 'وصف الفئة',
    
    -- 🎨 التصميم
    icon VARCHAR(50) COMMENT 'أيقونة الفئة',
    color VARCHAR(7) COMMENT 'لون الفئة',
    image_url TEXT COMMENT 'صورة الفئة',
    
    -- 📊 الترتيب والحالة
    sort_order INT DEFAULT 0 COMMENT 'ترتيب العرض',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_company_category_slug (company_id, slug),
    INDEX idx_categories_company (company_id),
    INDEX idx_categories_active (is_active),
    INDEX idx_categories_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='الفئات (للتوافق)';

-- ===================================
-- 📋 جدول سجلات المراجعة
-- ===================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    user_id CHAR(36),

    -- 📋 بيانات النشاط
    action VARCHAR(100) NOT NULL COMMENT 'الإجراء المنفذ',
    table_name VARCHAR(100) COMMENT 'اسم الجدول',
    record_id CHAR(36) COMMENT 'معرف السجل',
    
    -- 📝 التغييرات
    old_values JSON COMMENT 'القيم القديمة',
    new_values JSON COMMENT 'القيم الجديدة',
    changes JSON COMMENT 'التغييرات المحددة',
    
    -- 🌐 معلومات الطلب
    ip_address VARCHAR(45) COMMENT 'عنوان IP',
    user_agent TEXT COMMENT 'معلومات المتصفح',
    
    -- 📅 التاريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES company_users(id) ON DELETE SET NULL,
    INDEX idx_audit_logs_company (company_id),
    INDEX idx_audit_logs_user (user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_table (table_name),
    INDEX idx_audit_logs_record (record_id),
    INDEX idx_audit_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجلات المراجعة';

-- ===================================
-- 📁 جدول رفع الملفات
-- ===================================
CREATE TABLE IF NOT EXISTS file_uploads (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    user_id CHAR(36),

    -- 📁 بيانات الملف
    original_name VARCHAR(255) NOT NULL COMMENT 'الاسم الأصلي',
    file_name VARCHAR(255) NOT NULL COMMENT 'اسم الملف المحفوظ',
    file_path TEXT NOT NULL COMMENT 'مسار الملف',
    file_size BIGINT NOT NULL COMMENT 'حجم الملف بالبايت',
    mime_type VARCHAR(100) COMMENT 'نوع الملف',
    
    -- 🔗 الربط
    related_type VARCHAR(50) COMMENT 'نوع العنصر المرتبط',
    related_id CHAR(36) COMMENT 'معرف العنصر المرتبط',
    
    -- 📊 الحالة
    is_public BOOLEAN DEFAULT FALSE COMMENT 'عام أم خاص',
    is_temporary BOOLEAN DEFAULT FALSE COMMENT 'مؤقت أم دائم',
    
    -- 📅 التواريخ
    expires_at TIMESTAMP NULL COMMENT 'تاريخ الانتهاء',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES company_users(id) ON DELETE SET NULL,
    INDEX idx_file_uploads_company (company_id),
    INDEX idx_file_uploads_user (user_id),
    INDEX idx_file_uploads_related (related_type, related_id),
    INDEX idx_file_uploads_public (is_public),
    INDEX idx_file_uploads_temporary (is_temporary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='رفع الملفات';

-- ===================================
-- 📧 جدول قوالب الإيميل
-- ===================================
CREATE TABLE IF NOT EXISTS email_templates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,

    -- 📧 بيانات القالب
    name VARCHAR(255) NOT NULL COMMENT 'اسم القالب',
    slug VARCHAR(255) NOT NULL COMMENT 'الرابط المختصر',
    subject VARCHAR(500) NOT NULL COMMENT 'موضوع الإيميل',
    
    -- 📝 المحتوى
    html_content TEXT COMMENT 'المحتوى HTML',
    text_content TEXT COMMENT 'المحتوى النصي',
    
    -- 🔧 المتغيرات
    variables JSON COMMENT 'المتغيرات المتاحة',
    
    -- 📊 الحالة
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_company_email_template_slug (company_id, slug),
    INDEX idx_email_templates_company (company_id),
    INDEX idx_email_templates_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='قوالب الإيميل';

-- ===================================
-- 📱 جدول قوالب الرسائل النصية
-- ===================================
CREATE TABLE IF NOT EXISTS sms_templates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,

    -- 📱 بيانات القالب
    name VARCHAR(255) NOT NULL COMMENT 'اسم القالب',
    slug VARCHAR(255) NOT NULL COMMENT 'الرابط المختصر',
    content TEXT NOT NULL COMMENT 'محتوى الرسالة',
    
    -- 🔧 المتغيرات
    variables JSON COMMENT 'المتغيرات المتاحة',
    
    -- 📊 الحالة
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_company_sms_template_slug (company_id, slug),
    INDEX idx_sms_templates_company (company_id),
    INDEX idx_sms_templates_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='قوالب الرسائل النصية';

-- ===================================
-- 🤖 جدول قواعد الأتمتة
-- ===================================
CREATE TABLE IF NOT EXISTS automation_rules (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,

    -- 🤖 بيانات القاعدة
    name VARCHAR(255) NOT NULL COMMENT 'اسم القاعدة',
    description TEXT COMMENT 'وصف القاعدة',
    
    -- 🔧 الشروط والإجراءات
    trigger_event VARCHAR(100) NOT NULL COMMENT 'الحدث المحفز',
    conditions JSON COMMENT 'الشروط',
    actions JSON COMMENT 'الإجراءات',
    
    -- 📊 الحالة
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    
    -- 📈 الإحصائيات
    execution_count INT DEFAULT 0 COMMENT 'عدد مرات التنفيذ',
    last_executed_at TIMESTAMP NULL COMMENT 'آخر تنفيذ',
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_automation_rules_company (company_id),
    INDEX idx_automation_rules_trigger (trigger_event),
    INDEX idx_automation_rules_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='قواعد الأتمتة';
`;

async function addMissingTablesPart3() {
  let connection;
  
  try {
    console.log('🔧 بدء إضافة الجداول المفقودة - الجزء الثالث والأخير...\n');
    
    // الاتصال بقاعدة البيانات
    console.log('📡 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بنجاح!\n');
    
    // إضافة الجزء الثالث من الجداول
    console.log('🏗️ إنشاء الجداول - الجزء الثالث...');
    await executeSQL(connection, MISSING_TABLES_SQL_PART3, 'الجزء الثالث');
    
    console.log('\n🎉 تم الانتهاء من جميع الجداول المفقودة!');
    
    // إضافة بيانات تجريبية
    await addSampleData(connection);
    
  } catch (error) {
    console.error('❌ خطأ في إضافة الجداول:', error.message);
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📡 تم إغلاق الاتصال');
    }
  }
}

async function executeSQL(connection, sql, description) {
  const statements = sql.split(';').filter(stmt => stmt.trim());
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (statement) {
      try {
        await connection.execute(statement);
        
        // استخراج اسم الجدول من SQL
        const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        if (tableMatch) {
          console.log(`✅ تم إنشاء جدول: ${tableMatch[1]}`);
        }
      } catch (error) {
        console.log(`⚠️ تحذير في ${description}: ${error.message}`);
      }
    }
  }
}

async function addSampleData(connection) {
  try {
    console.log('\n📝 إضافة بيانات تجريبية للجداول الجديدة...');
    
    // إضافة قوالب إيميل تجريبية
    await connection.execute(`
      INSERT IGNORE INTO email_templates (
        id, company_id, name, slug, subject, html_content, variables, is_active
      ) VALUES 
      (
        UUID(), 'c677b32f-fe1c-4c64-8362-a1c03406608d', 
        'رسالة ترحيب', 'welcome', 
        'مرحباً بك في {{company_name}}',
        '<h1>مرحباً {{customer_name}}</h1><p>نرحب بك في {{company_name}}</p>',
        '["customer_name", "company_name"]',
        TRUE
      ),
      (
        UUID(), 'c677b32f-fe1c-4c64-8362-a1c03406608d', 
        'تأكيد الطلب', 'order_confirmation', 
        'تم تأكيد طلبك رقم {{order_number}}',
        '<h2>شكراً لك!</h2><p>تم تأكيد طلبك رقم {{order_number}}</p>',
        '["order_number", "customer_name", "total_amount"]',
        TRUE
      )
    `);
    
    console.log('✅ تم إضافة قوالب الإيميل التجريبية');
    
    // إضافة قوالب رسائل نصية تجريبية
    await connection.execute(`
      INSERT IGNORE INTO sms_templates (
        id, company_id, name, slug, content, variables, is_active
      ) VALUES 
      (
        UUID(), 'c677b32f-fe1c-4c64-8362-a1c03406608d', 
        'رسالة ترحيب', 'welcome_sms', 
        'مرحباً {{customer_name}}! نرحب بك في {{company_name}}',
        '["customer_name", "company_name"]',
        TRUE
      ),
      (
        UUID(), 'c677b32f-fe1c-4c64-8362-a1c03406608d', 
        'تأكيد الطلب', 'order_sms', 
        'تم تأكيد طلبك رقم {{order_number}}. المبلغ: {{total_amount}} جنيه',
        '["order_number", "total_amount"]',
        TRUE
      )
    `);
    
    console.log('✅ تم إضافة قوالب الرسائل النصية التجريبية');
    
  } catch (error) {
    console.log(`⚠️ تحذير في إضافة البيانات التجريبية: ${error.message}`);
  }
}

// تشغيل الإضافة
addMissingTablesPart3()
  .then(() => {
    console.log('\n🏁 انتهت عملية إضافة جميع الجداول المفقودة');
    console.log('🎉 النظام مكتمل الآن!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 خطأ عام:', error);
    process.exit(1);
  });

export { addMissingTablesPart3 };
