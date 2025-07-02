/**
 * 🗑️ حذف الصفحات التجريبية من قاعدة البيانات
 */

import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function deleteTestPages() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. عرض جميع الصفحات الموجودة
    console.log('\n📋 الصفحات الموجودة حالياً:');
    console.log('==================================================');
    
    const [pages] = await connection.execute(`
      SELECT id, page_id, page_name, company_id, created_at 
      FROM facebook_settings 
      ORDER BY created_at DESC
    `);
    
    pages.forEach((page, index) => {
      console.log(`${index + 1}. ${page.page_name} (${page.page_id})`);
      console.log(`   Company: ${page.company_id}`);
      console.log(`   Created: ${page.created_at}`);
      console.log('');
    });

    // 2. تحديد الصفحات التجريبية للحذف
    const testPagePatterns = [
      'test_page_',
      'final_test_',
      'test_delete_',
      'conversion_test_',
      'صفحة اختبار',
      'صفحة تجريبية'
    ];

    console.log('🔍 البحث عن الصفحات التجريبية...');
    
    const testPages = pages.filter(page => {
      return testPagePatterns.some(pattern => 
        page.page_id.includes(pattern) || 
        page.page_name.includes(pattern)
      );
    });

    if (testPages.length === 0) {
      console.log('✅ لا توجد صفحات تجريبية للحذف');
      return;
    }

    console.log(`\n🗑️ تم العثور على ${testPages.length} صفحة تجريبية للحذف:`);
    testPages.forEach((page, index) => {
      console.log(`${index + 1}. ${page.page_name} (${page.page_id})`);
    });

    // 3. حذف الصفحات التجريبية
    console.log('\n🗑️ بدء حذف الصفحات التجريبية...');
    
    for (const page of testPages) {
      try {
        console.log(`🗑️ حذف: ${page.page_name}...`);
        
        const [result] = await connection.execute(
          'DELETE FROM facebook_settings WHERE id = ?',
          [page.id]
        );
        
        if (result.affectedRows > 0) {
          console.log(`✅ تم حذف: ${page.page_name}`);
        } else {
          console.log(`⚠️ لم يتم العثور على: ${page.page_name}`);
        }
      } catch (error) {
        console.error(`❌ خطأ في حذف ${page.page_name}:`, error.message);
      }
    }

    // 4. عرض النتيجة النهائية
    console.log('\n📊 النتيجة النهائية:');
    console.log('==================================================');
    
    const [remainingPages] = await connection.execute(`
      SELECT page_id, page_name, company_id 
      FROM facebook_settings 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 عدد الصفحات المتبقية: ${remainingPages.length}`);
    
    if (remainingPages.length > 0) {
      console.log('\n📋 الصفحات المتبقية:');
      remainingPages.forEach((page, index) => {
        console.log(`${index + 1}. ${page.page_name} (${page.page_id})`);
      });
    }

    console.log('\n✅ تم الانتهاء من عملية التنظيف');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
deleteTestPages();
