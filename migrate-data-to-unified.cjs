/**
 * نقل البيانات من الجدولين القديمين للجدول الموحد
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

async function migrateDataToUnified() {
  let connection;
  
  try {
    console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'.green);
    
    console.log('\n📋 نقل البيانات للجدول الموحد...'.yellow.bold);
    console.log('='.repeat(60).cyan);
    
    // مسح الجدول الموحد أولاً (للتأكد من البداية النظيفة)
    console.log('🧹 مسح البيانات القديمة من الجدول الموحد...'.yellow);
    await connection.execute('DELETE FROM facebook_pages_unified');
    console.log('✅ تم مسح البيانات القديمة'.green);
    
    // نقل البيانات من facebook_settings
    console.log('\n📄 نقل البيانات من facebook_settings...'.blue);
    
    const [settingsData] = await connection.execute(`
      SELECT * FROM facebook_settings ORDER BY created_at
    `);
    
    console.log(`📊 عدد الصفحات في facebook_settings: ${settingsData.length}`.white);
    
    for (const page of settingsData) {
      try {
        await connection.execute(`
          INSERT INTO facebook_pages_unified (
            id, company_id, page_id, page_name, access_token,
            webhook_enabled, webhook_url, webhook_verify_token,
            auto_reply_enabled, welcome_message, is_active,
            source_table, migrated_from, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          page.id,
          page.company_id,
          page.page_id,
          page.page_name,
          page.access_token,
          page.webhook_enabled || false,
          page.webhook_url,
          page.webhook_verify_token,
          page.auto_reply_enabled || false,
          page.welcome_message,
          page.is_active !== undefined ? page.is_active : true,
          'unified',
          'facebook_settings',
          page.created_at,
          page.updated_at
        ]);
        
        console.log(`   ✅ نقل صفحة: ${page.page_name} (${page.page_id})`.green);
      } catch (error) {
        console.log(`   ❌ خطأ في نقل صفحة ${page.page_id}: ${error.message}`.red);
      }
    }
    
    // نقل البيانات من facebook_pages
    console.log('\n📄 نقل البيانات من facebook_pages...'.blue);
    
    const [pagesData] = await connection.execute(`
      SELECT * FROM facebook_pages ORDER BY created_at
    `);
    
    console.log(`📊 عدد الصفحات في facebook_pages: ${pagesData.length}`.white);
    
    for (const page of pagesData) {
      try {
        // التحقق من عدم وجود الصفحة مسبقاً (تجنب التكرار)
        const [existing] = await connection.execute(`
          SELECT id FROM facebook_pages_unified WHERE page_id = ? AND company_id = ?
        `, [page.page_id, page.company_id]);
        
        if (existing.length > 0) {
          console.log(`   ⚠️ صفحة موجودة مسبقاً: ${page.page_name} (${page.page_id})`.yellow);
          continue;
        }
        
        await connection.execute(`
          INSERT INTO facebook_pages_unified (
            id, company_id, page_id, page_name, access_token,
            webhook_enabled, webhook_verified, is_active,
            source_table, migrated_from, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          page.id,
          page.company_id,
          page.page_id,
          page.page_name,
          page.access_token,
          false, // webhook_enabled (افتراضي false للصفحات من facebook_pages)
          page.webhook_verified || false,
          page.is_active !== undefined ? page.is_active : true,
          'unified',
          'facebook_pages',
          page.created_at,
          page.updated_at
        ]);
        
        console.log(`   ✅ نقل صفحة: ${page.page_name} (${page.page_id})`.green);
      } catch (error) {
        console.log(`   ❌ خطأ في نقل صفحة ${page.page_id}: ${error.message}`.red);
      }
    }
    
    // التحقق من النتائج
    console.log('\n📊 التحقق من النتائج...'.blue.bold);
    
    const [unifiedCount] = await connection.execute(`
      SELECT COUNT(*) as total FROM facebook_pages_unified
    `);
    
    const [sourceBreakdown] = await connection.execute(`
      SELECT migrated_from, COUNT(*) as count 
      FROM facebook_pages_unified 
      GROUP BY migrated_from
    `);
    
    console.log(`📈 إجمالي الصفحات في الجدول الموحد: ${unifiedCount[0].total}`.green);
    console.log('📋 توزيع المصادر:'.cyan);
    sourceBreakdown.forEach(row => {
      console.log(`   📄 من ${row.migrated_from}: ${row.count} صفحة`.white);
    });
    
    // اختبار للشركة التجريبية
    console.log('\n🏢 اختبار الشركة التجريبية...'.blue);
    const [companyPages] = await connection.execute(`
      SELECT page_id, page_name, migrated_from 
      FROM facebook_pages_unified 
      WHERE company_id = 'company-2'
      ORDER BY created_at
    `);
    
    console.log(`📊 صفحات الشركة التجريبية: ${companyPages.length}`.cyan);
    companyPages.forEach((page, index) => {
      console.log(`   ${index + 1}. 📄 ${page.page_name} (${page.page_id}) - من ${page.migrated_from}`.white);
    });
    
    console.log('\n✅ تم نقل جميع البيانات بنجاح!'.green.bold);
    console.log('🎯 الجدول الموحد جاهز للاستخدام'.green);
    
  } catch (error) {
    console.error('❌ خطأ في نقل البيانات:'.red, error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل نقل البيانات
if (require.main === module) {
  migrateDataToUnified().catch(console.error);
}

module.exports = { migrateDataToUnified };
