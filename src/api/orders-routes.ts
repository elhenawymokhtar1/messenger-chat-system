// 📋 Orders API Routes - مسارات API الطلبات
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeTransaction } from './database/mysql-pool';

const router = express.Router();

// 📋 إنشاء طلب جديد من السلة
router.post('/companies/:companyId/orders', async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      session_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      payment_method = 'cash_on_delivery',
      notes
    } = req.body;

    console.log('📋 [ORDERS] إنشاء طلب جديد للشركة:', companyId);

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

    // جلب عناصر السلة
    const cartItems = await executeQuery(`
      SELECT ci.*, p.sku, p.stock_quantity, p.track_inventory
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      WHERE ci.session_id = ? AND s.company_id = ?
    `, [session_id, companyId]);

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'السلة فارغة'
      });
    }

    // التحقق من المخزون
    for (const item of cartItems) {
      if (item.track_inventory && item.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `المنتج "${item.product_name}" غير متوفر بالكمية المطلوبة`
        });
      }
    }

    // حساب الإجماليات
    const subtotal = cartItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.product_price), 0
    );
    const shipping_cost = 0; // سيتم حسابه لاحقاً
    const tax_amount = 0; // سيتم حسابه لاحقاً
    const discount_amount = 0; // سيتم حسابه لاحقاً
    const total_amount = subtotal + shipping_cost + tax_amount - discount_amount;

    // إنشاء رقم الطلب
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const orderId = uuidv4();

    // بدء معاملة قاعدة البيانات
    const queries = [];

    // إنشاء الطلب
    queries.push({
      query: `INSERT INTO orders (
        id, store_id, order_number, customer_name, customer_email, customer_phone,
        customer_address, subtotal, shipping_cost, tax_amount, discount_amount,
        total_amount, payment_method, notes, status, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
      params: [
        orderId, storeId, orderNumber, customer_name, customer_email, customer_phone,
        customer_address, subtotal, shipping_cost, tax_amount, discount_amount,
        total_amount, payment_method, notes
      ]
    });

    // إضافة عناصر الطلب
    for (const item of cartItems) {
      const orderItemId = uuidv4();
      const itemTotal = item.quantity * item.product_price;

      queries.push({
        query: `INSERT INTO order_items (
          id, order_id, product_id, variant_id, product_name, product_sku,
          quantity, unit_price, total_price, product_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          orderItemId, orderId, item.product_id, item.variant_id, item.product_name,
          item.sku, item.quantity, item.product_price, itemTotal, item.product_image
        ]
      });

      // تحديث المخزون
      if (item.track_inventory) {
        queries.push({
          query: 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          params: [item.quantity, item.product_id]
        });
      }
    }

    // مسح السلة
    queries.push({
      query: `DELETE ci FROM cart_items ci
              JOIN products p ON ci.product_id = p.id
              JOIN stores s ON p.store_id = s.id
              WHERE ci.session_id = ? AND s.company_id = ?`,
      params: [session_id, companyId]
    });

    // تنفيذ المعاملة
    await executeTransaction(queries);

    console.log('✅ [ORDERS] تم إنشاء الطلب بنجاح:', orderNumber);

    res.status(201).json({
      success: true,
      data: {
        id: orderId,
        order_number: orderNumber,
        total_amount,
        status: 'pending'
      },
      message: 'تم إنشاء الطلب بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [ORDERS] خطأ في إنشاء الطلب:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في إنشاء الطلب'
    });
  }
});

// 📋 الحصول على جميع الطلبات
router.get('/companies/:companyId/orders', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      status, 
      payment_status,
      customer_email,
      order_number,
      date_from,
      date_to
    } = req.query;

    console.log('📋 [ORDERS] جلب الطلبات للشركة:', companyId);

    // بناء الاستعلام
    let whereClause = 'WHERE s.company_id = ?';
    const params = [companyId];

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    if (payment_status) {
      whereClause += ' AND o.payment_status = ?';
      params.push(payment_status);
    }

    if (customer_email) {
      whereClause += ' AND o.customer_email LIKE ?';
      params.push(`%${customer_email}%`);
    }

    if (order_number) {
      whereClause += ' AND o.order_number LIKE ?';
      params.push(`%${order_number}%`);
    }

    if (date_from) {
      whereClause += ' AND DATE(o.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(o.created_at) <= ?';
      params.push(date_to);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const query = `
      SELECT o.*, 
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), offset);

    const orders = await executeQuery(query, params);

    // عد إجمالي الطلبات
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      JOIN stores s ON o.store_id = s.id
      ${whereClause}
    `;
    
    const countResult = await executeQuery(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    console.log(`✅ [ORDERS] تم جلب ${orders.length} طلب من أصل ${total}`);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      message: 'تم جلب الطلبات بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [ORDERS] خطأ في جلب الطلبات:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في جلب الطلبات'
    });
  }
});

// 📋 الحصول على تفاصيل طلب محدد
router.get('/companies/:companyId/orders/:orderId', async (req, res) => {
  try {
    const { companyId, orderId } = req.params;

    console.log('📋 [ORDERS] جلب تفاصيل الطلب:', orderId);

    // جلب بيانات الطلب
    const orders = await executeQuery(`
      SELECT o.* FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE o.id = ? AND s.company_id = ?
    `, [orderId, companyId]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود'
      });
    }

    const order = orders[0];

    // جلب عناصر الطلب
    const orderItems = await executeQuery(`
      SELECT * FROM order_items
      WHERE order_id = ?
      ORDER BY created_at ASC
    `, [orderId]);

    console.log('✅ [ORDERS] تم جلب تفاصيل الطلب بنجاح');

    res.json({
      success: true,
      data: {
        ...order,
        items: orderItems
      },
      message: 'تم جلب تفاصيل الطلب بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [ORDERS] خطأ في جلب تفاصيل الطلب:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في جلب تفاصيل الطلب'
    });
  }
});

export default router;
