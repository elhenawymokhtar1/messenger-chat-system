#!/usr/bin/env node

/**
 * 🔧 تحديث الاسم المفقود يدوياً
 * يحدث اسم المحادثة التي بدون اسم
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

async function updateMissingNameManual() {
  let connection;
  
  try {
    console.log('🔧 تحديث الاسم المفقود يدوياً...'.cyan);
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات'.green);
    
    // 1. البحث عن المحادثة بدون اسم
    console.log('\n1️⃣ البحث عن المحادثة بدون اسم...'.yellow);
    
    const [conversationWithoutName] = await connection.execute(`
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
      AND user_id IS NOT NULL 
      AND user_id != ''
      AND user_id != facebook_page_id
      AND (user_name IS NULL OR user_name = '' OR user_name = 'undefined' OR user_name = 'null' OR user_name = 'بدون اسم')
      ORDER BY last_message_at DESC
      LIMIT 1
    `, [COMPANY_ID]);
    
    if (conversationWithoutName.length === 0) {
      console.log('✅ جميع المحادثات لديها أسماء!'.green);
      return;
    }
    
    const conv = conversationWithoutName[0];
    console.log('📋 المحادثة بدون اسم:'.cyan);
    console.log(`   ID: ${conv.id}`);
    console.log(`   User ID: ${conv.user_id}`);
    console.log(`   Page ID: ${conv.facebook_page_id}`);
    console.log(`   الاسم الحالي: "${conv.user_name || 'فارغ'}"`);
    console.log(`   الرسائل: ${conv.total_messages} | غير مقروءة: ${conv.unread_messages}`);
    
    // 2. جلب إعدادات Facebook
    const [facebookSettings] = await connection.execute(`
      SELECT page_id, page_name, access_token, is_active 
      FROM facebook_settings 
      WHERE company_id = ? AND page_id = ? AND is_active = 1
    `, [COMPANY_ID, conv.facebook_page_id]);
    
    if (!facebookSettings || facebookSettings.length === 0) {
      console.log('❌ لا توجد إعدادات Facebook نشطة لهذه الصفحة'.red);
      return;
    }
    
    const pageSettings = facebookSettings[0];
    console.log(`📄 صفحة Facebook: ${pageSettings.page_name}`.cyan);
    
    // 3. محاولة الحصول على الاسم من Facebook API
    console.log('\n2️⃣ محاولة الحصول على الاسم من Facebook API...'.yellow);
    
    let realName = null;
    
    // الطريقة 1: API مباشرة
    try {
      console.log('   🔍 جلب الاسم من API مباشرة...');
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${conv.user_id}?fields=name&access_token=${pageSettings.access_token}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.name && !data.error) {
          realName = data.name;
          console.log(`   ✅ تم العثور على الاسم: ${realName}`.green);
        } else {
          console.log(`   ⚠️ لم يتم العثور على اسم في API مباشرة`.yellow);
        }
      } else {
        console.log(`   ❌ خطأ في API: ${response.status}`.red);
      }
    } catch (error) {
      console.log(`   ❌ خطأ في الاتصال بـ API: ${error.message}`.red);
    }
    
    // الطريقة 2: البحث في المحادثات
    if (!realName) {
      try {
        console.log('   🔍 البحث في المحادثات...');
        const response = await fetch(
          `https://graph.facebook.com/v18.0/me/conversations?fields=participants&access_token=${pageSettings.access_token}&limit=50`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            for (const conversation of data.data) {
              if (conversation.participants && conversation.participants.data) {
                for (const participant of conversation.participants.data) {
                  if (participant.id === conv.user_id && participant.name) {
                    realName = participant.name;
                    console.log(`   ✅ تم العثور على الاسم في المحادثات: ${realName}`.green);
                    break;
                  }
                }
              }
              if (realName) break;
            }
          }
        }
        
        if (!realName) {
          console.log(`   ⚠️ لم يتم العثور على اسم في المحادثات`.yellow);
        }
      } catch (error) {
        console.log(`   ❌ خطأ في البحث في المحادثات: ${error.message}`.red);
      }
    }
    
    // الطريقة 3: اسم افتراضي ذكي
    if (!realName) {
      realName = `عميل ${conv.user_id.slice(-4)}`;
      console.log(`   💡 استخدام اسم افتراضي: ${realName}`.cyan);
    }
    
    // 4. تحديث الاسم في قاعدة البيانات
    console.log('\n3️⃣ تحديث الاسم في قاعدة البيانات...'.yellow);
    
    const [updateResult] = await connection.execute(
      'UPDATE conversations SET user_name = ?, updated_at = NOW() WHERE id = ?',
      [realName, conv.id]
    );
    
    if (updateResult.affectedRows > 0) {
      console.log(`✅ تم تحديث الاسم بنجاح: ${realName}`.green);
    } else {
      console.log('❌ فشل في تحديث الاسم'.red);
    }
    
    // 5. فحص النتيجة النهائية
    console.log('\n4️⃣ فحص النتيجة النهائية...'.yellow);
    
    const [finalStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN user_name IS NOT NULL AND user_name != '' AND user_name != 'undefined' AND user_name != 'null' AND user_name != 'بدون اسم' THEN 1 ELSE 0 END) as with_names,
        SUM(CASE WHEN user_name IS NULL OR user_name = '' OR user_name = 'undefined' OR user_name = 'null' OR user_name = 'بدون اسم' THEN 1 ELSE 0 END) as without_names
      FROM conversations 
      WHERE company_id = ? AND user_id != facebook_page_id
    `, [COMPANY_ID]);
    
    const stats = finalStats[0];
    const percentage = ((stats.with_names / stats.total) * 100).toFixed(1);
    
    console.log(`📊 النتائج النهائية:`.cyan);
    console.log(`   إجمالي المحادثات: ${stats.total}`);
    console.log(`   ✅ مع أسماء: ${stats.with_names}`);
    console.log(`   ❌ بدون أسماء: ${stats.without_names}`);
    console.log(`   📈 نسبة النجاح: ${percentage}%`);
    
    if (stats.without_names === 0) {
      console.log('\n🎉 ممتاز! جميع المحادثات لديها أسماء الآن!'.green);
    } else {
      console.log(`\n⚠️ لا تزال هناك ${stats.without_names} محادثة بدون أسماء`.yellow);
    }
    
  } catch (error) {
    console.error('❌ خطأ عام في التحديث:', error.message.red);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل التحديث
updateMissingNameManual()
  .then(() => {
    console.log('\n✅ انتهى التحديث'.green);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ خطأ عام:', error.message.red);
    process.exit(1);
  });
