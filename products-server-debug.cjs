// خادم المنتجات مع debugging محسن
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

const app = express();
const PORT = 3003;

// إعدادات قاعدة البيانات
const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306
};

// Middleware
app.use(cors());
app.use(express.json());

// Middleware للـ logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, req.body ? JSON.stringify(req.body) : '');
  next();
});

// دالة الاتصال بقاعدة البيانات
async function executeQuery(query, params = []) {
  console.log('🔍 [DB] تنفيذ استعلام:', query);
  console.log('📋 [DB] المعاملات:', params);

  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ [DB] تم الاتصال بقاعدة البيانات');

    const [rows] = await connection.execute(query, params);
    console.log('✅ [DB] تم تنفيذ الاستعلام بنجاح، النتائج:', rows.length, 'صف');

    return rows;
  } catch (error) {
    console.error('❌ [DB] خطأ في الاستعلام:', error.message);
    console.error('📍 [DB] تفاصيل الخطأ:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 [DB] تم إغلاق الاتصال');
    }
  }
}

// Health check
app.get('/api/health', (req, res) => {
  console.log('💚 [HEALTH] فحص حالة الخادم');
  res.json({
    success: true,
    message: 'Products API Server is running',
    timestamp: new Date().toISOString()
  });
});

// جلب المنتجات للشركة
app.get('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('🔍 [PRODUCTS] جلب المنتجات للشركة:', companyId);

    const products = await executeQuery(
      'SELECT * FROM products_temp WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );

    console.log('✅ [PRODUCTS] تم جلب', products.length, 'منتج');

    res.json({
      success: true,
      data: products || []
    });
  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في جلب المنتجات:', error.message);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب المنتجات: ' + error.message
    });
  }
});

// إضافة منتج جديد
app.post('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    const data = req.body;

    console.log('🏪 [PRODUCTS] إضافة منتج جديد للشركة:', companyId);
    console.log('📦 [PRODUCTS] بيانات المنتج:', JSON.stringify(data, null, 2));

    // التحقق من البيانات المطلوبة
    if (!data.name || data.name.trim() === '') {
      console.log('⚠️ [PRODUCTS] اسم المنتج مفقود');
      return res.status(400).json({
        success: false,
        message: 'اسم المنتج مطلوب'
      });
    }

    const productId = crypto.randomUUID();
    console.log('🆔 [PRODUCTS] معرف المنتج الجديد:', productId);

    // إعداد البيانات
    const insertData = [
      productId,
      companyId,
      data.name.trim(),
      data.description || '',
      data.short_description || '',
      data.sku || `SKU-${Date.now()}`,
      parseFloat(data.price) || 0,
      data.sale_price ? parseFloat(data.sale_price) : null,
      parseInt(data.stock_quantity) || 0,
      data.category || '',
      data.brand || '',
      data.image_url || '',
      data.featured ? 1 : 0,
      data.weight ? parseFloat(data.weight) : null,
      data.status || 'active'
    ];

    console.log('📋 [PRODUCTS] بيانات الإدراج:', insertData);

    // إنشاء جدول منتجات مؤقت بدون foreign key للاختبار
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS products_temp (
        id CHAR(36) PRIMARY KEY,
        company_id CHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        short_description TEXT,
        sku VARCHAR(100),
        price DECIMAL(10,2) DEFAULT 0,
        sale_price DECIMAL(10,2) NULL,
        stock_quantity INT DEFAULT 0,
        category VARCHAR(100),
        brand VARCHAR(100),
        image_url TEXT,
        featured BOOLEAN DEFAULT FALSE,
        weight DECIMAL(8,2) NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await executeQuery(`
      INSERT INTO products_temp (
        id, company_id, name, description, short_description, sku,
        price, sale_price, stock_quantity, category, brand,
        image_url, featured, weight, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, insertData);

    console.log('✅ [PRODUCTS] تم إدراج المنتج في قاعدة البيانات');

    // جلب المنتج المُنشأ
    const newProduct = await executeQuery(
      'SELECT * FROM products_temp WHERE id = ?',
      [productId]
    );

    console.log('✅ [PRODUCTS] تم إضافة المنتج بنجاح');

    res.json({
      success: true,
      data: newProduct[0]
    });
  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في إضافة المنتج:', error.message);
    console.error('📍 [PRODUCTS] تفاصيل الخطأ:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إضافة المنتج: ' + error.message
    });
  }
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 Products API Server running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
  console.log(`📦 Products: http://localhost:${PORT}/api/companies/:companyId/products`);
});

// معالجة الأخطاء العامة
process.on('uncaughtException', (error) => {
  console.error('❌ [UNCAUGHT EXCEPTION]:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [UNHANDLED REJECTION]:', reason);
});
