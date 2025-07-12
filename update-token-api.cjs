const https = require('https');

// الـ Token الجديد
const NEW_ACCESS_TOKEN = 'EAAUpPO0SIEABPJq5fmRaZAuIkrZB5o7PRevooHpdSzjEJ4ZBum1f4EQPvY7h6o0vbV2V0jXRuQby8le9ykB27Gw5qAKMIH2YD7pbdKNPINHZADlyijjmXFAlLajWV0q1gSo5ZC1Xw2zITbzuiYLF1IZAlt2tFQzmLxUhgQim6vtTYD3IRYU0NWZCa4srrrfMI6rb5I55Eo47LeQdDl2lnH54Q8l';
const PAGE_ID = '250528358137901';
const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

async function updateTokenViaAPI() {
  console.log('🔄 تحديث Facebook Access Token عبر API...');
  console.log('=' .repeat(50));
  
  try {
    // أولاً: اختبار الـ Token الجديد
    console.log('🧪 اختبار الـ Token الجديد...');
    const tokenValid = await testToken(NEW_ACCESS_TOKEN);
    
    if (!tokenValid) {
      console.log('❌ الـ Token الجديد غير صحيح - توقف التحديث');
      return;
    }
    
    console.log('✅ الـ Token الجديد صحيح');
    
    // ثانياً: حذف الصفحة الحالية
    console.log('\n🗑️ حذف الصفحة الحالية...');
    await deleteCurrentPage();
    
    // ثالثاً: إضافة الصفحة بالـ Token الجديد
    console.log('\n➕ إضافة الصفحة بالـ Token الجديد...');
    await addPageWithNewToken();
    
    console.log('\n🎉 تم تحديث الـ Token بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث Token:', error.message);
  }
}

function testToken(token) {
  return new Promise((resolve) => {
    const url = `https://graph.facebook.com/v18.0/me?access_token=${token}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.error) {
            console.log('❌ Token غير صحيح:', result.error.message);
            resolve(false);
          } else {
            console.log('✅ Token صحيح - الصفحة:', result.name);
            resolve(true);
          }
        } catch (error) {
          console.log('❌ خطأ في تحليل الاستجابة:', error.message);
          resolve(false);
        }
      });
    }).on('error', (error) => {
      console.log('❌ خطأ في الاتصال:', error.message);
      resolve(false);
    });
  });
}

function deleteCurrentPage() {
  return new Promise((resolve, reject) => {
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: `/api/facebook/settings/${PAGE_ID}`,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('✅ تم حذف الصفحة الحالية');
          } else {
            console.log('⚠️ لم يتم العثور على الصفحة أو تم حذفها مسبقاً');
          }
          resolve();
        } catch (error) {
          console.log('⚠️ استجابة غير متوقعة من حذف الصفحة');
          resolve(); // نكمل حتى لو فشل الحذف
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('⚠️ خطأ في حذف الصفحة:', error.message);
      resolve(); // نكمل حتى لو فشل الحذف
    });
    
    req.end();
  });
}

function addPageWithNewToken() {
  return new Promise((resolve, reject) => {
    const http = require('http');
    
    const postData = JSON.stringify({
      company_id: COMPANY_ID,
      page_id: PAGE_ID,
      page_name: 'سولا 132',
      access_token: NEW_ACCESS_TOKEN
    });
    
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/facebook/settings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('✅ تم إضافة الصفحة بالـ Token الجديد');
          } else {
            console.log('❌ فشل في إضافة الصفحة:', result.error);
          }
          resolve();
        } catch (error) {
          console.log('❌ خطأ في تحليل استجابة إضافة الصفحة:', error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ خطأ في إضافة الصفحة:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// تشغيل التحديث
updateTokenViaAPI();
