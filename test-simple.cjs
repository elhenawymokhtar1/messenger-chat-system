/**
 * اختبار مبسط لـ API واحد
 */

const axios = require('axios');

async function testSendMessage() {
  try {
    console.log('🧪 اختبار إرسال رسالة...');
    
    const response = await axios.post('http://localhost:3002/api/send-message', {
      conversation_id: 'test_conv_123',
      message_text: 'رسالة اختبار',
      company_id: 'c677b32f-fe1c-4c64-8362-a1c03406608d',
      sender_name: 'نظام الاختبار'
    });
    
    console.log('✅ نجح:', response.data);
  } catch (error) {
    console.log('❌ فشل:', error.response?.status, error.response?.statusText);
    console.log('📝 التفاصيل:', error.message);
  }
}

testSendMessage();
