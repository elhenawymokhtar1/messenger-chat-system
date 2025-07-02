const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware للـ logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  console.log('📝 Body:', JSON.stringify(req.body, null, 2));
  next();
});

// فحص الصحة
app.get('/api/health', (req, res) => {
  console.log('✅ Health check');
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

// تسجيل شركة جديدة - نسخة تجريبية
app.post('/api/companies/register', async (req, res) => {
  try {
    const { name, email, password, phone, city, country } = req.body;

    console.log('🏢 [REGISTER] محاولة تسجيل شركة جديدة:', name);
    console.log('📧 [REGISTER] الإيميل:', email);

    // التحقق من البيانات المطلوبة
    if (!name || !email || !password) {
      console.log('❌ [REGISTER] بيانات ناقصة');
      return res.status(400).json({
        success: false,
        message: 'الاسم والإيميل وكلمة المرور مطلوبة'
      });
    }

    // للاختبار: قبول أي شركة جديدة
    console.log('✅ [REGISTER] تسجيل شركة تجريبي نجح');

    const companyData = {
      id: `company_${Date.now()}`,
      name: name,
      email: email,
      phone: phone || null,
      city: city || null,
      country: country || 'Egypt',
      status: 'active',
      subscription_status: 'trial',
      created_at: new Date().toISOString()
    };

    const response = {
      success: true,
      message: 'تم إنشاء الشركة بنجاح',
      company: companyData,
      data: companyData  // للتوافق مع كلا الطريقتين
    };

    console.log('📤 [REGISTER] إرسال الاستجابة:', JSON.stringify(response, null, 2));
    return res.json(response);

  } catch (error) {
    console.error('❌ [REGISTER] خطأ:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// تسجيل الدخول للشركة - نسخة تجريبية
app.post('/api/companies/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 [LOGIN] محاولة تسجيل الدخول:', email);
    console.log('🔐 [LOGIN] كلمة المرور:', password);

    // للاختبار: قبول dummy@example.com مع كلمة المرور 123456
    if (email === 'dummy@example.com' && password === '123456') {
      console.log('✅ [LOGIN] تسجيل دخول تجريبي نجح');

      const response = {
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        company: {
          id: 'test-company-id',
          name: 'شركة وهمية',
          email: email,
          status: 'active',
          subscription_status: 'active'
        }
      };

      console.log('📤 [LOGIN] إرسال الاستجابة:', JSON.stringify(response, null, 2));
      return res.json(response);
    }

    // إذا لم تكن البيانات صحيحة
    console.log('❌ [LOGIN] بيانات غير صحيحة');
    res.status(401).json({
      success: false,
      message: 'الإيميل أو كلمة المرور غير صحيحة'
    });

  } catch (error) {
    console.error('❌ [LOGIN] خطأ:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// قائمة المنتجات التجريبية (في الذاكرة)
let products = [];

// جلب منتجات الشركة
app.get('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('📦 [PRODUCTS] جلب منتجات الشركة:', companyId);

    // فلترة المنتجات حسب الشركة
    const companyProducts = products.filter(p => p.company_id === companyId);

    console.log('📤 [PRODUCTS] إرسال المنتجات:', companyProducts.length);
    res.json({
      success: true,
      data: companyProducts
    });

  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في جلب المنتجات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المنتجات'
    });
  }
});

// إنشاء منتج جديد
app.post('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { name, description, price, stock_quantity, category } = req.body;

    console.log('📦 [PRODUCTS] إنشاء منتج جديد للشركة:', companyId);
    console.log('📝 [PRODUCTS] بيانات المنتج:', { name, description, price, stock_quantity, category });

    // التحقق من البيانات المطلوبة
    if (!name || !description || price === undefined) {
      console.log('❌ [PRODUCTS] بيانات ناقصة');
      return res.status(400).json({
        success: false,
        message: 'اسم المنتج والوصف والسعر مطلوبة'
      });
    }

    // إنشاء منتج جديد
    const newProduct = {
      id: `product_${Date.now()}`,
      company_id: companyId,
      name: name,
      description: description,
      price: parseFloat(price),
      stock_quantity: parseInt(stock_quantity) || 0,
      category: category || 'عام',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // إضافة المنتج للقائمة
    products.push(newProduct);

    console.log('✅ [PRODUCTS] تم إنشاء المنتج بنجاح');
    console.log('📤 [PRODUCTS] إرسال الاستجابة:', JSON.stringify(newProduct, null, 2));

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المنتج بنجاح',
      data: newProduct
    });

  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في إنشاء المنتج:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء المنتج'
    });
  }
});

// تحديث منتج
app.put('/api/companies/:companyId/products/:productId', async (req, res) => {
  try {
    const { companyId, productId } = req.params;
    const { name, description, price, stock_quantity, category } = req.body;

    console.log('📦 [PRODUCTS] تحديث المنتج:', productId);

    // البحث عن المنتج
    const productIndex = products.findIndex(p => p.id === productId && p.company_id === companyId);

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    // تحديث المنتج
    products[productIndex] = {
      ...products[productIndex],
      name: name || products[productIndex].name,
      description: description || products[productIndex].description,
      price: price !== undefined ? parseFloat(price) : products[productIndex].price,
      stock_quantity: stock_quantity !== undefined ? parseInt(stock_quantity) : products[productIndex].stock_quantity,
      category: category || products[productIndex].category,
      updated_at: new Date().toISOString()
    };

    console.log('✅ [PRODUCTS] تم تحديث المنتج بنجاح');

    res.json({
      success: true,
      message: 'تم تحديث المنتج بنجاح',
      data: products[productIndex]
    });

  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في تحديث المنتج:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث المنتج'
    });
  }
});

// حذف منتج
app.delete('/api/companies/:companyId/products/:productId', async (req, res) => {
  try {
    const { companyId, productId } = req.params;

    console.log('📦 [PRODUCTS] حذف المنتج:', productId);

    // البحث عن المنتج
    const productIndex = products.findIndex(p => p.id === productId && p.company_id === companyId);

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    // حذف المنتج
    products.splice(productIndex, 1);

    console.log('✅ [PRODUCTS] تم حذف المنتج بنجاح');

    res.json({
      success: true,
      message: 'تم حذف المنتج بنجاح'
    });

  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في حذف المنتج:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف المنتج'
    });
  }
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`🚀 خادم الاختبار يعمل على المنفذ ${PORT}`);
  console.log(`📡 API متاح على: http://localhost:${PORT}/api`);
  console.log(`🏥 فحص الصحة: http://localhost:${PORT}/api/health`);
  console.log(`🔐 تسجيل الدخول: http://localhost:${PORT}/api/companies/login`);
  console.log(`📦 المنتجات: http://localhost:${PORT}/api/companies/:companyId/products`);
});

process.on('uncaughtException', (error) => {
  console.error('❌ [UNCAUGHT EXCEPTION]:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [UNHANDLED REJECTION]:', reason);
});
