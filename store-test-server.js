import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 [SERVER] بدء السرفر للاختبار...');

// 🏷️ مسارات إدارة الفئات
app.get('/api/companies/:companyId/categories', async (req, res) => {
  console.log('📋 [API] طلب جلب الفئات');
  const { companyId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const categories = [
    {
      id: 'cat_1',
      name: 'الإلكترونيات',
      description: 'جميع المنتجات الإلكترونية',
      image: 'https://via.placeholder.com/200x200?text=Electronics',
      products_count: 15,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'cat_2',
      name: 'الملابس',
      description: 'ملابس رجالية ونسائية',
      image: 'https://via.placeholder.com/200x200?text=Clothing',
      products_count: 8,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'cat_3',
      name: 'المنزل والحديقة',
      description: 'أدوات منزلية ومستلزمات الحديقة',
      image: 'https://via.placeholder.com/200x200?text=Home',
      products_count: 12,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedCategories = categories.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedCategories,
    pagination: {
      current_page: parseInt(page),
      per_page: parseInt(limit),
      total: categories.length,
      total_pages: Math.ceil(categories.length / limit)
    }
  });
});

app.post('/api/companies/:companyId/categories', async (req, res) => {
  console.log('➕ [API] طلب إضافة فئة جديدة');
  const { companyId } = req.params;
  const { name, description, image } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'اسم الفئة مطلوب'
    });
  }

  const newCategory = {
    id: `cat_${Date.now()}`,
    name,
    description: description || '',
    image: image || 'https://via.placeholder.com/200x200?text=Category',
    products_count: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الفئة بنجاح',
    data: newCategory
  });
});

// 📦 مسارات إدارة المنتجات
app.get('/api/companies/:companyId/products', async (req, res) => {
  console.log('📦 [API] طلب جلب المنتجات');
  const { companyId } = req.params;
  const { page = 1, limit = 20, category, search } = req.query;

  const products = [
    {
      id: 'prod_1',
      name: 'iPhone 15 Pro',
      description: 'أحدث هاتف من آبل مع تقنيات متقدمة',
      price: 4999.00,
      sale_price: 4499.00,
      sku: 'IPH15PRO001',
      stock_quantity: 25,
      category_id: 'cat_1',
      category_name: 'الإلكترونيات',
      images: [
        'https://via.placeholder.com/400x400?text=iPhone+15+Pro',
        'https://via.placeholder.com/400x400?text=iPhone+15+Pro+2'
      ],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_2',
      name: 'Samsung Galaxy S24',
      description: 'هاتف سامسونج الرائد مع كاميرا متطورة',
      price: 3999.00,
      sale_price: null,
      sku: 'SAM24001',
      stock_quantity: 18,
      category_id: 'cat_1',
      category_name: 'الإلكترونيات',
      images: [
        'https://via.placeholder.com/400x400?text=Galaxy+S24'
      ],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_3',
      name: 'قميص قطني رجالي',
      description: 'قميص قطني عالي الجودة مناسب للاستخدام اليومي',
      price: 149.00,
      sale_price: 99.00,
      sku: 'SHIRT001',
      stock_quantity: 50,
      category_id: 'cat_2',
      category_name: 'الملابس',
      images: [
        'https://via.placeholder.com/400x400?text=Cotton+Shirt'
      ],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_4',
      name: 'طاولة خشبية',
      description: 'طاولة خشبية أنيقة للمنزل',
      price: 899.00,
      sale_price: null,
      sku: 'TABLE001',
      stock_quantity: 12,
      category_id: 'cat_3',
      category_name: 'المنزل والحديقة',
      images: [
        'https://via.placeholder.com/400x400?text=Wooden+Table'
      ],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // تطبيق الفلترة حسب الفئة
  let filteredProducts = products;
  if (category) {
    filteredProducts = products.filter(p => p.category_id === category);
  }

  // تطبيق البحث
  if (search) {
    filteredProducts = filteredProducts.filter(p =>
      p.name.includes(search) || p.description.includes(search)
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedProducts,
    pagination: {
      current_page: parseInt(page),
      per_page: parseInt(limit),
      total: filteredProducts.length,
      total_pages: Math.ceil(filteredProducts.length / limit)
    }
  });
});

app.post('/api/companies/:companyId/products', async (req, res) => {
  console.log('➕ [API] طلب إضافة منتج جديد');
  const { companyId } = req.params;
  const { name, price, sku, description, sale_price, stock_quantity, category_id, images } = req.body;

  if (!name || !price || !sku) {
    return res.status(400).json({
      success: false,
      message: 'اسم المنتج والسعر ورمز المنتج مطلوبة'
    });
  }

  const newProduct = {
    id: `prod_${Date.now()}`,
    name,
    description: description || '',
    price: parseFloat(price),
    sale_price: sale_price ? parseFloat(sale_price) : null,
    sku,
    stock_quantity: stock_quantity || 0,
    category_id: category_id || null,
    images: images || [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'تم إنشاء المنتج بنجاح',
    data: newProduct
  });
});

// 🏪 مسارات إدارة المتجر
app.get('/api/companies/:companyId/store', async (req, res) => {
  console.log('🏪 [API] طلب جلب معلومات المتجر');
  const { companyId } = req.params;

  const store = {
    id: `store_${companyId}`,
    company_id: companyId,
    name: `متجر الشركة`,
    description: 'متجر إلكتروني متميز يقدم أفضل المنتجات والخدمات',
    logo_url: 'https://via.placeholder.com/200x200?text=Store+Logo',
    website_url: 'https://store.example.com',
    phone: '+966501234567',
    email: 'info@store.com',
    address: 'الرياض، المملكة العربية السعودية',
    is_active: true,
    settings: {
      currency: 'SAR',
      language: 'ar',
      timezone: 'Asia/Riyadh'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    data: store
  });
});

app.put('/api/companies/:companyId/store', async (req, res) => {
  console.log('✏️ [API] طلب تحديث معلومات المتجر');
  const { companyId } = req.params;
  const updateData = req.body;

  const updatedStore = {
    id: `store_${companyId}`,
    company_id: companyId,
    ...updateData,
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'تم تحديث معلومات المتجر بنجاح',
    data: updatedStore
  });
});

// 📊 مسار إحصائيات المتجر
app.get('/api/companies/:companyId/store/analytics', async (req, res) => {
  console.log('📊 [API] طلب إحصائيات المتجر');
  const { companyId } = req.params;
  const { period = '30d' } = req.query;

  const analytics = {
    overview: {
      total_products: 35,
      total_orders: 127,
      total_revenue: 45750.00,
      total_customers: 89
    },
    sales: {
      daily_sales: [
        { date: '2024-01-01', amount: 1250.00 },
        { date: '2024-01-02', amount: 1890.00 },
        { date: '2024-01-03', amount: 2100.00 }
      ],
      growth_rate: 15.5
    },
    top_products: [
      { id: 'prod_1', name: 'iPhone 15 Pro', sales: 25, revenue: 37500.00 },
      { id: 'prod_2', name: 'Samsung Galaxy S24', sales: 18, revenue: 18000.00 }
    ],
    categories_performance: [
      { category: 'الإلكترونيات', revenue: 35000.00, orders: 45 },
      { category: 'الملابس', revenue: 8500.00, orders: 32 }
    ],
    order_status_distribution: {
      pending: 12,
      confirmed: 8,
      processing: 15,
      shipped: 25,
      delivered: 67,
      cancelled: 3
    }
  };

  res.json({
    success: true,
    data: analytics,
    period: period
  });
});

// 🛒 مسارات إدارة الطلبات
app.get('/api/companies/:companyId/orders', async (req, res) => {
  console.log('🛒 [API] طلب جلب الطلبات');
  const { companyId } = req.params;
  const { page = 1, limit = 20, status, customer_name } = req.query;

  const orders = [
    {
      id: 'order_1',
      order_number: 'ORD-2024-001',
      customer_name: 'أحمد محمد',
      customer_email: 'ahmed@example.com',
      customer_phone: '+966501234567',
      status: 'delivered',
      total_amount: 4499.00,
      items_count: 1,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-20T14:45:00Z',
      shipping_address: {
        street: 'شارع الملك فهد',
        city: 'الرياض',
        postal_code: '12345',
        country: 'السعودية'
      }
    },
    {
      id: 'order_2',
      order_number: 'ORD-2024-002',
      customer_name: 'فاطمة علي',
      customer_email: 'fatima@example.com',
      customer_phone: '+966501234568',
      status: 'processing',
      total_amount: 248.00,
      items_count: 2,
      created_at: '2024-01-16T09:15:00Z',
      updated_at: '2024-01-16T09:15:00Z',
      shipping_address: {
        street: 'شارع العليا',
        city: 'الرياض',
        postal_code: '12346',
        country: 'السعودية'
      }
    },
    {
      id: 'order_3',
      order_number: 'ORD-2024-003',
      customer_name: 'محمد السعد',
      customer_email: 'mohammed@example.com',
      customer_phone: '+966501234569',
      status: 'shipped',
      total_amount: 899.00,
      items_count: 1,
      created_at: '2024-01-17T11:20:00Z',
      updated_at: '2024-01-18T16:30:00Z',
      shipping_address: {
        street: 'شارع التحلية',
        city: 'جدة',
        postal_code: '21411',
        country: 'السعودية'
      }
    }
  ];

  // تطبيق الفلترة حسب الحالة
  let filteredOrders = orders;
  if (status) {
    filteredOrders = orders.filter(o => o.status === status);
  }

  // تطبيق البحث حسب اسم العميل
  if (customer_name) {
    filteredOrders = filteredOrders.filter(o =>
      o.customer_name.includes(customer_name)
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedOrders,
    pagination: {
      current_page: parseInt(page),
      per_page: parseInt(limit),
      total: filteredOrders.length,
      total_pages: Math.ceil(filteredOrders.length / limit)
    }
  });
});

app.get('/api/companies/:companyId/orders/:orderId', async (req, res) => {
  console.log('🛒 [API] طلب جلب تفاصيل طلب محدد');
  const { companyId, orderId } = req.params;

  const orderDetails = {
    id: orderId,
    order_number: 'ORD-2024-001',
    customer_name: 'أحمد محمد',
    customer_email: 'ahmed@example.com',
    customer_phone: '+966501234567',
    status: 'delivered',
    total_amount: 4499.00,
    subtotal: 4499.00,
    tax_amount: 0.00,
    shipping_amount: 0.00,
    discount_amount: 500.00,
    items: [
      {
        id: 'item_1',
        product_id: 'prod_1',
        product_name: 'iPhone 15 Pro',
        product_sku: 'IPH15PRO001',
        quantity: 1,
        unit_price: 4999.00,
        sale_price: 4499.00,
        total_price: 4499.00
      }
    ],
    shipping_address: {
      name: 'أحمد محمد',
      street: 'شارع الملك فهد',
      city: 'الرياض',
      postal_code: '12345',
      country: 'السعودية',
      phone: '+966501234567'
    },
    payment_method: 'credit_card',
    payment_status: 'paid',
    notes: 'طلب عاجل',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:45:00Z'
  };

  res.json({
    success: true,
    data: orderDetails
  });
});

// 🛒 مسارات إدارة السلة
app.get('/api/companies/:companyId/cart/:sessionId', async (req, res) => {
  console.log('🛒 [API] طلب جلب محتويات السلة للجلسة');
  const { companyId, sessionId } = req.params;

  const cartItems = [
    {
      id: 'cart_item_1',
      product_id: 'prod_1',
      product_name: 'iPhone 15 Pro',
      product_sku: 'IPH15PRO001',
      product_image: 'https://via.placeholder.com/400x400?text=iPhone+15+Pro',
      unit_price: 4999.00,
      sale_price: 4499.00,
      quantity: 1,
      total_price: 4499.00,
      stock_available: 25,
      added_at: new Date().toISOString()
    },
    {
      id: 'cart_item_2',
      product_id: 'prod_3',
      product_name: 'قميص قطني رجالي',
      product_sku: 'SHIRT001',
      product_image: 'https://via.placeholder.com/400x400?text=Cotton+Shirt',
      unit_price: 149.00,
      sale_price: 99.00,
      quantity: 2,
      total_price: 198.00,
      stock_available: 50,
      added_at: new Date().toISOString()
    }
  ];

  const cartSummary = {
    session_id: sessionId,
    items: cartItems,
    items_count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cartItems.reduce((sum, item) => sum + item.total_price, 0),
    tax_amount: 0.00,
    shipping_amount: 0.00,
    discount_amount: 0.00,
    total_amount: cartItems.reduce((sum, item) => sum + item.total_price, 0),
    currency: 'SAR'
  };

  res.json({
    success: true,
    data: cartSummary
  });
});

app.get('/api/companies/:companyId/cart', async (req, res) => {
  console.log('🛒 [API] طلب جلب محتويات السلة');
  const { companyId } = req.params;
  const { customer_id } = req.query;

  const cartItems = [
    {
      id: 'cart_item_1',
      product_id: 'prod_1',
      product_name: 'iPhone 15 Pro',
      product_sku: 'IPH15PRO001',
      product_image: 'https://via.placeholder.com/400x400?text=iPhone+15+Pro',
      unit_price: 4999.00,
      sale_price: 4499.00,
      quantity: 1,
      total_price: 4499.00,
      stock_available: 25,
      added_at: new Date().toISOString()
    },
    {
      id: 'cart_item_2',
      product_id: 'prod_3',
      product_name: 'قميص قطني رجالي',
      product_sku: 'SHIRT001',
      product_image: 'https://via.placeholder.com/400x400?text=Cotton+Shirt',
      unit_price: 149.00,
      sale_price: 99.00,
      quantity: 2,
      total_price: 198.00,
      stock_available: 50,
      added_at: new Date().toISOString()
    }
  ];

  const cartSummary = {
    items: cartItems,
    items_count: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: cartItems.reduce((sum, item) => sum + item.total_price, 0),
    tax_amount: 0.00,
    shipping_amount: 0.00,
    discount_amount: 0.00,
    total_amount: cartItems.reduce((sum, item) => sum + item.total_price, 0),
    currency: 'SAR'
  };

  res.json({
    success: true,
    data: cartSummary
  });
});

app.post('/api/companies/:companyId/cart/:sessionId/add', async (req, res) => {
  console.log('➕ [API] طلب إضافة منتج للسلة للجلسة');
  const { companyId, sessionId } = req.params;
  const { product_id, quantity = 1 } = req.body;

  if (!product_id) {
    return res.status(400).json({
      success: false,
      message: 'معرف المنتج مطلوب'
    });
  }

  // محاكاة البحث عن المنتج
  const products = {
    'prod_1': {
      id: 'prod_1',
      name: 'iPhone 15 Pro',
      sku: 'IPH15PRO001',
      price: 4999.00,
      sale_price: 4499.00,
      stock: 25,
      image: 'https://via.placeholder.com/400x400?text=iPhone+15+Pro'
    },
    'prod_2': {
      id: 'prod_2',
      name: 'Samsung Galaxy S24',
      sku: 'SAM24001',
      price: 3999.00,
      sale_price: null,
      stock: 18,
      image: 'https://via.placeholder.com/400x400?text=Galaxy+S24'
    },
    'prod_3': {
      id: 'prod_3',
      name: 'قميص قطني رجالي',
      sku: 'SHIRT001',
      price: 149.00,
      sale_price: 99.00,
      stock: 50,
      image: 'https://via.placeholder.com/400x400?text=Cotton+Shirt'
    }
  };

  const product = products[product_id];
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'المنتج غير موجود'
    });
  }

  if (quantity > product.stock) {
    return res.status(400).json({
      success: false,
      message: `الكمية المطلوبة غير متوفرة. المتوفر: ${product.stock}`
    });
  }

  const cartItem = {
    id: `cart_item_${Date.now()}`,
    session_id: sessionId,
    product_id: product.id,
    product_name: product.name,
    product_sku: product.sku,
    product_image: product.image,
    unit_price: product.price,
    sale_price: product.sale_price,
    quantity: parseInt(quantity),
    total_price: (product.sale_price || product.price) * parseInt(quantity),
    stock_available: product.stock,
    added_at: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'تم إضافة المنتج للسلة بنجاح',
    data: cartItem
  });
});

