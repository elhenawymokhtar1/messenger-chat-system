// خادم اختبار للمنتجات
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

// دالة الاتصال بقاعدة البيانات
async function executeQuery(query, params = []) {
  const connection = await mysql.createConnection(DB_CONFIG);
  try {
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    await connection.end();
  }
}

// Health check
app.get('/api/health', (req, res) => {
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
      'SELECT * FROM products WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );

    console.log('✅ [PRODUCTS] تم جلب', products.length, 'منتج');

    res.json({
      success: true,
      data: products || []
    });
  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في جلب المنتجات:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب المنتجات'
    });
  }
});

// إضافة منتج جديد
app.post('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    const data = req.body;

    console.log('🏪 [PRODUCTS] إضافة منتج جديد للشركة:', companyId);
    console.log('📦 [PRODUCTS] اسم المنتج:', data.name);

    if (!data.name || data.name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'اسم المنتج مطلوب'
      });
    }

    const productId = crypto.randomUUID();

    await executeQuery(`
      INSERT INTO products (
        id, company_id, name, description, short_description, sku,
        price, sale_price, stock_quantity, category, brand,
        image_url, featured, weight, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
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
    ]);

    // جلب المنتج المُنشأ
    const newProduct = await executeQuery(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    console.log('✅ [PRODUCTS] تم إضافة المنتج بنجاح');

    res.json({
      success: true,
      data: newProduct[0]
    });
  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في إضافة المنتج:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إضافة المنتج'
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
