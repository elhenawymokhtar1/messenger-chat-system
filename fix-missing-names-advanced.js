#!/usr/bin/env node

/**
 * 🔧 إصلاح متقدم للأسماء المفقودة
 * يستخدم طرق متعددة للحصول على أسماء العملاء
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

async function fixMissingNamesAdvanced() {
  let connection;
  
  try {
    console.log('🔧 إصلاح متقدم للأسماء المفقودة...'.cyan);
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات'.green);
    
    // 1. جلب المحادثات بدون أسماء
    console.log('\n1️⃣ جلب المحادثات بدون أسماء...'.yellow);
    
    const [conversationsWithoutNames] = await connection.execute(`
      SELECT id, user_id, user_name, facebook_page_id, last_message_at
      FROM conversations 
      WHERE company_id = ? 
      AND user_id IS NOT NULL 
      AND user_id != ''
      AND (user_name IS NULL OR user_name = '' OR user_name = 'undefined' OR user_name = 'null')
      ORDER BY last_message_at DESC
      LIMIT 15
    `, [COMPANY_ID]);
    
    console.log(`📋 وجدت ${conversationsWithoutNames.length} محادثة بدون أسماء`.green);
    
    if (conversationsWithoutNames.length === 0) {
      console.log('✅ جميع المحادثات لديها أسماء!'.green);
      return;
    }
    
    // 2. جلب إعدادات Facebook
    const [facebookSettings] = await connection.execute(`
      SELECT page_id, page_name, access_token, is_active 
      FROM facebook_settings 
      WHERE company_id = ? AND is_active = 1
    `, [COMPANY_ID]);
    
    if (!facebookSettings || facebookSettings.length === 0) {
      console.log('❌ لا توجد إعدادات Facebook نشطة'.red);
      return;
    }
    
    let totalFixed = 0;
    let totalFailed = 0;
    
    // 3. معالجة كل صفحة
    for (const page of facebookSettings) {
      console.log(`\n📄 معالجة صفحة: ${page.page_name}`.cyan);
      
      const pageConversations = conversationsWithoutNames.filter(
        conv => conv.facebook_page_id === page.page_id
      );
      
      if (pageConversations.length === 0) {
        console.log('   لا توجد محادثات بدون أسماء لهذه الصفحة'.gray);
        continue;
      }
      
      console.log(`   وجدت ${pageConversations.length} محادثة تحتاج إصلاح`.yellow);
      
      // 4. جلب جميع أسماء المستخدمين من Facebook API
      console.log('   🔍 جلب أسماء المستخدمين من Facebook API...'.cyan);
      const allUserNames = await getAllUserNamesFromFacebook(page.access_token, page.page_id);
      console.log(`   👥 تم جلب ${allUserNames.size} اسم من Facebook API`.green);
      
      // 5. معالجة كل محادثة
      for (const conv of pageConversations) {
        try {
          let realName = null;
          
          // الطريقة 1: البحث في الأسماء المجلبة
          realName = allUserNames.get(conv.user_id);
          
          // الطريقة 2: API مباشر
          if (!realName) {
            realName = await getUserNameDirectly(conv.user_id, page.access_token);
          }
          
          // الطريقة 3: البحث في المحادثات الحديثة
          if (!realName) {
            realName = await searchInRecentConversations(conv.user_id, page.access_token);
          }
          
          // الطريقة 4: اسم افتراضي ذكي
          if (!realName) {
            realName = generateSmartDefaultName(conv.user_id, conv.last_message_at);
          }
          
          // تحديث قاعدة البيانات
          if (realName) {
            await connection.execute(
              'UPDATE conversations SET user_name = ?, updated_at = NOW() WHERE id = ?',
              [realName, conv.id]
            );
            
            console.log(`   ✅ تم إصلاح: ${conv.user_id.slice(-6)} → ${realName}`.green);
            totalFixed++;
          } else {
            console.log(`   ❌ فشل في إصلاح: ${conv.user_id}`.red);
            totalFailed++;
          }
          
          // انتظار قصير لتجنب rate limiting
          await new Promise(resolve => setTimeout(resolve, 800));
          
        } catch (error) {
          console.error(`   ❌ خطأ في معالجة ${conv.user_id}:`, error.message);
          totalFailed++;
        }
      }
    }
    
    // 6. النتائج النهائية
    console.log('\n📊 النتائج النهائية:'.cyan);
    console.log(`✅ تم إصلاح: ${totalFixed} اسم`.green);
    console.log(`❌ فشل في: ${totalFailed} اسم`.red);
    
    // 7. فحص نهائي
    const [finalCheck] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN user_name IS NOT NULL AND user_name != '' AND user_name != 'undefined' AND user_name != 'null' THEN 1 ELSE 0 END) as with_names
      FROM conversations 
      WHERE company_id = ?
    `, [COMPANY_ID]);
    
    const final = finalCheck[0];
    const percentage = ((final.with_names / final.total) * 100).toFixed(1);
    
    console.log(`\n📈 النسبة النهائية: ${percentage}% (${final.with_names}/${final.total})`.cyan);
    
  } catch (error) {
    console.error('❌ خطأ عام في الإصلاح:', error.message.red);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// جلب جميع أسماء المستخدمين من Facebook API
async function getAllUserNamesFromFacebook(accessToken, pageId) {
  const userNames = new Map();
  
  try {
    let nextUrl = `https://graph.facebook.com/v18.0/me/conversations?fields=participants&access_token=${accessToken}&limit=100`;
    let pageCount = 0;
    
    while (nextUrl && pageCount < 5) { // حد أقصى 5 صفحات
      pageCount++;
      
      const response = await fetch(nextUrl);
      if (!response.ok) break;
      
      const data = await response.json();
      if (data.error) break;
      
      if (data.data) {
        data.data.forEach((conversation) => {
          if (conversation.participants && conversation.participants.data) {
            conversation.participants.data.forEach((participant) => {
              if (participant.id !== pageId && participant.name) {
                userNames.set(participant.id, participant.name);
              }
            });
          }
        });
      }
      
      nextUrl = data.paging?.next || null;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error('❌ خطأ في جلب أسماء المستخدمين:', error.message);
  }
  
  return userNames;
}

// الحصول على اسم المستخدم مباشرة
async function getUserNameDirectly(userId, accessToken) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${userId}?fields=name&access_token=${accessToken}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.error || !data.name ? null : data.name;
  } catch (error) {
    return null;
  }
}

// البحث في المحادثات الحديثة
async function searchInRecentConversations(userId, accessToken) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/conversations?fields=participants,updated_time&access_token=${accessToken}&limit=50`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.error || !data.data) return null;
    
    for (const conversation of data.data) {
      if (conversation.participants && conversation.participants.data) {
        for (const participant of conversation.participants.data) {
          if (participant.id === userId && participant.name) {
            return participant.name;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// إنشاء اسم افتراضي ذكي
function generateSmartDefaultName(userId, lastMessageAt) {
  const shortId = userId.slice(-4);
  
  if (lastMessageAt) {
    const date = new Date(lastMessageAt);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `عميل ${shortId} (${day}/${month})`;
  }
  
  return `عميل ${shortId}`;
}

// تشغيل الإصلاح
fixMissingNamesAdvanced()
  .then(() => {
    console.log('\n✅ انتهى الإصلاح المتقدم'.green);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ خطأ عام:', error.message.red);
    process.exit(1);
  });
