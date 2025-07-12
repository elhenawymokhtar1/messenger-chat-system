// 🛒 Cart & Orders API Routes - مسارات API السلة والطلبات
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeTransaction } from './database/mysql-pool';

const router = express.Router();

// 🛒 إضافة منتج للسلة
router.post('/companies/:companyId/cart/:sessionId', async (req, res) => {
  try {
    const { companyId, sessionId } = req.params;
    const { product_id, quantity = 1, variant_id } = req.body;

    console.log('🛒 [CART] إضافة منتج للسلة:', { companyId, sessionId, product_id, quantity });

    // التحقق من وجود المنتج
    const product = await executeQuery(`
      SELECT p.*, s.id as store_id FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE p.id = ? AND s.company_id = ? AND p.status = 'active'
    `, [product_id, companyId]);

    if (product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود أو غير متاح'
      });
    }

    const productData = product[0];

    // التحقق من المخزون
    if (productData.track_inventory && productData.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'الكمية المطلوبة غير متوفرة في المخزون'
      });
    }

    // التحقق من وجود المنتج في السلة
    const existingItem = await executeQuery(`
      SELECT * FROM cart_items 
      WHERE session_id = ? AND product_id = ? AND variant_id <=> ?
    `, [sessionId, product_id, variant_id]);

    if (existingItem.length > 0) {
      // تحديث الكمية
      const newQuantity = existingItem[0].quantity + quantity;
      
      if (productData.track_inventory && productData.stock_quantity < newQuantity) {
        return res.status(400).json({
          success: false,
          message: 'الكمية الإجمالية تتجاوز المخزون المتاح'
        });
      }

      await executeQuery(`
        UPDATE cart_items 
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newQuantity, existingItem[0].id]);

      console.log('✅ [CART] تم تحديث كمية المنتج في السلة');
    } else {
      // إضافة منتج جديد للسلة
      const cartItemId = uuidv4();
      
      await executeQuery(`
        INSERT INTO cart_items (
          id, session_id, product_id, variant_id, quantity, 
          product_name, product_price, product_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        cartItemId, sessionId, product_id, variant_id, quantity,
        productData.name, productData.price, 
        productData.images ? JSON.parse(productData.images)[0] : null
      ]);

      console.log('✅ [CART] تم إضافة المنتج للسلة بنجاح');
    }

    res.json({
      success: true,
      message: 'تم إضافة المنتج للسلة بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [CART] خطأ في إضافة المنتج للسلة:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في إضافة المنتج للسلة'
    });
  }
});

// 🛒 الحصول على محتويات السلة
router.get('/companies/:companyId/cart/:sessionId', async (req, res) => {
  try {
    const { companyId, sessionId } = req.params;

    console.log('🛒 [CART] جلب محتويات السلة:', { companyId, sessionId });

    const cartItems = await executeQuery(`
      SELECT ci.*, p.stock_quantity, p.track_inventory
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      WHERE ci.session_id = ? AND s.company_id = ?
      ORDER BY ci.created_at DESC
    `, [sessionId, companyId]);

    // حساب الإجماليات
    let subtotal = 0;
    const items = cartItems.map((item: any) => {
      const itemTotal = item.quantity * item.product_price;
      subtotal += itemTotal;
      
      return {
        ...item,
        total: itemTotal,
        in_stock: !item.track_inventory || item.stock_quantity >= item.quantity
      };
    });

    const summary = {
      items_count: items.length,
      total_quantity: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      subtotal: subtotal,
      shipping: 0, // سيتم حسابه لاحقاً
      tax: 0, // سيتم حسابه لاحقاً
      total: subtotal
    };

    console.log(`✅ [CART] تم جلب ${items.length} عنصر من السلة`);

    res.json({
      success: true,
      data: {
        items,
        summary
      },
      message: 'تم جلب محتويات السلة بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [CART] خطأ في جلب محتويات السلة:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في جلب محتويات السلة'
    });
  }
});

// 🛒 تحديث كمية منتج في السلة
router.put('/companies/:companyId/cart/:sessionId/items/:itemId', async (req, res) => {
  try {
    const { companyId, sessionId, itemId } = req.params;
    const { quantity } = req.body;

    console.log('🛒 [CART] تحديث كمية المنتج:', { itemId, quantity });

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'الكمية يجب أن تكون أكبر من صفر'
      });
    }

    // التحقق من وجود العنصر
    const cartItem = await executeQuery(`
      SELECT ci.*, p.stock_quantity, p.track_inventory
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      WHERE ci.id = ? AND ci.session_id = ? AND s.company_id = ?
    `, [itemId, sessionId, companyId]);

    if (cartItem.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'العنصر غير موجود في السلة'
      });
    }

    const item = cartItem[0];

    // التحقق من المخزون
    if (item.track_inventory && item.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'الكمية المطلوبة غير متوفرة في المخزون'
      });
    }

    await executeQuery(`
      UPDATE cart_items 
      SET quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [quantity, itemId]);

    console.log('✅ [CART] تم تحديث كمية المنتج بنجاح');

    res.json({
      success: true,
      message: 'تم تحديث كمية المنتج بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [CART] خطأ في تحديث كمية المنتج:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في تحديث كمية المنتج'
    });
  }
});

// 🛒 حذف منتج من السلة
router.delete('/companies/:companyId/cart/:sessionId/items/:itemId', async (req, res) => {
  try {
    const { companyId, sessionId, itemId } = req.params;

    console.log('🛒 [CART] حذف منتج من السلة:', itemId);

    const result = await executeQuery(`
      DELETE ci FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      WHERE ci.id = ? AND ci.session_id = ? AND s.company_id = ?
    `, [itemId, sessionId, companyId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'العنصر غير موجود في السلة'
      });
    }

    console.log('✅ [CART] تم حذف المنتج من السلة بنجاح');

    res.json({
      success: true,
      message: 'تم حذف المنتج من السلة بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [CART] خطأ في حذف المنتج من السلة:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في حذف المنتج من السلة'
    });
  }
});

// 🛒 مسح السلة بالكامل
router.delete('/companies/:companyId/cart/:sessionId', async (req, res) => {
  try {
    const { companyId, sessionId } = req.params;

    console.log('🛒 [CART] مسح السلة بالكامل:', sessionId);

    await executeQuery(`
      DELETE ci FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      WHERE ci.session_id = ? AND s.company_id = ?
    `, [sessionId, companyId]);

    console.log('✅ [CART] تم مسح السلة بالكامل');

    res.json({
      success: true,
      message: 'تم مسح السلة بالكامل'
    });
  } catch (error: any) {
    console.error('❌ [CART] خطأ في مسح السلة:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في مسح السلة'
    });
  }
});

export default router;