app.post('/api/companies/:companyId/cart/add', async (req, res) => {
  console.log('➕ [API] طلب إضافة منتج للسلة');
  const { companyId } = req.params;
  const { product_id, quantity = 1, customer_id } = req.body;

  if (!product_id) {
    return res.status(400).json({
      success: false,
      message: 'معرف المنتج مطلوب'
    });
  }

  // محاكاة البحث عن المنتج
  const products = {
    'prod_1': {
      id: 'prod_1',
      name: 'iPhone 15 Pro',
      sku: 'IPH15PRO001',
      price: 4999.00,
      sale_price: 4499.00,
      stock: 25,
      image: 'https://via.placeholder.com/400x400?text=iPhone+15+Pro'
    },
    'prod_2': {
      id: 'prod_2',
      name: 'Samsung Galaxy S24',
      sku: 'SAM24001',
      price: 3999.00,
      sale_price: null,
      stock: 18,
      image: 'https://via.placeholder.com/400x400?text=Galaxy+S24'
    },
    'prod_3': {
      id: 'prod_3',
      name: 'قميص قطني رجالي',
      sku: 'SHIRT001',
      price: 149.00,
      sale_price: 99.00,
      stock: 50,
      image: 'https://via.placeholder.com/400x400?text=Cotton+Shirt'
    }
  };

  const product = products[product_id];
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'المنتج غير موجود'
    });
  }

  if (quantity > product.stock) {
    return res.status(400).json({
      success: false,
      message: `الكمية المطلوبة غير متوفرة. المتوفر: ${product.stock}`
    });
  }

  const cartItem = {
    id: `cart_item_${Date.now()}`,
    product_id: product.id,
    product_name: product.name,
    product_sku: product.sku,
    product_image: product.image,
    unit_price: product.price,
    sale_price: product.sale_price,
    quantity: parseInt(quantity),
    total_price: (product.sale_price || product.price) * parseInt(quantity),
    stock_available: product.stock,
    added_at: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'تم إضافة المنتج للسلة بنجاح',
    data: cartItem
  });
});

app.put('/api/companies/:companyId/cart/:sessionId/update/:itemId', async (req, res) => {
  console.log('✏️ [API] طلب تحديث كمية منتج في السلة للجلسة');
  const { companyId, sessionId, itemId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'الكمية يجب أن تكون أكبر من صفر'
    });
  }

  const updatedItem = {
    id: itemId,
    session_id: sessionId,
    product_id: 'prod_1',
    product_name: 'iPhone 15 Pro',
    product_sku: 'IPH15PRO001',
    product_image: 'https://via.placeholder.com/400x400?text=iPhone+15+Pro',
    unit_price: 4999.00,
    sale_price: 4499.00,
    quantity: parseInt(quantity),
    total_price: 4499.00 * parseInt(quantity),
    stock_available: 25,
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'تم تحديث كمية المنتج بنجاح',
    data: updatedItem
  });
});

app.delete('/api/companies/:companyId/cart/:sessionId/remove/:itemId', async (req, res) => {
  console.log('🗑️ [API] طلب حذف منتج من السلة للجلسة');
  const { companyId, sessionId, itemId } = req.params;

  res.json({
    success: true,
    message: 'تم حذف المنتج من السلة بنجاح'
  });
});

app.delete('/api/companies/:companyId/cart/:sessionId/clear', async (req, res) => {
  console.log('🗑️ [API] طلب تفريغ السلة للجلسة');
  const { companyId, sessionId } = req.params;

  res.json({
    success: true,
    message: 'تم تفريغ السلة بنجاح'
  });
});

app.put('/api/companies/:companyId/cart/update/:itemId', async (req, res) => {
  console.log('✏️ [API] طلب تحديث كمية منتج في السلة');
  const { companyId, itemId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'الكمية يجب أن تكون أكبر من صفر'
    });
  }

  const updatedItem = {
    id: itemId,
    product_id: 'prod_1',
    product_name: 'iPhone 15 Pro',
    product_sku: 'IPH15PRO001',
    product_image: 'https://via.placeholder.com/400x400?text=iPhone+15+Pro',
    unit_price: 4999.00,
    sale_price: 4499.00,
    quantity: parseInt(quantity),
    total_price: 4499.00 * parseInt(quantity),
    stock_available: 25,
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'تم تحديث كمية المنتج بنجاح',
    data: updatedItem
  });
});

app.delete('/api/companies/:companyId/cart/remove/:itemId', async (req, res) => {
  console.log('🗑️ [API] طلب حذف منتج من السلة');
  const { companyId, itemId } = req.params;

  res.json({
    success: true,
    message: 'تم حذف المنتج من السلة بنجاح'
  });
});

app.delete('/api/companies/:companyId/cart/clear', async (req, res) => {
  console.log('🗑️ [API] طلب تفريغ السلة');
  const { companyId } = req.params;
  const { customer_id } = req.query;

  res.json({
    success: true,
    message: 'تم تفريغ السلة بنجاح'
  });
});

app.post('/api/companies/:companyId/cart/checkout', async (req, res) => {
  console.log('💳 [API] طلب إتمام عملية الشراء');
  const { companyId } = req.params;
  const {
    customer_info,
    shipping_address,
    payment_method,
    notes
  } = req.body;

  if (!customer_info || !customer_info.name || !customer_info.email) {
    return res.status(400).json({
      success: false,
      message: 'معلومات العميل (الاسم والإيميل) مطلوبة'
    });
  }

  if (!shipping_address || !shipping_address.street || !shipping_address.city) {
    return res.status(400).json({
      success: false,
      message: 'عنوان الشحن مطلوب'
    });
  }

  const newOrder = {
    id: `order_${Date.now()}`,
    order_number: `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    customer_name: customer_info.name,
    customer_email: customer_info.email,
    customer_phone: customer_info.phone || '',
    status: 'pending',
    total_amount: 4697.00,
    subtotal: 4697.00,
    tax_amount: 0.00,
    shipping_amount: 0.00,
    discount_amount: 0.00,
    items_count: 3,
    payment_method: payment_method || 'cash_on_delivery',
    payment_status: 'pending',
    shipping_address: shipping_address,
    notes: notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الطلب بنجاح',
    data: newOrder
  });
});

// 💳 مسارات إتمام الطلبات (Checkout)
app.post('/api/companies/:companyId/checkout', async (req, res) => {
  console.log('💳 [API] طلب إتمام عملية الشراء');
  const { companyId } = req.params;
  const {
    customer_info,
    shipping_address,
    payment_method,
    notes,
    items,
    summary,
    session_id
  } = req.body;

  if (!customer_info || !customer_info.name || !customer_info.phone) {
    return res.status(400).json({
      success: false,
      message: 'معلومات العميل (الاسم والهاتف) مطلوبة'
    });
  }

  if (!shipping_address || !shipping_address.street || !shipping_address.city) {
    return res.status(400).json({
      success: false,
      message: 'عنوان الشحن مطلوب'
    });
  }

  if (!items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن إتمام طلب بدون منتجات'
    });
  }

  const newOrder = {
    id: `order_${Date.now()}`,
    order_number: `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    company_id: companyId,
    session_id: session_id,
    customer_name: customer_info.name,
    customer_email: customer_info.email || '',
    customer_phone: customer_info.phone,
    status: 'pending',
    payment_method: payment_method || 'cash_on_delivery',
    payment_status: 'pending',
    shipping_address: {
      name: customer_info.name,
      street: shipping_address.street,
      city: shipping_address.city,
      postal_code: shipping_address.postal_code || '',
      country: shipping_address.country || 'السعودية',
      phone: customer_info.phone
    },
    items: items.map(item => ({
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku || '',
      quantity: item.quantity,
      unit_price: item.unit_price,
      sale_price: item.sale_price,
      total_price: item.total_price
    })),
    subtotal: summary?.subtotal || items.reduce((sum, item) => sum + item.total_price, 0),
    tax_amount: summary?.tax || 0,
    shipping_amount: summary?.shipping || 0,
    discount_amount: summary?.discount || 0,
    total_amount: summary?.total || items.reduce((sum, item) => sum + item.total_price, 0),
    notes: notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الطلب بنجاح',
    data: newOrder
  });
});

app.get('/api/companies/:companyId/orders/:orderId', async (req, res) => {
  console.log('📋 [API] طلب جلب تفاصيل طلب محدد');
  const { companyId, orderId } = req.params;

  const orderDetails = {
    id: orderId,
    order_number: 'ORD-2025-123456',
    company_id: companyId,
    customer_name: 'أحمد محمد',
    customer_email: 'ahmed@example.com',
    customer_phone: '+966501234567',
    status: 'confirmed',
    payment_method: 'cash_on_delivery',
    payment_status: 'pending',
    total_amount: 4697.00,
    subtotal: 4697.00,
    tax_amount: 0.00,
    shipping_amount: 0.00,
    discount_amount: 0.00,
    items: [
      {
        id: 'item_1',
        product_id: 'prod_1',
        product_name: 'iPhone 15 Pro',
        product_sku: 'IPH15PRO001',
        quantity: 1,
        unit_price: 4999.00,
        sale_price: 4499.00,
        total_price: 4499.00
      },
      {
        id: 'item_2',
        product_id: 'prod_3',
        product_name: 'قميص قطني رجالي',
        product_sku: 'SHIRT001',
        quantity: 2,
        unit_price: 149.00,
        sale_price: 99.00,
        total_price: 198.00
      }
    ],
    shipping_address: {
      name: 'أحمد محمد',
      street: 'شارع الملك فهد',
      city: 'الرياض',
      postal_code: '12345',
      country: 'السعودية',
      phone: '+966501234567'
    },
    notes: 'توصيل سريع',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z'
  };

  res.json({
    success: true,
    data: orderDetails
  });
});

