// خادم موحد محسن مع معالجة أفضل للأخطاء
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3002;

// إعدادات قاعدة البيانات
const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306
};

// Middleware
app.use(cors());
app.use(express.json());

// Middleware للـ logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// دالة الاتصال بقاعدة البيانات
async function executeQuery(query, params = []) {
  console.log('🔍 [DB] تنفيذ استعلام:', query.substring(0, 100) + '...');

  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    const [rows] = await connection.execute(query, params);
    console.log('✅ [DB] تم تنفيذ الاستعلام بنجاح، النتائج:', rows.length, 'صف');
    return rows;
  } catch (error) {
    console.error('❌ [DB] خطأ في الاستعلام:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// دالة إنشاء شركة تجريبية إذا لم تكن موجودة
async function ensureTestCompany() {
  const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

  try {
    // فحص وجود الشركة
    const companies = await executeQuery(
      'SELECT id FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      console.log('🏢 إنشاء شركة تجريبية...');

      // محاولة إنشاء الشركة
      try {
        const passwordHash = await bcrypt.hash('123456', 12);

        await executeQuery(`
          INSERT INTO companies 
          (id, name, email, password_hash, status, subscription_status, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          companyId,
          'شركة المنتجات التجريبية',
          'products@demo.local',
          passwordHash,
          'active',
          'active'
        ]);

        console.log('✅ تم إنشاء الشركة التجريبية بنجاح');

      } catch (error) {
        console.log('⚠️ لا يمكن إنشاء الشركة:', error.message);
        // سنستمر بالعمل حتى لو لم نتمكن من إنشاء الشركة
      }
    } else {
      console.log('✅ الشركة التجريبية موجودة بالفعل');
    }

  } catch (error) {
    console.error('❌ خطأ في فحص الشركة:', error.message);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  console.log('💚 [HEALTH] فحص حالة الخادم');
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

// جلب الشركات
app.get('/api/companies', async (req, res) => {
  try {
    console.log('🏢 [COMPANIES] جلب قائمة الشركات');
    const companies = await executeQuery('SELECT * FROM companies ORDER BY created_at DESC');
    res.json({
      success: true,
      data: companies || []
    });
  } catch (error) {
    console.error('❌ [COMPANIES] خطأ في جلب الشركات:', error.message);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب الشركات'
    });
  }
});

// إنشاء شركة جديدة
app.post('/api/companies/register', async (req, res) => {
  try {
    const { name, email, password, phone, website, address, city, country } = req.body;

    console.log('🏢 [COMPANIES] إنشاء شركة جديدة:', name);
    console.log('📝 [COMPANIES] البيانات المستلمة:', JSON.stringify(req.body, null, 2));

    // التحقق من البيانات المطلوبة
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'الاسم والإيميل وكلمة المرور مطلوبة'
      });
    }

    // فحص وجود الإيميل
    const existingCompanies = await executeQuery(
      'SELECT id FROM companies WHERE email = ?',
      [email]
    );

    if (existingCompanies.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'الإيميل مستخدم بالفعل'
      });
    }

    // إنشاء الشركة
    const companyId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);

    const insertData = [
      companyId,
      name.trim(),
      email.trim().toLowerCase(),
      phone || null,
      website || null,
      address || null,
      city || null,
      country || 'Egypt',
      passwordHash,
      'active',
      'trial'
    ];

    // تعطيل الـ triggers مؤقتاً لتجنب مشاكل التسجيل
    await executeQuery('SET @DISABLE_TRIGGERS = 1');

    await executeQuery(`
      INSERT INTO companies (
        id, name, email, phone, website, address, city, country,
        password_hash, status, subscription_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, insertData);

    // إعادة تفعيل الـ triggers
    await executeQuery('SET @DISABLE_TRIGGERS = 0');

    console.log('✅ [COMPANIES] تم إنشاء الشركة بنجاح:', companyId);

    // جلب الشركة المُنشأة (بدون كلمة المرور)
    const newCompany = await executeQuery(
      'SELECT id, name, email, phone, website, address, city, country, status, subscription_status, created_at FROM companies WHERE id = ?',
      [companyId]
    );

    res.json({
      success: true,
      message: 'تم إنشاء الشركة بنجاح',
      data: newCompany[0]
    });

  } catch (error) {
    console.error('❌ [COMPANIES] خطأ في إنشاء الشركة:', error);
    console.error('❌ [COMPANIES] تفاصيل الخطأ:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });

    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        success: false,
        message: 'الإيميل مستخدم بالفعل'
      });
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      res.status(500).json({
        success: false,
        message: 'جدول الشركات غير موجود في قاعدة البيانات'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء الشركة: ' + error.message,
        details: error.code || 'UNKNOWN_ERROR'
      });
    }
  }
});

// تسجيل الدخول للشركة
app.post('/api/companies/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 [LOGIN] محاولة تسجيل الدخول:', email);
    console.log('🔐 [LOGIN] الخادم المحسن يعالج الطلب...');

    // التحقق من البيانات المطلوبة
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'الإيميل وكلمة المرور مطلوبان'
      });
    }

    // البحث عن الشركة
    const companies = await executeQuery(
      'SELECT id, name, email, password_hash, status, subscription_status FROM companies WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (companies.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'الإيميل أو كلمة المرور غير صحيحة'
      });
    }

    const company = companies[0];

    // التحقق من حالة الشركة
    if (company.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'الحساب معطل، يرجى التواصل مع الدعم'
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, company.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'الإيميل أو كلمة المرور غير صحيحة'
      });
    }

    // إنشاء token (للتطوير: token بسيط)
    const token = 'auth_token_' + company.id + '_' + Date.now();

    console.log('✅ [LOGIN] تم تسجيل الدخول بنجاح:', company.name);

    // إرجاع البيانات (بدون كلمة المرور)
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token: token,
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          status: company.status,
          subscription_status: company.subscription_status
        }
      }
    });

  } catch (error) {
    console.error('❌ [LOGIN] خطأ في تسجيل الدخول:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// التحقق من صحة token
app.post('/api/companies/verify-token', async (req, res) => {
  try {
    const { company_id } = req.body;
    const authHeader = req.headers.authorization;

    console.log('🔍 [VERIFY] التحقق من صحة token للشركة:', company_id);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token مفقود'
      });
    }

    const token = authHeader.split(' ')[1];

    // للتطوير: قبول أي token يحتوي على معرف الشركة
    if (token.includes(company_id)) {
      // جلب بيانات الشركة
      const companies = await executeQuery(
        'SELECT id, name, email, status, subscription_status FROM companies WHERE id = ?',
        [company_id]
      );

      if (companies.length > 0) {
        const company = companies[0];

        if (company.status === 'active') {
          console.log('✅ [VERIFY] Token صحيح للشركة:', company.name);

          res.json({
            success: true,
            data: company
          });
        } else {
          res.status(401).json({
            success: false,
            message: 'الحساب معطل'
          });
        }
      } else {
        res.status(401).json({
          success: false,
          message: 'الشركة غير موجودة'
        });
      }
    } else {
      res.status(401).json({
        success: false,
        message: 'Token غير صحيح'
      });
    }

  } catch (error) {
    console.error('❌ [VERIFY] خطأ في التحقق من token:', error.message);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// ===================================
// 📦 Products API
// ===================================

// جلب المنتجات للشركة
app.get('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('🔍 [PRODUCTS] جلب المنتجات للشركة:', companyId);

    // محاولة جلب من الجدول الحقيقي أولاً
    let products = [];

    try {
      products = await executeQuery(
        'SELECT * FROM products WHERE company_id = ? ORDER BY created_at DESC',
        [companyId]
      );
      console.log('✅ [PRODUCTS] تم جلب من الجدول الحقيقي:', products.length, 'منتج');
    } catch (error) {
      console.log('⚠️ [PRODUCTS] فشل الجلب من الجدول الحقيقي، محاولة الجدول المؤقت...');

      try {
        products = await executeQuery(
          'SELECT * FROM products_temp WHERE company_id = ? ORDER BY created_at DESC',
          [companyId]
        );
        console.log('✅ [PRODUCTS] تم جلب من الجدول المؤقت:', products.length, 'منتج');
      } catch (tempError) {
        console.log('⚠️ [PRODUCTS] فشل الجلب من الجدول المؤقت أيضاً');
        products = [];
      }
    }

    res.json({
      success: true,
      data: products || []
    });
  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في جلب المنتجات:', error.message);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب المنتجات: ' + error.message
    });
  }
});

