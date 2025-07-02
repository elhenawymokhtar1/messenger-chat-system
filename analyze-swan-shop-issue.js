#!/usr/bin/env node

/**
 * 🔍 تحليل مشكلة محادثة Swan shop
 * يفحص لماذا تظهر رسائل المودريتور كمحادثة منفصلة
 */

import mysql from 'mysql2/promise';
import colors from 'colors';

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
const SWAN_SHOP_PAGE_ID = '260345600493273';

async function analyzeSwanShopIssue() {
  let connection;
  
  try {
    console.log('🔍 تحليل مشكلة محادثة Swan shop...'.cyan);
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات'.green);
    
    // 1. فحص محادثة Swan shop
    console.log('\n1️⃣ فحص محادثة Swan shop...'.yellow);
    
    const [swanShopConversation] = await connection.execute(`
      SELECT 
        id,
        user_id,
        user_name,
        facebook_page_id,
        total_messages,
        unread_messages,
        last_message_at,
        created_at
      FROM conversations 
      WHERE company_id = ? AND user_name = 'Swan shop'
    `, [COMPANY_ID]);
    
    if (swanShopConversation.length > 0) {
      const conv = swanShopConversation[0];
      console.log('📋 محادثة Swan shop:'.cyan);
      console.log(`   ID: ${conv.id}`);
      console.log(`   User ID: ${conv.user_id}`);
      console.log(`   Page ID: ${conv.facebook_page_id}`);
      console.log(`   إجمالي الرسائل: ${conv.total_messages}`);
      console.log(`   الرسائل غير المقروءة: ${conv.unread_messages}`);
      console.log(`   آخر رسالة: ${conv.last_message_at}`);
      
      // 2. فحص رسائل هذه المحادثة
      console.log('\n2️⃣ فحص رسائل محادثة Swan shop...'.yellow);
      
      const [messages] = await connection.execute(`
        SELECT 
          id,
          sender_id,
          recipient_id,
          message_text,
          direction,
          facebook_message_id,
          sent_at,
          created_at
        FROM messages 
        WHERE conversation_id = ?
        ORDER BY sent_at DESC
        LIMIT 10
      `, [conv.id]);
      
      console.log(`📨 عدد الرسائل: ${messages.length}`);
      
      if (messages.length > 0) {
        console.log('\n📋 آخر 5 رسائل:'.cyan);
        messages.slice(0, 5).forEach((msg, index) => {
          console.log(`${index + 1}. ${msg.direction.toUpperCase()}: "${msg.message_text?.substring(0, 50)}..."`);
          console.log(`   من: ${msg.sender_id} → إلى: ${msg.recipient_id}`);
          console.log(`   وقت الإرسال: ${msg.sent_at}`);
          console.log(`   Facebook ID: ${msg.facebook_message_id || 'غير محدد'}`);
          console.log('');
        });
      }
      
      // 3. تحليل اتجاه الرسائل
      const [messageStats] = await connection.execute(`
        SELECT 
          direction,
          COUNT(*) as count,
          MIN(sent_at) as first_message,
          MAX(sent_at) as last_message
        FROM messages 
        WHERE conversation_id = ?
        GROUP BY direction
      `, [conv.id]);
      
      console.log('📊 إحصائيات الرسائل:'.cyan);
      messageStats.forEach(stat => {
        console.log(`   ${stat.direction}: ${stat.count} رسالة`);
        console.log(`   من ${stat.first_message} إلى ${stat.last_message}`);
      });
      
    } else {
      console.log('❌ لم يتم العثور على محادثة Swan shop'.red);
    }
    
    // 4. فحص جميع المحادثات للصفحة
    console.log('\n3️⃣ فحص جميع المحادثات للصفحة...'.yellow);
    
    const [allPageConversations] = await connection.execute(`
      SELECT 
        id,
        user_id,
        user_name,
        total_messages,
        unread_messages,
        last_message_at
      FROM conversations 
      WHERE company_id = ? AND facebook_page_id = ?
      ORDER BY last_message_at DESC
    `, [COMPANY_ID, SWAN_SHOP_PAGE_ID]);
    
    console.log(`📊 عدد المحادثات للصفحة: ${allPageConversations.length}`);
    
    allPageConversations.forEach((conv, index) => {
      const isPageItself = conv.user_id === SWAN_SHOP_PAGE_ID;
      const indicator = isPageItself ? '🏪 (الصفحة نفسها)' : '👤 (عميل)';
      
      console.log(`${index + 1}. ${conv.user_name || 'بدون اسم'} ${indicator}`);
      console.log(`   User ID: ${conv.user_id}`);
      console.log(`   الرسائل: ${conv.total_messages} | غير مقروءة: ${conv.unread_messages}`);
      console.log(`   آخر رسالة: ${conv.last_message_at || 'لا توجد'}`);
      console.log('');
    });
    
    // 5. فحص الرسائل الصادرة الأخيرة
    console.log('\n4️⃣ فحص الرسائل الصادرة الأخيرة...'.yellow);
    
    const [outgoingMessages] = await connection.execute(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.recipient_id,
        m.message_text,
        m.direction,
        m.sent_at,
        c.user_name,
        c.user_id as conversation_user_id
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.company_id = ? 
      AND c.facebook_page_id = ?
      AND m.direction = 'outgoing'
      ORDER BY m.sent_at DESC
      LIMIT 10
    `, [COMPANY_ID, SWAN_SHOP_PAGE_ID]);
    
    console.log(`📤 عدد الرسائل الصادرة الأخيرة: ${outgoingMessages.length}`);
    
    if (outgoingMessages.length > 0) {
      console.log('\n📋 آخر 5 رسائل صادرة:'.cyan);
      outgoingMessages.slice(0, 5).forEach((msg, index) => {
        const isToPageItself = msg.conversation_user_id === SWAN_SHOP_PAGE_ID;
        const indicator = isToPageItself ? '❌ (للصفحة نفسها!)' : '✅ (لعميل)';
        
        console.log(`${index + 1}. "${msg.message_text?.substring(0, 50)}..." ${indicator}`);
        console.log(`   المحادثة: ${msg.user_name || 'بدون اسم'} (${msg.conversation_user_id})`);
        console.log(`   من: ${msg.sender_id} → إلى: ${msg.recipient_id}`);
        console.log(`   وقت الإرسال: ${msg.sent_at}`);
        console.log('');
      });
    }
    
    // 6. اقتراح الحل
    console.log('\n5️⃣ تشخيص المشكلة والحل...'.yellow);
    
    const pageConversations = allPageConversations.filter(conv => conv.user_id === SWAN_SHOP_PAGE_ID);
    const customerConversations = allPageConversations.filter(conv => conv.user_id !== SWAN_SHOP_PAGE_ID);
    
    console.log('🔍 التشخيص:'.cyan);
    console.log(`   محادثات الصفحة نفسها: ${pageConversations.length} (يجب حذفها)`);
    console.log(`   محادثات العملاء: ${customerConversations.length} (صحيحة)`);
    
    if (pageConversations.length > 0) {
      console.log('\n⚠️ المشكلة المكتشفة:'.red);
      console.log('   - توجد محادثات حيث user_id = page_id');
      console.log('   - هذا يعني أن الصفحة تتحدث مع نفسها');
      console.log('   - رسائل المودريتور تذهب لمحادثة الصفحة بدلاً من العميل');
      
      console.log('\n💡 الحل المقترح:'.green);
      console.log('   1. حذف المحادثات حيث user_id = page_id');
      console.log('   2. إصلاح منطق توجيه الرسائل الصادرة');
      console.log('   3. التأكد من أن الرسائل تذهب للعميل الصحيح');
      
      // عرض SQL للحل
      console.log('\n🔧 SQL للحل:'.cyan);
      pageConversations.forEach(conv => {
        console.log(`   DELETE FROM conversations WHERE id = '${conv.id}';`);
      });
    } else {
      console.log('✅ لا توجد مشكلة في تصنيف المحادثات'.green);
    }
    
  } catch (error) {
    console.error('❌ خطأ عام في التحليل:', error.message.red);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل التحليل
analyzeSwanShopIssue()
  .then(() => {
    console.log('\n✅ انتهى التحليل'.green);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ خطأ عام:', error.message.red);
    process.exit(1);
  });
