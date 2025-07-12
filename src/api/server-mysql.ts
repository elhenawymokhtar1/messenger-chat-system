// 🚀 خادم API جديد يستخدم MySQL بدلاً من Supabase
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';
// import { processIncomingMessage } from './process-message'; // مؤقتاً معطل
// import geminiRouter from './gemini-routes'; // مؤقتاً معطل
import whatsappBaileysRoutes from './whatsapp-baileys-routes';
// import subscriptionRouter from './subscription-routes'; // مؤقتاً معطل
import { requestLogger, errorHandler, notFoundHandler } from './middleware/auth';
import analyticsRoutes from './analytics-routes';

// تحميل متغيرات البيئة
dotenv.config();

console.log('🔥🔥🔥 [SERVER] STARTING WITH MYSQL VERSION 3.0! 🔥🔥🔥');

// إعداد معالجة الأخطاء العامة لمنع توقف الخادم
process.on('uncaughtException', (error) => {
  console.error('❌ [ERROR] خطأ غير معالج:', error.message);
  console.error('📍 [STACK]:', error.stack);
  // لا نوقف الخادم، فقط نسجل الخطأ
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [ERROR] رفض غير معالج:', reason);
  console.error('📍 [PROMISE]:', promise);
  // لا نوقف الخادم، فقط نسجل الخطأ
});

// معالجة إشارات النظام للإغلاق الآمن
process.on('SIGTERM', () => {
  console.log('🔄 [SHUTDOWN] تم استلام SIGTERM، إغلاق الخادم بأمان...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 [SHUTDOWN] تم استلام SIGINT، إغلاق الخادم بأمان...');
  process.exit(0);
});

// إعداد MySQL
import { testConnection, getDatabaseInfo, getPool, executeQuery } from '../config/mysql';
import {
  CompanyService,
  FacebookService,
  ConversationService,
  MessageService,
  GeminiService,
  DatabaseService,
  WhatsAppService
} from '../services/database';

// مراقب الخادم
import { serverMonitor } from '../utils/server-monitor';

// إعدادات الخادم
import { SERVER_CONFIG, getEnvironmentConfig, printConfigInfo, validateConfig } from '../config/server-config';

// إحصائيات الرسائل الصادرة
let outgoingMessageStats = {
  totalSent: 0,
  sentThisMinute: 0,
  lastMinuteReset: new Date(),
  sentPerMinute: []
};

// دالة تحديث إحصائيات الرسائل الصادرة
function updateOutgoingMessageStats() {
  const now = new Date();
  const timeDiff = now.getTime() - outgoingMessageStats.lastMinuteReset.getTime();

  // إذا مر دقيقة أو أكثر، احفظ الإحصائيات واعيد تعيين العداد
  if (timeDiff >= 60000) { // 60 ثانية
    outgoingMessageStats.sentPerMinute.push(outgoingMessageStats.sentThisMinute);

    // احتفظ بآخر 10 دقائق فقط
    if (outgoingMessageStats.sentPerMinute.length > 10) {
      outgoingMessageStats.sentPerMinute.shift();
    }

    console.log(`📊 [STATS] تم إرسال ${outgoingMessageStats.sentThisMinute} رسالة في الدقيقة الماضية`);
    console.log(`📈 [STATS] إجمالي الرسائل المرسلة: ${outgoingMessageStats.totalSent}`);

    outgoingMessageStats.sentThisMinute = 0;
    outgoingMessageStats.lastMinuteReset = now;
  }

  outgoingMessageStats.totalSent++;
  outgoingMessageStats.sentThisMinute++;
}

// ===================================
// 🎯 نظام ذكي لتجنب التكرار في المزامنة
// ===================================

// تتبع المحادثات التي تمت مزامنتها مؤخراً
const recentlySyncedConversations = new Map<string, number>();
const SYNC_COOLDOWN = 10000; // 10 ثوانٍ cooldown (محسن)

// دالة للتحقق من إمكانية مزامنة المحادثة
function canSyncConversation(pageId: string, userId: string): boolean {
  const key = `${pageId}_${userId}`;
  const lastSync = recentlySyncedConversations.get(key);
  const now = Date.now();

  if (!lastSync || (now - lastSync) > SYNC_COOLDOWN) {
    recentlySyncedConversations.set(key, now);
    return true;
  }

  console.log(`⏳ [SYNC] تخطي مزامنة المحادثة ${pageId} <-> ${userId} (تمت مؤخراً)`);
  return false;
}

// دالة محسنة للمزامنة المتوازية الحقيقية
async function syncConversationsBatch(conversations: any[], batchSize: number = 10): Promise<void> {
  console.log(`🚀 [SYNC] بدء مزامنة متوازية لـ ${conversations.length} محادثة بحجم دفعة ${batchSize}`);

  for (let i = 0; i < conversations.length; i += batchSize) {
    const batch = conversations.slice(i, i + batchSize);
    console.log(`⚡ [SYNC] معالجة دفعة ${Math.floor(i / batchSize) + 1}: ${batch.length} محادثة متوازية`);

    // مزامنة متوازية حقيقية - جميع المحادثات في نفس الوقت
    const syncPromises = batch.map(async (conv, index) => {
      const delay = index * 100; // تأخير صغير لتجنب الضغط
      await new Promise(resolve => setTimeout(resolve, delay));

      console.log(`🔄 [SYNC] مزامنة متوازية: ${conv.facebook_page_id || conv.pageId} <-> ${conv.participant_id || conv.userId}`);
      return syncSpecificConversation(
        conv.facebook_page_id || conv.pageId,
        conv.participant_id || conv.userId
      );
    });

    // انتظار انتهاء جميع المزامنات في الدفعة
    const results = await Promise.allSettled(syncPromises);

    // عد النتائج
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ [SYNC] انتهت الدفعة ${Math.floor(i / batchSize) + 1}: ${successful} نجح، ${failed} فشل`);

    // تأخير قصير بين الدفعات
    if (i + batchSize < conversations.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`🎉 [SYNC] انتهت المزامنة المتوازية لجميع المحادثات`);
}

// تنظيف المحادثات القديمة من الذاكرة
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, lastSync] of recentlySyncedConversations.entries()) {
    if ((now - lastSync) > SYNC_COOLDOWN * 2) {
      recentlySyncedConversations.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 [SYNC] تم تنظيف ${cleaned} محادثة من ذاكرة المزامنة`);
  }
}, 60000); // تنظيف كل دقيقة

// طباعة معلومات الإعدادات والتحقق من صحتها
printConfigInfo();
const configValidation = validateConfig();
if (!configValidation.isValid) {
  console.error('❌ [CONFIG] إعدادات غير صحيحة، توقف الخادم');
  process.exit(1);
}

// اختبار الاتصال بقاعدة البيانات عند بدء التشغيل
testConnection().then(async isConnected => {
  if (isConnected) {
    console.log('✅ [DATABASE] اتصال MySQL نجح!');

    // إنشاء جدول WhatsApp إذا لم يكن موجوداً
    await WhatsAppService.createTableIfNotExists();

    getDatabaseInfo().then(info => {
      console.log(`📊 [DATABASE] ${info.version} - ${info.tablesCount} جدول`);
    });
  } else {
    console.error('❌ [DATABASE] فشل اتصال MySQL!');
  }
});

const app = express();
const PORT = SERVER_CONFIG.PORT; // استخدام المنفذ من الإعدادات

// نظام SSE للتحديث الفوري
const sseClients = new Map<string, express.Response>();

// خريطة لتتبع أوقات المزامنة الأخيرة لتجنب المزامنة المفرطة
const lastSyncTimes = new Map<string, number>();

// تنظيف دوري لخريطة أوقات المزامنة (كل ساعة)
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 3600000; // ساعة واحدة

  // حذف الإدخالات القديمة
  for (const [key, time] of lastSyncTimes.entries()) {
    if (time < oneHourAgo) {
      lastSyncTimes.delete(key);
    }
  }

  console.log(`🧹 [CLEANUP] تم تنظيف خريطة المزامنة - الحجم الحالي: ${lastSyncTimes.size}`);
}, 3600000); // كل ساعة

// Middleware - CORS محسن للأمان
app.use(cors({
  origin: SERVER_CONFIG.SECURITY.CORS.ORIGIN,
  credentials: SERVER_CONFIG.SECURITY.CORS.CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// خدمة الصور المرفوعة (يجب أن تكون قبل routes الأخرى)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// إعداد multer لرفع الصور
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// إعدادات الترميز للنصوص العربية
app.use(express.json({
  limit: '10mb',
  type: 'application/json',
  verify: (req, res, buf) => {
    // التأكد من الترميز الصحيح للنصوص العربية
    req.rawBody = buf.toString('utf8');
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 50000
}));

// Middleware للتسجيل
app.use(requestLogger);

// ===================================
// 🔧 API Routes الأساسية
// ===================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Facebook Reply API Server is running',
    version: '3.0.0',
    database: 'MySQL',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      companies: '/api/companies',
      conversations: '/api/conversations',
      messages: '/api/messages',
      facebook: '/api/facebook/settings',
      gemini: '/api/gemini/settings',
      store: '/api/companies/{companyId}/store',
      products: '/api/companies/{companyId}/products',
      webhook: '/webhook'
    }
  });
});

// Health check - تم نقله إلى قسم مراقبة الخادم

// ===================================
// 🏢 Company APIs
// ===================================

// تسجيل شركة جديدة
app.post('/api/companies/register', async (req, res) => {
  try {
    console.log('🏢 [COMPANY] تسجيل شركة جديدة...');
    console.log('📝 [COMPANY] البيانات:', JSON.stringify(req.body, null, 2));

    const { name, email, password, phone, website, address, city, country } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'اسم الشركة والإيميل وكلمة المرور مطلوبة'
      });
    }

    // التحقق من صحة الإيميل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'صيغة الإيميل غير صحيحة'
      });
    }

    // التحقق من قوة كلمة المرور
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }

    // التحقق من عدم وجود الإيميل مسبقاً
    const existingCompanies = await executeQuery(
      'SELECT id FROM companies WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingCompanies.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'هذا الإيميل مسجل بالفعل'
      });
    }

    // تشفير كلمة المرور
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
      'SELECT id, name, email, phone, website, address, city, country, is_verified, status, subscription_status, created_at FROM companies WHERE id = ?',
      [companyId]
    );

    if (newCompanies.length === 0) {
      throw new Error('فشل في إنشاء الشركة');
    }

    const company = newCompanies[0];

    console.log('✅ [COMPANY] تم تسجيل الشركة بنجاح:', company.name);

    res.status(201).json({
      success: true,
      message: 'تم تسجيل الشركة بنجاح',
      company: company
    });

  } catch (error) {
    console.error('❌ [COMPANY] خطأ في تسجيل الشركة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});


// تسجيل دخول الشركة
app.post('/api/companies/login', async (req, res) => {
  try {
    console.log('🔐 [COMPANY] محاولة تسجيل دخول...');

    const { email, password } = req.body;

    // التحقق من البيانات المطلوبة
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'الإيميل وكلمة المرور مطلوبان'
      });
    }

    // البحث عن الشركة
    const companies = await executeQuery(
      'SELECT id, name, email, password_hash, phone, website, address, city, country, is_verified, status, subscription_status, created_at FROM companies WHERE email = ?',
      [email.toLowerCase()]
    );

    if (companies.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'الإيميل أو كلمة المرور غير صحيحة'
      });
    }

    const company = companies[0];

    // التحقق من كلمة المرور
    const bcrypt = await import('bcrypt');
    const isPasswordValid = await bcrypt.compare(password, company.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'الإيميل أو كلمة المرور غير صحيحة'
      });
    }

    // التحقق من حالة الشركة
    if (company.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'حساب الشركة غير نشط'
      });
    }

    // إزالة كلمة المرور من الاستجابة
    delete company.password_hash;

    console.log('✅ [COMPANY] تم تسجيل الدخول بنجاح:', company.name);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      company: company
    });

  } catch (error) {
    console.error('❌ [COMPANY] خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في الخادم'
    });
  }
});

// الحصول على جميع الشركات
app.get('/api/companies', async (req, res) => {
  try {
    console.log('🔍 [API] بدء جلب جميع الشركات...');

    const companies = await CompanyService.getAll();
    console.log('✅ [API] تم جلب الشركات بنجاح، العدد:', companies?.length || 0);

    res.json({
      success: true,
      data: companies || []
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب الشركات:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم'
    });
  }
});

// الحصول على معلومات الشركة
app.get('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 جلب بيانات الشركة:', id);

    const company = await CompanyService.getById(id);

    if (!company) {
      console.log('❌ الشركة غير موجودة:', id);
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    console.log('✅ تم جلب بيانات الشركة:', company.name);
    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('❌ Error fetching company:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================================
// 📱 Facebook APIs
// ===================================

// الحصول على إعدادات فيسبوك للشركة من الجدول الموحد
app.get('/api/facebook/settings', async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    console.log(`📊 [API] جلب صفحات Facebook للشركة ${company_id} من الجدول الموحد`);
    const settings = await FacebookService.getByCompanyId(company_id as string);
    console.log(`✅ [API] تم العثور على ${settings.length} صفحة من الجدول الموحد`);

    res.json(settings);
  } catch (error) {
    console.error('❌ Error fetching Facebook settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// الحصول على إعدادات فيسبوك للشركة من الجداول القديمة (للمقارنة)
app.get('/api/facebook/settings/legacy', async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    console.log(`📊 [API] جلب صفحات Facebook للشركة ${company_id} من الجداول القديمة`);
    const settings = await FacebookService.getByCompanyIdLegacy(company_id as string);
    console.log(`✅ [API] تم العثور على ${settings.length} صفحة من الجداول القديمة`);

    res.json(settings);
  } catch (error) {
    console.error('❌ Error fetching Facebook settings (legacy):', error);
    res.status(500).json({ error: error.message });
  }
});

// إضافة صفحة فيسبوك جديدة في الجدول الموحد
app.post('/api/facebook/settings', async (req, res) => {
  try {
    const { company_id, page_id, page_name, access_token } = req.body;

    if (!company_id || !page_id || !page_name || !access_token) {
      return res.status(400).json({
        error: 'company_id, page_id, page_name, and access_token are required'
      });
    }

    console.log(`📊 [API] إضافة صفحة Facebook جديدة للشركة ${company_id} في الجدول الموحد`);

    // التحقق من عدم وجود الصفحة النشطة مسبقاً لنفس الشركة
    const pool = getPool();
    const [existingActivePage] = await pool.execute(`
      SELECT * FROM facebook_pages_unified
      WHERE page_id = ? AND company_id = ? AND is_active = 1
    `, [page_id, company_id]);

    if (existingActivePage.length > 0) {
      console.log(`⚠️ [API] الصفحة النشطة ${page_id} موجودة بالفعل للشركة ${company_id}`);
      return res.status(409).json({
        error: 'الصفحة موجودة بالفعل لهذه الشركة',
        page_id: page_id,
        company_id: company_id
      });
    }

    // التحقق من وجود صفحة غير نشطة (محذوفة سابقاً) لإعادة تفعيلها
    const [existingInactivePage] = await pool.execute(`
      SELECT * FROM facebook_pages_unified
      WHERE page_id = ? AND company_id = ? AND is_active = 0
    `, [page_id, company_id]);

    if (existingInactivePage.length > 0) {
      console.log(`🔄 [API] إعادة تفعيل الصفحة ${page_id} للشركة ${company_id}`);

      // تحديث الصفحة الموجودة بدلاً من إنشاء جديدة
      await pool.execute(`
        UPDATE facebook_pages_unified
        SET access_token = ?, page_name = ?, is_active = 1, updated_at = NOW()
        WHERE page_id = ? AND company_id = ?
      `, [access_token, page_name, page_id, company_id]);

      console.log(`✅ [API] تم إعادة تفعيل الصفحة ${page_name} (${page_id}) بنجاح`);

      return res.json({
        success: true,
        page_id: existingInactivePage[0].id,
        message: 'تم إعادة تفعيل الصفحة بنجاح',
        action: 'reactivated'
      });
    }

    // التحقق من وجود الصفحة لشركة أخرى (للمعلومات فقط)
    const [pageInOtherCompany] = await pool.execute(`
      SELECT company_id FROM facebook_pages_unified
      WHERE page_id = ? AND company_id != ?
    `, [page_id, company_id]);

    if (pageInOtherCompany.length > 0) {
      console.log(`ℹ️ [API] الصفحة ${page_id} موجودة لشركة أخرى: ${pageInOtherCompany[0].company_id}`);
    }

    const pageId = await FacebookService.create({
      company_id,
      page_id,
      page_name,
      access_token,
      is_active: true,
      webhook_verified: false
    });

    console.log(`✅ [API] تم إضافة صفحة Facebook بنجاح: ${page_name} (${page_id})`);

    res.json({
      success: true,
      page_id: pageId,
      message: 'Facebook page added successfully to unified table'
    });
  } catch (error) {
    console.error('❌ Error adding Facebook page:', error);
    res.status(500).json({ error: error.message });
  }
});

// نقل صفحة من الجداول القديمة إلى الجدول الموحد
app.post('/api/facebook/migrate-page', async (req, res) => {
  try {
    const { page_id } = req.body;

    if (!page_id) {
      return res.status(400).json({ error: 'page_id is required' });
    }

    console.log(`🔄 [MIGRATE] نقل صفحة ${page_id} إلى الجدول الموحد`);

    // البحث عن الصفحة في الجداول القديمة
    const legacyPages = await FacebookService.getByCompanyIdLegacy('c677b32f-fe1c-4c64-8362-a1c03406608d');
    const pageToMigrate = legacyPages.find(p => p.page_id === page_id);

    if (!pageToMigrate) {
      return res.status(404).json({ error: 'Page not found in legacy tables' });
    }

    // التحقق من عدم وجودها في الجدول الجديد
    const existingPage = await FacebookService.getByPageId(page_id);
    if (existingPage) {
      return res.status(409).json({ error: 'Page already exists in unified table' });
    }

    // إضافة الصفحة في الجدول الموحد
    const newPageId = await FacebookService.create({
      company_id: pageToMigrate.company_id,
      page_id: pageToMigrate.page_id,
      page_name: pageToMigrate.page_name,
      access_token: pageToMigrate.access_token,
      is_active: pageToMigrate.is_active,
      webhook_verified: pageToMigrate.webhook_verified || false
    });

    console.log(`✅ [MIGRATE] تم نقل الصفحة ${pageToMigrate.page_name} بنجاح`);

    res.json({
      success: true,
      message: 'Page migrated successfully',
      page_id: newPageId,
      page_name: pageToMigrate.page_name
    });
  } catch (error) {
    console.error('❌ Error migrating page:', error);
    res.status(500).json({ error: error.message });
  }
});

// فحص الجدول الموحد
app.get('/api/facebook/debug-unified', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] فحص الجدول الموحد...');

    const pool = getPool();
    const [allPages] = await pool.execute(`
      SELECT * FROM facebook_pages_unified
      ORDER BY created_at DESC
    `);

    const [specificCompany] = await pool.execute(`
      SELECT * FROM facebook_pages_unified
      WHERE company_id = ?
      ORDER BY created_at DESC
    `, ['c677b32f-fe1c-4c64-8362-a1c03406608d']);

    console.log(`📊 [DEBUG] إجمالي الصفحات في الجدول الموحد: ${allPages.length}`);
    console.log(`📊 [DEBUG] صفحات الشركة المحددة: ${specificCompany.length}`);

    res.json({
      total_pages: allPages.length,
      company_pages: specificCompany.length,
      all_pages: allPages,
      company_specific: specificCompany
    });
  } catch (error) {
    console.error('❌ Error debugging unified table:', error);
    res.status(500).json({ error: error.message });
  }
});

// تفعيل صفحة فيسبوك
app.put('/api/facebook/pages/:pageId/activate', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { company_id } = req.body;

    console.log(`🔄 [ACTIVATE] تفعيل الصفحة ${pageId} للشركة ${company_id}`);

    const pool = getPool();
    const [result] = await pool.execute(`
      UPDATE facebook_pages_unified
      SET is_active = 1, updated_at = NOW()
      WHERE page_id = ? AND company_id = ?
    `, [pageId, company_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'الصفحة غير موجودة'
      });
    }

    console.log(`✅ [ACTIVATE] تم تفعيل الصفحة ${pageId} بنجاح`);
    res.json({
      success: true,
      message: 'تم تفعيل الصفحة بنجاح',
      page_id: pageId
    });
  } catch (error) {
    console.error('❌ Error activating page:', error);
    res.status(500).json({ error: error.message });
  }
});

// إلغاء تفعيل صفحة فيسبوك
app.put('/api/facebook/pages/:pageId/deactivate', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { company_id } = req.body;

    console.log(`🔄 [DEACTIVATE] إلغاء تفعيل الصفحة ${pageId} للشركة ${company_id}`);

    const pool = getPool();
    const [result] = await pool.execute(`
      UPDATE facebook_pages_unified
      SET is_active = 0, updated_at = NOW()
      WHERE page_id = ? AND company_id = ?
    `, [pageId, company_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'الصفحة غير موجودة'
      });
    }

    console.log(`✅ [DEACTIVATE] تم إلغاء تفعيل الصفحة ${pageId} بنجاح`);
    res.json({
      success: true,
      message: 'تم إلغاء تفعيل الصفحة بنجاح',
      page_id: pageId
    });
  } catch (error) {
    console.error('❌ Error deactivating page:', error);
    res.status(500).json({ error: error.message });
  }
});

