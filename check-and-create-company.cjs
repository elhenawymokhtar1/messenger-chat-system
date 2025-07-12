/**
 * فحص وإنشاء الشركة إذا لم تكن موجودة
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

async function checkAndCreateCompany() {
  let connection;
  
  try {
    console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
    connection = await mysql.createConnection(dbConfig);
    
    const targetCompany = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    
    console.log('\n🏢 فحص الشركات الموجودة...'.blue.bold);
    
    // فحص جميع الشركات
    const [allCompanies] = await connection.execute('SELECT id, name FROM companies ORDER BY name');
    
    console.log('📋 الشركات الموجودة:'.cyan);
    allCompanies.forEach((company, index) => {
      const isTarget = company.id === targetCompany ? '🎯' : '  ';
      console.log(`${isTarget} ${index + 1}. 🏢 ${company.id} - ${company.name}`.white);
    });
    
    // فحص إذا كانت الشركة الهدف موجودة
    const [targetCompanyExists] = await connection.execute(
      'SELECT id, name FROM companies WHERE id = ?', 
      [targetCompany]
    );
    
    if (targetCompanyExists.length === 0) {
      console.log('\n⚠️ الشركة الهدف غير موجودة، سيتم إنشاؤها...'.yellow);
      
      // إنشاء الشركة
      await connection.execute(`
        INSERT INTO companies (id, name, created_at, updated_at) 
        VALUES (?, ?, NOW(), NOW())
      `, [targetCompany, 'الشركة الافتراضية']);
      
      console.log('✅ تم إنشاء الشركة الهدف بنجاح'.green);
    } else {
      console.log(`\n✅ الشركة الهدف موجودة: ${targetCompanyExists[0].name}`.green);
    }
    
    // الآن محاولة تحديث المحادثات
    console.log('\n🔄 تحديث المحادثات...'.blue);
    
    // تحديث company_id للمحادثات من company-2
    const [updateCompanyResult] = await connection.execute(`
      UPDATE conversations 
      SET company_id = ? 
      WHERE company_id = 'company-2'
    `, [targetCompany]);
    
    console.log(`✅ تم تحديث ${updateCompanyResult.affectedRows} محادثة لتنتمي للشركة الهدف`.green);
    
    // تحديث معرفات الصفحات
    console.log('\n📄 تحديث معرفات الصفحات...'.blue);
    
    // الحصول على الصفحات المتاحة
    const [availablePages] = await connection.execute(`
      SELECT page_id, page_name 
      FROM facebook_pages_unified 
      WHERE company_id = ? AND is_active = 1
    `, [targetCompany]);
    
    if (availablePages.length > 0) {
      const pageMapping = {
        'page_123': availablePages[0]?.page_id || '250528358137901',
        'page_789': availablePages[1]?.page_id || '123456789',
        'page_456': availablePages[0]?.page_id || '250528358137901'
      };
      
      console.log('📋 خريطة تحديث الصفحات:'.cyan);
      Object.entries(pageMapping).forEach(([oldId, newId]) => {
        console.log(`  📄 ${oldId} → ${newId}`.white);
      });
      
      for (const [oldPageId, newPageId] of Object.entries(pageMapping)) {
        const [updatePageResult] = await connection.execute(`
          UPDATE conversations 
          SET facebook_page_id = ? 
          WHERE facebook_page_id = ? AND company_id = ?
        `, [newPageId, oldPageId, targetCompany]);
        
        if (updatePageResult.affectedRows > 0) {
          console.log(`✅ تم تحديث ${updatePageResult.affectedRows} محادثة من ${oldPageId} إلى ${newPageId}`.green);
        }
      }
    }
    
    // عرض النتيجة النهائية
    console.log('\n📊 النتيجة النهائية:'.blue.bold);
    
    const [finalConversations] = await connection.execute(`
      SELECT company_id, facebook_page_id, COUNT(*) as count 
      FROM conversations 
      WHERE company_id = ?
      GROUP BY company_id, facebook_page_id
      ORDER BY count DESC
    `, [targetCompany]);
    
    if (finalConversations.length > 0) {
      console.log('✅ المحادثات للشركة الهدف:'.green);
      finalConversations.forEach((conv, index) => {
        console.log(`  ${index + 1}. 🏢 ${conv.company_id} | 📄 ${conv.facebook_page_id} | 💬 ${conv.count} محادثة`.white);
      });
      
      // حساب إجمالي المحادثات والرسائل
      const [totalStats] = await connection.execute(`
        SELECT 
          COUNT(DISTINCT c.id) as total_conversations,
          COUNT(m.id) as total_messages
        FROM conversations c
        LEFT JOIN messages m ON c.id = m.conversation_id
        WHERE c.company_id = ?
      `, [targetCompany]);
      
      console.log(`\n📊 الإحصائيات:`.cyan);
      console.log(`  💬 إجمالي المحادثات: ${totalStats[0].total_conversations}`.white);
      console.log(`  📝 إجمالي الرسائل: ${totalStats[0].total_messages}`.white);
      
    } else {
      console.log('⚠️ لا توجد محادثات للشركة الهدف'.yellow);
    }
    
    console.log('\n🎉 تم إصلاح البيانات بنجاح!'.green.bold);
    console.log('💡 يمكنك الآن تحديث صفحة المحادثات لرؤية النتائج'.cyan);
    
  } catch (error) {
    console.error('❌ خطأ في فحص وإنشاء الشركة:'.red, error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

checkAndCreateCompany().catch(console.error);
