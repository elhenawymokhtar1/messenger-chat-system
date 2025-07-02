/**
 * 🧪 اختبار API المنتجات
 */

const http = require('http');

function testAPI(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 بدء اختبار API المنتجات...\n');
  
  const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
  
  try {
    // اختبار Health Check
    console.log('🏥 اختبار Health Check...');
    const healthResult = await testAPI('http://localhost:3002/api/health');
    console.log('✅ Health Check:', healthResult.status, healthResult.data.message);
    
    // اختبار جلب المنتجات
    console.log('\n📦 اختبار جلب المنتجات...');
    const productsResult = await testAPI(`http://localhost:3002/api/companies/${companyId}/products`);
    console.log('📊 حالة الاستجابة:', productsResult.status);
    
    if (productsResult.data.success) {
      console.log('✅ تم جلب المنتجات بنجاح');
      console.log('📦 عدد المنتجات:', productsResult.data.data.length);
      
      productsResult.data.data.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - ${product.price} جنيه (${product.sku})`);
      });
    } else {
      console.log('❌ فشل في جلب المنتجات:', productsResult.data.message);
    }
    
    // اختبار إضافة منتج جديد
    console.log('\n🆕 اختبار إضافة منتج جديد...');
    const newProduct = {
      name: 'منتج جديد من API',
      description: 'وصف المنتج الجديد',
      short_description: 'منتج رائع',
      price: 250.00,
      stock_quantity: 20,
      category: 'إلكترونيات',
      brand: 'علامة تجارية'
    };
    
    const addResult = await testAPI(
      `http://localhost:3002/api/companies/${companyId}/products`,
      'POST',
      newProduct
    );
    
    console.log('📊 حالة الإضافة:', addResult.status);
    
    if (addResult.data.success) {
      console.log('✅ تم إضافة المنتج بنجاح');
      console.log('📦 المنتج المضاف:', addResult.data.data.name);
      console.log('🆔 معرف المنتج:', addResult.data.data.id);
    } else {
      console.log('❌ فشل في إضافة المنتج:', addResult.data.message);
      console.log('🔍 تفاصيل الخطأ:', addResult.data.error);
    }
    
    // اختبار جلب المنتجات مرة أخرى للتأكد
    console.log('\n🔄 اختبار جلب المنتجات بعد الإضافة...');
    const finalProductsResult = await testAPI(`http://localhost:3002/api/companies/${companyId}/products`);
    
    if (finalProductsResult.data.success) {
      console.log('✅ تم جلب المنتجات المحدثة');
      console.log('📦 العدد الجديد:', finalProductsResult.data.data.length);
    }
    
    console.log('\n🎉 انتهى الاختبار بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

// تشغيل الاختبارات
runTests()
  .then(() => {
    console.log('\n✅ تم الانتهاء من جميع الاختبارات');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل الاختبار:', error.message);
    process.exit(1);
  });