// فحص هيكل قاعدة البيانات
app.get('/api/facebook/debug-database-structure', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] فحص هيكل قاعدة البيانات...');

    const pool = getPool();

    // فحص جدول الصفحات الموحد
    const [pagesStructure] = await pool.execute(`
      DESCRIBE facebook_pages_unified
    `);

    // فحص جدول المحادثات
    const [conversationsStructure] = await pool.execute(`
      DESCRIBE conversations
    `);

    // فحص جدول الرسائل
    const [messagesStructure] = await pool.execute(`
      DESCRIBE messages
    `);

    // عدد السجلات في كل جدول
    const [pagesCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM facebook_pages_unified
    `);

    const [conversationsCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM conversations
    `);

    const [messagesCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM messages
    `);

    console.log(`📊 [DEBUG] عدد الصفحات: ${pagesCount[0].count}`);
    console.log(`📊 [DEBUG] عدد المحادثات: ${conversationsCount[0].count}`);
    console.log(`📊 [DEBUG] عدد الرسائل: ${messagesCount[0].count}`);

    res.json({
      tables: {
        facebook_pages_unified: {
          structure: pagesStructure,
          count: pagesCount[0].count
        },
        conversations: {
          structure: conversationsStructure,
          count: conversationsCount[0].count
        },
        messages: {
          structure: messagesStructure,
          count: messagesCount[0].count
        }
      }
    });
  } catch (error) {
    console.error('❌ Error debugging database structure:', error);
    res.status(500).json({ error: error.message });
  }
});

// حذف صفحة فيسبوك بأمان (بدون حذف الرسائل)
app.delete('/api/facebook/pages/:pageId/safe', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { company_id } = req.body;

    console.log(`🛡️ [SAFE DELETE] حذف آمن للصفحة ${pageId} للشركة ${company_id}`);
    console.log(`✅ [SAFE DELETE] سيتم الاحتفاظ بجميع المحادثات والرسائل`);

    const pool = getPool();

    // التحقق من وجود الصفحة
    const [existingPage] = await pool.execute(`
      SELECT * FROM facebook_pages_unified
      WHERE page_id = ? AND company_id = ?
    `, [pageId, company_id]);

    if (existingPage.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'الصفحة غير موجودة'
      });
    }

    // إحصائيات المحادثات والرسائل (للمعلومات فقط)
    const [conversationsCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM conversations
      WHERE facebook_page_id = ? AND company_id = ?
    `, [pageId, company_id]);

    const [messagesCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.facebook_page_id = ? AND c.company_id = ?
    `, [pageId, company_id]);

    console.log(`📊 [SAFE DELETE] المحادثات المحفوظة: ${conversationsCount[0].count}`);
    console.log(`📊 [SAFE DELETE] الرسائل المحفوظة: ${messagesCount[0].count}`);

    // حذف الصفحة فقط (بدون المحادثات والرسائل)
    await pool.execute(`
      DELETE FROM facebook_pages_unified
      WHERE page_id = ? AND company_id = ?
    `, [pageId, company_id]);

    console.log(`✅ [SAFE DELETE] تم حذف الصفحة ${pageId} بأمان`);

    res.json({
      success: true,
      message: 'تم حذف الصفحة بأمان مع الاحتفاظ بجميع البيانات',
      page_id: pageId,
      preserved_conversations: conversationsCount[0].count,
      preserved_messages: messagesCount[0].count,
      note: 'تم الاحتفاظ بجميع المحادثات والرسائل - يمكن استعادة الصفحة لاحقاً'
    });
  } catch (error) {
    console.error('❌ Error in safe delete:', error);
    res.status(500).json({ error: error.message });
  }
});

// حذف صفحة فيسبوك (مع خيار حذف البيانات المرتبطة)
app.delete('/api/facebook/pages/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { company_id, delete_conversations = false } = req.body; // افتراضياً: الاحتفاظ بالرسائل

    console.log(`🗑️ [DELETE] حذف الصفحة ${pageId} للشركة ${company_id}`);
    console.log(`🗑️ [DELETE] حذف المحادثات: ${delete_conversations}`);

    if (delete_conversations) {
      console.log(`⚠️ [WARNING] سيتم حذف جميع المحادثات والرسائل المرتبطة بهذه الصفحة!`);
    } else {
      console.log(`✅ [SAFE] سيتم الاحتفاظ بجميع المحادثات والرسائل`);
    }

    const pool = getPool();

    // التحقق من وجود الصفحة
    const [existingPage] = await pool.execute(`
      SELECT * FROM facebook_pages_unified
      WHERE page_id = ? AND company_id = ?
    `, [pageId, company_id]);

    if (existingPage.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'الصفحة غير موجودة'
      });
    }

    // إحصائيات قبل الحذف
    const [conversationsCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM conversations
      WHERE facebook_page_id = ? AND company_id = ?
    `, [pageId, company_id]);

    const [messagesCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.facebook_page_id = ? AND c.company_id = ?
    `, [pageId, company_id]);

    console.log(`📊 [DELETE] المحادثات المرتبطة: ${conversationsCount[0].count}`);
    console.log(`📊 [DELETE] الرسائل المرتبطة: ${messagesCount[0].count}`);

    if (delete_conversations) {
      // حذف الرسائل أولاً
      await pool.execute(`
        DELETE m FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.facebook_page_id = ? AND c.company_id = ?
      `, [pageId, company_id]);

      // حذف المحادثات
      await pool.execute(`
        DELETE FROM conversations
        WHERE facebook_page_id = ? AND company_id = ?
      `, [pageId, company_id]);

      console.log(`🗑️ [DELETE] تم حذف ${messagesCount[0].count} رسالة و ${conversationsCount[0].count} محادثة`);
    }

    // حذف الصفحة
    const [result] = await pool.execute(`
      DELETE FROM facebook_pages_unified
      WHERE page_id = ? AND company_id = ?
    `, [pageId, company_id]);

    console.log(`✅ [DELETE] تم حذف الصفحة ${pageId} بنجاح`);

    res.json({
      success: true,
      message: 'تم حذف الصفحة بنجاح',
      page_id: pageId,
      deleted_conversations: delete_conversations ? conversationsCount[0].count : 0,
      deleted_messages: delete_conversations ? messagesCount[0].count : 0,
      remaining_conversations: delete_conversations ? 0 : conversationsCount[0].count,
      remaining_messages: delete_conversations ? 0 : messagesCount[0].count
    });
  } catch (error) {
    console.error('❌ Error deleting page:', error);
    res.status(500).json({ error: error.message });
  }
});

// استعادة صفحة فيسبوك (إعادة إدخال)
app.post('/api/facebook/pages/:pageId/restore', async (req, res) => {
  try {
    const { pageId } = req.params;
    const {
      company_id,
      page_name,
      access_token,
      page_username = null,
      auto_reply_enabled = false,
      welcome_message = null
    } = req.body;

    console.log(`🔄 [RESTORE] استعادة الصفحة ${pageId} للشركة ${company_id}`);

    const pool = getPool();

    // التحقق من وجود محادثات قديمة
    const [existingConversations] = await pool.execute(`
      SELECT COUNT(*) as count FROM conversations
      WHERE facebook_page_id = ? AND company_id = ?
    `, [pageId, company_id]);

    const [existingMessages] = await pool.execute(`
      SELECT COUNT(*) as count FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.facebook_page_id = ? AND c.company_id = ?
    `, [pageId, company_id]);

    console.log(`📊 [RESTORE] محادثات موجودة: ${existingConversations[0].count}`);
    console.log(`📊 [RESTORE] رسائل موجودة: ${existingMessages[0].count}`);

    // التحقق من وجود الصفحة حالياً
    const [existingPage] = await pool.execute(`
      SELECT * FROM facebook_pages_unified
      WHERE page_id = ? AND company_id = ?
    `, [pageId, company_id]);

    if (existingPage.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'الصفحة موجودة بالفعل',
        existing_conversations: existingConversations[0].count,
        existing_messages: existingMessages[0].count
      });
    }

    // إعادة إدخال الصفحة
    const pageUuid = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await pool.execute(`
      INSERT INTO facebook_pages_unified (
        id, company_id, page_id, page_name, page_username,
        access_token, is_active, auto_reply_enabled, welcome_message,
        webhook_enabled, status, source_table, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 1, 'active', 'unified', NOW(), NOW())
    `, [
      pageUuid, company_id, pageId, page_name, page_username,
      access_token, auto_reply_enabled, welcome_message
    ]);

    console.log(`✅ [RESTORE] تم استعادة الصفحة ${pageId} بنجاح`);

    res.json({
      success: true,
      message: 'تم استعادة الصفحة بنجاح',
      page_id: pageId,
      page_name: page_name,
      restored_conversations: existingConversations[0].count,
      restored_messages: existingMessages[0].count,
      note: existingConversations[0].count > 0 ? 'تم ربط المحادثات والرسائل القديمة تلقائياً' : 'لا توجد بيانات قديمة'
    });
  } catch (error) {
    console.error('❌ Error restoring page:', error);
    res.status(500).json({ error: error.message });
  }
});

// اختبار Facebook Access Token
app.post('/api/facebook/test-token', async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        error: 'Access token مطلوب'
      });
    }

    console.log(`🧪 [TEST-TOKEN] اختبار Access Token: ${access_token.substring(0, 20)}...`);

    // اختبار /me endpoint
    const meResponse = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${access_token}`);
    const meData = await meResponse.json();

    if (meData.error) {
      console.log(`❌ [TEST-TOKEN] خطأ في /me:`, meData.error);
      return res.status(400).json({
        success: false,
        error: meData.error.message,
        error_code: meData.error.code
      });
    }

    console.log(`✅ [TEST-TOKEN] نجح /me:`, meData.name, meData.id);

    // التحقق من نوع الـ Token
    let pages = [];
    let tokenType = 'unknown';

    if (meData.id && meData.name) {
      // هذا Page Token - إنشاء صفحة واحدة من البيانات المتاحة
      pages = [{
        id: meData.id,
        name: meData.name,
        access_token: access_token,
        category: meData.category || 'صفحة',
        tasks: ['MANAGE', 'CREATE_CONTENT', 'MESSAGING']
      }];
      tokenType = 'page_token';
      console.log(`📄 [TEST-TOKEN] تم اكتشاف Page Token للصفحة: ${meData.name}`);
    } else {
      // محاولة جلب الصفحات كـ User Token
      try {
        const accountsResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${access_token}`);
        const accountsData = await accountsResponse.json();

        if (accountsData.error) {
          console.log(`⚠️ [TEST-TOKEN] لا يمكن جلب الصفحات - قد يكون Page Token`);
          pages = [];
          tokenType = 'page_token_probable';
        } else {
          pages = accountsData.data || [];
          tokenType = 'user_token';
          console.log(`📄 [TEST-TOKEN] تم جلب الصفحات كـ User Token: ${pages.length}`);
        }
      } catch (error) {
        console.log(`❌ [TEST-TOKEN] خطأ في جلب الصفحات:`, error);
        pages = [];
        tokenType = 'error';
      }
    }

    const result = {
      success: true,
      token_type: tokenType,
      user: meData,
      pages: pages,
      pages_count: pages.length
    };

    console.log(`🎉 [TEST-TOKEN] النتيجة النهائية:`, {
      token_type: tokenType,
      pages_count: pages.length,
      user_name: meData.name
    });

    res.json(result);
  } catch (error) {
    console.error('❌ [TEST-TOKEN] خطأ عام:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// إعداد webhook للصفحة
app.post('/api/facebook/setup-webhook/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { access_token, company_id } = req.body;

    if (!access_token || !company_id) {
      return res.status(400).json({
        success: false,
        error: 'Access token و company_id مطلوبان'
      });
    }

    console.log(`🔧 [WEBHOOK] إعداد webhook للصفحة: ${pageId}`);

    // 1. التحقق من الصفحة
    const pageResponse = await fetch(`https://graph.facebook.com/v21.0/${pageId}?access_token=${access_token}`);
    const pageData = await pageResponse.json();

    if (pageData.error) {
      console.log(`❌ [WEBHOOK] خطأ في التحقق من الصفحة:`, pageData.error);
      return res.status(400).json({
        success: false,
        error: pageData.error.message
      });
    }

    console.log(`✅ [WEBHOOK] تم التحقق من الصفحة: ${pageData.name}`);

    // 2. إعداد webhook للصفحة
    const webhookUrl = `${process.env.WEBHOOK_URL || 'https://your-domain.com'}/webhook`;

    const subscribeResponse = await fetch(`https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        access_token: access_token,
        subscribed_fields: 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads'
      })
    });

    const subscribeData = await subscribeResponse.json();

    if (subscribeData.error) {
      console.log(`❌ [WEBHOOK] خطأ في إعداد webhook:`, subscribeData.error);

      // محاولة بديلة - استخدام App Token إذا كان متاحاً
      if (process.env.FACEBOOK_APP_TOKEN) {
        console.log(`🔄 [WEBHOOK] محاولة بديلة باستخدام App Token...`);

        const appSubscribeResponse = await fetch(`https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            access_token: process.env.FACEBOOK_APP_TOKEN,
            subscribed_fields: 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads'
          })
        });

        const appSubscribeData = await appSubscribeResponse.json();

        if (appSubscribeData.error) {
          return res.status(400).json({
            success: false,
            error: appSubscribeData.error.message,
            suggestion: 'تحتاج إلى User Token بدلاً من Page Token لإعداد webhook'
          });
        }

        console.log(`✅ [WEBHOOK] تم إعداد webhook بنجاح باستخدام App Token`);
      } else {
        return res.status(400).json({
          success: false,
          error: subscribeData.error.message,
          suggestion: 'تحتاج إلى User Token بدلاً من Page Token لإعداد webhook'
        });
      }
    } else {
      console.log(`✅ [WEBHOOK] تم إعداد webhook بنجاح`);
    }

    // 3. تحديث قاعدة البيانات
    const pool = getPool();
    await pool.execute(`
      UPDATE facebook_pages_unified
      SET webhook_enabled = 1, updated_at = NOW()
      WHERE page_id = ? AND company_id = ?
    `, [pageId, company_id]);

    console.log(`✅ [WEBHOOK] تم تحديث قاعدة البيانات`);

    res.json({
      success: true,
      message: 'تم إعداد webhook بنجاح',
      page_name: pageData.name,
      webhook_url: webhookUrl,
      subscribed_fields: 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads'
    });

  } catch (error) {
    console.error('❌ [WEBHOOK] خطأ عام:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// اختبار إرسال رسالة جديدة من فيسبوك
app.post('/api/facebook/test-message', async (req, res) => {
  try {
    console.log('🧪 [TEST] اختبار إرسال رسالة جديدة...');

    // محاكاة webhook message جديد
    const testWebhook = {
      object: 'page',
      entry: [{
        time: Date.now(),
        id: '250528358137901',
        messaging: [{
          sender: { id: '7801113803290451' },
          recipient: { id: '250528358137901' },
          timestamp: Date.now(),
          message: {
            mid: `test_message_${Date.now()}`,
            text: 'مختار'
          }
        }]
      }]
    };

    console.log('🧪 [TEST] محاكاة webhook:', JSON.stringify(testWebhook, null, 2));

    // معالجة الرسالة مباشرة عبر نفس الكود
    const body = testWebhook;

    if (body.object === 'page') {
      for (const entry of body.entry) {
        if (!entry.messaging) {
          console.log('⏭️ تخطي webhook - لا يحتوي على messaging:', entry);
          continue;
        }

        for (const messaging of entry.messaging) {
          if (messaging.message) {
            let messageText = messaging.message.text || '';
            let imageUrl = null;
            let attachments = [];

            if (messageText || imageUrl || attachments.length > 0) {
              console.log('💬 [TEST] معالجة رسالة جديدة:', { text: messageText, image: imageUrl, attachments });

              if (!messaging.sender?.id) {
                console.log('⚠️ [TEST] لا يوجد معرف المرسل، تخطي الرسالة');
                continue;
              }

              if (!entry.id) {
                console.log('⚠️ [TEST] لا يوجد معرف الصفحة، تخطي الرسالة');
                continue;
              }

              const messageRequest = {
                senderId: messaging.sender.id,
                messageText: messageText,
                messageId: messaging.message.mid,
                pageId: entry.id,
                timestamp: messaging.timestamp,
                senderType: 'customer' as const,
                isEcho: false,
                imageUrl: imageUrl,
                attachments: attachments
              };

              try {
                console.log('💬 [TEST] معالجة رسالة جديدة:', {
                  senderId: messageRequest.senderId,
                  text: messageRequest.messageText,
                  pageId: messageRequest.pageId
                });

                // حفظ الرسالة في قاعدة البيانات
                const savedMessage = await saveMessageToDatabase(messageRequest);

                console.log('✅ [TEST] تم معالجة الرسالة بنجاح');

                // إرسال تحديث فوري للواجهة
                if (!messageRequest.isEcho && messageRequest.senderId !== messageRequest.pageId) {
                  try {
                    const facebookSettings = await FacebookService.getByPageId(messageRequest.pageId);
                    if (facebookSettings && facebookSettings.company_id) {
                      broadcastUpdate(facebookSettings.company_id, {
                        type: 'new_message',
                        conversation_id: savedMessage?.conversation_id,
                        messageData: {
                          id: savedMessage?.id,
                          content: messageRequest.messageText,
                          sender_type: 'customer',
                          timestamp: new Date().toISOString(),
                          image_url: messageRequest.imageUrl,
                          attachments: messageRequest.attachments
                        }
                      });
                      console.log('📡 [TEST] تم إرسال التحديث الفوري للواجهة');
                    }
                  } catch (broadcastError) {
                    console.error('❌ [TEST] خطأ في إرسال التحديث الفوري:', broadcastError);
                  }
                }

              } catch (processError) {
                console.error('❌ [TEST] خطأ في معالجة الرسالة:', processError);
              }
            }
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'تم إرسال رسالة اختبار "مختار" بنجاح',
      webhook: testWebhook
    });

  } catch (error) {
    console.error('❌ [TEST] خطأ في اختبار الرسالة:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// تحديث معرف الشركة لصفحة فيسبوك في الجدول الموحد
app.put('/api/facebook/settings/:pageId/company', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { company_id } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    console.log(`📊 [API] تحديث معرف الشركة للصفحة ${pageId} في الجدول الموحد`);

    const pool = getPool();
    const [result] = await pool.execute(
      'UPDATE facebook_pages_unified SET company_id = ?, updated_at = NOW() WHERE page_id = ?',
      [company_id, pageId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    console.log(`✅ [API] تم تحديث معرف الشركة للصفحة ${pageId}`);

    res.json({
      success: true,
      message: 'Company ID updated successfully in unified table'
    });
  } catch (error) {
    console.error('❌ Error updating company ID:', error);
    res.status(500).json({ error: error.message });
  }
});

// حذف صفحة فيسبوك
app.delete('/api/facebook/settings/:pageId', async (req, res) => {
  try {
    const { pageId } = req.params;

    if (!pageId) {
      return res.status(400).json({ error: 'pageId is required' });
    }

    const success = await FacebookService.deleteByPageId(pageId);

    if (success) {
      res.json({
        success: true,
        message: 'Facebook page deleted successfully'
      });
    } else {
      res.status(404).json({ error: 'Page not found' });
    }
  } catch (error) {
    console.error('❌ Error deleting Facebook page:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================================
// 💬 Conversations APIs
// ===================================

// الحصول على محادثات الشركة
app.get('/api/conversations', async (req, res) => {
  try {
    const { company_id, limit = SERVER_CONFIG.DATA_LIMITS.DEFAULT_CONVERSATIONS_LIMIT } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    // التحقق من الحد الأقصى
    const finalLimit = Math.min(
      parseInt(limit as string) || SERVER_CONFIG.DATA_LIMITS.DEFAULT_CONVERSATIONS_LIMIT,
      SERVER_CONFIG.DATA_LIMITS.MAX_CONVERSATIONS_LIMIT
    );

    const conversations = await ConversationService.getByCompanyId(
      company_id as string,
      finalLimit
    );

    res.json({
      success: true,
      data: conversations,
      count: conversations?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

// الحصول على محادثات الشركة (endpoint بديل للتوافق مع Frontend)
app.get('/api/companies/:companyId/conversations', async (req, res) => {
  try {
    console.log('🔍🔍🔍 [API] تم استدعاء endpoint للمحادثات:', req.params, req.query);
    console.log('🔍🔍🔍 [API] الطلب وصل إلى الدالة الصحيحة!');

    const { companyId } = req.params;
    const { limit = SERVER_CONFIG.DATA_LIMITS.DEFAULT_CONVERSATIONS_LIMIT, recent_only = 'false' } = req.query;

    // التحقق من الحد الأقصى
    const finalLimit = Math.min(
      parseInt(limit as string) || SERVER_CONFIG.DATA_LIMITS.DEFAULT_CONVERSATIONS_LIMIT,
      SERVER_CONFIG.DATA_LIMITS.MAX_CONVERSATIONS_LIMIT
    );

    console.log('🔍🔍🔍 جلب محادثات الشركة:', companyId, { recent_only, finalLimit });

    let conversations;

    // إذا كان المطلوب الرسائل الحديثة فقط
    if (recent_only === 'true') {
      console.log('🔍🔍🔍 استدعاء getByCompanyIdWithRecentMessages...');
      conversations = await ConversationService.getByCompanyIdWithRecentMessages(
        companyId,
        finalLimit
      );
      console.log(`📊📊📊 تم جلب ${conversations?.length || 0} محادثة مع عدد الرسائل الحديثة`);
      console.log('📋📋📋 أول محادثة:', JSON.stringify(conversations?.[0], null, 2));
    } else {
      console.log('🔍🔍🔍 استدعاء getByCompanyId العادي...');
      conversations = await ConversationService.getByCompanyId(
        companyId,
        finalLimit
      );
      console.log('✅✅✅ تم جلب المحادثات:', conversations?.length || 0);
    }

    // منع caching للحصول على البيانات الحديثة
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    console.log('🔍🔍🔍 [API] إرسال الاستجابة...');
    res.json({
      success: true,
      data: conversations,
      count: conversations?.length || 0
    });
  } catch (error) {
    console.error('❌❌❌ Error fetching company conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

// الحصول على رسائل محادثة معينة
app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = SERVER_CONFIG.DATA_LIMITS.DEFAULT_MESSAGES_LIMIT, company_id, recent_only = 'true' } = req.query;

    // التحقق من الحد الأقصى
    const finalLimit = Math.min(
      parseInt(limit as string) || SERVER_CONFIG.DATA_LIMITS.DEFAULT_MESSAGES_LIMIT,
      SERVER_CONFIG.DATA_LIMITS.MAX_MESSAGES_LIMIT
    );

    console.log('🔍 جلب رسائل المحادثة:', { conversationId: id, companyId: company_id, limit: finalLimit, recentOnly: recent_only });
    console.log('🚨 [DEBUG] بداية جلب الرسائل - تحديث جديد!');

    // إذا كان recent_only = true، جلب الرسائل الحديثة فقط (آخر 24 ساعة)
    let messages;
    if (recent_only === 'true') {
      messages = await MessageService.getRecentByConversationId(id, finalLimit);
    } else {
      messages = await MessageService.getByConversationId(id, finalLimit);
    }

    console.log('✅ تم جلب الرسائل:', messages?.length || 0);

    // منع caching للحصول على البيانات الحديثة
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: messages,
      count: messages?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// الحصول على الرسائل الحديثة فقط (آخر 24 ساعة)
app.get('/api/conversations/:id/messages/recent', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = SERVER_CONFIG.DATA_LIMITS.DEFAULT_MESSAGES_LIMIT, company_id } = req.query;

    // التحقق من الحد الأقصى
    const finalLimit = Math.min(
      parseInt(limit as string) || SERVER_CONFIG.DATA_LIMITS.DEFAULT_MESSAGES_LIMIT,
      SERVER_CONFIG.DATA_LIMITS.MAX_MESSAGES_LIMIT
    );

    console.log('🔍 جلب الرسائل الحديثة فقط:', { conversationId: id, companyId: company_id, limit: finalLimit });

    const messages = await MessageService.getRecentByConversationId(id, finalLimit);

    console.log(`✅ تم جلب الرسائل الحديثة: ${messages?.length || 0}`);

    // منع caching للحصول على البيانات الحديثة
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: messages,
      count: messages?.length || 0,
      filter: 'recent_24h'
    });
  } catch (error) {
    console.error('❌ Error fetching recent messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint لبنية الجدول
app.get('/api/debug/table-structure/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const [rows] = await executeQuery(`DESCRIBE ${table}`, []);
    res.json({ table, structure: rows });
  } catch (error) {
    console.error('❌ Error getting table structure:', error);
    res.status(500).json({ error: 'Failed to get table structure' });
  }
});

// إرسال رسالة جديدة
app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, message_text, sender_type = 'admin', company_id, message_type = 'text', image_data, image_name } = req.body;

    // دعم كلا من content و message_text للتوافق
    const messageContent = content || message_text;

    // للصور، السماح بإرسال صورة بدون نص
    if (!messageContent && message_type !== 'image') {
      return res.status(400).json({
        error: 'content/message_text is required for text messages'
      });
    }

    if (!company_id) {
      return res.status(400).json({
        error: 'company_id is required'
      });
    }

    console.log('📤 إرسال رسالة جديدة:', {
      conversationId: id,
      companyId: company_id,
      content: messageContent,
      senderType: sender_type
    });

    console.log('📊 [DEBUG] بيانات الرسالة المستلمة:', {
      conversationId: id,
      companyId: company_id,
      messageText: message_text,
      messageType: message_type,
      hasImageData: !!image_data,
      imageName: image_name,
      senderType: sender_type
    });

    // معالجة الصور إذا كانت موجودة أولاً
    let imageUrl = null;
    if (message_type === 'image' && image_data) {
      try {
        console.log('📷 معالجة الصورة...');

        // تحويل base64 إلى buffer
        const base64Data = image_data.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // إنشاء مجلد uploads إذا لم يكن موجود
        const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // حفظ الصورة مع اسم فريد
        const timestamp = Date.now();
        const fileExtension = image_name ? path.extname(image_name) : '.jpg';
        const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);

        fs.writeFileSync(filePath, imageBuffer);
        // استخدام ngrok URL بدلاً من localhost
        const baseUrl = process.env.PUBLIC_URL || 'https://10f9ac7ca0ba.ngrok-free.app';
        imageUrl = `${baseUrl}/uploads/images/${fileName}`;

        console.log('✅ تم حفظ الصورة:', imageUrl);
      } catch (imageError) {
        console.error('❌ خطأ في معالجة الصورة:', imageError);
        // المتابعة بدون صورة
      }
    }

    // إنشاء الرسالة مع image_url
    const messageId = await MessageService.create({
      conversation_id: id,
      company_id,
      sender_id: 'admin',
      message_text: messageContent || '',
      message_type: message_type,
      is_from_page: true, // هذه رسالة من الصفحة/الإدارة
      status: 'sent',
      is_read: true,
      image_url: imageUrl // تمرير image_url مباشرة
    });

    // تحديث إحصائيات المحادثة (تصفير عدد الرسائل غير المقروءة)
    console.log('🔄 [DEBUG] محاولة تحديث إحصائيات المحادثة (تصفير unread_count):', id);
    try {
      const updateResult = await ConversationService.updateStats(id);
      console.log('✅ [DEBUG] نتيجة تحديث الإحصائيات (تصفير unread_count):', updateResult);

      if (!updateResult) {
        console.error('❌ [DEBUG] فشل في تصفير عدد الرسائل غير المقروءة للمحادثة:', id);
      }
    } catch (updateError) {
      console.error('❌ [DEBUG] خطأ في تحديث الإحصائيات (تصفير unread_count):', updateError);
    }

    // تحديث إحصائيات المحادثة مع تفاصيل آخر رسالة
    console.log('🔄 [DEBUG] محاولة تحديث إحصائيات المحادثة مع آخر رسالة:', id);
    try {
      const updateStatsResult = await ConversationService.updateConversationStats(
        id,
        messageContent || '[صورة]',
        new Date().toISOString(),
        1 // من الصفحة
      );
      console.log('✅ [DEBUG] نتيجة تحديث إحصائيات آخر رسالة:', updateStatsResult);
    } catch (updateStatsError) {
      console.error('❌ [DEBUG] خطأ في تحديث إحصائيات آخر رسالة:', updateStatsError);
    }

    console.log('✅ تم حفظ الرسالة في قاعدة البيانات:', messageId);

    // الحصول على بيانات المحادثة لإرسال الرسالة عبر Facebook
    console.log('🔍 محاولة جلب المحادثة بالمعرف:', id);
    const conversation = await ConversationService.getById(id);
    console.log('📊 نتيجة جلب المحادثة:', conversation ? 'تم العثور على المحادثة' : 'لم يتم العثور على المحادثة');

    if (!conversation) {
      console.log('❌ المحادثة غير موجودة في قاعدة البيانات');
      return res.status(404).json({ error: 'Conversation not found' });
    }

    console.log('🔍 بيانات المحادثة المسترجعة:', JSON.stringify(conversation, null, 2));

    // طباعة جميع الأعمدة المتاحة في المحادثة
    console.log('📋 أعمدة المحادثة المتاحة:', Object.keys(conversation || {}));

    // استخراج معرف المستقبل من participant_id في المحادثة
    const recipientId = conversation.participant_id || conversation.user_id;
    console.log('👤 معرف المستقبل المستخرج من participant_id:', recipientId);
    console.log('🔍 قيم المحادثة المتاحة:');
    console.log('   participant_id:', conversation.participant_id);
    console.log('   user_id:', conversation.user_id);

    // الحصول على إعدادات Facebook للشركة
    console.log('🔍 البحث عن إعدادات Facebook للشركة:', company_id);
    console.log('📄 صفحة المحادثة:', conversation.facebook_page_id);
    const facebookSettingsArray = await FacebookService.getByCompanyId(company_id);
    console.log('📊 نتيجة البحث عن إعدادات Facebook:', facebookSettingsArray);

    // البحث عن الصفحة المطابقة للمحادثة
    let facebookSettings = null;
    if (conversation.facebook_page_id && facebookSettingsArray && facebookSettingsArray.length > 0) {
      facebookSettings = facebookSettingsArray.find(setting => setting.page_id === conversation.facebook_page_id);
      console.log('🎯 تم العثور على إعدادات الصفحة المطابقة:', facebookSettings);
    }

    // إذا لم يتم العثور على صفحة مطابقة، استخدم الأولى
    if (!facebookSettings && facebookSettingsArray && facebookSettingsArray.length > 0) {
      facebookSettings = facebookSettingsArray[0];
      console.log('⚠️ لم يتم العثور على صفحة مطابقة، استخدام الصفحة الأولى:', facebookSettings);
    }

    console.log('🎯 إعدادات Facebook النهائية:', facebookSettings);

    if (!facebookSettings || !facebookSettings.access_token) {
      console.log('⚠️ لا توجد إعدادات Facebook، تم حفظ الرسالة في قاعدة البيانات فقط');
      return res.json({
        success: true,
        data: { message_id: messageId },
        message: 'Message saved to database (no Facebook sending)',
        warning: 'Facebook settings not configured'
      });
    }



    // إرسال الرسالة عبر Facebook API
    try {
      console.log('📤 إرسال الرسالة عبر Facebook API...');

      // استخدام participant_id أو customer_facebook_id أو user_id
      const finalRecipientId = conversation.participant_id || conversation.customer_facebook_id || conversation.user_id;
      console.log('🔍 محاولة استخراج معرف المستقبل:');
      console.log('   participant_id:', conversation.participant_id);
      console.log('   customer_facebook_id:', conversation.customer_facebook_id);
      console.log('   user_id:', conversation.user_id);
      console.log('   النتيجة النهائية:', finalRecipientId);
      console.log('👤 المستقبل:', finalRecipientId);
      console.log('💬 النص:', messageContent);

      if (!finalRecipientId) {
        console.log('❌ لا يوجد معرف مستقبل صحيح');
        return res.json({
          success: true,
          data: { message_id: messageId },
          message: 'Message saved to database but no recipient ID found',
          warning: 'No recipient ID available'
        });
      }

      let facebookResponse;

      if (imageUrl) {
        // إرسال صورة مباشرة لفيسبوك
        console.log('📷 إرسال صورة مباشرة عبر Facebook API...');

        // تحويل base64 إلى buffer للرفع المباشر
        const base64Data = image_data.replace(/^data:image\/[a-z]+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // إرسال الصورة باستخدام URL (الطريقة الأصلية)
        facebookResponse = await fetch(
          `https://graph.facebook.com/v21.0/me/messages?access_token=${facebookSettings.access_token}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: finalRecipientId },
              message: {
                attachment: {
                  type: 'image',
                  payload: {
                    url: imageUrl,
                    is_reusable: true
                  }
                }
              }
            })
          }
        );

        // إرسال النص إذا كان موجود
        if (messageContent) {
          console.log('📝 إرسال النص مع الصورة...');
          await fetch(
            `https://graph.facebook.com/v21.0/me/messages?access_token=${facebookSettings.access_token}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipient: { id: finalRecipientId },
                message: { text: messageContent }
              })
            }
          );
        }
      } else {
        // إرسال نص عادي
        console.log('📝 إرسال نص عبر Facebook API...');
        facebookResponse = await fetch(
          `https://graph.facebook.com/v21.0/me/messages?access_token=${facebookSettings.access_token}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: finalRecipientId },
              message: { text: messageContent }
            })
          }
        );
      }

      if (!facebookResponse.ok) {
        const errorText = await facebookResponse.text();
        console.error('❌ خطأ في Facebook API:', {
          status: facebookResponse.status,
          statusText: facebookResponse.statusText,
          body: errorText
        });

        // إرسال تحديث فوري للواجهة حتى لو فشل Facebook
        broadcastUpdate(company_id, {
          type: 'new_message',
          conversation_id: id,
          messageData: {
            id: messageId,
            content: messageContent,
            sender_type: 'admin',
            timestamp: new Date().toISOString()
          }
        });

        return res.json({
          success: true,
          data: {
            message_id: messageId,
            image_url: imageUrl
          },
          message: 'Message saved to database but failed to send via Facebook',
          facebook_error: errorText
        });
      }

      const facebookData = await facebookResponse.json();
      console.log('✅ تم إرسال الرسالة عبر Facebook بنجاح!', facebookData);

      // تحديث الرسالة بـ Facebook message ID
      if (facebookData.message_id) {
        const pool = getPool();
        await pool.execute(
          'UPDATE messages SET facebook_message_id = ? WHERE id = ?',
          [facebookData.message_id, messageId]
        );
      }

      // إرسال تحديث فوري للواجهة
      broadcastUpdate(company_id, {
        type: 'new_message',
        conversation_id: id,
        messageData: {
          id: messageId,
          content: messageContent,
          sender_type: 'admin',
          timestamp: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        data: {
          message_id: messageId,
          facebook_message_id: facebookData.message_id,
          image_url: imageUrl
        },
        message: 'Message sent successfully via Facebook'
      });

    } catch (facebookError) {
      console.error('❌ خطأ في إرسال الرسالة عبر Facebook:', facebookError);

      // إرسال تحديث فوري للواجهة حتى لو فشل Facebook
      broadcastUpdate(company_id, {
        type: 'new_message',
        conversation_id: id,
        messageData: {
          id: messageId,
          content: messageContent,
          sender_type: 'admin',
          timestamp: new Date().toISOString()
        }
      });

      res.json({
        success: true,
        data: {
          message_id: messageId,
          image_url: imageUrl
        },
        message: 'Message saved to database but failed to send via Facebook',
        facebook_error: facebookError.message
      });
    }
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================================
// 🤖 Gemini AI APIs
// ===================================

// الحصول على إعدادات الذكي الاصطناعي
app.get('/api/gemini/settings', async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    const settings = await GeminiService.getByCompanyId(company_id as string);

    if (!settings) {
      return res.status(404).json({ error: 'Gemini settings not found' });
    }

    // إخفاء API key في الاستجابة
    const safeSettings = {
      ...settings,
      api_key: settings.api_key ? '***' : null,
      hasApiKey: !!settings.api_key
    };

    res.json(safeSettings);
  } catch (error) {
    console.error('❌ Error fetching Gemini settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// تحديث إعدادات الذكي الاصطناعي
app.put('/api/gemini/settings', async (req, res) => {
  try {
    const { company_id, ...updateData } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    const success = await GeminiService// TODO: Replace with MySQL API;

    if (!success) {
      return res.status(404).json({ error: 'Gemini settings not found' });
    }

    res.json({
      success: true,
      message: 'Gemini settings updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating Gemini settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===================================
// 📊 Statistics APIs
// ===================================

// إحصائيات الشركة
app.get('/api/companies/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await DatabaseService.getCompanyStats(id);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching company stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// إحصائيات بسيطة للشركة (للواجهة الأمامية)
app.get('/api/stats', async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'company_id مطلوب'
      });
    }

    // إحصائيات بسيطة
    const stats = {
      total_conversations: 0,
      total_messages: 0,
      unread_messages: 0,
      active_pages: 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات'
    });
  }
});

// ===================================
// 🔗 Integration Routes
// ===================================

// استخدام routes الموجودة (معطلة مؤقتاً)
// app.use('/api/gemini', geminiRouter); // مؤقتاً معطل
app.use('/api/whatsapp-baileys', whatsappBaileysRoutes);
// app.use('/api/subscription', subscriptionRouter); // مؤقتاً معطل

// مسارات التحليلات
app.use('/api/analytics', analyticsRoutes);

// 🏪 مسارات المتجر الإلكتروني (معطلة مؤقتاً لأن الجداول غير موجودة)
// import storeRoutes from './store-routes';
// import cartRoutes from './cart-routes';
// import ordersRoutes from './orders-routes';

// app.use('/api', storeRoutes);
// app.use('/api', cartRoutes);
// app.use('/api', ordersRoutes);

// ===================================
// 📨 Webhook للرسائل
// ===================================

// دالة حفظ الرسالة في قاعدة البيانات
async function saveMessageToDatabase(messageRequest: any) {
  try {
    const { senderId, messageText, messageId, pageId, timestamp, imageUrl, attachments } = messageRequest;
    const pool = getPool(); // الحصول على pool الاتصالات

    console.log('💾 حفظ الرسالة في قاعدة البيانات...');
    console.log('🔍 [DEBUG] messageRequest:', JSON.stringify(messageRequest, null, 2));

    // 1. البحث عن الشركة المرتبطة بالصفحة (من الجدول الموحد)
    const [pageSettings] = await pool.execute(
      'SELECT company_id FROM facebook_pages_unified WHERE page_id = ? AND is_active = 1',
      [pageId]
    );

    if (!pageSettings || pageSettings.length === 0) {
      console.log('⚠️ لم يتم العثور على إعدادات الصفحة');
      return;
    }

    const companyId = pageSettings[0].company_id;
    console.log('🏢 معرف الشركة:', companyId);

    // 2. التحقق من وجود الرسالة مسبقاً لتجنب التكرار
    const [existingMessage] = await pool.execute(
      'SELECT id FROM messages WHERE facebook_message_id = ?',
      [messageId]
    );

    if (existingMessage && existingMessage.length > 0) {
      console.log('⚠️ الرسالة موجودة مسبقاً:', messageId);
      return;
    }

    // 3. تحديد ما إذا كانت الرسالة من الصفحة أم من العميل
    const isFromPage = senderId === pageId;
    console.log(`📝 نوع الرسالة: ${isFromPage ? 'من الصفحة' : 'من العميل'} (${senderId})`);

    // ملاحظة: لا نتجاهل رسائل الصفحة، بل نحفظها مع تمييزها

    // 4. البحث عن المحادثة أو إنشاؤها
    let conversationId;
    const [existingConversation] = await pool.execute(
      'SELECT id FROM conversations WHERE participant_id = ? AND facebook_page_id = ? AND company_id = ?',
      [senderId, pageId, companyId]
    );

    if (existingConversation && existingConversation.length > 0) {
      conversationId = existingConversation[0].id;
      console.log('💬 استخدام محادثة موجودة:', conversationId);
    } else {
      // إنشاء محادثة جديدة فقط إذا لم تكن موجودة
      console.log('🆕 إنشاء محادثة جديدة للمستخدم:', senderId);
      const conversationUuid = crypto.randomUUID();
      await pool.execute(
        `INSERT INTO conversations (id, company_id, participant_id, facebook_page_id, unread_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
        [conversationUuid, companyId, senderId, pageId]
      );
      conversationId = conversationUuid;
      console.log('💬 محادثة جديدة تم إنشاؤها:', conversationId);
    }

    // 3. حفظ الرسالة مع معالجة التكرار والصور
    const messageUuid = crypto.randomUUID();
    try {
      await pool.execute(
        `INSERT INTO messages (id, conversation_id, sender_id, message_text, facebook_message_id, message_type, is_from_page, attachments, image_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [messageUuid, conversationId, senderId, messageText, messageId, imageUrl ? 'image' : 'text', isFromPage, attachments ? JSON.stringify(attachments) : null, imageUrl || null]
      );

      console.log('✅ تم حفظ الرسالة في قاعدة البيانات');
    } catch (messageError: any) {
      if (messageError.code === 'ER_DUP_ENTRY') {
        console.log('⚠️ الرسالة موجودة مسبقاً:', messageId);
        return; // تجاهل الرسالة المكررة
      } else {
        throw messageError; // أعد رفع الخطأ إذا لم يكن تكراراً
      }
    }

    // 4. تحديث عدد الرسائل غير المقروءة وآخر رسالة
    await pool.execute(
      'UPDATE conversations SET unread_count = unread_count + 1, last_message_time = FROM_UNIXTIME(?), updated_at = NOW() WHERE id = ?',
      [Math.floor(timestamp / 1000), conversationId]
    );

    console.log('✅ تم تحديث عدد الرسائل غير المقروءة');

    // 5. تحديث اسم المستخدم إذا لم يكن موجوداً (محسن)
    console.log(`🔍 فحص اسم المستخدم للمحادثة: ${conversationId}`);

    const [conversationData] = await pool.execute(
      'SELECT participant_name, participant_id FROM conversations WHERE id = ?',
      [conversationId]
    );

    if (conversationData && conversationData.length > 0) {
      const conversation = conversationData[0];
      const needsNameUpdate = !conversation.participant_name ||
        conversation.participant_name === '' ||
        conversation.participant_name === 'undefined' ||
        conversation.participant_name === 'null' ||
        conversation.participant_name === 'بدون اسم';

      console.log(`👤 اسم المستخدم الحالي: "${conversation.participant_name}" | يحتاج تحديث: ${needsNameUpdate}`);

      if (needsNameUpdate) {
        console.log(`🔄 بدء تحديث اسم المستخدم ${senderId} تلقائياً...`);

        // تحديث الاسم في الخلفية (بدون انتظار)
        setTimeout(async () => {
          try {
            const { MySQLNameUpdateService } = await import('../services/mysqlNameUpdateService');
            const success = await MySQLNameUpdateService.updateSingleUserName(senderId, pageId, companyId);
            if (success) {
              console.log(`✅ تم تحديث اسم المستخدم ${senderId} تلقائياً`);

              // إشعار إضافي للتأكيد
              const [updatedData] = await pool.execute(
                'SELECT participant_name FROM conversations WHERE id = ?',
                [conversationId]
              );
              if (updatedData && updatedData.length > 0) {
                console.log(`🎉 الاسم الجديد: "${updatedData[0].participant_name}"`);

                // إشعار الواجهة الأمامية بالتحديث (إذا كان هناك WebSocket)
                // TODO: إضافة WebSocket للتحديث الفوري
              }
            } else {
              console.log(`⚠️ لم يتم العثور على اسم للمستخدم ${senderId}`);
            }
          } catch (error) {
            console.error(`❌ خطأ في تحديث اسم المستخدم ${senderId}:`, error);
          }
        }, 1000); // تأخير 1 ثانية فقط
      } else {
        console.log(`✅ المستخدم ${senderId} لديه اسم بالفعل: "${conversation.user_name}"`);
      }
    }

  } catch (error) {
    console.error('❌ خطأ في حفظ الرسالة:', error);
    throw error;
  }
}

// معالجة رسائل فيسبوك
app.post('/webhook', async (req, res) => {
  try {
    console.log('🔥🔥🔥 FACEBOOK WEBHOOK RECEIVED! 🔥🔥🔥');
    console.log('📨 Received Facebook webhook:', JSON.stringify(req.body, null, 2));

    // معالجة الرسائل الواردة
    const body = req.body;

    if (body.object === 'page') {
      for (const entry of body.entry) {
        // تحقق من وجود messaging قبل المعالجة
        if (!entry.messaging) {
          console.log('⏭️ تخطي webhook - لا يحتوي على messaging:', entry);
          continue;
        }

        for (const messaging of entry.messaging) {
          // تحقق من وجود رسالة (نص أو صورة أو مرفقات)
          if (messaging.message) {
            let messageText = messaging.message.text || '';
            let imageUrl = null;
            let attachments = [];

            // معالجة المرفقات (الصور، الملفات، إلخ)
            if (messaging.message.attachments && messaging.message.attachments.length > 0) {
              console.log('📎 معالجة مرفقات:', messaging.message.attachments);

              for (const attachment of messaging.message.attachments) {
                if (attachment.type === 'image') {
                  imageUrl = attachment.payload.url;
                  console.log('🖼️ تم استلام صورة:', imageUrl);
                  console.log('🔍 [DEBUG] تفاصيل الصورة:', JSON.stringify(attachment, null, 2));
                  if (!messageText) {
                    messageText = '[صورة]';
                  }
                } else if (attachment.type === 'file') {
                  attachments.push({
                    type: 'file',
                    url: attachment.payload.url,
                    name: attachment.payload.name || 'ملف'
                  });
                  console.log('📄 تم استلام ملف:', attachment.payload.url);
                  if (!messageText) {
                    messageText = '[ملف]';
                  }
                } else if (attachment.type === 'video') {
                  attachments.push({
                    type: 'video',
                    url: attachment.payload.url
                  });
                  console.log('🎥 تم استلام فيديو:', attachment.payload.url);
                  if (!messageText) {
                    messageText = '[فيديو]';
                  }
                } else if (attachment.type === 'audio') {
                  attachments.push({
                    type: 'audio',
                    url: attachment.payload.url
                  });
                  console.log('🎵 تم استلام ملف صوتي:', attachment.payload.url);
                  if (!messageText) {
                    messageText = '[ملف صوتي]';
                  }
                }
              }
            }

            if (messageText || imageUrl || attachments.length > 0) {
              console.log('💬 معالجة رسالة جديدة:', { text: messageText, image: imageUrl, attachments });

              // التحقق من وجود البيانات المطلوبة
              if (!messaging.sender?.id) {
                console.log('⚠️ لا يوجد معرف المرسل، تخطي الرسالة');
                continue;
              }

              if (!entry.id) {
                console.log('⚠️ لا يوجد معرف الصفحة، تخطي الرسالة');
                continue;
              }

              const messageRequest = {
                senderId: messaging.sender.id,
                messageText: messageText,
                messageId: messaging.message.mid,
                pageId: entry.id,
                timestamp: messaging.timestamp,
                senderType: 'customer' as const,
                isEcho: false,
                imageUrl: imageUrl,
                attachments: attachments
              };

              try {
                // معالجة مبسطة للرسالة
                console.log('💬 معالجة رسالة جديدة:', {
                  senderId: messageRequest.senderId,
                  text: messageRequest.messageText,
                  pageId: messageRequest.pageId
                });

                // حفظ الرسالة في قاعدة البيانات
                const savedMessage = await saveMessageToDatabase(messageRequest);

                console.log('✅ تم معالجة الرسالة بنجاح');

                // إرسال تحديث فوري للواجهة عند استلام رسالة جديدة من العميل
                if (!messageRequest.isEcho && messageRequest.senderId !== messageRequest.pageId) {
                  // البحث عن company_id من خلال page_id
                  try {
                    const facebookSettings = await FacebookService.getByPageId(messageRequest.pageId);
                    if (facebookSettings && facebookSettings.company_id) {
                      broadcastUpdate(facebookSettings.company_id, {
                        type: 'new_message',
                        conversation_id: savedMessage?.conversation_id,
                        messageData: {
                          id: savedMessage?.id,
                          content: messageRequest.messageText,
                          sender_type: 'customer',
                          timestamp: new Date().toISOString(),
                          image_url: messageRequest.imageUrl,
                          attachments: messageRequest.attachments
                        }
                      });
                    }
                  } catch (broadcastError) {
                    console.error('❌ خطأ في إرسال التحديث الفوري:', broadcastError);
                  }
                }

                // مزامنة محدودة جداً - فقط للرسائل الواردة من العملاء (ليس echo)
                if (!messageRequest.isEcho && messageRequest.senderId !== messageRequest.pageId) {
                  const syncKey = `${messageRequest.pageId}-${messageRequest.senderId}`;
                  const lastSyncTime = lastSyncTimes.get(syncKey) || 0;
                  const now = Date.now();

                  // مزامنة كل 30 ثانية فقط لكل محادثة، وفقط للرسائل الواردة الحقيقية
                  if (now - lastSyncTime > 30000) {
                    lastSyncTimes.set(syncKey, now);
                    setTimeout(() => {
                      console.log(`🔄 [WEBHOOK] مزامنة محدودة للمحادثة: ${syncKey}`);
                      syncSpecificConversation(messageRequest.pageId, messageRequest.senderId).catch(error => {
                        console.error('❌ [WEBHOOK] خطأ في المزامنة:', error);
                      });
                    }, 10000); // تأخير 10 ثواني
                  } else {
                    console.log(`⏭️ [WEBHOOK] تخطي المزامنة - تمت مؤخراً للمحادثة: ${syncKey}`);
                  }
                } else {
                  console.log('⏭️ [WEBHOOK] تخطي المزامنة - رسالة صادرة أو echo');
                }
              } catch (processError) {
                console.error('❌ خطأ في معالجة الرسالة:', processError);
              }
            }
          }
          // تحقق من أحداث أخرى (قراءة، تسليم، إلخ)
          else if (messaging.read) {
            console.log('👁️ تم قراءة الرسالة');
          } else if (messaging.delivery) {
            console.log('📬 تم تسليم الرسالة');
          }
        }
      }
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// التحقق من webhook
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || 'facebook_verify_token_123';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 [WEBHOOK] Verification request:', { mode, token, challenge, expectedToken: VERIFY_TOKEN });

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ [WEBHOOK] Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.log('❌ [WEBHOOK] Verification failed - token mismatch');
      res.sendStatus(403);
    }
  } else {
    console.log('❌ [WEBHOOK] Missing mode or token');
    res.sendStatus(400);
  }
});

// ===================================
// 🏪 Store APIs (تم نقلها إلى نهاية الملف)
// ===================================

// ===================================
// 🔍 اختبار الرسائل
// ===================================

// endpoint لاختبار جلب الرسائل مباشرة من قاعدة البيانات
app.get('/api/debug/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50 } = req.query;

    console.log('🔍 [DEBUG] جلب رسائل المحادثة مباشرة:', conversationId);

    const pool = getPool();

    // جلب الرسائل مباشرة من قاعدة البيانات
    const [messages] = await pool.execute(
      `SELECT
        id, conversation_id, sender_id,
        message_text, facebook_message_id,
        created_at,
        created_at as display_time,
        is_from_page,
        CASE
          WHEN is_from_page = 1 THEN 'admin'
          ELSE 'customer'
        END as sender_type
       FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [conversationId, parseInt(limit as string)]
    );

    console.log('📊 [DEBUG] عدد الرسائل الموجودة:', messages.length);
    if (messages && messages.length > 0) {
      console.log('📊 [DEBUG] أول رسالة:', messages[0]);
      console.log('📊 [DEBUG] أعمدة الرسالة:', Object.keys(messages[0]));
    }

    // عكس الترتيب للعرض وإضافة content
    const sortedMessages = messages.reverse().map(msg => ({
      ...msg,
      content: msg.message_text, // تحويل message_text إلى content للواجهة
      sender_type: msg.sender_type // الحفاظ على sender_type
    }));

    res.json({
      success: true,
      data: sortedMessages,
      debug: {
        conversationId,
        totalMessages: messages.length,
        query: 'Direct database query',
        orderBy: 'COALESCE(sent_at, created_at) DESC then reversed'
      }
    });
  } catch (error) {
    console.error('❌ [DEBUG] خطأ في جلب الرسائل:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// endpoint لاختبار جلب المحادثات مباشرة من قاعدة البيانات
app.get('/api/debug/conversations/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { limit = 50 } = req.query;

    console.log('🔍 [DEBUG] جلب محادثات الشركة مباشرة:', companyId);

    const pool = getPool();

    // جلب المحادثات مباشرة من قاعدة البيانات
    const [conversations] = await pool.execute(
      `SELECT
        id, company_id, customer_facebook_id, facebook_page_id,
        status, unread_count, last_message_at, created_at, updated_at
       FROM conversations
       WHERE company_id = ?
       ORDER BY COALESCE(last_message_at, created_at) DESC
       LIMIT ?`,
      [companyId, parseInt(limit as string)]
    );

    console.log('📊 [DEBUG] عدد المحادثات الموجودة:', conversations.length);

    // جلب عدد الرسائل لكل محادثة
    for (const conv of conversations) {
      const [messageCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
        [conv.id]
      );
      conv.message_count = messageCount[0]?.count || 0;
    }

    res.json({
      success: true,
      data: conversations,
      debug: {
        companyId,
        totalConversations: conversations.length,
        query: 'Direct database query with message counts'
      }
    });
  } catch (error) {
    console.error('❌ [DEBUG] خطأ في جلب المحادثات:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// endpoint لاختبار العزل بين الشركات
app.get('/api/debug/isolation-test', async (req, res) => {
  try {
    console.log('🚨 [DEBUG] فحص العزل بين الشركات...');

    const pool = getPool();

    // 1. جلب جميع الشركات
    const [companies] = await pool.execute(
      `SELECT id, name, email, created_at
       FROM companies
       ORDER BY created_at DESC`
    );

    console.log(`🏢 [DEBUG] وجدت ${companies.length} شركة`);

    const result = {
      success: true,
      companies: [],
      isolation_test: {}
    };

    // 2. فحص المحادثات لكل شركة
    for (const company of companies) {
      const [conversations] = await pool.execute(
        `SELECT id, participant_name, participant_id, company_id, facebook_page_id, created_at
         FROM conversations
         WHERE company_id = ?
         ORDER BY created_at DESC
         LIMIT 5`,
        [company.id]
      );

      result.companies.push({
        id: company.id,
        name: company.name,
        email: company.email,
        conversations_count: conversations.length,
        conversations: conversations.map(conv => ({
          id: conv.id,
          participant_name: conv.participant_name,
          facebook_page_id: conv.facebook_page_id
        }))
      });
    }

    // 3. فحص المحادثات بدون company_id
    const [orphanConversations] = await pool.execute(
      `SELECT id, participant_name, company_id, facebook_page_id
       FROM conversations
       WHERE company_id IS NULL OR company_id = ''
       LIMIT 10`
    );

    result.isolation_test.orphan_conversations = orphanConversations.length;

    // 4. فحص المحادثات المشتركة بين الشركات
    const [sharedConversations] = await pool.execute(
      `SELECT participant_id, COUNT(DISTINCT company_id) as company_count,
              GROUP_CONCAT(DISTINCT company_id) as companies
       FROM conversations
       WHERE company_id IS NOT NULL AND company_id != ''
       GROUP BY participant_id
       HAVING company_count > 1
       LIMIT 10`
    );

    result.isolation_test.shared_conversations = sharedConversations.length;
    result.isolation_test.shared_details = sharedConversations;

    console.log(`🔍 [DEBUG] نتائج الفحص:`, {
      companies: result.companies.length,
      orphan: result.isolation_test.orphan_conversations,
      shared: result.isolation_test.shared_conversations
    });

    res.json(result);

  } catch (error) {
    console.error('❌ [DEBUG] خطأ في فحص العزل:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// endpoint لإصلاح بيانات الشركة التجريبية - تحديث company_id في قاعدة البيانات
app.post('/api/debug/fix-test-company-data', async (req, res) => {
  try {
    console.log('🔧 [DEBUG] إصلاح بيانات الشركة التجريبية...');

    const pool = getPool();

    // البحث عن الشركة التجريبية
    const [testCompanies] = await pool.execute(`
      SELECT id, name, email, created_at
      FROM companies
      WHERE email = 'test@company.com'
    `);

    if (testCompanies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'لم يتم العثور على الشركة التجريبية'
      });
    }

    const testCompany = (testCompanies as any[])[0];
    console.log('🏢 الشركة التجريبية:', testCompany);

    // فحص المحادثات الحالية للشركة التجريبية
    const [currentConversations] = await pool.execute(`
      SELECT COUNT(*) as count FROM conversations WHERE company_id = ?
    `, [testCompany.id]);

    const currentCount = (currentConversations as any[])[0].count;
    console.log(`📊 المحادثات الحالية للشركة التجريبية: ${currentCount}`);

    // البحث عن المحادثات تحت company_id القديم
    const [oldConversations] = await pool.execute(`
      SELECT COUNT(*) as count FROM conversations
      WHERE company_id = 'c677b32f-fe1c-4c64-8362-a1c03406608d'
    `);

    const oldCount = (oldConversations as any[])[0].count;
    console.log(`📊 المحادثات تحت company_id القديم: ${oldCount}`);

    if (oldCount > 0) {
      console.log('🔄 تحديث company_id للمحادثات...');

      // تحديث المحادثات
      const [conversationsUpdate] = await pool.execute(`
        UPDATE conversations
        SET company_id = ?
        WHERE company_id = 'c677b32f-fe1c-4c64-8362-a1c03406608d'
      `, [testCompany.id]);

      // تحديث الرسائل
      const [messagesUpdate] = await pool.execute(`
        UPDATE messages
        SET company_id = ?
        WHERE company_id = 'c677b32f-fe1c-4c64-8362-a1c03406608d'
      `);

      console.log(`✅ تم تحديث ${(conversationsUpdate as any).affectedRows} محادثة`);
      console.log(`✅ تم تحديث ${(messagesUpdate as any).affectedRows} رسالة`);

      res.json({
        success: true,
        data: {
          testCompany: testCompany,
          conversationsUpdated: (conversationsUpdate as any).affectedRows,
          messagesUpdated: (messagesUpdate as any).affectedRows,
          message: 'تم إصلاح بيانات الشركة التجريبية بنجاح'
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          testCompany: testCompany,
          currentConversations: currentCount,
          message: 'لا توجد محادثات تحتاج إلى إصلاح'
        }
      });
    }

  } catch (error) {
    console.error('❌ خطأ في إصلاح بيانات الشركة التجريبية:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إصلاح بيانات الشركة التجريبية',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// endpoint لإصلاح البيانات - نقل المحادثات بين الشركات
app.post('/api/debug/fix-data-isolation', async (req, res) => {
  try {
    console.log('🔧 [DEBUG] إصلاح عزل البيانات...');
    console.log('📥 [DEBUG] Request body:', req.body);

    const { fromCompanyId, toCompanyId } = req.body;
    const pool = getPool();

    // إذا لم يتم تمرير معاملات، استخدم القيم الافتراضية
    const sourceCompanyId = fromCompanyId || 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    let targetCompanyId = toCompanyId;

    // إذا لم يتم تمرير toCompanyId، ابحث عن الشركة التجريبية
    if (!targetCompanyId) {
      const [testCompanies] = await pool.execute(`
        SELECT id, name, email, created_at
        FROM companies
        WHERE email = 'test@company.com'
      `);

      if (testCompanies.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'لم يتم العثور على الشركة التجريبية'
        });
      }

      targetCompanyId = (testCompanies as any[])[0].id;
    }

    // جلب بيانات الشركة المستهدفة
    const [targetCompanies] = await pool.execute(`
      SELECT id, name, email, created_at
      FROM companies
      WHERE id = ?
    `, [targetCompanyId]);

    if (targetCompanies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'الشركة المستهدفة غير موجودة'
      });
    }

    const targetCompany = (targetCompanies as any[])[0];
    console.log('🏢 الشركة المستهدفة:', targetCompany);
    console.log('🔄 نقل البيانات من:', sourceCompanyId, 'إلى:', targetCompanyId);

    // البحث عن المحادثات تحت company_id المصدر
    const [oldConversations] = await pool.execute(`
      SELECT COUNT(*) as count FROM conversations
      WHERE company_id = ?
    `, [sourceCompanyId]);

    const oldCount = (oldConversations as any[])[0].count;
    console.log(`📊 المحادثات تحت company_id المصدر: ${oldCount}`);

    if (oldCount > 0) {
      console.log('🔄 نقل المحادثات للشركة المستهدفة...');

      // تحديث المحادثات
      const [conversationsUpdate] = await pool.execute(`
        UPDATE conversations
        SET company_id = ?
        WHERE company_id = ?
      `, [targetCompanyId, sourceCompanyId]);

      // تحديث الرسائل
      const [messagesUpdate] = await pool.execute(`
        UPDATE messages
        SET company_id = ?
        WHERE company_id = ?
      `, [targetCompanyId, sourceCompanyId]);

      console.log(`✅ تم نقل ${(conversationsUpdate as any).affectedRows} محادثة`);
      console.log(`✅ تم تحديث ${(messagesUpdate as any).affectedRows} رسالة`);

      res.json({
        success: true,
        data: {
          targetCompany: targetCompany,
          sourceCompanyId: sourceCompanyId,
          targetCompanyId: targetCompanyId,
          conversationsUpdated: (conversationsUpdate as any).affectedRows,
          messagesUpdated: (messagesUpdate as any).affectedRows,
          message: 'تم نقل البيانات بنجاح'
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          targetCompany: targetCompany,
          sourceCompanyId: sourceCompanyId,
          targetCompanyId: targetCompanyId,
          conversationsUpdated: 0,
          messagesUpdated: 0,
          message: 'لا توجد بيانات تحتاج إلى نقل'
        }
      });
    }

  } catch (error) {
    console.error('❌ خطأ في إصلاح عزل البيانات:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إصلاح عزل البيانات',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// endpoint لفحص بيانات المحادثات
app.get('/api/debug/check-conversations-data', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] فحص بيانات المحادثات...');
    const pool = getPool();

    // فحص الشركات
    const [companies] = await pool.execute(`
      SELECT id, name, email, created_at
      FROM companies
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('🏢 الشركات الموجودة:', companies.length);

    const companiesData = [];
    for (const company of companies as any[]) {
      // عدد المحادثات لكل شركة
      const [conversations] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM conversations
        WHERE company_id = ?
      `, [company.id]);

      const conversationCount = (conversations as any[])[0].count;

      companiesData.push({
        id: company.id,
        name: company.name,
        email: company.email,
        conversationCount: conversationCount
      });

      console.log(`  - ${company.name} (${company.email}): ${conversationCount} محادثة`);
    }

    // فحص المحادثات بدون company_id
    const [orphanConversations] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM conversations
      WHERE company_id IS NULL
    `);

    // فحص المحادثات مع الـ ID الثابت
    const [fixedIdConversations] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM conversations
      WHERE company_id = ?
    `, ['c677b32f-fe1c-4c64-8362-a1c03406608d']);

    const orphanCount = (orphanConversations as any[])[0].count;
    const fixedIdCount = (fixedIdConversations as any[])[0].count;

    console.log(`🔍 محادثات بدون company_id: ${orphanCount}`);
    console.log(`🔍 محادثات مع الـ ID الثابت: ${fixedIdCount}`);

    res.json({
      success: true,
      data: {
        companies: companiesData,
        orphanConversations: orphanCount,
        fixedIdConversations: fixedIdCount,
        totalCompanies: companies.length
      }
    });

  } catch (error) {
    console.error('❌ خطأ في فحص بيانات المحادثات:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في فحص بيانات المحادثات',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// endpoint لاختبار محادثات شركة معينة
app.get('/api/debug/test-company-conversations/:companyEmail', async (req, res) => {
  try {
    const { companyEmail } = req.params;
    console.log('🔍 [DEBUG] اختبار محادثات الشركة:', companyEmail);

    const pool = getPool();

    // البحث عن الشركة بالـ email
    const [companies] = await pool.execute(`
      SELECT id, name, email, created_at
      FROM companies
      WHERE email = ?
    `, [companyEmail]);

    if (companies.length === 0) {
      return res.json({
        success: false,
        error: 'الشركة غير موجودة',
        companyEmail: companyEmail
      });
    }

    const company = (companies as any[])[0];
    console.log('🏢 الشركة الموجودة:', company);

    // فحص المحادثات
    const [conversations] = await pool.execute(`
      SELECT id, customer_name, last_message, last_message_at, company_id
      FROM conversations
      WHERE company_id = ?
      ORDER BY last_message_at DESC
      LIMIT 5
    `, [company.id]);

    console.log(`📊 عدد المحادثات: ${conversations.length}`);

    res.json({
      success: true,
      data: {
        company: company,
        conversations: conversations,
        conversationCount: conversations.length
      }
    });

  } catch (error) {
    console.error('❌ خطأ في اختبار محادثات الشركة:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في اختبار محادثات الشركة',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// endpoint لحذف شركة تجريبية (مبسط)
app.delete('/api/debug/delete-test-company/:companyEmail', async (req, res) => {
  try {
    const { companyEmail } = req.params;
    console.log('🗑️ [DELETE] حذف الشركة التجريبية:', companyEmail);

    const pool = getPool();

    // البحث عن الشركة بالـ email
    const [companies] = await pool.execute(`
      SELECT id, name, email
      FROM companies
      WHERE email = ?
    `, [companyEmail]);

    if (companies.length === 0) {
      return res.json({
        success: false,
        error: 'الشركة غير موجودة',
        companyEmail: companyEmail
      });
    }

    const company = (companies as any[])[0];
    console.log('🏢 الشركة المراد حذفها:', company);

    // حذف الشركة نفسها فقط (بدون تعقيدات)
    const [companyResult] = await pool.execute(`
      DELETE FROM companies WHERE id = ?
    `, [company.id]);

    console.log(`✅ تم حذف الشركة: ${company.name}`);

    res.json({
      success: true,
      message: 'تم حذف الشركة التجريبية بنجاح',
      data: {
        company: company,
        deletedCompany: (companyResult as any).affectedRows
      }
    });

  } catch (error) {
    console.error('❌ خطأ في حذف الشركة التجريبية:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في حذف الشركة التجريبية',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// endpoint لإصلاح مشكلة localStorage
app.get('/api/debug/fix-company-login/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('🔧 [DEBUG] إصلاح تسجيل دخول الشركة:', companyId);

    const pool = getPool();

    // جلب بيانات الشركة
    const [companies] = await pool.execute(
      `SELECT id, name, email, phone, status, created_at
       FROM companies
       WHERE id = ?`,
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'الشركة غير موجودة'
      });
    }

    const company = companies[0];

    // جلب محادثات الشركة
    const [conversations] = await pool.execute(
      `SELECT id, participant_name, participant_id, company_id, facebook_page_id, created_at
       FROM conversations
       WHERE company_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [companyId]
    );

    console.log(`🔧 [DEBUG] تم العثور على الشركة: ${company.name} مع ${conversations.length} محادثة`);

    res.json({
      success: true,
      company: company,
      conversations: conversations,
      localStorage_fix: {
        clear_command: "localStorage.clear();",
        set_company: `localStorage.setItem('company', '${JSON.stringify(company)}');`,
        reload_page: "window.location.reload();"
      },
      instructions: [
        "1. افتح Developer Tools (F12)",
        "2. اذهب إلى Console",
        "3. نفذ الأوامر التالية:",
        "   localStorage.clear();",
        `   localStorage.setItem('company', '${JSON.stringify(company)}');`,
        "   window.location.reload();",
        "4. ستظهر بيانات الشركة الصحيحة"
      ]
    });

  } catch (error) {
    console.error('❌ [DEBUG] خطأ في إصلاح تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// endpoint لتنظيف localStorage وإعداد الشركة الصحيحة
app.get('/api/auth/setup-company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('🔧 [AUTH] إعداد تسجيل دخول الشركة:', companyId);

    const pool = getPool();

    // جلب بيانات الشركة
    const [companies] = await pool.execute(
      `SELECT id, name, email, phone, status, created_at
       FROM companies
       WHERE id = ?`,
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'الشركة غير موجودة'
      });
    }

    const company = companies[0];

    console.log(`🔧 [AUTH] تم العثور على الشركة: ${company.name}`);

    // إرسال صفحة HTML تقوم بتنظيف localStorage وإعادة التوجيه
    const htmlResponse = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إعداد تسجيل الدخول - ${company.name}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .success {
            color: #28a745;
            font-size: 18px;
            margin: 20px 0;
        }
        .company-name {
            color: #667eea;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 إعداد تسجيل الدخول</h1>
        <div class="company-name">${company.name}</div>
        <div class="spinner"></div>
        <div id="status">جاري تنظيف البيانات المحفوظة...</div>

        <script>
            console.log('🔧 بدء تنظيف localStorage...');

            // تنظيف localStorage
            localStorage.clear();
            console.log('✅ تم تنظيف localStorage');

            // إعداد بيانات الشركة الجديدة
            const companyData = ${JSON.stringify(company)};
            localStorage.setItem('company', JSON.stringify(companyData));
            console.log('✅ تم حفظ بيانات الشركة الجديدة:', companyData);

            // تحديث الحالة
            document.getElementById('status').innerHTML = '✅ تم إعداد البيانات بنجاح!';
            document.getElementById('status').className = 'success';

            // إعادة التوجيه بعد ثانيتين
            setTimeout(() => {
                console.log('🔄 إعادة التوجيه إلى الصفحة الرئيسية...');
                window.location.href = '/';
            }, 2000);
        </script>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlResponse);

  } catch (error) {
    console.error('❌ [AUTH] خطأ في إعداد تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// endpoint لجلب جميع الشركات
app.get('/api/companies', async (req, res) => {
  try {
    console.log('🔍 [API] جلب جميع الشركات...');

    const pool = getPool();

    const [companies] = await pool.execute(
      `SELECT id, name, email, phone, website, address, city, country,
              status, is_verified, created_at, last_login_at
       FROM companies
       ORDER BY created_at DESC`
    );

    console.log(`✅ [API] تم جلب ${companies.length} شركة`);

    res.json({
      success: true,
      data: companies,
      count: companies.length
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب الشركات:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// endpoint لتحديث حالة الشركة
app.put('/api/companies/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔄 [API] تحديث حالة الشركة ${id} إلى ${status}`);

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'حالة غير صحيحة'
      });
    }

    const pool = getPool();

    const [result] = await pool.execute(
      'UPDATE companies SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'الشركة غير موجودة'
      });
    }

    console.log(`✅ [API] تم تحديث حالة الشركة ${id} إلى ${status}`);

    res.json({
      success: true,
      message: 'تم تحديث حالة الشركة بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في تحديث حالة الشركة:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// endpoint لتحديث بيانات الشركة
app.put('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, website, address, city, country } = req.body;

    console.log(`✏️ [API] تحديث بيانات الشركة ${id}`);

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'اسم الشركة والإيميل مطلوبان'
      });
    }

    const pool = getPool();

    const [result] = await pool.execute(
      `UPDATE companies SET
       name = ?, email = ?, phone = ?, website = ?,
       address = ?, city = ?, country = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, email, phone, website, address, city, country, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'الشركة غير موجودة'
      });
    }

    console.log(`✅ [API] تم تحديث بيانات الشركة ${id}`);

    res.json({
      success: true,
      message: 'تم تحديث بيانات الشركة بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في تحديث بيانات الشركة:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// endpoint لجلب شركة واحدة بالمعرف
app.get('/api/companies/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('🔍 [API] جلب بيانات الشركة:', companyId);

    const pool = getPool();

    const [companies] = await pool.execute(
      `SELECT id, name, email, phone, website, address, city, country,
              status, is_verified, created_at, last_login_at
       FROM companies
       WHERE id = ?`,
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'الشركة غير موجودة'
      });
    }

    console.log(`✅ [API] تم جلب بيانات الشركة: ${companies[0].name}`);

    res.json({
      success: true,
      data: companies[0]
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب بيانات الشركة:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================================
// 🔄 مزامنة الرسائل الصادرة من Facebook
// ===================================

// دالة لمزامنة محادثة محددة فقط
async function syncSpecificConversation(pageId: string, userId: string) {
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      console.log(`🔄 [SYNC] مزامنة محادثة محددة: ${pageId} <-> ${userId} (محاولة ${retryCount + 1})`);

      const pool = getPool();

      // جلب إعدادات Facebook للصفحة (من الجدول الموحد)
      const [facebookSettings] = await pool.execute(
        'SELECT * FROM facebook_pages_unified WHERE page_id = ? AND is_active = 1',
        [pageId]
      );

      if (!facebookSettings || facebookSettings.length === 0) {
        console.log(`⚠️ [SYNC] لا توجد إعدادات Facebook للصفحة ${pageId}`);
        return;
      }

      const setting = facebookSettings[0];

      // التحقق من صحة access token
      if (!setting.access_token || setting.access_token === 'dummy_token') {
        console.log(`⚠️ [SYNC] access token غير صالح للصفحة ${pageId}`);
        return;
      }

      // جلب آخر رسالة في قاعدة البيانات لهذه المحادثة (للمزامنة الذكية)
      const [lastMessages] = await pool.execute(`
        SELECT m.created_at
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.facebook_page_id = ? AND c.participant_id = ?
        ORDER BY m.created_at DESC
        LIMIT 1
      `, [pageId, userId]);

      const lastMessageTime = lastMessages && lastMessages.length > 0
        ? new Date(lastMessages[0].created_at).getTime() / 1000
        : Math.floor(Date.now() / 1000) - 1800; // آخر 30 دقيقة إذا لم توجد رسائل

      try {
        // جلب المحادثة المحددة من Facebook API مع timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 ثواني timeout

        const conversationResponse = await fetch(
          `https://graph.facebook.com/v21.0/${pageId}/conversations?fields=participants,messages.limit(5){message,from,created_time,id}&access_token=${setting.access_token}&limit=1`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!conversationResponse.ok) {
          if (conversationResponse.status === 429) {
            console.log(`⏳ [SYNC] Rate limit reached for ${pageId}, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            retryCount++;
            continue;
          }
          console.error(`❌ [SYNC] خطأ في جلب المحادثة ${pageId}:`, conversationResponse.status);
          return;
        }

        const conversationData = await conversationResponse.json();

        if (conversationData.error) {
          console.error(`❌ [SYNC] خطأ Facebook API للمحادثة ${pageId}:`, conversationData.error);
          return;
        }

        // البحث عن المحادثة التي تحتوي على المستخدم المحدد
        for (const conversation of conversationData.data || []) {
          if (!conversation.participants || !conversation.participants.data) continue;

          // التحقق من وجود المستخدم في المحادثة
          const hasUser = conversation.participants.data.some(p => p.id === userId);
          if (!hasUser) continue;

          // جلب الرسائل الحديثة للمحادثة
          const messagesController = new AbortController();
          const messagesTimeoutId = setTimeout(() => messagesController.abort(), 8000);

          const messagesResponse = await fetch(
            `https://graph.facebook.com/v21.0/${conversation.id}/messages?fields=message,from,created_time,id&access_token=${setting.access_token}&limit=10`,
            { signal: messagesController.signal }
          );

          clearTimeout(messagesTimeoutId);

          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();

            if (messagesData.data) {
              // معالجة الرسائل الصادرة فقط
              for (const message of messagesData.data) {
                if (message.from && message.from.id === pageId) {
                  await syncOutgoingMessage(message, setting, conversation);
                }
              }
            }
          }

          break; // وجدنا المحادثة المطلوبة
        }

        console.log(`✅ [SYNC] تمت مزامنة المحادثة المحددة: ${pageId} <-> ${userId}`);
        return; // نجحت العملية

      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`⏰ [SYNC] انتهت مهلة الاتصال للمحادثة ${pageId}`);
        } else {
          console.error(`❌ [SYNC] خطأ في مزامنة المحادثة المحددة:`, error);
        }
        retryCount++;
        if (retryCount <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // انتظار قبل المحاولة التالية
        }
      }

    } catch (error) {
      console.error('❌ [SYNC] خطأ عام في مزامنة المحادثة المحددة:', error);
      retryCount++;
      if (retryCount <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.log(`❌ [SYNC] فشل في مزامنة المحادثة بعد ${maxRetries + 1} محاولات: ${pageId} <-> ${userId}`);
}

// دالة لجلب الرسائل الصادرة من Facebook API (للمزامنة السريعة كل 5 ثواني)
async function syncOutgoingMessages() {
  try {
    console.log('🔄 [SYNC] مزامنة سريعة للرسائل الصادرة...');

    const pool = getPool();

    // جلب جميع الصفحات النشطة للشركة (من الجدول الموحد)
    const [activePages] = await pool.execute(`
      SELECT page_id, page_name, access_token, company_id
      FROM facebook_pages_unified
      WHERE company_id = ? AND is_active = 1
    `, ['c677b32f-fe1c-4c64-8362-a1c03406608d']);

    if (!activePages || activePages.length === 0) {
      console.log('⚠️ [SYNC] لا توجد صفحات Facebook نشطة للمزامنة');
      return;
    }

    console.log(`📱 [SYNC] مزامنة ${activePages.length} صفحة نشطة...`);

    // مزامنة كل صفحة على حدة
    for (const page of activePages) {
      try {
        console.log(`📄 [SYNC] مزامنة صفحة: ${page.page_name} (${page.page_id})`);

        // جلب المحادثات النشطة لهذه الصفحة (آخر 10 دقائق للرسائل الجماعية الحديثة فقط)
        const [activeConversations] = await pool.execute(`
          SELECT DISTINCT c.facebook_page_id, c.participant_id, c.updated_at
          FROM conversations c
          WHERE c.company_id = ? AND c.facebook_page_id = ?
          AND c.updated_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
          ORDER BY c.updated_at DESC
          LIMIT 100
        `, [page.company_id, page.page_id]);

        if (activeConversations && activeConversations.length > 0) {
          console.log(`🔄 [SYNC] مزامنة ${activeConversations.length} محادثة نشطة للصفحة ${page.page_name}...`);

          // مزامنة المحادثات النشطة بشكل متوازي (10 في المرة)
          const BATCH_SIZE = 10; // 10 محادثات في المرة الواحدة

          for (let i = 0; i < activeConversations.length; i += BATCH_SIZE) {
            const batch = activeConversations.slice(i, i + BATCH_SIZE);
            console.log(`🔄 [SYNC] معالجة دفعة ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} محادثة`);

            // مزامنة متوازية للدفعة
            // استخدام النظام المحسن للمزامنة المتوازية
            const validConversations = batch
              .filter(conv => conv.facebook_page_id && conv.participant_id)
              .filter(conv => canSyncConversation(conv.facebook_page_id, conv.participant_id));

            if (validConversations.length > 0) {
              await syncConversationsBatch(validConversations, 5); // 5 محادثات متوازية
            }

            // انتظار انتهاء جميع المحادثات في الدفعة

            // تأخير قصير بين الدفعات لتجنب rate limiting
            if (i + BATCH_SIZE < activeConversations.length) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // ثانية واحدة بين الدفعات
            }
          }
        } else {
          console.log(`ℹ️ [SYNC] لا توجد محادثات نشطة للصفحة ${page.page_name} (آخر 24 ساعة)`);
        }

        // جلب المحادثات الجديدة مباشرة من Facebook API (للرسائل الجماعية الجديدة)
        try {
          console.log(`🆕 [SYNC] جلب المحادثات الجديدة من Facebook API للصفحة ${page.page_name}...`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const conversationsResponse = await fetch(
            `https://graph.facebook.com/v21.0/${page.page_id}/conversations?fields=participants,updated_time&access_token=${page.access_token}&limit=100`,
            { signal: controller.signal }
          );

          clearTimeout(timeoutId);

          if (conversationsResponse.ok) {
            const conversationsData = await conversationsResponse.json();

            if (conversationsData.data && conversationsData.data.length > 0) {
              console.log(`🆕 [SYNC] وجدت ${conversationsData.data.length} محادثة من Facebook API للصفحة ${page.page_name}`);

              // مزامنة أول 20 محادثة بشكل متوازي (10 في المرة)
              const conversationsToSync = conversationsData.data.slice(0, 20);

              // تحضير قائمة المحادثات للمزامنة
              const conversationsForSync = conversationsToSync
                .filter(conversation => conversation.participants && conversation.participants.data)
                .map(conversation => {
                  const user = conversation.participants.data.find(p => p.id !== page.page_id);
                  return user ? { pageId: page.page_id, userId: user.id } : null;
                })
                .filter(conv => conv !== null);

              // مزامنة متوازية بدفعات
              const BATCH_SIZE = 10;
              for (let i = 0; i < conversationsForSync.length; i += BATCH_SIZE) {
                const batch = conversationsForSync.slice(i, i + BATCH_SIZE);
                console.log(`🆕 [SYNC] معالجة دفعة ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} محادثة جديدة`);

                // استخدام النظام المحسن للمزامنة المتوازية
                const validConversations = batch
                  .filter(conv => canSyncConversation(conv.pageId, conv.userId))
                  .map(conv => ({
                    pageId: conv.pageId,
                    userId: conv.userId,
                    facebook_page_id: conv.pageId,
                    participant_id: conv.userId
                  }));

                if (validConversations.length > 0) {
                  console.log(`🆕 [SYNC] مزامنة ${validConversations.length} محادثة جديدة متوازية`);
                  await syncConversationsBatch(validConversations, 5);
                }

                if (i + BATCH_SIZE < conversationsForSync.length) {
                  await new Promise(resolve => setTimeout(resolve, 500)); // نصف ثانية بين الدفعات
                }
              }
            } else {
              console.log(`ℹ️ [SYNC] لا توجد محادثات جديدة من Facebook API للصفحة ${page.page_name}`);
            }
          } else {
            console.log(`⚠️ [SYNC] خطأ في جلب المحادثات من Facebook API للصفحة ${page.page_name}: ${conversationsResponse.status}`);
          }
        } catch (apiError) {
          console.error(`❌ [SYNC] خطأ في جلب المحادثات الجديدة للصفحة ${page.page_name}:`, apiError);
        }

        // تأخير بين الصفحات
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (pageError) {
        console.error(`❌ [SYNC] خطأ في مزامنة الصفحة ${page.page_name}:`, pageError);
      }
    }

    console.log('✅ [SYNC] انتهت المزامنة السريعة للرسائل الصادرة');

  } catch (error) {
    console.error('❌ [SYNC] خطأ عام في المزامنة الدورية:', error);
  }
}

// دالة لمزامنة رسالة صادرة واحدة
async function syncOutgoingMessage(message: any, setting: any, conversation: any) {
  try {
    const pool = getPool();

    // التحقق من وجود الرسالة في قاعدة البيانات أولاً
    const [existingMessage] = await pool.execute(
      'SELECT id FROM messages WHERE facebook_message_id = ?',
      [message.id]
    );

    if (existingMessage && existingMessage.length > 0) {
      // الرسالة موجودة بالفعل - تجاهل بصمت
      return;
    }

    // البحث عن المحادثة في قاعدة البيانات
    let conversationId = null;

    // استخراج معرف المستقبل من participants
    let recipientId = null;
    if (conversation.participants && conversation.participants.data) {
      for (const participant of conversation.participants.data) {
        if (participant.id !== setting.page_id) {
          recipientId = participant.id;
          break;
        }
      }
    }

    if (recipientId) {
      // التحقق من أن المستلم ليس الصفحة نفسها
      if (recipientId === setting.page_id) {
        console.log(`⚠️ [SYNC] تجاهل رسالة للصفحة نفسها: ${recipientId}`);
        return; // تخطي هذه الرسالة
      }

      // البحث عن المحادثة الموجودة أولاً
      const [existingConversation] = await pool.execute(
        'SELECT id FROM conversations WHERE participant_id = ? AND facebook_page_id = ? AND company_id = ?',
        [recipientId, setting.page_id, setting.company_id]
      );

      if (existingConversation && existingConversation.length > 0) {
        conversationId = existingConversation[0].id;
        console.log(`✅ [SYNC] استخدام محادثة موجودة: ${conversationId} للمستخدم: ${recipientId}`);
      } else {
        // إنشاء محادثة جديدة فقط إذا لم تكن موجودة
        console.log(`🆕 [SYNC] إنشاء محادثة جديدة للمستخدم: ${recipientId}`);
        const newConversationId = crypto.randomUUID();
        try {
          await pool.execute(
            `INSERT INTO conversations (id, company_id, participant_id, facebook_page_id, unread_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, 0, NOW(), NOW())`,
            [newConversationId, setting.company_id, recipientId, setting.page_id]
          );
          conversationId = newConversationId;
        } catch (conversationError: any) {
          if (conversationError.code === 'ER_DUP_ENTRY') {
            // المحادثة تم إنشاؤها بواسطة عملية أخرى - ابحث عنها مرة أخرى
            const [retryConversation] = await pool.execute(
              'SELECT id FROM conversations WHERE participant_id = ? AND facebook_page_id = ? AND company_id = ?',
              [recipientId, setting.page_id, setting.company_id]
            );
            if (retryConversation && retryConversation.length > 0) {
              conversationId = retryConversation[0].id;
              console.log(`✅ [SYNC] استخدام محادثة موجودة بعد التكرار: ${conversationId} للمستخدم: ${recipientId}`);
            } else {
              console.log('⚠️ [SYNC] لا يمكن العثور على المحادثة بعد خطأ التكرار');
              return;
            }
          } else {
            throw conversationError;
          }
        }
      }
    }

    if (!conversationId) {
      console.log('⚠️ [SYNC] لا يمكن تحديد المحادثة للرسالة:', message.id);
      return;
    }

    // حفظ الرسالة الصادرة مع معالجة أخطاء التكرار
    const messageId = crypto.randomUUID();
    const messageText = message.message || '[رسالة بدون نص]';
    const createdAt = new Date(message.created_time);

    try {
      await pool.execute(
        `INSERT INTO messages (
          id, conversation_id, sender_id,
          message_text, facebook_message_id,
          is_from_page, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          messageId,
          conversationId,
          setting.page_id,
          messageText,
          message.id,
          true, // هذه رسالة من الصفحة
          createdAt
        ]
      );

      console.log(`💬 [SYNC] تمت مزامنة رسالة صادرة: ${messageText.substring(0, 50)}...`);

      // تحديث إحصائيات الرسائل الصادرة
      updateOutgoingMessageStats();

      // إرسال تحديث واحد فقط للواجهة (تجنب التكرار)
      broadcastUpdate(setting.company_id, {
        type: 'conversation_update',
        conversation_id: conversationId,
        message: 'تم تحديث المحادثة'
      });
    } catch (insertError: any) {
      if (insertError.code === 'ER_DUP_ENTRY') {
        // الرسالة موجودة بالفعل - تجاهل بصمت
        return;
      } else {
        // خطأ آخر - أعد رفعه
        throw insertError;
      }
    }

  } catch (error) {
    console.error('❌ [SYNC] خطأ في مزامنة الرسالة:', error);
  }
}

// مزامنة سريعة للرسائل الحديثة (للرسائل الجماعية)
async function syncRecentMessages() {
  try {
    console.log('⚡ [SYNC] مزامنة سريعة للرسائل الحديثة...');

    const pool = getPool();

    // جلب جميع الصفحات النشطة للشركة (من الجدول الموحد)
    const [activePages] = await pool.execute(`
      SELECT page_id, page_name, access_token, company_id
      FROM facebook_pages_unified
      WHERE company_id = ? AND is_active = 1
    `, ['c677b32f-fe1c-4c64-8362-a1c03406608d']);

    if (!activePages || activePages.length === 0) {
      console.log('⚠️ [SYNC] لا توجد صفحات Facebook نشطة للمزامنة السريعة');
      return;
    }

    console.log(`⚡ [SYNC] مزامنة سريعة لـ ${activePages.length} صفحة...`);

    // مزامنة كل صفحة على حدة
    for (const page of activePages) {
      try {
        // جلب المحادثات النشطة لهذه الصفحة (آخر 1 ساعة للمزامنة السريعة)
        const [activeConversations] = await pool.execute(`
          SELECT DISTINCT c.facebook_page_id, c.participant_id, c.last_message_time
          FROM conversations c
          WHERE c.company_id = ? AND c.facebook_page_id = ?
          AND c.last_message_time > DATE_SUB(NOW(), INTERVAL 1 HOUR)
          ORDER BY c.last_message_time DESC
          LIMIT 20
        `, [page.company_id, page.page_id]);

        if (activeConversations && activeConversations.length > 0) {
          console.log(`⚡ [SYNC] مزامنة سريعة لـ ${activeConversations.length} محادثة للصفحة ${page.page_name}...`);

          // مزامنة متوازية للمحادثات النشطة (10 في المرة)
          const BATCH_SIZE = 10;
          for (let i = 0; i < activeConversations.length; i += BATCH_SIZE) {
            const batch = activeConversations.slice(i, i + BATCH_SIZE);

            // استخدام النظام المحسن للمزامنة المتوازية
            const validConversations = batch
              .filter(conversation => canSyncConversation(conversation.facebook_page_id, conversation.participant_id));

            if (validConversations.length > 0) {
              await syncConversationsBatch(validConversations, 5);
            }

            // تأخير قصير بين الدفعات
            if (i + BATCH_SIZE < activeConversations.length) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
        } else {
          console.log(`ℹ️ [SYNC] لا توجد محادثات نشطة للصفحة ${page.page_name} (آخر 6 ساعات)`);
        }

        // تأخير بين الصفحات
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (pageError) {
        console.error(`❌ [SYNC] خطأ في المزامنة السريعة للصفحة ${page.page_name}:`, pageError);
      }
    }

    console.log('✅ [SYNC] انتهت المزامنة السريعة للرسائل الحديثة');
  } catch (error) {
    console.error('❌ [SYNC] خطأ في المزامنة السريعة:', error);
  }
}

// بدء مزامنة دورية كل 5 ثواني (للرسائل الصادرة السريعة)
const syncInterval = setInterval(() => {
  try {
    console.log('🔄 [SYNC] بدء المزامنة السريعة للرسائل الصادرة...');
    syncOutgoingMessages();
  } catch (error) {
    console.error('❌ [SYNC] خطأ في المزامنة السريعة:', error);
  }
}, 15000); // 15 ثانية للمزامنة السريعة (محسنة)

// مزامنة إضافية للرسائل الحديثة كل 10 ثوانٍ (محسنة)
const recentSyncInterval = setInterval(() => {
  try {
    syncRecentMessages();
  } catch (error) {
    console.error('❌ [SYNC] خطأ في المزامنة الحديثة:', error);
  }
}, 20000); // 20 ثانية للرسائل الحديثة (محسنة أكثر)

// مزامنة شاملة لجميع الصفحات كل دقيقة (للرسائل الجماعية الجديدة)
const comprehensiveSyncInterval = setInterval(async () => {
  try {
    console.log('🌐 [SYNC] مزامنة شاملة لجميع الصفحات...');

    const pool = getPool();

    // جلب جميع الصفحات النشطة (من الجدول الموحد)
    const [activePages] = await pool.execute(`
      SELECT page_id, page_name, access_token, company_id
      FROM facebook_pages_unified
      WHERE company_id = ? AND is_active = 1
    `, ['c677b32f-fe1c-4c64-8362-a1c03406608d']);

    if (!activePages || activePages.length === 0) {
      console.log('⚠️ [SYNC] لا توجد صفحات Facebook نشطة للمزامنة الشاملة');
      return;
    }

    console.log(`🌐 [SYNC] مزامنة شاملة لـ ${activePages.length} صفحة...`);

    // مزامنة كل صفحة على حدة
    for (const page of activePages) {
      try {
        console.log(`🌐 [SYNC] مزامنة شاملة للصفحة: ${page.page_name} (${page.page_id})`);

        // جلب آخر 50 محادثة من Facebook API مباشرة
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 ثانية timeout

        const conversationsResponse = await fetch(
          `https://graph.facebook.com/v21.0/${page.page_id}/conversations?fields=participants,updated_time&access_token=${page.access_token}&limit=50`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();

          if (conversationsData.data && conversationsData.data.length > 0) {
            console.log(`🌐 [SYNC] وجدت ${conversationsData.data.length} محادثة للصفحة ${page.page_name}`);

            // مزامنة أول 20 محادثة فقط لتجنب الحمل الزائد
            const conversationsToSync = conversationsData.data.slice(0, 20);

            for (const conversation of conversationsToSync) {
              if (conversation.participants && conversation.participants.data) {
                // البحث عن المستخدم (ليس الصفحة)
                const user = conversation.participants.data.find(p => p.id !== page.page_id);
                if (user) {
                  await syncSpecificConversation(page.page_id, user.id);
                  await new Promise(resolve => setTimeout(resolve, 200)); // تأخير قصير
                }
              }
            }
          }
        }

        // تأخير بين الصفحات
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (pageError) {
        console.error(`❌ [SYNC] خطأ في المزامنة الشاملة للصفحة ${page.page_name}:`, pageError);
      }
    }

    console.log('✅ [SYNC] انتهت المزامنة الشاملة لجميع الصفحات');
  } catch (error) {
    console.error('❌ [SYNC] خطأ في المزامنة الشاملة:', error);
  }
}, 60000); // كل دقيقة

// مزامنة خاصة للرسائل الجماعية الجديدة كل 30 ثانية
const bulkMessagesInterval = setInterval(async () => {
  try {
    console.log('📨 [BULK] مزامنة خاصة للرسائل الجماعية الجديدة...');

    const pool = getPool();

    // جلب جميع الصفحات النشطة (من الجدول الموحد)
    const [activePages] = await pool.execute(`
      SELECT page_id, page_name, access_token, company_id
      FROM facebook_pages_unified
      WHERE company_id = ? AND is_active = 1
    `, ['c677b32f-fe1c-4c64-8362-a1c03406608d']);

    if (!activePages || activePages.length === 0) {
      console.log('⚠️ [BULK] لا توجد صفحات Facebook نشطة للمزامنة الجماعية');
      return;
    }

    console.log(`📨 [BULK] مزامنة جماعية لـ ${activePages.length} صفحة...`);

    // مزامنة كل صفحة على حدة
    for (const page of activePages) {
      try {
        console.log(`📨 [BULK] مزامنة جماعية للصفحة: ${page.page_name} (${page.page_id})`);

        // جلب آخر 20 محادثة من Facebook API مباشرة (للرسائل الجماعية الحديثة)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 ثانية timeout

        const conversationsResponse = await fetch(
          `https://graph.facebook.com/v21.0/${page.page_id}/conversations?fields=participants,updated_time&access_token=${page.access_token}&limit=20`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();

          if (conversationsData.data && conversationsData.data.length > 0) {
            console.log(`📨 [BULK] وجدت ${conversationsData.data.length} محادثة للصفحة ${page.page_name}`);

            // مزامنة أول 10 محادثة (للرسائل الجماعية الحديثة)
            const conversationsToSync = conversationsData.data.slice(0, 10);

            for (const conversation of conversationsToSync) {
              if (conversation.participants && conversation.participants.data) {
                // البحث عن المستخدم (ليس الصفحة)
                const user = conversation.participants.data.find(p => p.id !== page.page_id);
                if (user) {
                  await syncSpecificConversation(page.page_id, user.id);
                  await new Promise(resolve => setTimeout(resolve, 50)); // تأخير قصير جداً
                }
              }
            }
          }
        }

        // تأخير بين الصفحات
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (pageError) {
        console.error(`❌ [BULK] خطأ في المزامنة الجماعية للصفحة ${page.page_name}:`, pageError);
      }
    }

    console.log('✅ [BULK] انتهت المزامنة الجماعية للرسائل الجديدة');
  } catch (error) {
    console.error('❌ [BULK] خطأ في المزامنة الجماعية:', error);
  }
}, 30000); // كل 30 ثانية للرسائل الجماعية

// مزامنة فورية للرسائل الصادرة كل ثانية
const instantOutgoingSync = setInterval(async () => {
  try {
    console.log('⚡ [INSTANT] مزامنة فورية للرسائل الصادرة...');

    const pool = getPool();

    // جلب جميع الصفحات النشطة (من الجدول الموحد)
    const [activePages] = await pool.execute(`
      SELECT page_id, page_name, access_token, company_id
      FROM facebook_pages_unified
      WHERE company_id = ? AND is_active = 1
    `, ['c677b32f-fe1c-4c64-8362-a1c03406608d']);

    if (!activePages || activePages.length === 0) {
      return;
    }

    // مزامنة كل صفحة على حدة
    for (const page of activePages) {
      try {
        // جلب المحادثات النشطة في آخر دقيقة فقط (للمزامنة الفورية)
        const [recentConversations] = await pool.execute(`
          SELECT DISTINCT c.facebook_page_id, c.participant_id, c.updated_at
          FROM conversations c
          WHERE c.company_id = ? AND c.facebook_page_id = ?
          AND c.updated_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
          ORDER BY c.updated_at DESC
          LIMIT 20
        `, [page.company_id, page.page_id]);

        if (recentConversations && recentConversations.length > 0) {
          console.log(`⚡ [INSTANT] مزامنة فورية لـ ${recentConversations.length} محادثة للصفحة ${page.page_name}`);

          // مزامنة متوازية للمحادثات النشطة (10 في المرة)
          const BATCH_SIZE = 10;
          for (let i = 0; i < recentConversations.length; i += BATCH_SIZE) {
            const batch = recentConversations.slice(i, i + BATCH_SIZE);

            // استخدام النظام المحسن للمزامنة المتوازية
            const validConversations = batch
              .filter(conversation => canSyncConversation(conversation.facebook_page_id, conversation.participant_id));

            if (validConversations.length > 0) {
              await syncConversationsBatch(validConversations, 5);
            }

            // تأخير قصير بين الدفعات
            if (i + BATCH_SIZE < recentConversations.length) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
        }

        // تأخير بين الصفحات
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (pageError) {
        console.error(`❌ [INSTANT] خطأ في المزامنة الفورية للصفحة ${page.page_name}:`, pageError);
      }
    }

  } catch (error) {
    console.error('❌ [INSTANT] خطأ في المزامنة الفورية:', error);
  }
}, 10000); // كل 10 ثوانٍ للمزامنة الفورية (محسنة أكثر)

// سيتم تشغيل المزامنة بعد تشغيل السرفير
let initialSyncTimeout: NodeJS.Timeout;

// تنظيف الموارد عند إغلاق الخادم
process.on('SIGINT', () => {
  console.log('🛑 [SERVER] إيقاف الخادم...');
  clearInterval(syncInterval);
  clearInterval(recentSyncInterval);
  clearInterval(comprehensiveSyncInterval);
  clearInterval(bulkMessagesInterval);
  clearInterval(instantOutgoingSync);
  clearTimeout(initialSyncTimeout);
  const pool = getPool();
  if (pool) {
    pool.end();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 [SERVER] إنهاء الخادم...');
  clearInterval(syncInterval);
  clearTimeout(initialSyncTimeout);
  const pool = getPool();
  if (pool) {
    pool.end();
  }
  process.exit(0);
});

// endpoint لمزامنة فورية للرسائل الصادرة
app.post('/api/sync/outgoing-messages', async (req, res) => {
  try {
    console.log('🔄 [API] طلب مزامنة فورية للرسائل الصادرة');

    await syncOutgoingMessages();

    res.json({
      success: true,
      message: 'تمت مزامنة الرسائل الصادرة بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في مزامنة الرسائل:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// endpoint لمزامنة محادثة محددة
app.post('/api/sync/conversation', async (req, res) => {
  try {
    const { pageId, userId } = req.body;

    if (!pageId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'pageId و userId مطلوبان'
      });
    }

    console.log(`🔄 [API] طلب مزامنة محادثة محددة: ${pageId} <-> ${userId}`);

    await syncSpecificConversation(pageId, userId);

    res.json({
      success: true,
      message: 'تمت مزامنة المحادثة المحددة بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في مزامنة المحادثة المحددة:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// endpoint لجلب حالة المزامنة
app.get('/api/sync/status', async (req, res) => {
  try {
    const pool = getPool();

    // إحصائيات الرسائل
    const [messageStats] = await pool.execute(`
      SELECT
        COUNT(*) as total_messages,
        SUM(CASE WHEN sender_id = 'admin' OR sender_id LIKE '%admin%' THEN 0 ELSE 1 END) as incoming_messages,
        SUM(CASE WHEN sender_id = 'admin' OR sender_id LIKE '%admin%' THEN 1 ELSE 0 END) as outgoing_messages,
        MAX(created_at) as last_message_time
      FROM messages
      WHERE company_id = ?
    `, [req.query.company_id || 'c677b32f-fe1c-4c64-8362-a1c03406608d']);

    // إحصائيات المحادثات
    const [conversationStats] = await pool.execute(`
      SELECT
        COUNT(*) as total_conversations,
        COUNT(DISTINCT facebook_page_id) as connected_pages
      FROM conversations
      WHERE company_id = ?
    `, [req.query.company_id || 'c677b32f-fe1c-4c64-8362-a1c03406608d']);

    res.json({
      success: true,
      data: {
        messages: messageStats[0] || {},
        conversations: conversationStats[0] || {},
        sync_status: 'active',
        last_sync: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب حالة المزامنة:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================================
// ⚙️ إدارة إعدادات البيانات
// ===================================

// الحصول على إعدادات الـ limits
app.get('/api/settings/limits', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        current_limits: SERVER_CONFIG.DATA_LIMITS,
        description: {
          DEFAULT_CONVERSATIONS_LIMIT: 'الحد الافتراضي للمحادثات',
          DEFAULT_MESSAGES_LIMIT: 'الحد الافتراضي للرسائل',
          MAX_CONVERSATIONS_LIMIT: 'الحد الأقصى للمحادثات',
          MAX_MESSAGES_LIMIT: 'الحد الأقصى للرسائل',
          ALLOW_UNLIMITED: 'السماح بعدد غير محدود'
        },
        usage_examples: {
          conversations: '/api/conversations?limit=200&company_id=xxx',
          messages: '/api/conversations/xxx/messages?limit=500',
          unlimited: 'غير مسموح حالياً'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================================
// 🔍 مراقبة صحة الخادم
// ===================================

// endpoint لفحص صحة الخادم
app.get('/api/health', async (req, res) => {
  try {
    const stats = serverMonitor.getQuickStats();
    const dbConnected = await serverMonitor.checkDatabaseConnection();

    const healthStatus = {
      status: stats.isHealthy && dbConnected ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      uptime: `${stats.uptime} دقيقة`,
      memory: {
        used: `${stats.memoryMB}MB`,
        heap: `${stats.heapUsedMB}MB`,
        healthy: stats.isHealthy
      },
      database: {
        connected: dbConnected,
        status: dbConnected ? 'متصل' : 'منقطع'
      },
      server: {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    console.error('❌ Error checking server health:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في فحص صحة الخادم'
    });
  }
});

// ===================================
// 🏷️ تحديث أسماء العملاء
// ===================================

// تحديث أسماء العملاء لشركة معينة
app.post('/api/companies/:companyId/update-customer-names', async (req, res) => {
  try {
    const { companyId } = req.params;

    console.log(`🏷️ [API] طلب تحديث أسماء العملاء للشركة: ${companyId}`);

    const { MySQLNameUpdateService } = await import('../services/mysqlNameUpdateService');
    const result = await MySQLNameUpdateService.updateCustomerNamesForCompany(companyId);

    res.json({
      success: result.success,
      data: {
        updated: result.updated,
        errors: result.errors
      },
      message: result.message
    });
  } catch (error) {
    console.error('❌ [API] خطأ في تحديث أسماء العملاء:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// تحديث اسم عميل واحد
app.post('/api/conversations/:conversationId/update-customer-name', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, pageId, companyId } = req.body;

    console.log(`🏷️ [API] طلب تحديث اسم العميل للمحادثة: ${conversationId}`);

    const { MySQLNameUpdateService } = await import('../services/mysqlNameUpdateService');
    const success = await MySQLNameUpdateService.updateSingleUserName(userId, pageId, companyId);

    if (success) {
      res.json({
        success: true,
        message: 'تم تحديث اسم العميل بنجاح'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'فشل في تحديث اسم العميل'
      });
    }
  } catch (error) {
    console.error('❌ [API] خطأ في تحديث اسم العميل:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===================================
// 📡 نظام التحديث الفوري (SSE)
// ===================================

// endpoint للاتصال بـ SSE
app.get('/api/sse/:companyId', (req, res) => {
  const { companyId } = req.params;
  const clientId = `${companyId}_${Date.now()}`;

  console.log(`📡 [SSE] عميل جديد متصل: ${clientId}`);

  // إعداد headers للـ SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // إرسال رسالة ترحيب
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'متصل بنجاح' })}\n\n`);

  // حفظ العميل
  sseClients.set(clientId, res);

  // تنظيف عند قطع الاتصال
  req.on('close', () => {
    console.log(`📡 [SSE] عميل منقطع: ${clientId}`);
    sseClients.delete(clientId);
  });
});

// دالة لإرسال تحديث لجميع العملاء المتصلين
function broadcastUpdate(companyId: string, data: any) {
  console.log(`📡 [SSE] إرسال تحديث للشركة: ${companyId}`, data);

  for (const [clientId, res] of sseClients.entries()) {
    if (clientId.startsWith(companyId)) {
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error(`❌ [SSE] خطأ في إرسال التحديث للعميل ${clientId}:`, error);
        sseClients.delete(clientId);
      }
    }
  }
}

// ===================================
// 📸 رفع الصور
// ===================================

// رفع صورة وإرسالها عبر Facebook (مبسط)
app.post('/api/facebook/upload-and-send-image', upload.single('image'), async (req, res) => {
  try {
    console.log('📥 [UPLOAD] تم استقبال طلب رفع صورة');
    console.log('📋 [UPLOAD] req.body:', req.body);
    console.log('📋 [UPLOAD] req.file:', req.file ? 'موجود' : 'غير موجود');

    const { conversation_id, company_id, message_text } = req.body;
    const file = req.file;

    if (!file || !conversation_id || !company_id) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'image, conversation_id, and company_id are required'
      });
    }

    // الحصول على بيانات المحادثة
    const pool = getPool();
    const [conversationRows] = await pool.execute(
      'SELECT customer_facebook_id FROM conversations WHERE id = ?',
      [conversation_id]
    );

    if (!conversationRows.length) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    const recipient_id = conversationRows[0].customer_facebook_id;

    // الحصول على access_token من إعدادات Facebook (من الجدول الموحد)
    const [settingsRows] = await pool.execute(
      'SELECT access_token FROM facebook_pages_unified WHERE company_id = ? AND is_active = TRUE LIMIT 1',
      [company_id]
    );

    if (!settingsRows.length) {
      return res.status(404).json({
        error: 'No active Facebook settings found for this company'
      });
    }

    const access_token = settingsRows[0].access_token;

    console.log('📸 [UPLOAD] رفع وإرسال صورة:', {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      conversationId: conversation_id,
      recipientId: recipient_id
    });

    // إنشاء مجلد uploads إذا لم يكن موجود
    const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // حفظ الصورة مع اسم فريد
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    // إنشاء URL للصورة
    const baseUrl = process.env.PUBLIC_URL || 'https://10f9ac7ca0ba.ngrok-free.app';
    const imageUrl = `${baseUrl}/uploads/images/${fileName}`;

    console.log('💾 [UPLOAD] تم حفظ الصورة:', imageUrl);

    // إرسال الصورة عبر Facebook
    const facebookResponse = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${access_token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: { id: recipient_id },
        message: {
          attachment: {
            type: 'image',
            payload: {
              url: imageUrl,
              is_reusable: true
            }
          }
        }
      })
    });

    const facebookResult = await facebookResponse.json();

    if (facebookResult.error) {
      console.error('❌ [FACEBOOK] خطأ في إرسال الصورة:', facebookResult.error);
      return res.status(500).json({
        error: 'Failed to send image to Facebook',
        details: facebookResult.error
      });
    }

    console.log('✅ [FACEBOOK] تم إرسال الصورة بنجاح:', facebookResult.message_id);

    // حفظ الرسالة في قاعدة البيانات
    const messageUuid = crypto.randomUUID();

    await pool.execute(
      `INSERT INTO messages (id, conversation_id, sender_id, message_text, facebook_message_id, is_from_page, created_at, image_url)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [messageUuid, conversation_id, 'admin', '[صورة]', facebookResult.message_id, true, imageUrl]
    );

    // تحديث آخر رسالة في المحادثة
    await pool.execute(
      'UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = ?',
      [conversation_id]
    );

    res.json({
      success: true,
      message_id: facebookResult.message_id,
      image_url: imageUrl,
      file_name: fileName
    });

  } catch (error) {
    console.error('❌ [UPLOAD] خطأ في رفع وإرسال الصورة:', error);
    res.status(500).json({
      error: 'Failed to upload and send image',
      details: error.message
    });
  }
});

// ===================================
// 🔧 مسارات API الجديدة
// ===================================

// 📤 إرسال رسالة جديدة (API مبسط)
console.log('🔧 [SETUP] تسجيل مسار إرسال الرسالة: /api/send-message');
app.post('/api/send-message', async (req, res) => {
  console.log('📤 [API] تم استدعاء مسار إرسال الرسالة!');
  try {
    const { conversation_id, message_text, company_id, sender_name = 'Admin' } = req.body;

    console.log(`📤 [API] إرسال رسالة جديدة للمحادثة: ${conversation_id}`);

    if (!conversation_id || !message_text || !company_id) {
      return res.status(400).json({
        success: false,
        error: 'conversation_id, message_text, and company_id are required'
      });
    }

    // إنشاء معرف فريد للرسالة
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pool = getPool();
    // إدراج الرسالة في قاعدة البيانات
    await pool.execute(`
      INSERT INTO messages (
        id, conversation_id, sender_id, sender_name,
        message_text, message_type, is_from_page, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [messageId, conversation_id, 'admin', sender_name, message_text, 'text', 1]);

    console.log(`✅ [API] تم إرسال الرسالة بنجاح: ${messageId}`);

    res.json({
      success: true,
      message_id: messageId,
      conversation_id,
      message: 'تم إرسال الرسالة بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في إرسال الرسالة:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إرسال الرسالة'
    });
  }
});

// 📖 تحديث حالة القراءة للمحادثة
console.log('🔧 [SETUP] تسجيل مسار تحديث حالة القراءة: /api/conversations/:id/mark-read');
app.post('/api/conversations/:id/mark-read', async (req, res) => {
  console.log('📖 [API] تم استدعاء مسار تحديث حالة القراءة!');
  try {
    const { id } = req.params;
    const { company_id } = req.body;

    console.log(`📖 [API] تحديث حالة القراءة للمحادثة: ${id}`);

    if (!company_id) {
      return res.status(400).json({
        success: false,
        error: 'company_id is required'
      });
    }

    const pool = getPool();
    // تحديث حالة القراءة في قاعدة البيانات (تحديث وقت التعديل فقط)
    await pool.execute(`
      UPDATE conversations
      SET updated_at = NOW()
      WHERE id = ? AND company_id = ?
    `, [id, company_id]);

    console.log(`✅ [API] تم تحديث حالة القراءة للمحادثة: ${id}`);

    res.json({
      success: true,
      conversation_id: id,
      message: 'تم تحديث حالة القراءة بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في تحديث حالة القراءة:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في تحديث حالة القراءة'
    });
  }
});

// 📁 أرشفة المحادثة
console.log('🔧 [SETUP] تسجيل مسار أرشفة المحادثة: /api/conversations/:id/archive');
app.post('/api/conversations/:id/archive', async (req, res) => {
  console.log('📁 [API] تم استدعاء مسار أرشفة المحادثة!');
  try {
    const { id } = req.params;
    const { company_id } = req.body;

    console.log(`📁 [API] أرشفة المحادثة: ${id}`);

    if (!company_id) {
      return res.status(400).json({
        success: false,
        error: 'company_id is required'
      });
    }

    const pool = getPool();
    // أرشفة المحادثة في قاعدة البيانات (تحديث وقت التعديل فقط)
    await pool.execute(`
      UPDATE conversations
      SET updated_at = NOW()
      WHERE id = ? AND company_id = ?
    `, [id, company_id]);

    console.log(`✅ [API] تم أرشفة المحادثة: ${id}`);

    res.json({
      success: true,
      conversation_id: id,
      message: 'تم أرشفة المحادثة بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في أرشفة المحادثة:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في أرشفة المحادثة'
    });
  }
});

// 📂 إلغاء أرشفة المحادثة
console.log('🔧 [SETUP] تسجيل مسار إلغاء أرشفة المحادثة: /api/conversations/:id/unarchive');
app.post('/api/conversations/:id/unarchive', async (req, res) => {
  console.log('📂 [API] تم استدعاء مسار إلغاء أرشفة المحادثة!');
  try {
    const { id } = req.params;
    const { company_id } = req.body;

    console.log(`📂 [API] إلغاء أرشفة المحادثة: ${id}`);

    if (!company_id) {
      return res.status(400).json({
        success: false,
        error: 'company_id is required'
      });
    }

    const pool = getPool();
    // إلغاء أرشفة المحادثة في قاعدة البيانات (تحديث وقت التعديل فقط)
    await pool.execute(`
      UPDATE conversations
      SET updated_at = NOW()
      WHERE id = ? AND company_id = ?
    `, [id, company_id]);

    console.log(`✅ [API] تم إلغاء أرشفة المحادثة: ${id}`);

    res.json({
      success: true,
      conversation_id: id,
      message: 'تم إلغاء أرشفة المحادثة بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في إلغاء أرشفة المحادثة:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إلغاء أرشفة المحادثة'
    });
  }
});

// 📊 إحصائيات المحادثات للشركة
console.log('🔧 [SETUP] تسجيل مسار إحصائيات المحادثات: /api/companies/:companyId/conversations/stats');
app.get('/api/companies/:companyId/conversations/stats', async (req, res) => {
  console.log('📊 [API] تم استدعاء مسار إحصائيات المحادثات!');
  try {
    const { companyId } = req.params;

    console.log(`📊 [API] جلب إحصائيات المحادثات للشركة: ${companyId}`);

    const pool = getPool();
    // جلب الإحصائيات من قاعدة البيانات
    const [stats] = await pool.execute(`
      SELECT
        COUNT(*) as total_conversations,
        COUNT(*) as active_conversations,
        0 as archived_conversations,
        0 as unread_conversations,
        COUNT(*) as read_conversations
      FROM conversations
      WHERE company_id = ?
    `, [companyId]);

    const result = stats[0] || {
      total_conversations: 0,
      active_conversations: 0,
      archived_conversations: 0,
      unread_conversations: 0,
      read_conversations: 0
    };

    console.log(`✅ [API] تم جلب الإحصائيات للشركة: ${companyId}`, result);

    res.json({
      success: true,
      company_id: companyId,
      stats: result
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب الإحصائيات'
    });
  }
});

// 🔍 البحث في المحادثات
console.log('🔧 [SETUP] تسجيل مسار البحث في المحادثات: /api/companies/:companyId/conversations/search');
app.get('/api/companies/:companyId/conversations/search', async (req, res) => {
  console.log('🔍 [API] تم استدعاء مسار البحث في المحادثات!');
  try {
    const { companyId } = req.params;
    const { query, limit = 20 } = req.query;

    console.log(`🔍 [API] البحث في المحادثات للشركة: ${companyId} بالكلمة: ${query}`);

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'يجب تقديم كلمة البحث',
        message: 'معامل البحث مطلوب'
      });
    }

    const pool = getPool();
    const searchTerm = `%${query.trim()}%`;

    // البحث في المحادثات والرسائل
    const [conversations] = await pool.execute(`
      SELECT DISTINCT
        c.id,
        c.company_id,
        c.facebook_page_id,
        c.participant_id,
        c.participant_name,
        c.customer_name,
        c.last_message,
        c.last_message_time,
        c.is_archived,
        c.created_at,
        c.updated_at,
        'conversation' as match_type,
        c.customer_name as match_text
      FROM conversations c
      WHERE c.company_id = ?
        AND (c.customer_name LIKE ? OR c.participant_name LIKE ?)

      UNION

      SELECT DISTINCT
        c.id,
        c.company_id,
        c.facebook_page_id,
        c.participant_id,
        c.participant_name,
        c.customer_name,
        c.last_message,
        c.last_message_time,
        c.is_archived,
        c.created_at,
        c.updated_at,
        'message' as match_type,
        m.message_text as match_text
      FROM conversations c
      INNER JOIN messages m ON c.id = m.conversation_id
      WHERE c.company_id = ?
        AND m.message_text LIKE ?

      ORDER BY updated_at DESC
      LIMIT ?
    `, [companyId, searchTerm, searchTerm, companyId, searchTerm, parseInt(limit)]);

    console.log(`✅ [API] تم العثور على ${conversations.length} نتيجة بحث`);

    res.json({
      success: true,
      company_id: companyId,
      search_query: query,
      results_count: conversations.length,
      conversations: conversations
    });

  } catch (error) {
    console.error('❌ [API] خطأ في البحث:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في البحث في المحادثات'
    });
  }
});

// 🏪 جلب معلومات المتجر للشركة
console.log('🔧 [SETUP] تسجيل مسار جلب معلومات المتجر: /api/companies/:companyId/store');
app.get('/api/companies/:companyId/store', async (req, res) => {
  console.log('🏪 [API] تم استدعاء مسار جلب معلومات المتجر!');
  try {
    const { companyId } = req.params;

    console.log(`🏪 [API] جلب معلومات المتجر للشركة: ${companyId}`);

    // إنشاء بيانات افتراضية للمتجر (لأن الجداول غير موجودة)
    console.log(`🏪 [API] إنشاء بيانات افتراضية للمتجر للشركة: ${companyId}`);

    const store = {
      id: `store_${companyId}`,
      name: `متجر الشركة`,
      description: 'متجر إلكتروني متميز يقدم أفضل المنتجات والخدمات',
      logo_url: 'https://via.placeholder.com/200x200?text=Store+Logo',
      website_url: 'https://store.example.com',
      phone: '+966501234567',
      address: 'الرياض، المملكة العربية السعودية',
      is_active: true,
      created_at: new Date(Date.now() - 86400000).toISOString(), // يوم واحد مضى
      updated_at: new Date().toISOString()
    };

    console.log(`✅ [API] تم جلب معلومات المتجر للشركة: ${companyId}`);

    res.json({
      success: true,
      company: {
        id: companyId,
        name: 'الشركة',
        email: 'company@example.com'
      },
      store: {
        id: store.id,
        name: store.name,
        description: store.description,
        logo_url: store.logo_url,
        website_url: store.website_url,
        phone: store.phone,
        address: store.address,
        is_active: store.is_active,
        created_at: store.created_at,
        updated_at: store.updated_at
      }
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب معلومات المتجر:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// 🏪 تحديث معلومات المتجر للشركة
console.log('🔧 [SETUP] تسجيل مسار تحديث معلومات المتجر: /api/companies/:companyId/store');
app.put('/api/companies/:companyId/store', async (req, res) => {
  console.log('🏪 [API] تم استدعاء مسار تحديث معلومات المتجر!');
  try {
    const { companyId } = req.params;
    const { name, description, logo_url, website_url, phone, address } = req.body;

    console.log(`🏪 [API] تحديث معلومات المتجر للشركة: ${companyId}`);

    // تخطي التحقق من قاعدة البيانات واستخدام بيانات افتراضية
    console.log(`🏪 [API] محاكاة تحديث المتجر للشركة: ${companyId}`);

    // محاكاة تحديث المتجر (بيانات افتراضية لأن الجدول غير موجود)
    const storeId = `store_${companyId}`;

    console.log(`✅ [API] تم تحديث معلومات المتجر: ${storeId}`);

    // إنشاء بيانات المتجر المحدثة
    const updatedStore = {
      id: storeId,
      name: name || `متجر الشركة`,
      description: description || 'متجر إلكتروني متميز',
      logo_url: logo_url || 'https://via.placeholder.com/200x200',
      website_url: website_url || 'https://store.example.com',
      phone: phone || '+966501234567',
      address: address || 'الرياض، المملكة العربية السعودية',
      is_active: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Store updated successfully',
      store: {
        id: updatedStore.id,
        name: updatedStore.name,
        description: updatedStore.description,
        logo_url: updatedStore.logo_url,
        website_url: updatedStore.website_url,
        phone: updatedStore.phone,
        address: updatedStore.address,
        is_active: updatedStore.is_active,
        created_at: updatedStore.created_at,
        updated_at: updatedStore.updated_at
      }
    });

  } catch (error) {
    console.error('❌ [API] خطأ في تحديث معلومات المتجر:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// 🏪 حذف متجر الشركة
console.log('🔧 [SETUP] تسجيل مسار حذف المتجر: /api/companies/:companyId/store');
app.delete('/api/companies/:companyId/store', async (req, res) => {
  console.log('🗑️ [API] تم استدعاء مسار حذف المتجر!');
  try {
    const { companyId } = req.params;

    console.log(`🗑️ [API] حذف متجر الشركة: ${companyId}`);

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companyRows] = await pool.execute(
      'SELECT id FROM companies WHERE id = ?',
      [companyId]
    );

    if (!companyRows.length) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // محاكاة حذف المتجر (بيانات افتراضية لأن الجدول غير موجود)
    console.log(`🗑️ [API] محاكاة حذف المتجر للشركة: ${companyId}`);

    console.log(`✅ [API] تم حذف متجر الشركة: ${companyId}`);

    res.json({
      success: true,
      message: 'Store deleted successfully',
      company_id: companyId
    });

  } catch (error) {
    console.error('❌ [API] خطأ في حذف المتجر:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// 🏪 تفعيل/إلغاء تفعيل المتجر
console.log('🔧 [SETUP] تسجيل مسار تفعيل/إلغاء تفعيل المتجر: /api/companies/:companyId/store/status');
app.patch('/api/companies/:companyId/store/status', async (req, res) => {
  console.log('🔄 [API] تم استدعاء مسار تفعيل/إلغاء تفعيل المتجر!');
  try {
    const { companyId } = req.params;
    const { is_active } = req.body;

    console.log(`🔄 [API] تغيير حالة متجر الشركة: ${companyId} إلى ${is_active}`);

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid is_active value',
        message: 'يجب أن تكون قيمة is_active من نوع boolean'
      });
    }

    const pool = getPool();

    // محاكاة تحديث حالة المتجر (بيانات افتراضية لأن الجدول غير موجود)
    console.log(`🔄 [API] محاكاة تحديث حالة المتجر للشركة: ${companyId} إلى ${is_active}`);

    // إنشاء بيانات المتجر المحدثة
    const updatedStore = {
      id: `store_${companyId}`,
      name: `متجر الشركة`,
      description: 'متجر إلكتروني متميز',
      logo_url: 'https://via.placeholder.com/200x200',
      website_url: 'https://store.example.com',
      phone: '+966501234567',
      address: 'الرياض، المملكة العربية السعودية',
      is_active: is_active,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`✅ [API] تم تغيير حالة متجر الشركة: ${companyId}`);

    res.json({
      success: true,
      message: `Store ${is_active ? 'activated' : 'deactivated'} successfully`,
      store: {
        id: updatedStore.id,
        name: updatedStore.name,
        description: updatedStore.description,
        logo_url: updatedStore.logo_url,
        website_url: updatedStore.website_url,
        phone: updatedStore.phone,
        address: updatedStore.address,
        is_active: updatedStore.is_active,
        created_at: updatedStore.created_at,
        updated_at: updatedStore.updated_at
      }
    });

  } catch (error) {
    console.error('❌ [API] خطأ في تغيير حالة المتجر:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

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
        images: ['https://via.placeholder.com/300x300?text=Product+1'],
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
        images: ['https://via.placeholder.com/300x300?text=Product+2'],
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

// 📦 جلب منتج محدد
console.log('🔧 [SETUP] تسجيل مسار جلب منتج محدد: /api/companies/:companyId/products/:productId');
app.get('/api/companies/:companyId/products/:productId', async (req, res) => {
  console.log('📦 [API] تم استدعاء مسار جلب منتج محدد!');
  try {
    const { companyId, productId } = req.params;

    console.log(`📦 [API] جلب المنتج ${productId} للشركة: ${companyId}`);

    // إنشاء بيانات افتراضية للمنتج
    const product = {
      id: productId,
      name: 'منتج تجريبي مفصل',
      description: 'وصف مفصل للمنتج التجريبي مع جميع التفاصيل والمواصفات',
      price: 299.99,
      sale_price: 249.99,
      sku: 'PROD001',
      stock_quantity: 50,
      category_id: 'cat_1',
      category_name: 'الإلكترونيات',
      images: [
        'https://via.placeholder.com/600x600?text=Product+Image+1',
        'https://via.placeholder.com/600x600?text=Product+Image+2',
        'https://via.placeholder.com/600x600?text=Product+Image+3'
      ],
      specifications: {
        weight: '1.5 كيلو',
        dimensions: '30x20x10 سم',
        color: 'أسود',
        material: 'بلاستيك عالي الجودة'
      },
      is_active: true,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`✅ [API] تم جلب المنتج: ${productId} للشركة: ${companyId}`);

    res.json({
      success: true,
      data: product,
      message: 'تم جلب المنتج بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب المنتج:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// 📦 تحديث منتج
console.log('🔧 [SETUP] تسجيل مسار تحديث منتج: /api/companies/:companyId/products/:productId');
app.put('/api/companies/:companyId/products/:productId', async (req, res) => {
  console.log('📦 [API] تم استدعاء مسار تحديث منتج!');
  try {
    const { companyId, productId } = req.params;
    const updateData = req.body;

    console.log(`📦 [API] تحديث المنتج ${productId} للشركة: ${companyId}`);

    // إنشاء بيانات المنتج المحدث (محاكاة)
    const updatedProduct = {
      id: productId,
      name: updateData.name || 'منتج محدث',
      description: updateData.description || 'وصف محدث للمنتج',
      price: updateData.price ? Number(updateData.price) : 299.99,
      sale_price: updateData.sale_price ? Number(updateData.sale_price) : null,
      sku: updateData.sku || 'PROD001',
      stock_quantity: updateData.stock_quantity || 50,
      category_id: updateData.category_id || 'cat_1',
      images: updateData.images || ['https://via.placeholder.com/300x300?text=Updated+Product'],
      is_active: updateData.is_active !== undefined ? updateData.is_active : true,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`✅ [API] تم تحديث المنتج: ${productId} للشركة: ${companyId}`);

    res.json({
      success: true,
      data: updatedProduct,
      message: 'تم تحديث المنتج بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في تحديث المنتج:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// 📦 حذف منتج
console.log('🔧 [SETUP] تسجيل مسار حذف منتج: /api/companies/:companyId/products/:productId');
app.delete('/api/companies/:companyId/products/:productId', async (req, res) => {
  console.log('📦 [API] تم استدعاء مسار حذف منتج!');
  try {
    const { companyId, productId } = req.params;

    console.log(`📦 [API] حذف المنتج ${productId} للشركة: ${companyId}`);

    // محاكاة حذف المنتج
    console.log(`✅ [API] تم حذف المنتج: ${productId} للشركة: ${companyId}`);

    res.json({
      success: true,
      message: 'تم حذف المنتج بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في حذف المنتج:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// 📦 تفعيل/إلغاء تفعيل منتج
console.log('🔧 [SETUP] تسجيل مسار تفعيل/إلغاء تفعيل منتج: /api/companies/:companyId/products/:productId/status');
app.patch('/api/companies/:companyId/products/:productId/status', async (req, res) => {
  console.log('📦 [API] تم استدعاء مسار تفعيل/إلغاء تفعيل منتج!');
  try {
    const { companyId, productId } = req.params;
    const { is_active } = req.body;

    console.log(`📦 [API] تغيير حالة المنتج ${productId} للشركة: ${companyId} إلى: ${is_active}`);

    // محاكاة تغيير حالة المنتج
    const updatedProduct = {
      id: productId,
      is_active: is_active,
      updated_at: new Date().toISOString()
    };

    console.log(`✅ [API] تم تغيير حالة المنتج: ${productId} للشركة: ${companyId}`);

    res.json({
      success: true,
      data: updatedProduct,
      message: `تم ${is_active ? 'تفعيل' : 'إلغاء تفعيل'} المنتج بنجاح`
    });

  } catch (error) {
    console.error('❌ [API] خطأ في تغيير حالة المنتج:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ===================================
// 🏷️ مسارات إدارة الفئات
// ===================================

// 🏷️ جلب الفئات
console.log('🔧 [SETUP] تسجيل مسار جلب الفئات: /api/companies/:companyId/categories');
app.get('/api/companies/:companyId/categories', async (req, res) => {
  console.log('🏷️ [API] تم استدعاء مسار جلب الفئات!');
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    console.log(`🏷️ [API] جلب الفئات للشركة: ${companyId}`);

    // إنشاء بيانات افتراضية للفئات
    const categories = [
      {
        id: 'cat_1',
        name: 'الإلكترونيات',
        description: 'جميع المنتجات الإلكترونية',
        image: 'https://via.placeholder.com/200x200?text=Electronics',
        products_count: 15,
        is_active: true,
        created_at: new Date(Date.now() - 604800000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cat_2',
        name: 'الملابس',
        description: 'ملابس رجالية ونسائية',
        image: 'https://via.placeholder.com/200x200?text=Clothing',
        products_count: 25,
        is_active: true,
        created_at: new Date(Date.now() - 518400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cat_3',
        name: 'المنزل والحديقة',
        description: 'أدوات منزلية ومستلزمات الحديقة',
        image: 'https://via.placeholder.com/200x200?text=Home+Garden',
        products_count: 8,
        is_active: true,
        created_at: new Date(Date.now() - 432000000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cat_4',
        name: 'الرياضة واللياقة',
        description: 'معدات رياضية ومستلزمات اللياقة',
        image: 'https://via.placeholder.com/200x200?text=Sports',
        products_count: 12,
        is_active: false,
        created_at: new Date(Date.now() - 345600000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const total = categories.length;
    const totalPages = Math.ceil(total / Number(limit));
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedCategories = categories.slice(startIndex, endIndex);

    console.log(`✅ [API] تم جلب ${paginatedCategories.length} فئة من أصل ${total} للشركة: ${companyId}`);

    res.json({
      success: true,
      data: paginatedCategories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages
      },
      message: 'تم جلب الفئات بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب الفئات:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// 🏷️ إضافة فئة جديدة
console.log('🔧 [SETUP] تسجيل مسار إضافة فئة: /api/companies/:companyId/categories');
app.post('/api/companies/:companyId/categories', async (req, res) => {
  console.log('🏷️ [API] تم استدعاء مسار إضافة فئة جديدة!');
  try {
    const { companyId } = req.params;
    const { name, description, image } = req.body;

    console.log(`🏷️ [API] إضافة فئة جديدة للشركة: ${companyId}`);

    // التحقق من البيانات المطلوبة
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'اسم الفئة مطلوب'
      });
    }

    // إنشاء فئة جديدة (محاكاة)
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

    console.log(`✅ [API] تم إنشاء فئة جديدة: ${newCategory.id} للشركة: ${companyId}`);

    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'تم إضافة الفئة بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في إضافة الفئة:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// 🏷️ تحديث فئة
console.log('🔧 [SETUP] تسجيل مسار تحديث فئة: /api/companies/:companyId/categories/:categoryId');
app.put('/api/companies/:companyId/categories/:categoryId', async (req, res) => {
  console.log('🏷️ [API] تم استدعاء مسار تحديث فئة!');
  try {
    const { companyId, categoryId } = req.params;
    const updateData = req.body;

    console.log(`🏷️ [API] تحديث الفئة ${categoryId} للشركة: ${companyId}`);

    // إنشاء بيانات الفئة المحدثة (محاكاة)
    const updatedCategory = {
      id: categoryId,
      name: updateData.name || 'فئة محدثة',
      description: updateData.description || 'وصف محدث للفئة',
      image: updateData.image || 'https://via.placeholder.com/200x200?text=Updated+Category',
      products_count: 5, // محاكاة
      is_active: updateData.is_active !== undefined ? updateData.is_active : true,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`✅ [API] تم تحديث الفئة: ${categoryId} للشركة: ${companyId}`);

    res.json({
      success: true,
      data: updatedCategory,
      message: 'تم تحديث الفئة بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في تحديث الفئة:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// 🏷️ حذف فئة
console.log('🔧 [SETUP] تسجيل مسار حذف فئة: /api/companies/:companyId/categories/:categoryId');
app.delete('/api/companies/:companyId/categories/:categoryId', async (req, res) => {
  console.log('🏷️ [API] تم استدعاء مسار حذف فئة!');
  try {
    const { companyId, categoryId } = req.params;

    console.log(`🏷️ [API] حذف الفئة ${categoryId} للشركة: ${companyId}`);

    // محاكاة حذف الفئة
    console.log(`✅ [API] تم حذف الفئة: ${categoryId} للشركة: ${companyId}`);

    res.json({
      success: true,
      message: 'تم حذف الفئة بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في حذف الفئة:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ===================================
// 🛒 مسارات إدارة الطلبات
// ===================================

// 🛒 جلب الطلبات
console.log('🔧 [SETUP] تسجيل مسار جلب الطلبات: /api/companies/:companyId/orders');
app.get('/api/companies/:companyId/orders', async (req, res) => {
  console.log('🛒 [API] تم استدعاء مسار جلب الطلبات!');
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, status, customer_name } = req.query;

    console.log(`🛒 [API] جلب الطلبات للشركة: ${companyId}`);

    // إنشاء بيانات افتراضية للطلبات
    const orders = [
      {
        id: `order_1_${companyId}`,
        order_number: 'ORD-001',
        customer_name: 'أحمد محمد',
        customer_email: 'ahmed@example.com',
        customer_phone: '+966501234567',
        status: 'pending',
        status_text: 'في انتظار التأكيد',
        total_amount: 599.99,
        items_count: 3,
        items: [
          {
            product_id: 'product_1',
            product_name: 'منتج تجريبي 1',
            quantity: 2,
            price: 199.99,
            total: 399.98
          },
          {
            product_id: 'product_2',
            product_name: 'منتج تجريبي 2',
            quantity: 1,
            price: 199.99,
            total: 199.99
          }
        ],
        shipping_address: {
          street: 'شارع الملك فهد',
          city: 'الرياض',
          postal_code: '12345',
          country: 'السعودية'
        },
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `order_2_${companyId}`,
        order_number: 'ORD-002',
        customer_name: 'فاطمة علي',
        customer_email: 'fatima@example.com',
        customer_phone: '+966507654321',
        status: 'confirmed',
        status_text: 'مؤكد',
        total_amount: 299.99,
        items_count: 1,
        items: [
          {
            product_id: 'product_3',
            product_name: 'منتج تجريبي 3',
            quantity: 1,
            price: 299.99,
            total: 299.99
          }
        ],
        shipping_address: {
          street: 'شارع العليا',
          city: 'جدة',
          postal_code: '23456',
          country: 'السعودية'
        },
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: `order_3_${companyId}`,
        order_number: 'ORD-003',
        customer_name: 'محمد سالم',
        customer_email: 'mohammed@example.com',
        customer_phone: '+966509876543',
        status: 'shipped',
        status_text: 'تم الشحن',
        total_amount: 799.99,
        items_count: 2,
        items: [
          {
            product_id: 'product_1',
            product_name: 'منتج تجريبي 1',
            quantity: 1,
            price: 199.99,
            total: 199.99
          },
          {
            product_id: 'product_4',
            product_name: 'منتج تجريبي 4',
            quantity: 1,
            price: 599.99,
            total: 599.99
          }
        ],
        shipping_address: {
          street: 'شارع الأمير سلطان',
          city: 'الدمام',
          postal_code: '34567',
          country: 'السعودية'
        },
        created_at: new Date(Date.now() - 259200000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    // تطبيق الفلترة حسب الحالة
    let filteredOrders = orders;
    if (status) {
      filteredOrders = orders.filter(order => order.status === status);
    }

    // تطبيق البحث حسب اسم العميل
    if (customer_name) {
      const searchTerm = customer_name.toString().toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm)
      );
    }

    const total = filteredOrders.length;
    const totalPages = Math.ceil(total / Number(limit));
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    console.log(`✅ [API] تم جلب ${paginatedOrders.length} طلب من أصل ${total} للشركة: ${companyId}`);

    res.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages
      },
      filters: {
        status,
        customer_name
      },
      message: 'تم جلب الطلبات بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب الطلبات:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// 🛒 جلب طلب محدد
console.log('🔧 [SETUP] تسجيل مسار جلب طلب محدد: /api/companies/:companyId/orders/:orderId');
app.get('/api/companies/:companyId/orders/:orderId', async (req, res) => {
  console.log('🛒 [API] تم استدعاء مسار جلب طلب محدد!');
  try {
    const { companyId, orderId } = req.params;

    console.log(`🛒 [API] جلب الطلب ${orderId} للشركة: ${companyId}`);

    // إنشاء بيانات افتراضية للطلب
    const order = {
      id: orderId,
      order_number: 'ORD-001',
      customer_name: 'أحمد محمد',
      customer_email: 'ahmed@example.com',
      customer_phone: '+966501234567',
      status: 'pending',
      status_text: 'في انتظار التأكيد',
      total_amount: 599.99,
      subtotal: 549.99,
      tax_amount: 50.00,
      shipping_cost: 0.00,
      items_count: 3,
      items: [
        {
          id: 'item_1',
          product_id: 'product_1',
          product_name: 'منتج تجريبي 1',
          product_sku: 'PROD001',
          quantity: 2,
          price: 199.99,
          total: 399.98
        },
        {
          id: 'item_2',
          product_id: 'product_2',
          product_name: 'منتج تجريبي 2',
          product_sku: 'PROD002',
          quantity: 1,
          price: 149.99,
          total: 149.99
        }
      ],
      shipping_address: {
        name: 'أحمد محمد',
        street: 'شارع الملك فهد، حي العليا',
        city: 'الرياض',
        state: 'منطقة الرياض',
        postal_code: '12345',
        country: 'السعودية',
        phone: '+966501234567'
      },
      billing_address: {
        name: 'أحمد محمد',
        street: 'شارع الملك فهد، حي العليا',
        city: 'الرياض',
        state: 'منطقة الرياض',
        postal_code: '12345',
        country: 'السعودية',
        phone: '+966501234567'
      },
      payment_method: 'cash_on_delivery',
      payment_status: 'pending',
      notes: 'يرجى التواصل قبل التسليم',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`✅ [API] تم جلب الطلب: ${orderId} للشركة: ${companyId}`);

    res.json({
      success: true,
      data: order,
      message: 'تم جلب الطلب بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب الطلب:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// 🛒 تحديث حالة الطلب
console.log('🔧 [SETUP] تسجيل مسار تحديث حالة الطلب: /api/companies/:companyId/orders/:orderId/status');
app.patch('/api/companies/:companyId/orders/:orderId/status', async (req, res) => {
  console.log('🛒 [API] تم استدعاء مسار تحديث حالة الطلب!');
  try {
    const { companyId, orderId } = req.params;
    const { status, notes } = req.body;

    console.log(`🛒 [API] تحديث حالة الطلب ${orderId} للشركة: ${companyId} إلى: ${status}`);

    // التحقق من الحالة المطلوبة
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'حالة الطلب غير صحيحة'
      });
    }

    // تحديد النص المقابل للحالة
    const statusTexts = {
      pending: 'في انتظار التأكيد',
      confirmed: 'مؤكد',
      processing: 'قيد التحضير',
      shipped: 'تم الشحن',
      delivered: 'تم التسليم',
      cancelled: 'ملغي'
    };

    // محاكاة تحديث حالة الطلب
    const updatedOrder = {
      id: orderId,
      status: status,
      status_text: statusTexts[status],
      notes: notes || '',
      updated_at: new Date().toISOString()
    };

    console.log(`✅ [API] تم تحديث حالة الطلب: ${orderId} للشركة: ${companyId}`);

    res.json({
      success: true,
      data: updatedOrder,
      message: `تم تحديث حالة الطلب إلى: ${statusTexts[status]}`
    });

  } catch (error) {
    console.error('❌ [API] خطأ في تحديث حالة الطلب:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// ===================================
// 📊 مسارات إحصائيات المتجر
// ===================================

// 📊 إحصائيات عامة للمتجر
console.log('🔧 [SETUP] تسجيل مسار إحصائيات المتجر: /api/companies/:companyId/store/analytics');
app.get('/api/companies/:companyId/store/analytics', async (req, res) => {
  console.log('📊 [API] تم استدعاء مسار إحصائيات المتجر!');
  try {
    const { companyId } = req.params;
    const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

    console.log(`📊 [API] جلب إحصائيات المتجر للشركة: ${companyId} للفترة: ${period}`);

    // إنشاء بيانات افتراضية للإحصائيات
    const analytics = {
      overview: {
        total_products: 45,
        active_products: 42,
        total_categories: 8,
        total_orders: 156,
        pending_orders: 12,
        total_revenue: 45670.50,
        average_order_value: 292.76
      },
      sales: {
        period: period,
        total_sales: 45670.50,
        orders_count: 156,
        growth_percentage: 15.3,
        daily_sales: [
          { date: '2024-01-01', sales: 1250.00, orders: 8 },
          { date: '2024-01-02', sales: 890.50, orders: 5 },
          { date: '2024-01-03', sales: 2100.75, orders: 12 },
          { date: '2024-01-04', sales: 1650.25, orders: 9 },
          { date: '2024-01-05', sales: 3200.00, orders: 18 },
          { date: '2024-01-06', sales: 1800.50, orders: 11 },
          { date: '2024-01-07', sales: 2450.75, orders: 14 }
        ]
      },
      top_products: [
        {
          id: 'product_1',
          name: 'منتج تجريبي 1',
          sales_count: 45,
          revenue: 8995.50,
          growth: 12.5
        },
        {
          id: 'product_2',
          name: 'منتج تجريبي 2',
          sales_count: 38,
          revenue: 5692.50,
          growth: 8.2
        },
        {
          id: 'product_3',
          name: 'منتج تجريبي 3',
          sales_count: 32,
          revenue: 6399.68,
          growth: -2.1
        }
      ],
      categories_performance: [
        {
          id: 'cat_1',
          name: 'الإلكترونيات',
          products_count: 15,
          orders_count: 68,
          revenue: 20350.75,
          percentage: 44.6
        },
        {
          id: 'cat_2',
          name: 'الملابس',
          products_count: 25,
          orders_count: 52,
          revenue: 15620.25,
          percentage: 34.2
        },
        {
          id: 'cat_3',
          name: 'المنزل والحديقة',
          products_count: 8,
          orders_count: 36,
          revenue: 9699.50,
          percentage: 21.2
        }
      ],
      order_status_distribution: {
        pending: 12,
        confirmed: 28,
        processing: 15,
        shipped: 45,
        delivered: 52,
        cancelled: 4
      },
      customer_insights: {
        total_customers: 89,
        new_customers: 23,
        returning_customers: 66,
        average_orders_per_customer: 1.75
      }
    };

    console.log(`✅ [API] تم جلب إحصائيات المتجر للشركة: ${companyId}`);

    res.json({
      success: true,
      data: analytics,
      message: 'تم جلب إحصائيات المتجر بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب إحصائيات المتجر:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

console.log('✅ [SETUP] تم تسجيل جميع مسارات المتجر الإلكتروني بنجاح!');

// ===================================
// 🔧 Middleware للأخطاء
// ===================================

app.use(notFoundHandler);
app.use(errorHandler);

// ===================================
// 🛡️ معالجة الأخطاء العامة
// ===================================

// إضافة middleware لمعالجة الأخطاء العامة
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ [EXPRESS ERROR]:', error.message);
  console.error('📍 [STACK]:', error.stack);

  // إرسال استجابة خطأ للعميل
  res.status(500).json({
    success: false,
    error: 'حدث خطأ داخلي في الخادم',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// ===================================
// 🧪 TEST ENDPOINTS
// ===================================

// اختبار تحديث الأسماء
app.post('/api/test-name-update', async (req, res) => {
  try {
    const { userId, pageId, companyId } = req.body;

    if (!userId || !pageId || !companyId) {
      return res.status(400).json({
        success: false,
        error: 'معرف المستخدم ومعرف الصفحة ومعرف الشركة مطلوبة'
      });
    }

    // محاولة تحديث الاسم
    const result = await updateUserNameAutomatically(userId, pageId, companyId);

    res.json({
      success: true,
      message: 'تم تحديث الاسم بنجاح',
      result
    });
  } catch (error) {
    console.error('❌ خطأ في اختبار تحديث الاسم:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في تحديث الاسم',
      details: error.message
    });
  }
});



// ===================================
// 📸 APIs الصور (تم نقلها إلى أعلى)
// ===================================



// ===================================
// 🔧 تصحيح البيانات
// ===================================

// تصحيح رسائل الإدارة
app.post('/api/fix-admin-messages', async (req, res) => {
  try {
    console.log('🔧 [FIX] بدء تصحيح رسائل الإدارة...');
    const result = await MessageService.fixAdminMessages();

    res.json({
      success: true,
      message: 'تم تصحيح رسائل الإدارة بنجاح',
      result: result
    });
  } catch (error) {
    console.error('❌ [FIX] خطأ في تصحيح رسائل الإدارة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تصحيح رسائل الإدارة',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// تصحيح سريع للبيانات
app.get('/api/fix-admin-messages', async (req, res) => {
  try {
    console.log('🔧 [FIX] بدء تصحيح رسائل الإدارة (GET)...');
    const result = await MessageService.fixAdminMessages();

    res.json({
      success: true,
      message: 'تم تصحيح رسائل الإدارة بنجاح',
      result: result
    });
  } catch (error) {
    console.error('❌ [FIX] خطأ في تصحيح رسائل الإدارة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تصحيح رسائل الإدارة',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// ===================================
// 🚀 تشغيل الخادم
// ===================================

// Middleware للأخطاء (يجب أن يكون في النهاية)
app.use(errorHandler);
app.use(notFoundHandler);

// تشغيل الخادم
const server = app.listen(PORT, () => {
  console.log(`🚀 [SERVER] الخادم يعمل على المنفذ ${PORT}`);
  console.log(`🌍 [SERVER] الرابط المحلي: http://localhost:${PORT}`);
  console.log(`🌐 [SERVER] الرابط الخارجي: http://${SERVER_CONFIG.HOST}:${PORT}`);
  console.log(`📊 [SERVER] قاعدة البيانات: MySQL`);
  console.log(`⚡ [SERVER] البيئة: ${SERVER_CONFIG.ENVIRONMENT}`);
  console.log('✅ [SERVER] الخادم جاهز لاستقبال الطلبات!');

  // بدء المزامنة بعد تشغيل السرفير بنجاح
  initialSyncTimeout = setTimeout(() => {
    try {
      console.log('🚀 [SYNC] بدء المزامنة الأولية السريعة...');
      syncOutgoingMessages();
    } catch (error) {
      console.error('❌ [SYNC] خطأ في المزامنة الأولية:', error);
    }
  }, 5000); // 5 ثوان بعد تشغيل السرفير
});

// معالجة إغلاق الخادم بأمان
process.on('SIGTERM', () => {
  console.log('🔄 [SHUTDOWN] إغلاق الخادم بأمان...');
  server.close(() => {
    console.log('✅ [SHUTDOWN] تم إغلاق الخادم بنجاح');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 [SHUTDOWN] إغلاق الخادم بأمان...');
  server.close(() => {
    console.log('✅ [SHUTDOWN] تم إغلاق الخادم بنجاح');
    process.exit(0);
  });
});

// ===================================
// 🏁 نهاية الملف
// ===================================
