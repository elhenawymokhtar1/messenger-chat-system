// 🗄️ MySQL Connection Pool Manager
// إدارة تجمع اتصالات MySQL للمتجر الإلكتروني

const mysql = require('mysql2/promise');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: process.env.DB_HOST || '193.203.168.103',
  user: process.env.DB_USER || 'u384034873_conversations',
  password: process.env.DB_PASSWORD || 'Mokhtar123@',
  database: process.env.DB_NAME || 'u384034873_conversations',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false
};

// إنشاء تجمع الاتصالات
const pool = mysql.createPool(dbConfig);

// 🔍 اختبار الاتصال
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ [DATABASE] اتصال MySQL نجح!');
    
    // اختبار استعلام بسيط
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('🔍 [DATABASE] اختبار الاستعلام نجح:', rows[0]);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ [DATABASE] خطأ في الاتصال:', error.message);
    return false;
  }
}

// 🛠️ تنفيذ استعلام مع معالجة الأخطاء
async function executeQuery(query, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ [DATABASE] خطأ في الاستعلام:', error.message);
    console.error('🔍 [DATABASE] الاستعلام:', query);
    console.error('🔍 [DATABASE] المعاملات:', params);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// 🛠️ تنفيذ معاملة (Transaction)
async function executeTransaction(queries) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    console.log('✅ [DATABASE] المعاملة نجحت');
    return results;
  } catch (error) {
    if (connection) {
      await connection.rollback();
      console.error('🔄 [DATABASE] تم التراجع عن المعاملة');
    }
    console.error('❌ [DATABASE] خطأ في المعاملة:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// 🔍 الحصول على معلومات قاعدة البيانات
async function getDatabaseInfo() {
  try {
    const [version] = await executeQuery('SELECT VERSION() as version');
    const [tables] = await executeQuery('SHOW TABLES');
    
    return {
      version: version[0].version,
      tables: tables.map(row => Object.values(row)[0]),
      connectionCount: pool._allConnections?.length || 0,
      freeConnections: pool._freeConnections?.length || 0
    };
  } catch (error) {
    console.error('❌ [DATABASE] خطأ في الحصول على معلومات قاعدة البيانات:', error.message);
    return null;
  }
}

// 🛠️ إنشاء جداول المتجر إذا لم تكن موجودة
async function createStoreTablesIfNotExists() {
  const tables = [
    // جدول المتاجر
    `CREATE TABLE IF NOT EXISTS stores (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      logo_url VARCHAR(500),
      banner_url VARCHAR(500),
      theme_color VARCHAR(7) DEFAULT '#007bff',
      currency VARCHAR(3) DEFAULT 'USD',
      is_active BOOLEAN DEFAULT true,
      settings JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_company_id (company_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // جدول الفئات
    `CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY,
      store_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      image_url VARCHAR(500),
      parent_id VARCHAR(36) NULL,
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_store_id (store_id),
      INDEX idx_parent_id (parent_id),
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // جدول المنتجات
    `CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) PRIMARY KEY,
      store_id VARCHAR(36) NOT NULL,
      category_id VARCHAR(36),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      short_description VARCHAR(500),
      sku VARCHAR(100) UNIQUE,
      price DECIMAL(10,2) NOT NULL,
      compare_price DECIMAL(10,2),
      cost_price DECIMAL(10,2),
      stock_quantity INT DEFAULT 0,
      track_inventory BOOLEAN DEFAULT true,
      allow_backorder BOOLEAN DEFAULT false,
      weight DECIMAL(8,2),
      dimensions JSON,
      images JSON,
      status ENUM('active', 'draft', 'archived') DEFAULT 'active',
      featured BOOLEAN DEFAULT false,
      seo_title VARCHAR(255),
      seo_description TEXT,
      tags JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_store_id (store_id),
      INDEX idx_category_id (category_id),
      INDEX idx_sku (sku),
      INDEX idx_status (status),
      FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  ];

  try {
    for (const tableQuery of tables) {
      await executeQuery(tableQuery);
    }
    console.log('✅ [DATABASE] تم إنشاء جداول المتجر بنجاح');
    return true;
  } catch (error) {
    console.error('❌ [DATABASE] خطأ في إنشاء جداول المتجر:', error.message);
    return false;
  }
}

// 🔄 إغلاق تجمع الاتصالات
async function closePool() {
  try {
    await pool.end();
    console.log('✅ [DATABASE] تم إغلاق تجمع الاتصالات');
  } catch (error) {
    console.error('❌ [DATABASE] خطأ في إغلاق تجمع الاتصالات:', error.message);
  }
}

// تصدير الوحدة
module.exports = {
  pool,
  testConnection,
  executeQuery,
  executeTransaction,
  getDatabaseInfo,
  createStoreTablesIfNotExists,
  closePool
};

// اختبار الاتصال عند تحميل الوحدة
testConnection().then(success => {
  if (success) {
    console.log('🔌 [DATABASE] تم إنشاء تجمع اتصالات MySQL بنجاح');
    // إنشاء الجداول إذا لم تكن موجودة
    createStoreTablesIfNotExists();
  } else {
    console.error('🚫 [DATABASE] فشل في إنشاء تجمع الاتصالات');
  }
});
