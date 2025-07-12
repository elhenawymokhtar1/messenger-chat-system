/**
 * فحص التكرار في جداول Facebook
 * التحقق من وجود نفس الصفحة في الجدولين
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

async function checkDuplicates() {
  let connection;
  
  try {
    console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
    connection = await mysql.createConnection(dbConfig);
    
    console.log('\n🔍 فحص التكرار في جداول Facebook...'.yellow.bold);
    console.log('='.repeat(60).cyan);
    
    // جلب جميع الصفحات من facebook_settings
    const [settingsPages] = await connection.execute(`
      SELECT page_id, page_name, company_id, 'facebook_settings' as source
      FROM facebook_settings 
      WHERE company_id = 'company-2'
      ORDER BY page_id
    `);
    
    // جلب جميع الصفحات من facebook_pages
    const [pagesPages] = await connection.execute(`
      SELECT
        page_id,
        page_name,
        company_id,
        'facebook_pages' as source
      FROM facebook_pages
      WHERE company_id = 'company-2'
      ORDER BY page_id
    `);
    
    console.log('📊 النتائج:'.green.bold);
    console.log(`   📄 صفحات في facebook_settings: ${settingsPages.length}`.white);
    console.log(`   📄 صفحات في facebook_pages: ${pagesPages.length}`.white);
    
    console.log('\n📋 تفاصيل الصفحات:'.cyan.bold);
    
    console.log('\n🗂️ من جدول facebook_settings:'.yellow);
    settingsPages.forEach((page, index) => {
      console.log(`   ${index + 1}. 📄 ${page.page_id} - ${page.page_name}`.white);
    });
    
    console.log('\n🗂️ من جدول facebook_pages:'.yellow);
    pagesPages.forEach((page, index) => {
      console.log(`   ${index + 1}. 📄 ${page.page_id} - ${page.page_name}`.white);
    });
    
    // فحص التكرار
    console.log('\n🔍 فحص التكرار:'.red.bold);
    
    const settingsPageIds = new Set(settingsPages.map(p => p.page_id));
    const pagesPageIds = new Set(pagesPages.map(p => p.page_id));
    
    // البحث عن معرفات مكررة
    const duplicateIds = [];
    settingsPageIds.forEach(id => {
      if (pagesPageIds.has(id)) {
        duplicateIds.push(id);
      }
    });
    
    if (duplicateIds.length > 0) {
      console.log(`❌ تم العثور على ${duplicateIds.length} صفحة مكررة:`.red);
      duplicateIds.forEach(id => {
        const settingsPage = settingsPages.find(p => p.page_id === id);
        const pagesPage = pagesPages.find(p => p.page_id === id);
        
        console.log(`\n   🔄 صفحة مكررة: ${id}`.red);
        console.log(`      📄 في facebook_settings: ${settingsPage.page_name}`.gray);
        console.log(`      📄 في facebook_pages: ${pagesPage.page_name}`.gray);
      });
    } else {
      console.log('✅ لا يوجد تكرار - جميع الصفحات مختلفة!'.green);
    }
    
    // إحصائيات شاملة
    console.log('\n📈 الإحصائيات:'.blue.bold);
    console.log(`   📊 إجمالي الصفحات الفريدة: ${settingsPageIds.size + pagesPageIds.size - duplicateIds.length}`.white);
    console.log(`   🔄 الصفحات المكررة: ${duplicateIds.length}`.white);
    console.log(`   📄 صفحات فقط في facebook_settings: ${settingsPageIds.size - duplicateIds.length}`.white);
    console.log(`   📄 صفحات فقط في facebook_pages: ${pagesPageIds.size - duplicateIds.length}`.white);
    
    // فحص شامل لجميع الشركات
    console.log('\n🌍 فحص شامل لجميع الشركات:'.magenta.bold);
    
    const [allSettingsPages] = await connection.execute(`
      SELECT page_id, company_id FROM facebook_settings
    `);
    
    const [allPagesPages] = await connection.execute(`
      SELECT page_id, company_id FROM facebook_pages
    `);
    
    console.log(`📊 إجمالي الصفحات في facebook_settings: ${allSettingsPages.length}`.white);
    console.log(`📊 إجمالي الصفحات في facebook_pages: ${allPagesPages.length}`.white);
    
    // فحص التكرار العام
    const allSettingsIds = new Set(allSettingsPages.map(p => p.page_id));
    const allPagesIds = new Set(allPagesPages.map(p => p.page_id));
    
    const globalDuplicates = [];
    allSettingsIds.forEach(id => {
      if (allPagesIds.has(id)) {
        globalDuplicates.push(id);
      }
    });
    
    if (globalDuplicates.length > 0) {
      console.log(`⚠️ يوجد ${globalDuplicates.length} صفحة مكررة في النظام عموماً`.yellow);
      globalDuplicates.forEach(id => {
        const settingsPage = allSettingsPages.find(p => p.page_id === id);
        const pagesPage = allPagesPages.find(p => p.page_id === id);
        console.log(`   🔄 ${id} - شركة في settings: ${settingsPage.company_id}, شركة في pages: ${pagesPage.company_id}`.gray);
      });
    } else {
      console.log('✅ لا يوجد تكرار في النظام عموماً'.green);
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص التكرار:'.red, error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل الفحص
checkDuplicates().catch(console.error);
