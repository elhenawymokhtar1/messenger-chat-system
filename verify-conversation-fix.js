#!/usr/bin/env node

/**
 * ✅ التحقق من إصلاح مشكلة المحادثات
 * يتأكد من عدم وجود محادثات خاطئة حيث user_id = page_id
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

async function verifyConversationFix() {
  let connection;
  
  try {
    console.log('✅ التحقق من إصلاح مشكلة المحادثات...'.cyan);
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات'.green);
    
    // 1. فحص المحادثات الخاطئة (حيث user_id = page_id)
    console.log('\n1️⃣ فحص المحادثات الخاطئة...'.yellow);
    
    const [wrongConversations] = await connection.execute(`
      SELECT 
        id,
        user_id,
        user_name,
        facebook_page_id,
        total_messages,
        unread_messages
      FROM conversations 
      WHERE company_id = ? 
      AND user_id = facebook_page_id
    `, [COMPANY_ID]);
    
    if (wrongConversations.length === 0) {
      console.log('✅ ممتاز! لا توجد محادثات خاطئة'.green);
    } else {
      console.log(`❌ لا تزال هناك ${wrongConversations.length} محادثة خاطئة:`.red);
      wrongConversations.forEach((conv, index) => {
        console.log(`${index + 1}. ${conv.user_name} (${conv.user_id})`);
      });
    }
    
    // 2. فحص جميع المحادثات الصحيحة
    console.log('\n2️⃣ فحص المحادثات الصحيحة...'.yellow);
    
    const [correctConversations] = await connection.execute(`
      SELECT 
        id,
        user_id,
        user_name,
        facebook_page_id,
        total_messages,
        unread_messages,
        last_message_at
      FROM conversations 
      WHERE company_id = ? 
      AND user_id != facebook_page_id
      ORDER BY last_message_at DESC
    `, [COMPANY_ID]);
    
    console.log(`📊 عدد المحادثات الصحيحة: ${correctConversations.length}`.green);
    
    if (correctConversations.length > 0) {
      console.log('\n📋 أول 10 محادثات صحيحة:'.cyan);
      correctConversations.slice(0, 10).forEach((conv, index) => {
        console.log(`${index + 1}. ${conv.user_name || 'بدون اسم'}`);
        console.log(`   User ID: ${conv.user_id}`);
        console.log(`   Page ID: ${conv.facebook_page_id}`);
        console.log(`   الرسائل: ${conv.total_messages} | غير مقروءة: ${conv.unread_messages}`);
        console.log(`   آخر رسالة: ${conv.last_message_at || 'لا توجد'}`);
        console.log('');
      });
    }
    
    // 3. فحص الصفحات المختلفة
    console.log('\n3️⃣ فحص الصفحات المختلفة...'.yellow);
    
    const [pageStats] = await connection.execute(`
      SELECT 
        facebook_page_id,
        COUNT(*) as conversation_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM conversations 
      WHERE company_id = ?
      GROUP BY facebook_page_id
    `, [COMPANY_ID]);
    
    console.log('📊 إحصائيات الصفحات:'.cyan);
    pageStats.forEach((page, index) => {
      console.log(`${index + 1}. Page ID: ${page.facebook_page_id}`);
      console.log(`   المحادثات: ${page.conversation_count}`);
      console.log(`   المستخدمون الفريدون: ${page.unique_users}`);
      console.log('');
    });
    
    // 4. فحص أسماء العملاء
    console.log('\n4️⃣ فحص أسماء العملاء...'.yellow);
    
    const [nameStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN user_name IS NOT NULL AND user_name != '' AND user_name != 'undefined' AND user_name != 'null' THEN 1 ELSE 0 END) as with_names,
        SUM(CASE WHEN user_name IS NULL OR user_name = '' OR user_name = 'undefined' OR user_name = 'null' THEN 1 ELSE 0 END) as without_names
      FROM conversations 
      WHERE company_id = ?
    `, [COMPANY_ID]);
    
    const stats = nameStats[0];
    const percentage = ((stats.with_names / stats.total) * 100).toFixed(1);
    
    console.log(`📊 إحصائيات الأسماء:`.cyan);
    console.log(`   إجمالي المحادثات: ${stats.total}`);
    console.log(`   ✅ مع أسماء: ${stats.with_names}`);
    console.log(`   ❌ بدون أسماء: ${stats.without_names}`);
    console.log(`   📈 نسبة الأسماء: ${percentage}%`);
    
    // 5. فحص الرسائل الأخيرة
    console.log('\n5️⃣ فحص الرسائل الأخيرة...'.yellow);
    
    const [recentMessages] = await connection.execute(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.recipient_id,
        m.message_text,
        m.direction,
        m.sent_at,
        c.user_name,
        c.user_id as conversation_user_id,
        c.facebook_page_id
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.company_id = ?
      ORDER BY m.sent_at DESC
      LIMIT 5
    `, [COMPANY_ID]);
    
    console.log(`📨 آخر 5 رسائل:`.cyan);
    recentMessages.forEach((msg, index) => {
      const isCorrect = msg.conversation_user_id !== msg.facebook_page_id;
      const indicator = isCorrect ? '✅' : '❌';
      
      console.log(`${index + 1}. ${indicator} ${msg.direction.toUpperCase()}: "${msg.message_text?.substring(0, 30)}..."`);
      console.log(`   المحادثة: ${msg.user_name || 'بدون اسم'} (${msg.conversation_user_id})`);
      console.log(`   من: ${msg.sender_id} → إلى: ${msg.recipient_id}`);
      console.log(`   وقت الإرسال: ${msg.sent_at}`);
      console.log('');
    });
    
    // 6. النتيجة النهائية
    console.log('\n6️⃣ النتيجة النهائية...'.yellow);
    
    if (wrongConversations.length === 0) {
      console.log('🎉 تم إصلاح المشكلة بالكامل!'.green);
      console.log('✅ لا توجد محادثات خاطئة حيث user_id = page_id'.green);
      console.log('✅ جميع المحادثات تنتمي لعملاء حقيقيين'.green);
      console.log(`✅ ${correctConversations.length} محادثة صحيحة`.green);
      console.log(`✅ ${percentage}% من المحادثات لها أسماء`.green);
    } else {
      console.log('⚠️ لا تزال هناك مشاكل تحتاج إصلاح'.yellow);
      console.log(`❌ ${wrongConversations.length} محادثة خاطئة`.red);
    }
    
    console.log('\n🚀 الآن رسائل المودريتور ستذهب للعملاء الصحيحين!'.green);
    
  } catch (error) {
    console.error('❌ خطأ عام في التحقق:', error.message.red);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل التحقق
verifyConversationFix()
  .then(() => {
    console.log('\n✅ انتهى التحقق'.green);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ خطأ عام:', error.message.red);
    process.exit(1);
  });
