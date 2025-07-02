/**
 * 🔧 إصلاح بسيط لجدول المنتجات
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations'
};

async function fixProductsSimple() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // أولاً: إنشاء متجر افتراضي للشركة
    console.log('🏪 إنشاء متجر افتراضي...');
    
    const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    
    // التحقق من وجود المتجر
    const [existingStores] = await connection.execute(
      'SELECT id FROM stores WHERE company_id = ? LIMIT 1',
      [companyId]
    );
    
    let storeId;
    if (existingStores.length === 0) {
      // إنشاء متجر جديد
      const [storeResult] = await connection.execute(`
        INSERT INTO stores (
          company_id, name, description, logo_url, banner_url, 
          theme_color, currency, language, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        companyId,
        'المتجر الافتراضي',
        'متجر الشركة الافتراضي',
        '',
        '',
        '#007bff',
        'EGP',
        'ar',
        'active'
      ]);
      storeId = storeResult.insertId;
      console.log('✅ تم إنشاء متجر جديد:', storeId);
    } else {
      storeId = existingStores[0].id;
      console.log('✅ تم العثور على متجر موجود:', storeId);
    }
    
    // ثانياً: إنشاء فئة افتراضية
    console.log('📂 إنشاء فئة افتراضية...');
    
    const [existingCategories] = await connection.execute(
      'SELECT id FROM categories WHERE store_id = ? LIMIT 1',
      [storeId]
    );
    
    let categoryId;
    if (existingCategories.length === 0) {
      const [categoryResult] = await connection.execute(`
        INSERT INTO categories (
          store_id, name, slug, description, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        storeId,
        'فئة عامة',
        'general',
        'فئة عامة للمنتجات',
        'active'
      ]);
      categoryId = categoryResult.insertId;
      console.log('✅ تم إنشاء فئة جديدة:', categoryId);
    } else {
      categoryId = existingCategories[0].id;
      console.log('✅ تم العثور على فئة موجودة:', categoryId);
    }
    
    // ثالثاً: إضافة منتجات تجريبية
    console.log('📦 إضافة منتجات تجريبية...');
    
    const [existingProducts] = await connection.execute(
      'SELECT COUNT(*) as count FROM products WHERE store_id = ?',
      [storeId]
    );
    
    if (existingProducts[0].count === 0) {
      const testProducts = [
        {
          name: 'منتج تجريبي 1',
          description: 'وصف المنتج التجريبي الأول',
          short_description: 'منتج رائع للاختبار',
          sku: 'TEST-001',
          price: 100.00,
          stock_quantity: 50
        },
        {
          name: 'منتج تجريبي 2',
          description: 'وصف المنتج التجريبي الثاني',
          short_description: 'منتج ممتاز للاختبار',
          sku: 'TEST-002',
          price: 200.00,
          sale_price: 150.00,
          stock_quantity: 30
        }
      ];
      
      for (const product of testProducts) {
        await connection.execute(`
          INSERT INTO products (
            store_id, category_id, company_id, name, description, short_description, 
            sku, price, sale_price, stock_quantity, status, featured, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          storeId,
          categoryId,
          companyId,
          product.name,
          product.description,
          product.short_description,
          product.sku,
          product.price,
          product.sale_price || null,
          product.stock_quantity,
          'active',
          0
        ]);
      }
      
      console.log('✅ تم إضافة البيانات التجريبية');
    }
    
    // عرض النتيجة النهائية
    const [finalProducts] = await connection.execute(`
      SELECT p.*, s.name as store_name, c.name as category_name
      FROM products p
      LEFT JOIN stores s ON p.store_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.company_id = ? 
      LIMIT 5
    `, [companyId]);
    
    console.log('📦 المنتجات الموجودة:');
    finalProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.sku}) - ${product.price} جنيه`);
      console.log(`    المتجر: ${product.store_name}, الفئة: ${product.category_name}`);
    });
    
    console.log('✅ تم إصلاح جدول المنتجات بنجاح!');
    console.log(`🏪 معرف المتجر: ${storeId}`);
    console.log(`📂 معرف الفئة: ${categoryId}`);
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح جدول المنتجات:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// تشغيل الإصلاح
fixProductsSimple()
  .then(() => {
    console.log('🎉 انتهى الإصلاح بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل الإصلاح:', error.message);
    process.exit(1);
  });
