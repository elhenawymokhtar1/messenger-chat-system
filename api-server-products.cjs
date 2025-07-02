/**
 * 🚀 خادم API مع دعم المنتجات
 */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// إعدادات قاعدة البيانات
const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations'
};

console.log('🚀 بدء تشغيل خادم API مع دعم المنتجات...');

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
    message: 'API Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// 🏢 جلب بيانات الشركة
app.get('/api/companies/:id', async (req, res) => {
  const { id } = req.params;
  console.log('🏢 [COMPANY] جلب بيانات الشركة:', id);

  try {
    const connection = await createConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );

    await connection.end();

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    console.log('✅ [COMPANY] تم جلب بيانات الشركة');

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('❌ [COMPANY] خطأ في جلب بيانات الشركة:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب بيانات الشركة',
      error: error.message
    });
  }
});

// 🛍️ جلب المنتجات
app.get('/api/companies/:companyId/products', async (req, res) => {
  const { companyId } = req.params;
  
  console.log('🔍 [PRODUCTS] جلب المنتجات للشركة:', companyId);
  
  try {
    const connection = await createConnection();

    const [rows] = await connection.execute(
      'SELECT * FROM products WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );

    await connection.end();

    console.log('✅ [PRODUCTS] تم جلب', rows.length, 'منتج');

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في جلب المنتجات:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب المنتجات',
      error: error.message
    });
  }
});

// 🆕 إضافة منتج جديد
app.post('/api/companies/:companyId/products', async (req, res) => {
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

  try {
    const connection = await createConnection();

    // البحث عن متجر للشركة
    const [stores] = await connection.execute(
      'SELECT id FROM stores WHERE company_id = ? LIMIT 1',
      [companyId]
    );

    if (stores.length === 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'لا يوجد متجر مرتبط بهذه الشركة'
      });
    }

    const storeId = stores[0].id;
    const productId = require('uuid').v4();

    const [result] = await connection.execute(`
      INSERT INTO products (
        id, store_id, company_id, name, slug, description, short_description, sku,
        price, sale_price, stock_quantity, status, featured, manage_stock, stock_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      productId,
      storeId,
      companyId,
      data.name.trim(),
      data.name.trim().replace(/\s+/g, '-').toLowerCase(),
      data.description || '',
      data.short_description || '',
      data.sku || `SKU-${Date.now()}`,
      parseFloat(data.price) || 0,
      data.sale_price ? parseFloat(data.sale_price) : null,
      parseInt(data.stock_quantity) || 0,
      data.status || 'active',
      data.featured ? 1 : 0,
      1,
      'in_stock'
    ]);

    const [newProduct] = await connection.execute(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    await connection.end();

    console.log('✅ [PRODUCTS] تم إضافة المنتج بنجاح:', newProduct[0].name);

    res.json({
      success: true,
      data: newProduct[0],
      message: 'تم إضافة المنتج بنجاح'
    });

  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في إضافة المنتج:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في إضافة المنتج',
      error: error.message
    });
  }
});

// 🏪 إدارة المتجر
app.get('/api/companies/:companyId/store', async (req, res) => {
  const { companyId } = req.params;
  
  console.log('🏪 [STORE] جلب بيانات المتجر للشركة:', companyId);
  
  try {
    const connection = await createConnection();

    const [rows] = await connection.execute(
      'SELECT * FROM store_settings WHERE company_id = ?',
      [companyId]
    );

    await connection.end();

    if (rows.length === 0) {
      // إنشاء إعدادات افتراضية
      return res.json({
        success: true,
        data: {
          company_id: companyId,
          name: 'متجر جديد',
          description: 'وصف المتجر',
          logo_url: '',
          banner_url: '',
          theme_color: '#007bff',
          currency: 'EGP',
          language: 'ar',
          status: 'active'
        }
      });
    }

    console.log('✅ [STORE] تم جلب بيانات المتجر');

    res.json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('❌ [STORE] خطأ في جلب بيانات المتجر:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب بيانات المتجر',
      error: error.message
    });
  }
});

// 🏷️ إدارة الفئات
// جلب الفئات
app.get('/api/companies/:companyId/categories', async (req, res) => {
  const { companyId } = req.params;

  console.log('🔍 [CATEGORIES] جلب الفئات للشركة:', companyId);

  try {
    const connection = await createConnection();

    const [rows] = await connection.execute(
      'SELECT * FROM categories WHERE company_id = ? ORDER BY sort_order ASC, created_at DESC',
      [companyId]
    );

    await connection.end();

    console.log('✅ [CATEGORIES] تم جلب', rows.length, 'فئة');

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('❌ [CATEGORIES] خطأ في جلب الفئات:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الفئات',
      error: error.message
    });
  }
});

// إضافة فئة جديدة
app.post('/api/companies/:companyId/categories', async (req, res) => {
  const { companyId } = req.params;
  const data = req.body;

  console.log('🏷️ [CATEGORIES] إضافة فئة جديدة للشركة:', companyId);
  console.log('📂 [CATEGORIES] اسم الفئة:', data.name);

  if (!data.name || data.name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'اسم الفئة مطلوب'
    });
  }

  try {
    const connection = await createConnection();
    const categoryId = require('uuid').v4();

    const [result] = await connection.execute(`
      INSERT INTO categories (
        id, company_id, name, slug, description, icon, color, image_url,
        sort_order, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      categoryId,
      companyId,
      data.name.trim(),
      data.slug || data.name.trim().replace(/\s+/g, '-').toLowerCase(),
      data.description || '',
      data.icon || '',
      data.color || '#007bff',
      data.image_url || '',
      parseInt(data.sort_order) || 0,
      data.is_active !== false ? 1 : 0
    ]);

    const [newCategory] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );

    await connection.end();

    console.log('✅ [CATEGORIES] تم إضافة الفئة بنجاح:', newCategory[0].name);

    res.json({
      success: true,
      data: newCategory[0],
      message: 'تم إضافة الفئة بنجاح'
    });

  } catch (error) {
    console.error('❌ [CATEGORIES] خطأ في إضافة الفئة:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في إضافة الفئة',
      error: error.message
    });
  }
});

