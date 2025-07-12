// إصلاح بيانات الشركة التجريبية
import fetch from 'node-fetch';

async function fixTestCompanyData() {
  try {
    console.log('🔧 [FIX] بدء إصلاح بيانات الشركة التجريبية...');
    
    const response = await fetch('http://localhost:3002/api/debug/fix-data-isolation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    console.log('🔧 [FIX] Status:', response.status);
    console.log('🔧 [FIX] Status Text:', response.statusText);
    
    const result = await response.json();
    console.log('🔧 [FIX] Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ [FIX] تم إصلاح البيانات بنجاح!');
      console.log('📊 [FIX] تفاصيل الإصلاح:');
      console.log(`   - الشركة: ${result.data.testCompany.name}`);
      console.log(`   - المحادثات المحدثة: ${result.data.conversationsUpdated || 0}`);
      console.log(`   - الرسائل المحدثة: ${result.data.messagesUpdated || 0}`);
    } else {
      console.log('❌ [FIX] فشل في إصلاح البيانات:', result.error);
    }
    
  } catch (error) {
    console.error('❌ [FIX] خطأ في الاتصال:', error.message);
  }
}

// تشغيل الإصلاح
fixTestCompanyData();
