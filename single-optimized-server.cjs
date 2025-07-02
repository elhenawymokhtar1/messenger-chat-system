// 🎯 خادم واحد محسن - بدون تضارب
console.log('🚀 ========================================');
console.log('🚀 بدء تشغيل الخادم الواحد المحسن...');
console.log('🚀 ========================================');

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3333; // منفذ جديد لتجنب التضارب

console.log('📦 تم تحميل جميع المكتبات بنجاح');

// إعدادات قاعدة البيانات
const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306
};

console.log('🗄️ إعدادات قاعدة البيانات جاهزة');

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware مُحسن
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📥 [${timestamp}] ${req.method} ${req.path}`);
  next();
});

console.log('⚙️ تم إعداد Middleware');

// دالة الاتصال بقاعدة البيانات مع معالجة أفضل للأخطاء
async function executeQuery(query, params = []) {
  let connection;
  try {
    console.log(`🔍 [DB] تنفيذ: ${query.substring(0, 50)}...`);
    connection = await mysql.createConnection(DB_CONFIG);
    const [rows] = await connection.execute(query, params);
    console.log(`✅ [DB] نجح - ${rows.length} صف`);
    return rows;
  } catch (error) {
    console.error(`❌ [DB] خطأ: ${error.message}`);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// اختبار قاعدة البيانات
async function testDatabase() {
  try {
    console.log('🔗 اختبار الاتصال بقاعدة البيانات...');
    const result = await executeQuery('SELECT 1 as test, NOW() as current_time');
    console.log('✅ قاعدة البيانات تعمل بشكل مثالي!');
    return true;
  } catch (error) {
    console.error('❌ قاعدة البيانات لا تعمل:', error.message);
    return false;
  }
}

// ===== ROUTES =====

// الصفحة الرئيسية
app.get('/', (req, res) => {
  console.log('🏠 [HOME] طلب الصفحة الرئيسية');
  res.json({
    success: true,
    message: 'مرحباً بك في الخادم الواحد المحسن! 🎉',
    server: 'Single Optimized Server',
    port: PORT,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: `/api/health`,
      companies: `/api/companies`,
      login: `/api/companies/login`,
      dbTest: `/api/db-test`
    }
  });
});

// فحص صحة الخادم
app.get('/api/health', async (req, res) => {
  console.log('💚 [HEALTH] فحص حالة الخادم');
  
  const dbStatus = await testDatabase();
  
  res.json({
    success: true,
    message: 'الخادم يعمل بكفاءة عالية! 🚀',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      uptime: process.uptime() + ' ثانية',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      },
      database: {
        connected: dbStatus,
        status: dbStatus ? 'متصل ✅' : 'غير متصل ❌'
      }
    }
  });
});

// اختبار قاعدة البيانات
app.get('/api/db-test', async (req, res) => {
  console.log('🗄️ [DB-TEST] اختبار قاعدة البيانات');
  
  try {
    const result = await executeQuery('SELECT COUNT(*) as company_count FROM companies');
    const companyCount = result[0].company_count;
    
    res.json({
      success: true,
      message: 'قاعدة البيانات تعمل بشكل مثالي! ✅',
      data: {
        connected: true,
        companies_count: companyCount,
        test_time: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في قاعدة البيانات ❌',
      error: error.message
    });
  }
});

// جلب الشركات
app.get('/api/companies', async (req, res) => {
  try {
    console.log('🏢 [COMPANIES] جلب قائمة الشركات');
    
    const companies = await executeQuery(`
      SELECT id, name, email, status, created_at 
      FROM companies 
      WHERE status = 'active' 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`✅ [COMPANIES] تم جلب ${companies.length} شركة`);
    
    res.json({
      success: true,
      message: `تم جلب ${companies.length} شركة بنجاح`,
      data: companies,
      count: companies.length
    });
    
  } catch (error) {
    console.error('❌ [COMPANIES] خطأ:', error.message);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب الشركات',
      message: error.message
    });
  }
});

// تسجيل الدخول
app.post('/api/companies/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 [LOGIN] محاولة تسجيل الدخول:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'الإيميل وكلمة المرور مطلوبان'
      });
    }

    const companies = await executeQuery(
      'SELECT id, name, email, status FROM companies WHERE email = ? AND status = "active"',
      [email]
    );

    if (companies.length === 0) {
      console.log('❌ [LOGIN] شركة غير موجودة:', email);
      return res.status(401).json({
        success: false,
        message: 'بيانات تسجيل الدخول غير صحيحة'
      });
    }

    const company = companies[0];
    console.log('✅ [LOGIN] تم تسجيل الدخول بنجاح:', company.name);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح! 🎉',
      data: {
        id: company.id,
        name: company.name,
        email: company.email,
        token: 'auth_' + company.id + '_' + Date.now()
      }
    });

  } catch (error) {
    console.error('❌ [LOGIN] خطأ:', error.message);
    res.status(500).json({
      success: false,
      error: 'خطأ في تسجيل الدخول',
      message: error.message
    });
  }
});

// معالجة المسارات غير الموجودة
app.use((req, res) => {
  console.log('❌ [404] مسار غير موجود:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'المسار غير موجود 🔍',
    path: req.originalUrl,
    method: req.method,
    available_endpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/db-test',
      'GET /api/companies',
      'POST /api/companies/login'
    ]
  });
});

// تشغيل الخادم
const server = app.listen(PORT, async () => {
  console.log('🎉 ========================================');
  console.log('🎉 الخادم الواحد المحسن يعمل بنجاح!');
  console.log(`🎉 المنفذ: ${PORT}`);
  console.log(`🎉 الرابط: http://localhost:${PORT}`);
  console.log(`🎉 فحص الصحة: http://localhost:${PORT}/api/health`);
  console.log(`🎉 الشركات: http://localhost:${PORT}/api/companies`);
  console.log(`🎉 اختبار قاعدة البيانات: http://localhost:${PORT}/api/db-test`);
  console.log('🎉 ========================================');
  
  // اختبار قاعدة البيانات عند البدء
  console.log('🔍 اختبار قاعدة البيانات عند البدء...');
  await testDatabase();
});

// معالجة أخطاء الخادم
server.on('error', (error) => {
  console.error('💥 خطأ في تشغيل الخادم:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.error(`💥 المنفذ ${PORT} مستخدم بالفعل!`);
    console.log('💡 جرب منفذ آخر أو أوقف الخادم الآخر');
  }
});

// معالجة الأخطاء العامة
process.on('uncaughtException', (error) => {
  console.error('💥 [UNCAUGHT EXCEPTION]:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [UNHANDLED REJECTION]:', reason);
});

console.log('✅ تم إعداد معالجات الأخطاء');
