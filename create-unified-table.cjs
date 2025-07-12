/**
 * إنشاء جدول موحد لصفحات Facebook
 * تاريخ الإنشاء: 11 يوليو 2025
 */

const mysql = require('mysql2/promise');
const colors = require('colors');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function createUnifiedTable() {
  let connection;
  
  try {
    console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'.green);
    
    console.log('\n📋 إنشاء جدول موحد لصفحات Facebook...'.yellow.bold);
    console.log('='.repeat(60).cyan);
    
    // إنشاء الجدول الموحد
    console.log('🔨 إنشاء جدول facebook_pages_unified...'.green);
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS facebook_pages_unified (
        id VARCHAR(255) PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL,
        page_id VARCHAR(255) NOT NULL,
        page_name VARCHAR(255),
        page_username VARCHAR(255),
        access_token TEXT,
        
        -- إعدادات Webhook
        webhook_enabled BOOLEAN DEFAULT FALSE,
        webhook_url VARCHAR(500),
        webhook_verify_token VARCHAR(255),
        webhook_verified BOOLEAN DEFAULT FALSE,
        
        -- إعدادات الرد التلقائي
        auto_reply_enabled BOOLEAN DEFAULT FALSE,
        welcome_message TEXT,
        
        -- حالة الصفحة
        is_active BOOLEAN DEFAULT TRUE,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        
        -- معلومات إضافية
        page_category VARCHAR(255),
        page_description TEXT,
        followers_count INT DEFAULT 0,
        
        -- معلومات المصدر
        source_table VARCHAR(50) DEFAULT 'unified',
        migrated_from VARCHAR(50),
        
        -- تواريخ
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_sync_at TIMESTAMP NULL,
        
        -- فهارس
        INDEX idx_company_id (company_id),
        INDEX idx_page_id (page_id),
        INDEX idx_active (is_active),
        INDEX idx_source (source_table),
        
        -- قيود
        UNIQUE KEY unique_page_per_company (company_id, page_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ تم إنشاء جدول facebook_pages_unified بنجاح'.green);
    
    // التحقق من بنية الجدول
    console.log('\n🔍 فحص بنية الجدول الجديد...'.blue);
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM facebook_pages_unified
    `);
    
    console.log('📋 أعمدة الجدول:'.cyan);
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`.white);
    });
    
    // التحقق من الفهارس
    console.log('\n📊 فحص الفهارس...'.blue);
    const [indexes] = await connection.execute(`
      SHOW INDEX FROM facebook_pages_unified
    `);
    
    const indexNames = [...new Set(indexes.map(idx => idx.Key_name))];
    console.log('🔑 الفهارس:'.cyan);
    indexNames.forEach((indexName, i) => {
      console.log(`   ${i + 1}. ${indexName}`.white);
    });
    
    console.log('\n✅ تم إنشاء الجدول الموحد بنجاح!'.green.bold);
    console.log('🎯 الجدول جاهز لاستقبال البيانات من الجدولين القديمين'.green);
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الجدول الموحد:'.red, error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل إنشاء الجدول
if (require.main === module) {
  createUnifiedTable().catch(console.error);
}

module.exports = { createUnifiedTable };
