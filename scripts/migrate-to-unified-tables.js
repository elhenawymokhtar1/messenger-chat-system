#!/usr/bin/env node

/**
 * 🔄 نص ترحيل البيانات إلى الجداول الموحدة
 * 
 * هذا النص يقوم بـ:
 * 1. نقل البيانات من الجداول القديمة إلى الموحدة
 * 2. تحديث أسماء الحقول
 * 3. التحقق من سلامة البيانات
 */

import mysql from 'mysql2/promise';
import colors from 'colors';

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: 'Mokhtar123456',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function migrateToUnifiedTables() {
  let connection;
  
  try {
    console.log('🚀 بدء ترحيل البيانات إلى الجداول الموحدة...'.yellow);
    
    connection = await mysql.createConnection(dbConfig);
    
    // 1. ترحيل صفحات Facebook
    await migrateFacebookPages(connection);
    
    // 2. تحديث أسماء الحقول في المحادثات
    await updateConversationFields(connection);
    
    // 3. التحقق من سلامة البيانات
    await verifyDataIntegrity(connection);
    
    console.log('✅ تم الانتهاء من الترحيل بنجاح!'.green);
    
  } catch (error) {
    console.error('❌ خطأ في الترحيل:'.red, error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * ترحيل صفحات Facebook إلى الجدول الموحد
 */
async function migrateFacebookPages(connection) {
  console.log('\n1️⃣ ترحيل صفحات Facebook...'.cyan);
  
  try {
    // جلب البيانات من facebook_settings
    const [facebookSettings] = await connection.execute(`
      SELECT * FROM facebook_settings 
      WHERE page_id NOT IN (
        SELECT page_id FROM facebook_pages_unified 
        WHERE page_id IS NOT NULL
      )
    `);
    
    console.log(`📊 وجدت ${facebookSettings.length} صفحة في facebook_settings للترحيل`);
    
    // ترحيل كل صفحة
    for (const page of facebookSettings) {
      await connection.execute(`
        INSERT INTO facebook_pages_unified (
          company_id, page_id, page_name, access_token,
          is_active, webhook_verified, webhook_enabled,
          source_table, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          page_name = VALUES(page_name),
          access_token = VALUES(access_token),
          is_active = VALUES(is_active),
          updated_at = VALUES(updated_at)
      `, [
        page.company_id,
        page.page_id,
        page.page_name,
        page.access_token,
        page.is_active || true,
        page.webhook_verified || false,
        page.webhook_enabled || false,
        'facebook_settings',
        page.created_at,
        page.updated_at || new Date()
      ]);
      
      console.log(`✅ تم ترحيل: ${page.page_name} (${page.page_id})`);
    }
    
    // جلب البيانات من facebook_pages إذا وجد
    try {
      const [facebookPages] = await connection.execute(`
        SELECT * FROM facebook_pages 
        WHERE page_id NOT IN (
          SELECT page_id FROM facebook_pages_unified 
          WHERE page_id IS NOT NULL
        )
      `);
      
      console.log(`📊 وجدت ${facebookPages.length} صفحة في facebook_pages للترحيل`);
      
      for (const page of facebookPages) {
        await connection.execute(`
          INSERT INTO facebook_pages_unified (
            company_id, page_id, page_name, access_token,
            is_active, source_table, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            page_name = VALUES(page_name),
            access_token = VALUES(access_token),
            updated_at = VALUES(updated_at)
        `, [
          page.company_id,
          page.page_id || page.facebook_page_id,
          page.page_name || page.name,
          page.access_token,
          page.is_active || true,
          'facebook_pages',
          page.created_at,
          page.updated_at || new Date()
        ]);
        
        console.log(`✅ تم ترحيل: ${page.page_name || page.name} (${page.page_id || page.facebook_page_id})`);
      }
    } catch (error) {
      console.log('ℹ️ جدول facebook_pages غير موجود - تم تخطيه');
    }
    
  } catch (error) {
    console.error('❌ خطأ في ترحيل صفحات Facebook:', error);
    throw error;
  }
}

/**
 * تحديث أسماء الحقول في جدول المحادثات
 */
async function updateConversationFields(connection) {
  console.log('\n2️⃣ تحديث أسماء الحقول في المحادثات...'.cyan);
  
  try {
    // التحقق من وجود الحقول القديمة
    const [columns] = await connection.execute('DESCRIBE conversations');
    const columnNames = columns.map(col => col.Field);
    
    // تحديث user_id إلى participant_id
    if (columnNames.includes('user_id') && !columnNames.includes('participant_id')) {
      await connection.execute('ALTER TABLE conversations CHANGE COLUMN user_id participant_id VARCHAR(255)');
      console.log('✅ تم تحديث user_id إلى participant_id');
    }
    
    // تحديث user_name إلى customer_name
    if (columnNames.includes('user_name') && !columnNames.includes('customer_name')) {
      await connection.execute('ALTER TABLE conversations CHANGE COLUMN user_name customer_name VARCHAR(255)');
      console.log('✅ تم تحديث user_name إلى customer_name');
    }
    
    // تحديث last_message_at إلى last_message_time
    if (columnNames.includes('last_message_at') && !columnNames.includes('last_message_time')) {
      await connection.execute('ALTER TABLE conversations CHANGE COLUMN last_message_at last_message_time TIMESTAMP');
      console.log('✅ تم تحديث last_message_at إلى last_message_time');
    }
    
    console.log('✅ تم الانتهاء من تحديث أسماء الحقول');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث أسماء الحقول:', error);
    throw error;
  }
}

/**
 * التحقق من سلامة البيانات بعد الترحيل
 */
async function verifyDataIntegrity(connection) {
  console.log('\n3️⃣ التحقق من سلامة البيانات...'.cyan);
  
  try {
    // عدد الصفحات في الجدول الموحد
    const [unifiedPages] = await connection.execute(
      'SELECT COUNT(*) as count FROM facebook_pages_unified WHERE is_active = 1'
    );
    console.log(`📊 الصفحات النشطة في الجدول الموحد: ${unifiedPages[0].count}`);
    
    // عدد المحادثات مع الحقول الجديدة
    const [conversations] = await connection.execute(
      'SELECT COUNT(*) as count FROM conversations WHERE participant_id IS NOT NULL'
    );
    console.log(`📊 المحادثات مع participant_id: ${conversations[0].count}`);
    
    // المحادثات بدون أسماء
    const [missingNames] = await connection.execute(`
      SELECT COUNT(*) as count FROM conversations 
      WHERE participant_id IS NOT NULL 
      AND (customer_name IS NULL OR customer_name = '' OR customer_name = 'undefined')
    `);
    console.log(`⚠️ المحادثات بدون أسماء: ${missingNames[0].count}`);
    
    // اختبار ربط الصفحات بالمحادثات
    const [linkedData] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM conversations c
      JOIN facebook_pages_unified p ON c.facebook_page_id = p.page_id
      WHERE p.is_active = 1
    `);
    console.log(`🔗 المحادثات المربوطة بصفحات نشطة: ${linkedData[0].count}`);
    
    console.log('✅ تم التحقق من سلامة البيانات');
    
  } catch (error) {
    console.error('❌ خطأ في التحقق من سلامة البيانات:', error);
    throw error;
  }
}

// تشغيل النص
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToUnifiedTables();
}