// تحديث فئة
app.put('/api/companies/:companyId/categories/:categoryId', async (req, res) => {
  const { companyId, categoryId } = req.params;
  const data = req.body;

  console.log('📝 [CATEGORIES] تحديث الفئة:', categoryId);

  try {
    const connection = await createConnection();

    const [result] = await connection.execute(`
      UPDATE categories SET
        name = ?, slug = ?, description = ?, icon = ?, color = ?,
        image_url = ?, sort_order = ?, is_active = ?, updated_at = NOW()
      WHERE id = ? AND company_id = ?
    `, [
      data.name.trim(),
      data.slug || data.name.trim().replace(/\s+/g, '-').toLowerCase(),
      data.description || '',
      data.icon || '',
      data.color || '#007bff',
      data.image_url || '',
      parseInt(data.sort_order) || 0,
      data.is_active !== false ? 1 : 0,
      categoryId,
      companyId
    ]);

    if (result.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'الفئة غير موجودة'
      });
    }

    const [updatedCategory] = await connection.execute(
      'SELECT * FROM categories WHERE id = ?',
      [categoryId]
    );

    await connection.end();

    console.log('✅ [CATEGORIES] تم تحديث الفئة بنجاح');

    res.json({
      success: true,
      data: updatedCategory[0],
      message: 'تم تحديث الفئة بنجاح'
    });

  } catch (error) {
    console.error('❌ [CATEGORIES] خطأ في تحديث الفئة:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث الفئة',
      error: error.message
    });
  }
});

// حذف فئة
app.delete('/api/companies/:companyId/categories/:categoryId', async (req, res) => {
  const { companyId, categoryId } = req.params;

  console.log('🗑️ [CATEGORIES] حذف الفئة:', categoryId);

  try {
    const connection = await createConnection();

    const [result] = await connection.execute(
      'DELETE FROM categories WHERE id = ? AND company_id = ?',
      [categoryId, companyId]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'الفئة غير موجودة'
      });
    }

    console.log('✅ [CATEGORIES] تم حذف الفئة بنجاح');

    res.json({
      success: true,
      message: 'تم حذف الفئة بنجاح'
    });

  } catch (error) {
    console.error('❌ [CATEGORIES] خطأ في حذف الفئة:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في حذف الفئة',
      error: error.message
    });
  }
});