// تحديث حالة الطلب
app.patch('/api/companies/:companyId/orders/:orderId/status', async (req, res) => {
  console.log('📝 [API] طلب تحديث حالة الطلب');
  const { companyId, orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'حالة الطلب مطلوبة'
    });
  }

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'حالة الطلب غير صحيحة'
    });
  }

  const updatedOrder = {
    id: orderId,
    order_number: 'ORD-2025-123456',
    company_id: companyId,
    status: status,
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'تم تحديث حالة الطلب بنجاح',
    data: updatedOrder
  });
});

// تحديث حالة الدفع
app.patch('/api/companies/:companyId/orders/:orderId/payment', async (req, res) => {
  console.log('💳 [API] طلب تحديث حالة الدفع');
  const { companyId, orderId } = req.params;
  const { payment_status } = req.body;

  if (!payment_status) {
    return res.status(400).json({
      success: false,
      message: 'حالة الدفع مطلوبة'
    });
  }

  const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
  if (!validPaymentStatuses.includes(payment_status)) {
    return res.status(400).json({
      success: false,
      message: 'حالة الدفع غير صحيحة'
    });
  }

  const updatedOrder = {
    id: orderId,
    order_number: 'ORD-2025-123456',
    company_id: companyId,
    payment_status: payment_status,
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'تم تحديث حالة الدفع بنجاح',
    data: updatedOrder
  });
});

// 🎫 مسارات إدارة الكوبونات
app.get('/api/companies/:companyId/coupons', async (req, res) => {
  console.log('🎫 [API] طلب جلب الكوبونات');
  const { companyId } = req.params;
  const { status, type } = req.query;

  let coupons = [
    {
      id: 'coupon_1',
      code: 'SAVE20',
      name: 'خصم 20%',
      description: 'خصم 20% على جميع المنتجات',
      type: 'percentage',
      value: 20,
      min_order_amount: 100,
      max_discount_amount: 500,
      usage_limit: 100,
      used_count: 15,
      start_date: '2025-01-01T00:00:00Z',
      end_date: '2025-12-31T23:59:59Z',
      status: 'active',
      company_id: companyId,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z'
    },
    {
      id: 'coupon_2',
      code: 'WELCOME50',
      name: 'ترحيب 50 ريال',
      description: 'خصم 50 ريال للعملاء الجدد',
      type: 'fixed',
      value: 50,
      min_order_amount: 200,
      max_discount_amount: null,
      usage_limit: 50,
      used_count: 8,
      start_date: '2025-01-01T00:00:00Z',
      end_date: '2025-06-30T23:59:59Z',
      status: 'active',
      company_id: companyId,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z'
    },
    {
      id: 'coupon_3',
      code: 'EXPIRED10',
      name: 'خصم منتهي الصلاحية',
      description: 'كوبون منتهي الصلاحية',
      type: 'percentage',
      value: 10,
      min_order_amount: 50,
      max_discount_amount: 100,
      usage_limit: 200,
      used_count: 45,
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2024-12-31T23:59:59Z',
      status: 'expired',
      company_id: companyId,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  ];

  // فلترة حسب الحالة
  if (status) {
    coupons = coupons.filter(c => c.status === status);
  }

  // فلترة حسب النوع
  if (type) {
    coupons = coupons.filter(c => c.type === type);
  }

  res.json({
    success: true,
    data: coupons,
    pagination: {
      current_page: 1,
      per_page: 20,
      total: coupons.length,
      total_pages: 1
    }
  });
});

app.post('/api/companies/:companyId/coupons', async (req, res) => {
  console.log('🎫 [API] طلب إنشاء كوبون جديد');
  const { companyId } = req.params;
  const {
    code,
    name,
    description,
    type,
    value,
    min_order_amount,
    max_discount_amount,
    usage_limit,
    start_date,
    end_date
  } = req.body;

  // التحقق من البيانات المطلوبة
  if (!code || !name || !type || !value) {
    return res.status(400).json({
      success: false,
      message: 'البيانات المطلوبة: كود الكوبون، الاسم، النوع، والقيمة'
    });
  }

  // التحقق من نوع الخصم
  if (!['percentage', 'fixed'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'نوع الخصم يجب أن يكون percentage أو fixed'
    });
  }

  // التحقق من قيمة الخصم
  if (type === 'percentage' && (value < 1 || value > 100)) {
    return res.status(400).json({
      success: false,
      message: 'نسبة الخصم يجب أن تكون بين 1 و 100'
    });
  }

  if (type === 'fixed' && value < 1) {
    return res.status(400).json({
      success: false,
      message: 'قيمة الخصم الثابت يجب أن تكون أكبر من صفر'
    });
  }

  const newCoupon = {
    id: `coupon_${Date.now()}`,
    code: code.toUpperCase(),
    name,
    description: description || '',
    type,
    value: parseFloat(value),
    min_order_amount: min_order_amount ? parseFloat(min_order_amount) : 0,
    max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
    usage_limit: usage_limit ? parseInt(usage_limit) : null,
    used_count: 0,
    start_date: start_date || new Date().toISOString(),
    end_date: end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    company_id: companyId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الكوبون بنجاح',
    data: newCoupon
  });
});

app.put('/api/companies/:companyId/coupons/:couponId', async (req, res) => {
  console.log('📝 [API] طلب تحديث الكوبون');
  const { companyId, couponId } = req.params;
  const {
    name,
    description,
    type,
    value,
    min_order_amount,
    max_discount_amount,
    usage_limit,
    start_date,
    end_date,
    status
  } = req.body;

  // التحقق من وجود الكوبون (محاكاة)
  if (!couponId.startsWith('coupon_')) {
    return res.status(404).json({
      success: false,
      message: 'الكوبون غير موجود'
    });
  }

  // التحقق من نوع الخصم إذا تم تمريره
  if (type && !['percentage', 'fixed'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'نوع الخصم يجب أن يكون percentage أو fixed'
    });
  }

  // التحقق من قيمة الخصم إذا تم تمريرها
  if (value !== undefined) {
    if (type === 'percentage' && (value < 1 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'نسبة الخصم يجب أن تكون بين 1 و 100'
      });
    }

    if (type === 'fixed' && value < 1) {
      return res.status(400).json({
        success: false,
        message: 'قيمة الخصم الثابت يجب أن تكون أكبر من صفر'
      });
    }
  }

  // التحقق من الحالة إذا تم تمريرها
  if (status && !['active', 'inactive', 'expired'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'حالة الكوبون يجب أن تكون active أو inactive أو expired'
    });
  }

  const updatedCoupon = {
    id: couponId,
    code: 'SAVE20', // في التطبيق الحقيقي، سيتم جلب الكود الحالي
    name: name || 'خصم 20%',
    description: description || 'خصم 20% على جميع المنتجات',
    type: type || 'percentage',
    value: value !== undefined ? parseFloat(value) : 20,
    min_order_amount: min_order_amount !== undefined ? parseFloat(min_order_amount) : 100,
    max_discount_amount: max_discount_amount !== undefined ? (max_discount_amount ? parseFloat(max_discount_amount) : null) : 500,
    usage_limit: usage_limit !== undefined ? (usage_limit ? parseInt(usage_limit) : null) : 100,
    used_count: 15, // في التطبيق الحقيقي، سيتم الاحتفاظ بالقيمة الحالية
    start_date: start_date || '2025-01-01T00:00:00Z',
    end_date: end_date || '2025-12-31T23:59:59Z',
    status: status || 'active',
    company_id: companyId,
    created_at: '2025-01-01T10:00:00Z', // في التطبيق الحقيقي، سيتم الاحتفاظ بالقيمة الحالية
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'تم تحديث الكوبون بنجاح',
    data: updatedCoupon
  });
});

app.delete('/api/companies/:companyId/coupons/:couponId', async (req, res) => {
  console.log('🗑️ [API] طلب حذف الكوبون');
  const { companyId, couponId } = req.params;

  // التحقق من وجود الكوبون (محاكاة)
  if (!couponId.startsWith('coupon_')) {
    return res.status(404).json({
      success: false,
      message: 'الكوبون غير موجود'
    });
  }

  res.json({
    success: true,
    message: 'تم حذف الكوبون بنجاح'
  });
});

// مسار التحقق من صحة كوبون
app.post('/api/companies/:companyId/coupons/validate', async (req, res) => {
  console.log('✅ [API] طلب التحقق من صحة الكوبون');
  const { companyId } = req.params;
  const { code, order_total } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'كود الكوبون مطلوب'
    });
  }

  // محاكاة البحث عن الكوبون
  const coupons = {
    'SAVE20': {
      id: 'coupon_1',
      code: 'SAVE20',
      name: 'خصم 20%',
      type: 'percentage',
      value: 20,
      min_order_amount: 100,
      max_discount_amount: 500,
      status: 'active'
    },
    'WELCOME50': {
      id: 'coupon_2',
      code: 'WELCOME50',
      name: 'ترحيب 50 ريال',
      type: 'fixed',
      value: 50,
      min_order_amount: 200,
      max_discount_amount: null,
      status: 'active'
    }
  };

  const coupon = coupons[code.toUpperCase()];

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: 'كود الكوبون غير صحيح'
    });
  }

  if (coupon.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'الكوبون غير نشط'
    });
  }

  if (order_total && coupon.min_order_amount && order_total < coupon.min_order_amount) {
    return res.status(400).json({
      success: false,
      message: `الحد الأدنى للطلب هو ${coupon.min_order_amount} ريال`
    });
  }

  // حساب قيمة الخصم
  let discount_amount = 0;
  if (coupon.type === 'percentage') {
    discount_amount = (order_total * coupon.value) / 100;
    if (coupon.max_discount_amount && discount_amount > coupon.max_discount_amount) {
      discount_amount = coupon.max_discount_amount;
    }
  } else {
    discount_amount = coupon.value;
  }

  res.json({
    success: true,
    message: 'الكوبون صحيح',
    data: {
      coupon: coupon,
      discount_amount: discount_amount,
      final_total: Math.max(0, order_total - discount_amount)
    }
  });
});

// 🚚 مسارات إدارة طرق الشحن
app.get('/api/companies/:companyId/shipping-methods', async (req, res) => {
  console.log('🚚 [API] طلب جلب طرق الشحن');
  const { companyId } = req.params;
  const { status, type } = req.query;

  let shippingMethods = [
    {
      id: 'shipping_1',
      name: 'توصيل عادي',
      description: 'توصيل خلال 3-5 أيام عمل',
      type: 'standard',
      cost: 25.00,
      free_shipping_threshold: 200.00,
      estimated_days_min: 3,
      estimated_days_max: 5,
      is_active: true,
      available_cities: ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'],
      company_id: companyId,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z'
    },
    {
      id: 'shipping_2',
      name: 'توصيل سريع',
      description: 'توصيل خلال 24-48 ساعة',
      type: 'express',
      cost: 50.00,
      free_shipping_threshold: 500.00,
      estimated_days_min: 1,
      estimated_days_max: 2,
      is_active: true,
      available_cities: ['الرياض', 'جدة', 'الدمام'],
      company_id: companyId,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z'
    },
    {
      id: 'shipping_3',
      name: 'توصيل فوري',
      description: 'توصيل خلال ساعات (داخل المدينة فقط)',
      type: 'same_day',
      cost: 75.00,
      free_shipping_threshold: 1000.00,
      estimated_days_min: 0,
      estimated_days_max: 1,
      is_active: true,
      available_cities: ['الرياض', 'جدة'],
      company_id: companyId,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z'
    },
    {
      id: 'shipping_4',
      name: 'توصيل اقتصادي',
      description: 'توصيل خلال 7-10 أيام عمل (أقل تكلفة)',
      type: 'economy',
      cost: 15.00,
      free_shipping_threshold: 150.00,
      estimated_days_min: 7,
      estimated_days_max: 10,
      is_active: false,
      available_cities: ['جميع المدن'],
      company_id: companyId,
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z'
    }
  ];

  // فلترة حسب الحالة
  if (status === 'active') {
    shippingMethods = shippingMethods.filter(m => m.is_active);
  } else if (status === 'inactive') {
    shippingMethods = shippingMethods.filter(m => !m.is_active);
  }

  // فلترة حسب النوع
  if (type) {
    shippingMethods = shippingMethods.filter(m => m.type === type);
  }

  res.json({
    success: true,
    data: shippingMethods,
    pagination: {
      current_page: 1,
      per_page: 20,
      total: shippingMethods.length,
      total_pages: 1
    }
  });
});

