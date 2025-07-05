/**
 * 🚀 خادم API متصل بقاعدة البيانات
 * يوفر endpoints حقيقية متصلة بـ MySQL
 */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3002;

// إعدادات قاعدة البيانات
const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectTimeout: 10000,
  connectionLimit: 10,
  queueLimit: 0
};

// إنشاء pool للاتصالات
let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
    console.log('🔌 تم إنشاء pool اتصالات MySQL');
  }
  return pool;
}

// تنفيذ استعلام
async function executeQuery(query, params = []) {
  const connection = await getPool().getConnection();
  try {
    // تعيين ترميز UTF-8 للاتصال
    await connection.execute('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    connection.release();
  }
}

// Middleware
app.use(cors());
app.use(express.json({ charset: 'utf8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf8' }));

// اختبار الاتصال عند بدء التشغيل
async function testDatabaseConnection() {
  try {
    console.log('🔍 اختبار الاتصال بقاعدة البيانات...');
    const result = await executeQuery('SELECT 1 as test');
    console.log('✅ الاتصال بقاعدة البيانات نجح');
    
    // عرض معلومات قاعدة البيانات
    const [dbInfo] = await executeQuery('SELECT VERSION() as version');
    console.log('📊 إصدار MySQL:', dbInfo.version);
    
    // عرض عدد الجداول
    const tables = await executeQuery('SHOW TABLES');
    console.log('📋 عدد الجداول:', tables.length);
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
    return false;
  }
}

// 🏥 Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await executeQuery('SELECT 1 as test');
    res.json({
      success: true,
      message: 'API Server is healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'API Server is running but database connection failed',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🏢 جلب بيانات الشركة
app.get('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 [API] جلب بيانات الشركة:', id);
    
    const companies = await executeQuery(
      'SELECT * FROM companies WHERE id = ? OR email = ?',
      [id, id]
    );
    
    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }
    
    const company = companies[0];
    console.log('✅ [API] تم جلب بيانات الشركة:', company.name);
    
    res.json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        website: company.website,
        address: company.address,
        city: company.city,
        country: company.country,
        status: company.status,
        subscription_status: company.subscription_status,
        created_at: company.created_at,
        updated_at: company.updated_at
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب بيانات الشركة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

// 🔍 التحقق من صحة token
app.post('/api/companies/verify-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token مفقود'
      });
    }

    const token = authHeader.substring(7);
    console.log('🔍 [API] التحقق من token:', token.substring(0, 10) + '...');

    // للتبسيط، نقبل أي token يبدأ بـ test-token
    if (token.startsWith('test-token')) {
      return res.json({
        success: true,
        message: 'Token صحيح',
        data: {
          id: 'c677b32f-fe1c-4c64-8362-a1c03406608d',
          name: 'شركة المنتجات التجريبية',
          email: 'products@demo.local'
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token غير صحيح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في التحقق من token:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// 🔐 تسجيل دخول الشركة
app.post('/api/companies/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 [API] محاولة تسجيل دخول:', email);
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'الإيميل وكلمة المرور مطلوبان'
      });
    }
    
    // البحث عن الشركة
    const companies = await executeQuery(
      'SELECT * FROM companies WHERE email = ? AND status = "active"',
      [email.toLowerCase()]
    );
    
    if (companies.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }
    
    const company = companies[0];
    
    // التحقق من كلمة المرور
    const passwordMatch = await bcrypt.compare(password, company.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة'
      });
    }
    
    // تحديث آخر تسجيل دخول (إذا كان العمود موجود)
    try {
      await executeQuery(
        'UPDATE companies SET updated_at = NOW() WHERE id = ?',
        [company.id]
      );
    } catch (updateError) {
      console.log('⚠️ لا يمكن تحديث آخر تسجيل دخول:', updateError.message);
    }
    
    console.log('✅ [API] تسجيل دخول نجح للشركة:', company.name);
    
    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          phone: company.phone,
          status: company.status,
          created_at: company.created_at
        }
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

// 📋 جلب جميع الشركات
app.get('/api/companies', async (req, res) => {
  try {
    console.log('📋 [API] جلب جميع الشركات');

    const companies = await executeQuery(`
      SELECT id, name, email, phone, website, address, city, country,
             status, subscription_status, created_at, updated_at
      FROM companies
      ORDER BY created_at DESC
    `);

    console.log('📊 [API] تم العثور على', companies.length, 'شركة');

    res.json({
      success: true,
      data: companies,
      total: companies.length
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب الشركات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الشركات',
      error: error.message
    });
  }
});

