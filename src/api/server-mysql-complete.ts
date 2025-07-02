import { logger } from '../utils/logger';
#!/usr/bin/env node

/**
 * 🚀 خادم MySQL الكامل - يحل محل Supabase بالكامل
 * يدعم جميع APIs المطلوبة للواجهة الأمامية
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { testConnection, getDatabaseInfo, executeQuery } from '../config/mysql';

// تحميل متغيرات البيئة
dotenv.config();

logger.info('🔥🔥🔥 [SERVER] STARTING COMPLETE MYSQL SERVER! 🔥🔥🔥');

const app = express();
const PORT = 3002;

// اختبار الاتصال بقاعدة البيانات عند بدء التشغيل
testConnection().then(isConnected => {
  if (isConnected) {
    logger.info('✅ [DATABASE] اتصال MySQL نجح!');
    getDatabaseInfo().then(info => {
      logger.info(`📊 [DATABASE] ${info.version} - ${info.tablesCount} جدول`);
    });
  } else {
    console.error('❌ [DATABASE] فشل اتصال MySQL!');
  }
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware للتسجيل
app.use((req, res, next) => {
  logger.info(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ===================================
// 🔧 Health Check
// ===================================
app.get('/api/health', async (req, res) => {
  try {
    const isConnected = await testConnection();
    const dbInfo = await getDatabaseInfo();
    
    res.json({
      status: 'ok',
      database: {
        connected: isConnected,
        version: dbInfo.version,
        tables: dbInfo.tablesCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ===================================
// 🏢 Companies API
// ===================================
app.get('/api/companies', async (req, res) => {
  try {
    const companies = await executeQuery('SELECT * FROM companies ORDER BY created_at DESC');
    res.json({ success: true, data: companies });
  } catch (error) {
    console.error('❌ خطأ في جلب الشركات:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companies = await executeQuery('SELECT * FROM companies WHERE id = ?', [id]);

    if (companies.length === 0) {
      return res.status(404).json({ success: false, error: 'الشركة غير موجودة' });
    }

    res.json({ success: true, data: companies[0] });
  } catch (error) {
    console.error('❌ خطأ في جلب الشركة:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// 🏢 Company Registration & Auth API
// ===================================
app.post('/api/companies/register', async (req, res) => {
  try {
    logger.info('🏢 [COMPANY] تسجيل شركة جديدة...');
    logger.info('📝 [COMPANY] البيانات:', JSON.stringify(req.body, null, 2));

    const { name, email, password, phone, website, address, city, country } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'اسم الشركة والإيميل وكلمة المرور مطلوبة'
      });
    }

    // التحقق من صحة الإيميل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'صيغة الإيميل غير صحيحة'
      });
    }

    // التحقق من قوة كلمة المرور
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }

    // التحقق من عدم وجود الإيميل
    const existingCompanies = await executeQuery(
      'SELECT id FROM companies WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingCompanies.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'هذا الإيميل مسجل بالفعل'
      });
    }

    // تشفير كلمة المرور (بسيط للاختبار)
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 12);

    // إنشاء الشركة
    const companyId = crypto.randomUUID();
    await executeQuery(`
      INSERT INTO companies (
        id, name, email, password_hash, phone, website,
        address, city, country, is_verified, status,
        subscription_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'active', 'active', NOW(), NOW())
    `, [
      companyId, name, email.toLowerCase(), passwordHash,
      phone || null, website || null, address || null,
      city || null, country || 'Egypt'
    ]);

    // جلب الشركة المنشأة
    const newCompanies = await executeQuery(
      'SELECT * FROM companies WHERE id = ?',
      [companyId]
    );

    const newCompany = newCompanies[0];

    // إنشاء إعدادات Gemini افتراضية
    try {
      await executeQuery(`
        INSERT INTO gemini_settings (
          id, company_id, model, temperature, max_tokens,
          system_prompt, is_enabled, created_at, updated_at
        ) VALUES (?, ?, 'gemini-1.5-flash', 0.7, 1000,
          'أنت مساعد ذكي للرد على استفسارات العملاء. كن مفيداً ومهذباً.',
          FALSE, NOW(), NOW())
      `, [crypto.randomUUID(), companyId]);

      logger.info('✅ [COMPANY] تم إنشاء إعدادات Gemini افتراضية');
    } catch (geminiError) {
      logger.info('⚠️ [COMPANY] خطأ في إنشاء إعدادات Gemini:', geminiError.message);
    }

    // إنشاء متجر افتراضي
    try {
      await executeQuery(`
        INSERT INTO stores (
          id, company_id, name, slug, description,
          owner_email, currency, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'EGP', TRUE, NOW(), NOW())
      `, [
        crypto.randomUUID(), companyId, `متجر ${name}`,
        `store-${companyId.substring(0, 8)}`,
        `المتجر الإلكتروني لشركة ${name}`, email.toLowerCase()
      ]);

      logger.info('✅ [COMPANY] تم إنشاء متجر افتراضي');
    } catch (storeError) {
      logger.info('⚠️ [COMPANY] خطأ في إنشاء المتجر:', storeError.message);
    }

    logger.info(`✅ [COMPANY] تم تسجيل الشركة بنجاح: ${name}`);

    res.status(201).json({
      success: true,
      message: 'تم تسجيل الشركة بنجاح',
      company: {
        id: newCompany.id,
        name: newCompany.name,
        email: newCompany.email,
        phone: newCompany.phone,
        website: newCompany.website,
        address: newCompany.address,
        city: newCompany.city,
        country: newCompany.country,
        status: newCompany.status,
        created_at: newCompany.created_at
      }
    });

  } catch (error) {
    console.error('❌ [COMPANY] خطأ في تسجيل الشركة:', error);

    if (error.message.includes('duplicate') || error.message.includes('Duplicate')) {
      return res.status(409).json({
        success: false,
        error: 'الإيميل مستخدم بالفعل'
      });
    }

    res.status(500).json({
      success: false,
      error: 'فشل في تسجيل الشركة'
    });
  }
});

app.post('/api/companies/login', async (req, res) => {
  try {
    logger.info('🔐 [COMPANY] تسجيل دخول شركة...');

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'الإيميل وكلمة المرور مطلوبان'
      });
    }

    // البحث عن الشركة
    const companies = await executeQuery(
      'SELECT * FROM companies WHERE email = ?',
      [email.toLowerCase()]
    );

    if (companies.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'الإيميل أو كلمة المرور غير صحيحة'
      });
    }

    const company = companies[0];

    // التحقق من كلمة المرور
    const bcrypt = await import('bcrypt');
    const isValidPassword = await bcrypt.compare(password, company.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'الإيميل أو كلمة المرور غير صحيحة'
      });
    }

    // تحديث آخر تسجيل دخول
    await executeQuery(
      'UPDATE companies SET last_login_at = NOW() WHERE id = ?',
      [company.id]
    );

    logger.info(`✅ [COMPANY] تم تسجيل الدخول بنجاح: ${company.name}`);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        website: company.website,
        address: company.address,
        city: company.city,
        country: company.country,
        status: company.status,
        created_at: company.created_at
      }
    });

  } catch (error) {
    console.error('❌ [COMPANY] خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تسجيل الدخول'
    });
  }
});

// ===================================
// 📱 Facebook Settings API
// ===================================
app.get('/api/facebook/settings', async (req, res) => {
  try {
    const { company_id } = req.query;
    
    let query = 'SELECT * FROM facebook_settings';
    const params = [];
    
    if (company_id) {
      query += ' WHERE company_id = ?';
      params.push(company_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const settings = await executeQuery(query, params);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('❌ خطأ في جلب إعدادات فيسبوك:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/facebook/settings', async (req, res) => {
  try {
    const { company_id, page_id, page_name, access_token } = req.body;

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

    const result = await executeQuery(`
      INSERT INTO facebook_settings (id, company_id, page_id, page_name, access_token, is_active)
      VALUES (UUID(), ?, ?, ?, ?, TRUE)
    `, [company_id, page_id, page_name, access_token]);

    res.json({ success: true, message: 'تم حفظ إعدادات فيسبوك بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في حفظ إعدادات فيسبوك:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// حذف صفحة فيسبوك
app// TODO: Replace with MySQL API => {
  try {
    const { pageId } = req.params;

    const result = await executeQuery(`
      DELETE FROM facebook_settings WHERE page_id = ?
    `, [pageId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'الصفحة غير موجودة'
      });
    }

    res.json({ success: true, message: 'تم حذف الصفحة بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في حذف صفحة فيسبوك:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// 💬 Conversations API
// ===================================
app.get('/api/conversations', async (req, res) => {
  try {
    const { company_id } = req.query;
    
    let query = `
      SELECT c.*, f.page_name 
      FROM conversations c
      LEFT JOIN facebook_settings f ON c.facebook_page_id = f.page_id
    `;
    const params = [];
    
    if (company_id) {
      query += ' WHERE c.company_id = ?';
      params.push(company_id);
    }
    
    query += ' ORDER BY c.last_message_at DESC';
    
    const conversations = await executeQuery(query, params);
    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('❌ خطأ في جلب المحادثات:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conversations = await executeQuery('SELECT * FROM conversations WHERE id = ?', [id]);
    
    if (conversations.length === 0) {
      return res.status(404).json({ success: false, error: 'المحادثة غير موجودة' });
    }
    
    res.json({ success: true, data: conversations[0] });
  } catch (error) {
    console.error('❌ خطأ في جلب المحادثة:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// 💌 Messages API
// ===================================
app.get('/api/messages', async (req, res) => {
  try {
    const { conversation_id, company_id, limit = 50 } = req.query;
    
    let query = `
      SELECT m.*, c.user_name 
      FROM messages m
      LEFT JOIN conversations c ON m.conversation_id = c.id
    `;
    const params = [];
    const conditions = [];
    
    if (conversation_id) {
      conditions.push('m.conversation_id = ?');
      params.push(conversation_id);
    }
    
    if (company_id) {
      conditions.push('m.company_id = ?');
      params.push(company_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY m.sent_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const messages = await executeQuery(query, params);
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('❌ خطأ في جلب الرسائل:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { 
      conversation_id, 
      company_id, 
      message_text, 
      direction = 'outgoing',
      message_type = 'text'
    } = req.body;
    
    const result = await executeQuery(`
      INSERT INTO messages (
        id, conversation_id, company_id, message_text, 
        direction, message_type, sent_at
      ) VALUES (UUID(), ?, ?, ?, ?, ?, NOW())
    `, [conversation_id, company_id, message_text, direction, message_type]);
    
    res.json({ success: true, message: 'تم إرسال الرسالة بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في إرسال الرسالة:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// 🤖 Gemini Settings API
// ===================================
app.get('/api/gemini/settings', async (req, res) => {
  try {
    const { company_id } = req.query;
    
    let query = 'SELECT * FROM gemini_settings';
    const params = [];
    
    if (company_id) {
      query += ' WHERE company_id = ?';
      params.push(company_id);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 1';
    
    const settings = await executeQuery(query, params);
    res.json({ 
      success: true, 
      data: settings.length > 0 ? settings[0] : null 
    });
  } catch (error) {
    console.error('❌ خطأ في جلب إعدادات Gemini:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/gemini/settings', async (req, res) => {
  try {
    const { 
      company_id, 
      api_key, 
      model = 'gemini-1.5-flash',
      temperature = 0.7,
      max_tokens = 1000,
      system_prompt,
      is_enabled = true
    } = req.body;
    
    // تحديث أو إدراج
    const existing = await executeQuery(
      'SELECT id FROM gemini_settings WHERE company_id = ?', 
      [company_id]
    );
    
    if (existing.length > 0) {
      await executeQuery(`
        UPDATE gemini_settings 
        SET api_key = ?, model = ?, temperature = ?, max_tokens = ?, 
            system_prompt = ?, is_enabled = ?, updated_at = NOW()
        WHERE company_id = ?
      `, [api_key, model, temperature, max_tokens, system_prompt, is_enabled, company_id]);
    } else {
      await executeQuery(`
        INSERT INTO gemini_settings (
          id, company_id, api_key, model, temperature, max_tokens, 
          system_prompt, is_enabled
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)
      `, [company_id, api_key, model, temperature, max_tokens, system_prompt, is_enabled]);
    }
    
    res.json({ success: true, message: 'تم حفظ إعدادات Gemini بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في حفظ إعدادات Gemini:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// 📊 Analytics API
// ===================================
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const { company_id } = req.query;
    
    const stats = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM conversations WHERE company_id = ?) as total_conversations,
        (SELECT COUNT(*) FROM messages WHERE company_id = ?) as total_messages,
        (SELECT COUNT(*) FROM messages WHERE company_id = ? AND direction = 'incoming') as incoming_messages,
        (SELECT COUNT(*) FROM messages WHERE company_id = ? AND direction = 'outgoing') as outgoing_messages,
        (SELECT COUNT(*) FROM facebook_settings WHERE company_id = ?) as facebook_pages
    `, [company_id, company_id, company_id, company_id, company_id]);
    
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('❌ خطأ في جلب الإحصائيات:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// 🏪 Store API (أساسي)
// ===================================
app.get('/api/stores', async (req, res) => {
  try {
    const { company_id } = req.query;
    
    let query = 'SELECT * FROM stores';
    const params = [];
    
    if (company_id) {
      query += ' WHERE company_id = ?';
      params.push(company_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stores = await executeQuery(query, params);
    res.json({ success: true, data: stores });
  } catch (error) {
    console.error('❌ خطأ في جلب المتاجر:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// 📦 Products API (أساسي)
// ===================================
app.get('/api/products', async (req, res) => {
  try {
    const { store_id } = req.query;
    
    let query = 'SELECT * FROM products';
    const params = [];
    
    if (store_id) {
      query += ' WHERE store_id = ?';
      params.push(store_id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const products = await executeQuery(query, params);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('❌ خطأ في جلب المنتجات:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===================================
// 🚀 Root endpoint
// ===================================
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Complete MySQL API Server',
    version: '1.0.0',
    database: 'MySQL',
    endpoints: {
      health: '/api/health',
      companies: '/api/companies',
      facebook: '/api/facebook/settings',
      conversations: '/api/conversations',
      messages: '/api/messages',
      gemini: '/api/gemini/settings',
      analytics: '/api/analytics/overview',
      stores: '/api/stores',
      products: '/api/products'
    }
  });
});

// ===================================
// 🚀 Start Server
// ===================================
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Complete MySQL API Server started on port ${PORT}`);
  logger.info(`📡 Available at: http://localhost:${PORT}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`📊 API endpoints: http://localhost:${PORT}/`);
  logger.info('');
  logger.info('✅ جميع APIs متصلة بـ MySQL');
  logger.info('🎯 جاهز لاستقبال طلبات الواجهة الأمامية');
});

export default app;
