// فحص مشكلة تضارب المنتجات في API
const mysql = require('mysql2/promise');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function debugProductsAPI() {
  let connection;
  
  try {
    console.log('🔍 فحص مشكلة تضارب المنتجات...');
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    const companyId = '2d9b8887-0cca-430b-b61b-ca16cccfec63'; // kok@kok.com
    
    // فحص المنتجات الموجودة
    console.log('\n📦 فحص المنتجات الموجودة:');
    const [products] = await connection.execute(`
      SELECT id, name, status, featured, created_at
      FROM products 
      WHERE company_id = ?
      ORDER BY created_at DESC
    `, [companyId]);
    
    console.log(`📊 إجمالي المنتجات: ${products.length}`);
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      📊 الحالة: ${product.status}`);
      console.log(`      ⭐ مميز: ${product.featured ? 'نعم' : 'لا'}`);
      console.log(`      📅 تاريخ الإنشاء: ${product.created_at}`);
      console.log(`      🆔 المعرف: ${product.id}`);
      console.log('');
    });
    
    // فحص المنتجات النشطة فقط
    console.log('\n✅ فحص المنتجات النشطة فقط:');
    const [activeProducts] = await connection.execute(`
      SELECT id, name, status, featured, created_at
      FROM products 
      WHERE company_id = ? AND status = 'active'
      ORDER BY created_at DESC
    `, [companyId]);
    
    console.log(`📊 المنتجات النشطة: ${activeProducts.length}`);
    activeProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.featured ? 'مميز' : 'عادي'})`);
    });
    
    // فحص المنتجات المميزة
    console.log('\n⭐ فحص المنتجات المميزة:');
    const [featuredProducts] = await connection.execute(`
      SELECT id, name, status, featured, created_at
      FROM products 
      WHERE company_id = ? AND featured = 1
      ORDER BY created_at DESC
    `, [companyId]);
    
    console.log(`📊 المنتجات المميزة: ${featuredProducts.length}`);
    featuredProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.status})`);
    });
    
    // فحص وجود متجر للشركة
    console.log('\n🏪 فحص المتاجر:');
    const [stores] = await connection.execute(`
      SELECT id, name, is_active, created_at
      FROM stores 
      WHERE company_id = ?
    `, [companyId]);
    
    console.log(`📊 عدد المتاجر: ${stores.length}`);
    stores.forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name || 'بدون اسم'}`);
      console.log(`      📊 نشط: ${store.is_active ? 'نعم' : 'لا'}`);
      console.log(`      📅 تاريخ الإنشاء: ${store.created_at}`);
      console.log(`      🆔 المعرف: ${store.id}`);
    });
    
    // محاكاة استدعاء API مع فلاتر مختلفة
    console.log('\n🔧 محاكاة استدعاءات API:');
    
    // 1. جلب جميع المنتجات
    const [allProducts] = await connection.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.company_id = ?
      ORDER BY p.created_at DESC
    `, [companyId]);
    console.log(`1️⃣ جميع المنتجات: ${allProducts.length}`);
    
    // 2. جلب المنتجات النشطة فقط
    const [activeOnly] = await connection.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.company_id = ? AND p.status = 'active'
      ORDER BY p.created_at DESC
    `, [companyId]);
    console.log(`2️⃣ المنتجات النشطة: ${activeOnly.length}`);
    
    // 3. جلب المنتجات مع pagination
    const [paginatedProducts] = await connection.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.company_id = ? AND p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT 10 OFFSET 0
    `, [companyId]);
    console.log(`3️⃣ المنتجات مع pagination: ${paginatedProducts.length}`);
    
    // فحص إذا كان هناك منتجات مكررة
    console.log('\n🔍 فحص المنتجات المكررة:');
    const [duplicates] = await connection.execute(`
      SELECT name, COUNT(*) as count
      FROM products 
      WHERE company_id = ?
      GROUP BY name
      HAVING COUNT(*) > 1
    `, [companyId]);
    
    if (duplicates.length > 0) {
      console.log('⚠️ وجدت منتجات مكررة:');
      duplicates.forEach(dup => {
        console.log(`   - ${dup.name}: ${dup.count} مرة`);
      });
    } else {
      console.log('✅ لا توجد منتجات مكررة');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الفحص:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
debugProductsAPI()
  .then(() => {
    console.log('✅ انتهى الفحص بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل الفحص:', error);
    process.exit(1);
  });
