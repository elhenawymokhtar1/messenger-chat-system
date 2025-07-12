// 🏪 Store API Routes - مسارات API المتجر الإلكتروني
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeTransaction } from './database/mysql-pool';

const router = express.Router();

// 🏪 الحصول على معلومات المتجر
router.get('/companies/:companyId/store', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('🏪 [STORE] جلب معلومات المتجر للشركة:', companyId);

    const stores = await executeQuery(
      'SELECT * FROM stores WHERE company_id = ? AND is_active = true',
      [companyId]
    );

    if (stores.length === 0) {
      // إنشاء متجر افتراضي إذا لم يكن موجود
      const storeId = uuidv4();
      const defaultStore = {
        id: storeId,
        company_id: companyId,
        name: 'متجري الإلكتروني',
        description: 'متجر إلكتروني متكامل',
        theme_color: '#007bff',
        currency: 'USD',
        is_active: true,
        settings: JSON.stringify({
          shipping_enabled: true,
          tax_enabled: false,
          inventory_tracking: true,
          allow_backorders: false
        })
      };

      await executeQuery(
        `INSERT INTO stores (id, company_id, name, description, theme_color, currency, is_active, settings) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [storeId, companyId, defaultStore.name, defaultStore.description, 
         defaultStore.theme_color, defaultStore.currency, defaultStore.is_active, defaultStore.settings]
      );

      console.log('✅ [STORE] تم إنشاء متجر افتراضي:', storeId);
      
      res.json({
        success: true,
        data: defaultStore,
        message: 'تم إنشاء المتجر بنجاح'
      });
    } else {
      console.log('✅ [STORE] تم جلب معلومات المتجر بنجاح');
      res.json({
        success: true,
        data: stores[0],
        message: 'تم جلب معلومات المتجر بنجاح'
      });
    }
  } catch (error: any) {
    console.error('❌ [STORE] خطأ في جلب معلومات المتجر:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في جلب معلومات المتجر'
    });
  }
});

// 🏪 تحديث معلومات المتجر
router.put('/companies/:companyId/store', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { name, description, logo_url, banner_url, theme_color, currency, settings } = req.body;
    
    console.log('🏪 [STORE] تحديث معلومات المتجر للشركة:', companyId);

    const result = await executeQuery(
      `UPDATE stores SET 
       name = COALESCE(?, name),
       description = COALESCE(?, description),
       logo_url = COALESCE(?, logo_url),
       banner_url = COALESCE(?, banner_url),
       theme_color = COALESCE(?, theme_color),
       currency = COALESCE(?, currency),
       settings = COALESCE(?, settings),
       updated_at = CURRENT_TIMESTAMP
       WHERE company_id = ?`,
      [name, description, logo_url, banner_url, theme_color, currency, 
       settings ? JSON.stringify(settings) : null, companyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'المتجر غير موجود'
      });
    }

    console.log('✅ [STORE] تم تحديث معلومات المتجر بنجاح');
    res.json({
      success: true,
      message: 'تم تحديث معلومات المتجر بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [STORE] خطأ في تحديث معلومات المتجر:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في تحديث معلومات المتجر'
    });
  }
});

// 📦 الحصول على جميع المنتجات
router.get('/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 20, category, status = 'active', search } = req.query;
    
    console.log('📦 [PRODUCTS] جلب المنتجات للشركة:', companyId);

    // الحصول على store_id أولاً
    const stores = await executeQuery(
      'SELECT id FROM stores WHERE company_id = ? AND is_active = true',
      [companyId]
    );

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المتجر غير موجود'
      });
    }

    const storeId = stores[0].id;
    const offset = (Number(page) - 1) * Number(limit);

    // بناء الاستعلام
    let whereClause = 'WHERE p.store_id = ? AND p.status = ?';
    const params = [storeId, status];

    if (category) {
      whereClause += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), offset);

    const products = await executeQuery(query, params);

    // عد إجمالي المنتجات
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    
    const countResult = await executeQuery(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    console.log(`✅ [PRODUCTS] تم جلب ${products.length} منتج من أصل ${total}`);

    res.json({
      success: true,
      data: products.map((product: any) => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        dimensions: product.dimensions ? JSON.parse(product.dimensions) : null,
        tags: product.tags ? JSON.parse(product.tags) : []
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      message: 'تم جلب المنتجات بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [PRODUCTS] خطأ في جلب المنتجات:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في جلب المنتجات'
    });
  }
});

// 📦 إنشاء منتج جديد
router.post('/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      name, description, short_description, sku, price, compare_price, cost_price,
      stock_quantity, category_id, weight, dimensions, images, tags, featured,
      seo_title, seo_description, track_inventory, allow_backorder
    } = req.body;

    console.log('📦 [PRODUCTS] إنشاء منتج جديد للشركة:', companyId);

    // التحقق من وجود المتجر
    const stores = await executeQuery(
      'SELECT id FROM stores WHERE company_id = ? AND is_active = true',
      [companyId]
    );

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المتجر غير موجود'
      });
    }

    const storeId = stores[0].id;
    const productId = uuidv4();

    // التحقق من عدم تكرار SKU
    if (sku) {
      const existingSku = await executeQuery(
        'SELECT id FROM products WHERE sku = ?',
        [sku]
      );

      if (existingSku.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'رمز المنتج (SKU) موجود بالفعل'
        });
      }
    }

    const insertQuery = `
      INSERT INTO products (
        id, store_id, category_id, name, description, short_description, sku,
        price, compare_price, cost_price, stock_quantity, track_inventory,
        allow_backorder, weight, dimensions, images, featured, seo_title,
        seo_description, tags, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;

    await executeQuery(insertQuery, [
      productId, storeId, category_id, name, description, short_description, sku,
      price, compare_price, cost_price, stock_quantity || 0,
      track_inventory !== false, allow_backorder === true, weight,
      dimensions ? JSON.stringify(dimensions) : null,
      images ? JSON.stringify(images) : null,
      featured === true, seo_title, seo_description,
      tags ? JSON.stringify(tags) : null
    ]);

    console.log('✅ [PRODUCTS] تم إنشاء المنتج بنجاح:', productId);

    res.status(201).json({
      success: true,
      data: { id: productId },
      message: 'تم إنشاء المنتج بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [PRODUCTS] خطأ في إنشاء المنتج:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في إنشاء المنتج'
    });
  }
});

// 📦 تحديث منتج
router.put('/companies/:companyId/products/:productId', async (req, res) => {
  try {
    const { companyId, productId } = req.params;
    const updateData = req.body;

    console.log('📦 [PRODUCTS] تحديث المنتج:', productId);

    // التحقق من وجود المنتج والمتجر
    const product = await executeQuery(`
      SELECT p.* FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE p.id = ? AND s.company_id = ?
    `, [productId, companyId]);

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    // بناء استعلام التحديث
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        updateFields.push(`${key} = ?`);
        if (['dimensions', 'images', 'tags'].includes(key)) {
          updateValues.push(JSON.stringify(updateData[key]));
        } else {
          updateValues.push(updateData[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد بيانات للتحديث'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(productId);

    const updateQuery = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
    await executeQuery(updateQuery, updateValues);

    console.log('✅ [PRODUCTS] تم تحديث المنتج بنجاح');
    res.json({
      success: true,
      message: 'تم تحديث المنتج بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [PRODUCTS] خطأ في تحديث المنتج:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في تحديث المنتج'
    });
  }
});

// 📦 حذف منتج
router.delete('/companies/:companyId/products/:productId', async (req, res) => {
  try {
    const { companyId, productId } = req.params;

    console.log('📦 [PRODUCTS] حذف المنتج:', productId);

    // التحقق من وجود المنتج والمتجر
    const product = await executeQuery(`
      SELECT p.* FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE p.id = ? AND s.company_id = ?
    `, [productId, companyId]);

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    // حذف المنتج (soft delete)
    await executeQuery(
      'UPDATE products SET status = "archived", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [productId]
    );

    console.log('✅ [PRODUCTS] تم حذف المنتج بنجاح');
    res.json({
      success: true,
      message: 'تم حذف المنتج بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [PRODUCTS] خطأ في حذف المنتج:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في حذف المنتج'
    });
  }
});

// 🏷️ الحصول على الفئات
router.get('/companies/:companyId/categories', async (req, res) => {
  try {
    const { companyId } = req.params;

    console.log('🏷️ [CATEGORIES] جلب الفئات للشركة:', companyId);

    // الحصول على store_id
    const stores = await executeQuery(
      'SELECT id FROM stores WHERE company_id = ? AND is_active = true',
      [companyId]
    );

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المتجر غير موجود'
      });
    }

    const storeId = stores[0].id;

    const categories = await executeQuery(`
      SELECT c.*,
             (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count
      FROM categories c
      WHERE c.store_id = ? AND c.is_active = true
      ORDER BY c.sort_order ASC, c.name ASC
    `, [storeId]);

    console.log(`✅ [CATEGORIES] تم جلب ${categories.length} فئة`);

    res.json({
      success: true,
      data: categories,
      message: 'تم جلب الفئات بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [CATEGORIES] خطأ في جلب الفئات:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في جلب الفئات'
    });
  }
});

// 🏷️ إنشاء فئة جديدة
router.post('/companies/:companyId/categories', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { name, description, image_url, parent_id, sort_order } = req.body;

    console.log('🏷️ [CATEGORIES] إنشاء فئة جديدة للشركة:', companyId);

    // الحصول على store_id
    const stores = await executeQuery(
      'SELECT id FROM stores WHERE company_id = ? AND is_active = true',
      [companyId]
    );

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المتجر غير موجود'
      });
    }

    const storeId = stores[0].id;
    const categoryId = uuidv4();

    await executeQuery(`
      INSERT INTO categories (id, store_id, name, description, image_url, parent_id, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [categoryId, storeId, name, description, image_url, parent_id, sort_order || 0]);

    console.log('✅ [CATEGORIES] تم إنشاء الفئة بنجاح:', categoryId);

    res.status(201).json({
      success: true,
      data: { id: categoryId },
      message: 'تم إنشاء الفئة بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [CATEGORIES] خطأ في إنشاء الفئة:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في إنشاء الفئة'
    });
  }
});

export default router;