// 🎫 إدارة الكوبونات
// جلب الكوبونات
app.get('/api/companies/:companyId/coupons', async (req, res) => {
  const { companyId } = req.params;

  console.log('🔍 [COUPONS] جلب الكوبونات للشركة:', companyId);

  try {
    const connection = await createConnection();

    // التحقق من وجود جدول الكوبونات
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'coupons'
    `, [DB_CONFIG.database]);

    if (tables.length === 0) {
      // إنشاء جدول الكوبونات إذا لم يكن موجوداً
      await connection.execute(`
        CREATE TABLE coupons (
          id VARCHAR(36) PRIMARY KEY,
          company_id VARCHAR(36) NOT NULL,
          store_id VARCHAR(36),
          code VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          discount_type ENUM('percentage', 'fixed') NOT NULL,
          discount_value DECIMAL(10,2) NOT NULL,
          min_amount DECIMAL(10,2) NULL,
          max_amount DECIMAL(10,2) NULL,
          usage_limit INT NULL,
          used_count INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          start_date DATETIME NULL,
          end_date DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_company_id (company_id),
          INDEX idx_code (code),
          INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ [COUPONS] تم إنشاء جدول الكوبونات');
    }

    const [rows] = await connection.execute(
      'SELECT * FROM coupons WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );

    await connection.end();

    console.log('✅ [COUPONS] تم جلب', rows.length, 'كوبون');

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('❌ [COUPONS] خطأ في جلب الكوبونات:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الكوبونات',
      error: error.message
    });
  }
});

// إضافة كوبون جديد
app.post('/api/companies/:companyId/coupons', async (req, res) => {
  const { companyId } = req.params;
  const data = req.body;

  console.log('🎫 [COUPONS] إضافة كوبون جديد للشركة:', companyId);
  console.log('🏷️ [COUPONS] كود الكوبون:', data.code);

  if (!data.code || data.code.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'كود الكوبون مطلوب'
    });
  }

  if (!data.name || data.name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'اسم الكوبون مطلوب'
    });
  }

  try {
    const connection = await createConnection();
    const couponId = require('uuid').v4();

    const [result] = await connection.execute(`
      INSERT INTO coupons (
        id, company_id, code, name, description, discount_type, discount_value,
        min_amount, max_amount, usage_limit, is_active, start_date, end_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      couponId,
      companyId,
      data.code.trim().toUpperCase(),
      data.name.trim(),
      data.description || '',
      data.discount_type || 'percentage',
      parseFloat(data.discount_value) || 0,
      data.min_amount ? parseFloat(data.min_amount) : null,
      data.max_amount ? parseFloat(data.max_amount) : null,
      data.usage_limit ? parseInt(data.usage_limit) : null,
      data.is_active !== false ? 1 : 0,
      data.start_date || null,
      data.end_date || null
    ]);

    const [newCoupon] = await connection.execute(
      'SELECT * FROM coupons WHERE id = ?',
      [couponId]
    );

    await connection.end();

    console.log('✅ [COUPONS] تم إضافة الكوبون بنجاح:', newCoupon[0].code);

    res.json({
      success: true,
      data: newCoupon[0],
      message: 'تم إضافة الكوبون بنجاح'
    });

  } catch (error) {
    console.error('❌ [COUPONS] خطأ في إضافة الكوبون:', error.message);

    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        success: false,
        message: 'كود الكوبون موجود بالفعل'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'فشل في إضافة الكوبون',
        error: error.message
      });
    }
  }
});

// 🛒 إدارة السلة
// جلب عناصر السلة
app.get('/api/companies/:companyId/cart/:sessionId', async (req, res) => {
  const { companyId, sessionId } = req.params;

  console.log('🛒 [CART] جلب عناصر السلة للجلسة:', sessionId);

  try {
    const connection = await createConnection();

    // التحقق من وجود جدول السلة
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cart_items'
    `, [DB_CONFIG.database]);

    if (tables.length === 0) {
      // إنشاء جدول السلة إذا لم يكن موجوداً
      await connection.execute(`
        CREATE TABLE cart_items (
          id VARCHAR(36) PRIMARY KEY,
          company_id VARCHAR(36) NOT NULL,
          session_id VARCHAR(255) NOT NULL,
          product_id VARCHAR(36) NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          product_price DECIMAL(10,2) NOT NULL,
          product_image VARCHAR(500),
          quantity INT NOT NULL DEFAULT 1,
          variant_id VARCHAR(36) NULL,
          variant_name VARCHAR(255) NULL,
          variant_price DECIMAL(10,2) NULL,
          total_price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_company_session (company_id, session_id),
          INDEX idx_product (product_id),
          INDEX idx_session (session_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ [CART] تم إنشاء جدول السلة');
    }

    const [rows] = await connection.execute(
      'SELECT * FROM cart_items WHERE company_id = ? AND session_id = ? ORDER BY created_at DESC',
      [companyId, sessionId]
    );

    await connection.end();

    console.log('✅ [CART] تم جلب', rows.length, 'عنصر من السلة');

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('❌ [CART] خطأ في جلب عناصر السلة:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب عناصر السلة',
      error: error.message
    });
  }
});

// إضافة منتج للسلة
app.post('/api/companies/:companyId/cart/:sessionId', async (req, res) => {
  const { companyId, sessionId } = req.params;
  const data = req.body;

  console.log('🛒 [CART] إضافة منتج للسلة:', data.product_name);

  if (!data.product_id || !data.product_name || !data.product_price) {
    return res.status(400).json({
      success: false,
      message: 'بيانات المنتج غير مكتملة'
    });
  }

  try {
    const connection = await createConnection();

    // التحقق من وجود المنتج في السلة
    const [existingItems] = await connection.execute(
      'SELECT * FROM cart_items WHERE company_id = ? AND session_id = ? AND product_id = ? AND variant_id = ?',
      [companyId, sessionId, data.product_id, data.variant_id || null]
    );

    if (existingItems.length > 0) {
      // تحديث الكمية إذا كان المنتج موجود
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + (parseInt(data.quantity) || 1);
      const newTotalPrice = newQuantity * (data.variant_price || data.product_price);

      await connection.execute(`
        UPDATE cart_items
        SET quantity = ?, total_price = ?, updated_at = NOW()
        WHERE id = ?
      `, [newQuantity, newTotalPrice, existingItem.id]);

      const [updatedItem] = await connection.execute(
        'SELECT * FROM cart_items WHERE id = ?',
        [existingItem.id]
      );

      await connection.end();

      console.log('✅ [CART] تم تحديث كمية المنتج في السلة');

      res.json({
        success: true,
        data: updatedItem[0],
        message: 'تم تحديث كمية المنتج في السلة'
      });

    } else {
      // إضافة منتج جديد للسلة
      const cartItemId = require('uuid').v4();
      const quantity = parseInt(data.quantity) || 1;
      const price = data.variant_price || data.product_price;
      const totalPrice = quantity * price;

      await connection.execute(`
        INSERT INTO cart_items (
          id, company_id, session_id, product_id, product_name, product_price,
          product_image, quantity, variant_id, variant_name, variant_price,
          total_price, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        cartItemId,
        companyId,
        sessionId,
        data.product_id,
        data.product_name,
        data.product_price,
        data.product_image || null,
        quantity,
        data.variant_id || null,
        data.variant_name || null,
        data.variant_price || null,
        totalPrice
      ]);

      const [newItem] = await connection.execute(
        'SELECT * FROM cart_items WHERE id = ?',
        [cartItemId]
      );

      await connection.end();

      console.log('✅ [CART] تم إضافة المنتج للسلة بنجاح');

      res.json({
        success: true,
        data: newItem[0],
        message: 'تم إضافة المنتج للسلة بنجاح'
      });
    }

  } catch (error) {
    console.error('❌ [CART] خطأ في إضافة المنتج للسلة:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في إضافة المنتج للسلة',
      error: error.message
    });
  }
});

