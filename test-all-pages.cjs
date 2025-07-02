/**
 * 🧪 اختبار جميع الصفحات الجاهزة
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

async function testAllPages() {
  console.log('🧪 بدء اختبار جميع الصفحات الجاهزة...\n');
  
  const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
  
  try {
    // اختبار Health Check
    console.log('🏥 اختبار Health Check...');
    const healthResult = await testAPI('http://localhost:3002/api/health');
    console.log('✅ Health Check:', healthResult.status, healthResult.data.message);
    
    // ==========================================
    // 🛍️ اختبار المنتجات
    // ==========================================
    console.log('\n📦 ========== اختبار المنتجات ==========');
    
    // جلب المنتجات
    console.log('🔍 جلب المنتجات...');
    const productsResult = await testAPI(`http://localhost:3002/api/companies/${companyId}/products`);
    console.log('📊 حالة الاستجابة:', productsResult.status);
    
    if (productsResult.data.success) {
      console.log('✅ تم جلب المنتجات بنجاح');
      console.log('📦 عدد المنتجات:', productsResult.data.data.length);
      
      productsResult.data.data.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - ${product.price} جنيه (${product.sku})`);
      });
    } else {
      console.log('❌ فشل في جلب المنتجات:', productsResult.data.message);
    }
    
    // إضافة منتج جديد
    console.log('\n🆕 إضافة منتج جديد...');
    const newProduct = {
      name: 'منتج اختبار شامل',
      description: 'وصف المنتج للاختبار الشامل',
      short_description: 'منتج رائع للاختبار',
      price: 299.99,
      stock_quantity: 15,
      category: 'اختبار',
      brand: 'علامة تجارية'
    };
    
    const addProductResult = await testAPI(
      `http://localhost:3002/api/companies/${companyId}/products`,
      'POST',
      newProduct
    );
    
    console.log('📊 حالة إضافة المنتج:', addProductResult.status);
    
    if (addProductResult.data.success) {
      console.log('✅ تم إضافة المنتج بنجاح');
      console.log('📦 المنتج المضاف:', addProductResult.data.data.name);
    } else {
      console.log('❌ فشل في إضافة المنتج:', addProductResult.data.message);
    }
    
    // ==========================================
    // 🏷️ اختبار الفئات
    // ==========================================
    console.log('\n📂 ========== اختبار الفئات ==========');
    
    // جلب الفئات
    console.log('🔍 جلب الفئات...');
    const categoriesResult = await testAPI(`http://localhost:3002/api/companies/${companyId}/categories`);
    console.log('📊 حالة الاستجابة:', categoriesResult.status);
    
    if (categoriesResult.data.success) {
      console.log('✅ تم جلب الفئات بنجاح');
      console.log('📂 عدد الفئات:', categoriesResult.data.data.length);
      
      categoriesResult.data.data.slice(0, 3).forEach((category, index) => {
        console.log(`  ${index + 1}. ${category.name} (${category.slug})`);
      });
    } else {
      console.log('❌ فشل في جلب الفئات:', categoriesResult.data.message);
    }
    
    // إضافة فئة جديدة
    console.log('\n🆕 إضافة فئة جديدة...');
    const newCategory = {
      name: 'فئة اختبار شامل',
      description: 'وصف الفئة للاختبار الشامل',
      slug: 'test-category-comprehensive',
      sort_order: 1,
      is_active: true,
      color: '#28a745'
    };
    
    const addCategoryResult = await testAPI(
      `http://localhost:3002/api/companies/${companyId}/categories`,
      'POST',
      newCategory
    );
    
    console.log('📊 حالة إضافة الفئة:', addCategoryResult.status);
    
    if (addCategoryResult.data.success) {
      console.log('✅ تم إضافة الفئة بنجاح');
      console.log('📂 الفئة المضافة:', addCategoryResult.data.data.name);
    } else {
      console.log('❌ فشل في إضافة الفئة:', addCategoryResult.data.message);
    }
    
    // ==========================================
    // 🎫 اختبار الكوبونات
    // ==========================================
    console.log('\n🎫 ========== اختبار الكوبونات ==========');
    
    // جلب الكوبونات
    console.log('🔍 جلب الكوبونات...');
    const couponsResult = await testAPI(`http://localhost:3002/api/companies/${companyId}/coupons`);
    console.log('📊 حالة الاستجابة:', couponsResult.status);
    
    if (couponsResult.data.success) {
      console.log('✅ تم جلب الكوبونات بنجاح');
      console.log('🎫 عدد الكوبونات:', couponsResult.data.data.length);
      
      couponsResult.data.data.slice(0, 3).forEach((coupon, index) => {
        console.log(`  ${index + 1}. ${coupon.code} - ${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : ' جنيه'}`);
      });
    } else {
      console.log('❌ فشل في جلب الكوبونات:', couponsResult.data.message);
    }
    
    // إضافة كوبون جديد
    console.log('\n🆕 إضافة كوبون جديد...');
    const newCoupon = {
      code: 'TEST2024',
      name: 'كوبون اختبار شامل',
      description: 'كوبون للاختبار الشامل',
      discount_type: 'percentage',
      discount_value: 15,
      min_amount: 100,
      usage_limit: 50,
      is_active: true
    };
    
    const addCouponResult = await testAPI(
      `http://localhost:3002/api/companies/${companyId}/coupons`,
      'POST',
      newCoupon
    );
    
    console.log('📊 حالة إضافة الكوبون:', addCouponResult.status);
    
    if (addCouponResult.data.success) {
      console.log('✅ تم إضافة الكوبون بنجاح');
      console.log('🎫 الكوبون المضاف:', addCouponResult.data.data.code);
    } else {
      console.log('❌ فشل في إضافة الكوبون:', addCouponResult.data.message);
    }
    
    // ==========================================
    // 📊 ملخص النتائج
    // ==========================================
    console.log('\n📊 ========== ملخص النتائج ==========');
    
    const results = {
      products: productsResult.data.success,
      categories: categoriesResult.data.success,
      coupons: couponsResult.data.success,
      addProduct: addProductResult.data.success,
      addCategory: addCategoryResult.data.success,
      addCoupon: addCouponResult.data.success
    };
    
    console.log('✅ المنتجات - جلب:', results.products ? '✓' : '✗');
    console.log('✅ المنتجات - إضافة:', results.addProduct ? '✓' : '✗');
    console.log('✅ الفئات - جلب:', results.categories ? '✓' : '✗');
    console.log('✅ الفئات - إضافة:', results.addCategory ? '✓' : '✗');
    console.log('✅ الكوبونات - جلب:', results.coupons ? '✓' : '✗');
    console.log('✅ الكوبونات - إضافة:', results.addCoupon ? '✓' : '✗');
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 النتيجة النهائية: ${successCount}/${totalTests} اختبار نجح`);
    
    if (successCount === totalTests) {
      console.log('🎉 جميع الاختبارات نجحت! النظام جاهز للاستخدام');
    } else {
      console.log('⚠️ بعض الاختبارات فشلت، يرجى مراجعة الأخطاء أعلاه');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

// تشغيل الاختبارات
testAllPages()
  .then(() => {
    console.log('\n✅ تم الانتهاء من جميع الاختبارات');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل الاختبار:', error.message);
    process.exit(1);
  });