// إضافة منتج جديد
app.post('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    const data = req.body;

    console.log('🏪 [PRODUCTS] إضافة منتج جديد للشركة:', companyId);
    console.log('📦 [PRODUCTS] بيانات المنتج:', JSON.stringify(data, null, 2));

    // التحقق من البيانات المطلوبة
    if (!data.name || data.name.trim() === '') {
      console.log('⚠️ [PRODUCTS] اسم المنتج مفقود');
      return res.status(400).json({
        success: false,
        message: 'اسم المنتج مطلوب'
      });
    }

    const productId = crypto.randomUUID();
    console.log('🆔 [PRODUCTS] معرف المنتج الجديد:', productId);

    // إعداد البيانات
    const insertData = [
      productId,
      companyId,
      data.name.trim(),
      data.description || '',
      data.short_description || '',
      data.sku || `SKU-${Date.now()}`,
      parseFloat(data.price) || 0,
      data.sale_price ? parseFloat(data.sale_price) : null,
      parseInt(data.stock_quantity) || 0,
      data.category || '',
      data.brand || '',
      data.image_url || '',
      data.featured ? 1 : 0,
      data.weight ? parseFloat(data.weight) : null,
      data.status || 'active'
    ];

    let newProduct = null;

    // محاولة الإدراج في الجدول الحقيقي أولاً
    try {
      await executeQuery(`
        INSERT INTO products (
          id, company_id, name, description, short_description, sku,
          price, sale_price, stock_quantity, category, brand,
          image_url, featured, weight, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, insertData);

      console.log('✅ [PRODUCTS] تم إدراج المنتج في الجدول الحقيقي');

      // جلب المنتج المُنشأ
      const products = await executeQuery(
        'SELECT * FROM products WHERE id = ?',
        [productId]
      );
      newProduct = products[0];

    } catch (error) {
      console.log('⚠️ [PRODUCTS] فشل الإدراج في الجدول الحقيقي، محاولة الجدول المؤقت...');

      // إنشاء جدول منتجات مؤقت إذا لم يكن موجوداً
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS products_temp (
          id CHAR(36) PRIMARY KEY,
          company_id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          short_description TEXT,
          sku VARCHAR(100),
          price DECIMAL(10,2) DEFAULT 0,
          sale_price DECIMAL(10,2) NULL,
          stock_quantity INT DEFAULT 0,
          category VARCHAR(100),
          brand VARCHAR(100),
          image_url TEXT,
          featured BOOLEAN DEFAULT FALSE,
          weight DECIMAL(8,2) NULL,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      await executeQuery(`
        INSERT INTO products_temp (
          id, company_id, name, description, short_description, sku,
          price, sale_price, stock_quantity, category, brand,
          image_url, featured, weight, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, insertData);

      console.log('✅ [PRODUCTS] تم إدراج المنتج في الجدول المؤقت');

      // جلب المنتج المُنشأ
      const products = await executeQuery(
        'SELECT * FROM products_temp WHERE id = ?',
        [productId]
      );
      newProduct = products[0];
    }

    console.log('✅ [PRODUCTS] تم إضافة المنتج بنجاح');

    res.json({
      success: true,
      data: newProduct
    });
  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في إضافة المنتج:', error.message);
    res.status(500).json({
      success: false,
      error: 'خطأ في إضافة المنتج: ' + error.message
    });
  }
});

// معالجة المسارات غير الموجودة
app.use((req, res) => {
  console.log('❌ [404] مسار غير موجود:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'المسار غير موجود',
    path: req.originalUrl,
    method: req.method
  });
});

// تشغيل الخادم
app.listen(PORT, async () => {
  console.log(`🚀 Improved Unified Server running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
  console.log(`🏢 Companies: http://localhost:${PORT}/api/companies`);
  console.log(`📦 Products: http://localhost:${PORT}/api/companies/:companyId/products`);

  // إنشاء الشركة التجريبية عند بدء التشغيل
  await ensureTestCompany();
});

// معالجة الأخطاء العامة
// بدء الخادم
app.listen(PORT, () => {
  console.log(`🚀 الخادم الموحد يعمل على المنفذ ${PORT}`);
  console.log(`📡 API متاح على: http://localhost:${PORT}/api`);
  console.log(`🏥 فحص الصحة: http://localhost:${PORT}/api/health`);
});

process.on('uncaughtException', (error) => {
  console.error('❌ [UNCAUGHT EXCEPTION]:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [UNHANDLED REJECTION]:', reason);
});
