/**
 * 🧪 اختبار مباشر لـ API الفئات
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

async function testCategoriesDirect() {
  console.log('🧪 اختبار مباشر لـ API الفئات...\n');
  
  const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
  
  try {
    // اختبار Health Check
    console.log('🏥 اختبار Health Check...');
    const healthResult = await testAPI('http://localhost:3002/api/health');
    console.log('📊 حالة الخادم:', healthResult.status);
    console.log('📝 استجابة الخادم:', JSON.stringify(healthResult.data, null, 2));
    
    // اختبار جلب الفئات
    console.log('\n📂 اختبار جلب الفئات...');
    const categoriesResult = await testAPI(`http://localhost:3002/api/companies/${companyId}/categories`);
    console.log('📊 حالة جلب الفئات:', categoriesResult.status);
    console.log('📝 استجابة الفئات:', JSON.stringify(categoriesResult.data, null, 2));
    
    if (categoriesResult.data.success) {
      console.log('\n✅ تم جلب الفئات بنجاح');
      console.log('📂 عدد الفئات:', categoriesResult.data.data.length);
      
      categoriesResult.data.data.forEach((category, index) => {
        console.log(`\n  ${index + 1}. الفئة:`);
        console.log(`     - المعرف: ${category.id}`);
        console.log(`     - الاسم: ${category.name}`);
        console.log(`     - الرابط: ${category.slug}`);
        console.log(`     - الوصف: ${category.description || 'لا يوجد'}`);
        console.log(`     - اللون: ${category.color || 'لا يوجد'}`);
        console.log(`     - الترتيب: ${category.sort_order}`);
        console.log(`     - نشط: ${category.is_active ? 'نعم' : 'لا'}`);
        console.log(`     - تاريخ الإنشاء: ${category.created_at}`);
      });
    } else {
      console.log('❌ فشل في جلب الفئات');
      console.log('📝 رسالة الخطأ:', categoriesResult.data.message);
      console.log('🔍 تفاصيل الخطأ:', categoriesResult.data.error);
    }
    
    // اختبار إضافة فئة جديدة
    console.log('\n🆕 اختبار إضافة فئة جديدة...');
    
    const newCategory = {
      name: 'فئة اختبار مباشر',
      description: 'فئة تم إضافتها للاختبار المباشر',
      slug: 'direct-test-category',
      sort_order: 3,
      is_active: true,
      color: '#dc3545',
      icon: 'test-icon'
    };
    
    console.log('📝 بيانات الفئة الجديدة:');
    console.log(JSON.stringify(newCategory, null, 2));
    
    const addResult = await testAPI(
      `http://localhost:3002/api/companies/${companyId}/categories`,
      'POST',
      newCategory
    );
    
    console.log('\n📊 حالة إضافة الفئة:', addResult.status);
    console.log('📝 استجابة الإضافة:', JSON.stringify(addResult.data, null, 2));
    
    if (addResult.data.success) {
      console.log('\n✅ تم إضافة الفئة بنجاح!');
      console.log('📂 معرف الفئة الجديدة:', addResult.data.data.id);
      console.log('📝 اسم الفئة الجديدة:', addResult.data.data.name);
      
      // التحقق من الفئة المضافة
      console.log('\n🔄 التحقق من الفئة المضافة...');
      const verifyResult = await testAPI(`http://localhost:3002/api/companies/${companyId}/categories`);
      
      if (verifyResult.data.success) {
        console.log('✅ تم التحقق بنجاح');
        console.log('📂 العدد الجديد للفئات:', verifyResult.data.data.length);
        
        const addedCategory = verifyResult.data.data.find(
          cat => cat.id === addResult.data.data.id
        );
        
        if (addedCategory) {
          console.log('✅ تم العثور على الفئة المضافة');
        } else {
          console.log('❌ لم يتم العثور على الفئة المضافة');
        }
      }
    } else {
      console.log('❌ فشل في إضافة الفئة');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
testCategoriesDirect()
  .then(() => {
    console.log('\n🎉 انتهى الاختبار المباشر');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل الاختبار:', error.message);
    process.exit(1);
  });
