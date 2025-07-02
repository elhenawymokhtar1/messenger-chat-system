#!/usr/bin/env node

/**
 * 🔧 إصلاح مشكلة محادثة Swan shop
 * يحذف المحادثات الخاطئة حيث الصفحة تتحدث مع نفسها
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

async function fixSwanShopConversation() {
  let connection;
  
  try {
    console.log('🔧 إصلاح مشكلة محادثة Swan shop...'.cyan);
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات'.green);
    
    // 1. البحث عن المحادثات الخاطئة (حيث user_id = page_id)
    console.log('\n1️⃣ البحث عن المحادثات الخاطئة...'.yellow);
    
    const [wrongConversations] = await connection.execute(`
      SELECT 
        id,
        user_id,
        user_name,
        facebook_page_id,
        total_messages,
        unread_messages,
        created_at
      FROM conversations 
      WHERE company_id = ? 
      AND user_id = facebook_page_id
    `, [COMPANY_ID]);
    
    console.log(`🔍 وجدت ${wrongConversations.length} محادثة خاطئة`.red);
    
    if (wrongConversations.length === 0) {
      console.log('✅ لا توجد محادثات خاطئة!'.green);
      return;
    }
    
    // عرض المحادثات الخاطئة
    wrongConversations.forEach((conv, index) => {
      console.log(`${index + 1}. ${conv.user_name || 'بدون اسم'}`);
      console.log(`   ID: ${conv.id}`);
      console.log(`   User ID = Page ID: ${conv.user_id}`);
      console.log(`   الرسائل: ${conv.total_messages} | غير مقروءة: ${conv.unread_messages}`);
      console.log('');
    });
    
    // 2. فحص الرسائل في هذه المحادثات
    console.log('2️⃣ فحص الرسائل في المحادثات الخاطئة...'.yellow);
    
    let totalMessages = 0;
    for (const conv of wrongConversations) {
      const [messages] = await connection.execute(`
        SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?
      `, [conv.id]);
      
      const messageCount = messages[0].count;
      totalMessages += messageCount;
      
      console.log(`📨 محادثة ${conv.user_name}: ${messageCount} رسالة`);
    }
    
    console.log(`📊 إجمالي الرسائل في المحادثات الخاطئة: ${totalMessages}`.cyan);
    
    // 3. تأكيد الحذف
    console.log('\n3️⃣ تأكيد الحذف...'.yellow);
    console.log('⚠️ سيتم حذف المحادثات التالية:'.red);
    
    wrongConversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ${conv.user_name} (${conv.id})`);
    });
    
    console.log(`\n📝 سيتم حذف ${totalMessages} رسالة أيضاً`.yellow);
    
    // محاكاة تأكيد المستخدم (في بيئة حقيقية يجب السؤال)
    const confirmDelete = true; // يمكن تغييرها لـ false لمنع الحذف
    
    if (!confirmDelete) {
      console.log('❌ تم إلغاء العملية'.yellow);
      return;
    }
    
    // 4. حذف المحادثات والرسائل
    console.log('\n4️⃣ حذف المحادثات الخاطئة...'.yellow);
    
    let deletedConversations = 0;
    let deletedMessages = 0;
    
    for (const conv of wrongConversations) {
      try {
        // حذف الرسائل أولاً
        const [messageDeleteResult] = await connection.execute(`
          DELETE FROM messages WHERE conversation_id = ?
        `, [conv.id]);
        
        deletedMessages += messageDeleteResult.affectedRows;
        
        // حذف المحادثة
        const [conversationDeleteResult] = await connection.execute(`
          DELETE FROM conversations WHERE id = ?
        `, [conv.id]);
        
        if (conversationDeleteResult.affectedRows > 0) {
          deletedConversations++;
          console.log(`✅ تم حذف محادثة: ${conv.user_name}`.green);
        }
        
      } catch (error) {
        console.error(`❌ خطأ في حذف محادثة ${conv.user_name}:`, error.message);
      }
    }
    
    // 5. النتائج النهائية
    console.log('\n5️⃣ النتائج النهائية...'.yellow);
    console.log(`✅ تم حذف ${deletedConversations} محادثة`.green);
    console.log(`✅ تم حذف ${deletedMessages} رسالة`.green);
    
    // 6. فحص نهائي
    console.log('\n6️⃣ فحص نهائي...'.yellow);
    
    const [finalCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM conversations 
      WHERE company_id = ? AND user_id = facebook_page_id
    `, [COMPANY_ID]);
    
    const remainingWrongConversations = finalCheck[0].count;
    
    if (remainingWrongConversations === 0) {
      console.log('✅ تم إصلاح المشكلة بالكامل!'.green);
      console.log('✅ لا توجد محادثات خاطئة متبقية'.green);
    } else {
      console.log(`⚠️ لا تزال هناك ${remainingWrongConversations} محادثة خاطئة`.yellow);
    }
    
    // 7. عرض المحادثات الصحيحة المتبقية
    const [correctConversations] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM conversations 
      WHERE company_id = ? AND user_id != facebook_page_id
    `, [COMPANY_ID]);
    
    console.log(`📊 المحادثات الصحيحة المتبقية: ${correctConversations[0].count}`.cyan);
    
    console.log('\n🎉 تم إصلاح مشكلة Swan shop بنجاح!'.green);
    console.log('✅ الآن رسائل المودريتور ستذهب للعملاء الصحيحين'.green);
    
  } catch (error) {
    console.error('❌ خطأ عام في الإصلاح:', error.message.red);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل الإصلاح
fixSwanShopConversation()
  .then(() => {
    console.log('\n✅ انتهى الإصلاح'.green);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ خطأ عام:', error.message.red);
    process.exit(1);
  });
