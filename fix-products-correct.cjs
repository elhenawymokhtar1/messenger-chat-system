/**
 * 🔧 إصلاح صحيح لجدول المنتجات
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations'
};

async function fixProductsCorrect() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    
    // أولاً: البحث عن متجر موجود للشركة
    console.log('🏪 البحث عن متجر للشركة...');
    
    const [existingStores] = await connection.execute(
      'SELECT id FROM stores WHERE company_id = ? LIMIT 1',
      [companyId]
    );
    
    let storeId;
    if (existingStores.length === 0) {
      // إنشاء متجر جديد
      storeId = uuidv4();
      await connection.execute(`
        INSERT INTO stores (
          id, company_id, name, slug, description, logo_url, banner_url, 
          theme_color, owner_email, currency, timezone, is_active, is_published, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        storeId,
        companyId,
        'المتجر الافتراضي',
        'default-store',
        'متجر الشركة الافتراضي',
        '',
        '',
        '#007bff',
        'admin@company.com',
        'EGP',
        'Africa/Cairo',
        1,
        1
      ]);
      console.log('✅ تم إنشاء متجر جديد:', storeId);
    } else {
      storeId = existingStores[0].id;
      console.log('✅ تم العثور على متجر موجود:', storeId);
    }
    
    // ثانياً: إنشاء فئة افتراضية
    console.log('📂 إنشاء فئة افتراضية...');
    
    const [existingCategories] = await connection.execute(
      'SELECT id FROM categories WHERE company_id = ? LIMIT 1',
      [companyId]
    );
    
    let categoryId;
    if (existingCategories.length === 0) {
      categoryId = uuidv4();
      await connection.execute(`
        INSERT INTO categories (
          id, company_id, name, slug, description, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        categoryId,
        companyId,
        'فئة عامة',
        'general',
        'فئة عامة للمنتجات',
        1
      ]);
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
        },
        {
          name: 'منتج تجريبي 3',
          description: 'وصف المنتج التجريبي الثالث',
          short_description: 'منتج جديد للاختبار',
          sku: 'TEST-003',
          price: 75.00,
          stock_quantity: 100
        }
      ];
      
      for (const product of testProducts) {
        const productId = uuidv4();
        await connection.execute(`
          INSERT INTO products (
            id, store_id, category_id, company_id, name, slug, description, short_description, 
            sku, price, sale_price, stock_quantity, status, featured, manage_stock, stock_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          productId,
          storeId,
          categoryId,
          companyId,
          product.name,
          product.name.replace(/\s+/g, '-').toLowerCase(),
          product.description,
          product.short_description,
          product.sku,
          product.price,
          product.sale_price || null,
          product.stock_quantity,
          'active',
          0,
          1,
          'in_stock'
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
      ORDER BY p.created_at DESC
      LIMIT 5
    `, [companyId]);
    
    console.log('\n📦 المنتجات الموجودة:');
    finalProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.sku}) - ${product.price} جنيه`);
      console.log(`    المتجر: ${product.store_name}, الفئة: ${product.category_name}`);
      console.log(`    المخزون: ${product.stock_quantity}, الحالة: ${product.status}`);
    });
    
    console.log('\n✅ تم إصلاح جدول المنتجات بنجاح!');
    console.log(`🏪 معرف المتجر: ${storeId}`);
    console.log(`📂 معرف الفئة: ${categoryId}`);
    console.log(`🏢 معرف الشركة: ${companyId}`);
    
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
fixProductsCorrect()
  .then(() => {
    console.log('\n🎉 انتهى الإصلاح بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل الإصلاح:', error.message);
    process.exit(1);
  });