app.post('/api/companies/:companyId/shipping-methods', async (req, res) => {
  console.log('🚚 [API] طلب إنشاء طريقة شحن جديدة');
  const { companyId } = req.params;
  const {
    name,
    description,
    type,
    cost,
    free_shipping_threshold,
    estimated_days_min,
    estimated_days_max,
    available_cities
  } = req.body;

  // التحقق من البيانات المطلوبة
  if (!name || !type || cost === undefined) {
    return res.status(400).json({
      success: false,
      message: 'البيانات المطلوبة: اسم الطريقة، النوع، والتكلفة'
    });
  }

  // التحقق من نوع الشحن
  const validTypes = ['standard', 'express', 'same_day', 'economy', 'pickup'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'نوع الشحن غير صحيح'
    });
  }

  // التحقق من التكلفة
  if (cost < 0) {
    return res.status(400).json({
      success: false,
      message: 'تكلفة الشحن يجب أن تكون أكبر من أو تساوي صفر'
    });
  }

  const newShippingMethod = {
    id: `shipping_${Date.now()}`,
    name,
    description: description || '',
    type,
    cost: parseFloat(cost),
    free_shipping_threshold: free_shipping_threshold ? parseFloat(free_shipping_threshold) : null,
    estimated_days_min: estimated_days_min ? parseInt(estimated_days_min) : 1,
    estimated_days_max: estimated_days_max ? parseInt(estimated_days_max) : 3,
    is_active: true,
    available_cities: available_cities || ['جميع المدن'],
    company_id: companyId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'تم إنشاء طريقة الشحن بنجاح',
    data: newShippingMethod
  });
});

app.put('/api/companies/:companyId/shipping-methods/:methodId', async (req, res) => {
  console.log('📝 [API] طلب تحديث طريقة الشحن');
  const { companyId, methodId } = req.params;
  const {
    name,
    description,
    type,
    cost,
    free_shipping_threshold,
    estimated_days_min,
    estimated_days_max,
    is_active,
    available_cities
  } = req.body;

  // التحقق من وجود طريقة الشحن (محاكاة)
  if (!methodId.startsWith('shipping_')) {
    return res.status(404).json({
      success: false,
      message: 'طريقة الشحن غير موجودة'
    });
  }

  // التحقق من نوع الشحن إذا تم تمريره
  if (type) {
    const validTypes = ['standard', 'express', 'same_day', 'economy', 'pickup'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'نوع الشحن غير صحيح'
      });
    }
  }

  // التحقق من التكلفة إذا تم تمريرها
  if (cost !== undefined && cost < 0) {
    return res.status(400).json({
      success: false,
      message: 'تكلفة الشحن يجب أن تكون أكبر من أو تساوي صفر'
    });
  }

  const updatedShippingMethod = {
    id: methodId,
    name: name || 'توصيل عادي',
    description: description || 'توصيل خلال 3-5 أيام عمل',
    type: type || 'standard',
    cost: cost !== undefined ? parseFloat(cost) : 25.00,
    free_shipping_threshold: free_shipping_threshold !== undefined ? (free_shipping_threshold ? parseFloat(free_shipping_threshold) : null) : 200.00,
    estimated_days_min: estimated_days_min !== undefined ? parseInt(estimated_days_min) : 3,
    estimated_days_max: estimated_days_max !== undefined ? parseInt(estimated_days_max) : 5,
    is_active: is_active !== undefined ? is_active : true,
    available_cities: available_cities || ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'],
    company_id: companyId,
    created_at: '2025-01-01T10:00:00Z', // في التطبيق الحقيقي، سيتم الاحتفاظ بالقيمة الحالية
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'تم تحديث طريقة الشحن بنجاح',
    data: updatedShippingMethod
  });
});

app.delete('/api/companies/:companyId/shipping-methods/:methodId', async (req, res) => {
  console.log('🗑️ [API] طلب حذف طريقة الشحن');
  const { companyId, methodId } = req.params;

  // التحقق من وجود طريقة الشحن (محاكاة)
  if (!methodId.startsWith('shipping_')) {
    return res.status(404).json({
      success: false,
      message: 'طريقة الشحن غير موجودة'
    });
  }

  res.json({
    success: true,
    message: 'تم حذف طريقة الشحن بنجاح'
  });
});

// مسار حساب تكلفة الشحن
app.post('/api/companies/:companyId/shipping-methods/calculate', async (req, res) => {
  console.log('💰 [API] طلب حساب تكلفة الشحن');
  const { companyId } = req.params;
  const { city, order_total, shipping_method_id } = req.body;

  if (!city || !order_total) {
    return res.status(400).json({
      success: false,
      message: 'المدينة ومجموع الطلب مطلوبان'
    });
  }

  // محاكاة طرق الشحن المتاحة
  const shippingMethods = {
    'shipping_1': {
      id: 'shipping_1',
      name: 'توصيل عادي',
      cost: 25.00,
      free_shipping_threshold: 200.00,
      available_cities: ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة']
    },
    'shipping_2': {
      id: 'shipping_2',
      name: 'توصيل سريع',
      cost: 50.00,
      free_shipping_threshold: 500.00,
      available_cities: ['الرياض', 'جدة', 'الدمام']
    },
    'shipping_3': {
      id: 'shipping_3',
      name: 'توصيل فوري',
      cost: 75.00,
      free_shipping_threshold: 1000.00,
      available_cities: ['الرياض', 'جدة']
    }
  };

  if (shipping_method_id) {
    // حساب تكلفة طريقة شحن محددة
    const method = shippingMethods[shipping_method_id];
    if (!method) {
      return res.status(404).json({
        success: false,
        message: 'طريقة الشحن غير موجودة'
      });
    }

    if (!method.available_cities.includes(city) && !method.available_cities.includes('جميع المدن')) {
      return res.status(400).json({
        success: false,
        message: 'طريقة الشحن غير متاحة لهذه المدينة'
      });
    }

    const shipping_cost = order_total >= method.free_shipping_threshold ? 0 : method.cost;

    res.json({
      success: true,
      data: {
        shipping_method: method,
        shipping_cost: shipping_cost,
        is_free: shipping_cost === 0,
        total_with_shipping: order_total + shipping_cost
      }
    });
  } else {
    // إرجاع جميع طرق الشحن المتاحة مع التكلفة
    const availableMethods = Object.values(shippingMethods)
      .filter(method => method.available_cities.includes(city) || method.available_cities.includes('جميع المدن'))
      .map(method => ({
        ...method,
        shipping_cost: order_total >= method.free_shipping_threshold ? 0 : method.cost,
        is_free: order_total >= method.free_shipping_threshold,
        total_with_shipping: order_total + (order_total >= method.free_shipping_threshold ? 0 : method.cost)
      }));

    res.json({
      success: true,
      data: availableMethods
    });
  }
});

// 💬 مسارات المحادثات والرسائل
app.get('/api/companies/:companyId/conversations', async (req, res) => {
  console.log('💬 [API] طلب جلب محادثات الشركة');
  const { companyId } = req.params;
  const { limit = 50, recent_only = false } = req.query;

  // محاكاة محادثات WhatsApp و Facebook
  const conversations = [
    {
      id: 'conv_whatsapp_1',
      facebook_page_id: 'whatsapp_page_1',
      customer_name: 'أحمد محمد',
      customer_facebook_id: 'whatsapp_966501234567',
      last_message: 'مرحبا، أريد الاستفسار عن منتجاتكم',
      last_message_at: '2025-07-11T09:30:00Z',
      is_online: true,
      unread_count: 2,
      conversation_status: 'active',
      page_id: 'whatsapp_page_1',
      created_at: '2025-07-11T09:00:00Z',
      updated_at: '2025-07-11T09:30:00Z',
      page_name: 'متجر الإلكترونيات - WhatsApp',
      page_picture_url: '/images/whatsapp-logo.png',
      company_id: companyId,
      platform: 'whatsapp',
      customer_phone: '+966501234567'
    },
    {
      id: 'conv_whatsapp_2',
      facebook_page_id: 'whatsapp_page_1',
      customer_name: 'فاطمة أحمد',
      customer_facebook_id: 'whatsapp_966507654321',
      last_message: 'شكرا لكم، تم استلام الطلب',
      last_message_at: '2025-07-11T08:45:00Z',
      is_online: false,
      unread_count: 0,
      conversation_status: 'resolved',
      page_id: 'whatsapp_page_1',
      created_at: '2025-07-11T08:00:00Z',
      updated_at: '2025-07-11T08:45:00Z',
      page_name: 'متجر الإلكترونيات - WhatsApp',
      page_picture_url: '/images/whatsapp-logo.png',
      company_id: companyId,
      platform: 'whatsapp',
      customer_phone: '+966507654321'
    },
    {
      id: 'conv_facebook_1',
      facebook_page_id: 'facebook_page_1',
      customer_name: 'محمد علي',
      customer_facebook_id: 'facebook_123456789',
      last_message: 'هل يمكنني معرفة أسعار الهواتف الذكية؟',
      last_message_at: '2025-07-11T07:20:00Z',
      is_online: true,
      unread_count: 1,
      conversation_status: 'pending',
      page_id: 'facebook_page_1',
      created_at: '2025-07-11T07:00:00Z',
      updated_at: '2025-07-11T07:20:00Z',
      page_name: 'متجر الإلكترونيات - Facebook',
      page_picture_url: '/images/facebook-logo.png',
      company_id: companyId,
      platform: 'facebook'
    },
    {
      id: 'conv_whatsapp_3',
      facebook_page_id: 'whatsapp_page_1',
      customer_name: 'سارة خالد',
      customer_facebook_id: 'whatsapp_966509876543',
      last_message: 'متى سيتم توصيل الطلب؟',
      last_message_at: '2025-07-11T06:15:00Z',
      is_online: false,
      unread_count: 3,
      conversation_status: 'active',
      page_id: 'whatsapp_page_1',
      created_at: '2025-07-11T06:00:00Z',
      updated_at: '2025-07-11T06:15:00Z',
      page_name: 'متجر الإلكترونيات - WhatsApp',
      page_picture_url: '/images/whatsapp-logo.png',
      company_id: companyId,
      platform: 'whatsapp',
      customer_phone: '+966509876543'
    }
  ];

  // فلترة المحادثات الحديثة إذا طُلب ذلك
  let filteredConversations = conversations;
  if (recent_only === 'true') {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    filteredConversations = conversations.filter(conv =>
      new Date(conv.last_message_at) > oneDayAgo
    );
  }

  // تطبيق الحد الأقصى
  const limitedConversations = filteredConversations.slice(0, parseInt(limit));

  res.json({
    success: true,
    data: limitedConversations,
    total: limitedConversations.length,
    filters: {
      limit: parseInt(limit),
      recent_only: recent_only === 'true'
    }
  });
});

