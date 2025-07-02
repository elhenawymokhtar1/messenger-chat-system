/**
 * 🛍️ API سريع للمنتجات - اتصال مباشر بقاعدة البيانات البعيدة
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

console.log('🚀 بدء تشغيل API المنتجات...');

// 🏥 Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API يعمل بنجاح' });
});

// 📦 جلب المنتجات
app.get('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('🔍 جلب المنتجات للشركة:', companyId);

    const connection = await mysql.createConnection(DB_CONFIG);
    const [rows] = await connection.execute(
      'SELECT * FROM products WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );
    await connection.end();

    console.log('✅ تم جلب', rows.length, 'منتج');
    res.json({ success: true, data: rows });

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🆕 إضافة منتج جديد
app.post('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    const data = req.body;

    console.log('🏪 إضافة منتج جديد:', data.name);

    const connection = await mysql.createConnection(DB_CONFIG);
    
    const [result] = await connection.execute(`
      INSERT INTO products (
        company_id, name, description, short_description, sku, 
        price, sale_price, stock_quantity, category, brand, 
        image_url, featured, weight, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      companyId, data.name, data.description, data.short_description,
      data.sku, data.price, data.sale_price, data.stock_quantity,
      data.category, data.brand, data.image_url, 
      data.featured ? 1 : 0, data.weight, data.status || 'active'
    ]);

    const [newProduct] = await connection.execute(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    await connection.end();

    console.log('✅ تم إضافة المنتج بنجاح');
    res.json({ success: true, data: newProduct[0] });

  } catch (error) {
    console.error('❌ خطأ في الإضافة:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🚀 تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🛍️ API يعمل على http://localhost:${PORT}`);
  console.log(`🔗 اختبار: http://localhost:${PORT}/api/health`);
});

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
  console.error('❌ خطأ:', error.message);
});
