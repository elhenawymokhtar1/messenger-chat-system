// فحص جدول المنتجات
const mysql = require('mysql2/promise');

const config = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306
};

async function checkProductsTable() {
  try {
    const conn = await mysql.createConnection(config);
    
    // فحص وجود الجدول
    const [tables] = await conn.execute('SHOW TABLES LIKE "products"');
    console.log('📋 جدول المنتجات موجود:', tables.length > 0);
    
    if (tables.length > 0) {
      // فحص هيكل الجدول
      const [columns] = await conn.execute('DESCRIBE products');
      console.log('📊 أعمدة جدول المنتجات:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
      // فحص عدد المنتجات
      const [count] = await conn.execute('SELECT COUNT(*) as count FROM products');
      console.log('📦 عدد المنتجات:', count[0].count);
    } else {
      console.log('❌ جدول المنتجات غير موجود');
    }
    
    await conn.end();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

checkProductsTable();
