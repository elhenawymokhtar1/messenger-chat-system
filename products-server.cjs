/**
 * 🛍️ خادم المنتجات - اتصال مباشر بقاعدة البيانات البعيدة
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

console.log('🚀 بدء تشغيل خادم المنتجات...');

// دالة إنشاء اتصال آمن
async function createConnection() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    return connection;
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
    throw error;
  }
}

// 🏥 Health Check
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check');
  res.json({ 
    success: true, 
    message: 'خادم المنتجات يعمل بنجاح',
    timestamp: new Date().toISOString()
  });
});

// 📦 جلب المنتجات
app.get('/api/companies/:companyId/products', async (req, res) => {
  let connection;
  try {
    const { companyId } = req.params;
    console.log('🔍 جلب المنتجات للشركة:', companyId);

    connection = await createConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM products WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );

    console.log('✅ تم جلب', rows.length, 'منتج');
    
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
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// 🆕 إضافة منتج جديد
app.post('/api/companies/:companyId/products', async (req, res) => {
  let connection;
  try {
    const { companyId } = req.params;
    const data = req.body;

    console.log('🏪 إضافة منتج جديد للشركة:', companyId);
    console.log('📦 اسم المنتج:', data.name);

    if (!data.name || data.name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'اسم المنتج مطلوب'
      });
    }

    connection = await createConnection();
    
    const insertQuery = `
      INSERT INTO products (
        company_id, name, description, short_description, sku, 
        price, sale_price, stock_quantity, category, brand, 
        image_url, featured, weight, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await connection.execute(insertQuery, [
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
    const [newProduct] = await connection.execute(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    console.log('✅ تم إضافة المنتج بنجاح:', newProduct[0].name);

    res.json({ 
      success: true, 
      data: newProduct[0],
      message: 'تم إضافة المنتج بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في إضافة المنتج:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'فشل في إضافة المنتج',
      error: error.message 
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
});

// 🚀 تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🛍️ خادم المنتجات يعمل على http://localhost:${PORT}`);
  console.log(`🔗 اختبار الصحة: http://localhost:${PORT}/api/health`);
  console.log(`📦 نقطة المنتجات: http://localhost:${PORT}/api/companies/{companyId}/products`);
  console.log('🔗 قاعدة البيانات:', DB_CONFIG.host);
});

// معالجة الأخطاء العامة
process.on('uncaughtException', (error) => {
  console.error('❌ خطأ غير متوقع:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ رفض غير معالج:', reason);
});

// إغلاق نظيف
process.on('SIGINT', () => {
  console.log('🛑 إيقاف الخادم...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 إنهاء الخادم...');
  process.exit(0);
});
