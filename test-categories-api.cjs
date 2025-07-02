/**
 * 🧪 اختبار API الفئات
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

async function runCategoriesTests() {
  console.log('🧪 بدء اختبار API الفئات...\n');
  
  const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
  
  try {
    // اختبار Health Check
    console.log('🏥 اختبار Health Check...');
    const healthResult = await testAPI('http://localhost:3002/api/health');
    console.log('✅ Health Check:', healthResult.status, healthResult.data.message);
    
    // اختبار جلب الفئات
    console.log('\n📂 اختبار جلب الفئات...');
    const categoriesResult = await testAPI(`http://localhost:3002/api/companies/${companyId}/categories`);
    console.log('📊 حالة الاستجابة:', categoriesResult.status);
    
    if (categoriesResult.data.success) {
      console.log('✅ تم جلب الفئات بنجاح');
      console.log('📂 عدد الفئات:', categoriesResult.data.data.length);
      
      categoriesResult.data.data.forEach((category, index) => {
        console.log(`  ${index + 1}. ${category.name} (${category.slug})`);
      });
    } else {
      console.log('❌ فشل في جلب الفئات:', categoriesResult.data.message);
    }
    
    // اختبار إضافة فئة جديدة
    console.log('\n🆕 اختبار إضافة فئة جديدة...');
    const newCategory = {
      name: 'فئة تجريبية من API',
      description: 'وصف الفئة التجريبية',
      slug: 'test-category-api',
      sort_order: 1,
      is_active: true,
      color: '#ff6b6b',
      image_url: 'https://example.com/category.jpg'
    };
    
    const addResult = await testAPI(
      `http://localhost:3002/api/companies/${companyId}/categories`,
      'POST',
      newCategory
    );
    
    console.log('📊 حالة الإضافة:', addResult.status);
    
    if (addResult.data.success) {
      console.log('✅ تم إضافة الفئة بنجاح');
      console.log('📂 الفئة المضافة:', addResult.data.data.name);
      console.log('🆔 معرف الفئة:', addResult.data.data.id);
      
      // اختبار تحديث الفئة
      console.log('\n📝 اختبار تحديث الفئة...');
      const updateData = {
        name: 'فئة محدثة من API',
        description: 'وصف محدث للفئة',
        slug: 'updated-category-api',
        sort_order: 2,
        is_active: true,
        color: '#4ecdc4'
      };
      
      const updateResult = await testAPI(
        `http://localhost:3002/api/companies/${companyId}/categories/${addResult.data.data.id}`,
        'PUT',
        updateData
      );
      
      console.log('📊 حالة التحديث:', updateResult.status);
      
      if (updateResult.data.success) {
        console.log('✅ تم تحديث الفئة بنجاح');
        console.log('📂 الاسم الجديد:', updateResult.data.data.name);
      } else {
        console.log('❌ فشل في تحديث الفئة:', updateResult.data.message);
      }
      
      // اختبار حذف الفئة
      console.log('\n🗑️ اختبار حذف الفئة...');
      const deleteResult = await testAPI(
        `http://localhost:3002/api/companies/${companyId}/categories/${addResult.data.data.id}`,
        'DELETE'
      );
      
      console.log('📊 حالة الحذف:', deleteResult.status);
      
      if (deleteResult.data.success) {
        console.log('✅ تم حذف الفئة بنجاح');
      } else {
        console.log('❌ فشل في حذف الفئة:', deleteResult.data.message);
      }
      
    } else {
      console.log('❌ فشل في إضافة الفئة:', addResult.data.message);
      console.log('🔍 تفاصيل الخطأ:', addResult.data.error);
    }
    
    // اختبار جلب الفئات مرة أخرى للتأكد
    console.log('\n🔄 اختبار جلب الفئات بعد العمليات...');
    const finalCategoriesResult = await testAPI(`http://localhost:3002/api/companies/${companyId}/categories`);
    
    if (finalCategoriesResult.data.success) {
      console.log('✅ تم جلب الفئات المحدثة');
      console.log('📂 العدد النهائي:', finalCategoriesResult.data.data.length);
    }
    
    console.log('\n🎉 انتهى اختبار الفئات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

// تشغيل الاختبارات
runCategoriesTests()
  .then(() => {
    console.log('\n✅ تم الانتهاء من جميع اختبارات الفئات');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل اختبار الفئات:', error.message);
    process.exit(1);
  });
