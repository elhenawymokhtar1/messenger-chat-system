#!/usr/bin/env node

/**
 * 🔧 إضافة الجداول المفقودة - الجزء الثاني
 * الإدارة والأمان والميزات المتقدمة
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

// SQL لإنشاء الجداول المفقودة - الجزء الثاني
const MISSING_TABLES_SQL_PART2 = `
-- ===================================
-- 📊 جدول تتبع الاستخدام
-- ===================================
CREATE TABLE IF NOT EXISTS usage_tracking (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,

    -- 📊 نوع الاستخدام
    resource_type VARCHAR(50) NOT NULL COMMENT 'messages, api_calls, storage',
    resource_name VARCHAR(100) COMMENT 'اسم المورد المحدد',
    
    -- 📈 الكمية
    quantity INT NOT NULL DEFAULT 1 COMMENT 'الكمية المستخدمة',
    unit VARCHAR(20) DEFAULT 'count' COMMENT 'الوحدة',
    
    -- 📅 الفترة
    period_start DATE NOT NULL COMMENT 'بداية الفترة',
    period_end DATE NOT NULL COMMENT 'نهاية الفترة',
    
    -- 📊 بيانات إضافية
    metadata JSON COMMENT 'بيانات إضافية',
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_usage_tracking_company (company_id),
    INDEX idx_usage_tracking_resource (resource_type),
    INDEX idx_usage_tracking_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='تتبع الاستخدام';

-- ===================================
-- 💳 جدول المدفوعات
-- ===================================
CREATE TABLE IF NOT EXISTS payments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    subscription_id CHAR(36),

    -- 💳 بيانات الدفع
    amount DECIMAL(10,2) NOT NULL COMMENT 'المبلغ',
    currency VARCHAR(3) DEFAULT 'EGP' COMMENT 'العملة',
    payment_method VARCHAR(100) COMMENT 'طريقة الدفع',
    
    -- 📊 حالة الدفع
    status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, completed, failed, refunded',
    payment_reference VARCHAR(255) COMMENT 'مرجع الدفع الخارجي',
    
    -- 📝 التفاصيل
    description TEXT COMMENT 'وصف الدفع',
    notes TEXT COMMENT 'ملاحظات',
    
    -- 📅 التواريخ
    paid_at TIMESTAMP NULL COMMENT 'تاريخ الدفع',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES company_subscriptions(id) ON DELETE SET NULL,
    INDEX idx_payments_company (company_id),
    INDEX idx_payments_subscription (subscription_id),
    INDEX idx_payments_status (status),
    INDEX idx_payments_paid_at (paid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='المدفوعات';

-- ===================================
-- 🧾 جدول الفواتير
-- ===================================
CREATE TABLE IF NOT EXISTS invoices (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    subscription_id CHAR(36),

    -- 🧾 بيانات الفاتورة
    invoice_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'رقم الفاتورة',
    amount DECIMAL(10,2) NOT NULL COMMENT 'المبلغ',
    tax_amount DECIMAL(10,2) DEFAULT 0 COMMENT 'مبلغ الضريبة',
    total_amount DECIMAL(10,2) NOT NULL COMMENT 'المبلغ الإجمالي',
    
    -- 📊 الحالة
    status VARCHAR(50) DEFAULT 'draft' COMMENT 'draft, sent, paid, overdue, cancelled',
    
    -- 📅 التواريخ
    issue_date DATE NOT NULL COMMENT 'تاريخ الإصدار',
    due_date DATE NOT NULL COMMENT 'تاريخ الاستحقاق',
    paid_date DATE NULL COMMENT 'تاريخ الدفع',
    
    -- 📝 التفاصيل
    description TEXT COMMENT 'وصف الفاتورة',
    items JSON COMMENT 'بنود الفاتورة',
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES company_subscriptions(id) ON DELETE SET NULL,
    INDEX idx_invoices_company (company_id),
    INDEX idx_invoices_subscription (subscription_id),
    INDEX idx_invoices_number (invoice_number),
    INDEX idx_invoices_status (status),
    INDEX idx_invoices_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='الفواتير';

-- ===================================
-- 👑 جدول سجلات المدير الأساسي
-- ===================================
CREATE TABLE IF NOT EXISTS super_admin_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    admin_id CHAR(36) COMMENT 'معرف المدير الأساسي',

    -- 📊 بيانات النشاط
    action VARCHAR(100) NOT NULL COMMENT 'الإجراء المنفذ',
    resource_type VARCHAR(50) COMMENT 'نوع المورد',
    resource_id CHAR(36) COMMENT 'معرف المورد',
    
    -- 📝 التفاصيل
    description TEXT COMMENT 'وصف النشاط',
    old_values JSON COMMENT 'القيم القديمة',
    new_values JSON COMMENT 'القيم الجديدة',
    
    -- 🌐 معلومات الطلب
    ip_address VARCHAR(45) COMMENT 'عنوان IP',
    user_agent TEXT COMMENT 'معلومات المتصفح',
    
    -- 📊 مستوى الخطورة
    severity VARCHAR(20) DEFAULT 'info' COMMENT 'info, warning, error, critical',
    
    -- 📅 التاريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- الفهارس
    INDEX idx_super_admin_logs_admin (admin_id),
    INDEX idx_super_admin_logs_action (action),
    INDEX idx_super_admin_logs_resource (resource_type, resource_id),
    INDEX idx_super_admin_logs_severity (severity),
    INDEX idx_super_admin_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجلات المدير الأساسي';

-- ===================================
-- 🔐 جدول جلسات المستخدمين
-- ===================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,

    -- 🔐 بيانات الجلسة
    session_token VARCHAR(255) UNIQUE NOT NULL COMMENT 'رمز الجلسة',
    refresh_token VARCHAR(255) COMMENT 'رمز التحديث',
    
    -- 🌐 معلومات الجلسة
    ip_address VARCHAR(45) COMMENT 'عنوان IP',
    user_agent TEXT COMMENT 'معلومات المتصفح',
    device_info JSON COMMENT 'معلومات الجهاز',
    
    -- 📊 الحالة
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    
    -- 📅 التواريخ
    expires_at TIMESTAMP NOT NULL COMMENT 'تاريخ الانتهاء',
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'آخر نشاط',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (user_id) REFERENCES company_users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_user_sessions_user (user_id),
    INDEX idx_user_sessions_company (company_id),
    INDEX idx_user_sessions_token (session_token),
    INDEX idx_user_sessions_active (is_active),
    INDEX idx_user_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جلسات المستخدمين';

-- ===================================
-- 🔑 جدول مفاتيح API
-- ===================================
CREATE TABLE IF NOT EXISTS api_keys (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    user_id CHAR(36),

    -- 🔑 بيانات المفتاح
    name VARCHAR(255) NOT NULL COMMENT 'اسم المفتاح',
    api_key VARCHAR(255) UNIQUE NOT NULL COMMENT 'المفتاح',
    api_secret VARCHAR(255) COMMENT 'المفتاح السري',
    
    -- 🔐 الصلاحيات
    permissions JSON COMMENT 'الصلاحيات المسموحة',
    rate_limit INT DEFAULT 1000 COMMENT 'حد الطلبات في الساعة',
    
    -- 📊 الحالة
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    
    -- 📅 التواريخ
    expires_at TIMESTAMP NULL COMMENT 'تاريخ الانتهاء',
    last_used_at TIMESTAMP NULL COMMENT 'آخر استخدام',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES company_users(id) ON DELETE SET NULL,
    INDEX idx_api_keys_company (company_id),
    INDEX idx_api_keys_user (user_id),
    INDEX idx_api_keys_key (api_key),
    INDEX idx_api_keys_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='مفاتيح API';
`;

async function addMissingTablesPart2() {
  let connection;
  
  try {
    console.log('🔧 بدء إضافة الجداول المفقودة - الجزء الثاني...\n');
    
    // الاتصال بقاعدة البيانات
    console.log('📡 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بنجاح!\n');
    
    // إضافة الجزء الثاني من الجداول
    console.log('🏗️ إنشاء الجداول - الجزء الثاني...');
    await executeSQL(connection, MISSING_TABLES_SQL_PART2, 'الجزء الثاني');
    
    console.log('\n🎉 تم الانتهاء من الجزء الثاني!');
    
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

// تشغيل الإضافة
addMissingTablesPart2()
  .then(() => {
    console.log('\n🏁 انتهت عملية إضافة الجداول - الجزء الثاني');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 خطأ عام:', error);
    process.exit(1);
  });

export { addMissingTablesPart2 };
