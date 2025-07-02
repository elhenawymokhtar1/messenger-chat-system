#!/usr/bin/env node

/**
 * 🔍 تحليل الأسماء المفقودة
 * يفحص المحادثات التي لا تظهر بأسماء العملاء ويحاول إصلاحها
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

async function analyzeMissingNames() {
  let connection;
  
  try {
    console.log('🔍 تحليل الأسماء المفقودة...'.cyan);
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات'.green);
    
    // 1. فحص جميع المحادثات
    console.log('\n1️⃣ فحص جميع المحادثات...'.yellow);
    
    const [allConversations] = await connection.execute(`
      SELECT 
        id,
        user_id,
        user_name,
        facebook_page_id,
        last_message_at,
        created_at,
        CASE 
          WHEN user_name IS NULL THEN 'NULL'
          WHEN user_name = '' THEN 'EMPTY'
          WHEN user_name = 'undefined' THEN 'UNDEFINED'
          WHEN user_name = 'مستخدم غير معروف' THEN 'UNKNOWN'
          ELSE 'HAS_NAME'
        END as name_status
      FROM conversations 
      WHERE company_id = ?
      ORDER BY last_message_at DESC
    `, [COMPANY_ID]);
    
    console.log(`📊 إجمالي المحادثات: ${allConversations.length}`.green);
    
    // تصنيف المحادثات حسب حالة الاسم
    const nameStats = {};
    allConversations.forEach(conv => {
      const status = conv.name_status;
      nameStats[status] = (nameStats[status] || 0) + 1;
    });
    
    console.log('\n📊 إحصائيات الأسماء:'.cyan);
    Object.entries(nameStats).forEach(([status, count]) => {
      const statusText = {
        'NULL': 'أسماء فارغة (NULL)',
        'EMPTY': 'أسماء فارغة ("")',
        'UNDEFINED': 'أسماء غير محددة (undefined)',
        'UNKNOWN': 'مستخدم غير معروف',
        'HAS_NAME': 'لديها أسماء صحيحة'
      };
      
      const color = status === 'HAS_NAME' ? 'green' : 'red';
      console.log(`   ${statusText[status]}: ${count}`.color);
    });
    
    // 2. عرض المحادثات بدون أسماء
    const conversationsWithoutNames = allConversations.filter(
      conv => conv.name_status !== 'HAS_NAME'
    );
    
    if (conversationsWithoutNames.length > 0) {
      console.log(`\n2️⃣ المحادثات بدون أسماء (${conversationsWithoutNames.length}):`.yellow);
      
      conversationsWithoutNames.forEach((conv, index) => {
        console.log(`${index + 1}. ID: ${conv.id.substring(0, 8)}...`);
        console.log(`   المستخدم: ${conv.user_id || 'غير محدد'}`);
        console.log(`   الاسم الحالي: "${conv.user_name}" (${conv.name_status})`);
        console.log(`   الصفحة: ${conv.facebook_page_id}`);
        console.log(`   آخر رسالة: ${conv.last_message_at || 'لا توجد'}`);
        console.log('');
      });
    }
    
    // 3. عرض المحادثات مع أسماء صحيحة
    const conversationsWithNames = allConversations.filter(
      conv => conv.name_status === 'HAS_NAME'
    );
    
    if (conversationsWithNames.length > 0) {
      console.log(`\n3️⃣ المحادثات مع أسماء صحيحة (${conversationsWithNames.length}):`.green);
      
      conversationsWithNames.slice(0, 10).forEach((conv, index) => {
        console.log(`${index + 1}. ${conv.user_name} (${conv.user_id})`);
      });
      
      if (conversationsWithNames.length > 10) {
        console.log(`   ... و ${conversationsWithNames.length - 10} أخرى`);
      }
    }
    
    // 4. فحص إعدادات Facebook
    console.log('\n4️⃣ فحص إعدادات Facebook...'.yellow);
    
    const [facebookSettings] = await connection.execute(`
      SELECT page_id, page_name, access_token, is_active 
      FROM facebook_settings 
      WHERE company_id = ?
    `, [COMPANY_ID]);
    
    console.log(`📄 عدد صفحات Facebook: ${facebookSettings.length}`);
    facebookSettings.forEach((page, index) => {
      console.log(`${index + 1}. ${page.page_name} (${page.page_id}) - ${page.is_active ? 'نشط' : 'غير نشط'}`);
    });
    
    // 5. محاولة إصلاح الأسماء المفقودة
    if (conversationsWithoutNames.length > 0) {
      console.log('\n5️⃣ محاولة إصلاح الأسماء المفقودة...'.yellow);
      
      let fixed = 0;
      let failed = 0;
      
      for (const page of facebookSettings) {
        if (!page.is_active) continue;
        
        const pageConversations = conversationsWithoutNames.filter(
          conv => conv.facebook_page_id === page.page_id
        );
        
        if (pageConversations.length === 0) continue;
        
        console.log(`\n📄 معالجة صفحة: ${page.page_name} (${pageConversations.length} محادثة)`);
        
        for (const conv of pageConversations.slice(0, 5)) { // أول 5 فقط للاختبار
          try {
            if (!conv.user_id || conv.user_id === '') {
              console.log(`   ⚠️ تخطي محادثة بدون user_id: ${conv.id.substring(0, 8)}...`);
              continue;
            }
            
            const realName = await getUserNameFromFacebook(conv.user_id, page.access_token);
            
            if (realName) {
              // تحديث الاسم في قاعدة البيانات
              await connection.execute(
                'UPDATE conversations SET user_name = ?, updated_at = NOW() WHERE id = ?',
                [realName, conv.id]
              );
              
              console.log(`   ✅ تم إصلاح: ${conv.user_id} → ${realName}`.green);
              fixed++;
            } else {
              console.log(`   ❌ فشل في الحصول على اسم: ${conv.user_id}`.red);
              failed++;
            }
            
            // انتظار قصير لتجنب rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`   ❌ خطأ في معالجة ${conv.user_id}:`, error.message);
            failed++;
          }
        }
      }
      
      console.log(`\n📊 نتائج الإصلاح:`.cyan);
      console.log(`✅ تم إصلاح: ${fixed} اسم`.green);
      console.log(`❌ فشل في: ${failed} اسم`.red);
    }
    
    // 6. فحص نهائي
    console.log('\n6️⃣ فحص نهائي...'.yellow);
    
    const [finalCheck] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN user_name IS NOT NULL AND user_name != '' AND user_name != 'undefined' THEN 1 ELSE 0 END) as with_names,
        SUM(CASE WHEN user_name IS NULL OR user_name = '' OR user_name = 'undefined' THEN 1 ELSE 0 END) as without_names
      FROM conversations 
      WHERE company_id = ?
    `, [COMPANY_ID]);
    
    const final = finalCheck[0];
    const percentage = ((final.with_names / final.total) * 100).toFixed(1);
    
    console.log(`📊 النتيجة النهائية:`.cyan);
    console.log(`   إجمالي المحادثات: ${final.total}`);
    console.log(`   ✅ مع أسماء: ${final.with_names}`);
    console.log(`   ❌ بدون أسماء: ${final.without_names}`);
    console.log(`   📈 نسبة النجاح: ${percentage}%`);
    
  } catch (error) {
    console.error('❌ خطأ عام في التحليل:', error.message.red);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم قطع الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// الحصول على اسم المستخدم من Facebook API
async function getUserNameFromFacebook(userId, accessToken) {
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
    console.error(`❌ خطأ في Facebook API للمستخدم ${userId}:`, error.message);
    return null;
  }
}

// تشغيل التحليل
analyzeMissingNames()
  .then(() => {
    console.log('\n✅ انتهى التحليل'.green);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ خطأ عام:', error.message.red);
    process.exit(1);
  });
