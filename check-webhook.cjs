const https = require('https');

// Access Token من قاعدة البيانات
const ACCESS_TOKEN = 'EAAUpPO0SIEABPGMwCNcO9cUDoy0zsE4WQZCi39RATX9I6zVvTt1whvkZBt0stI4HrsZBMngnd4VFvZCliKyFrZBEqIgwoYkyGcGWlkFzYTFHdaalQOHUjw7Dhw9OVV3ZAXmn2o5FxFvmPlVZAikkvbqHlDbIx3QcRFcElaOhu6ciUZBN9ZAwNUXrbcRZCWcIvkaqGjd9CsBEyAC6Igx6e4Pls3JUks';
const PAGE_ID = '250528358137901';

console.log('🔍 فحص إعدادات Facebook Webhook...');
console.log('=' .repeat(50));

// فحص إعدادات الـ webhook للصفحة
function checkWebhookSettings() {
  const url = `https://graph.facebook.com/v18.0/${PAGE_ID}/subscribed_apps?access_token=${ACCESS_TOKEN}`;
  
  console.log('📋 فحص التطبيقات المشتركة في الصفحة...');
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        if (result.error) {
          console.log('❌ خطأ في جلب إعدادات الـ webhook:', result.error.message);
          console.log('   الكود:', result.error.code);
          
          if (result.error.code === 190) {
            console.log('\n🔄 الـ Token منتهي الصلاحية');
          }
        } else {
          console.log('📱 التطبيقات المشتركة في الصفحة:');
          
          if (result.data && result.data.length > 0) {
            result.data.forEach(app => {
              console.log(`   ✅ التطبيق: ${app.name || app.id}`);
              console.log(`      المعرف: ${app.id}`);
              if (app.subscribed_fields) {
                console.log(`      الحقول المشتركة: ${app.subscribed_fields.join(', ')}`);
              }
            });
          } else {
            console.log('   ❌ لا توجد تطبيقات مشتركة!');
            console.log('\n🔧 هذا يفسر لماذا لا تصل الرسائل الجديدة');
            console.log('   يجب إعادة ربط التطبيق بالصفحة');
          }
        }
      } catch (error) {
        console.log('❌ خطأ في تحليل الاستجابة:', error.message);
      }
    });
  }).on('error', (error) => {
    console.log('❌ خطأ في الاتصال:', error.message);
  });
}

// فحص معلومات الصفحة
function checkPageInfo() {
  const url = `https://graph.facebook.com/v18.0/${PAGE_ID}?fields=name,id,category,verification_status&access_token=${ACCESS_TOKEN}`;
  
  console.log('\n📄 فحص معلومات الصفحة...');
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        if (result.error) {
          console.log('❌ خطأ في جلب معلومات الصفحة:', result.error.message);
        } else {
          console.log('📋 معلومات الصفحة:');
          console.log(`   الاسم: ${result.name}`);
          console.log(`   المعرف: ${result.id}`);
          console.log(`   الفئة: ${result.category || 'غير محدد'}`);
          console.log(`   حالة التحقق: ${result.verification_status || 'غير محدد'}`);
          
          // فحص إعدادات الـ webhook
          checkWebhookSettings();
        }
      } catch (error) {
        console.log('❌ خطأ في تحليل معلومات الصفحة:', error.message);
      }
    });
  }).on('error', (error) => {
    console.log('❌ خطأ في الاتصال:', error.message);
  });
}

// بدء الفحص
checkPageInfo();