app.get('/api/conversations/:conversationId/messages', async (req, res) => {
  console.log('💌 [API] طلب جلب رسائل المحادثة');
  const { conversationId } = req.params;
  const { company_id, limit = 50, recent_only = false } = req.query;

  console.log('📝 معرف المحادثة:', conversationId);
  console.log('🏢 معرف الشركة:', company_id);

  // محاكاة رسائل مختلفة حسب المحادثة
  let messages = [];

  if (conversationId === 'conv_whatsapp_1') {
    messages = [
      {
        id: 'msg_whatsapp_1_1',
        conversation_id: conversationId,
        sender_type: 'customer',
        sender_name: 'أحمد محمد',
        message_text: 'مرحبا، أريد الاستفسار عن منتجاتكم',
        content: 'مرحبا، أريد الاستفسار عن منتجاتكم',
        message_type: 'text',
        created_at: '2025-07-11T09:00:00Z',
        timestamp: '2025-07-11T09:00:00Z',
        is_read: true,
        is_from_page: 0,
        status: 'delivered'
      },
      {
        id: 'msg_whatsapp_1_2',
        conversation_id: conversationId,
        sender_type: 'admin',
        sender_name: 'خدمة العملاء',
        message_text: 'أهلا وسهلا بك! يمكنك تصفح منتجاتنا من خلال موقعنا الإلكتروني',
        content: 'أهلا وسهلا بك! يمكنك تصفح منتجاتنا من خلال موقعنا الإلكتروني',
        message_type: 'text',
        created_at: '2025-07-11T09:15:00Z',
        timestamp: '2025-07-11T09:15:00Z',
        is_read: true,
        is_from_page: 1,
        status: 'delivered'
      },
      {
        id: 'msg_whatsapp_1_3',
        conversation_id: conversationId,
        sender_type: 'customer',
        sender_name: 'أحمد محمد',
        message_text: 'هل لديكم عروض على الهواتف الذكية؟',
        content: 'هل لديكم عروض على الهواتف الذكية؟',
        message_type: 'text',
        created_at: '2025-07-11T09:30:00Z',
        timestamp: '2025-07-11T09:30:00Z',
        is_read: false,
        is_from_page: 0,
        status: 'delivered'
      }
    ];
  } else if (conversationId === 'conv_facebook_1') {
    messages = [
      {
        id: 'msg_facebook_1_1',
        conversation_id: conversationId,
        sender_type: 'customer',
        sender_name: 'محمد علي',
        message_text: 'هل يمكنني معرفة أسعار الهواتف الذكية؟',
        content: 'هل يمكنني معرفة أسعار الهواتف الذكية؟',
        message_type: 'text',
        created_at: '2025-07-11T07:20:00Z',
        timestamp: '2025-07-11T07:20:00Z',
        is_read: false,
        is_from_page: 0,
        status: 'delivered'
      }
    ];
  } else {
    // رسائل افتراضية للمحادثات الأخرى
    messages = [
      {
        id: `msg_${conversationId}_1`,
        conversation_id: conversationId,
        sender_type: 'customer',
        sender_name: 'عميل',
        message_text: 'مرحبا',
        content: 'مرحبا',
        message_type: 'text',
        created_at: '2025-07-11T06:00:00Z',
        timestamp: '2025-07-11T06:00:00Z',
        is_read: true,
        is_from_page: 0,
        status: 'delivered'
      }
    ];
  }

  // فلترة الرسائل الحديثة إذا طُلب ذلك
  let filteredMessages = messages;
  if (recent_only === 'true') {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    filteredMessages = messages.filter(msg =>
      new Date(msg.created_at) > oneDayAgo
    );
  }

  // تطبيق الحد الأقصى
  const limitedMessages = filteredMessages.slice(0, parseInt(limit));

  res.json({
    success: true,
    data: limitedMessages,
    total: limitedMessages.length,
    filters: {
      conversation_id: conversationId,
      company_id,
      limit: parseInt(limit),
      recent_only: recent_only === 'true'
    }
  });
});

app.post('/api/conversations/:conversationId/messages', async (req, res) => {
  console.log('📤 [API] طلب إرسال رسالة جديدة');
  const { conversationId } = req.params;
  const { message_text, content, company_id, message_type = 'text', image_data, image_name } = req.body;

  console.log('📝 إرسال رسالة للمحادثة:', conversationId);
  console.log('💬 محتوى الرسالة:', message_text || content);
  console.log('🖼️ صورة مرفقة:', !!image_data);

  // إنشاء رسالة جديدة
  const newMessage = {
    id: `msg_${Date.now()}`,
    conversation_id: conversationId,
    sender_type: 'admin',
    sender_name: 'خدمة العملاء',
    message_text: message_text || content,
    content: message_text || content,
    message_type: image_data ? 'image' : message_type,
    created_at: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    is_read: true,
    is_from_page: 1,
    status: 'delivered'
  };

  // إضافة رابط الصورة إذا كانت موجودة
  if (image_data && image_name) {
    newMessage.image_url = `/uploads/messages/${image_name}`;
    newMessage.message_text = newMessage.message_text || 'صورة';
    newMessage.content = newMessage.content || 'صورة';
  }

  res.json({
    success: true,
    message: 'تم إرسال الرسالة بنجاح',
    data: newMessage
  });
});

// 🔧 مسارات متغيرات المنتجات
app.get('/api/companies/:companyId/product-variants', async (req, res) => {
  console.log('🔍 [API] طلب جلب متغيرات المنتجات');
  const { companyId } = req.params;
  const { product_id, status } = req.query;

  // محاكاة متغيرات المنتجات
  let productVariants = [
    {
      id: 'variant_1',
      product_id: 'prod_1',
      product_name: 'iPhone 15 Pro',
      variant_name: 'iPhone 15 Pro - 128GB - أزرق تيتانيوم',
      attributes: {
        storage: '128GB',
        color: 'أزرق تيتانيوم',
        model: 'Pro'
      },
      sku: 'IPH15P-128-BLUE',
      price: 4499.00,
      compare_at_price: 4799.00,
      cost_price: 3200.00,
      stock_quantity: 25,
      weight: 187,
      dimensions: '146.6 × 70.6 × 8.25 mm',
      barcode: '194253715634',
      is_active: true,
      is_default: true,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-20T14:45:00Z'
    },
    {
      id: 'variant_2',
      product_id: 'prod_1',
      product_name: 'iPhone 15 Pro',
      variant_name: 'iPhone 15 Pro - 256GB - أزرق تيتانيوم',
      attributes: {
        storage: '256GB',
        color: 'أزرق تيتانيوم',
        model: 'Pro'
      },
      sku: 'IPH15P-256-BLUE',
      price: 4999.00,
      compare_at_price: 5299.00,
      cost_price: 3600.00,
      stock_quantity: 18,
      weight: 187,
      dimensions: '146.6 × 70.6 × 8.25 mm',
      barcode: '194253715641',
      is_active: true,
      is_default: false,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-20T14:45:00Z'
    },
    {
      id: 'variant_3',
      product_id: 'prod_1',
      product_name: 'iPhone 15 Pro',
      variant_name: 'iPhone 15 Pro - 128GB - تيتانيوم طبيعي',
      attributes: {
        storage: '128GB',
        color: 'تيتانيوم طبيعي',
        model: 'Pro'
      },
      sku: 'IPH15P-128-NATURAL',
      price: 4499.00,
      compare_at_price: 4799.00,
      cost_price: 3200.00,
      stock_quantity: 12,
      weight: 187,
      dimensions: '146.6 × 70.6 × 8.25 mm',
      barcode: '194253715658',
      is_active: true,
      is_default: false,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-20T14:45:00Z'
    },
    {
      id: 'variant_4',
      product_id: 'prod_2',
      product_name: 'Samsung Galaxy S24',
      variant_name: 'Galaxy S24 - 128GB - أسود فانتوم',
      attributes: {
        storage: '128GB',
        color: 'أسود فانتوم',
        model: 'S24'
      },
      sku: 'SAM-S24-128-BLACK',
      price: 3299.00,
      compare_at_price: 3599.00,
      cost_price: 2400.00,
      stock_quantity: 30,
      weight: 167,
      dimensions: '147.0 × 70.6 × 7.6 mm',
      barcode: '8806095048567',
      is_active: true,
      is_default: true,
      created_at: '2024-01-10T09:15:00Z',
      updated_at: '2024-01-18T16:20:00Z'
    },
    {
      id: 'variant_5',
      product_id: 'prod_3',
      product_name: 'قميص قطني رجالي',
      variant_name: 'قميص قطني - مقاس L - أزرق',
      attributes: {
        size: 'L',
        color: 'أزرق',
        material: 'قطن 100%'
      },
      sku: 'SHIRT-L-BLUE',
      price: 89.00,
      compare_at_price: 120.00,
      cost_price: 45.00,
      stock_quantity: 50,
      weight: 200,
      dimensions: '30 × 25 × 2 cm',
      barcode: '1234567890123',
      is_active: true,
      is_default: false,
      created_at: '2024-01-05T08:00:00Z',
      updated_at: '2024-01-15T12:30:00Z'
    }
  ];

  // فلترة حسب المنتج إذا تم تحديده
  if (product_id) {
    productVariants = productVariants.filter(variant => variant.product_id === product_id);
  }

  // فلترة حسب الحالة إذا تم تحديدها
  if (status) {
    const isActive = status === 'active';
    productVariants = productVariants.filter(variant => variant.is_active === isActive);
  }

  res.json({
    success: true,
    data: productVariants,
    total: productVariants.length,
    filters: {
      product_id: product_id || 'all',
      status: status || 'all'
    }
  });
});

app.post('/api/companies/:companyId/product-variants', async (req, res) => {
  console.log('🔧 [API] طلب إنشاء متغير منتج جديد');
  const { companyId } = req.params;
  const variantData = req.body;

  console.log('📝 بيانات المتغير الجديد:', JSON.stringify(variantData, null, 2));

  // إنشاء ID جديد للمتغير
  const newVariant = {
    id: `variant_${Date.now()}`,
    ...variantData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'تم إنشاء متغير المنتج بنجاح',
    data: newVariant
  });
});

app.put('/api/companies/:companyId/product-variants/:variantId', async (req, res) => {
  console.log('📝 [API] طلب تحديث متغير منتج');
  const { companyId, variantId } = req.params;
  const updateData = req.body;

  console.log('🔄 تحديث متغير المنتج:', variantId);
  console.log('📝 البيانات المحدثة:', JSON.stringify(updateData, null, 2));

  // محاكاة تحديث المتغير
  const updatedVariant = {
    id: variantId,
    ...updateData,
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'تم تحديث متغير المنتج بنجاح',
    data: updatedVariant
  });
});

app.delete('/api/companies/:companyId/product-variants/:variantId', async (req, res) => {
  console.log('🗑️ [API] طلب حذف متغير منتج');
  const { companyId, variantId } = req.params;

  console.log('🗑️ حذف متغير المنتج:', variantId);

  res.json({
    success: true,
    message: 'تم حذف متغير المنتج بنجاح',
    data: { id: variantId }
  });
});

// 📱 مسارات WhatsApp Baileys
app.get('/api/whatsapp-baileys/status', async (req, res) => {
  console.log('📱 [API] طلب فحص حالة WhatsApp');

  // محاكاة حالة WhatsApp
  const whatsappStatus = {
    isConnected: false,
    state: 'disconnected',
    qrCode: null,
    phoneNumber: null,
    lastConnected: null
  };

  // محاكاة QR Code إذا لم يكن متصل
  if (!whatsappStatus.isConnected) {
    whatsappStatus.qrCode = 'whatsapp-qr-code-simulation-' + Date.now();
    whatsappStatus.state = 'qr_ready';
  }

  res.json({
    success: true,
    ...whatsappStatus
  });
});

app.get('/api/whatsapp-baileys/stats', async (req, res) => {
  console.log('📊 [API] طلب إحصائيات WhatsApp');

  // محاكاة إحصائيات WhatsApp
  const stats = {
    totalMessages: 1247,
    todayMessages: 89,
    activeChats: 23,
    responseTime: '2.5 دقيقة',
    messagesThisWeek: 567,
    messagesThisMonth: 2340,
    averageResponseTime: 150, // بالثواني
    customerSatisfaction: 4.7,
    peakHours: '14:00 - 16:00',
    mostActiveDay: 'الأحد'
  };

  res.json({
    success: true,
    stats
  });
});

app.get('/api/whatsapp-baileys/settings', async (req, res) => {
  console.log('⚙️ [API] طلب إعدادات WhatsApp');

  // محاكاة إعدادات WhatsApp
  const settings = {
    auto_reply_enabled: true,
    welcome_message: 'مرحباً بك! كيف يمكنني مساعدتك؟',
    business_hours: '9:00 - 18:00',
    away_message: 'نحن خارج ساعات العمل حالياً. سنرد عليك في أقرب وقت ممكن.',
    ai_enabled: false,
    ai_model: 'gemini-1.5-flash',
    ai_temperature: 0.7,
    max_response_time: 300, // 5 دقائق
    auto_read_messages: true,
    typing_indicator: true,
    delivery_receipts: true,
    group_messages_enabled: false,
    broadcast_enabled: true,
    webhook_url: '',
    webhook_enabled: false
  };

  res.json({
    success: true,
    settings
  });
});

app.post('/api/whatsapp-baileys/start', async (req, res) => {
  console.log('🚀 [API] طلب بدء خدمة WhatsApp');

  // محاكاة بدء الخدمة
  setTimeout(() => {
    console.log('✅ تم بدء خدمة WhatsApp بنجاح');
  }, 2000);

  res.json({
    success: true,
    message: 'تم بدء خدمة WhatsApp بنجاح',
    status: 'starting',
    qr_ready: true
  });
});

app.post('/api/whatsapp-baileys/disconnect', async (req, res) => {
  console.log('🔌 [API] طلب قطع اتصال WhatsApp');

  res.json({
    success: true,
    message: 'تم قطع اتصال WhatsApp بنجاح',
    status: 'disconnected'
  });
});

app.put('/api/whatsapp-baileys/settings', async (req, res) => {
  console.log('💾 [API] طلب حفظ إعدادات WhatsApp');
  const settings = req.body;

  console.log('📝 إعدادات WhatsApp المحدثة:', JSON.stringify(settings, null, 2));

  res.json({
    success: true,
    message: 'تم حفظ إعدادات WhatsApp بنجاح',
    settings
  });
});

