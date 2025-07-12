/**
 * تنفيذ إنشاء View موحد لصفحات Facebook
 * تاريخ الإنشاء: 11 يوليو 2025
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
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

async function createUnifiedView() {
  let connection;
  
  try {
    console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'.green);
    
    console.log('\n📋 إنشاء View موحد لصفحات Facebook...'.yellow.bold);
    console.log('='.repeat(60).cyan);
    
    // حذف View القديم إذا كان موجوداً
    console.log('🗑️ حذف View القديم إذا كان موجوداً...'.yellow);
    try {
      await connection.execute('DROP VIEW IF EXISTS facebook_pages_all');
      console.log('✅ تم حذف View القديم'.green);
    } catch (error) {
      console.log('ℹ️ View غير موجود مسبقاً - لا مشكلة'.gray);
    }

    // إنشاء View جديد
    console.log('🔨 إنشاء View جديد...'.green);
    const createViewSQL = `
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
      FROM facebook_pages
    `;

    await connection.execute(createViewSQL);
    console.log('✅ تم إنشاء View موحد بنجاح'.green);
    
    console.log('\n🧪 اختبار View الجديد...'.blue.bold);
    
    // اختبار View
    const [viewResult] = await connection.execute(`
      SELECT source_table, COUNT(*) as count 
      FROM facebook_pages_all 
      GROUP BY source_table
    `);
    
    console.log('📊 نتائج View:'.cyan);
    viewResult.forEach(row => {
      console.log(`   📄 ${row.source_table}: ${row.count} صفحة`.white);
    });
    
    // اختبار للشركة التجريبية
    const [companyResult] = await connection.execute(`
      SELECT * FROM facebook_pages_all 
      WHERE company_id = 'company-2'
      ORDER BY created_at DESC
    `);
    
    console.log(`\n🏢 صفحات الشركة التجريبية: ${companyResult.length}`.cyan);
    companyResult.forEach((page, index) => {
      console.log(`   ${index + 1}. 📄 ${page.page_name} (${page.page_id}) - من ${page.source_table}`.white);
    });
    
    console.log('\n✅ تم إنشاء View موحد بنجاح!'.green.bold);
    console.log('🎯 يمكن الآن استخدام facebook_pages_all للوصول لجميع الصفحات'.green);
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء View:'.red, error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل إنشاء View
if (require.main === module) {
  createUnifiedView().catch(console.error);
}

module.exports = { createUnifiedView };
