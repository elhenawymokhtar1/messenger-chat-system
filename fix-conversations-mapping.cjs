/**
 * إصلاح ربط المحادثات بالصفحات الصحيحة
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

async function fixConversationsMapping() {
  let connection;
  
  try {
    console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
    connection = await mysql.createConnection(dbConfig);
    
    const targetCompany = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    
    console.log('\n🔧 إصلاح ربط المحادثات...'.blue.bold);
    
    // الخطة:
    // 1. تحديث المحادثات من company-2 إلى الشركة الهدف
    // 2. تحديث معرفات الصفحات لتطابق الصفحات الحالية
    
    console.log('📊 الوضع الحالي:'.cyan);
    
    // عرض المحادثات الحالية
    const [currentConversations] = await connection.execute(`
      SELECT company_id, facebook_page_id, COUNT(*) as count 
      FROM conversations 
      GROUP BY company_id, facebook_page_id
      ORDER BY count DESC
    `);
    
    currentConversations.forEach((conv, index) => {
      console.log(`  ${index + 1}. 🏢 ${conv.company_id} | 📄 ${conv.facebook_page_id} | 💬 ${conv.count} محادثة`.white);
    });
    
    // عرض الصفحات المتاحة
    const [availablePages] = await connection.execute(`
      SELECT company_id, page_id, page_name 
      FROM facebook_pages_unified 
      WHERE company_id = ? AND is_active = 1
    `, [targetCompany]);
    
    console.log('\n📄 الصفحات المتاحة للشركة الهدف:'.cyan);
    availablePages.forEach((page, index) => {
      console.log(`  ${index + 1}. 📄 ${page.page_id} - ${page.page_name}`.white);
    });
    
    if (availablePages.length === 0) {
      console.log('❌ لا توجد صفحات نشطة للشركة الهدف'.red);
      return;
    }
    
    // تحديث المحادثات
    console.log('\n🔄 تحديث المحادثات...'.blue);
    
    // تحديث company_id للمحادثات من company-2
    const [updateCompanyResult] = await connection.execute(`
      UPDATE conversations 
      SET company_id = ? 
      WHERE company_id = 'company-2'
    `, [targetCompany]);
    
    console.log(`✅ تم تحديث ${updateCompanyResult.affectedRows} محادثة لتنتمي للشركة الهدف`.green);
    
    // تحديث معرفات الصفحات لتطابق الصفحات المتاحة
    const pageMapping = {
      'page_123': availablePages[0]?.page_id || '250528358137901',
      'page_789': availablePages[1]?.page_id || '123456789',
      'page_456': availablePages[0]?.page_id || '250528358137901'
    };
    
    console.log('\n📋 خريطة تحديث الصفحات:'.cyan);
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
    
    // تحديث الرسائل المرتبطة
    console.log('\n💬 تحديث الرسائل المرتبطة...'.blue);
    
    const [conversationIds] = await connection.execute(`
      SELECT id FROM conversations WHERE company_id = ?
    `, [targetCompany]);
    
    if (conversationIds.length > 0) {
      const ids = conversationIds.map(c => c.id);
      const placeholders = ids.map(() => '?').join(',');
      
      const [messagesCount] = await connection.execute(`
        SELECT COUNT(*) as count FROM messages 
        WHERE conversation_id IN (${placeholders})
      `, ids);
      
      console.log(`📊 عدد الرسائل المرتبطة: ${messagesCount[0].count}`.white);
    }
    
    // عرض النتيجة النهائية
    console.log('\n📊 الوضع بعد التحديث:'.blue.bold);
    
    const [finalConversations] = await connection.execute(`
      SELECT company_id, facebook_page_id, COUNT(*) as count 
      FROM conversations 
      WHERE company_id = ?
      GROUP BY company_id, facebook_page_id
      ORDER BY count DESC
    `, [targetCompany]);
    
    if (finalConversations.length > 0) {
      console.log('✅ المحادثات بعد التحديث:'.green);
      finalConversations.forEach((conv, index) => {
        console.log(`  ${index + 1}. 🏢 ${conv.company_id} | 📄 ${conv.facebook_page_id} | 💬 ${conv.count} محادثة`.white);
      });
    } else {
      console.log('⚠️ لا توجد محادثات للشركة الهدف بعد التحديث'.yellow);
    }
    
    console.log('\n🎉 تم إصلاح ربط المحادثات بنجاح!'.green.bold);
    console.log('💡 يمكنك الآن تحديث الصفحة لرؤية المحادثات'.cyan);
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح ربط المحادثات:'.red, error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

fixConversationsMapping().catch(console.error);
