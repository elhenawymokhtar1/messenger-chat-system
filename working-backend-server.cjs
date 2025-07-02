// خادم خلفي بسيط يعمل بشكل مضمون
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3001;

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

// Logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// دالة الاتصال بقاعدة البيانات
async function executeQuery(query, params = []) {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    const [rows] = await connection.execute(query, params);
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

// Health check
app.get('/api/health', (req, res) => {
  console.log('💚 [HEALTH] فحص حالة الخادم');
  res.json({
    success: true,
    message: 'الخادم يعمل بشكل طبيعي',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'مرحباً بك في خادم إدارة المحادثات',
    endpoints: [
      'GET /api/health - فحص حالة الخادم',
      'GET /api/companies - جلب الشركات',
      'POST /api/companies/login - تسجيل الدخول'
    ]
  });
});

// جلب الشركات
app.get('/api/companies', async (req, res) => {
  try {
    console.log('🏢 [COMPANIES] جلب قائمة الشركات');
    const companies = await executeQuery('SELECT id, name, email, status FROM companies ORDER BY created_at DESC LIMIT 10');
    
    res.json({
      success: true,
      data: companies || [],
      count: companies ? companies.length : 0
    });
  } catch (error) {
    console.error('❌ [COMPANIES] خطأ في جلب الشركات:', error.message);
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

    // البحث عن الشركة
    const companies = await executeQuery(
      'SELECT id, name, email, status FROM companies WHERE email = ? AND status = "active"',
      [email]
    );

    if (companies.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'بيانات تسجيل الدخول غير صحيحة'
      });
    }

    const company = companies[0];
    console.log('✅ [LOGIN] تم تسجيل الدخول بنجاح:', company.name);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        id: company.id,
        name: company.name,
        email: company.email,
        token: 'simple_token_' + company.id
      }
    });

  } catch (error) {
    console.error('❌ [LOGIN] خطأ في تسجيل الدخول:', error.message);
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
    error: 'المسار غير موجود',
    path: req.originalUrl,
    method: req.method
  });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log(`🚀 الخادم الخلفي يعمل على المنفذ ${PORT}`);
  console.log(`📍 الرابط: http://localhost:${PORT}`);
  console.log(`🏥 فحص الصحة: http://localhost:${PORT}/api/health`);
  console.log(`🏢 الشركات: http://localhost:${PORT}/api/companies`);
  console.log('🚀 ========================================');
});

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
  console.error('❌ [UNCAUGHT EXCEPTION]:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [UNHANDLED REJECTION]:', reason);
});
