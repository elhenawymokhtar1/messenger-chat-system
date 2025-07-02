#!/usr/bin/env node

/**
 * 📱 إضافة جداول الواتساب لقاعدة البيانات MySQL
 * يضيف جداول WhatsApp Baileys والإعدادات المطلوبة
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

// SQL لإنشاء جداول الواتساب
const WHATSAPP_TABLES_SQL = `
-- ===================================
-- 📱 جدول إعدادات الواتساب
-- ===================================
CREATE TABLE IF NOT EXISTS whatsapp_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,

    -- 📱 بيانات الاتصال
    phone_number VARCHAR(20) COMMENT 'رقم الهاتف المرتبط',
    session_name VARCHAR(100) DEFAULT 'whatsapp-session' COMMENT 'اسم الجلسة',
    
    -- 🔐 حالة الاتصال
    is_connected BOOLEAN DEFAULT FALSE COMMENT 'متصل أم لا',
    connection_status VARCHAR(50) DEFAULT 'disconnected' COMMENT 'حالة الاتصال',
    qr_code TEXT COMMENT 'QR Code للاتصال',
    
    -- ⚙️ الإعدادات العامة
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    auto_reply_enabled BOOLEAN DEFAULT TRUE COMMENT 'الرد التلقائي مفعل',
    welcome_message TEXT DEFAULT 'مرحباً بك! كيف يمكنني مساعدتك؟' COMMENT 'رسالة الترحيب',
    
    -- 📊 الإحصائيات
    total_messages INT DEFAULT 0 COMMENT 'إجمالي الرسائل',
    last_message_at TIMESTAMP NULL COMMENT 'آخر رسالة',
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_connected_at TIMESTAMP NULL COMMENT 'آخر اتصال',

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_company_whatsapp (company_id),
    INDEX idx_whatsapp_settings_company (company_id),
    INDEX idx_whatsapp_settings_active (is_active),
    INDEX idx_whatsapp_settings_connected (is_connected)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='إعدادات الواتساب';

-- ===================================
-- 🤖 جدول إعدادات الذكاء الاصطناعي للواتساب
-- ===================================
CREATE TABLE IF NOT EXISTS whatsapp_ai_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,

    -- 🤖 إعدادات الذكاء الاصطناعي
    is_enabled BOOLEAN DEFAULT FALSE COMMENT 'مفعل أم لا',
    use_existing_prompt BOOLEAN DEFAULT TRUE COMMENT 'استخدام البرومبت الموجود',
    custom_prompt TEXT COMMENT 'برومبت مخصص',
    
    -- 🔑 إعدادات API
    api_key TEXT COMMENT 'مفتاح API',
    model VARCHAR(100) DEFAULT 'gemini-1.5-flash' COMMENT 'نموذج الذكاء الاصطناعي',
    temperature DECIMAL(3,2) DEFAULT 0.7 COMMENT 'درجة الإبداع',
    max_tokens INT DEFAULT 1000 COMMENT 'أقصى عدد كلمات',
    
    -- 🔐 الصلاحيات
    can_access_orders BOOLEAN DEFAULT TRUE COMMENT 'يمكن الوصول للطلبات',
    can_access_products BOOLEAN DEFAULT TRUE COMMENT 'يمكن الوصول للمنتجات',
    auto_reply_enabled BOOLEAN DEFAULT TRUE COMMENT 'الرد التلقائي مفعل',
    
    -- 📊 الإحصائيات
    total_requests INT DEFAULT 0 COMMENT 'إجمالي الطلبات',
    successful_requests INT DEFAULT 0 COMMENT 'الطلبات الناجحة',
    failed_requests INT DEFAULT 0 COMMENT 'الطلبات الفاشلة',

    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_company_whatsapp_ai (company_id),
    INDEX idx_whatsapp_ai_company (company_id),
    INDEX idx_whatsapp_ai_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='إعدادات الذكاء الاصطناعي للواتساب';

-- ===================================
-- 💬 جدول محادثات الواتساب
-- ===================================
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    whatsapp_settings_id CHAR(36) NOT NULL,

    -- 👤 بيانات جهة الاتصال
    phone_number VARCHAR(20) NOT NULL COMMENT 'رقم الهاتف',
    contact_name VARCHAR(255) COMMENT 'اسم جهة الاتصال',
    contact_avatar TEXT COMMENT 'صورة جهة الاتصال',

    -- 📊 حالة المحادثة
    status VARCHAR(50) DEFAULT 'active' COMMENT 'active, archived, blocked',
    is_group BOOLEAN DEFAULT FALSE COMMENT 'محادثة جماعية',
    group_name VARCHAR(255) COMMENT 'اسم المجموعة',

    -- 📈 الإحصائيات
    total_messages INT DEFAULT 0 COMMENT 'إجمالي الرسائل',
    unread_messages INT DEFAULT 0 COMMENT 'الرسائل غير المقروءة',

    -- 📅 التواريخ
    last_message_at TIMESTAMP NULL COMMENT 'آخر رسالة',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (whatsapp_settings_id) REFERENCES whatsapp_settings(id) ON DELETE CASCADE,
    UNIQUE KEY unique_whatsapp_conversation (whatsapp_settings_id, phone_number),
    INDEX idx_whatsapp_conversations_company (company_id),
    INDEX idx_whatsapp_conversations_settings (whatsapp_settings_id),
    INDEX idx_whatsapp_conversations_phone (phone_number),
    INDEX idx_whatsapp_conversations_status (status),
    INDEX idx_whatsapp_conversations_last_message (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='محادثات الواتساب';

-- ===================================
-- 💌 جدول رسائل الواتساب
-- ===================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,

    -- 📱 بيانات الواتساب
    whatsapp_message_id VARCHAR(255) UNIQUE COMMENT 'معرف الرسالة في الواتساب',
    phone_number VARCHAR(20) NOT NULL COMMENT 'رقم الهاتف',
    contact_name VARCHAR(255) COMMENT 'اسم جهة الاتصال',

    -- 📝 محتوى الرسالة
    message_text TEXT COMMENT 'نص الرسالة',
    message_type VARCHAR(50) DEFAULT 'text' COMMENT 'text, image, audio, video, document, sticker, location',
    media_url TEXT COMMENT 'رابط الوسائط',
    media_caption TEXT COMMENT 'تعليق الوسائط',
    
    -- 📊 حالة الرسالة
    direction VARCHAR(20) NOT NULL COMMENT 'incoming, outgoing',
    status VARCHAR(50) DEFAULT 'sent' COMMENT 'sent, delivered, read, failed',
    is_read BOOLEAN DEFAULT FALSE COMMENT 'تم قراءتها',

    -- 🤖 الذكاء الاصطناعي
    ai_processed BOOLEAN DEFAULT FALSE COMMENT 'تم معالجتها بالذكاء الاصطناعي',
    ai_response TEXT COMMENT 'رد الذكاء الاصطناعي',

    -- 📅 التواريخ
    sent_at TIMESTAMP NULL COMMENT 'وقت الإرسال',
    delivered_at TIMESTAMP NULL COMMENT 'وقت التسليم',
    read_at TIMESTAMP NULL COMMENT 'وقت القراءة',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_whatsapp_messages_conversation (conversation_id),
    INDEX idx_whatsapp_messages_company (company_id),
    INDEX idx_whatsapp_messages_whatsapp_id (whatsapp_message_id),
    INDEX idx_whatsapp_messages_phone (phone_number),
    INDEX idx_whatsapp_messages_direction (direction),
    INDEX idx_whatsapp_messages_status (status),
    INDEX idx_whatsapp_messages_sent_at (sent_at),
    INDEX idx_whatsapp_messages_ai_processed (ai_processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='رسائل الواتساب';

-- ===================================
-- 📊 جدول إحصائيات الواتساب
-- ===================================
CREATE TABLE IF NOT EXISTS whatsapp_stats (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    whatsapp_settings_id CHAR(36) NOT NULL,

    -- 📊 الإحصائيات اليومية
    date DATE NOT NULL COMMENT 'التاريخ',
    total_messages INT DEFAULT 0 COMMENT 'إجمالي الرسائل',
    incoming_messages INT DEFAULT 0 COMMENT 'الرسائل الواردة',
    outgoing_messages INT DEFAULT 0 COMMENT 'الرسائل الصادرة',
    ai_responses INT DEFAULT 0 COMMENT 'ردود الذكاء الاصطناعي',
    unique_contacts INT DEFAULT 0 COMMENT 'جهات الاتصال الفريدة',

    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (whatsapp_settings_id) REFERENCES whatsapp_settings(id) ON DELETE CASCADE,
    UNIQUE KEY unique_whatsapp_daily_stats (whatsapp_settings_id, date),
    INDEX idx_whatsapp_stats_company (company_id),
    INDEX idx_whatsapp_stats_settings (whatsapp_settings_id),
    INDEX idx_whatsapp_stats_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='إحصائيات الواتساب';
`;

async function addWhatsAppTables() {
  let connection;
  
  try {
    console.log('📱 بدء إضافة جداول الواتساب...\n');
    
    // الاتصال بقاعدة البيانات
    console.log('📡 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بنجاح!\n');
    
    // تنفيذ SQL لإنشاء الجداول
    console.log('🏗️ إنشاء جداول الواتساب...');
    
    const statements = WHATSAPP_TABLES_SQL.split(';').filter(stmt => stmt.trim());
    
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
          console.log(`⚠️ تحذير: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 تم الانتهاء من إنشاء جداول الواتساب!');
    
    // إضافة بيانات تجريبية
    await addSampleWhatsAppData(connection);
    
  } catch (error) {
    console.error('❌ خطأ في إضافة جداول الواتساب:', error.message);
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📡 تم إغلاق الاتصال');
    }
  }
}

async function addSampleWhatsAppData(connection) {
  try {
    console.log('\n📝 إضافة بيانات تجريبية للواتساب...');
    
    // إضافة إعدادات واتساب تجريبية
    await connection.execute(`
      INSERT IGNORE INTO whatsapp_settings (
        id, company_id, session_name, is_active, 
        auto_reply_enabled, welcome_message
      ) VALUES (
        UUID(), 'c677b32f-fe1c-4c64-8362-a1c03406608d', 
        'whatsapp-session-demo', TRUE, 
        TRUE, 'مرحباً بك في خدمة العملاء عبر الواتساب! 🌟'
      )
    `);
    
    console.log('✅ تم إضافة إعدادات واتساب تجريبية');
    
    // إضافة إعدادات الذكاء الاصطناعي
    await connection.execute(`
      INSERT IGNORE INTO whatsapp_ai_settings (
        id, company_id, is_enabled, use_existing_prompt,
        model, temperature, max_tokens, auto_reply_enabled
      ) VALUES (
        UUID(), 'c677b32f-fe1c-4c64-8362-a1c03406608d', 
        FALSE, TRUE, 'gemini-1.5-flash', 0.7, 1000, TRUE
      )
    `);
    
    console.log('✅ تم إضافة إعدادات الذكاء الاصطناعي للواتساب');
    
  } catch (error) {
    console.log(`⚠️ تحذير في إضافة البيانات التجريبية: ${error.message}`);
  }
}

// تشغيل الإضافة
addWhatsAppTables()
  .then(() => {
    console.log('\n🏁 انتهت عملية إضافة جداول الواتساب');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 خطأ عام:', error);
    process.exit(1);
  });

export { addWhatsAppTables };
