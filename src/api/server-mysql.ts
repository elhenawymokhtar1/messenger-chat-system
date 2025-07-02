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
// import whatsappBaileysRoutes from './whatsapp-baileys-routes'; // مؤقتاً معطل
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
import { testConnection, getDatabaseInfo, getPool } from '../config/mysql';
import {
  CompanyService,
  FacebookService,
  ConversationService,
  MessageService,
  GeminiService,
  DatabaseService
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

      console.log(`🔄 [SYNC] مزامنة متوازية: ${conv.facebook_page_id || conv.pageId} <-> ${conv.user_id || conv.userId}`);
      return syncSpecificConversation(
        conv.facebook_page_id || conv.pageId,
        conv.user_id || conv.userId
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
testConnection().then(isConnected => {
  if (isConnected) {
    console.log('✅ [DATABASE] اتصال MySQL نجح!');
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

// الحصول على إعدادات فيسبوك للشركة
app.get('/api/facebook/settings', async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    const settings = await FacebookService.getByCompanyId(company_id as string);
    res.json(settings);
  } catch (error) {
    console.error('❌ Error fetching Facebook settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// إضافة صفحة فيسبوك جديدة
app.post('/api/facebook/settings', async (req, res) => {
  try {
    const { company_id, page_id, page_name, access_token } = req.body;

    if (!company_id || !page_id || !page_name || !access_token) {
      return res.status(400).json({
        error: 'company_id, page_id, page_name, and access_token are required'
      });
    }

    // التحقق من عدم وجود الصفحة مسبقاً
    const existingPage = await FacebookService.getByPageId(page_id);
    if (existingPage) {
      return res.status(409).json({ error: 'Page already exists' });
    }

    const pageId = await FacebookService.create({
      company_id,
      page_id,
      page_name,
      access_token,
      is_active: true,
      webhook_verified: false
    });

    res.json({
      success: true,
      page_id: pageId,
      message: 'Facebook page added successfully'
    });
  } catch (error) {
    console.error('❌ Error adding Facebook page:', error);
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

    // إنشاء الرسالة (سيتم تحديث image_url لاحقاً)
    const messageId = await MessageService.create({
      conversation_id: id,
      company_id,
      sender_id: 'admin',
      recipient_id: 'user',
      message_text: messageContent || '',
      message_type: message_type,
      direction: 'outgoing',
      status: 'sent',
      is_read: true
    });

    // تحديث إحصائيات المحادثة
    await ConversationService.updateStats(id);

    console.log('✅ تم حفظ الرسالة في قاعدة البيانات:', messageId);

    // الحصول على بيانات المحادثة لإرسال الرسالة عبر Facebook
    const conversation = await ConversationService.getById(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

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

    // معالجة الصور إذا كانت موجودة
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
        const baseUrl = process.env.PUBLIC_URL || 'https://91dc-154-180-108-228.ngrok-free.app';
        imageUrl = `${baseUrl}/uploads/images/${fileName}`;

        // تحديث الرسالة بـ image_url
        const pool = getPool();
        await pool.execute(
          'UPDATE messages SET image_url = ? WHERE id = ?',
          [imageUrl, messageId]
        );

        console.log('✅ تم حفظ الصورة وتحديث الرسالة:', imageUrl);
      } catch (imageError) {
        console.error('❌ خطأ في معالجة الصورة:', imageError);
        // المتابعة بدون صورة
      }
    }

    // إرسال الرسالة عبر Facebook API
    try {
      console.log('📤 إرسال الرسالة عبر Facebook API...');

      // استخدام customer_facebook_id إذا كان user_id فارغ
      const recipientId = conversation.user_id || conversation.customer_facebook_id;
      console.log('👤 المستقبل:', recipientId);
      console.log('💬 النص:', messageContent);

      if (!recipientId) {
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
              recipient: { id: recipientId },
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
                recipient: { id: recipientId },
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
              recipient: { id: recipientId },
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
          'UPDATE messages SET facebook_message_id = ?, status = ? WHERE id = ?',
          [facebookData.message_id, 'delivered', messageId]
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

// ===================================
// 🔗 Integration Routes
// ===================================

// استخدام routes الموجودة (معطلة مؤقتاً)
// app.use('/api/gemini', geminiRouter); // مؤقتاً معطل
// app.use('/api/whatsapp-baileys', whatsappBaileysRoutes); // مؤقتاً معطل
// app.use('/api/subscription', subscriptionRouter); // مؤقتاً معطل

// مسارات التحليلات
app.use('/api/analytics', analyticsRoutes);

// ===================================
// 📨 Webhook للرسائل
// ===================================

// دالة حفظ الرسالة في قاعدة البيانات
async function saveMessageToDatabase(messageRequest: any) {
  try {
    const { senderId, messageText, messageId, pageId, timestamp, imageUrl, attachments } = messageRequest;
    const pool = getPool(); // الحصول على pool الاتصالات

    console.log('💾 حفظ الرسالة في قاعدة البيانات...');

    // 1. البحث عن الشركة المرتبطة بالصفحة
    const [pageSettings] = await pool.execute(
      'SELECT company_id FROM facebook_settings WHERE page_id = ? AND is_active = 1',
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

    // 3. التحقق من أن المرسل ليس الصفحة نفسها
    if (senderId === pageId) {
      console.log('⚠️ تجاهل رسالة من الصفحة نفسها:', senderId);
      return;
    }

    // 4. البحث عن المحادثة أو إنشاؤها
    let conversationId;
    const [existingConversation] = await pool.execute(
      'SELECT id FROM conversations WHERE user_id = ? AND facebook_page_id = ? AND company_id = ?',
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
        `INSERT INTO conversations (id, company_id, user_id, facebook_page_id, status, unread_messages, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', 1, NOW(), NOW())`,
        [conversationUuid, companyId, senderId, pageId]
      );
      conversationId = conversationUuid;
      console.log('💬 محادثة جديدة تم إنشاؤها:', conversationId);
    }

    // 3. حفظ الرسالة مع معالجة التكرار والصور
    const messageUuid = crypto.randomUUID();
    try {
      await pool.execute(
        `INSERT INTO messages (id, conversation_id, company_id, sender_id, recipient_id, message_text, facebook_message_id, direction, status, sent_at, created_at, image_url, attachments)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'incoming', 'delivered', FROM_UNIXTIME(?), NOW(), ?, ?)`,
        [messageUuid, conversationId, companyId, senderId, pageId, messageText, messageId, Math.floor(timestamp / 1000), imageUrl, attachments ? JSON.stringify(attachments) : null]
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
      'UPDATE conversations SET unread_messages = unread_messages + 1, last_message_at = FROM_UNIXTIME(?), updated_at = NOW() WHERE id = ?',
      [Math.floor(timestamp / 1000), conversationId]
    );

    console.log('✅ تم تحديث عدد الرسائل غير المقروءة');

    // 5. تحديث اسم المستخدم إذا لم يكن موجوداً (محسن)
    console.log(`🔍 فحص اسم المستخدم للمحادثة: ${conversationId}`);

    const [conversationData] = await pool.execute(
      'SELECT user_name, user_id FROM conversations WHERE id = ?',
      [conversationId]
    );

    if (conversationData && conversationData.length > 0) {
      const conversation = conversationData[0];
      const needsNameUpdate = !conversation.user_name ||
        conversation.user_name === '' ||
        conversation.user_name === 'undefined' ||
        conversation.user_name === 'null' ||
        conversation.user_name === 'بدون اسم';

      console.log(`👤 اسم المستخدم الحالي: "${conversation.user_name}" | يحتاج تحديث: ${needsNameUpdate}`);

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
                'SELECT user_name FROM conversations WHERE id = ?',
                [conversationId]
              );
              if (updatedData && updatedData.length > 0) {
                console.log(`🎉 الاسم الجديد: "${updatedData[0].user_name}"`);

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
// 🏪 Store APIs
// ===================================

// الحصول على متجر الشركة
app.get('/api/companies/:companyId/store', async (req, res) => {
  try {
    const { companyId } = req.params;

    console.log('🔍 جلب متجر الشركة:', companyId);

    // إرجاع بيانات تجريبية للمتجر
    const mockStore = {
      id: `store_${companyId}`,
      company_id: companyId,
      name: `متجر الشركة ${companyId}`,
      description: 'متجر إلكتروني متميز',
      phone: '+966501234567',
      email: 'store@company.com',
      address: 'الرياض، المملكة العربية السعودية',
      website: 'https://store.company.com',
      logo_url: 'https://via.placeholder.com/200x200',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockStore
    });
  } catch (error) {
    console.error('❌ Error fetching store:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// إنشاء متجر جديد للشركة
app.post('/api/companies/:companyId/store', async (req, res) => {
  try {
    const { companyId } = req.params;
    const storeData = req.body;

    console.log('🏪 إنشاء متجر جديد:', { companyId, storeData });

    // إرجاع بيانات المتجر الجديد
    const newStore = {
      id: `store_${companyId}_${Date.now()}`,
      company_id: companyId,
      ...storeData,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: newStore
    });
  } catch (error) {
    console.error('❌ Error creating store:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// تحديث متجر الشركة
app.put('/api/companies/:companyId/store', async (req, res) => {
  try {
    const { companyId } = req.params;
    const updateData = req.body;

    console.log('📝 تحديث متجر الشركة:', { companyId, updateData });

    // إرجاع بيانات المتجر المحدثة
    const updatedStore = {
      id: `store_${companyId}`,
      company_id: companyId,
      name: updateData.name || `متجر الشركة ${companyId}`,
      description: updateData.description || 'متجر إلكتروني متميز',
      phone: updateData.phone || '+966501234567',
      email: updateData.email || 'store@company.com',
      address: updateData.address || 'الرياض، المملكة العربية السعودية',
      website: updateData.website || 'https://store.company.com',
      logo_url: updateData.logo_url || 'https://via.placeholder.com/200x200',
      is_active: updateData.is_active !== undefined ? updateData.is_active : true,
      created_at: new Date(Date.now() - 86400000).toISOString(), // يوم واحد مضى
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedStore
    });
  } catch (error) {
    console.error('❌ Error updating store:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// تفعيل/إلغاء تفعيل المتجر
app.patch('/api/companies/:companyId/store/status', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { is_active } = req.body;

    console.log('🔄 تغيير حالة المتجر:', { companyId, is_active });

    // إرجاع بيانات المتجر مع الحالة الجديدة
    const updatedStore = {
      id: `store_${companyId}`,
      company_id: companyId,
      name: `متجر الشركة ${companyId}`,
      description: 'متجر إلكتروني متميز',
      phone: '+966501234567',
      email: 'store@company.com',
      address: 'الرياض، المملكة العربية السعودية',
      website: 'https://store.company.com',
      logo_url: 'https://via.placeholder.com/200x200',
      is_active: is_active,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedStore
    });
  } catch (error) {
    console.error('❌ Error toggling store status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
        id, conversation_id, company_id, sender_id, recipient_id,
        message_text, facebook_message_id, direction, status,
        sent_at, created_at,
        COALESCE(sent_at, created_at) as display_time
       FROM messages
       WHERE conversation_id = ?
       ORDER BY COALESCE(sent_at, created_at) DESC
       LIMIT ?`,
      [conversationId, parseInt(limit as string)]
    );

    console.log('📊 [DEBUG] عدد الرسائل الموجودة:', messages.length);

    // عكس الترتيب للعرض
    const sortedMessages = messages.reverse();

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

      // جلب إعدادات Facebook للصفحة
      const [facebookSettings] = await pool.execute(
        'SELECT * FROM facebook_settings WHERE page_id = ? AND is_active = 1',
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
        WHERE c.facebook_page_id = ? AND c.user_id = ?
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

    // جلب جميع الصفحات النشطة للشركة
    const [activePages] = await pool.execute(`
      SELECT page_id, page_name, access_token, company_id
      FROM facebook_settings
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
          SELECT DISTINCT c.facebook_page_id, c.user_id, c.updated_at
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
              .filter(conv => conv.facebook_page_id && conv.user_id)
              .filter(conv => canSyncConversation(conv.facebook_page_id, conv.user_id));

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
                    user_id: conv.userId
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
        'SELECT id FROM conversations WHERE user_id = ? AND facebook_page_id = ? AND company_id = ?',
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
            `INSERT INTO conversations (id, company_id, user_id, facebook_page_id, status, unread_messages, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'active', 0, NOW(), NOW())`,
            [newConversationId, setting.company_id, recipientId, setting.page_id]
          );
          conversationId = newConversationId;
        } catch (conversationError: any) {
          if (conversationError.code === 'ER_DUP_ENTRY') {
            // المحادثة تم إنشاؤها بواسطة عملية أخرى - ابحث عنها مرة أخرى
            const [retryConversation] = await pool.execute(
              'SELECT id FROM conversations WHERE user_id = ? AND facebook_page_id = ? AND company_id = ?',
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
          id, conversation_id, company_id, sender_id, recipient_id,
          message_text, facebook_message_id, direction, status,
          sent_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'outgoing', 'delivered', ?, ?)`,
        [
          messageId,
          conversationId,
          setting.company_id,
          setting.page_id,
          recipientId,
          messageText,
          message.id,
          createdAt,
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

    // جلب جميع الصفحات النشطة للشركة
    const [activePages] = await pool.execute(`
      SELECT page_id, page_name, access_token, company_id
      FROM facebook_settings
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
          SELECT DISTINCT c.facebook_page_id, c.user_id, c.last_message_at
          FROM conversations c
          WHERE c.company_id = ? AND c.facebook_page_id = ?
          AND c.last_message_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
          ORDER BY c.last_message_at DESC
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
              .filter(conversation => canSyncConversation(conversation.facebook_page_id, conversation.user_id));

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

    // جلب جميع الصفحات النشطة
    const [activePages] = await pool.execute(`
      SELECT page_id, page_name, access_token, company_id
      FROM facebook_settings
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

    // جلب جميع الصفحات النشطة
    const [activePages] = await pool.execute(`
      SELECT page_id, page_name, access_token, company_id
      FROM facebook_settings
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

    // جلب جميع الصفحات النشطة
    const [activePages] = await pool.execute(`
      SELECT page_id, page_name, access_token, company_id
      FROM facebook_settings
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
          SELECT DISTINCT c.facebook_page_id, c.user_id, c.updated_at
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
              .filter(conversation => canSyncConversation(conversation.facebook_page_id, conversation.user_id));

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

// مزامنة فورية عند بدء الخادم (بعد 10 ثواني)
const initialSyncTimeout = setTimeout(() => {
  try {
    console.log('🚀 [SYNC] بدء المزامنة الأولية السريعة...');
    syncOutgoingMessages();
  } catch (error) {
    console.error('❌ [SYNC] خطأ في المزامنة الأولية:', error);
  }
}, 5000); // 5 ثوان للرسائل الجماعية

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
        SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as incoming_messages,
        SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as outgoing_messages,
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

    // الحصول على access_token من إعدادات Facebook
    const [settingsRows] = await pool.execute(
      'SELECT access_token FROM facebook_settings WHERE company_id = ? AND is_active = TRUE LIMIT 1',
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
    const imageUrl = `http://localhost:3002/uploads/images/${fileName}`;

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
      `INSERT INTO messages (id, conversation_id, company_id, sender_id, recipient_id, message_text, facebook_message_id, direction, status, sent_at, created_at, image_url)
       VALUES (?, ?, (SELECT company_id FROM conversations WHERE id = ?), ?, ?, ?, ?, 'outgoing', 'sent', NOW(), NOW(), ?)`,
      [messageUuid, conversation_id, conversation_id, recipient_id, recipient_id, '[صورة]', facebookResult.message_id, imageUrl]
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
// 🚀 بدء الخادم
// ===================================

app.listen(PORT, () => {
  console.log(`🚀 Message Processing API started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`📡 External access: http://${SERVER_CONFIG.EXTERNAL_HOST}:${PORT}`);
  console.log(`🔗 Process message endpoint: http://${SERVER_CONFIG.EXTERNAL_HOST}:${PORT}/api/process-message`);
  console.log(`🔗 Debug conversations endpoint: http://${SERVER_CONFIG.EXTERNAL_HOST}:${PORT}/api/conversations`);
  console.log(`🔗 Debug messages endpoint: http://${SERVER_CONFIG.EXTERNAL_HOST}:${PORT}/api/messages/recent`);
  console.log(`🔗 Debug send message endpoint: http://localhost:${PORT}/api/send-message`);
  console.log(`🏪 Store management endpoint: http://localhost:${PORT}/api/companies/{companyId}/store`);
  console.log('✅ [SERVER] الخادم يعمل بشكل مستقر مع معالجة الأخطاء');
});

// معالجة الطلبات غير الموجودة
app.use((req: express.Request, res: express.Response) => {
  console.log(`⚠️ [404] طلب غير موجود: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'الصفحة المطلوبة غير موجودة'
  });
});

// ===================================
// 🚀 بدء الخادم
// ===================================

// بدء الخادم مع معالجة الأخطاء
const server = app.listen(PORT, () => {
  console.log(`🚀 Message Processing API started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`📡 External access: http://192.168.1.3:${PORT}`);
  console.log(`🔗 Process message endpoint: http://192.168.1.3:${PORT}/api/process-message`);
  console.log(`🔗 Debug conversations endpoint: http://192.168.1.3:${PORT}/api/conversations`);
  console.log(`🔗 Debug messages endpoint: http://192.168.1.3:${PORT}/api/messages/recent`);
  console.log(`🔗 Debug send message endpoint: http://localhost:${PORT}/api/send-message`);
  console.log(`🏪 Store management endpoint: http://localhost:${PORT}/api/companies/{companyId}/store`);
  console.log(`✅ [SERVER] الخادم يعمل بشكل مستقر مع معالجة الأخطاء`);

  // بدء مراقبة الخادم
  if (SERVER_CONFIG.MONITORING.ENABLED) {
    console.log(`🔍 [MONITOR] بدء مراقبة الخادم...`);
    serverMonitor.startMonitoring(SERVER_CONFIG.MONITORING.INTERVAL_MS);
  }

  // تقرير إحصائيات الرسائل الصادرة كل دقيقة
  setInterval(() => {
    const avgPerMinute = outgoingMessageStats.sentPerMinute.length > 0
      ? Math.round(outgoingMessageStats.sentPerMinute.reduce((a, b) => a + b, 0) / outgoingMessageStats.sentPerMinute.length)
      : 0;

    if (outgoingMessageStats.totalSent > 0) {
      console.log(`📊 [OUTGOING STATS] الرسائل الصادرة:`);
      console.log(`   📤 هذه الدقيقة: ${outgoingMessageStats.sentThisMinute} رسالة`);
      console.log(`   📈 متوسط الدقيقة: ${avgPerMinute} رسالة`);
      console.log(`   🎯 إجمالي مرسل: ${outgoingMessageStats.totalSent} رسالة`);
      console.log(`   📋 آخر 10 دقائق: [${outgoingMessageStats.sentPerMinute.join(', ')}]`);
    }
  }, 60000); // كل دقيقة
});

// ===================================
// 📦 Products API
// ===================================

// جلب المنتجات للشركة
app.get('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log('🔍 [PRODUCTS] جلب المنتجات للشركة:', companyId);

    const products = await executeQuery(
      'SELECT * FROM products WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );

    console.log('✅ [PRODUCTS] تم جلب', products.length, 'منتج');

    res.json({
      success: true,
      data: products || []
    });
  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في جلب المنتجات:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب المنتجات'
    });
  }
});

// إضافة منتج جديد
app.post('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    const data = req.body;

    console.log('🏪 [PRODUCTS] إضافة منتج جديد للشركة:', companyId);
    console.log('📦 [PRODUCTS] اسم المنتج:', data.name);

    if (!data.name || data.name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'اسم المنتج مطلوب'
      });
    }

    const productId = crypto.randomUUID();

    await executeQuery(`
      INSERT INTO products (
        id, company_id, name, description, short_description, sku,
        price, sale_price, stock_quantity, category, brand,
        image_url, featured, weight, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
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
    ]);

    // جلب المنتج المُنشأ
    const newProduct = await executeQuery(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    console.log('✅ [PRODUCTS] تم إضافة المنتج بنجاح');

    res.json({
      success: true,
      data: newProduct[0]
    });
  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في إضافة المنتج:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إضافة المنتج'
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

    const products = await executeQuery(
      'SELECT * FROM products WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );

    console.log('✅ [PRODUCTS] تم جلب', products.length, 'منتج');

    res.json({
      success: true,
      data: products || []
    });
  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في جلب المنتجات:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب المنتجات'
    });
  }
});

// إضافة منتج جديد
app.post('/api/companies/:companyId/products', async (req, res) => {
  try {
    const { companyId } = req.params;
    const data = req.body;

    console.log('🏪 [PRODUCTS] إضافة منتج جديد للشركة:', companyId);
    console.log('📦 [PRODUCTS] اسم المنتج:', data.name);

    if (!data.name || data.name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'اسم المنتج مطلوب'
      });
    }

    const productId = crypto.randomUUID();

    await executeQuery(`
      INSERT INTO products (
        id, company_id, name, description, short_description, sku,
        price, sale_price, stock_quantity, category, brand,
        image_url, featured, weight, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
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
    ]);

    // جلب المنتج المُنشأ
    const newProduct = await executeQuery(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    console.log('✅ [PRODUCTS] تم إضافة المنتج بنجاح');

    res.json({
      success: true,
      data: newProduct[0]
    });
  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في إضافة المنتج:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إضافة المنتج'
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

    const products = await executeQuery(
      'SELECT * FROM products_temp WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );

    console.log('✅ [PRODUCTS] تم جلب', products.length, 'منتج');

    res.json({
      success: true,
      data: products || []
    });
  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في جلب المنتجات:', error);
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

    console.log('📋 [PRODUCTS] بيانات الإدراج:', insertData);

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

    console.log('✅ [PRODUCTS] تم إدراج المنتج في قاعدة البيانات');

    // جلب المنتج المُنشأ
    const newProduct = await executeQuery(
      'SELECT * FROM products_temp WHERE id = ?',
      [productId]
    );

    console.log('✅ [PRODUCTS] تم إضافة المنتج بنجاح');

    res.json({
      success: true,
      data: newProduct[0]
    });
  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في إضافة المنتج:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إضافة المنتج: ' + error.message
    });
  }
});

// معالجة أخطاء الخادم
server.on('error', (error: any) => {
  console.error('❌ [SERVER ERROR]:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.error(`🚫 المنفذ ${PORT} مستخدم بالفعل!`);
  }
});

export default app;
