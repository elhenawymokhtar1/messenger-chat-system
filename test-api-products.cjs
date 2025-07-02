/**
 * 🧪 اختبار API المنتجات
 */

const http = require('http');

// اختبار Health Check
const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/health',
  method: 'GET'
};

console.log('🧪 اختبار Health Check...');

const req = http.request(options, (res) => {
  console.log('📊 حالة الاستجابة:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📦 البيانات:', data);
    
    // اختبار المنتجات
    testProducts();
  });
});

req.on('error', (err) => {
  console.error('❌ خطأ في الطلب:', err.message);
});

req.end();

function testProducts() {
  console.log('\n📦 اختبار جلب المنتجات...');
  
  const productOptions = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/companies/c677b32f-fe1c-4c64-8362-a1c03406608d/products',
    method: 'GET'
  };

  const productReq = http.request(productOptions, (res) => {
    console.log('📊 حالة الاستجابة:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📦 البيانات:', data);
      
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.success) {
          console.log('✅ تم جلب المنتجات بنجاح');
          console.log('📊 عدد المنتجات:', jsonData.data.length);
          
          jsonData.data.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.name} - ${product.price} جنيه`);
          });
        }
      } catch (e) {
        console.log('⚠️ البيانات ليست JSON صحيح');
      }
      
      // اختبار إضافة منتج
      testAddProduct();
    });
  });

  productReq.on('error', (err) => {
    console.error('❌ خطأ في طلب المنتجات:', err.message);
  });

  productReq.end();
}

function testAddProduct() {
  console.log('\n🆕 اختبار إضافة منتج...');
  
  const newProduct = {
    name: 'منتج اختبار API',
    description: 'وصف المنتج',
    price: 150.00,
    stock_quantity: 25
  };
  
  const postData = JSON.stringify(newProduct);
  
  const addOptions = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/companies/c677b32f-fe1c-4c64-8362-a1c03406608d/products',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const addReq = http.request(addOptions, (res) => {
    console.log('📊 حالة الإضافة:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📦 نتيجة الإضافة:', data);
      
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.success) {
          console.log('✅ تم إضافة المنتج بنجاح');
          console.log('📦 اسم المنتج:', jsonData.data.name);
          console.log('🆔 معرف المنتج:', jsonData.data.id);
        } else {
          console.log('❌ فشل في إضافة المنتج:', jsonData.message);
          if (jsonData.error) {
            console.log('🔍 تفاصيل الخطأ:', jsonData.error);
          }
        }
      } catch (e) {
        console.log('⚠️ البيانات ليست JSON صحيح');
      }
      
      console.log('\n🎉 انتهى الاختبار!');
    });
  });

  addReq.on('error', (err) => {
    console.error('❌ خطأ في إضافة المنتج:', err.message);
  });

  addReq.write(postData);
  addReq.end();
}
