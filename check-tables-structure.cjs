/**
 * 🔍 فحص بنية الجداول
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations'
};

async function checkTablesStructure() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // فحص جدول المتاجر
    console.log('\n🏪 بنية جدول stores:');
    const [storeColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'stores'
      ORDER BY ORDINAL_POSITION
    `, [DB_CONFIG.database]);
    
    storeColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // فحص جدول الفئات
    console.log('\n📂 بنية جدول categories:');
    const [categoryColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories'
      ORDER BY ORDINAL_POSITION
    `, [DB_CONFIG.database]);
    
    categoryColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // فحص جدول المنتجات
    console.log('\n📦 بنية جدول products:');
    const [productColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `, [DB_CONFIG.database]);
    
    productColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // فحص البيانات الموجودة
    console.log('\n📊 البيانات الموجودة:');
    
    const [storeCount] = await connection.execute('SELECT COUNT(*) as count FROM stores');
    console.log(`🏪 عدد المتاجر: ${storeCount[0].count}`);
    
    const [categoryCount] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    console.log(`📂 عدد الفئات: ${categoryCount[0].count}`);
    
    const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log(`📦 عدد المنتجات: ${productCount[0].count}`);
    
    // عرض بعض البيانات
    if (storeCount[0].count > 0) {
      console.log('\n🏪 المتاجر الموجودة:');
      const [stores] = await connection.execute('SELECT * FROM stores LIMIT 3');
      stores.forEach(store => {
        console.log(`  - ${store.name} (ID: ${store.id})`);
      });
    }
    
    if (categoryCount[0].count > 0) {
      console.log('\n📂 الفئات الموجودة:');
      const [categories] = await connection.execute('SELECT * FROM categories LIMIT 3');
      categories.forEach(category => {
        console.log(`  - ${category.name} (ID: ${category.id}, Store: ${category.store_id})`);
      });
    }
    
    if (productCount[0].count > 0) {
      console.log('\n📦 المنتجات الموجودة:');
      const [products] = await connection.execute('SELECT * FROM products LIMIT 3');
      products.forEach(product => {
        console.log(`  - ${product.name} (ID: ${product.id}, Store: ${product.store_id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص الجداول:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// تشغيل الفحص
checkTablesStructure()
  .then(() => {
    console.log('\n✅ انتهى الفحص بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل الفحص:', error.message);
    process.exit(1);
  });