// 📊 إحصائيات قاعدة البيانات
app.get('/api/db-stats', async (req, res) => {
  try {
    const [companiesCount] = await executeQuery('SELECT COUNT(*) as count FROM companies');
    const [conversationsCount] = await executeQuery('SELECT COUNT(*) as count FROM conversations');
    const [messagesCount] = await executeQuery('SELECT COUNT(*) as count FROM messages');
    const [facebookPagesCount] = await executeQuery('SELECT COUNT(*) as count FROM facebook_settings');
    const [storesCount] = await executeQuery('SELECT COUNT(*) as count FROM store_settings');
    const [productsCount] = await executeQuery('SELECT COUNT(*) as count FROM products');
    
    res.json({
      success: true,
      data: {
        companies: companiesCount.count,
        conversations: conversationsCount.count,
        messages: messagesCount.count,
        facebook_pages: facebookPagesCount.count,
        stores: storesCount.count,
        products: productsCount.count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات',
      error: error.message
    });
  }
});

// 🧪 اختبار قاعدة البيانات
app.get('/api/db-test', async (req, res) => {
  try {
    const testResult = await executeQuery('SELECT NOW() as server_time, VERSION() as mysql_version');
    const tablesResult = await executeQuery('SHOW TABLES');
    
    res.json({
      success: true,
      message: 'اختبار قاعدة البيانات نجح',
      data: {
        current_time: testResult[0].current_time,
        mysql_version: testResult[0].mysql_version,
        tables_count: tablesResult.length,
        tables: tablesResult.map(t => Object.values(t)[0])
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في اختبار قاعدة البيانات:', error);
    res.status(500).json({
      success: false,
      message: 'فشل اختبار قاعدة البيانات',
      error: error.message
    });
  }
});

// 🔍 فحص محتوى جدول facebook_settings
app.get('/api/db-facebook-check', async (req, res) => {
  try {
    const facebookSettings = await executeQuery('SELECT * FROM facebook_settings ORDER BY created_at DESC LIMIT 20');
    const count = await executeQuery('SELECT COUNT(*) as total FROM facebook_settings');

    res.json({
      success: true,
      total: count[0].total,
      data: facebookSettings,
      message: `تم العثور على ${count[0].total} إعداد فيسبوك`
    });
  } catch (error) {
    console.error('❌ [API] خطأ في فحص facebook_settings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔍 فحص محتوى جدول conversations
app.get('/api/db-conversations-check', async (req, res) => {
  try {
    const conversations = await executeQuery('SELECT * FROM conversations ORDER BY created_at DESC LIMIT 20');
    const count = await executeQuery('SELECT COUNT(*) as total FROM conversations');

    res.json({
      success: true,
      total: count[0].total,
      data: conversations,
      message: `تم العثور على ${count[0].total} محادثة`
    });
  } catch (error) {
    console.error('❌ [API] خطأ في فحص conversations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔍 فحص بنية جدول facebook_settings
app.get('/api/db-facebook-structure', async (req, res) => {
  try {
    const structure = await executeQuery('DESCRIBE facebook_settings');
    const indexes = await executeQuery('SHOW INDEX FROM facebook_settings');

    res.json({
      success: true,
      structure: structure,
      indexes: indexes,
      message: 'بنية جدول facebook_settings'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في فحص بنية facebook_settings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================================
// 🏪 Store Management APIs
// ===================================

// جلب بيانات المتجر للشركة
app.get('/api/companies/:companyId/store', async (req, res) => {
  try {
    const { companyId } = req.params;

    console.log('🏪 [API] جلب بيانات المتجر للشركة:', companyId);

    // البحث عن بيانات المتجر
    const storeData = await executeQuery(`
      SELECT * FROM store_settings
      WHERE company_id = ?
    `, [companyId]);

    if (storeData.length === 0) {
      // إنشاء بيانات متجر افتراضية
      const defaultStore = {
        company_id: companyId,
        store_name: 'متجر الشركة التجريبية',
        store_description: 'متجر إلكتروني متخصص في بيع المنتجات عالية الجودة',
        store_logo: 'https://via.placeholder.com/150',
        store_phone: '+966501234567',
        store_email: 'store@example.com',
        store_address: 'الرياض، المملكة العربية السعودية',
        store_website: 'https://example.com',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      await executeQuery(`
        INSERT INTO store_settings (
          id, company_id, store_name, store_description, store_logo,
          store_phone, store_email, store_address, store_website, is_active, created_at, updated_at
        ) VALUES (
          UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
        )
      `, [
        companyId, defaultStore.store_name, defaultStore.store_description,
        defaultStore.store_logo, defaultStore.store_phone, defaultStore.store_email,
        defaultStore.store_address, defaultStore.store_website, defaultStore.is_active
      ]);

      console.log('✅ [API] تم إنشاء متجر افتراضي للشركة:', companyId);

      res.json({
        success: true,
        data: defaultStore
      });
    } else {
      console.log('✅ [API] تم العثور على بيانات المتجر');
      res.json({
        success: true,
        data: storeData[0]
      });
    }
  } catch (error) {
    console.error('❌ [API] خطأ في جلب بيانات المتجر:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// تحديث بيانات المتجر
app.put('/api/companies/:companyId/store', async (req, res) => {
  try {
    const { companyId } = req.params;
    const storeData = req.body;

    console.log('🏪 [API] تحديث بيانات المتجر للشركة:', companyId);

    const result = await executeQuery(`
      UPDATE store_settings
      SET store_name = ?, store_description = ?, store_logo = ?,
          store_phone = ?, store_email = ?, store_address = ?, store_website = ?,
          is_active = ?, updated_at = NOW()
      WHERE company_id = ?
    `, [
      storeData.store_name || '',
      storeData.store_description || '',
      storeData.store_logo || '',
      storeData.store_phone || '',
      storeData.store_email || '',
      storeData.store_address || '',
      storeData.store_website || '',
      storeData.is_active !== false ? 1 : 0,
      companyId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'المتجر غير موجود'
      });
    }

    console.log('✅ [API] تم تحديث بيانات المتجر بنجاح');

    res.json({
      success: true,
      message: 'تم تحديث بيانات المتجر بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في تحديث بيانات المتجر:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================================
// 💬 Conversations APIs
// ===================================

// جلب المحادثات للشركة
app.get('/api/companies/:companyId/conversations', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { limit = 50, recent_only = 'true' } = req.query;

    console.log('💬 [API] جلب المحادثات للشركة:', companyId);

    // محاكاة بيانات محادثات تجريبية
    const mockConversations = [
      {
        id: 'conv-1',
        customer_name: 'أحمد محمد',
        customer_id: 'customer-1',
        last_message: 'مرحبا، أريد الاستفسار عن المنتجات',
        last_message_time: new Date().toISOString(),
        unread_count: 2,
        status: 'active',
        platform: 'facebook'
      },
      {
        id: 'conv-2',
        customer_name: 'فاطمة علي',
        customer_id: 'customer-2',
        last_message: 'شكراً لكم على الخدمة الممتازة',
        last_message_time: new Date(Date.now() - 3600000).toISOString(),
        unread_count: 0,
        status: 'resolved',
        platform: 'facebook'
      }
    ];

    res.json({
      success: true,
      data: mockConversations,
      total: mockConversations.length
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب المحادثات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المحادثات'
    });
  }
});

// جلب رسائل محادثة معينة
app.get('/api/companies/:companyId/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { companyId, conversationId } = req.params;
    const { limit = 50 } = req.query;

    console.log('📨 [API] جلب رسائل المحادثة:', conversationId);

    // محاكاة رسائل تجريبية
    const mockMessages = [
      {
        id: 'msg-1',
        conversation_id: conversationId,
        sender_id: 'customer-1',
        sender_name: 'أحمد محمد',
        message_text: 'مرحبا، أريد الاستفسار عن المنتجات',
        message_type: 'text',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        is_from_customer: true
      },
      {
        id: 'msg-2',
        conversation_id: conversationId,
        sender_id: 'bot',
        sender_name: 'البوت',
        message_text: 'مرحباً بك! كيف يمكنني مساعدتك اليوم؟',
        message_type: 'text',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        is_from_customer: false
      }
    ];

    res.json({
      success: true,
      data: mockMessages,
      total: mockMessages.length
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب الرسائل:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الرسائل'
    });
  }
});

// ===================================
// 📦 Products APIs
// ===================================

// جلب المنتجات للشركة
app.get('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;

    console.log('📦 [API] جلب المنتجات للشركة:', companyId);

    const products = await executeQuery(`
      SELECT * FROM products
      WHERE company_id = ?
      ORDER BY created_at DESC
    `, [companyId]);

    console.log('📦 [API] تم العثور على', products.length, 'منتج');

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب المنتجات:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// إضافة منتج جديد
app.post('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    const productData = req.body;

    console.log('📦 [API] إضافة منتج جديد للشركة:', companyId);
    console.log('📦 [API] اسم المنتج:', productData.name);

    if (!productData.name || productData.name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'اسم المنتج مطلوب'
      });
    }

    // إنشاء slug من الاسم
    const slug = productData.name.trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-\u0600-\u06FF]/g, '')
      .toLowerCase();

    const result = await executeQuery(`
      INSERT INTO products (
        company_id, name, description, short_description, sku,
        price, sale_price, stock_quantity, category, brand,
        image_url, featured, weight, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      companyId,
      productData.name.trim(),
      productData.description || '',
      productData.short_description || '',
      productData.sku || `SKU-${Date.now()}`,
      parseFloat(productData.price) || 0,
      productData.sale_price ? parseFloat(productData.sale_price) : null,
      parseInt(productData.stock_quantity) || 0,
      productData.category || '',
      productData.brand || '',
      productData.image_url || '',
      productData.featured ? 1 : 0,
      productData.weight ? parseFloat(productData.weight) : null,
      productData.status || 'active'
    ]);

    // جلب المنتج المُنشأ
    const newProduct = await executeQuery(`
      SELECT * FROM products WHERE id = ?
    `, [result.insertId]);

    console.log('✅ [API] تم إضافة المنتج بنجاح:', newProduct[0]?.name || 'منتج جديد');

    res.json({
      success: true,
      data: newProduct[0] || { id: result.insertId, name: productData.name },
      message: 'تم إضافة المنتج بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إضافة المنتج:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// تحديث منتج
app.put('/api/companies/:companyId/products/:productId', async (req, res) => {
  try {
    const { companyId, productId } = req.params;
    const productData = req.body;

    console.log('📦 [API] تحديث المنتج:', productId, 'للشركة:', companyId);

    const result = await executeQuery(`
      UPDATE products
      SET name = ?, description = ?, short_description = ?, sku = ?,
          price = ?, sale_price = ?, cost_price = ?, stock_quantity = ?,
          category = ?, brand = ?, image_url = ?, featured = ?,
          weight = ?, status = ?, updated_at = NOW()
      WHERE id = ? AND company_id = ?
    `, [
      productData.name,
      productData.description,
      productData.short_description,
      productData.sku,
      productData.price,
      productData.sale_price,
      productData.cost_price,
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
        error: 'المنتج غير موجود'
      });
    }

    console.log('✅ [API] تم تحديث المنتج بنجاح');

    res.json({
      success: true,
      message: 'تم تحديث المنتج بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في تحديث المنتج:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// حذف منتج
app.delete('/api/companies/:companyId/products/:productId', async (req, res) => {
  try {
    const { companyId, productId } = req.params;

    console.log('📦 [API] حذف المنتج:', productId, 'للشركة:', companyId);

    const result = await executeQuery(`
      DELETE FROM products
      WHERE id = ? AND company_id = ?
    `, [productId, companyId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'المنتج غير موجود'
      });
    }

    console.log('✅ [API] تم حذف المنتج بنجاح');

    res.json({
      success: true,
      message: 'تم حذف المنتج بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في حذف المنتج:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================================
// 📱 Facebook APIs
// ===================================

// جلب إعدادات فيسبوك للشركة
app.get('/api/facebook/settings', async (req, res) => {
  try {
    const { company_id } = req.query;

    console.log('🔍 [API] جلب إعدادات فيسبوك للشركة:', company_id);

    // إذا لم يتم تمرير company_id، جلب جميع الإعدادات
    let query = 'SELECT * FROM facebook_settings';
    let params = [];

    if (company_id) {
      query += ' WHERE company_id = ?';
      params.push(company_id);
    }

    query += ' ORDER BY created_at DESC';

    const settings = await executeQuery(query, params);

    console.log('📄 [API] تم العثور على', settings.length, 'إعدادات فيسبوك');

    res.json(settings);
  } catch (error) {
    console.error('❌ [API] خطأ في جلب إعدادات فيسبوك:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// إضافة صفحة فيسبوك جديدة
app.post('/api/facebook/settings', async (req, res) => {
  try {
    const { company_id, page_id, page_name, access_token } = req.body;

    console.log('➕ [API] إضافة صفحة فيسبوك جديدة:', { company_id, page_id, page_name });

    if (!company_id || !page_id || !page_name || !access_token) {
      return res.status(400).json({
        success: false,
        error: 'جميع الحقول مطلوبة: company_id, page_id, page_name, access_token'
      });
    }

    // التحقق من عدم وجود الصفحة مسبقاً
    const existingPage = await executeQuery(`
      SELECT id FROM facebook_settings WHERE page_id = ?
    `, [page_id]);

    if (existingPage.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'هذه الصفحة مربوطة مسبقاً'
      });
    }

    // إضافة الصفحة الجديدة
    const result = await executeQuery(`
      INSERT INTO facebook_settings (
        id, company_id, page_id, page_name, access_token,
        is_active, auto_reply_enabled, webhook_verify_token, created_at, updated_at
      ) VALUES (
        UUID(), ?, ?, ?, ?,
        TRUE, FALSE, 'facebook_verify_token_123', NOW(), NOW()
      )
    `, [company_id, page_id, page_name, access_token]);

    console.log('✅ [API] تم إضافة صفحة فيسبوك بنجاح');

    res.json({
      success: true,
      message: 'تم إضافة صفحة فيسبوك بنجاح',
      page_id: page_id
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إضافة صفحة فيسبوك:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// حذف صفحة فيسبوك
app.delete('/api/facebook/settings/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;

    console.log('🗑️ [API] حذف صفحة فيسبوك:', pageId);

    const result = await executeQuery(`
      DELETE FROM facebook_settings WHERE page_id = ?
    `, [pageId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'الصفحة غير موجودة'
      });
    }

    console.log('✅ [API] تم حذف صفحة فيسبوك بنجاح');

    res.json({
      success: true,
      message: 'تم حذف الصفحة بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في حذف صفحة فيسبوك:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// تفعيل/إيقاف صفحة فيسبوك
app.put('/api/facebook/settings/:pageId/toggle', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { is_active } = req.body;

    console.log('🔄 [API] تغيير حالة صفحة فيسبوك:', pageId, 'إلى:', is_active);

    const result = await executeQuery(`
      UPDATE facebook_settings
      SET is_active = ?, updated_at = NOW()
      WHERE page_id = ?
    `, [is_active, pageId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'الصفحة غير موجودة'
      });
    }

    console.log('✅ [API] تم تغيير حالة الصفحة بنجاح');

    res.json({
      success: true,
      message: `تم ${is_active ? 'تفعيل' : 'إيقاف'} الصفحة بنجاح`
    });
  } catch (error) {
    console.error('❌ [API] خطأ في تغيير حالة الصفحة:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// إنشاء جداول قاعدة البيانات المطلوبة
async function createRequiredTables() {
  try {
    console.log('🔧 التحقق من الجداول المطلوبة...');

    // إنشاء جدول facebook_settings إذا لم يكن موجوداً
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS facebook_settings (
        id VARCHAR(36) PRIMARY KEY,
        company_id VARCHAR(36) NOT NULL,
        page_id VARCHAR(255) NOT NULL UNIQUE,
        page_name VARCHAR(255) NOT NULL,
        access_token TEXT NOT NULL,
        webhook_verify_token VARCHAR(255) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        auto_reply_enabled BOOLEAN DEFAULT FALSE,
        welcome_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_id (company_id),
        INDEX idx_page_id (page_id),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ جدول facebook_settings جاهز');

    // إنشاء جدول store_settings إذا لم يكن موجوداً
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id VARCHAR(36) PRIMARY KEY,
        company_id VARCHAR(36) NOT NULL,
        store_name VARCHAR(255) NOT NULL,
        store_description TEXT,
        store_logo TEXT,
        store_phone VARCHAR(50),
        store_email VARCHAR(255),
        store_address TEXT,
        store_website VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_id (company_id),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ جدول store_settings جاهز');

    // إضافة عمود store_website إذا لم يكن موجوداً
    try {
      await executeQuery(`
        ALTER TABLE store_settings
        ADD COLUMN store_website VARCHAR(255) AFTER store_address
      `);
      console.log('✅ تم إضافة عمود store_website');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.log('ℹ️ عمود store_website موجود مسبقاً');
      }
    }

    // إنشاء جدول products إذا لم يكن موجوداً
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id VARCHAR(36) NOT NULL,
        store_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        description TEXT,
        short_description TEXT,
        sku VARCHAR(100) UNIQUE,
        price DECIMAL(10,2) DEFAULT 0,
        sale_price DECIMAL(10,2) NULL,
        cost_price DECIMAL(10,2) NULL,
        stock_quantity INT DEFAULT 0,
        category VARCHAR(100),
        brand VARCHAR(100),
        image_url TEXT,
        featured BOOLEAN DEFAULT FALSE,
        weight DECIMAL(8,2) NULL,
        status ENUM('active', 'inactive', 'draft') DEFAULT 'active',
        manage_stock BOOLEAN DEFAULT TRUE,
        stock_status ENUM('in_stock', 'out_of_stock', 'on_backorder') DEFAULT 'in_stock',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_id (company_id),
        INDEX idx_store_id (store_id),
        INDEX idx_status (status),
        INDEX idx_featured (featured),
        INDEX idx_category (category),
        INDEX idx_sku (sku)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ جدول products جاهز');

  } catch (error) {
    console.error('❌ خطأ في إنشاء الجداول:', error);
  }
}

// بدء الخادم
async function startServer() {
  // اختبار قاعدة البيانات أولاً
  const dbConnected = await testDatabaseConnection();

  if (dbConnected) {
    // إنشاء الجداول المطلوبة
    await createRequiredTables();
  }
  
  if (!dbConnected) {
    console.log('⚠️ سيتم تشغيل الخادم بدون قاعدة البيانات');
  }
  
  // ===================================
  // 📊 Analytics APIs
  // ===================================

  // جلب بيانات التحليلات
  app.get('/api/analytics', async (req, res) => {
    try {
      console.log('📊 [API] جلب بيانات التحليلات');

      // بيانات تحليلات تجريبية
      const analyticsData = {
        dailyStats: [
          { day: "السبت", messages: 45, responses: 42 },
          { day: "الأحد", messages: 67, responses: 64 },
          { day: "الاثنين", messages: 89, responses: 85 },
          { day: "الثلاثاء", messages: 78, responses: 76 },
          { day: "الأربعاء", messages: 92, responses: 89 },
          { day: "الخميس", messages: 84, responses: 81 },
          { day: "الجمعة", messages: 56, responses: 53 }
        ],
        responseTimeData: [
          { hour: "9", avgTime: 2.3 },
          { hour: "10", avgTime: 1.8 },
          { hour: "11", avgTime: 2.1 },
          { hour: "12", avgTime: 3.2 },
          { hour: "13", avgTime: 2.8 },
          { hour: "14", avgTime: 2.4 },
          { hour: "15", avgTime: 2.0 },
          { hour: "16", avgTime: 2.6 },
          { hour: "17", avgTime: 3.1 }
        ],
        messageTypeStats: [
          { name: "أوقات العمل", value: 156, color: "#3B82F6" },
          { name: "الأسعار", value: 134, color: "#8B5CF6" },
          { name: "التوصيل", value: 89, color: "#10B981" },
          { name: "المنتجات", value: 67, color: "#F59E0B" },
          { name: "الدعم", value: 45, color: "#EF4444" }
        ],
        performanceMetrics: {
          responseRate: "98.2%",
          avgResponseTime: "2.1s",
          totalResponses: 1247,
          customerSatisfaction: "89%"
        }
      };

      res.json({
        success: true,
        data: analyticsData
      });

    } catch (error) {
      console.error('❌ [API] خطأ في جلب التحليلات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب بيانات التحليلات'
      });
    }
  });

  // فحص بيانات Facebook في قاعدة البيانات
  app.get('/api/db-facebook-data', async (req, res) => {
    try {
      console.log('🔍 [API] فحص بيانات Facebook في قاعدة البيانات');

      const facebookData = await executeQuery(`
        SELECT id, company_id, page_id, page_name, is_active,
               webhook_verify_token, auto_reply_enabled, created_at
        FROM facebook_settings
        ORDER BY created_at DESC
      `);

      console.log('📊 [API] تم العثور على', facebookData.length, 'صفحة فيسبوك');

      res.json({
        success: true,
        data: facebookData,
        total: facebookData.length,
        message: `تم العثور على ${facebookData.length} صفحة فيسبوك في قاعدة البيانات`
      });

    } catch (error) {
      console.error('❌ [API] خطأ في فحص بيانات Facebook:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في فحص بيانات Facebook'
      });
    }
  });

  // ===================================
  // 🤖 Gemini AI APIs
  // ===================================

  // جلب إعدادات Gemini للشركة
  app.get('/api/gemini/settings', async (req, res) => {
    try {
      const { company_id } = req.query;

      console.log('🤖 [API] جلب إعدادات Gemini للشركة:', company_id);

      if (!company_id) {
        return res.status(400).json({
          success: false,
          error: 'company_id مطلوب'
        });
      }

      // محاكاة إعدادات Gemini تجريبية
      const mockSettings = {
        id: `gemini-${company_id}`,
        company_id: company_id,
        api_key: '',
        model: 'gemini-2.5-flash-lite-preview-06-17',
        prompt_template: 'أنت مساعد ذكي لخدمة العملاء. ساعد العملاء بطريقة مهذبة ومفيدة.',
        personality_prompt: 'كن مهذباً ومساعداً ومحترفاً في جميع ردودك.',
        products_prompt: 'عندما يسأل العميل عن منتج، استخدم [SEND_IMAGE: وصف المنتج] لإرسال صورة.',
        is_enabled: false,
        max_tokens: 1000,
        temperature: 0.7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      res.json({
        success: true,
        data: mockSettings
      });

    } catch (error) {
      console.error('❌ [API] خطأ في جلب إعدادات Gemini:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب إعدادات Gemini'
      });
    }
  });

  // تحديث إعدادات Gemini
  app.put('/api/gemini/settings', async (req, res) => {
    try {
      const settings = req.body;

      console.log('🤖 [API] تحديث إعدادات Gemini:', settings.company_id);

      // محاكاة حفظ الإعدادات
      const updatedSettings = {
        ...settings,
        updated_at: new Date().toISOString()
      };

      res.json({
        success: true,
        data: updatedSettings,
        message: 'تم حفظ إعدادات Gemini بنجاح'
      });

    } catch (error) {
      console.error('❌ [API] خطأ في تحديث إعدادات Gemini:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حفظ إعدادات Gemini'
      });
    }
  });

  // اختبار Gemini AI
  app.post('/api/gemini/test', async (req, res) => {
    try {
      const { company_id, message } = req.body;

      console.log('🤖 [API] اختبار Gemini AI للشركة:', company_id);
      console.log('📝 [API] الرسالة:', message);

      // محاكاة رد من Gemini
      const mockResponse = {
        success: true,
        response: `مرحباً! هذا رد تجريبي من Gemini AI. رسالتك كانت: "${message}". النظام يعمل بشكل صحيح! 🤖`,
        model: 'gemini-2.5-flash-lite-preview-06-17',
        tokens_used: 45,
        response_time: '1.2s'
      };

      res.json(mockResponse);

    } catch (error) {
      console.error('❌ [API] خطأ في اختبار Gemini:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في اختبار Gemini AI'
      });
    }
  });

  // ===================================
  // 🏷️ Categories APIs
  // ===================================

  // جلب جميع الفئات للشركة
  app.get('/api/companies/:companyId/categories', async (req, res) => {
    try {
      const { companyId } = req.params;

      console.log('🏷️ [API] جلب الفئات للشركة:', companyId);

      // محاكاة فئات تجريبية
      const mockCategories = [
        {
          id: 'cat-1',
          company_id: companyId,
          name: 'إلكترونيات',
          description: 'جميع المنتجات الإلكترونية',
          slug: 'electronics',
          parent_id: null,
          image_url: '',
          is_active: true,
          sort_order: 1,
          meta_title: 'إلكترونيات',
          meta_description: 'فئة الإلكترونيات',
          products_count: 15,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'cat-2',
          company_id: companyId,
          name: 'ملابس',
          description: 'ملابس رجالية ونسائية',
          slug: 'clothing',
          parent_id: null,
          image_url: '',
          is_active: true,
          sort_order: 2,
          meta_title: 'ملابس',
          meta_description: 'فئة الملابس',
          products_count: 8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'cat-3',
          company_id: companyId,
          name: 'هواتف ذكية',
          description: 'أحدث الهواتف الذكية',
          slug: 'smartphones',
          parent_id: 'cat-1',
          image_url: '',
          is_active: true,
          sort_order: 1,
          meta_title: 'هواتف ذكية',
          meta_description: 'فئة الهواتف الذكية',
          products_count: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      console.log('📊 [API] تم العثور على', mockCategories.length, 'فئة');

      res.json({
        success: true,
        data: mockCategories,
        total: mockCategories.length
      });

    } catch (error) {
      console.error('❌ [API] خطأ في جلب الفئات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الفئات'
      });
    }
  });

  // إضافة فئة جديدة
  app.post('/api/companies/:companyId/categories', async (req, res) => {
    try {
      const { companyId } = req.params;
      const categoryData = req.body;

      console.log('🏷️ [API] إضافة فئة جديدة للشركة:', companyId);
      console.log('📝 [API] بيانات الفئة:', categoryData.name);

      // محاكاة إضافة الفئة
      const newCategory = {
        id: `cat-${Date.now()}`,
        company_id: companyId,
        ...categoryData,
        products_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('✅ [API] تم إضافة الفئة بنجاح:', newCategory.name);

      res.json({
        success: true,
        data: newCategory,
        message: 'تم إضافة الفئة بنجاح'
      });

    } catch (error) {
      console.error('❌ [API] خطأ في إضافة الفئة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إضافة الفئة'
      });
    }
  });

  // تحديث فئة
  app.put('/api/companies/:companyId/categories/:categoryId', async (req, res) => {
    try {
      const { companyId, categoryId } = req.params;
      const updateData = req.body;

      console.log('🏷️ [API] تحديث الفئة:', categoryId, 'للشركة:', companyId);

      // محاكاة تحديث الفئة
      const updatedCategory = {
        id: categoryId,
        company_id: companyId,
        ...updateData,
        updated_at: new Date().toISOString()
      };

      console.log('✅ [API] تم تحديث الفئة بنجاح:', updatedCategory.name);

      res.json({
        success: true,
        data: updatedCategory,
        message: 'تم تحديث الفئة بنجاح'
      });

    } catch (error) {
      console.error('❌ [API] خطأ في تحديث الفئة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث الفئة'
      });
    }
  });

  // حذف فئة
  app.delete('/api/companies/:companyId/categories/:categoryId', async (req, res) => {
    try {
      const { companyId, categoryId } = req.params;

      console.log('🏷️ [API] حذف الفئة:', categoryId, 'للشركة:', companyId);

      console.log('✅ [API] تم حذف الفئة بنجاح');

      res.json({
        success: true,
        message: 'تم حذف الفئة بنجاح'
      });

    } catch (error) {
      console.error('❌ [API] خطأ في حذف الفئة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف الفئة'
      });
    }
  });

  // ===================================
  // 🛒 Cart APIs
  // ===================================

  // جلب عناصر السلة للجلسة
  app.get('/api/companies/:companyId/cart/:sessionId', async (req, res) => {
    try {
      const { companyId, sessionId } = req.params;

      console.log('🛒 [API] جلب عناصر السلة للجلسة:', sessionId);

      // محاكاة عناصر السلة
      const mockCartItems = [
        {
          id: 'cart-item-1',
          product_id: '8e5b98d6-5920-11f0-9d70-02d83583ef25',
          product_name: 'تجربي',
          product_image: '',
          product_sku: 'SKU-1751665681295',
          price: 500.00,
          quantity: 2,
          total: 1000.00,
          stock_quantity: 500,
          session_id: sessionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'cart-item-2',
          product_id: 'f693c349-590c-11f0-9d70-02d83583ef25',
          product_name: 'بلابلببببببببب',
          product_image: '',
          product_sku: 'SKU-1751657265906',
          price: 4000.00,
          quantity: 1,
          total: 4000.00,
          stock_quantity: 10,
          session_id: sessionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      console.log('📊 [API] تم العثور على', mockCartItems.length, 'عنصر في السلة');

      res.json({
        success: true,
        data: mockCartItems,
        total: mockCartItems.length
      });

    } catch (error) {
      console.error('❌ [API] خطأ في جلب عناصر السلة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب عناصر السلة'
      });
    }
  });

  // تحديث كمية منتج في السلة
  app.put('/api/companies/:companyId/cart/:sessionId/:itemId', async (req, res) => {
    try {
      const { companyId, sessionId, itemId } = req.params;
      const { quantity } = req.body;

      console.log('🛒 [API] تحديث كمية المنتج:', itemId, 'الكمية الجديدة:', quantity);

      // محاكاة تحديث الكمية
      const updatedItem = {
        id: itemId,
        quantity: quantity,
        total: quantity * 500, // سعر تجريبي
        updated_at: new Date().toISOString()
      };

      console.log('✅ [API] تم تحديث كمية المنتج بنجاح');

      res.json({
        success: true,
        data: updatedItem,
        message: 'تم تحديث الكمية بنجاح'
      });

    } catch (error) {
      console.error('❌ [API] خطأ في تحديث كمية المنتج:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث الكمية'
      });
    }
  });

  // حذف منتج من السلة
  app.delete('/api/companies/:companyId/cart/:sessionId/:itemId', async (req, res) => {
    try {
      const { companyId, sessionId, itemId } = req.params;

      console.log('🛒 [API] حذف منتج من السلة:', itemId);

      console.log('✅ [API] تم حذف المنتج من السلة بنجاح');

      res.json({
        success: true,
        message: 'تم حذف المنتج من السلة بنجاح'
      });

    } catch (error) {
      console.error('❌ [API] خطأ في حذف المنتج من السلة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف المنتج'
      });
    }
  });

  // إضافة منتج للسلة
  app.post('/api/companies/:companyId/cart/:sessionId/add', async (req, res) => {
    try {
      const { companyId, sessionId } = req.params;
      const productData = req.body;

      console.log('🛒 [API] إضافة منتج للسلة:', productData.product_name);

      // محاكاة إضافة المنتج للسلة
      const cartItem = {
        id: `cart-item-${Date.now()}`,
        product_id: productData.product_id,
        product_name: productData.product_name,
        product_sku: productData.product_sku,
        price: productData.price,
        quantity: productData.quantity || 1,
        total: productData.price * (productData.quantity || 1),
        session_id: sessionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('✅ [API] تم إضافة المنتج للسلة بنجاح');

      res.json({
        success: true,
        data: cartItem,
        message: 'تم إضافة المنتج للسلة بنجاح'
      });

    } catch (error) {
      console.error('❌ [API] خطأ في إضافة المنتج للسلة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إضافة المنتج للسلة'
      });
    }
  });

  // مسح جميع عناصر السلة للجلسة
  app.delete('/api/companies/:companyId/cart/:sessionId', async (req, res) => {
    try {
      const { companyId, sessionId } = req.params;

      console.log('🛒 [API] مسح جميع عناصر السلة للجلسة:', sessionId);

      console.log('✅ [API] تم مسح جميع عناصر السلة بنجاح');

      res.json({
        success: true,
        message: 'تم مسح السلة بنجاح'
      });

    } catch (error) {
      console.error('❌ [API] خطأ في مسح السلة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في مسح السلة'
      });
    }
  });

  // ===================================
  // 📦 Orders APIs
  // ===================================

  // إنشاء طلب جديد (Checkout)
  app.post('/api/companies/:companyId/orders', async (req, res) => {
    try {
      const { companyId } = req.params;
      const orderData = req.body;

      console.log('📦 [API] إنشاء طلب جديد للشركة:', companyId);
      console.log('💰 [API] إجمالي الطلب:', orderData.summary.total);

      // محاكاة إنشاء الطلب
      const newOrder = {
        id: `order-${Date.now()}`,
        order_number: `ORD-${Date.now()}`,
        company_id: companyId,
        session_id: orderData.session_id,
        status: 'pending',
        payment_status: 'pending',
        items: orderData.items,
        summary: orderData.summary,
        coupon: orderData.coupon,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('✅ [API] تم إنشاء الطلب بنجاح:', newOrder.order_number);

      res.json({
        success: true,
        data: newOrder,
        message: 'تم إنشاء الطلب بنجاح'
      });

    } catch (error) {
      console.error('❌ [API] خطأ في إنشاء الطلب:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء الطلب'
      });
    }
  });

  // جلب جميع الطلبات للشركة
  app.get('/api/companies/:companyId/orders', async (req, res) => {
    try {
      const { companyId } = req.params;

      console.log('📦 [API] جلب جميع الطلبات للشركة:', companyId);

      // محاكاة طلبات تجريبية
      const mockOrders = [
        {
          id: 'order-1751672037174',
          order_number: 'ORD-1751672037174',
          customer_name: 'أحمد محمد',
          customer_email: 'ahmed@example.com',
          customer_phone: '+966501234567',
          customer_address: 'الرياض، المملكة العربية السعودية',
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: 'credit_card',
          subtotal: 5000.00,
          shipping_cost: 0.00,
          tax_amount: 750.00,
          discount_amount: 0.00,
          total_amount: 5750.00,
          items_count: 3,
          session_id: 'session_1751671731688_jk53x6j20',
          coupon_code: null,
          notes: 'طلب عادي',
          created_at: '2025-07-04T20:33:57.000Z',
          updated_at: '2025-07-04T20:35:12.000Z'
        },
        {
          id: 'order-1751672443830',
          order_number: 'ORD-1751672443830',
          customer_name: 'فاطمة أحمد',
          customer_email: 'fatima@example.com',
          customer_phone: '+966507654321',
          customer_address: 'جدة، المملكة العربية السعودية',
          status: 'processing',
          payment_status: 'paid',
          payment_method: 'bank_transfer',
          subtotal: 3000.00,
          shipping_cost: 50.00,
          tax_amount: 457.50,
          discount_amount: 200.00,
          total_amount: 3307.50,
          items_count: 2,
          session_id: 'session_1751672400000_abc123',
          coupon_code: 'SAVE200',
          notes: 'طلب مع خصم',
          created_at: '2025-07-04T21:40:43.000Z',
          updated_at: '2025-07-04T21:42:15.000Z'
        },
        {
          id: 'order-1751672459781',
          order_number: 'ORD-1751672459781',
          customer_name: 'محمد علي',
          customer_email: 'mohammed@example.com',
          customer_phone: '+966509876543',
          customer_address: 'الدمام، المملكة العربية السعودية',
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'cash_on_delivery',
          subtotal: 1500.00,
          shipping_cost: 25.00,
          tax_amount: 228.75,
          discount_amount: 0.00,
          total_amount: 1753.75,
          items_count: 1,
          session_id: 'session_1751672450000_xyz789',
          coupon_code: null,
          notes: 'دفع عند الاستلام',
          created_at: '2025-07-04T21:40:59.000Z',
          updated_at: '2025-07-04T21:40:59.000Z'
        }
      ];

      console.log('📊 [API] تم العثور على', mockOrders.length, 'طلب');

      res.json({
        success: true,
        data: mockOrders,
        total: mockOrders.length,
        summary: {
          total_orders: mockOrders.length,
          total_revenue: mockOrders.reduce((sum, order) => sum + order.total_amount, 0),
          pending_orders: mockOrders.filter(o => o.status === 'pending').length,
          confirmed_orders: mockOrders.filter(o => o.status === 'confirmed').length,
          processing_orders: mockOrders.filter(o => o.status === 'processing').length
        }
      });

    } catch (error) {
      console.error('❌ [API] خطأ في جلب الطلبات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الطلبات'
      });
    }
  });

  // جلب تفاصيل طلب محدد
  app.get('/api/companies/:companyId/orders/:orderId', async (req, res) => {
    try {
      const { companyId, orderId } = req.params;

      console.log('📦 [API] جلب تفاصيل الطلب:', orderId);

      // محاكاة تفاصيل الطلب
      const orderDetails = {
        id: orderId,
        order_number: `ORD-${orderId.split('-')[1]}`,
        customer_name: 'أحمد محمد',
        customer_email: 'ahmed@example.com',
        customer_phone: '+966501234567',
        customer_address: 'الرياض، المملكة العربية السعودية',
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: 'credit_card',
        subtotal: 5000.00,
        shipping_cost: 0.00,
        tax_amount: 750.00,
        discount_amount: 0.00,
        total_amount: 5750.00,
        items_count: 3,
        session_id: 'session_test',
        coupon_code: null,
        notes: 'طلب عادي',
        items: [
          {
            id: 'item-1',
            product_name: 'تجربي',
            product_sku: 'SKU-1751665681295',
            quantity: 2,
            price: 500.00,
            total: 1000.00
          },
          {
            id: 'item-2',
            product_name: 'بلابلببببببببب',
            product_sku: 'SKU-1751657265906',
            quantity: 1,
            price: 4000.00,
            total: 4000.00
          }
        ],
        created_at: '2025-07-04T20:33:57.000Z',
        updated_at: '2025-07-04T20:35:12.000Z'
      };

      console.log('✅ [API] تم جلب تفاصيل الطلب بنجاح');

      res.json({
        success: true,
        data: orderDetails
      });

    } catch (error) {
      console.error('❌ [API] خطأ في جلب تفاصيل الطلب:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تفاصيل الطلب'
      });
    }
  });

  // تحديث حالة الطلب
  app.patch('/api/companies/:companyId/orders/:orderId/status', async (req, res) => {
    try {
      const { companyId, orderId } = req.params;
      const { status } = req.body;

      console.log('📦 [API] تحديث حالة الطلب:', orderId, 'الحالة الجديدة:', status);

      console.log('✅ [API] تم تحديث حالة الطلب بنجاح');

      res.json({
        success: true,
        message: 'تم تحديث حالة الطلب بنجاح',
        data: { id: orderId, status: status }
      });

    } catch (error) {
      console.error('❌ [API] خطأ في تحديث حالة الطلب:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث حالة الطلب'
      });
    }
  });

  // تحديث حالة الدفع
  app.patch('/api/companies/:companyId/orders/:orderId/payment', async (req, res) => {
    try {
      const { companyId, orderId } = req.params;
      const { payment_status } = req.body;

      console.log('💳 [API] تحديث حالة الدفع:', orderId, 'الحالة الجديدة:', payment_status);

      console.log('✅ [API] تم تحديث حالة الدفع بنجاح');

      res.json({
        success: true,
        message: 'تم تحديث حالة الدفع بنجاح',
        data: { id: orderId, payment_status: payment_status }
      });

    } catch (error) {
      console.error('❌ [API] خطأ في تحديث حالة الدفع:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث حالة الدفع'
      });
    }
  });

  // ===================================
  // 📡 SSE (Server-Sent Events) APIs
  // ===================================

  // SSE endpoint للتحديث الفوري
  app.get('/api/sse/:companyId', (req, res) => {
    const { companyId } = req.params;

    console.log('📡 [SSE] اتصال جديد للشركة:', companyId);

    // إعداد headers للـ SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // إرسال رسالة ترحيب
    res.write(`data: ${JSON.stringify({
      type: 'connected',
      message: 'تم الاتصال بنجاح',
      timestamp: new Date().toISOString()
    })}\n\n`);

    // إرسال heartbeat كل 30 ثانية
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      })}\n\n`);
    }, 30000);

    // تنظيف عند قطع الاتصال
    req.on('close', () => {
      console.log('📡 [SSE] تم قطع الاتصال للشركة:', companyId);
      clearInterval(heartbeat);
    });
  });

  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 خادم API يعمل على المنفذ:', PORT);
    console.log('🌐 الرابط: http://localhost:' + PORT);
    console.log('🏥 فحص الصحة: http://localhost:' + PORT + '/api/health');
    console.log('🧪 اختبار قاعدة البيانات: http://localhost:' + PORT + '/api/db-test');
    console.log('📊 الإحصائيات: http://localhost:' + PORT + '/api/db-stats');
    console.log('📱 إعدادات فيسبوك: http://localhost:' + PORT + '/api/facebook/settings');
    console.log('💬 المحادثات: http://localhost:' + PORT + '/api/companies/{id}/conversations');
    console.log('📡 SSE: http://localhost:' + PORT + '/api/sse/{id}');
    console.log('');
  });
}

startServer();
