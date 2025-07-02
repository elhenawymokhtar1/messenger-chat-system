#!/usr/bin/env node

/**
 * 🗑️ حذف المحادثة الخاطئة فوراً
 * يحذف المحادثة التي تم إنشاؤها خطأ حيث user_id = page_id
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
const WRONG_CONVERSATION_ID = '52d8b750-e8e5-47de-836d-2a865ba52d24';

async function deleteWrongConversationNow() {
  let connection;
  
  try {
    console.log('🗑️ حذف المحادثة الخاطئة فوراً...'.cyan);
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات'.green);
    
    // 1. فحص المحادثة المستهدفة
    console.log('\n1️⃣ فحص المحادثة المستهدفة...'.yellow);
    
    const [targetConversation] = await connection.execute(`
      SELECT 
        id,
        user_id,
        user_name,
        facebook_page_id,
        total_messages,
        unread_messages,
        created_at
      FROM conversations 
      WHERE id = ?
    `, [WRONG_CONVERSATION_ID]);
    
    if (targetConversation.length === 0) {
      console.log('✅ المحادثة غير موجودة (تم حذفها مسبقاً)'.green);
      return;
    }
    
    const conv = targetConversation[0];
    console.log('📋 المحادثة المستهدفة:'.cyan);
    console.log(`   ID: ${conv.id}`);
    console.log(`   User ID: ${conv.user_id}`);
    console.log(`   Page ID: ${conv.facebook_page_id}`);
    console.log(`   الاسم: ${conv.user_name || 'بدون اسم'}`);
    console.log(`   الرسائل: ${conv.total_messages} | غير مقروءة: ${conv.unread_messages}`);
    
    // التحقق من أنها محادثة خاطئة
    if (conv.user_id !== conv.facebook_page_id) {
      console.log('⚠️ هذه ليست محادثة خاطئة! تم إيقاف العملية'.yellow);
      return;
    }
    
    console.log('✅ تأكيد: هذه محادثة خاطئة (user_id = page_id)'.red);
    
    // 2. حذف الرسائل أولاً
    console.log('\n2️⃣ حذف الرسائل...'.yellow);
    
    const [messageDeleteResult] = await connection.execute(`
      DELETE FROM messages WHERE conversation_id = ?
    `, [WRONG_CONVERSATION_ID]);
    
    console.log(`✅ تم حذف ${messageDeleteResult.affectedRows} رسالة`.green);
    
    // 3. حذف المحادثة
    console.log('\n3️⃣ حذف المحادثة...'.yellow);
    
    const [conversationDeleteResult] = await connection.execute(`
      DELETE FROM conversations WHERE id = ?
    `, [WRONG_CONVERSATION_ID]);
    
    if (conversationDeleteResult.affectedRows > 0) {
      console.log('✅ تم حذف المحادثة بنجاح!'.green);
    } else {
      console.log('❌ فشل في حذف المحادثة'.red);
    }
    
    // 4. فحص نهائي
    console.log('\n4️⃣ فحص نهائي...'.yellow);
    
    const [finalCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM conversations 
      WHERE company_id = ? AND user_id = facebook_page_id
    `, [COMPANY_ID]);
    
    const remainingWrongConversations = finalCheck[0].count;
    
    if (remainingWrongConversations === 0) {
      console.log('🎉 ممتاز! لا توجد محادثات خاطئة متبقية'.green);
    } else {
      console.log(`⚠️ لا تزال هناك ${remainingWrongConversations} محادثة خاطئة`.yellow);
    }
    
    // 5. عرض الإحصائيات النهائية
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT user_id) as unique_users
      FROM conversations 
      WHERE company_id = ?
    `, [COMPANY_ID]);
    
    console.log(`📊 الإحصائيات النهائية:`.cyan);
    console.log(`   إجمالي المحادثات: ${stats[0].total}`);
    console.log(`   المستخدمون الفريدون: ${stats[0].unique_users}`);
    
    console.log('\n🎉 تم حذف المحادثة الخاطئة بنجاح!'.green);
    
  } catch (error) {
    console.error('❌ خطأ عام في الحذف:', error.message.red);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل الحذف
deleteWrongConversationNow()
  .then(() => {
    console.log('\n✅ انتهى الحذف'.green);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ خطأ عام:', error.message.red);
    process.exit(1);
  });
