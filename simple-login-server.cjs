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

// فحص الصحة
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: '0 دقيقة',
      memory: '',
      database: ''
    }
  });
});

// تسجيل الدخول للشركة
app.post('/api/companies/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 [LOGIN] محاولة تسجيل الدخول:', email);
    console.log('🔐 [LOGIN] الخادم البسيط يعالج الطلب...');

    // التحقق من البيانات المطلوبة
    if (!email || !password) {
      console.log('❌ [LOGIN] بيانات ناقصة');
      return res.status(400).json({
        success: false,
        message: 'الإيميل وكلمة المرور مطلوبان'
      });
    }

    console.log('🔍 [LOGIN] البحث عن الشركة في قاعدة البيانات...');

    // البحث عن الشركة
    const companies = await executeQuery(
      'SELECT id, name, email, password_hash, status, subscription_status FROM companies WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (companies.length === 0) {
      console.log('❌ [LOGIN] الشركة غير موجودة');
      return res.status(401).json({
        success: false,
        message: 'الإيميل أو كلمة المرور غير صحيحة'
      });
    }

    const company = companies[0];
    console.log('✅ [LOGIN] تم العثور على الشركة:', company.name);

    // التحقق من كلمة المرور
    console.log('🔐 [LOGIN] التحقق من كلمة المرور...');
    const isPasswordValid = await bcrypt.compare(password, company.password_hash);

    if (!isPasswordValid) {
      console.log('❌ [LOGIN] كلمة المرور غير صحيحة');
      return res.status(401).json({
        success: false,
        message: 'الإيميل أو كلمة المرور غير صحيحة'
      });
    }

    console.log('✅ [LOGIN] كلمة المرور صحيحة');

    // التحقق من حالة الشركة
    if (company.status !== 'active') {
      console.log('❌ [LOGIN] الشركة غير نشطة');
      return res.status(403).json({
        success: false,
        message: 'حساب الشركة غير نشط'
      });
    }

    // إنشاء token
    const token = `auth_token_${company.id}_${Date.now()}`;

    // تحديث آخر تسجيل دخول
    await executeQuery(
      'UPDATE companies SET last_login_at = NOW() WHERE id = ?',
      [company.id]
    );

    console.log('✅ [LOGIN] تم تسجيل الدخول بنجاح');

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
    console.error('❌ [LOGIN] خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`🚀 الخادم البسيط يعمل على المنفذ ${PORT}`);
  console.log(`📡 API متاح على: http://localhost:${PORT}/api`);
  console.log(`🏥 فحص الصحة: http://localhost:${PORT}/api/health`);
});

process.on('uncaughtException', (error) => {
  console.error('❌ [UNCAUGHT EXCEPTION]:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [UNHANDLED REJECTION]:', reason);
});