// تحديث كمية منتج في السلة
app.put('/api/companies/:companyId/cart/:sessionId/:itemId', async (req, res) => {
  const { companyId, sessionId, itemId } = req.params;
  const { quantity } = req.body;

  console.log('🛒 [CART] تحديث كمية المنتج:', itemId, 'الكمية الجديدة:', quantity);

  if (!quantity || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'الكمية يجب أن تكون أكبر من صفر'
    });
  }

  try {
    const connection = await createConnection();

    // جلب بيانات المنتج
    const [items] = await connection.execute(
      'SELECT * FROM cart_items WHERE id = ? AND company_id = ? AND session_id = ?',
      [itemId, companyId, sessionId]
    );

    if (items.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود في السلة'
      });
    }

    const item = items[0];
    const price = item.variant_price || item.product_price;
    const newTotalPrice = quantity * price;

    await connection.execute(`
      UPDATE cart_items
      SET quantity = ?, total_price = ?, updated_at = NOW()
      WHERE id = ?
    `, [quantity, newTotalPrice, itemId]);

    const [updatedItem] = await connection.execute(
      'SELECT * FROM cart_items WHERE id = ?',
      [itemId]
    );

    await connection.end();

    console.log('✅ [CART] تم تحديث كمية المنتج بنجاح');

    res.json({
      success: true,
      data: updatedItem[0],
      message: 'تم تحديث كمية المنتج بنجاح'
    });

  } catch (error) {
    console.error('❌ [CART] خطأ في تحديث كمية المنتج:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث كمية المنتج',
      error: error.message
    });
  }
});

