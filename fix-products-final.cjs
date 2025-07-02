/**
 * 🔧 إصلاح نهائي لجدول المنتجات
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations'
};

async function fixProductsFinal() {
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
    if (existingStores.length > 0) {
      storeId = existingStores[0].id;
      console.log('✅ تم العثور على متجر موجود:', storeId);
    } else {
      console.log('❌ لم يتم العثور على متجر للشركة');
      return;
    }
    
    // ثانياً: التحقق من جدول product_categories
    console.log('📂 التحقق من فئات المنتجات...');
    
    const [categoryTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_categories'
    `, [DB_CONFIG.database]);
    
    let categoryId = null;
    
    if (categoryTables.length > 0) {
      // البحث عن فئة موجودة
      const [existingCategories] = await connection.execute(
        'SELECT id FROM product_categories LIMIT 1'
      );
      
      if (existingCategories.length === 0) {
        // إنشاء فئة جديدة
        categoryId = uuidv4();
        await connection.execute(`
          INSERT INTO product_categories (
            id, name, slug, description, created_at, updated_at
          ) VALUES (?, ?, ?, ?, NOW(), NOW())
        `, [
          categoryId,
          'فئة عامة',
          'general',
          'فئة عامة للمنتجات'
        ]);
        console.log('✅ تم إنشاء فئة جديدة:', categoryId);
      } else {
        categoryId = existingCategories[0].id;
        console.log('✅ تم العثور على فئة موجودة:', categoryId);
      }
    } else {
      console.log('⚠️ جدول product_categories غير موجود، سيتم إضافة المنتجات بدون فئة');
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
          categoryId, // يمكن أن يكون null
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
    } else {
      console.log('ℹ️ توجد منتجات بالفعل في المتجر');
    }
    
    // عرض النتيجة النهائية
    const [finalProducts] = await connection.execute(`
      SELECT p.*, s.name as store_name
      FROM products p
      LEFT JOIN stores s ON p.store_id = s.id
      WHERE p.company_id = ? 
      ORDER BY p.created_at DESC
      LIMIT 5
    `, [companyId]);
    
    console.log('\n📦 المنتجات الموجودة:');
    finalProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.sku}) - ${product.price} جنيه`);
      console.log(`    المتجر: ${product.store_name}`);
      console.log(`    المخزون: ${product.stock_quantity}, الحالة: ${product.status}`);
    });
    
    console.log('\n✅ تم إصلاح جدول المنتجات بنجاح!');
    console.log(`🏪 معرف المتجر: ${storeId}`);
    console.log(`📂 معرف الفئة: ${categoryId || 'بدون فئة'}`);
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
fixProductsFinal()
  .then(() => {
    console.log('\n🎉 انتهى الإصلاح بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل الإصلاح:', error.message);
    process.exit(1);
  });
