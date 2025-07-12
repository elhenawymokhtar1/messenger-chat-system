/**
 * اختبار الجدول الموحد
 */

const mysql = require('mysql2/promise');
const colors = require('colors');

const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function testUnifiedTable() {
  let connection;
  
  try {
    console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
    connection = await mysql.createConnection(dbConfig);
    
    console.log('\n🧪 اختبار الجدول الموحد...'.yellow.bold);
    console.log('='.repeat(60).cyan);
    
    // اختبار الجدول الموحد
    console.log('📊 فحص الجدول الموحد facebook_pages_unified:'.blue);
    
    const [unifiedPages] = await connection.execute(`
      SELECT * FROM facebook_pages_unified WHERE company_id = 'company-2'
    `);
    
    console.log(`📄 عدد الصفحات في الجدول الموحد: ${unifiedPages.length}`.white);
    
    if (unifiedPages.length > 0) {
      unifiedPages.forEach((page, index) => {
        console.log(`\n   ${index + 1}. 📄 ${page.page_name} (${page.page_id})`.white);
        console.log(`      🏢 الشركة: ${page.company_id}`.gray);
        console.log(`      📊 المصدر: ${page.migrated_from}`.gray);
        console.log(`      ✅ نشطة: ${page.is_active ? 'نعم' : 'لا'}`.gray);
        console.log(`      🔔 Webhook: ${page.webhook_enabled ? 'مفعل' : 'معطل'}`.gray);
      });
    } else {
      console.log('❌ لا توجد صفحات في الجدول الموحد'.red);
    }
    
    // اختبار View الموحد
    console.log('\n📊 فحص View الموحد facebook_pages_all:'.blue);
    
    const [viewPages] = await connection.execute(`
      SELECT * FROM facebook_pages_all WHERE company_id = 'company-2'
    `);
    
    console.log(`📄 عدد الصفحات في View الموحد: ${viewPages.length}`.white);
    
    if (viewPages.length > 0) {
      viewPages.forEach((page, index) => {
        console.log(`\n   ${index + 1}. 📄 ${page.page_name} (${page.page_id})`.white);
        console.log(`      🏢 الشركة: ${page.company_id}`.gray);
        console.log(`      📊 المصدر: ${page.source_table}`.gray);
        console.log(`      ✅ نشطة: ${page.is_active ? 'نعم' : 'لا'}`.gray);
        console.log(`      🔔 Webhook: ${page.webhook_enabled ? 'مفعل' : 'معطل'}`.gray);
      });
    } else {
      console.log('❌ لا توجد صفحات في View الموحد'.red);
    }
    
    // مقارنة النتائج
    console.log('\n📈 مقارنة النتائج:'.green.bold);
    console.log(`   📊 الجدول الموحد: ${unifiedPages.length} صفحة`.white);
    console.log(`   📊 View الموحد: ${viewPages.length} صفحة`.white);
    
    if (unifiedPages.length === viewPages.length && unifiedPages.length > 0) {
      console.log('✅ النتائج متطابقة - التوحيد نجح!'.green);
    } else if (unifiedPages.length === 0 && viewPages.length > 0) {
      console.log('⚠️ الجدول الموحد فارغ لكن View يحتوي على بيانات'.yellow);
      console.log('💡 هذا طبيعي - View يقرأ من الجداول القديمة'.yellow);
    } else {
      console.log('❌ النتائج غير متطابقة - يحتاج مراجعة'.red);
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:'.red, error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

testUnifiedTable().catch(console.error);
