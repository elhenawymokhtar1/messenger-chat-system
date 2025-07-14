import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// ===================================
// 🏪 مسارات المتجر الإلكتروني الجديدة
// ===================================

console.log('🔧 [SETUP] تسجيل المسارات الجديدة...');

// 📦 جلب المنتجات
console.log('🔧 [SETUP] تسجيل مسار جلب المنتجات: /api/companies/:companyId/products');
app.get('/api/companies/:companyId/products', async (req, res) => {
  console.log('📦 [API] تم استدعاء مسار جلب المنتجات!');
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, category, search } = req.query;

    console.log(`📦 [API] جلب المنتجات للشركة: ${companyId}`);

    // إنشاء بيانات افتراضية للمنتجات
    const products = [
      {
        id: `product_1_${companyId}`,
        name: 'منتج تجريبي 1',
        description: 'وصف المنتج التجريبي الأول',
        price: 99.99,
        sale_price: 79.99,
        sku: 'PROD001',
        stock_quantity: 50,
        category_id: 'cat_1',
        category_name: 'الإلكترونيات',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop&crop=center'],
        is_active: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `product_2_${companyId}`,
        name: 'منتج تجريبي 2',
        description: 'وصف المنتج التجريبي الثاني',
        price: 149.99,
        sale_price: null,
        sku: 'PROD002',
        stock_quantity: 25,
        category_id: 'cat_2',
        category_name: 'الملابس',
        images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop&crop=center'],
        is_active: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `product_3_${companyId}`,
        name: 'منتج تجريبي 3',
        description: 'وصف المنتج التجريبي الثالث',
        price: 199.99,
        sale_price: 159.99,
        sku: 'PROD003',
        stock_quantity: 15,
        category_id: 'cat_1',
        category_name: 'الإلكترونيات',
        images: ['https://via.placeholder.com/300x300?text=Product+3'],
        is_active: true,
        created_at: new Date(Date.now() - 259200000).toISOString(),
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
      const searchTerm = search.toString().toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.description.toLowerCase().includes(searchTerm)
      );
    }

    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / Number(limit));
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    console.log(`✅ [API] تم جلب ${paginatedProducts.length} منتج من أصل ${total} للشركة: ${companyId}`);

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages
      },
      filters: {
        category,
        search
      },
      message: 'تم جلب المنتجات بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب المنتجات:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// 📦 إضافة منتج جديد
console.log('🔧 [SETUP] تسجيل مسار إضافة منتج: /api/companies/:companyId/products');
app.post('/api/companies/:companyId/products', async (req, res) => {
  console.log('📦 [API] تم استدعاء مسار إضافة منتج جديد!');
  try {
    const { companyId } = req.params;
    const { name, description, price, sale_price, sku, stock_quantity, category_id, images } = req.body;

    console.log(`📦 [API] إضافة منتج جديد للشركة: ${companyId}`);

    // التحقق من البيانات المطلوبة
    if (!name || !price || !sku) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'الاسم والسعر ورمز المنتج مطلوبة'
      });
    }

    // إنشاء منتج جديد (محاكاة)
    const newProduct = {
      id: `product_${Date.now()}_${companyId}`,
      name,
      description: description || '',
      price: Number(price),
      sale_price: sale_price ? Number(sale_price) : null,
      sku,
      stock_quantity: stock_quantity || 0,
      category_id: category_id || null,
      images: images || [],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`✅ [API] تم إنشاء منتج جديد: ${newProduct.id} للشركة: ${companyId}`);

    res.status(201).json({
      success: true,
      data: newProduct,
      message: 'تم إضافة المنتج بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في إضافة المنتج:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// بدء السرفر
app.listen(PORT, () => {
  console.log(`🚀 Test Server started on port ${PORT}`);
  console.log(`📦 Products API available at: http://localhost:${PORT}/api/companies/:companyId/products`);
});
