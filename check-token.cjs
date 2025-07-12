const https = require('https');

// Access Token من قاعدة البيانات
const ACCESS_TOKEN = 'EAAUpPO0SIEABPGMwCNcO9cUDoy0zsE4WQZCi39RATX9I6zVvTt1whvkZBt0stI4HrsZBMngnd4VFvZCliKyFrZBEqIgwoYkyGcGWlkFzYTFHdaalQOHUjw7Dhw9OVV3ZAXmn2o5FxFvmPlVZAikkvbqHlDbIx3QcRFcElaOhu6ciUZBN9ZAwNUXrbcRZCWcIvkaqGjd9CsBEyAC6Igx6e4Pls3JUks';

console.log('🔍 فحص Facebook Access Token...');
console.log('=' .repeat(50));

// فحص معلومات الـ Token
function checkToken() {
  const url = `https://graph.facebook.com/v18.0/me?access_token=${ACCESS_TOKEN}`;
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        if (result.error) {
          console.log('❌ Access Token غير صالح:');
          console.log('   الخطأ:', result.error.message);
          console.log('   النوع:', result.error.type);
          console.log('   الكود:', result.error.code);
          
          if (result.error.code === 190) {
            console.log('\n🔄 الـ Token منتهي الصلاحية - يحتاج تجديد');
            console.log('📋 خطوات التجديد:');
            console.log('1. اذهب إلى: https://developers.facebook.com/tools/explorer/');
            console.log('2. اختر التطبيق الخاص بك');
            console.log('3. اختر الصفحة: سولا 132');
            console.log('4. اطلب الصلاحيات: pages_messaging, pages_manage_metadata');
            console.log('5. انسخ الـ Token الجديد');
          }
        } else {
          console.log('✅ Access Token صالح!');
          console.log('   الاسم:', result.name);
          console.log('   المعرف:', result.id);
          
          // فحص صلاحيات الـ Token
          checkTokenPermissions();
        }
      } catch (error) {
        console.log('❌ خطأ في تحليل الاستجابة:', error.message);
      }
    });
  }).on('error', (error) => {
    console.log('❌ خطأ في الاتصال:', error.message);
  });
}

// فحص صلاحيات الـ Token
function checkTokenPermissions() {
  const url = `https://graph.facebook.com/v18.0/me/permissions?access_token=${ACCESS_TOKEN}`;
  
  console.log('\n🔍 فحص صلاحيات الـ Token...');
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        if (result.error) {
          console.log('❌ خطأ في جلب الصلاحيات:', result.error.message);
        } else {
          console.log('📋 الصلاحيات المتاحة:');
          result.data.forEach(permission => {
            const status = permission.status === 'granted' ? '✅' : '❌';
            console.log(`   ${status} ${permission.permission}`);
          });
          
          // التحقق من الصلاحيات المطلوبة
          const requiredPermissions = ['pages_messaging', 'pages_manage_metadata', 'pages_read_engagement'];
          const grantedPermissions = result.data
            .filter(p => p.status === 'granted')
            .map(p => p.permission);
          
          console.log('\n🔍 فحص الصلاحيات المطلوبة:');
          requiredPermissions.forEach(perm => {
            const hasPermission = grantedPermissions.includes(perm);
            const status = hasPermission ? '✅' : '❌';
            console.log(`   ${status} ${perm}`);
          });
          
          if (!grantedPermissions.includes('pages_messaging')) {
            console.log('\n⚠️  تحذير: صلاحية pages_messaging غير متاحة!');
            console.log('   هذا يفسر لماذا الرسائل الجديدة لا تصل عبر webhook');
          }
        }
      } catch (error) {
        console.log('❌ خطأ في تحليل صلاحيات الـ Token:', error.message);
      }
    });
  }).on('error', (error) => {
    console.log('❌ خطأ في الاتصال لفحص الصلاحيات:', error.message);
  });
}

// بدء الفحص
checkToken();
