/**
 * عد المحادثات الإجمالي في قاعدة البيانات
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

async function countConversations() {
  let connection;
  
  try {
    console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
    connection = await mysql.createConnection(dbConfig);
    
    console.log('\n📊 إحصائيات المحادثات...'.blue.bold);
    
    // العدد الإجمالي للمحادثات
    const [totalCount] = await connection.execute('SELECT COUNT(*) as count FROM conversations');
    console.log(`📋 إجمالي المحادثات في قاعدة البيانات: ${totalCount[0].count}`.white);
    
    // المحادثات حسب الشركة
    const [byCompany] = await connection.execute(`
      SELECT company_id, COUNT(*) as count 
      FROM conversations 
      GROUP BY company_id 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 المحادثات حسب الشركة:'.cyan);
    byCompany.forEach((comp, index) => {
      const companyName = comp.company_id === 'c677b32f-fe1c-4c64-8362-a1c03406608d' ? '(الشركة الهدف)' : '';
      console.log(`  ${index + 1}. 🏢 ${comp.company_id} ${companyName}: ${comp.count} محادثة`.white);
    });
    
    // المحادثات حسب الصفحة
    const [byPage] = await connection.execute(`
      SELECT facebook_page_id, COUNT(*) as count 
      FROM conversations 
      GROUP BY facebook_page_id 
      ORDER BY count DESC
    `);
    
    console.log('\n📄 المحادثات حسب الصفحة:'.cyan);
    byPage.forEach((page, index) => {
      console.log(`  ${index + 1}. 📄 ${page.facebook_page_id}: ${page.count} محادثة`.white);
    });
    
    // المحادثات للشركة الهدف
    const targetCompany = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    const [targetCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM conversations WHERE company_id = ?
    `, [targetCompany]);
    
    console.log(`\n🎯 محادثات الشركة الهدف (${targetCompany}): ${targetCount[0].count}`.green.bold);
    
    // تفاصيل المحادثات للشركة الهدف
    const [targetDetails] = await connection.execute(`
      SELECT id, facebook_page_id, participant_name, created_at 
      FROM conversations 
      WHERE company_id = ? 
      ORDER BY created_at DESC
    `, [targetCompany]);
    
    if (targetDetails.length > 0) {
      console.log('\n📋 تفاصيل المحادثات:'.cyan);
      targetDetails.forEach((conv, index) => {
        console.log(`  ${index + 1}. 💬 ${conv.id}`.white);
        console.log(`      👤 ${conv.participant_name}`.gray);
        console.log(`      📄 ${conv.facebook_page_id}`.gray);
        console.log(`      📅 ${conv.created_at}`.gray);
      });
    }
    
    // عد الرسائل
    const [messagesCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.company_id = ?
    `, [targetCompany]);
    
    console.log(`\n💬 إجمالي الرسائل للشركة الهدف: ${messagesCount[0].count}`.green);
    
    // المحادثات المؤرشفة
    const [archivedCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM conversations 
      WHERE company_id = ? AND is_archived = 1
    `, [targetCompany]);
    
    console.log(`📦 المحادثات المؤرشفة: ${archivedCount[0].count}`.yellow);
    
    // المحادثات النشطة
    const [activeCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM conversations 
      WHERE company_id = ? AND is_archived = 0
    `, [targetCompany]);
    
    console.log(`🟢 المحادثات النشطة: ${activeCount[0].count}`.green);
    
  } catch (error) {
    console.error('❌ خطأ في عد المحادثات:'.red, error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

countConversations().catch(console.error);