app.post('/api/whatsapp-baileys/send-message', async (req, res) => {
  console.log('📤 [API] طلب إرسال رسالة WhatsApp');
  const { phoneNumber, message, messageType = 'text' } = req.body;

  console.log('📱 إرسال رسالة إلى:', phoneNumber);
  console.log('💬 محتوى الرسالة:', message);

  // محاكاة إرسال الرسالة
  const messageId = `msg_${Date.now()}`;

  res.json({
    success: true,
    message: 'تم إرسال الرسالة بنجاح',
    data: {
      messageId,
      phoneNumber,
      message,
      messageType,
      status: 'sent',
      timestamp: new Date().toISOString()
    }
  });
});

app.post('/api/whatsapp-baileys/ai-settings', async (req, res) => {
  console.log('🤖 [API] طلب حفظ إعدادات الذكاء الاصطناعي لـ WhatsApp');
  const aiSettings = req.body;

  console.log('📝 إعدادات الذكاء الاصطناعي المحدثة:', JSON.stringify(aiSettings, null, 2));

  // محاكاة حفظ إعدادات الذكاء الاصطناعي
  res.json({
    success: true,
    message: 'تم حفظ إعدادات الذكاء الاصطناعي بنجاح',
    data: {
      ...aiSettings,
      updated_at: new Date().toISOString()
    }
  });
});

app.post('/api/whatsapp-baileys/test-ai', async (req, res) => {
  console.log('🧪 [API] طلب اختبار الذكاء الاصطناعي لـ WhatsApp');
  const { message, settings } = req.body;

  console.log('💬 رسالة الاختبار:', message);
  console.log('⚙️ إعدادات الاختبار:', JSON.stringify(settings, null, 2));

  // محاكاة اختبار الذكاء الاصطناعي
  const testResponses = [
    'مرحباً! أنا مساعد ذكي جاهز لمساعدتك في أي استفسار حول منتجاتنا وخدماتنا.',
    'أهلاً وسهلاً! كيف يمكنني مساعدتك اليوم؟ يمكنني الإجابة على أسئلتك حول المنتجات والطلبات.',
    'مرحباً بك! أنا هنا لمساعدتك. يمكنني تقديم معلومات عن منتجاتنا ومساعدتك في إتمام طلبك.',
    'أهلاً! أنا مساعد ذكي مدرب لخدمة عملائنا الكرام. كيف يمكنني مساعدتك؟'
  ];

  const randomResponse = testResponses[Math.floor(Math.random() * testResponses.length)];

  // محاكاة تأخير الاستجابة
  setTimeout(() => {
    res.json({
      success: true,
      message: 'تم اختبار الذكاء الاصطناعي بنجاح',
      data: {
        test_message: message,
        ai_response: randomResponse,
        response_time: Math.floor(Math.random() * 3000) + 1000, // 1-4 ثواني
        model_used: settings.model || 'gemini-1.5-flash',
        timestamp: new Date().toISOString()
      }
    });
  }, 1500); // تأخير 1.5 ثانية لمحاكاة الاستجابة الحقيقية
});

app.get('/api/whatsapp-baileys/messages', async (req, res) => {
  console.log('💬 [API] طلب جلب رسائل WhatsApp');

  // محاكاة رسائل WhatsApp
  const messages = [
    {
      id: 'msg_1',
      phoneNumber: '+966501234567',
      message: 'مرحبا، أريد الاستفسار عن منتجاتكم',
      type: 'incoming',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // منذ ساعة
      status: 'read'
    },
    {
      id: 'msg_2',
      phoneNumber: '+966501234567',
      message: 'أهلاً وسهلاً بك! يمكنك تصفح منتجاتنا من خلال موقعنا الإلكتروني',
      type: 'outgoing',
      timestamp: new Date(Date.now() - 3300000).toISOString(), // منذ 55 دقيقة
      status: 'delivered'
    },
    {
      id: 'msg_3',
      phoneNumber: '+966507654321',
      message: 'هل لديكم عروض على الهواتف الذكية؟',
      type: 'incoming',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // منذ 30 دقيقة
      status: 'unread'
    },
    {
      id: 'msg_4',
      phoneNumber: '+966509876543',
      message: 'متى سيتم توصيل الطلب؟',
      type: 'incoming',
      timestamp: new Date(Date.now() - 900000).toISOString(), // منذ 15 دقيقة
      status: 'unread'
    },
    {
      id: 'msg_5',
      phoneNumber: '+966509876543',
      message: 'سيتم التوصيل خلال 24-48 ساعة من تأكيد الطلب',
      type: 'outgoing',
      timestamp: new Date(Date.now() - 600000).toISOString(), // منذ 10 دقائق
      status: 'sent'
    }
  ];

  res.json({
    success: true,
    messages,
    total: messages.length,
    unread: messages.filter(msg => msg.status === 'unread').length
  });
});

app.post('/api/gemini/test', async (req, res) => {
  console.log('🧪 [API] طلب اختبار Gemini AI');
  const { api_key } = req.body;

  console.log('🔑 اختبار API Key:', api_key ? 'موجود' : 'غير موجود');

  // محاكاة اختبار Gemini API
  if (!api_key) {
    return res.status(400).json({
      success: false,
      error: 'API Key مطلوب'
    });
  }

  // محاكاة تأخير الاختبار
  setTimeout(() => {
    // محاكاة نجاح الاختبار
    const isValid = api_key.startsWith('AIza') || api_key === 'test-key';

    if (isValid) {
      res.json({
        success: true,
        message: 'تم اختبار Gemini API بنجاح',
        data: {
          model: 'gemini-1.5-flash',
          status: 'connected',
          test_response: 'مرحباً! أنا Gemini AI جاهز للمساعدة.',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'API Key غير صحيح'
      });
    }
  }, 2000); // تأخير 2 ثانية لمحاكاة الاختبار الحقيقي
});

app.get('/api/gemini/settings', async (req, res) => {
  console.log('⚙️ [API] طلب جلب إعدادات Gemini');
  const { company_id } = req.query;

  console.log('🏢 معرف الشركة:', company_id);

  // محاكاة إعدادات Gemini
  const geminiSettings = {
    id: 'gemini_settings_1',
    company_id: company_id || 'c677b32f-fe1c-4c64-8362-a1c03406608d',
    api_key: '',
    model: 'gemini-2.5-flash-lite-preview-06-17',
    temperature: 0.7,
    max_tokens: 1000,
    is_enabled: false,
    prompt_template: '',
    personality_prompt: '',
    products_prompt: '',
    auto_reply_enabled: true,
    can_access_orders: true,
    can_access_products: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    data: geminiSettings
  });
});

app.post('/api/gemini/settings', async (req, res) => {
  console.log('💾 [API] طلب حفظ إعدادات Gemini');
  const settings = req.body;

  console.log('📝 إعدادات Gemini المحدثة:', JSON.stringify(settings, null, 2));

  // محاكاة حفظ إعدادات Gemini
  const savedSettings = {
    ...settings,
    id: 'gemini_settings_1',
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'تم حفظ إعدادات Gemini بنجاح',
    data: savedSettings
  });
});

app.put('/api/gemini/settings', async (req, res) => {
  console.log('✏️ [API] طلب تحديث إعدادات Gemini');
  const settings = req.body;

  console.log('📝 إعدادات Gemini المحدثة:', JSON.stringify(settings, null, 2));

  // محاكاة تحديث إعدادات Gemini
  const updatedSettings = {
    ...settings,
    id: 'gemini_settings_1',
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'تم تحديث إعدادات Gemini بنجاح',
    data: updatedSettings
  });
});

// 👥 مسارات إدارة المستخدمين والاشتراكات
app.get('/api/subscriptions/companies/:id/users', async (req, res) => {
  console.log('👥 [API] طلب جلب مستخدمي الشركة');
  const { id } = req.params;

  console.log('🏢 معرف الشركة:', id);

  // محاكاة مستخدمي الشركة
  const users = [
    {
      id: 'user_1',
      name: 'أحمد محمد',
      email: 'ahmed@company.com',
      role: 'admin',
      is_active: true,
      last_login_at: new Date(Date.now() - 3600000).toISOString(), // منذ ساعة
      created_at: new Date(Date.now() - 86400000 * 30).toISOString(), // منذ 30 يوم
      permissions: ['manage_users', 'manage_products', 'view_analytics']
    },
    {
      id: 'user_2',
      name: 'فاطمة أحمد',
      email: 'fatima@company.com',
      role: 'manager',
      is_active: true,
      last_login_at: new Date(Date.now() - 7200000).toISOString(), // منذ ساعتين
      created_at: new Date(Date.now() - 86400000 * 15).toISOString(), // منذ 15 يوم
      permissions: ['manage_products', 'view_analytics']
    },
    {
      id: 'user_3',
      name: 'محمد علي',
      email: 'mohammed@company.com',
      role: 'employee',
      is_active: true,
      last_login_at: new Date(Date.now() - 14400000).toISOString(), // منذ 4 ساعات
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(), // منذ 7 أيام
      permissions: ['view_products']
    },
    {
      id: 'user_4',
      name: 'سارة خالد',
      email: 'sara@company.com',
      role: 'employee',
      is_active: false,
      last_login_at: new Date(Date.now() - 86400000 * 5).toISOString(), // منذ 5 أيام
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(), // منذ 20 يوم
      permissions: ['view_products']
    }
  ];

  res.json({
    success: true,
    data: users,
    total: users.length,
    active: users.filter(u => u.is_active).length
  });
});

app.get('/api/subscriptions/roles', async (req, res) => {
  console.log('🎭 [API] طلب جلب الأدوار');

  // محاكاة الأدوار المتاحة
  const roles = [
    {
      id: 'admin',
      name: 'مدير',
      description: 'صلاحيات كاملة لإدارة النظام',
      color: 'red',
      permissions: ['manage_users', 'manage_products', 'manage_orders', 'view_analytics', 'manage_settings']
    },
    {
      id: 'manager',
      name: 'مدير قسم',
      description: 'إدارة المنتجات والطلبات',
      color: 'blue',
      permissions: ['manage_products', 'manage_orders', 'view_analytics']
    },
    {
      id: 'employee',
      name: 'موظف',
      description: 'صلاحيات أساسية للعمل',
      color: 'green',
      permissions: ['view_products', 'view_orders']
    },
    {
      id: 'viewer',
      name: 'مشاهد',
      description: 'صلاحيات عرض فقط',
      color: 'gray',
      permissions: ['view_products']
    }
  ];

  res.json({
    success: true,
    data: roles
  });
});

app.get('/api/subscriptions/permissions', async (req, res) => {
  console.log('🔐 [API] طلب جلب الصلاحيات');

  // محاكاة الصلاحيات المتاحة
  const permissions = {
    'إدارة المستخدمين': [
      { id: 'manage_users', name: 'إدارة المستخدمين', description: 'إضافة وتعديل وحذف المستخدمين' },
      { id: 'invite_users', name: 'دعوة المستخدمين', description: 'إرسال دعوات للمستخدمين الجدد' },
      { id: 'manage_roles', name: 'إدارة الأدوار', description: 'تعديل أدوار المستخدمين' }
    ],
    'إدارة المنتجات': [
      { id: 'manage_products', name: 'إدارة المنتجات', description: 'إضافة وتعديل وحذف المنتجات' },
      { id: 'view_products', name: 'عرض المنتجات', description: 'عرض قائمة المنتجات' },
      { id: 'manage_categories', name: 'إدارة الفئات', description: 'إدارة فئات المنتجات' }
    ],
    'إدارة الطلبات': [
      { id: 'manage_orders', name: 'إدارة الطلبات', description: 'معالجة وتتبع الطلبات' },
      { id: 'view_orders', name: 'عرض الطلبات', description: 'عرض قائمة الطلبات' },
      { id: 'update_order_status', name: 'تحديث حالة الطلب', description: 'تغيير حالة الطلبات' }
    ],
    'التحليلات والتقارير': [
      { id: 'view_analytics', name: 'عرض التحليلات', description: 'عرض الإحصائيات والتقارير' },
      { id: 'export_reports', name: 'تصدير التقارير', description: 'تصدير التقارير والبيانات' }
    ],
    'الإعدادات': [
      { id: 'manage_settings', name: 'إدارة الإعدادات', description: 'تعديل إعدادات النظام' },
      { id: 'manage_integrations', name: 'إدارة التكاملات', description: 'إدارة تكاملات الطرف الثالث' }
    ]
  };

  res.json({
    success: true,
    data: permissions
  });
});

app.post('/api/subscriptions/companies/:id/users', async (req, res) => {
  console.log('➕ [API] طلب إضافة مستخدم جديد');
  const { id } = req.params;
  const { name, email, password, role, customPermissions } = req.body;

  console.log('🏢 معرف الشركة:', id);
  console.log('👤 بيانات المستخدم:', { name, email, role });

  // التحقق من البيانات المطلوبة
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'الاسم والإيميل وكلمة المرور مطلوبة'
    });
  }

  // محاكاة إضافة المستخدم
  const newUser = {
    id: `user_${Date.now()}`,
    name,
    email,
    role: role || 'employee',
    is_active: true,
    last_login_at: null,
    created_at: new Date().toISOString(),
    permissions: customPermissions || []
  };

  res.json({
    success: true,
    message: 'تم إضافة المستخدم بنجاح',
    data: newUser
  });
});

