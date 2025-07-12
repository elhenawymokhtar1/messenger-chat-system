/**
 * فحص المحادثات الموجودة في قاعدة البيانات
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

async function checkConversations() {
  let connection;
  
  try {
    console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
    connection = await mysql.createConnection(dbConfig);
    
    console.log('\n📊 فحص المحادثات الموجودة...'.blue.bold);
    
    // فحص جميع المحادثات
    const [allConversations] = await connection.execute(`
      SELECT company_id, facebook_page_id, COUNT(*) as count
      FROM conversations
      GROUP BY company_id, facebook_page_id
      ORDER BY count DESC
    `);
    
    console.log('📋 المحادثات حسب الشركة والصفحة:'.cyan);
    allConversations.forEach((conv, index) => {
      console.log(`  ${index + 1}. 🏢 ${conv.company_id} | 📄 ${conv.facebook_page_id} | 💬 ${conv.count} محادثة`.white);
    });
    
    // فحص الصفحات الموجودة
    console.log('\n📊 فحص صفحات Facebook الموجودة...'.blue.bold);
    
    const [unifiedPages] = await connection.execute(`
      SELECT company_id, page_id, page_name, is_active 
      FROM facebook_pages_unified 
      ORDER BY company_id, page_id
    `);
    
    console.log('📋 صفحات Facebook في الجدول الموحد:'.cyan);
    unifiedPages.forEach((page, index) => {
      const status = page.is_active ? '✅ نشطة' : '❌ معطلة';
      console.log(`  ${index + 1}. 🏢 ${page.company_id} | 📄 ${page.page_id} | 📝 ${page.page_name} | ${status}`.white);
    });
    
    // فحص المطابقة
    console.log('\n🔍 فحص المطابقة بين المحادثات والصفحات...'.blue.bold);
    
    const targetCompany = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    
    const [companyPages] = await connection.execute(`
      SELECT page_id, page_name FROM facebook_pages_unified 
      WHERE company_id = ? AND is_active = 1
    `, [targetCompany]);
    
    console.log(`📊 صفحات الشركة ${targetCompany}:`.cyan);
    companyPages.forEach((page, index) => {
      console.log(`  ${index + 1}. 📄 ${page.page_id} - ${page.page_name}`.white);
    });
    
    for (const page of companyPages) {
      const [conversations] = await connection.execute(`
        SELECT COUNT(*) as count FROM conversations
        WHERE company_id = ? AND facebook_page_id = ?
      `, [targetCompany, page.page_id]);

      console.log(`  💬 محادثات ${page.page_id}: ${conversations[0].count}`.gray);
    }
    
    // فحص المحادثات بدون تحديد شركة
    console.log('\n🔍 فحص المحادثات بدون تحديد company_id...'.blue.bold);
    
    const [conversationsWithoutCompany] = await connection.execute(`
      SELECT facebook_page_id, COUNT(*) as count
      FROM conversations
      WHERE company_id IS NULL OR company_id = ''
      GROUP BY facebook_page_id
      ORDER BY count DESC
    `);
    
    if (conversationsWithoutCompany.length > 0) {
      console.log('📋 محادثات بدون company_id:'.yellow);
      conversationsWithoutCompany.forEach((conv, index) => {
        console.log(`  ${index + 1}. 📄 ${conv.facebook_page_id} | 💬 ${conv.count} محادثة`.white);
      });
    } else {
      console.log('✅ جميع المحادثات لها company_id'.green);
    }
    
    // اقتراح حلول
    console.log('\n💡 اقتراحات للحل:'.green.bold);
    
    if (allConversations.length === 0) {
      console.log('❌ لا توجد محادثات في قاعدة البيانات'.red);
      console.log('💡 تحتاج لإنشاء محادثات تجريبية أو استيراد بيانات'.yellow);
    } else {
      const hasMatchingConversations = allConversations.some(conv =>
        conv.company_id === targetCompany &&
        companyPages.some(page => page.page_id === conv.facebook_page_id)
      );
      
      if (!hasMatchingConversations) {
        console.log('⚠️ لا توجد محادثات تطابق صفحات الشركة الحالية'.yellow);
        console.log('💡 يمكنك:'.cyan);
        console.log('   1. تحديث company_id للمحادثات الموجودة'.white);
        console.log('   2. تحديث page_id للصفحات لتطابق المحادثات'.white);
        console.log('   3. إنشاء محادثات جديدة للصفحات الحالية'.white);
      } else {
        console.log('✅ توجد محادثات تطابق صفحات الشركة'.green);
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص المحادثات:'.red, error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

checkConversations().catch(console.error);
