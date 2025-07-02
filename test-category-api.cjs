/**
 * 🧪 اختبار إضافة فئة من خلال API
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

async function testCategoryAPI() {
  console.log('🧪 اختبار API الفئات...\n');
  
  const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
  
  try {
    // اختبار Health Check
    console.log('🏥 اختبار Health Check...');
    const healthResult = await testAPI('http://localhost:3002/api/health');
    console.log('📊 حالة الخادم:', healthResult.status);
    
    if (healthResult.data.success) {
      console.log('✅ الخادم يعمل بنجاح');
    } else {
      console.log('❌ مشكلة في الخادم');
      return;
    }
    
    // جلب الفئات الموجودة
    console.log('\n📂 جلب الفئات الموجودة...');
    const categoriesResult = await testAPI(`http://localhost:3002/api/companies/${companyId}/categories`);
    console.log('📊 حالة جلب الفئات:', categoriesResult.status);
    
    if (categoriesResult.data.success) {
      console.log('✅ تم جلب الفئات بنجاح');
      console.log('📂 عدد الفئات:', categoriesResult.data.data.length);
      
      categoriesResult.data.data.forEach((category, index) => {
        console.log(`  ${index + 1}. ${category.name} (${category.slug})`);
        console.log(`     - اللون: ${category.color}`);
        console.log(`     - الترتيب: ${category.sort_order}`);
        console.log(`     - نشط: ${category.is_active ? 'نعم' : 'لا'}`);
      });
    } else {
      console.log('❌ فشل في جلب الفئات:', categoriesResult.data.message);
    }
    
    // إضافة فئة جديدة من خلال API
    console.log('\n🆕 إضافة فئة جديدة من خلال API...');
    
    const newCategory = {
      name: 'فئة API تجريبية',
      description: 'فئة تم إضافتها من خلال API للاختبار',
      slug: 'api-test-category',
      sort_order: 2,
      is_active: true,
      color: '#28a745',
      icon: 'api-icon',
      image_url: 'https://example.com/api-test.jpg'
    };
    
    console.log('📝 بيانات الفئة الجديدة:');
    console.log(`  - الاسم: ${newCategory.name}`);
    console.log(`  - الرابط: ${newCategory.slug}`);
    console.log(`  - اللون: ${newCategory.color}`);
    console.log(`  - الترتيب: ${newCategory.sort_order}`);
    
    const addResult = await testAPI(
      `http://localhost:3002/api/companies/${companyId}/categories`,
      'POST',
      newCategory
    );
    
    console.log('\n📊 حالة إضافة الفئة:', addResult.status);
    
    if (addResult.data.success) {
      console.log('✅ تم إضافة الفئة بنجاح!');
      console.log('📂 معرف الفئة:', addResult.data.data.id);
      console.log('📝 اسم الفئة:', addResult.data.data.name);
      console.log('🔗 رابط الفئة:', addResult.data.data.slug);
      console.log('🎨 لون الفئة:', addResult.data.data.color);
      console.log('📅 تاريخ الإنشاء:', addResult.data.data.created_at);
      
      // التحقق من الفئة المضافة بجلب الفئات مرة أخرى
      console.log('\n🔄 التحقق من الفئة المضافة...');
      const updatedCategoriesResult = await testAPI(`http://localhost:3002/api/companies/${companyId}/categories`);
      
      if (updatedCategoriesResult.data.success) {
        console.log('✅ تم التحقق بنجاح');
        console.log('📂 العدد الجديد للفئات:', updatedCategoriesResult.data.data.length);
        
        // البحث عن الفئة المضافة
        const addedCategory = updatedCategoriesResult.data.data.find(
          cat => cat.id === addResult.data.data.id
        );
        
        if (addedCategory) {
          console.log('✅ تم العثور على الفئة المضافة في القائمة');
          console.log(`📝 تأكيد الاسم: ${addedCategory.name}`);
        } else {
          console.log('❌ لم يتم العثور على الفئة المضافة في القائمة');
        }
      }
      
    } else {
      console.log('❌ فشل في إضافة الفئة');
      console.log('📝 رسالة الخطأ:', addResult.data.message);
      console.log('🔍 تفاصيل الخطأ:', addResult.data.error);
    }
    
    // اختبار إضافة فئة بنفس الاسم (للتحقق من التحقق من التكرار)
    console.log('\n🔄 اختبار إضافة فئة مكررة...');
    
    const duplicateResult = await testAPI(
      `http://localhost:3002/api/companies/${companyId}/categories`,
      'POST',
      newCategory
    );
    
    console.log('📊 حالة إضافة الفئة المكررة:', duplicateResult.status);
    
    if (duplicateResult.data.success) {
      console.log('⚠️ تم إضافة فئة مكررة (قد تحتاج لإضافة تحقق من التكرار)');
    } else {
      console.log('✅ تم رفض الفئة المكررة بنجاح');
      console.log('📝 رسالة الرفض:', duplicateResult.data.message);
    }
    
    console.log('\n🎉 انتهى اختبار API الفئات!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
testCategoryAPI()
  .then(() => {
    console.log('\n✅ تم الانتهاء من اختبار API الفئات');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل اختبار API:', error.message);
    process.exit(1);
  });
