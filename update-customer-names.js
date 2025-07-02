#!/usr/bin/env node

/**
 * 🏷️ أداة تحديث أسماء العملاء
 * تجلب أسماء العملاء الحقيقية من Facebook API وتحدثها في قاعدة البيانات
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

async function updateCustomerNames() {
  let connection;
  
  try {
    console.log('🏷️ بدء تحديث أسماء العملاء...'.cyan);
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات'.green);
    
    // 1. جلب إعدادات Facebook
    console.log('\n1️⃣ جلب إعدادات Facebook...'.yellow);
    
    const [facebookSettings] = await connection.execute(`
      SELECT page_id, access_token, page_name, company_id 
      FROM facebook_settings 
      WHERE company_id = ? AND is_active = 1
    `, [COMPANY_ID]);
    
    if (!facebookSettings || facebookSettings.length === 0) {
      console.log('❌ لا توجد إعدادات Facebook نشطة'.red);
      return;
    }
    
    console.log(`📄 وجدت ${facebookSettings.length} صفحة Facebook نشطة`.green);
    
    // 2. جلب المحادثات التي تحتاج تحديث أسماء
    console.log('\n2️⃣ جلب المحادثات التي تحتاج تحديث أسماء...'.yellow);
    
    const [conversations] = await connection.execute(`
      SELECT id, user_id, user_name, facebook_page_id, company_id 
      FROM conversations 
      WHERE company_id = ? AND (user_name IS NULL OR user_name = '' OR user_name = 'undefined')
      ORDER BY last_message_at DESC
      LIMIT 20
    `, [COMPANY_ID]);
    
    if (!conversations || conversations.length === 0) {
      console.log('✅ جميع المحادثات لديها أسماء محدثة'.green);
      return;
    }
    
    console.log(`📋 وجدت ${conversations.length} محادثة تحتاج تحديث أسماء`.green);
    
    let totalUpdated = 0;
    let totalErrors = 0;
    
    // 3. معالجة كل صفحة
    for (const pageSettings of facebookSettings) {
      console.log(`\n📄 معالجة صفحة: ${pageSettings.page_name}`.cyan);
      
      const pageConversations = conversations.filter(
        conv => conv.facebook_page_id === pageSettings.page_id
      );
      
      if (pageConversations.length === 0) {
        console.log('   لا توجد محادثات تحتاج تحديث لهذه الصفحة'.gray);
        continue;
      }
      
      console.log(`   وجدت ${pageConversations.length} محادثة تحتاج تحديث`.yellow);
      
      // 4. جلب أسماء المستخدمين من Facebook API
      console.log('   🔍 جلب أسماء المستخدمين من Facebook API...'.cyan);
      
      const userNames = await getFacebookUserNames(
        pageSettings.access_token,
        pageSettings.page_id
      );
      
      console.log(`   👥 تم جلب ${userNames.size} اسم من Facebook API`.green);
      
      // 5. تحديث كل محادثة
      for (const conversation of pageConversations) {
        try {
          let realName = userNames.get(conversation.user_id);
          
          // إذا لم نجد الاسم في المحادثات، جرب API مباشرة
          if (!realName) {
            realName = await getUserNameDirectly(
              conversation.user_id,
              pageSettings.access_token
            );
          }
          
          if (realName && realName !== conversation.user_name) {
            // تحديث الاسم في قاعدة البيانات
            await connection.execute(
              'UPDATE conversations SET user_name = ?, updated_at = NOW() WHERE id = ?',
              [realName, conversation.id]
            );
            
            console.log(`   ✅ تم تحديث: ${conversation.user_name || 'غير معروف'} → ${realName}`.green);
            totalUpdated++;
          } else if (!realName) {
            console.log(`   ⚠️ لم يتم العثور على اسم للمستخدم: ${conversation.user_id}`.yellow);
          } else {
            console.log(`   ℹ️ الاسم محدث بالفعل: ${realName}`.gray);
          }
        } catch (error) {
          console.error(`   ❌ خطأ في تحديث المحادثة ${conversation.id}:`, error.message.red);
          totalErrors++;
        }
      }
    }
    
    // 6. النتائج النهائية
    console.log('\n📊 النتائج النهائية:'.cyan);
    console.log(`✅ تم تحديث ${totalUpdated} اسم بنجاح`.green);
    if (totalErrors > 0) {
      console.log(`❌ حدثت ${totalErrors} أخطاء`.red);
    }
    
    // 7. فحص النتائج
    console.log('\n4️⃣ فحص النتائج...'.yellow);
    
    const [updatedConversations] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN user_name IS NOT NULL AND user_name != '' AND user_name != 'undefined' THEN 1 ELSE 0 END) as with_names,
        SUM(CASE WHEN user_name IS NULL OR user_name = '' OR user_name = 'undefined' THEN 1 ELSE 0 END) as without_names
      FROM conversations 
      WHERE company_id = ?
    `, [COMPANY_ID]);
    
    const stats = updatedConversations[0];
    console.log(`📊 إجمالي المحادثات: ${stats.total}`);
    console.log(`✅ المحادثات مع أسماء: ${stats.with_names}`);
    console.log(`⚠️ المحادثات بدون أسماء: ${stats.without_names}`);
    
    const percentage = ((stats.with_names / stats.total) * 100).toFixed(1);
    console.log(`📈 نسبة المحادثات مع أسماء: ${percentage}%`);
    
  } catch (error) {
    console.error('❌ خطأ عام في تحديث الأسماء:', error.message.red);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// جلب أسماء المستخدمين من Facebook Conversations API
async function getFacebookUserNames(accessToken, pageId) {
  try {
    const userNames = new Map();
    let nextUrl = `https://graph.facebook.com/v18.0/me/conversations?fields=participants&access_token=${accessToken}&limit=100`;
    let pageCount = 0;
    
    while (nextUrl && pageCount < 3) { // حد أقصى 3 صفحات
      pageCount++;
      
      const response = await fetch(nextUrl);
      
      if (!response.ok) {
        console.error(`❌ خطأ في Facebook API: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ خطأ في Facebook API:', data.error.message);
        break;
      }
      
      // استخراج أسماء المستخدمين
      if (data.data) {
        data.data.forEach((conversation) => {
          if (conversation.participants && conversation.participants.data) {
            conversation.participants.data.forEach((participant) => {
              // تجاهل الصفحة نفسها
              if (participant.id !== pageId && participant.name) {
                userNames.set(participant.id, participant.name);
              }
            });
          }
        });
      }
      
      // الانتقال للصفحة التالية
      nextUrl = data.paging?.next || null;
      
      // انتظار قصير لتجنب rate limiting
      if (nextUrl) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return userNames;
  } catch (error) {
    console.error('❌ خطأ في جلب أسماء المستخدمين:', error);
    return new Map();
  }
}

// الحصول على اسم المستخدم مباشرة من Facebook API
async function getUserNameDirectly(userId, accessToken) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${userId}?fields=name&access_token=${accessToken}`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.error || !data.name) {
      return null;
    }
    
    return data.name;
  } catch (error) {
    console.error(`❌ خطأ في الحصول على اسم المستخدم ${userId}:`, error);
    return null;
  }
}

// تشغيل التحديث
updateCustomerNames()
  .then(() => {
    console.log('\n✅ انتهى تحديث أسماء العملاء'.green);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ خطأ عام:', error.message.red);
    process.exit(1);
  });