// حذف منتج من السلة
app.delete('/api/companies/:companyId/cart/:sessionId/:itemId', async (req, res) => {
  const { companyId, sessionId, itemId } = req.params;

  console.log('🛒 [CART] حذف منتج من السلة:', itemId);

  try {
    const connection = await createConnection();

    const [result] = await connection.execute(
      'DELETE FROM cart_items WHERE id = ? AND company_id = ? AND session_id = ?',
      [itemId, companyId, sessionId]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود في السلة'
      });
    }

    console.log('✅ [CART] تم حذف المنتج من السلة بنجاح');

    res.json({
      success: true,
      message: 'تم حذف المنتج من السلة بنجاح'
    });

  } catch (error) {
    console.error('❌ [CART] خطأ في حذف المنتج من السلة:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في حذف المنتج من السلة',
      error: error.message
    });
  }
});

// مسح السلة بالكامل
app.delete('/api/companies/:companyId/cart/:sessionId', async (req, res) => {
  const { companyId, sessionId } = req.params;

  console.log('🛒 [CART] مسح السلة بالكامل للجلسة:', sessionId);

  try {
    const connection = await createConnection();

    const [result] = await connection.execute(
      'DELETE FROM cart_items WHERE company_id = ? AND session_id = ?',
      [companyId, sessionId]
    );

    await connection.end();

    console.log('✅ [CART] تم مسح', result.affectedRows, 'عنصر من السلة');

    res.json({
      success: true,
      message: `تم مسح ${result.affectedRows} عنصر من السلة`
    });

  } catch (error) {
    console.error('❌ [CART] خطأ في مسح السلة:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في مسح السلة',
      error: error.message
    });
  }
});

// 📦 إدارة الطلبات
// إنشاء طلب جديد
app.post('/api/companies/:companyId/orders', async (req, res) => {
  const { companyId } = req.params;
  const orderData = req.body;

  console.log('📦 [ORDERS] إنشاء طلب جديد للشركة:', companyId);
  console.log('📋 [ORDERS] بيانات الطلب:', JSON.stringify(orderData, null, 2));

  try {
    const connection = await createConnection();

    // التحقق من وجود جدول الطلبات
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders'
    `, [DB_CONFIG.database]);

    if (tables.length === 0) {
      // إنشاء جدول الطلبات إذا لم يكن موجوداً
      await connection.execute(`
        CREATE TABLE orders (
          id VARCHAR(36) PRIMARY KEY,
          company_id VARCHAR(36) NOT NULL,
          session_id VARCHAR(255) NOT NULL,
          customer_name VARCHAR(255) NULL,
          customer_phone VARCHAR(50) NULL,
          customer_email VARCHAR(255) NULL,
          customer_address TEXT NULL,
          items_count INT NOT NULL DEFAULT 0,
          subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
          discount DECIMAL(10,2) NOT NULL DEFAULT 0,
          tax DECIMAL(10,2) NOT NULL DEFAULT 0,
          shipping DECIMAL(10,2) NOT NULL DEFAULT 0,
          total DECIMAL(10,2) NOT NULL DEFAULT 0,
          coupon_code VARCHAR(100) NULL,
          coupon_discount DECIMAL(10,2) NULL,
          status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
          payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
          payment_method VARCHAR(50) NULL,
          notes TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_company (company_id),
          INDEX idx_session (session_id),
          INDEX idx_status (status),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // إنشاء جدول تفاصيل الطلبات
      await connection.execute(`
        CREATE TABLE order_items (
          id VARCHAR(36) PRIMARY KEY,
          order_id VARCHAR(36) NOT NULL,
          product_id VARCHAR(36) NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          product_sku VARCHAR(100) NULL,
          product_price DECIMAL(10,2) NOT NULL,
          quantity INT NOT NULL,
          variant_id VARCHAR(36) NULL,
          variant_name VARCHAR(255) NULL,
          variant_price DECIMAL(10,2) NULL,
          total_price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          INDEX idx_order (order_id),
          INDEX idx_product (product_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log('✅ [ORDERS] تم إنشاء جداول الطلبات');
    }

    // إنشاء معرف الطلب
    const orderId = require('uuid').v4();

    // استخراج بيانات الطلب
    const {
      session_id,
      items = [],
      summary = {},
      coupon = null,
      customer = {}
    } = orderData;

    // حساب الإحصائيات
    const itemsCount = items.length;
    const subtotal = summary.subtotal || 0;
    const discount = summary.discount || 0;
    const tax = summary.tax || 0;
    const shipping = summary.shipping || 0;
    const total = summary.total || subtotal;

    // إدراج الطلب الرئيسي
    await connection.execute(`
      INSERT INTO orders (
        id, company_id, session_id, customer_name, customer_phone,
        customer_email, customer_address, items_count, subtotal,
        discount, tax, shipping, total, coupon_code, coupon_discount,
        status, payment_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', NOW(), NOW())
    `, [
      orderId,
      companyId,
      session_id,
      customer.name || null,
      customer.phone || null,
      customer.email || null,
      customer.address || null,
      itemsCount,
      subtotal,
      discount,
      tax,
      shipping,
      total,
      coupon?.code || null,
      coupon?.discount || null
    ]);

    // إدراج عناصر الطلب
    for (const item of items) {
      const itemId = require('uuid').v4();
      await connection.execute(`
        INSERT INTO order_items (
          id, order_id, product_id, product_name, product_sku,
          product_price, quantity, variant_id, variant_name,
          variant_price, total_price, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        itemId,
        orderId,
        item.product_id,
        item.product_name,
        item.product_sku || null,
        item.product_price || item.price,
        item.quantity,
        item.variant_id || null,
        item.variant_name || null,
        item.variant_price || null,
        item.total_price || item.total
      ]);
    }

    // مسح السلة بعد إتمام الطلب
    await connection.execute(
      'DELETE FROM cart_items WHERE company_id = ? AND session_id = ?',
      [companyId, session_id]
    );

    await connection.end();

    console.log('✅ [ORDERS] تم إنشاء الطلب بنجاح:', orderId);
    console.log('🗑️ [ORDERS] تم مسح السلة بعد إتمام الطلب');

    res.json({
      success: true,
      data: {
        order_id: orderId,
        status: 'pending',
        total: total,
        items_count: itemsCount
      },
      message: 'تم إنشاء الطلب بنجاح'
    });

  } catch (error) {
    console.error('❌ [ORDERS] خطأ في إنشاء الطلب:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء الطلب',
      error: error.message
    });
  }
});

