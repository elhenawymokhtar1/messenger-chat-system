const mysql = require('mysql2/promise');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: 'Aa123456789',
  database: 'u384034873_conversations',
  charset: 'utf8mb4'
};

// الـ Token الجديد
const NEW_ACCESS_TOKEN = 'EAAUpPO0SIEABPJq5fmRaZAuIkrZB5o7PRevooHpdSzjEJ4ZBum1f4EQPvY7h6o0vbV2V0jXRuQby8le9ykB27Gw5qAKMIH2YD7pbdKNPINHZADlyijjmXFAlLajWV0q1gSo5ZC1Xw2zITbzuiYLF1IZAlt2tFQzmLxUhgQim6vtTYD3IRYU0NWZCa4srrrfMI6rb5I55Eo47LeQdDl2lnH54Q8l';
const PAGE_ID = '250528358137901';

async function updateToken() {
  let connection;
  
  try {
    console.log('🔄 تحديث Facebook Access Token...');
    console.log('=' .repeat(50));
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // البحث عن الصفحة الحالية
    const [currentPages] = await connection.execute(
      'SELECT * FROM facebook_pages_unified WHERE page_id = ?',
      [PAGE_ID]
    );
    
    if (currentPages.length === 0) {
      console.log('❌ الصفحة غير موجودة في قاعدة البيانات');
      return;
    }
    
    const currentPage = currentPages[0];
    console.log('📄 الصفحة الحالية:', currentPage.page_name);
    console.log('🔑 Token الحالي:', currentPage.access_token.substring(0, 20) + '...');
    
    // تحديث الـ Token
    const [result] = await connection.execute(
      'UPDATE facebook_pages_unified SET access_token = ?, updated_at = NOW() WHERE page_id = ?',
      [NEW_ACCESS_TOKEN, PAGE_ID]
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ تم تحديث Access Token بنجاح!');
      console.log('📊 عدد الصفوف المحدثة:', result.affectedRows);
      
      // التحقق من التحديث
      const [updatedPages] = await connection.execute(
        'SELECT page_name, page_id, updated_at FROM facebook_pages_unified WHERE page_id = ?',
        [PAGE_ID]
      );
      
      if (updatedPages.length > 0) {
        const updatedPage = updatedPages[0];
        console.log('📄 الصفحة:', updatedPage.page_name);
        console.log('🆔 معرف الصفحة:', updatedPage.page_id);
        console.log('⏰ وقت التحديث:', updatedPage.updated_at);
      }
      
      // اختبار الـ Token الجديد
      console.log('\n🧪 اختبار Access Token الجديد...');
      await testNewToken();
      
    } else {
      console.log('❌ لم يتم تحديث أي صفوف');
    }
    
  } catch (error) {
    console.error('❌ خطأ في تحديث Token:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

async function testNewToken() {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/v18.0/me?access_token=${NEW_ACCESS_TOKEN}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.error) {
            console.log('❌ الـ Token الجديد غير صحيح:', result.error.message);
          } else {
            console.log('✅ الـ Token الجديد يعمل بشكل صحيح!');
            console.log('📄 اسم الصفحة:', result.name);
            console.log('🆔 معرف الصفحة:', result.id);
          }
          resolve();
        } catch (error) {
          console.log('❌ خطأ في تحليل الاستجابة:', error.message);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.log('❌ خطأ في الاتصال:', error.message);
      reject(error);
    });
  });
}

// تشغيل التحديث
updateToken();
