/**
 * 🔧 إصلاح الجداول وإضافة الأعمدة المفقودة
 */

import mysql from 'mysql2/promise';

const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4'
};

async function fixTables() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // فحص بنية جدول conversations
    console.log('🔍 فحص بنية جدول conversations...');
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM conversations
    `);
    
    console.log('📋 الأعمدة الموجودة:', columns.map(col => col.Field));

    // إضافة الأعمدة المفقودة
    const requiredColumns = [
      'customer_name',
      'customer_facebook_id',
      'last_message',
      'last_message_at',
      'page_id',
      'is_online',
      'unread_count',
      'conversation_status'
    ];

    const existingColumns = columns.map(col => col.Field);

    for (const column of requiredColumns) {
      if (!existingColumns.includes(column)) {
        console.log(`➕ إضافة العمود: ${column}`);
        
        let alterQuery = '';
        switch (column) {
          case 'customer_name':
            alterQuery = 'ALTER TABLE conversations ADD COLUMN customer_name VARCHAR(255)';
            break;
          case 'customer_facebook_id':
            alterQuery = 'ALTER TABLE conversations ADD COLUMN customer_facebook_id VARCHAR(255)';
            break;
          case 'last_message':
            alterQuery = 'ALTER TABLE conversations ADD COLUMN last_message TEXT';
            break;
          case 'last_message_at':
            alterQuery = 'ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
            break;
          case 'page_id':
            alterQuery = 'ALTER TABLE conversations ADD COLUMN page_id VARCHAR(255)';
            break;
          case 'is_online':
            alterQuery = 'ALTER TABLE conversations ADD COLUMN is_online BOOLEAN DEFAULT FALSE';
            break;
          case 'unread_count':
            alterQuery = 'ALTER TABLE conversations ADD COLUMN unread_count INT DEFAULT 0';
            break;
          case 'conversation_status':
            alterQuery = "ALTER TABLE conversations ADD COLUMN conversation_status ENUM('active', 'pending', 'resolved', 'spam', 'archived') DEFAULT 'active'";
            break;
        }
        
        if (alterQuery) {
          await connection.execute(alterQuery);
          console.log(`✅ تم إضافة العمود: ${column}`);
        }
      } else {
        console.log(`✓ العمود موجود: ${column}`);
      }
    }

    // فحص جدول messages
    console.log('\n🔍 فحص بنية جدول messages...');
    try {
      const [messageColumns] = await connection.execute(`
        SHOW COLUMNS FROM messages
      `);
      console.log('📋 أعمدة messages:', messageColumns.map(col => col.Field));
    } catch (error) {
      console.log('⚠️ جدول messages غير موجود، سيتم إنشاؤه...');
      await connection.execute(`
        CREATE TABLE messages (
          id VARCHAR(36) PRIMARY KEY,
          conversation_id VARCHAR(36) NOT NULL,
          message_text TEXT,
          sender_type ENUM('user', 'page', 'system') NOT NULL,
          message_type ENUM('text', 'image', 'file', 'audio', 'video') DEFAULT 'text',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_conversation_id (conversation_id),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ تم إنشاء جدول messages');
    }

    console.log('\n✅ تم إصلاح جميع الجداول بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في إصلاح الجداول:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

fixTables();
