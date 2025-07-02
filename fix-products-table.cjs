/**
 * 🔧 إصلاح جدول المنتجات
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations'
};

async function fixProductsTable() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // التحقق من وجود الجدول
    console.log('🔍 التحقق من جدول المنتجات...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
    `, [DB_CONFIG.database]);
    
    if (tables.length === 0) {
      console.log('📦 إنشاء جدول المنتجات...');
      await connection.execute(`
        CREATE TABLE products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          company_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          short_description TEXT,
          sku VARCHAR(100) UNIQUE,
          price DECIMAL(10,2) DEFAULT 0,
          sale_price DECIMAL(10,2) NULL,
          stock_quantity INT DEFAULT 0,
          category VARCHAR(100),
          brand VARCHAR(100),
          image_url TEXT,
          featured BOOLEAN DEFAULT FALSE,
          weight DECIMAL(8,2) NULL,
          status ENUM('active', 'inactive', 'draft') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_company_id (company_id),
          INDEX idx_status (status),
          INDEX idx_category (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ تم إنشاء جدول المنتجات بنجاح');
    } else {
      console.log('📋 الجدول موجود، التحقق من الأعمدة...');
      
      // التحقق من الأعمدة
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
      `, [DB_CONFIG.database]);
      
      const columnNames = columns.map(col => col.COLUMN_NAME);
      console.log('📋 الأعمدة الموجودة:', columnNames);
      
      // إضافة الأعمدة المفقودة
      const requiredColumns = [
        { name: 'company_id', definition: 'VARCHAR(255) NOT NULL' },
        { name: 'name', definition: 'VARCHAR(255) NOT NULL' },
        { name: 'description', definition: 'TEXT' },
        { name: 'short_description', definition: 'TEXT' },
        { name: 'sku', definition: 'VARCHAR(100) UNIQUE' },
        { name: 'price', definition: 'DECIMAL(10,2) DEFAULT 0' },
        { name: 'sale_price', definition: 'DECIMAL(10,2) NULL' },
        { name: 'stock_quantity', definition: 'INT DEFAULT 0' },
        { name: 'category', definition: 'VARCHAR(100)' },
        { name: 'brand', definition: 'VARCHAR(100)' },
        { name: 'image_url', definition: 'TEXT' },
        { name: 'featured', definition: 'BOOLEAN DEFAULT FALSE' },
        { name: 'weight', definition: 'DECIMAL(8,2) NULL' },
        { name: 'status', definition: "ENUM('active', 'inactive', 'draft') DEFAULT 'active'" }
      ];
      
      for (const column of requiredColumns) {
        if (!columnNames.includes(column.name)) {
          console.log(`➕ إضافة عمود: ${column.name}`);
          await connection.execute(`
            ALTER TABLE products ADD COLUMN ${column.name} ${column.definition}
          `);
        }
      }
      
      // إضافة الفهارس إذا لم تكن موجودة
      try {
        await connection.execute('CREATE INDEX idx_company_id ON products (company_id)');
        console.log('✅ تم إضافة فهرس company_id');
      } catch (e) {
        // الفهرس موجود بالفعل
      }
      
      try {
        await connection.execute('CREATE INDEX idx_status ON products (status)');
        console.log('✅ تم إضافة فهرس status');
      } catch (e) {
        // الفهرس موجود بالفعل
      }
    }
    
    // إضافة بعض البيانات التجريبية
    console.log('📦 إضافة بيانات تجريبية...');
    
    const [existing] = await connection.execute(
      'SELECT COUNT(*) as count FROM products WHERE company_id = ?',
      ['c677b32f-fe1c-4c64-8362-a1c03406608d']
    );
    
    if (existing[0].count === 0) {
      const testProducts = [
        {
          company_id: 'c677b32f-fe1c-4c64-8362-a1c03406608d',
          name: 'منتج تجريبي 1',
          description: 'وصف المنتج التجريبي الأول',
          short_description: 'منتج رائع للاختبار',
          sku: 'TEST-001',
          price: 100.00,
          stock_quantity: 50,
          category: 'إلكترونيات',
          brand: 'علامة تجارية',
          status: 'active'
        },
        {
          company_id: 'c677b32f-fe1c-4c64-8362-a1c03406608d',
          name: 'منتج تجريبي 2',
          description: 'وصف المنتج التجريبي الثاني',
          short_description: 'منتج ممتاز للاختبار',
          sku: 'TEST-002',
          price: 200.00,
          sale_price: 150.00,
          stock_quantity: 30,
          category: 'ملابس',
          brand: 'علامة تجارية',
          status: 'active'
        }
      ];
      
      for (const product of testProducts) {
        await connection.execute(`
          INSERT INTO products (
            company_id, name, description, short_description, sku, 
            price, sale_price, stock_quantity, category, brand, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          product.company_id,
          product.name,
          product.description,
          product.short_description,
          product.sku,
          product.price,
          product.sale_price || null,
          product.stock_quantity,
          product.category,
          product.brand,
          product.status
        ]);
      }
      
      console.log('✅ تم إضافة البيانات التجريبية');
    }
    
    // عرض النتيجة النهائية
    const [finalProducts] = await connection.execute(
      'SELECT * FROM products WHERE company_id = ? LIMIT 5',
      ['c677b32f-fe1c-4c64-8362-a1c03406608d']
    );
    
    console.log('📦 المنتجات الموجودة:');
    finalProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.sku}) - ${product.price} جنيه`);
    });
    
    console.log('✅ تم إصلاح جدول المنتجات بنجاح!');
    
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
fixProductsTable()
  .then(() => {
    console.log('🎉 انتهى الإصلاح بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل الإصلاح:', error.message);
    process.exit(1);
  });