// جلب طلبات الشركة
app.get('/api/companies/:companyId/orders', async (req, res) => {
  const { companyId } = req.params;
  const { status, limit = 50, offset = 0 } = req.query;

  console.log('📦 [ORDERS] جلب طلبات الشركة:', companyId);

  try {
    const connection = await createConnection();

    let query = `
      SELECT o.*,
             COUNT(oi.id) as items_count_actual,
             GROUP_CONCAT(oi.product_name SEPARATOR ', ') as products_list
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.company_id = ?
    `;
    const params = [companyId];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await connection.execute(query, params);

    await connection.end();

    console.log('✅ [ORDERS] تم جلب', orders.length, 'طلب');

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('❌ [ORDERS] خطأ في جلب الطلبات:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الطلبات',
      error: error.message
    });
  }
});

// جلب تفاصيل طلب محدد
app.get('/api/companies/:companyId/orders/:orderId', async (req, res) => {
  const { companyId, orderId } = req.params;

  console.log('📦 [ORDERS] جلب تفاصيل الطلب:', orderId);

  try {
    const connection = await createConnection();

    // جلب بيانات الطلب
    const [orders] = await connection.execute(
      'SELECT * FROM orders WHERE id = ? AND company_id = ?',
      [orderId, companyId]
    );

    if (orders.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    // جلب عناصر الطلب
    const [items] = await connection.execute(
      'SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at',
      [orderId]
    );

    await connection.end();

    const orderData = {
      ...orders[0],
      items: items
    };

    console.log('✅ [ORDERS] تم جلب تفاصيل الطلب مع', items.length, 'عنصر');

    res.json({
      success: true,
      data: orderData
    });

  } catch (error) {
    console.error('❌ [ORDERS] خطأ في جلب تفاصيل الطلب:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب تفاصيل الطلب',
      error: error.message
    });
  }
});

// 🚀 تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 [API] الخادم يعمل على المنفذ ${PORT}`);
  console.log(`📍 [API] Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🏢 [API] Companies: http://localhost:${PORT}/api/companies/:id`);
  console.log(`🛍️ [API] Products: http://localhost:${PORT}/api/companies/:companyId/products`);
  console.log(`🏪 [API] Store: http://localhost:${PORT}/api/companies/:companyId/store`);
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