app.put('/api/subscriptions/users/:userId/role', async (req, res) => {
  console.log('🔄 [API] طلب تحديث دور المستخدم');
  const { userId } = req.params;
  const { role, companyId } = req.body;

  console.log('👤 معرف المستخدم:', userId);
  console.log('🎭 الدور الجديد:', role);
  console.log('🏢 معرف الشركة:', companyId);

  // محاكاة تحديث الدور
  res.json({
    success: true,
    message: 'تم تحديث دور المستخدم بنجاح',
    data: {
      userId,
      role,
      updated_at: new Date().toISOString()
    }
  });
});

// 💰 مسارات خطط الاشتراك
app.get('/api/subscriptions/plans', async (req, res) => {
  console.log('💰 [API] طلب جلب خطط الاشتراك');

  // محاكاة خطط الاشتراك
  const subscriptionPlans = [
    {
      id: 'starter',
      name: 'Starter',
      name_ar: 'المبتدئ',
      description: 'Perfect for small businesses starting with automation',
      description_ar: 'مثالي للشركات الصغيرة التي تبدأ بالأتمتة',
      monthly_price: 0,
      yearly_price: 0,
      max_products: 10,
      max_messages_per_month: 100,
      max_images: 50,
      max_active_conversations: 5,
      max_users: 1,
      features: {
        ai_responses: false,
        image_sending: true,
        basic_analytics: true,
        api_access: false,
        priority_support: false,
        unlimited: false
      },
      display_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'basic',
      name: 'Basic',
      name_ar: 'الأساسية',
      description: 'Great for growing businesses with AI features',
      description_ar: 'رائع للشركات النامية مع ميزات الذكاء الاصطناعي',
      monthly_price: 19,
      yearly_price: 190,
      max_products: 100,
      max_messages_per_month: 1000,
      max_images: 500,
      max_active_conversations: 25,
      max_users: 3,
      features: {
        ai_responses: true,
        image_sending: true,
        basic_analytics: true,
        api_access: false,
        priority_support: false,
        unlimited: false
      },
      display_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'professional',
      name: 'Professional',
      name_ar: 'المتقدمة',
      description: 'Advanced features for professional teams',
      description_ar: 'ميزات متقدمة للفرق المهنية',
      monthly_price: 49,
      yearly_price: 490,
      max_products: 500,
      max_messages_per_month: 5000,
      max_images: 2500,
      max_active_conversations: 100,
      max_users: 10,
      features: {
        ai_responses: true,
        image_sending: true,
        basic_analytics: true,
        api_access: true,
        priority_support: true,
        unlimited: false
      },
      display_order: 3,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'business',
      name: 'Business',
      name_ar: 'الأعمال',
      description: 'Unlimited everything for large enterprises',
      description_ar: 'كل شيء غير محدود للمؤسسات الكبيرة',
      monthly_price: 199,
      yearly_price: 1990,
      max_products: -1,
      max_messages_per_month: -1,
      max_images: -1,
      max_active_conversations: -1,
      max_users: -1,
      features: {
        ai_responses: true,
        image_sending: true,
        basic_analytics: true,
        api_access: true,
        priority_support: true,
        unlimited: true
      },
      display_order: 4,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    data: subscriptionPlans,
    total: subscriptionPlans.length
  });
});

// ⚙️ مسارات إعدادات المتجر
app.get('/api/companies/:companyId/store-settings', async (req, res) => {
  console.log('⚙️ [API] طلب جلب إعدادات المتجر');
  const { companyId } = req.params;

  // محاكاة إعدادات المتجر
  const storeSettings = {
    // معلومات أساسية
    store_name: 'متجر الإلكترونيات المتقدم',
    store_description: 'متجر متخصص في بيع أحدث الأجهزة الإلكترونية والتقنية بأفضل الأسعار وأعلى جودة',
    store_logo: '/images/store-logo.png',
    store_banner: '/images/store-banner.jpg',
    store_email: 'info@electronics-store.com',
    store_phone: '+966501234567',
    store_address: 'الرياض، المملكة العربية السعودية',
    store_website: 'https://electronics-store.com',

    // إعدادات العملة والمنطقة
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    language: 'ar',
    country: 'SA',

    // إعدادات التشغيل
    is_active: true,
    maintenance_mode: false,
    allow_guest_checkout: true,
    require_account_verification: false,
    auto_approve_reviews: false,

    // إعدادات الشحن
    free_shipping_threshold: 200,
    default_shipping_cost: 25,
    shipping_zones: ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'],

    // إعدادات الدفع
    payment_methods: ['credit_card', 'cash_on_delivery', 'bank_transfer'],
    tax_rate: 15,
    tax_included_in_prices: true,

    // إعدادات التصميم
    theme_color: '#3B82F6',
    secondary_color: '#10B981',
    font_family: 'Cairo',
    layout_style: 'modern',

    // إعدادات التواصل الاجتماعي
    social_media: {
      facebook: 'https://facebook.com/electronics-store',
      twitter: 'https://twitter.com/electronics_store',
      instagram: 'https://instagram.com/electronics_store',
      whatsapp: '+966501234567'
    },

    // إعدادات الإشعارات
    email_notifications: true,
    sms_notifications: true,
    push_notifications: false,

    // إعدادات المخزون
    low_stock_threshold: 10,
    track_inventory: true,
    allow_backorders: false,

    // إعدادات SEO
    meta_title: 'متجر الإلكترونيات المتقدم - أفضل الأجهزة التقنية',
    meta_description: 'اكتشف أحدث الأجهزة الإلكترونية والتقنية في متجرنا. أسعار منافسة وجودة عالية مع خدمة توصيل سريعة.',
    meta_keywords: 'إلكترونيات، هواتف، أجهزة كمبيوتر، تقنية، السعودية',

    // إعدادات الأمان
    enable_ssl: true,
    two_factor_auth: false,
    session_timeout: 30,

    // ساعات العمل
    business_hours: {
      sunday: { open: '09:00', close: '22:00', is_open: true },
      monday: { open: '09:00', close: '22:00', is_open: true },
      tuesday: { open: '09:00', close: '22:00', is_open: true },
      wednesday: { open: '09:00', close: '22:00', is_open: true },
      thursday: { open: '09:00', close: '22:00', is_open: true },
      friday: { open: '14:00', close: '22:00', is_open: true },
      saturday: { open: '09:00', close: '22:00', is_open: true }
    }
  };

  res.json({
    success: true,
    data: storeSettings
  });
});

app.put('/api/companies/:companyId/store-settings', async (req, res) => {
  console.log('💾 [API] طلب حفظ إعدادات المتجر');
  const { companyId } = req.params;
  const settings = req.body;

  console.log('📝 إعدادات المتجر المحدثة:', JSON.stringify(settings, null, 2));

  // محاكاة حفظ الإعدادات
  res.json({
    success: true,
    message: 'تم حفظ إعدادات المتجر بنجاح',
    data: settings
  });
});

app.post('/api/companies/:companyId/upload-store-image', async (req, res) => {
  console.log('📷 [API] طلب رفع صورة المتجر');
  const { companyId } = req.params;

  // محاكاة رفع الصورة
  const imageUrl = `/images/uploaded-${Date.now()}.jpg`;

  res.json({
    success: true,
    message: 'تم رفع الصورة بنجاح',
    data: {
      url: imageUrl,
      filename: `store-image-${Date.now()}.jpg`
    }
  });
});

// 📊 مسار التقارير
app.get('/api/companies/:companyId/reports', async (req, res) => {
  console.log('📊 [API] طلب بيانات التقارير');
  const { companyId } = req.params;
  const { from, to, period } = req.query;

  // محاكاة بيانات التقارير
  const reportsData = {
    summary: {
      total_revenue: 89750.00,
      total_orders: 234,
      total_customers: 156,
      avg_order_value: 383.55,
      growth_rate: 12.5,
      conversion_rate: 3.2
    },
    revenue_by_period: [
      { period: '2025-06', revenue: 45890.00, orders: 123, customers: 89 },
      { period: '2025-07', revenue: 43860.00, orders: 111, customers: 67 }
    ],
    top_products: [
      {
        id: 'prod_1',
        name: 'iPhone 15 Pro',
        revenue: 202455.00,
        quantity_sold: 45,
        profit_margin: 15.2
      },
      {
        id: 'prod_2',
        name: 'Samsung Galaxy S24',
        revenue: 127968.00,
        quantity_sold: 32,
        profit_margin: 12.8
      },
      {
        id: 'prod_3',
        name: 'قميص قطني رجالي',
        revenue: 8811.00,
        quantity_sold: 89,
        profit_margin: 45.5
      }
    ],
    sales_by_category: [
      { category: 'الإلكترونيات', revenue: 330423.00, percentage: 73.2 },
      { category: 'الملابس', revenue: 45670.00, percentage: 10.1 },
      { category: 'المنزل والحديقة', revenue: 23890.00, percentage: 5.3 },
      { category: 'أخرى', revenue: 51267.00, percentage: 11.4 }
    ],
    customer_segments: [
      { segment: 'عملاء VIP', count: 23, revenue: 45670.00, avg_order: 1985.65 },
      { segment: 'عملاء منتظمون', count: 89, revenue: 32450.00, avg_order: 364.61 },
      { segment: 'عملاء جدد', count: 44, revenue: 11630.00, avg_order: 264.32 }
    ],
    payment_methods: [
      { method: 'بطاقة ائتمان', orders: 145, revenue: 55670.00, percentage: 62.0 },
      { method: 'الدفع عند الاستلام', orders: 67, revenue: 25680.00, percentage: 28.6 },
      { method: 'تحويل بنكي', orders: 22, revenue: 8400.00, percentage: 9.4 }
    ],
    shipping_performance: [
      { method: 'توصيل عادي', orders: 156, avg_delivery_time: 4.2, satisfaction: 4.1 },
      { method: 'توصيل سريع', orders: 67, avg_delivery_time: 1.8, satisfaction: 4.6 },
      { method: 'توصيل فوري', orders: 11, avg_delivery_time: 0.5, satisfaction: 4.8 }
    ],
    geographic_distribution: [
      { region: 'الرياض', orders: 89, revenue: 34560.00, percentage: 38.5 },
      { region: 'جدة', orders: 67, revenue: 26780.00, percentage: 29.8 },
      { region: 'الدمام', orders: 45, revenue: 18900.00, percentage: 19.2 },
      { region: 'مكة', orders: 23, revenue: 7890.00, percentage: 9.8 },
      { region: 'أخرى', orders: 10, revenue: 1620.00, percentage: 2.7 }
    ],
    monthly_trends: Array.from({ length: 12 }, (_, month) => {
      const date = new Date(2025, month, 1);
      return {
        month: date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }),
        revenue: Math.floor(Math.random() * 50000) + 20000,
        orders: Math.floor(Math.random() * 100) + 50,
        customers: Math.floor(Math.random() * 80) + 30
      };
    }),
    daily_stats: Array.from({ length: 30 }, (_, day) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - day));
      return {
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000) + 1000,
        orders: Math.floor(Math.random() * 20) + 5,
        customers: Math.floor(Math.random() * 15) + 3
      };
    })
  };

  res.json({
    success: true,
    data: reportsData,
    filters: {
      from: from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: to || new Date().toISOString().split('T')[0],
      period: period || 'month'
    }
  });
});

