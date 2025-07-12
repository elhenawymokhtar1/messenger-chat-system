/**
 * اختبار شامل لجميع ميزات صفحة المحادثات
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:3002';
const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

// قائمة المحادثات المتوقعة
const EXPECTED_CONVERSATIONS = [
  'conv_1751935287534_1',
  'conv_1751935287534_2', 
  'conv_1751935287534_3',
  'conv_1751935287534_4',
  'conv_1751935287534_5'
];

async function testAllFeatures() {
  console.log('🧪 بدء الاختبار الشامل لجميع ميزات صفحة المحادثات...'.blue.bold);
  
  let passedTests = 0;
  let totalTests = 0;
  
  try {
    // 1. اختبار جلب المحادثات
    console.log('\n📋 1. اختبار جلب المحادثات...'.cyan);
    totalTests++;
    
    const conversationsResponse = await axios.get(`${BASE_URL}/api/companies/${COMPANY_ID}/conversations?limit=50&recent_only=false`);
    
    if (conversationsResponse.data.success && conversationsResponse.data.count === 5) {
      console.log('✅ جلب المحادثات: نجح (5 محادثات)'.green);
      passedTests++;
    } else {
      console.log(`❌ جلب المحادثات: فشل (العدد: ${conversationsResponse.data.count})`.red);
    }
    
    const conversations = conversationsResponse.data.data;
    
    // 2. اختبار جلب الرسائل لكل محادثة
    console.log('\n💬 2. اختبار جلب الرسائل...'.cyan);
    
    for (const conv of conversations) {
      totalTests++;
      try {
        const messagesResponse = await axios.get(`${BASE_URL}/api/conversations/${conv.id}/messages?recent_only=false`);
        
        if (messagesResponse.data.success && messagesResponse.data.count > 0) {
          console.log(`✅ رسائل ${conv.id}: نجح (${messagesResponse.data.count} رسالة)`.green);
          passedTests++;
        } else {
          console.log(`❌ رسائل ${conv.id}: فشل (لا توجد رسائل)`.red);
        }
      } catch (error) {
        console.log(`❌ رسائل ${conv.id}: خطأ - ${error.message}`.red);
      }
    }
    
    // 3. اختبار البحث في المحادثات
    console.log('\n🔍 3. اختبار البحث في المحادثات...'.cyan);
    totalTests++;
    
    try {
      const searchResponse = await axios.get(`${BASE_URL}/api/companies/${COMPANY_ID}/conversations?search=أحمد&recent_only=false`);
      
      if (searchResponse.data.success) {
        console.log(`✅ البحث: نجح (${searchResponse.data.count} نتيجة)`.green);
        passedTests++;
      } else {
        console.log('❌ البحث: فشل'.red);
      }
    } catch (error) {
      console.log(`❌ البحث: خطأ - ${error.message}`.red);
    }
    
    // 4. اختبار إرسال رسالة جديدة
    console.log('\n📤 4. اختبار إرسال رسالة جديدة...'.cyan);
    totalTests++;
    
    try {
      const testConversationId = conversations[0].id;
      const sendMessageResponse = await axios.post(`${BASE_URL}/api/send-message`, {
        conversation_id: testConversationId,
        message_text: 'رسالة اختبار من النظام الآلي',
        company_id: COMPANY_ID,
        sender_name: 'نظام الاختبار'
      });
      
      if (sendMessageResponse.data.success) {
        console.log('✅ إرسال رسالة: نجح'.green);
        passedTests++;
      } else {
        console.log('❌ إرسال رسالة: فشل'.red);
      }
    } catch (error) {
      console.log(`❌ إرسال رسالة: خطأ - ${error.message}`.red);
    }
    
    // 5. اختبار تحديث حالة القراءة
    console.log('\n👁️ 5. اختبار تحديث حالة القراءة...'.cyan);
    totalTests++;
    
    try {
      const testConversationId = conversations[0].id;
      const markReadResponse = await axios.post(`${BASE_URL}/api/conversations/${testConversationId}/mark-read`, {
        company_id: COMPANY_ID
      });
      
      if (markReadResponse.status === 200) {
        console.log('✅ تحديث حالة القراءة: نجح'.green);
        passedTests++;
      } else {
        console.log('❌ تحديث حالة القراءة: فشل'.red);
      }
    } catch (error) {
      console.log(`❌ تحديث حالة القراءة: خطأ - ${error.message}`.red);
    }
    
    // 6. اختبار أرشفة المحادثة
    console.log('\n📦 6. اختبار أرشفة المحادثة...'.cyan);
    totalTests++;
    
    try {
      const testConversationId = conversations[0].id;
      const archiveResponse = await axios.post(`${BASE_URL}/api/conversations/${testConversationId}/archive`, {
        company_id: COMPANY_ID
      });
      
      if (archiveResponse.status === 200) {
        console.log('✅ أرشفة المحادثة: نجح'.green);
        passedTests++;
        
        // إلغاء الأرشفة للعودة للحالة الأصلية
        await axios.post(`${BASE_URL}/api/conversations/${testConversationId}/unarchive`, {
          company_id: COMPANY_ID
        });
        console.log('🔄 تم إلغاء الأرشفة للعودة للحالة الأصلية'.gray);
      } else {
        console.log('❌ أرشفة المحادثة: فشل'.red);
      }
    } catch (error) {
      console.log(`❌ أرشفة المحادثة: خطأ - ${error.message}`.red);
    }
    
    // 7. اختبار الفلترة حسب الحالة
    console.log('\n🔽 7. اختبار الفلترة حسب الحالة...'.cyan);
    totalTests++;
    
    try {
      const filterResponse = await axios.get(`${BASE_URL}/api/companies/${COMPANY_ID}/conversations?status=active&recent_only=false`);
      
      if (filterResponse.data.success) {
        console.log(`✅ الفلترة حسب الحالة: نجح (${filterResponse.data.count} محادثة نشطة)`.green);
        passedTests++;
      } else {
        console.log('❌ الفلترة حسب الحالة: فشل'.red);
      }
    } catch (error) {
      console.log(`❌ الفلترة حسب الحالة: خطأ - ${error.message}`.red);
    }
    
    // 8. اختبار الفلترة حسب الصفحة
    console.log('\n📄 8. اختبار الفلترة حسب الصفحة...'.cyan);
    totalTests++;
    
    try {
      const pageFilterResponse = await axios.get(`${BASE_URL}/api/companies/${COMPANY_ID}/conversations?page_id=123456789&recent_only=false`);
      
      if (pageFilterResponse.data.success) {
        console.log(`✅ الفلترة حسب الصفحة: نجح (${pageFilterResponse.data.count} محادثة)`.green);
        passedTests++;
      } else {
        console.log('❌ الفلترة حسب الصفحة: فشل'.red);
      }
    } catch (error) {
      console.log(`❌ الفلترة حسب الصفحة: خطأ - ${error.message}`.red);
    }
    
    // 9. اختبار الترقيم (Pagination)
    console.log('\n📄 9. اختبار الترقيم...'.cyan);
    totalTests++;
    
    try {
      const paginationResponse = await axios.get(`${BASE_URL}/api/companies/${COMPANY_ID}/conversations?limit=2&offset=0&recent_only=false`);
      
      if (paginationResponse.data.success && paginationResponse.data.data.length <= 2) {
        console.log(`✅ الترقيم: نجح (${paginationResponse.data.data.length} محادثة في الصفحة الأولى)`.green);
        passedTests++;
      } else {
        console.log('❌ الترقيم: فشل'.red);
      }
    } catch (error) {
      console.log(`❌ الترقيم: خطأ - ${error.message}`.red);
    }
    
    // 10. اختبار الإحصائيات
    console.log('\n📊 10. اختبار الإحصائيات...'.cyan);
    totalTests++;
    
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/companies/${COMPANY_ID}/conversations/stats`);
      
      if (statsResponse.status === 200) {
        console.log('✅ الإحصائيات: نجح'.green);
        passedTests++;
      } else {
        console.log('❌ الإحصائيات: فشل'.red);
      }
    } catch (error) {
      console.log(`❌ الإحصائيات: خطأ - ${error.message}`.red);
    }
    
    // النتيجة النهائية
    console.log('\n' + '='.repeat(50).blue);
    console.log('📊 نتائج الاختبار الشامل:'.blue.bold);
    console.log(`✅ نجح: ${passedTests}/${totalTests} اختبار`.green);
    console.log(`❌ فشل: ${totalTests - passedTests}/${totalTests} اختبار`.red);
    console.log(`📈 معدل النجاح: ${((passedTests / totalTests) * 100).toFixed(1)}%`.cyan);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 جميع الاختبارات نجحت! النظام يعمل بشكل مثالي!'.green.bold);
    } else if (passedTests >= totalTests * 0.8) {
      console.log('\n✅ معظم الاختبارات نجحت! النظام يعمل بشكل جيد مع بعض المشاكل البسيطة.'.yellow.bold);
    } else {
      console.log('\n⚠️ هناك مشاكل تحتاج إلى إصلاح.'.red.bold);
    }
    
  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:'.red, error.message);
  }
}

testAllFeatures().catch(console.error);
