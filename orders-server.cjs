/**
 * 📦 خادم الطلبات البسيط
 * يوفر جميع APIs المطلوبة للطلبات
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware للـ logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// بيانات تجريبية للطلبات
const mockOrders = [
  {
    id: 'order-1',
    order_number: 'ORD-001',
    customer_name: 'أحمد محمد',
    customer_email: 'ahmed@example.com',
    customer_phone: '01234567890',
    status: 'pending',
    payment_status: 'pending',
    total_amount: '250.00',
    subtotal: '200.00',
    shipping_cost: '30.00',
    tax_amount: '20.00',
    discount_amount: '0.00',
    created_at: new Date().toISOString(),
    items_count: 3,
    items: [
      { id: '1', product_name: 'منتج تجريبي 1', price: 50, quantity: 2, total: 100 },
      { id: '2', product_name: 'منتج تجريبي 2', price: 75, quantity: 1, total: 75 },
      { id: '3', product_name: 'منتج تجريبي 3', price: 25, quantity: 1, total: 25 }
    ]
  },
  {
    id: 'order-2',
    order_number: 'ORD-002',
    customer_name: 'فاطمة علي',
    customer_email: 'fatima@example.com',
    customer_phone: '01987654321',
    status: 'shipped',
    payment_status: 'paid',
    total_amount: '180.00',
    subtotal: '150.00',
    shipping_cost: '20.00',
    tax_amount: '10.00',
    discount_amount: '0.00',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    items_count: 2,
    items: [
      { id: '4', product_name: 'منتج تجريبي 4', price: 100, quantity: 1, total: 100 },
      { id: '5', product_name: 'منتج تجريبي 5', price: 50, quantity: 1, total: 50 }
    ]
  },
  {
    id: 'order-3',
    order_number: 'ORD-003',
    customer_name: 'محمد حسن',
    customer_email: 'mohamed@example.com',
    customer_phone: '01555666777',
    status: 'delivered',
    payment_status: 'paid',
    total_amount: '320.00',
    subtotal: '280.00',
    shipping_cost: '25.00',
    tax_amount: '15.00',
    discount_amount: '0.00',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    items_count: 4,
    items: [
      { id: '6', product_name: 'منتج تجريبي 6', price: 80, quantity: 2, total: 160 },
      { id: '7', product_name: 'منتج تجريبي 7', price: 60, quantity: 2, total: 120 }
    ]
  }
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: '0 دقيقة',
      memory: {
        used: '70MB',
        heap: '15MB',
        healthy: true
      },
      database: {
        connected: true,
        status: 'متصل'
      }
    }
  });
});

// جلب جميع الطلبات للشركة
app.get('/api/companies/:companyId/orders', (req, res) => {
  const { companyId } = req.params;
  
  console.log('📦 [API] جلب جميع الطلبات للشركة:', companyId);
  
  res.json({
    success: true,
    data: mockOrders,
    total: mockOrders.length
  });
});

// جلب تفاصيل طلب محدد
app.get('/api/companies/:companyId/orders/:orderId', (req, res) => {
  const { companyId, orderId } = req.params;
  
  console.log('📦 [API] جلب تفاصيل الطلب:', orderId);
  
  const order = mockOrders.find(o => o.id === orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: 'الطلب غير موجود'
    });
  }
  
  res.json({
    success: true,
    data: order
  });
});

// تحديث حالة الطلب
app.patch('/api/companies/:companyId/orders/:orderId/status', (req, res) => {
  const { companyId, orderId } = req.params;
  const { status } = req.body;
  
  console.log('📦 [API] تحديث حالة الطلب:', orderId, 'الحالة الجديدة:', status);
  
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'الطلب غير موجود'
    });
  }
  
  mockOrders[orderIndex].status = status;
  
  res.json({
    success: true,
    data: mockOrders[orderIndex]
  });
});

// تحديث حالة الدفع
app.patch('/api/companies/:companyId/orders/:orderId/payment', (req, res) => {
  const { companyId, orderId } = req.params;
  const { payment_status } = req.body;
  
  console.log('💳 [API] تحديث حالة الدفع:', orderId, 'الحالة الجديدة:', payment_status);
  
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'الطلب غير موجود'
    });
  }
  
  mockOrders[orderIndex].payment_status = payment_status;
  
  res.json({
    success: true,
    data: mockOrders[orderIndex]
  });
});

// معالج الأخطاء العام
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'المسار غير موجود',
    path: req.path,
    method: req.method
  });
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`🚀 خادم الطلبات يعمل على المنفذ: ${PORT}`);
  console.log(`🌐 الرابط: http://localhost:${PORT}`);
  console.log(`💚 فحص الصحة: http://localhost:${PORT}/api/health`);
  console.log(`📦 الطلبات: http://localhost:${PORT}/api/companies/kok/orders`);
});
