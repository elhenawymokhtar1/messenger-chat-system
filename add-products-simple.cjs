/**
 * 🔧 إضافة منتجات بسيطة
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations'
};

async function addProductsSimple() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    
    // البحث عن متجر موجود
    console.log('🏪 البحث عن متجر...');
    const [stores] = await connection.execute(
      'SELECT id FROM stores WHERE company_id = ? LIMIT 1',
      [companyId]
    );
    
    if (stores.length === 0) {
      console.log('❌ لم يتم العثور على متجر للشركة');
      return;
    }
    
    const storeId = stores[0].id;
    console.log('✅ تم العثور على متجر:', storeId);
    
    // حذف المنتجات الموجودة للشركة (للبدء من جديد)
    console.log('🗑️ حذف المنتجات الموجودة...');
    await connection.execute(
      'DELETE FROM products WHERE company_id = ?',
      [companyId]
    );
    
    // إضافة منتجات جديدة بدون قيود
    console.log('📦 إضافة منتجات جديدة...');
    
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
          id, store_id, company_id, name, slug, description, short_description, 
          sku, price, sale_price, stock_quantity, status, featured, manage_stock, stock_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        productId,
        storeId,
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
      
      console.log(`✅ تم إضافة: ${product.name}`);
    }
    
    // عرض النتيجة
    const [finalProducts] = await connection.execute(`
      SELECT p.*, s.name as store_name
      FROM products p
      LEFT JOIN stores s ON p.store_id = s.id
      WHERE p.company_id = ? 
      ORDER BY p.created_at DESC
    `, [companyId]);
    
    console.log('\n📦 المنتجات المضافة:');
    finalProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.sku}) - ${product.price} جنيه`);
      console.log(`    المتجر: ${product.store_name}`);
      console.log(`    المخزون: ${product.stock_quantity}`);
    });
    
    console.log('\n✅ تم إضافة المنتجات بنجاح!');
    console.log(`📊 إجمالي المنتجات: ${finalProducts.length}`);
    
  } catch (error) {
    console.error('❌ خطأ في إضافة المنتجات:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// تشغيل الإضافة
addProductsSimple()
  .then(() => {
    console.log('\n🎉 انتهت العملية بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشلت العملية:', error.message);
    process.exit(1);
  });