// 📊 مسارات التحليلات والإحصائيات المتقدمة
app.get('/api/analytics/performance', async (req, res) => {
  console.log('📊 [API] طلب تحليل الأداء');
  const {
    start_date,
    end_date,
    page,
    compare_enabled,
    compare_start_date,
    compare_end_date
  } = req.query;

  // محاكاة بيانات الأداء
  const performanceData = {
    overview: {
      total_visitors: 12450,
      unique_visitors: 8920,
      page_views: 34560,
      bounce_rate: 42.5,
      avg_session_duration: 245, // بالثواني
      conversion_rate: 3.2,
      total_revenue: 89750.00,
      total_orders: 234,
      avg_order_value: 383.55
    },
    traffic_sources: [
      { source: 'البحث المباشر', visitors: 4580, percentage: 36.8 },
      { source: 'وسائل التواصل الاجتماعي', visitors: 3240, percentage: 26.0 },
      { source: 'محركات البحث', visitors: 2890, percentage: 23.2 },
      { source: 'المواقع المرجعية', visitors: 1740, percentage: 14.0 }
    ],
    popular_pages: [
      { page: '/products', views: 8920, unique_views: 6540, avg_time: 180 },
      { page: '/categories', views: 6780, unique_views: 4920, avg_time: 145 },
      { page: '/cart', views: 4560, unique_views: 3240, avg_time: 120 },
      { page: '/checkout', views: 2340, unique_views: 1890, avg_time: 240 },
      { page: '/orders', views: 1890, unique_views: 1560, avg_time: 200 }
    ],
    hourly_traffic: Array.from({ length: 24 }, (_, hour) => ({
      hour: hour,
      visitors: Math.floor(Math.random() * 500) + 100,
      page_views: Math.floor(Math.random() * 1200) + 300
    })),
    daily_stats: Array.from({ length: 30 }, (_, day) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - day));
      return {
        date: date.toISOString().split('T')[0],
        visitors: Math.floor(Math.random() * 800) + 200,
        page_views: Math.floor(Math.random() * 2000) + 500,
        orders: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 5000) + 1000
      };
    }),
    device_breakdown: [
      { device: 'الهاتف المحمول', visitors: 7890, percentage: 63.4 },
      { device: 'سطح المكتب', visitors: 3240, percentage: 26.0 },
      { device: 'الجهاز اللوحي', visitors: 1320, percentage: 10.6 }
    ],
    browser_breakdown: [
      { browser: 'Chrome', visitors: 6890, percentage: 55.4 },
      { browser: 'Safari', visitors: 2340, percentage: 18.8 },
      { browser: 'Firefox', visitors: 1560, percentage: 12.5 },
      { browser: 'Edge', visitors: 980, percentage: 7.9 },
      { browser: 'أخرى', visitors: 680, percentage: 5.4 }
    ],
    geographic_data: [
      { country: 'السعودية', visitors: 8920, percentage: 71.7 },
      { country: 'الإمارات', visitors: 1890, percentage: 15.2 },
      { country: 'الكويت', visitors: 780, percentage: 6.3 },
      { country: 'قطر', visitors: 560, percentage: 4.5 },
      { country: 'أخرى', visitors: 300, percentage: 2.4 }
    ]
  };

  // إضافة بيانات المقارنة إذا كانت مفعلة
  if (compare_enabled === 'true') {
    performanceData.comparison = {
      overview: {
        total_visitors: 10890,
        unique_visitors: 7650,
        page_views: 29340,
        bounce_rate: 45.2,
        avg_session_duration: 220,
        conversion_rate: 2.8,
        total_revenue: 76890.00,
        total_orders: 198,
        avg_order_value: 388.33
      },
      growth: {
        visitors: 14.3,
        page_views: 17.8,
        bounce_rate: -6.0,
        conversion_rate: 14.3,
        revenue: 16.7,
        orders: 18.2
      }
    };
  }

  res.json({
    success: true,
    data: performanceData,
    filters: {
      start_date: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: end_date || new Date().toISOString().split('T')[0],
      page: page || 'all',
      compare_enabled: compare_enabled === 'true',
      compare_start_date: compare_start_date,
      compare_end_date: compare_end_date
    }
  });
});

app.get('/api/analytics/ecommerce', async (req, res) => {
  console.log('🛒 [API] طلب تحليل التجارة الإلكترونية');
  const { start_date, end_date, category } = req.query;

  const ecommerceData = {
    sales_overview: {
      total_revenue: 89750.00,
      total_orders: 234,
      avg_order_value: 383.55,
      conversion_rate: 3.2,
      cart_abandonment_rate: 68.5,
      return_rate: 2.1
    },
    top_products: [
      {
        id: 'prod_1',
        name: 'iPhone 15 Pro',
        sales: 45,
        revenue: 202455.00,
        views: 2340,
        conversion_rate: 1.9
      },
      {
        id: 'prod_2',
        name: 'Samsung Galaxy S24',
        sales: 32,
        revenue: 127968.00,
        views: 1890,
        conversion_rate: 1.7
      },
      {
        id: 'prod_3',
        name: 'قميص قطني رجالي',
        sales: 89,
        revenue: 8811.00,
        views: 1560,
        conversion_rate: 5.7
      }
    ],
    category_performance: [
      { category: 'الإلكترونيات', revenue: 330423.00, orders: 77, avg_order: 4290.00 },
      { category: 'الملابس', revenue: 45670.00, orders: 156, avg_order: 292.76 },
      { category: 'المنزل والحديقة', revenue: 23890.00, orders: 45, avg_order: 530.89 }
    ],
    sales_funnel: [
      { stage: 'زيارة الموقع', count: 12450, percentage: 100 },
      { stage: 'عرض المنتج', count: 8920, percentage: 71.6 },
      { stage: 'إضافة للسلة', count: 2340, percentage: 18.8 },
      { stage: 'بدء الدفع', count: 890, percentage: 7.1 },
      { stage: 'إتمام الطلب', count: 234, percentage: 1.9 }
    ],
    payment_methods: [
      { method: 'بطاقة ائتمان', orders: 145, percentage: 62.0 },
      { method: 'الدفع عند الاستلام', orders: 67, percentage: 28.6 },
      { method: 'تحويل بنكي', orders: 22, percentage: 9.4 }
    ],
    shipping_analysis: [
      { method: 'توصيل عادي', orders: 156, avg_time: 4.2, satisfaction: 4.1 },
      { method: 'توصيل سريع', orders: 67, avg_time: 1.8, satisfaction: 4.6 },
      { method: 'توصيل فوري', orders: 11, avg_time: 0.5, satisfaction: 4.8 }
    ]
  };

  res.json({
    success: true,
    data: ecommerceData,
    filters: {
      start_date: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: end_date || new Date().toISOString().split('T')[0],
      category: category || 'all'
    }
  });
});

// بدء السرفر
app.listen(PORT, () => {
  console.log(`✅ [SERVER] السرفر يعمل على المنفذ ${PORT}`);
  console.log(`🌐 [SERVER] يمكن الوصول للسرفر على: http://localhost:${PORT}`);
  console.log('🔧 [ROUTES] المسارات المتاحة:');
  console.log('   📦 GET /api/companies/:companyId/products - جلب المنتجات');
  console.log('   ➕ POST /api/companies/:companyId/products - إضافة منتج');
  console.log('   📋 GET /api/companies/:companyId/categories - جلب الفئات');
  console.log('   ➕ POST /api/companies/:companyId/categories - إضافة فئة');
  console.log('   🔧 GET /api/companies/:companyId/product-variants - جلب متغيرات المنتجات');
  console.log('   ➕ POST /api/companies/:companyId/product-variants - إنشاء متغير منتج');
  console.log('   📝 PUT /api/companies/:companyId/product-variants/:variantId - تحديث متغير منتج');
  console.log('   🗑️ DELETE /api/companies/:companyId/product-variants/:variantId - حذف متغير منتج');
  console.log('   💬 GET /api/companies/:companyId/conversations - جلب محادثات الشركة');
  console.log('   💌 GET /api/conversations/:conversationId/messages - جلب رسائل المحادثة');
  console.log('   📤 POST /api/conversations/:conversationId/messages - إرسال رسالة جديدة');
  console.log('   📱 GET /api/whatsapp-baileys/status - فحص حالة WhatsApp');
  console.log('   📊 GET /api/whatsapp-baileys/stats - إحصائيات WhatsApp');
  console.log('   ⚙️ GET /api/whatsapp-baileys/settings - إعدادات WhatsApp');
  console.log('   🚀 POST /api/whatsapp-baileys/start - بدء خدمة WhatsApp');
  console.log('   🔌 POST /api/whatsapp-baileys/disconnect - قطع اتصال WhatsApp');
  console.log('   💾 PUT /api/whatsapp-baileys/settings - حفظ إعدادات WhatsApp');
  console.log('   📤 POST /api/whatsapp-baileys/send-message - إرسال رسالة WhatsApp');
  console.log('   💬 GET /api/whatsapp-baileys/messages - جلب رسائل WhatsApp');
  console.log('   🤖 POST /api/whatsapp-baileys/ai-settings - حفظ إعدادات الذكاء الاصطناعي');
  console.log('   🧪 POST /api/whatsapp-baileys/test-ai - اختبار الذكاء الاصطناعي');
  console.log('   🧪 POST /api/gemini/test - اختبار Gemini API');
  console.log('   ⚙️ GET /api/gemini/settings - جلب إعدادات Gemini');
  console.log('   💾 POST /api/gemini/settings - حفظ إعدادات Gemini');
  console.log('   ✏️ PUT /api/gemini/settings - تحديث إعدادات Gemini');
  console.log('   👥 GET /api/subscriptions/companies/:id/users - جلب مستخدمي الشركة');
  console.log('   🎭 GET /api/subscriptions/roles - جلب الأدوار');
  console.log('   🔐 GET /api/subscriptions/permissions - جلب الصلاحيات');
  console.log('   ➕ POST /api/subscriptions/companies/:id/users - إضافة مستخدم جديد');
  console.log('   🔄 PUT /api/subscriptions/users/:userId/role - تحديث دور المستخدم');
  console.log('   💰 GET /api/subscriptions/plans - جلب خطط الاشتراك');
  console.log('   🛒 GET /api/companies/:companyId/orders - جلب الطلبات');
  console.log('   🛒 GET /api/companies/:companyId/orders/:orderId - جلب طلب محدد');
  console.log('   📝 PATCH /api/companies/:companyId/orders/:orderId/status - تحديث حالة الطلب');
  console.log('   💳 PATCH /api/companies/:companyId/orders/:orderId/payment - تحديث حالة الدفع');
  console.log('   🎫 GET /api/companies/:companyId/coupons - جلب الكوبونات');
  console.log('   🎫 POST /api/companies/:companyId/coupons - إنشاء كوبون جديد');
  console.log('   📝 PUT /api/companies/:companyId/coupons/:couponId - تحديث كوبون');
  console.log('   🗑️ DELETE /api/companies/:companyId/coupons/:couponId - حذف كوبون');
  console.log('   ✅ POST /api/companies/:companyId/coupons/validate - التحقق من صحة كوبون');
  console.log('   🚚 GET /api/companies/:companyId/shipping-methods - جلب طرق الشحن');
  console.log('   🚚 POST /api/companies/:companyId/shipping-methods - إنشاء طريقة شحن جديدة');
  console.log('   📝 PUT /api/companies/:companyId/shipping-methods/:methodId - تحديث طريقة شحن');
  console.log('   🗑️ DELETE /api/companies/:companyId/shipping-methods/:methodId - حذف طريقة شحن');
  console.log('   💰 POST /api/companies/:companyId/shipping-methods/calculate - حساب تكلفة الشحن');
  console.log('   🛒 GET /api/companies/:companyId/cart/:sessionId - جلب السلة للجلسة');
  console.log('   🛒 GET /api/companies/:companyId/cart - جلب محتويات السلة');
  console.log('   ➕ POST /api/companies/:companyId/cart/:sessionId/add - إضافة للسلة (جلسة)');
  console.log('   ➕ POST /api/companies/:companyId/cart/add - إضافة منتج للسلة');
  console.log('   ✏️ PUT /api/companies/:companyId/cart/:sessionId/update/:itemId - تحديث (جلسة)');
  console.log('   ✏️ PUT /api/companies/:companyId/cart/update/:itemId - تحديث كمية في السلة');
  console.log('   🗑️ DELETE /api/companies/:companyId/cart/:sessionId/remove/:itemId - حذف (جلسة)');
  console.log('   🗑️ DELETE /api/companies/:companyId/cart/:sessionId/clear - تفريغ السلة (جلسة)');
  console.log('   🗑️ DELETE /api/companies/:companyId/cart/remove/:itemId - حذف من السلة');
  console.log('   🗑️ DELETE /api/companies/:companyId/cart/clear - تفريغ السلة');
  console.log('   💳 POST /api/companies/:companyId/cart/checkout - إتمام الشراء');
  console.log('   💳 POST /api/companies/:companyId/checkout - إتمام الطلب (checkout)');
  console.log('   📋 GET /api/companies/:companyId/orders/:orderId - تفاصيل طلب محدد');
  console.log('   🏪 GET /api/companies/:companyId/store - جلب معلومات المتجر');
  console.log('   ✏️ PUT /api/companies/:companyId/store - تحديث المتجر');
  console.log('   📊 GET /api/companies/:companyId/store/analytics - إحصائيات المتجر');
  console.log('   ⚙️ GET /api/companies/:companyId/store-settings - جلب إعدادات المتجر');
  console.log('   💾 PUT /api/companies/:companyId/store-settings - حفظ إعدادات المتجر');
  console.log('   📷 POST /api/companies/:companyId/upload-store-image - رفع صور المتجر');
  console.log('   📊 GET /api/companies/:companyId/reports - تقارير الشركة');
  console.log('   📊 GET /api/analytics/performance - تحليل الأداء المتقدم');
  console.log('   🛒 GET /api/analytics/ecommerce - تحليل التجارة الإلكترونية');
});
