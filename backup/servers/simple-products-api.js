/**
 * 🛍️ خادم API بسيط للمنتجات - اتصال مباشر بقاعدة البيانات البعيدة
 */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());

// إعدادات قاعدة البيانات البعيدة
const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations'
};

console.log('🚀 بدء تشغيل خادم API المنتجات...');

// 🏥 Health Check
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({
    success: true,
    message: 'Products API Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// 📦 جلب جميع المنتجات للشركة
app.get('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('🔍 جلب المنتجات للشركة:', companyId);

    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    const selectQuery = `SELECT * FROM products WHERE company_id = ? ORDER BY created_at DESC`;
    const [rows] = await connection.execute(selectQuery, [companyId]);
    
    await connection.end();
    console.log('✅ تم جلب المنتجات بنجاح:', rows.length);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('❌ خطأ في جلب المنتجات:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب المنتجات',
      error: error.message
    });
  }
});

// 🆕 إنشاء منتج جديد
app.post('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    const productData = req.body;

    console.log('🏪 إنشاء منتج جديد للشركة:', companyId);
    console.log('📦 بيانات المنتج:', productData.name);

    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بقاعدة البيانات');

    const insertQuery = `
      INSERT INTO products (
        company_id, name, description, short_description, sku, 
        price, sale_price, stock_quantity, category, brand, 
        image_url, featured, weight, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await connection.execute(insertQuery, [
      companyId,
      productData.name,
      productData.description,
      productData.short_description,
      productData.sku,
      productData.price,
      productData.sale_price,
      productData.stock_quantity,
      productData.category,
      productData.brand,
      productData.image_url,
      productData.featured ? 1 : 0,
      productData.weight,
      productData.status || 'active'
    ]);

    // جلب المنتج المُنشأ
    const [newProduct] = await connection.execute(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    await connection.end();
    console.log('✅ تم إنشاء المنتج بنجاح:', newProduct[0].name);

    res.json({
      success: true,
      data: newProduct[0],
      message: 'تم إنشاء المنتج بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء المنتج:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء المنتج',
      error: error.message
    });
  }
});

// 🚀 تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🛍️ Products API Server running on http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Products endpoint: http://localhost:${PORT}/api/companies/{companyId}/products`);
  console.log('🔗 قاعدة البيانات البعيدة:', DB_CONFIG.host);
});

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
  console.error('❌ خطأ غير متوقع:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ رفض غير معالج:', reason);
});
