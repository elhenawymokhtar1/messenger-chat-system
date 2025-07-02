/**
 * 🗄️ إنشاء الجداول المطلوبة لنظام المحادثات
 */

import mysql from 'mysql2/promise';

const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4'
};

async function createTables() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // إنشاء جدول الشركات
    console.log('📋 إنشاء جدول companies...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // إنشاء جدول المحادثات
    console.log('📋 إنشاء جدول conversations...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(36) PRIMARY KEY,
        company_id VARCHAR(36) NOT NULL,
        customer_name VARCHAR(255),
        customer_facebook_id VARCHAR(255),
        last_message TEXT,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        page_id VARCHAR(255),
        is_online BOOLEAN DEFAULT FALSE,
        unread_count INT DEFAULT 0,
        conversation_status ENUM('active', 'pending', 'resolved', 'spam', 'archived') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        INDEX idx_company_id (company_id),
        INDEX idx_last_message_at (last_message_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // إنشاء جدول الرسائل
    console.log('📋 إنشاء جدول messages...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        conversation_id VARCHAR(36) NOT NULL,
        message_text TEXT,
        sender_type ENUM('user', 'page', 'system') NOT NULL,
        message_type ENUM('text', 'image', 'file', 'audio', 'video') DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        INDEX idx_conversation_id (conversation_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // إنشاء جدول صفحات الفيسبوك
    console.log('📋 إنشاء جدول facebook_pages...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS facebook_pages (
        id VARCHAR(36) PRIMARY KEY,
        company_id VARCHAR(36) NOT NULL,
        page_id VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        access_token TEXT,
        status ENUM('active', 'inactive', 'error') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        INDEX idx_company_id (company_id),
        INDEX idx_page_id (page_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ تم إنشاء جميع الجداول بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في إنشاء الجداول:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

createTables();
