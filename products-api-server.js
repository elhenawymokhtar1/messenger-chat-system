/**
 * 🛍️ خادم API للمنتجات - اتصال مباشر بقاعدة البيانات البعيدة
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

// دالة إنشاء اتصال بقاعدة البيانات
async function createConnection() {
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بقاعدة البيانات البعيدة');
    return connection;
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
    throw error;
  }
}

// 🏥 Health Check
app.get('/api/health', (req, res) => {
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

    const connection = await createConnection();
    
    const selectQuery = `
      SELECT * FROM products 
      WHERE company_id = ? 
      ORDER BY created_at DESC
    `;

    const [rows] = await connection.execute(selectQuery, [companyId]);
    await connection.end();

    console.log('✅ تم جلب المنتجات بنجاح:', rows.length);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('❌ خطأ في جلب المنتجات:', error);
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
    console.log('📦 بيانات المنتج:', productData);

    const connection = await createConnection();

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
    console.error('❌ خطأ في إنشاء المنتج:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء المنتج',
      error: error.message
    });
  }
});

// 🔄 تحديث منتج
app.put('/api/companies/:companyId/products/:productId', async (req, res) => {
  try {
    const { companyId, productId } = req.params;
    const productData = req.body;

    console.log('🔄 تحديث المنتج:', productId, 'للشركة:', companyId);

    const connection = await createConnection();

    const updateQuery = `
      UPDATE products SET 
        name = ?, description = ?, short_description = ?, sku = ?,
        price = ?, sale_price = ?, stock_quantity = ?, category = ?,
        brand = ?, image_url = ?, featured = ?, weight = ?, status = ?,
        updated_at = NOW()
      WHERE id = ? AND company_id = ?
    `;

    const [result] = await connection.execute(updateQuery, [
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
      productData.status,
      productId,
      companyId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    // جلب المنتج المُحدث
    const [updatedProduct] = await connection.execute(
      'SELECT * FROM products WHERE id = ? AND company_id = ?',
      [productId, companyId]
    );

    await connection.end();

    console.log('✅ تم تحديث المنتج بنجاح:', updatedProduct[0].name);

    res.json({
      success: true,
      data: updatedProduct[0],
      message: 'تم تحديث المنتج بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث المنتج:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث المنتج',
      error: error.message
    });
  }
});

// 🗑️ حذف منتج
app.delete('/api/companies/:companyId/products/:productId', async (req, res) => {
  try {
    const { companyId, productId } = req.params;

    console.log('🗑️ حذف المنتج:', productId, 'للشركة:', companyId);

    const connection = await createConnection();

    const deleteQuery = 'DELETE FROM products WHERE id = ? AND company_id = ?';
    const [result] = await connection.execute(deleteQuery, [productId, companyId]);

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    console.log('✅ تم حذف المنتج بنجاح');

    res.json({
      success: true,
      message: 'تم حذف المنتج بنجاح'
    });

  } catch (error) {
    console.error('❌ خطأ في حذف المنتج:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في حذف المنتج',
      error: error.message
    });
  }
});

// 🚀 تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🛍️ Products API Server running on http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Products endpoint: http://localhost:${PORT}/api/companies/{companyId}/products`);
});

module.exports = app;
