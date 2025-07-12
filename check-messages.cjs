/**
 * فحص الرسائل في قاعدة البيانات
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

async function checkMessages() {
  let connection;
  
  try {
    console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
    connection = await mysql.createConnection(dbConfig);
    
    const targetCompany = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    
    console.log('\n💬 فحص الرسائل...'.blue.bold);
    
    // فحص جميع الرسائل
    const [allMessages] = await connection.execute(`
      SELECT m.*, c.company_id, c.facebook_page_id 
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 20
    `);
    
    console.log('📋 آخر 20 رسالة:'.cyan);
    allMessages.forEach((msg, index) => {
      const direction = msg.is_from_page ? '📤' : '📥';
      const text = msg.message_text ? msg.message_text.substring(0, 50) + '...' : 'لا يوجد نص';
      console.log(`  ${index + 1}. ${direction} ${msg.sender_name || 'غير محدد'}: ${text}`.white);
      console.log(`      🏢 ${msg.company_id} | 📄 ${msg.facebook_page_id} | 💬 ${msg.conversation_id}`.gray);
    });
    
    // فحص الرسائل للشركة الهدف
    const [companyMessages] = await connection.execute(`
      SELECT m.*, c.facebook_page_id 
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.company_id = ?
      ORDER BY m.created_at DESC
    `, [targetCompany]);
    
    console.log(`\n📊 رسائل الشركة ${targetCompany}:`.blue);
    if (companyMessages.length > 0) {
      console.log(`✅ عدد الرسائل: ${companyMessages.length}`.green);
      
      companyMessages.forEach((msg, index) => {
        const direction = msg.is_from_page ? '📤' : '📥';
        const text = msg.message_text ? msg.message_text.substring(0, 50) + '...' : 'لا يوجد نص';
        console.log(`  ${index + 1}. ${direction} ${msg.sender_name || 'غير محدد'}: ${text}`.white);
        console.log(`      📄 ${msg.facebook_page_id} | 💬 ${msg.conversation_id}`.gray);
      });
    } else {
      console.log('❌ لا توجد رسائل للشركة الهدف'.red);
    }
    
    // فحص محادثة محددة
    const testConversationId = 'conv_1751935287534_1';
    console.log(`\n🔍 فحص المحادثة ${testConversationId}:`.blue);
    
    const [conversationMessages] = await connection.execute(`
      SELECT * FROM messages 
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `, [testConversationId]);
    
    if (conversationMessages.length > 0) {
      console.log(`✅ عدد الرسائل في المحادثة: ${conversationMessages.length}`.green);
      
      conversationMessages.forEach((msg, index) => {
        const direction = msg.is_from_page ? '📤' : '📥';
        const text = msg.message_text || 'لا يوجد نص';
        console.log(`  ${index + 1}. ${direction} ${msg.sender_name || 'غير محدد'}: ${text}`.white);
        console.log(`      🕐 ${msg.created_at}`.gray);
      });
    } else {
      console.log('❌ لا توجد رسائل في هذه المحادثة'.red);
      
      // فحص إذا كانت المحادثة موجودة
      const [conversationExists] = await connection.execute(`
        SELECT * FROM conversations WHERE id = ?
      `, [testConversationId]);
      
      if (conversationExists.length > 0) {
        console.log('✅ المحادثة موجودة لكن لا توجد رسائل'.yellow);
        console.log(`   🏢 ${conversationExists[0].company_id}`.gray);
        console.log(`   📄 ${conversationExists[0].facebook_page_id}`.gray);
        console.log(`   👤 ${conversationExists[0].participant_name}`.gray);
      } else {
        console.log('❌ المحادثة غير موجودة'.red);
      }
    }
    
    // إنشاء رسائل تجريبية إذا لم توجد
    if (companyMessages.length === 0) {
      console.log('\n🔧 إنشاء رسائل تجريبية...'.blue);
      
      const [conversations] = await connection.execute(`
        SELECT id, participant_name FROM conversations 
        WHERE company_id = ? 
        LIMIT 3
      `, [targetCompany]);
      
      for (const conv of conversations) {
        // رسالة من العميل
        await connection.execute(`
          INSERT INTO messages (
            id, conversation_id, sender_id, sender_name, 
            message_text, message_type, is_from_page, created_at
          ) VALUES (
            CONCAT('msg_', UNIX_TIMESTAMP(), '_', ?), ?, 
            CONCAT('customer_', ?), ?, 
            'مرحباً، أحتاج مساعدة في منتجاتكم', 'text', 0, NOW()
          )
        `, [conv.id.split('_')[2], conv.id, conv.id.split('_')[2], conv.participant_name]);
        
        // رسالة من الصفحة
        await connection.execute(`
          INSERT INTO messages (
            id, conversation_id, sender_id, sender_name, 
            message_text, message_type, is_from_page, created_at
          ) VALUES (
            CONCAT('msg_reply_', UNIX_TIMESTAMP(), '_', ?), ?, 
            'page_admin', 'فريق الدعم', 
            'مرحباً بك! سنقوم بالرد عليك في أقرب وقت ممكن', 'text', 1, NOW()
          )
        `, [conv.id.split('_')[2], conv.id]);
        
        console.log(`✅ تم إنشاء رسائل للمحادثة ${conv.id}`.green);
      }
      
      console.log('🎉 تم إنشاء الرسائل التجريبية بنجاح!'.green.bold);
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص الرسائل:'.red, error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

checkMessages().catch(console.error);
