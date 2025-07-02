/**
 * 🧪 اختبار بسيط لـ API المحادثات
 */

async function simpleTest() {
  try {
    console.log('🧪 اختبار بسيط لـ API المحادثات...');

    const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    
    // 1. اختبار Health Check
    console.log('\n1️⃣ اختبار Health Check...');
    const healthResponse = await fetch('http://localhost:3002/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health:', healthData);
    
    // 2. اختبار جلب المحادثات
    console.log('\n2️⃣ اختبار جلب المحادثات...');
    const conversationsResponse = await fetch(`http://localhost:3002/api/companies/${companyId}/conversations`);
    const conversationsData = await conversationsResponse.json();
    console.log('✅ المحادثات:', {
      success: conversationsData.success,
      count: conversationsData.count,
      firstConversation: conversationsData.data?.[0]?.customer_name
    });
    
    // 3. اختبار جلب الرسائل
    if (conversationsData.success && conversationsData.data?.length > 0) {
      console.log('\n3️⃣ اختبار جلب الرسائل...');
      const conversationId = conversationsData.data[0].id;
      const messagesResponse = await fetch(`http://localhost:3002/api/conversations/${conversationId}/messages?company_id=${companyId}`);
      const messagesData = await messagesResponse.json();
      console.log('✅ الرسائل:', {
        success: messagesData.success,
        count: messagesData.count,
        firstMessage: messagesData.data?.[0]?.message_text
      });
    }

    console.log('\n🎉 جميع الاختبارات نجحت!');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

simpleTest();
