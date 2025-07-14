// 🚀 خادم API جديد يستخدم MySQL بدلاً من Supabase
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
// import { processIncomingMessage } from './process-message'; // مؤقتاً معطل
// import geminiRouter from './gemini-routes'; // مؤقتاً معطل
import whatsappBaileysRoutes from './whatsapp-baileys-routes';
// import subscriptionRouter from './subscription-routes'; // مؤقتاً معطل
import { requestLogger, errorHandler, notFoundHandler } from './middleware/auth';
import analyticsRoutes from './analytics-routes';
import { ErrorHandler, createSuccessResponse } from '../utils/errorHandler';

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

// خدمة الملفات الثابتة من dist
app.use(express.static(path.join(process.cwd(), 'dist')));

// صفحة اختبار إعدادات Gemini
app.get('/gemini-test', (req, res) => {
  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>اختبار إعدادات Gemini AI</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #555;
        }

        input, textarea, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
            box-sizing: border-box;
        }

        input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }

        textarea {
            height: 100px;
            resize: vertical;
        }

        .button-group {
            display: flex;
            gap: 15px;
            margin-top: 30px;
        }

        button {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5a67d8;
            transform: translateY(-2px);
        }

        .btn-success {
            background: #48bb78;
            color: white;
        }

        .btn-success:hover {
            background: #38a169;
            transform: translateY(-2px);
        }

        .btn-warning {
            background: #ed8936;
            color: white;
        }

        .btn-warning:hover {
            background: #dd6b20;
            transform: translateY(-2px);
        }

        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: bold;
        }

        .status.success {
            background: #c6f6d5;
            color: #22543d;
            border: 1px solid #9ae6b4;
        }

        .status.error {
            background: #fed7d7;
            color: #742a2a;
            border: 1px solid #fc8181;
        }

        .status.info {
            background: #bee3f8;
            color: #2a4365;
            border: 1px solid #90cdf4;
        }

        .current-settings {
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
        }

        .settings-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
            border-bottom: 1px solid #e2e8f0;
        }

        .settings-row:last-child {
            border-bottom: none;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 اختبار إعدادات Gemini AI</h1>

        <div id="status"></div>

        <div class="current-settings" id="currentSettings">
            <h3>الإعدادات الحالية:</h3>
            <div id="settingsDisplay">جاري التحميل...</div>
        </div>

        <form id="settingsForm">
            <div class="form-group">
                <label for="apiKey">مفتاح API:</label>
                <input type="text" id="apiKey" value="AIzaSyBuyJo61LpnmBl3KedaU_79PNzQZfhu3Pw" required>
            </div>

            <div class="form-group">
                <label for="model">النموذج:</label>
                <select id="model">
                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp</option>
                </select>
            </div>

            <div class="form-group">
                <label for="systemPrompt">الرسالة النظامية:</label>
                <textarea id="systemPrompt" placeholder="أنت مساعد ذكي لمتجر سوان شوب..."></textarea>
            </div>

            <div class="form-group">
                <label for="temperature">درجة الحرارة (0.0 - 1.0):</label>
                <input type="number" id="temperature" min="0" max="1" step="0.1" value="0.7">
            </div>

            <div class="form-group">
                <label for="maxTokens">الحد الأقصى للرموز:</label>
                <input type="number" id="maxTokens" min="100" max="4000" value="1500">
            </div>

            <div class="form-group">
                <label for="isActive">مفعل:</label>
                <select id="isActive">
                    <option value="true">نعم</option>
                    <option value="false">لا</option>
                </select>
            </div>

            <div class="button-group">
                <button type="button" class="btn-primary" onclick="loadSettings()">تحميل الإعدادات</button>
                <button type="button" class="btn-success" onclick="saveSettings()">حفظ الإعدادات</button>
                <button type="button" class="btn-warning" onclick="testConnection()">اختبار الاتصال</button>
            </div>
        </form>

        <div class="loading" id="loading">
            <div class="spinner"></div>
            <div>جاري المعالجة...</div>
        </div>
    </div>

    <script>
        const COMPANY_ID = '2d9b8887-0cca-430b-b61b-ca16cccfec63';
        const API_BASE = 'http://localhost:3002';

        function showStatus(message, type = 'info') {
            const statusDiv = document.getElementById('status');
            statusDiv.innerHTML = \`<div class="status \${type}">\${message}</div>\`;
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 5000);
        }

        function showLoading(show = true) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
        }

        async function loadSettings() {
            showLoading(true);
            try {
                const response = await fetch(\`\${API_BASE}/api/gemini/settings?company_id=\${COMPANY_ID}\`);
                const data = await response.json();

                if (response.ok) {
                    // تحديث النموذج
                    document.getElementById('apiKey').value = data.hasApiKey ? 'AIzaSyBuyJo61LpnmBl3KedaU_79PNzQZfhu3Pw' : '';
                    document.getElementById('model').value = data.model_name || 'gemini-1.5-flash';
                    document.getElementById('systemPrompt').value = data.system_prompt || '';
                    document.getElementById('temperature').value = data.temperature || 0.7;
                    document.getElementById('maxTokens').value = data.max_tokens || 1500;
                    document.getElementById('isActive').value = data.is_active ? 'true' : 'false';

                    // تحديث العرض
                    updateSettingsDisplay(data);
                    showStatus('تم تحميل الإعدادات بنجاح!', 'success');
                } else {
                    showStatus(\`خطأ في تحميل الإعدادات: \${data.error}\`, 'error');
                }
            } catch (error) {
                showStatus(\`خطأ في الاتصال: \${error.message}\`, 'error');
            }
            showLoading(false);
        }

        function updateSettingsDisplay(data) {
            const display = document.getElementById('settingsDisplay');
            display.innerHTML = \`
                <div class="settings-row">
                    <span><strong>النموذج:</strong></span>
                    <span>\${data.model_name || 'غير محدد'}</span>
                </div>
                <div class="settings-row">
                    <span><strong>درجة الحرارة:</strong></span>
                    <span>\${data.temperature || 'غير محدد'}</span>
                </div>
                <div class="settings-row">
                    <span><strong>الحد الأقصى للرموز:</strong></span>
                    <span>\${data.max_tokens || 'غير محدد'}</span>
                </div>
                <div class="settings-row">
                    <span><strong>الحالة:</strong></span>
                    <span>\${data.is_active ? '✅ مفعل' : '❌ غير مفعل'}</span>
                </div>
                <div class="settings-row">
                    <span><strong>API Key:</strong></span>
                    <span>\${data.hasApiKey ? '✅ موجود' : '❌ غير موجود'}</span>
                </div>
                <div class="settings-row">
                    <span><strong>آخر تحديث:</strong></span>
                    <span>\${data.updated_at || 'غير محدد'}</span>
                </div>
            \`;
        }

        async function saveSettings() {
            showLoading(true);

            const settings = {
                company_id: COMPANY_ID,
                api_key: document.getElementById('apiKey').value,
                model_name: document.getElementById('model').value,
                system_prompt: document.getElementById('systemPrompt').value,
                temperature: parseFloat(document.getElementById('temperature').value),
                max_tokens: parseInt(document.getElementById('maxTokens').value),
                is_active: document.getElementById('isActive').value === 'true'
            };

            try {
                // استخدام test-db endpoint للحفظ المباشر
                const query = \`UPDATE ai_settings SET
                    api_key = '\${settings.api_key}',
                    model_name = '\${settings.model_name}',
                    system_prompt = '\${settings.system_prompt.replace(/'/g, "\\\\'")}',
                    temperature = '\${settings.temperature}',
                    max_tokens = \${settings.max_tokens},
                    is_active = \${settings.is_active ? 1 : 0},
                    updated_at = NOW()
                    WHERE company_id = '\${COMPANY_ID}' AND provider = 'gemini'\`;

                const response = await fetch(\`\${API_BASE}/api/test-db\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });

                const data = await response.json();

                if (data.success) {
                    showStatus('تم حفظ الإعدادات بنجاح!', 'success');
                    loadSettings(); // إعادة تحميل الإعدادات
                } else {
                    showStatus(\`خطأ في حفظ الإعدادات: \${data.error}\`, 'error');
                }
            } catch (error) {
                showStatus(\`خطأ في الاتصال: \${error.message}\`, 'error');
            }

            showLoading(false);
        }

        async function testConnection() {
            showLoading(true);

            try {
                const response = await fetch(\`\${API_BASE}/api/gemini/test\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        company_id: COMPANY_ID,
                        message: 'مرحبا، هذا اختبار للاتصال مع Gemini AI'
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showStatus(\`✅ نجح اختبار الاتصال! النموذج: \${data.model}\`, 'success');
                } else {
                    showStatus(\`❌ فشل اختبار الاتصال: \${data.error || 'خطأ غير معروف'}\`, 'error');
                }
            } catch (error) {
                showStatus(\`❌ خطأ في اختبار الاتصال: \${error.message}\`, 'error');
            }

            showLoading(false);
        }

        // تحميل الإعدادات عند تحميل الصفحة
        window.onload = function() {
            loadSettings();
        };
    </script>
</body>
</html>`;

  res.send(htmlContent);
});

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

// إنشاء الجداول المطلوبة للمتجر الإلكتروني
async function createEcommerceTablesIfNotExist() {
  const pool = getPool();

  try {
    // جدول الفئات
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(36) PRIMARY KEY,
        company_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        status ENUM('active', 'inactive') DEFAULT 'active',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_id (company_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // جدول المنتجات
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        company_id VARCHAR(36) NOT NULL,
        category_id VARCHAR(36),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        sku VARCHAR(100),
        price DECIMAL(10,2) NOT NULL,
        sale_price DECIMAL(10,2),
        stock_quantity INT DEFAULT 0,
        manage_stock BOOLEAN DEFAULT TRUE,
        status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
        image_url VARCHAR(500),
        gallery JSON,
        weight DECIMAL(8,2),
        dimensions JSON,
        meta_title VARCHAR(255),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_id (company_id),
        INDEX idx_category_id (category_id),
        INDEX idx_status (status),
        INDEX idx_sku (sku),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // جدول الطلبات - إنشاء إذا لم يكن موجوداً
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        company_id VARCHAR(36) NOT NULL,
        order_number VARCHAR(50) UNIQUE,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        customer_address TEXT,
        billing_address JSON,
        shipping_address JSON,
        status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2),
        tax_amount DECIMAL(10,2) DEFAULT 0,
        shipping_amount DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'USD',
        payment_method ENUM('cash_on_delivery', 'credit_card', 'bank_transfer', 'paypal', 'stripe') DEFAULT 'cash_on_delivery',
        payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
        payment_reference VARCHAR(255),
        notes TEXT,
        internal_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_id (company_id),
        INDEX idx_status (status),
        INDEX idx_payment_status (payment_status),
        INDEX idx_order_number (order_number),
        INDEX idx_customer_email (customer_email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);



    // جدول عناصر الطلبات
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(36) PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_sku VARCHAR(100),
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        product_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id),
        INDEX idx_product_id (product_id),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ [DATABASE] تم إنشاء جداول المتجر الإلكتروني بنجاح');
  } catch (error) {
    console.error('❌ [DATABASE] خطأ في إنشاء جداول المتجر الإلكتروني:', error);
  }
}

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
    const legacyPages = await FacebookService.getByCompanyIdLegacy('2d9b8887-0cca-430b-b61b-ca16cccfec63');
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
    `, ['2d9b8887-0cca-430b-b61b-ca16cccfec63']);

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

    const success = await GeminiService.update(company_id, updateData);

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

// اختبار اتصال Gemini AI
app.post('/api/gemini/test', async (req, res) => {
  try {
    const { company_id, message } = req.body;

    if (!company_id || !message) {
      return res.status(400).json({ error: 'company_id and message are required' });
    }

    // الحصول على إعدادات Gemini للشركة
    const settings = await GeminiService.getByCompanyId(company_id);

    if (!settings) {
      return res.status(404).json({ error: 'Gemini settings not found for this company' });
    }

    if (!settings.api_key) {
      return res.status(400).json({ error: 'Gemini API key not configured' });
    }

    if (!settings.is_active) {
      return res.status(400).json({ error: 'Gemini AI is not active for this company' });
    }

    // محاكاة اختبار Gemini (يمكن استبدالها بـ API call حقيقي)
    const testResponse = {
      success: true,
      message: 'تم اختبار الاتصال بنجاح!',
      model: settings.model_name,
      temperature: settings.temperature,
      max_tokens: settings.max_tokens,
      test_input: message,
      test_output: `مرحباً! هذا رد تجريبي من ${settings.model_name}. رسالتك كانت: "${message}"`
    };

    res.json(testResponse);
  } catch (error) {
    console.error('❌ Error testing Gemini connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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

// 🏪 مسارات المتجر الإلكتروني (مؤقتاً معطل حتى إنشاء جداول المتجر)
import storeRoutes from './store-routes';
import ordersRoutes from './orders-routes';

// app.use('/api', storeRoutes);  // معطل مؤقتاً
// app.use('/api', ordersRoutes); // معطل مؤقتاً

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

    // 1. البحث عن الشركة المرتبطة بالصفحة
    let pageSettings = [];

    // البحث في الجدول الموحد أولاً
    const [unifiedPageSettings] = await pool.execute(
      'SELECT company_id FROM facebook_pages_unified WHERE page_id = ? AND is_active = 1',
      [pageId]
    );

    if (unifiedPageSettings && unifiedPageSettings.length > 0) {
      pageSettings = unifiedPageSettings;
      console.log('🔍 تم العثور على الصفحة في الجدول الموحد');
    } else {
      // البحث في الجدول القديم
      console.log('🔍 البحث في الجدول القديم facebook_settings...');
      const [oldPageSettings] = await pool.execute(
        'SELECT company_id FROM facebook_settings WHERE page_id = ? AND is_active = 1',
        [pageId]
      );

      if (oldPageSettings && oldPageSettings.length > 0) {
        pageSettings = oldPageSettings;
        console.log('🔍 تم العثور على الصفحة في الجدول القديم');
      }
    }

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
      'SELECT customer_name, participant_id FROM conversations WHERE id = ?',
      [conversationId]
    );

    if (conversationData && conversationData.length > 0) {
      const conversation = conversationData[0];
      const needsNameUpdate = !conversation.customer_name ||
        conversation.customer_name === '' ||
        conversation.customer_name === 'undefined' ||
        conversation.customer_name === 'null' ||
        conversation.customer_name === 'بدون اسم';

      console.log(`👤 اسم المستخدم الحالي: "${conversation.customer_name}" | يحتاج تحديث: ${needsNameUpdate}`);

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
                'SELECT customer_name FROM conversations WHERE id = ?',
                [conversationId]
              );
              if (updatedData && updatedData.length > 0) {
                console.log(`🎉 الاسم الجديد: "${updatedData[0].customer_name}"`);

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
        console.log(`✅ المستخدم ${senderId} لديه اسم بالفعل: "${conversation.customer_name}"`);
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
    console.log('🚀 [WEBHOOK] بدء معالجة webhook - تحديث جديد!');

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
                console.log('🔥 [DEBUG] وصلنا إلى نقطة فحص Gemini AI!');

                // معالجة الرد التلقائي بـ Gemini AI (فقط للرسائل من العملاء)
                console.log('🔍 [WEBHOOK] فحص شروط Gemini AI:', {
                  isEcho: messageRequest.isEcho,
                  senderId: messageRequest.senderId,
                  pageId: messageRequest.pageId,
                  condition1: !messageRequest.isEcho,
                  condition2: messageRequest.senderId !== messageRequest.pageId,
                  finalCondition: !messageRequest.isEcho && messageRequest.senderId !== messageRequest.pageId
                });

                if (!messageRequest.isEcho && messageRequest.senderId !== messageRequest.pageId) {
                  console.log('🤖 [WEBHOOK] بدء معالجة الرد التلقائي بـ Gemini AI...');

                  try {
                    // استيراد خدمة Gemini
                    const { SimpleGeminiService } = await import('../services/simpleGeminiService');

                    // إنشاء conversation ID مؤقت إذا لم يكن موجود
                    const conversationId = savedMessage?.conversation_id || `temp_${messageRequest.senderId}_${Date.now()}`;

                    // معالجة الرسالة بـ Gemini AI
                    const aiSuccess = await SimpleGeminiService.processMessage(
                      messageRequest.messageText,
                      conversationId,
                      messageRequest.senderId,
                      messageRequest.pageId
                    );

                    if (aiSuccess) {
                      console.log('✅ [WEBHOOK] تم إرسال رد Gemini AI بنجاح');
                    } else {
                      console.log('⚠️ [WEBHOOK] فشل في إرسال رد Gemini AI');
                    }
                  } catch (aiError) {
                    console.error('❌ [WEBHOOK] خطأ في معالجة Gemini AI:', aiError);
                  }
                } else {
                  console.log('⏭️ [WEBHOOK] تخطي الرد التلقائي - رسالة صادرة أو echo');
                }

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
      WHERE company_id = '2d9b8887-0cca-430b-b61b-ca16cccfec63'
    `);

    const oldCount = (oldConversations as any[])[0].count;
    console.log(`📊 المحادثات تحت company_id القديم: ${oldCount}`);

    if (oldCount > 0) {
      console.log('🔄 تحديث company_id للمحادثات...');

      // تحديث المحادثات
      const [conversationsUpdate] = await pool.execute(`
        UPDATE conversations
        SET company_id = ?
        WHERE company_id = '2d9b8887-0cca-430b-b61b-ca16cccfec63'
      `, [testCompany.id]);

      // تحديث الرسائل
      const [messagesUpdate] = await pool.execute(`
        UPDATE messages
        SET company_id = ?
        WHERE company_id = '2d9b8887-0cca-430b-b61b-ca16cccfec63'
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
    const sourceCompanyId = fromCompanyId || '2d9b8887-0cca-430b-b61b-ca16cccfec63';
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
    `, ['2d9b8887-0cca-430b-b61b-ca16cccfec63']);

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
        clear_command: "/* localStorage.clear معطل */",
        set_company: `/* localStorage.setItem معطل */}');`,
        reload_page: "window.location.reload();"
      },
      instructions: [
        "1. افتح Developer Tools (F12)",
        "2. اذهب إلى Console",
        "3. نفذ الأوامر التالية:",
        "   /* localStorage.clear معطل */",
        `   /* localStorage.setItem معطل */}');`,
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
            /* localStorage.clear معطل */
            console.log('✅ تم تنظيف localStorage');

            // إعداد بيانات الشركة الجديدة
            const companyData = ${JSON.stringify(company)};
            /* localStorage.setItem معطل */
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
    `, ['2d9b8887-0cca-430b-b61b-ca16cccfec63']);

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
    `, ['2d9b8887-0cca-430b-b61b-ca16cccfec63']);

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
    `, ['2d9b8887-0cca-430b-b61b-ca16cccfec63']);

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
    `, ['2d9b8887-0cca-430b-b61b-ca16cccfec63']);

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
    `, ['2d9b8887-0cca-430b-b61b-ca16cccfec63']);

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
    `, [req.query.company_id || '2d9b8887-0cca-430b-b61b-ca16cccfec63']);

    // إحصائيات المحادثات
    const [conversationStats] = await pool.execute(`
      SELECT
        COUNT(*) as total_conversations,
        COUNT(DISTINCT facebook_page_id) as connected_pages
      FROM conversations
      WHERE company_id = ?
    `, [req.query.company_id || '2d9b8887-0cca-430b-b61b-ca16cccfec63']);

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

// Test database endpoint
app.post('/api/test-db', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('🔍 [TEST] تنفيذ استعلام:', query);

    const pool = getPool();
    const [results] = await pool.execute(query);

    res.json({
      success: true,
      results: results,
      count: results.length
    });
  } catch (error) {
    console.error('❌ [TEST] خطأ في الاستعلام:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Migrate from old facebook_settings to unified table
app.post('/api/facebook/migrate-to-unified', async (req, res) => {
  try {
    const { company_id } = req.body;
    console.log('🔄 [MIGRATE] ترحيل البيانات للشركة:', company_id);

    const pool = getPool();

    // جلب البيانات من الجدول القديم
    const [oldSettings] = await pool.execute(`
      SELECT * FROM facebook_settings
      WHERE company_id = ? AND is_active = 1
    `, [company_id]);

    if (!oldSettings || oldSettings.length === 0) {
      return res.json({
        success: false,
        message: 'لا توجد إعدادات Facebook في الجدول القديم'
      });
    }

    let migratedCount = 0;

    for (const setting of oldSettings) {
      // التحقق من عدم وجود الصفحة في الجدول الموحد
      const [existing] = await pool.execute(`
        SELECT id FROM facebook_pages_unified
        WHERE page_id = ? AND company_id = ?
      `, [setting.page_id, company_id]);

      if (existing && existing.length > 0) {
        console.log('⚠️ [MIGRATE] الصفحة موجودة مسبقاً:', setting.page_id);
        continue;
      }

      // إدراج في الجدول الموحد
      await pool.execute(`
        INSERT INTO facebook_pages_unified (
          page_id, page_name, access_token, company_id,
          verify_token, webhook_enabled, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        setting.page_id,
        setting.page_name || 'Migrated Page',
        setting.access_token,
        company_id,
        setting.webhook_verify_token || 'facebook_verify_token_123',
        1, // webhook_enabled
        1  // is_active
      ]);

      migratedCount++;
      console.log('✅ [MIGRATE] تم ترحيل الصفحة:', setting.page_id);
    }

    res.json({
      success: true,
      message: `تم ترحيل ${migratedCount} صفحة بنجاح`,
      migrated_count: migratedCount
    });

  } catch (error) {
    console.error('❌ [MIGRATE] خطأ في الترحيل:', error);
    res.status(500).json({
      success: false,
      error: error.message
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

// تنظيف الأسماء الافتراضية
app.post('/api/companies/:companyId/cleanup-default-names', async (req, res) => {
  try {
    const { companyId } = req.params;

    console.log(`🧹 [API] طلب تنظيف الأسماء الافتراضية للشركة: ${companyId}`);

    const { MySQLNameUpdateService } = await import('../services/mysqlNameUpdateService');
    const result = await MySQLNameUpdateService.cleanupDefaultNames(companyId);

    res.json(result);
  } catch (error) {
    console.error('❌ [API] خطأ في تنظيف الأسماء الافتراضية:', error);
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
// 🏥 فحص صحة النظام
// ===================================

// endpoint لفحص صحة النظام
app.get('/api/companies/:companyId/health-check', async (req, res) => {
  try {
    const { companyId } = req.params;

    console.log(`🏥 [API] طلب فحص صحة النظام للشركة: ${companyId}`);

    const { healthCheck } = await import('../services/systemHealthCheck');
    const results = await healthCheck.runFullHealthCheck(companyId);

    const hasErrors = results.some(r => r.status === 'error');
    const hasWarnings = results.some(r => r.status === 'warning');

    const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy';
    const statusCode = hasErrors ? 500 : hasWarnings ? 200 : 200;

    res.status(statusCode).json({
      success: !hasErrors,
      status,
      results,
      report: healthCheck.generateHealthReport(results),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [API] خطأ في فحص صحة النظام:', error);
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

    const pool = getPool();

    // التحقق من وجود الشركة أولاً
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // البحث عن المتجر في قاعدة البيانات
    const [stores] = await pool.execute(
      'SELECT * FROM stores WHERE company_id = ?',
      [companyId]
    );

    let store;

    if (stores.length > 0) {
      // المتجر موجود - إرجاع البيانات الحقيقية
      store = stores[0];
      console.log(`✅ [API] تم جلب متجر موجود: ${store.id}`);
    } else {
      // المتجر غير موجود - إنشاء متجر افتراضي
      console.log(`🏪 [API] إنشاء متجر افتراضي للشركة: ${companyId}`);

      const storeId = crypto.randomUUID();
      const companyName = companies[0].name;

      const newStore = {
        id: storeId,
        company_id: companyId,
        name: `متجر ${companyName}`,
        description: 'متجر إلكتروني متميز يقدم أفضل المنتجات والخدمات',
        phone: '+966501234567',
        email: `store@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        address: 'الرياض، المملكة العربية السعودية',
        website: 'https://store.example.com',
        logo_url: 'https://via.placeholder.com/200x200?text=Store+Logo',
        banner_url: null,
        theme_color: '#3B82F6',
        currency: 'SAR',
        language: 'ar',
        timezone: 'Asia/Riyadh',
        is_active: true,
        is_featured: false,
        social_facebook: null,
        social_instagram: null,
        social_twitter: null,
        social_whatsapp: null,
        business_hours: JSON.stringify({
          sunday: { open: '09:00', close: '22:00', closed: false },
          monday: { open: '09:00', close: '22:00', closed: false },
          tuesday: { open: '09:00', close: '22:00', closed: false },
          wednesday: { open: '09:00', close: '22:00', closed: false },
          thursday: { open: '09:00', close: '22:00', closed: false },
          friday: { open: '14:00', close: '22:00', closed: false },
          saturday: { open: '09:00', close: '22:00', closed: false }
        }),
        shipping_info: JSON.stringify({
          free_shipping_threshold: 200,
          shipping_cost: 25,
          delivery_time: '2-3 أيام عمل'
        }),
        return_policy: 'يمكن إرجاع المنتجات خلال 14 يوم من تاريخ الشراء',
        terms_conditions: 'الشروط والأحكام الخاصة بالمتجر',
        privacy_policy: 'سياسة الخصوصية الخاصة بالمتجر',
        seo_title: `متجر ${companyName} - أفضل المنتجات`,
        seo_description: `تسوق من متجر ${companyName} واحصل على أفضل المنتجات بأسعار مميزة`,
        seo_keywords: `متجر، ${companyName}، تسوق، منتجات`,
        analytics_google: null,
        analytics_facebook: null,
        settings: JSON.stringify({
          allow_guest_checkout: true,
          require_account: false,
          auto_approve_reviews: false,
          show_stock_quantity: true
        }),
        location: null
      };

      // إدراج المتجر الجديد في قاعدة البيانات
      await pool.execute(`
        INSERT INTO stores (
          id, company_id, name, description, phone, email, address, website,
          logo_url, banner_url, theme_color, currency, language, timezone,
          is_active, is_featured, social_facebook, social_instagram, social_twitter,
          social_whatsapp, business_hours, shipping_info, return_policy,
          terms_conditions, privacy_policy, seo_title, seo_description,
          seo_keywords, analytics_google, analytics_facebook, settings, location,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        newStore.id, newStore.company_id, newStore.name, newStore.description,
        newStore.phone, newStore.email, newStore.address, newStore.website,
        newStore.logo_url, newStore.banner_url, newStore.theme_color,
        newStore.currency, newStore.language, newStore.timezone,
        newStore.is_active, newStore.is_featured, newStore.social_facebook,
        newStore.social_instagram, newStore.social_twitter, newStore.social_whatsapp,
        newStore.business_hours, newStore.shipping_info, newStore.return_policy,
        newStore.terms_conditions, newStore.privacy_policy, newStore.seo_title,
        newStore.seo_description, newStore.seo_keywords, newStore.analytics_google,
        newStore.analytics_facebook, newStore.settings, newStore.location
      ]);

      // جلب المتجر المُنشأ حديثاً
      const [newStores] = await pool.execute(
        'SELECT * FROM stores WHERE id = ?',
        [storeId]
      );

      store = newStores[0];
      console.log(`✅ [API] تم إنشاء متجر جديد: ${store.id}`);
    }

    console.log(`✅ [API] تم جلب معلومات المتجر: ${store.name}`);

    res.json({
      success: true,
      data: store
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
    const updateData = req.body;

    console.log(`🏪 [API] تحديث معلومات المتجر للشركة: ${companyId}`);

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // البحث عن المتجر
    const [stores] = await pool.execute(
      'SELECT * FROM stores WHERE company_id = ?',
      [companyId]
    );

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Store not found for this company'
      });
    }

    const currentStore = stores[0];

    // تحديث المتجر في قاعدة البيانات
    const updateFields = [];
    const updateValues = [];

    if (updateData.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updateData.name);
    }
    if (updateData.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updateData.description);
    }
    if (updateData.phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(updateData.phone);
    }
    if (updateData.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(updateData.email);
    }
    if (updateData.address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(updateData.address);
    }
    if (updateData.website !== undefined) {
      updateFields.push('website = ?');
      updateValues.push(updateData.website);
    }
    if (updateData.logo_url !== undefined) {
      updateFields.push('logo_url = ?');
      updateValues.push(updateData.logo_url);
    }
    if (updateData.banner_url !== undefined) {
      updateFields.push('banner_url = ?');
      updateValues.push(updateData.banner_url);
    }
    if (updateData.theme_color !== undefined) {
      updateFields.push('theme_color = ?');
      updateValues.push(updateData.theme_color);
    }
    if (updateData.currency !== undefined) {
      updateFields.push('currency = ?');
      updateValues.push(updateData.currency);
    }
    if (updateData.language !== undefined) {
      updateFields.push('language = ?');
      updateValues.push(updateData.language);
    }
    if (updateData.timezone !== undefined) {
      updateFields.push('timezone = ?');
      updateValues.push(updateData.timezone);
    }

    // إضافة updated_at
    updateFields.push('updated_at = NOW()');
    updateValues.push(currentStore.id);

    if (updateFields.length > 1) { // أكثر من updated_at فقط
      const updateQuery = `UPDATE stores SET ${updateFields.join(', ')} WHERE id = ?`;
      await pool.execute(updateQuery, updateValues);
    }

    // جلب المتجر المحدث
    const [updatedStores] = await pool.execute(
      'SELECT * FROM stores WHERE id = ?',
      [currentStore.id]
    );

    const updatedStore = updatedStores[0];

    console.log(`✅ [API] تم تحديث معلومات المتجر: ${updatedStore.name}`);

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: updatedStore
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
    const { page = 1, limit = 10, category, search, status = 'active' } = req.query;

    console.log(`📦 [API] جلب المنتجات للشركة: ${companyId}`);

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // التحقق من وجود متجر للشركة
    const [stores] = await pool.execute(
      'SELECT id FROM stores WHERE company_id = ?',
      [companyId]
    );

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Store not found for this company'
      });
    }

    const storeId = stores[0].id;

    // بناء استعلام جلب المنتجات
    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.company_id = ?
    `;
    const queryParams = [companyId];

    // إضافة فلتر الحالة
    if (status === 'active') {
      query += ' AND p.status = "active"';
    } else if (status === 'inactive') {
      query += ' AND p.status = "inactive"';
    }

    // إضافة فلتر الفئة
    if (category) {
      query += ' AND p.category_id = ?';
      queryParams.push(category);
    }

    // إضافة فلتر البحث
    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // إضافة ترتيب
    query += ' ORDER BY p.created_at DESC';

    // تنفيذ الاستعلام للحصول على العدد الإجمالي
    const countQuery = query.replace('SELECT p.*, c.name as category_name', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = countResult[0].total;

    // إضافة pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(Number(limit), offset);

    // تنفيذ الاستعلام الرئيسي
    const [products] = await pool.execute(query, queryParams);

    console.log(`📦 [API] نتائج الاستعلام: ${products.length} منتج مع الفلاتر`);
    console.log(`📦 [API] الفلاتر المطبقة: status=${status}, category=${category}, search=${search}`);

    // التحقق من وجود منتجات للشركة قبل إنشاء منتجات تجريبية
    const [allExistingProducts] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE company_id = ?',
      [companyId]
    );

    console.log(`📦 [API] إجمالي المنتجات الموجودة للشركة: ${allExistingProducts[0].count}`);
    console.log(`📦 [API] شروط إنشاء منتجات تجريبية: count=${allExistingProducts[0].count}, page=${page}, search=${search}, category=${category}`);

    // إذا لم توجد أي منتجات على الإطلاق، إنشاء منتجات تجريبية
    if (allExistingProducts[0].count === 0 && page == 1 && !search && !category) {
      console.log(`📦 [API] ✅ سيتم إنشاء منتجات تجريبية للشركة: ${companyId}`);

      // لا حاجة للتحقق مرة أخرى لأننا تحققنا بالفعل
      console.log(`📦 [API] إنشاء منتجات تجريبية للشركة: ${companyId}`);

      const defaultProducts = [
        {
          id: crypto.randomUUID(),
          company_id: companyId,
          store_id: storeId,
          name: 'منتج تجريبي 1',
          description: 'وصف المنتج التجريبي الأول - منتج عالي الجودة',
          short_description: 'منتج تجريبي عالي الجودة',
          sku: `PROD001_${companyId.substring(0, 8)}`,
          price: 99.99,
          sale_price: 79.99,
          stock_quantity: 50,
          category: 'الإلكترونيات',
          brand: 'العلامة التجارية',
          image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop&crop=center',
          featured: 1,
          weight: 1.5,
          status: 'active',
          category_id: null,
          compare_price: 120.00,
          cost_price: 60.00,
          track_inventory: 1,
          allow_backorder: 0,
          dimensions: JSON.stringify({ length: 30, width: 20, height: 10 }),
          images: JSON.stringify(['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop&crop=center']),
          tags: JSON.stringify(['إلكترونيات', 'جديد', 'مميز']),
          seo_title: 'منتج تجريبي 1 - أفضل جودة',
          seo_description: 'اشتري منتج تجريبي 1 بأفضل سعر وجودة عالية'
        },
        {
          id: crypto.randomUUID(),
          company_id: companyId,
          store_id: storeId,
          name: 'منتج تجريبي 2',
          description: 'وصف المنتج التجريبي الثاني - منتج متميز',
          short_description: 'منتج تجريبي متميز',
          sku: `PROD002_${companyId.substring(0, 8)}`,
          price: 149.99,
          sale_price: null,
          stock_quantity: 25,
          category: 'الملابس',
          brand: 'العلامة التجارية',
          image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop&crop=center',
          featured: 0,
          weight: 0.8,
          status: 'active',
          category_id: null,
          compare_price: 180.00,
          cost_price: 90.00,
          track_inventory: 1,
          allow_backorder: 0,
          dimensions: JSON.stringify({ length: 25, width: 15, height: 5 }),
          images: JSON.stringify(['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop&crop=center']),
          tags: JSON.stringify(['ملابس', 'أزياء', 'جديد']),
          seo_title: 'منتج تجريبي 2 - أحدث الأزياء',
          seo_description: 'اشتري منتج تجريبي 2 من أحدث الأزياء'
        },
        {
          id: crypto.randomUUID(),
          company_id: companyId,
          store_id: storeId,
          name: 'منتج تجريبي 3',
          description: 'وصف المنتج التجريبي الثالث - منتج فاخر',
          short_description: 'منتج تجريبي فاخر',
          sku: `PROD003_${companyId.substring(0, 8)}`,
          price: 199.99,
          sale_price: 159.99,
          stock_quantity: 15,
          category: 'الإلكترونيات',
          brand: 'العلامة التجارية',
          image_url: 'https://via.placeholder.com/300x300?text=Product+3',
          featured: 1,
          weight: 2.0,
          status: 'active',
          category_id: null,
          compare_price: 250.00,
          cost_price: 120.00,
          track_inventory: 1,
          allow_backorder: 1,
          dimensions: JSON.stringify({ length: 35, width: 25, height: 15 }),
          images: JSON.stringify(['https://via.placeholder.com/300x300?text=Product+3']),
          tags: JSON.stringify(['إلكترونيات', 'فاخر', 'حصري']),
          seo_title: 'منتج تجريبي 3 - منتج فاخر',
          seo_description: 'اشتري منتج تجريبي 3 الفاخر بسعر مميز'
        }
      ];

      // إدراج المنتجات التجريبية
      for (const product of defaultProducts) {
        await pool.execute(`
          INSERT INTO products (
            id, company_id, store_id, name, description, short_description, sku, price, sale_price,
            stock_quantity, category, brand, image_url, featured, weight, status, category_id,
            compare_price, cost_price, track_inventory, allow_backorder, dimensions, images,
            tags, seo_title, seo_description, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          product.id, product.company_id, product.store_id, product.name, product.description,
          product.short_description, product.sku, product.price, product.sale_price,
          product.stock_quantity, product.category, product.brand, product.image_url,
          product.featured, product.weight, product.status, product.category_id,
          product.compare_price, product.cost_price, product.track_inventory,
          product.allow_backorder, product.dimensions, product.images, product.tags,
          product.seo_title, product.seo_description
        ]);
      }

      // إعادة تنفيذ الاستعلام لجلب المنتجات المُنشأة
      const [newProducts] = await pool.execute(query, queryParams);
      const [newCountResult] = await pool.execute(countQuery, queryParams);

      console.log(`✅ [API] تم إنشاء وجلب ${newProducts.length} منتج تجريبي للشركة: ${companyId}`);

      const totalPages = Math.ceil(newCountResult[0].total / Number(limit));

      return res.json({
        success: true,
        data: newProducts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: newCountResult[0].total,
          totalPages
        },
        filters: {
          category,
          search,
          status
        },
        message: 'تم إنشاء وجلب المنتجات التجريبية بنجاح'
      });
    } else {
      console.log(`📦 [API] ❌ لن يتم إنشاء منتجات تجريبية - المنتجات موجودة أو الشروط غير مستوفاة`);
    }

    const totalPages = Math.ceil(total / Number(limit));

    console.log(`✅ [API] تم جلب ${products.length} منتج من أصل ${total} للشركة: ${companyId}`);
    console.log(`📦 [API] المنتجات المرسلة:`, products.map(p => ({ id: p.id, name: p.name, featured: p.featured })));

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages
      },
      filters: {
        category,
        search,
        status
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
    const productData = req.body;

    console.log(`📦 [API] إضافة منتج جديد للشركة: ${companyId}`);

    // التحقق من البيانات المطلوبة
    if (!productData.name || !productData.price || !productData.sku) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'الاسم والسعر ورمز المنتج مطلوبة'
      });
    }

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // التحقق من وجود متجر للشركة
    const [stores] = await pool.execute(
      'SELECT id FROM stores WHERE company_id = ?',
      [companyId]
    );

    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Store not found for this company'
      });
    }

    const storeId = stores[0].id;

    // التحقق من عدم تكرار SKU
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE sku = ? AND company_id = ?',
      [productData.sku, companyId]
    );

    if (existingProducts.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'SKU already exists',
        message: 'رمز المنتج موجود مسبقاً'
      });
    }

    // إنشاء منتج جديد
    const productId = crypto.randomUUID();
    const newProduct = {
      id: productId,
      company_id: companyId,
      store_id: storeId,
      name: productData.name,
      description: productData.description || '',
      short_description: productData.short_description || '',
      sku: productData.sku,
      price: Number(productData.price),
      sale_price: productData.sale_price ? Number(productData.sale_price) : null,
      stock_quantity: productData.stock_quantity || 0,
      category: productData.category || '',
      brand: productData.brand || '',
      image_url: productData.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop&crop=center',
      featured: productData.featured ? 1 : 0,
      weight: productData.weight || 0,
      status: 'active',
      category_id: productData.category_id || null,
      compare_price: productData.compare_price ? Number(productData.compare_price) : null,
      cost_price: productData.cost_price ? Number(productData.cost_price) : null,
      track_inventory: productData.track_inventory ? 1 : 0,
      allow_backorder: productData.allow_backorder ? 1 : 0,
      dimensions: productData.dimensions ? JSON.stringify(productData.dimensions) : null,
      images: productData.images ? JSON.stringify(productData.images) : JSON.stringify([]),
      tags: productData.tags ? JSON.stringify(productData.tags) : JSON.stringify([]),
      seo_title: productData.seo_title || productData.name,
      seo_description: productData.seo_description || productData.description
    };

    // إدراج المنتج في قاعدة البيانات
    await pool.execute(`
      INSERT INTO products (
        id, company_id, store_id, name, description, short_description, sku, price, sale_price,
        stock_quantity, category, brand, image_url, featured, weight, status, category_id,
        compare_price, cost_price, track_inventory, allow_backorder, dimensions, images,
        tags, seo_title, seo_description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      newProduct.id, newProduct.company_id, newProduct.store_id, newProduct.name,
      newProduct.description, newProduct.short_description, newProduct.sku,
      newProduct.price, newProduct.sale_price, newProduct.stock_quantity,
      newProduct.category, newProduct.brand, newProduct.image_url,
      newProduct.featured, newProduct.weight, newProduct.status,
      newProduct.category_id, newProduct.compare_price, newProduct.cost_price,
      newProduct.track_inventory, newProduct.allow_backorder, newProduct.dimensions,
      newProduct.images, newProduct.tags, newProduct.seo_title, newProduct.seo_description
    ]);

    // جلب المنتج المُنشأ حديثاً
    const [createdProducts] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    const createdProduct = createdProducts[0];

    console.log(`✅ [API] تم إنشاء منتج جديد: ${createdProduct.name} للشركة: ${companyId}`);

    res.status(201).json({
      success: true,
      data: createdProduct,
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

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // جلب المنتج من قاعدة البيانات
    const [products] = await pool.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.company_id = ?
    `, [productId, companyId]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: 'المنتج غير موجود'
      });
    }

    const product = products[0];

    // تحويل JSON strings إلى objects
    if (product.images) {
      try {
        product.images = JSON.parse(product.images);
      } catch (e) {
        product.images = [];
      }
    }

    if (product.tags) {
      try {
        product.tags = JSON.parse(product.tags);
      } catch (e) {
        product.tags = [];
      }
    }

    if (product.dimensions) {
      try {
        product.dimensions = JSON.parse(product.dimensions);
      } catch (e) {
        product.dimensions = null;
      }
    }

    console.log(`✅ [API] تم جلب المنتج: ${product.name} للشركة: ${companyId}`);

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

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // التحقق من وجود المنتج
    const [existingProducts] = await pool.execute(
      'SELECT id, sku FROM products WHERE id = ? AND company_id = ?',
      [productId, companyId]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: 'المنتج غير موجود'
      });
    }

    // التحقق من تكرار SKU إذا تم تحديثه
    if (updateData.sku && updateData.sku !== existingProducts[0].sku) {
      const [duplicateProducts] = await pool.execute(
        'SELECT id FROM products WHERE sku = ? AND company_id = ? AND id != ?',
        [updateData.sku, companyId, productId]
      );

      if (duplicateProducts.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'SKU already exists',
          message: 'رمز المنتج موجود مسبقاً'
        });
      }
    }

    // بناء استعلام التحديث
    const updateFields = [];
    const updateValues = [];

    // الحقول القابلة للتحديث
    const allowedFields = [
      'name', 'description', 'short_description', 'sku', 'price', 'sale_price',
      'stock_quantity', 'category', 'brand', 'image_url', 'featured', 'weight',
      'status', 'category_id', 'compare_price', 'cost_price', 'track_inventory',
      'allow_backorder', 'seo_title', 'seo_description'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field]);
      }
    });

    // معالجة الحقول JSON
    if (updateData.dimensions) {
      updateFields.push('dimensions = ?');
      updateValues.push(JSON.stringify(updateData.dimensions));
    }

    if (updateData.images) {
      updateFields.push('images = ?');
      updateValues.push(JSON.stringify(updateData.images));
    }

    if (updateData.tags) {
      updateFields.push('tags = ?');
      updateValues.push(JSON.stringify(updateData.tags));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        message: 'لا توجد حقول للتحديث'
      });
    }

    // إضافة updated_at
    updateFields.push('updated_at = NOW()');
    updateValues.push(productId, companyId);

    // تنفيذ التحديث
    const updateQuery = `
      UPDATE products
      SET ${updateFields.join(', ')}
      WHERE id = ? AND company_id = ?
    `;

    await pool.execute(updateQuery, updateValues);

    // جلب المنتج المحدث
    const [updatedProducts] = await pool.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.company_id = ?
    `, [productId, companyId]);

    const updatedProduct = updatedProducts[0];

    // تحويل JSON strings إلى objects
    if (updatedProduct.images) {
      try {
        updatedProduct.images = JSON.parse(updatedProduct.images);
      } catch (e) {
        updatedProduct.images = [];
      }
    }

    if (updatedProduct.tags) {
      try {
        updatedProduct.tags = JSON.parse(updatedProduct.tags);
      } catch (e) {
        updatedProduct.tags = [];
      }
    }

    if (updatedProduct.dimensions) {
      try {
        updatedProduct.dimensions = JSON.parse(updatedProduct.dimensions);
      } catch (e) {
        updatedProduct.dimensions = null;
      }
    }

    console.log(`✅ [API] تم تحديث المنتج: ${updatedProduct.name} للشركة: ${companyId}`);

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

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // التحقق من وجود المنتج
    const [existingProducts] = await pool.execute(
      'SELECT id, name FROM products WHERE id = ? AND company_id = ?',
      [productId, companyId]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: 'المنتج غير موجود'
      });
    }

    const productName = existingProducts[0].name;

    // حذف المنتج من قاعدة البيانات
    await pool.execute(
      'DELETE FROM products WHERE id = ? AND company_id = ?',
      [productId, companyId]
    );

    console.log(`✅ [API] تم حذف المنتج: ${productName} للشركة: ${companyId}`);

    res.json({
      success: true,
      message: 'تم حذف المنتج بنجاح',
      data: {
        id: productId,
        name: productName
      }
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
    const { status } = req.body;

    console.log(`📦 [API] تغيير حالة المنتج ${productId} للشركة: ${companyId} إلى: ${status}`);

    // التحقق من صحة الحالة
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'الحالة يجب أن تكون active أو inactive'
      });
    }

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // التحقق من وجود المنتج
    const [existingProducts] = await pool.execute(
      'SELECT id, name, status FROM products WHERE id = ? AND company_id = ?',
      [productId, companyId]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: 'المنتج غير موجود'
      });
    }

    const currentProduct = existingProducts[0];

    // تحديث حالة المنتج
    await pool.execute(
      'UPDATE products SET status = ?, updated_at = NOW() WHERE id = ? AND company_id = ?',
      [status, productId, companyId]
    );

    // جلب المنتج المحدث
    const [updatedProducts] = await pool.execute(
      'SELECT id, name, status, updated_at FROM products WHERE id = ? AND company_id = ?',
      [productId, companyId]
    );

    const updatedProduct = updatedProducts[0];

    console.log(`✅ [API] تم تغيير حالة المنتج: ${updatedProduct.name} للشركة: ${companyId} من ${currentProduct.status} إلى ${status}`);

    res.json({
      success: true,
      data: updatedProduct,
      message: `تم ${status === 'active' ? 'تفعيل' : 'إلغاء تفعيل'} المنتج بنجاح`
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
    const { page = 1, limit = 20, status = 'all' } = req.query;

    console.log(`🏷️ [API] جلب الفئات للشركة: ${companyId}`);

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // جلب الفئات من قاعدة البيانات مع العزل حسب الشركة
    let categories = [];

    try {
      // محاولة جلب الفئات مع company_id
      const [categoriesResult] = await pool.execute(`
        SELECT c.*,
               COUNT(p.id) as products_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.company_id = ?
        WHERE c.company_id = ?
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.created_at DESC
        LIMIT ? OFFSET ?
      `, [companyId, companyId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);

      categories = categoriesResult;
    } catch (error) {
      // إذا كان العمود company_id غير موجود، جلب من store_id
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('⚠️ [API] جدول categories لا يحتوي على company_id، استخدام store_id');

        // الحصول على store_id للشركة
        const [stores] = await pool.execute(
          'SELECT id FROM stores WHERE company_id = ?',
          [companyId]
        );

        if (stores.length > 0) {
          const storeId = stores[0].id;

          try {
            const [categoriesResult] = await pool.execute(`
              SELECT c.*,
                     COUNT(p.id) as products_count
              FROM categories c
              LEFT JOIN products p ON c.id = p.category_id
              WHERE c.store_id = ?
              GROUP BY c.id
              ORDER BY c.sort_order ASC, c.created_at DESC
              LIMIT ? OFFSET ?
            `, [storeId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);

            categories = categoriesResult;
          } catch (innerError) {
            // إذا فشل، جلب جميع الفئات بدون عزل
            console.log('⚠️ [API] جلب جميع الفئات بدون عزل');
            const [categoriesResult] = await pool.execute(`
              SELECT c.*,
                     0 as products_count
              FROM categories c
              ORDER BY c.sort_order ASC, c.created_at DESC
              LIMIT ? OFFSET ?
            `, [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);

            categories = categoriesResult;
          }
        }
      } else {
        throw error;
      }
    }

    // حساب العدد الإجمالي للفئات
    let totalCount = 0;
    try {
      // محاولة حساب العدد مع company_id
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM categories WHERE company_id = ?',
        [companyId]
      );
      totalCount = countResult[0].count;
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        // استخدام store_id
        const [stores] = await pool.execute(
          'SELECT id FROM stores WHERE company_id = ?',
          [companyId]
        );

        if (stores.length > 0) {
          const storeId = stores[0].id;
          try {
            const [countResult] = await pool.execute(
              'SELECT COUNT(*) as count FROM categories WHERE store_id = ?',
              [storeId]
            );
            totalCount = countResult[0].count;
          } catch (innerError) {
            // جلب العدد الإجمالي بدون عزل
            const [countResult] = await pool.execute(
              'SELECT COUNT(*) as count FROM categories'
            );
            totalCount = countResult[0].count;
          }
        }
      } else {
        totalCount = categories.length;
      }
    }

    const totalPages = Math.ceil(totalCount / Number(limit));

    res.json({
      success: true,
      data: categories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages
      },
      filters: {
        status
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
    const categoryData = req.body;

    console.log(`🏷️ [API] إضافة فئة جديدة للشركة: ${companyId}`);

    // التحقق من البيانات المطلوبة
    if (!categoryData.name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'اسم الفئة مطلوب'
      });
    }

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // التحقق من عدم تكرار اسم الفئة (مع التعامل مع الجداول القديمة)
    let existingCategories;
    try {
      [existingCategories] = await pool.execute(
        'SELECT id FROM categories WHERE name = ? AND company_id = ?',
        [categoryData.name, companyId]
      );
    } catch (error) {
      // إذا كان العمود company_id غير موجود، استخدم فقط name
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('⚠️ [API] جدول categories لا يحتوي على company_id، استخدام name فقط');
        [existingCategories] = await pool.execute(
          'SELECT id FROM categories WHERE name = ?',
          [categoryData.name]
        );
      } else {
        throw error;
      }
    }

    if (existingCategories.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists',
        message: 'اسم الفئة موجود مسبقاً'
      });
    }

    // إنشاء slug من الاسم
    const slug = categoryData.slug || categoryData.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');

    // التحقق من عدم تكرار slug (مع التعامل مع الجداول القديمة)
    let existingSlugs;
    try {
      [existingSlugs] = await pool.execute(
        'SELECT id FROM categories WHERE slug = ? AND company_id = ?',
        [slug, companyId]
      );
    } catch (error) {
      // إذا كان العمود company_id غير موجود، استخدم فقط slug
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('⚠️ [API] جدول categories لا يحتوي على company_id، استخدام slug فقط');
        [existingSlugs] = await pool.execute(
          'SELECT id FROM categories WHERE slug = ?',
          [slug]
        );
      } else {
        throw error;
      }
    }

    if (existingSlugs.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Category slug already exists',
        message: 'رابط الفئة موجود مسبقاً'
      });
    }

    // إنشاء فئة جديدة
    const categoryId = crypto.randomUUID();
    const newCategory = {
      id: categoryId,
      company_id: companyId,
      name: categoryData.name,
      description: categoryData.description || '',
      slug: slug,
      image_url: categoryData.image_url || 'https://via.placeholder.com/200x200?text=Category',
      icon: categoryData.icon || 'folder',
      sort_order: categoryData.sort_order || 0,
      status: 'active',
      meta_title: categoryData.meta_title || categoryData.name,
      meta_description: categoryData.meta_description || categoryData.description || ''
    };

    // إدراج الفئة في قاعدة البيانات (مع التعامل مع الجداول القديمة)
    try {
      await pool.execute(`
        INSERT INTO categories (
          id, company_id, name, description, slug, image_url, icon, sort_order,
          status, meta_title, meta_description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        newCategory.id, newCategory.company_id, newCategory.name, newCategory.description,
        newCategory.slug, newCategory.image_url, newCategory.icon, newCategory.sort_order,
        newCategory.status, newCategory.meta_title, newCategory.meta_description
      ]);
    } catch (error) {
      // إذا كان العمود company_id غير موجود، استخدم بدونه
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('⚠️ [API] جدول categories لا يحتوي على company_id، إدراج بدونه');
        try {
          await pool.execute(`
            INSERT INTO categories (
              id, name, description, slug, image_url, icon, sort_order,
              status, meta_title, meta_description, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            newCategory.id, newCategory.name, newCategory.description,
            newCategory.slug, newCategory.image_url, newCategory.icon, newCategory.sort_order,
            newCategory.status, newCategory.meta_title, newCategory.meta_description
          ]);
        } catch (innerError) {
          // إذا كانت أعمدة أخرى مفقودة، استخدم الحد الأدنى
          if (innerError.code === 'ER_BAD_FIELD_ERROR') {
            console.log('⚠️ [API] جدول categories يحتوي على أعمدة أساسية فقط، إدراج مبسط');
            // الحصول على store_id للشركة
            const [stores] = await pool.execute(
              'SELECT id FROM stores WHERE company_id = ?',
              [companyId]
            );

            if (stores.length === 0) {
              throw new Error('لا يوجد متجر للشركة');
            }

            const storeId = stores[0].id;
            await pool.execute(`
              INSERT INTO categories (id, name, description, store_id) VALUES (?, ?, ?, ?)
            `, [newCategory.id, newCategory.name, newCategory.description, storeId]);
          } else {
            throw innerError;
          }
        }
      } else {
        throw error;
      }
    }

    // جلب الفئة المُنشأة حديثاً مع عدد المنتجات (مع التعامل مع الجداول القديمة)
    let createdCategories;
    try {
      [createdCategories] = await pool.execute(`
        SELECT c.*,
               COUNT(p.id) as products_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.company_id = c.company_id
        WHERE c.id = ?
        GROUP BY c.id
      `, [categoryId]);
    } catch (error) {
      // إذا كان العمود company_id غير موجود، استخدم بدونه
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('⚠️ [API] جدول categories لا يحتوي على company_id، جلب بدونه');
        try {
          [createdCategories] = await pool.execute(`
            SELECT c.*,
                   COUNT(p.id) as products_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            WHERE c.id = ?
            GROUP BY c.id
          `, [categoryId]);
        } catch (innerError) {
          // إذا كان جدول products غير موجود أو لا يحتوي على category_id
          if (innerError.code === 'ER_BAD_FIELD_ERROR' || innerError.code === 'ER_NO_SUCH_TABLE') {
            console.log('⚠️ [API] جلب الفئة بدون عدد المنتجات');
            [createdCategories] = await pool.execute(`
              SELECT * FROM categories WHERE id = ?
            `, [categoryId]);
            // إضافة products_count يدوياً
            if (createdCategories.length > 0) {
              createdCategories[0].products_count = 0;
            }
          } else {
            throw innerError;
          }
        }
      } else {
        throw error;
      }
    }

    const createdCategory = createdCategories[0];

    console.log(`✅ [API] تم إنشاء فئة جديدة: ${createdCategory.name} للشركة: ${companyId}`);

    res.status(201).json({
      success: true,
      data: createdCategory,
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

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // التحقق من وجود الفئة
    const [existingCategories] = await pool.execute(
      'SELECT id, name, slug FROM categories WHERE id = ? AND company_id = ?',
      [categoryId, companyId]
    );

    if (existingCategories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'الفئة غير موجودة'
      });
    }

    const currentCategory = existingCategories[0];

    // التحقق من تكرار الاسم إذا تم تحديثه
    if (updateData.name && updateData.name !== currentCategory.name) {
      const [duplicateNames] = await pool.execute(
        'SELECT id FROM categories WHERE name = ? AND company_id = ? AND id != ?',
        [updateData.name, companyId, categoryId]
      );

      if (duplicateNames.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Category name already exists',
          message: 'اسم الفئة موجود مسبقاً'
        });
      }
    }

    // التحقق من تكرار slug إذا تم تحديثه
    if (updateData.slug && updateData.slug !== currentCategory.slug) {
      const [duplicateSlugs] = await pool.execute(
        'SELECT id FROM categories WHERE slug = ? AND company_id = ? AND id != ?',
        [updateData.slug, companyId, categoryId]
      );

      if (duplicateSlugs.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Category slug already exists',
          message: 'رابط الفئة موجود مسبقاً'
        });
      }
    }

    // بناء استعلام التحديث
    const updateFields = [];
    const updateValues = [];

    // الحقول القابلة للتحديث
    const allowedFields = [
      'name', 'description', 'slug', 'image_url', 'icon', 'sort_order',
      'status', 'meta_title', 'meta_description'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        message: 'لا توجد حقول للتحديث'
      });
    }

    // إضافة updated_at
    updateFields.push('updated_at = NOW()');
    updateValues.push(categoryId, companyId);

    // تنفيذ التحديث
    const updateQuery = `
      UPDATE categories
      SET ${updateFields.join(', ')}
      WHERE id = ? AND company_id = ?
    `;

    await pool.execute(updateQuery, updateValues);

    // جلب الفئة المحدثة مع عدد المنتجات
    const [updatedCategories] = await pool.execute(`
      SELECT c.*,
             COUNT(p.id) as products_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.company_id = c.company_id
      WHERE c.id = ? AND c.company_id = ?
      GROUP BY c.id
    `, [categoryId, companyId]);

    const updatedCategory = updatedCategories[0];

    console.log(`✅ [API] تم تحديث الفئة: ${updatedCategory.name} للشركة: ${companyId}`);

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

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // التحقق من وجود الفئة (مع التعامل مع الجداول القديمة)
    let existingCategories;
    try {
      [existingCategories] = await pool.execute(
        'SELECT id, name FROM categories WHERE id = ? AND company_id = ?',
        [categoryId, companyId]
      );
    } catch (error) {
      // إذا كان العمود company_id غير موجود، استخدم فقط id
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('⚠️ [API] جدول categories لا يحتوي على company_id، استخدام id فقط');
        [existingCategories] = await pool.execute(
          'SELECT id, name FROM categories WHERE id = ?',
          [categoryId]
        );
      } else {
        throw error;
      }
    }

    if (existingCategories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: 'الفئة غير موجودة'
      });
    }

    const categoryName = existingCategories[0].name;

    // التحقق من وجود منتجات مرتبطة بالفئة
    let relatedProducts;
    try {
      [relatedProducts] = await pool.execute(
        'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND company_id = ?',
        [categoryId, companyId]
      );
    } catch (error) {
      // إذا كان العمود company_id غير موجود في products، استخدم فقط category_id
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('⚠️ [API] جدول products لا يحتوي على company_id، استخدام category_id فقط');
        [relatedProducts] = await pool.execute(
          'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
          [categoryId]
        );
      } else {
        throw error;
      }
    }

    if (relatedProducts[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Category has related products',
        message: `لا يمكن حذف الفئة لأنها تحتوي على ${relatedProducts[0].count} منتج. يرجى حذف المنتجات أولاً أو نقلها لفئة أخرى.`
      });
    }

    // حذف الفئة من قاعدة البيانات
    try {
      await pool.execute(
        'DELETE FROM categories WHERE id = ? AND company_id = ?',
        [categoryId, companyId]
      );
    } catch (error) {
      // إذا كان العمود company_id غير موجود، استخدم فقط id
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('⚠️ [API] جدول categories لا يحتوي على company_id، حذف باستخدام id فقط');
        await pool.execute(
          'DELETE FROM categories WHERE id = ?',
          [categoryId]
        );
      } else {
        throw error;
      }
    }

    console.log(`✅ [API] تم حذف الفئة: ${categoryName} للشركة: ${companyId}`);

    res.json({
      success: true,
      message: 'تم حذف الفئة بنجاح',
      data: {
        id: categoryId,
        name: categoryName
      }
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
    const { page = 1, limit = 10, status, customer_name, date_from, date_to } = req.query;

    console.log(`🛒 [API] جلب الطلبات للشركة: ${companyId}`);

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // التأكد من وجود الجداول
    await createEcommerceTablesIfNotExist();

    // بناء الاستعلام مع الفلاتر
    let whereClause = 'WHERE o.company_id = ?';
    const queryParams = [companyId];

    if (status) {
      whereClause += ' AND o.status = ?';
      queryParams.push(status);
    }

    if (customer_name) {
      whereClause += ' AND o.customer_name LIKE ?';
      queryParams.push(`%${customer_name}%`);
    }

    if (date_from) {
      whereClause += ' AND DATE(o.created_at) >= ?';
      queryParams.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(o.created_at) <= ?';
      queryParams.push(date_to);
    }

    // حساب الإزاحة للصفحات
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // جلب الطلبات مع التصفح (بدون customer_id لأنه غير موجود في الجدول الجديد)
    const [orders] = await pool.execute(`
      SELECT
        o.*,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit as string), offset]);

    // حساب العدد الإجمالي للطلبات
    const [countResult] = await pool.execute(`
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      ${whereClause}
    `, queryParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit as string));

    // إضافة نص الحالة لكل طلب
    const statusTexts = {
      'pending': 'في انتظار التأكيد',
      'confirmed': 'مؤكد',
      'processing': 'قيد التجهيز',
      'shipped': 'تم الشحن',
      'delivered': 'تم التسليم',
      'cancelled': 'ملغي',
      'refunded': 'مسترد'
    };

    const ordersWithStatus = orders.map(order => ({
      ...order,
      status_text: statusTexts[order.status] || order.status,
      items_count: parseInt(order.items_count) || 0
    }));

    console.log(`✅ [API] تم جلب ${orders.length} طلب للشركة: ${companyId}`);

    res.json({
      success: true,
      data: ordersWithStatus,
      pagination: {
        current_page: parseInt(page as string),
        total_pages: totalPages,
        total_items: total,
        items_per_page: parseInt(limit as string)
      }
    });

  } catch (error) {
    console.error('❌ [API] خطأ في جلب الطلبات:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في جلب الطلبات',
      details: error.message
    });
  }
});

// 🛒 إنشاء طلب جديد
console.log('🔧 [SETUP] تسجيل مسار إنشاء طلب جديد: /api/companies/:companyId/orders');
app.post('/api/companies/:companyId/orders', async (req, res) => {
  console.log('🛒 [API] تم استدعاء مسار إنشاء طلب جديد!');
  try {
    const { companyId } = req.params;
    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      total_amount,
      status = 'pending',
      payment_method = 'cash_on_delivery',
      payment_status = 'pending',
      notes = '',
      items = []
    } = req.body;

    console.log(`🛒 [API] إنشاء طلب جديد للشركة: ${companyId}`);
    console.log('🛒 [API] البيانات المستلمة:', req.body);
    console.log('🛒 [API] customer_name:', customer_name);
    console.log('🛒 [API] total_amount:', total_amount);
    console.log('🛒 [API] items:', items);

    // التحقق من البيانات المطلوبة
    if (!customer_name || !total_amount) {
      return res.status(400).json({
        success: false,
        error: 'اسم العميل والمبلغ الإجمالي مطلوبان'
      });
    }

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // إنشاء معرف فريد للطلب
    const orderId = crypto.randomUUID();

    // التأكد من وجود الجداول
    await createEcommerceTablesIfNotExist();

    // إنشاء رقم طلب فريد
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // إدراج الطلب في قاعدة البيانات
    // إنشاء عميل أولاً إذا لم يكن موجوداً
    const customerId = crypto.randomUUID();
    await pool.execute(`
      INSERT INTO customers (id, company_id, name, email, phone, status)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `, [
      customerId, companyId, customer_name, customer_email || null,
      customer_phone || null, 'active'
    ]);

    await pool.execute(`
      INSERT INTO orders (
        id, company_id, order_number, status,
        customer_name, customer_email, customer_phone, customer_address,
        total_amount, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      orderId, companyId, orderNumber, status,
      customer_name, customer_email, customer_phone, customer_address,
      parseFloat(total_amount), notes || ''
    ]);

    // إدراج عناصر الطلب إذا كانت موجودة
    if (items && items.length > 0) {
      for (const item of items) {
        const itemId = crypto.randomUUID();
        const itemParams = [
          itemId, orderId, item.product_id || crypto.randomUUID(),
          item.product_name || '', item.product_sku || '',
          item.quantity || 1, parseFloat(item.price) || 0, parseFloat(item.total_price) || 0
        ];

        console.log('🛒 [API] إدراج عنصر طلب:', itemParams);

        await pool.execute(`
          INSERT INTO order_items (
            id, order_id, product_id, product_name, product_sku,
            quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, itemParams);
      }
    }

    // جلب الطلب المُنشأ مع عدد العناصر
    const [createdOrders] = await pool.execute(`
      SELECT
        o.*,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [orderId]);

    const newOrder = createdOrders[0];

    console.log(`✅ [API] تم إنشاء طلب جديد بنجاح: ${orderId}`);

    res.status(201).json({
      success: true,
      data: newOrder,
      message: 'تم إنشاء الطلب بنجاح'
    });

  } catch (error) {
    console.error('❌ [API] خطأ في إنشاء الطلب:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في إنشاء الطلب',
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

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // التأكد من وجود الجداول
    await createEcommerceTablesIfNotExist();

    // جلب الطلب من قاعدة البيانات (بدون customer_id لأنه غير موجود في الجدول الجديد)
    const [orders] = await pool.execute(`
      SELECT
        o.*
      FROM orders o
      WHERE o.id = ? AND o.company_id = ?
    `, [orderId, companyId]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: 'الطلب غير موجود'
      });
    }

    const order = orders[0];

    // جلب عناصر الطلب
    const [orderItems] = await pool.execute(`
      SELECT oi.*, p.name as product_name, p.sku as product_sku, p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at ASC
    `, [orderId]);

    // إضافة نص الحالة
    const statusTexts = {
      'pending': 'في انتظار التأكيد',
      'confirmed': 'مؤكد',
      'processing': 'قيد التجهيز',
      'shipped': 'تم الشحن',
      'delivered': 'تم التسليم',
      'cancelled': 'ملغي',
      'refunded': 'مسترد'
    };
    order.status_text = statusTexts[order.status] || order.status;

    // إضافة عناصر الطلب
    order.items = orderItems;
    order.items_count = orderItems.length;

    // حساب المجموع من العناصر
    order.calculated_total = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    console.log(`✅ [API] تم جلب الطلب: ${order.id} للشركة: ${companyId}`);

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
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'حالة الطلب غير صحيحة'
      });
    }

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // التأكد من وجود الجداول
    await createEcommerceTablesIfNotExist();

    // التحقق من وجود الطلب
    const [existingOrders] = await pool.execute(
      'SELECT id, status, order_number FROM orders WHERE id = ? AND company_id = ?',
      [orderId, companyId]
    );

    if (existingOrders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: 'الطلب غير موجود'
      });
    }

    const currentOrder = existingOrders[0];

    // تحديد النص المقابل للحالة
    const statusTexts = {
      'pending': 'في انتظار التأكيد',
      'confirmed': 'مؤكد',
      'processing': 'قيد التجهيز',
      'shipped': 'تم الشحن',
      'delivered': 'تم التسليم',
      'cancelled': 'ملغي',
      'refunded': 'مسترد'
    };

    // تحديث حالة الطلب في قاعدة البيانات
    const updateFields = ['status = ?', 'updated_at = NOW()'];
    const updateValues = [status];

    if (notes) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    updateValues.push(orderId, companyId);

    await pool.execute(`
      UPDATE orders
      SET ${updateFields.join(', ')}
      WHERE id = ? AND company_id = ?
    `, updateValues);

    // جلب الطلب المحدث
    const [updatedOrders] = await pool.execute(
      'SELECT id, order_number, status, notes, updated_at FROM orders WHERE id = ? AND company_id = ?',
      [orderId, companyId]
    );

    const updatedOrder = updatedOrders[0];
    updatedOrder.status_text = statusTexts[updatedOrder.status];

    console.log(`✅ [API] تم تحديث حالة الطلب: ${updatedOrder.order_number} من ${currentOrder.status} إلى ${status} للشركة: ${companyId}`);

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

    const pool = getPool();

    // التحقق من وجود الشركة
    const [companies] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // تحديد الفترة الزمنية
    let daysBack = 30;
    switch (period) {
      case '7d': daysBack = 7; break;
      case '30d': daysBack = 30; break;
      case '90d': daysBack = 90; break;
      case '1y': daysBack = 365; break;
      default: daysBack = 30;
    }

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);
    const dateFromStr = dateFrom.toISOString().split('T')[0];

    // 1. إحصائيات عامة - إنشاء بيانات تجريبية
    const overview = {
      total_products: 25,
      active_products: 22,
      total_categories: 5,
      total_orders: 150,
      pending_orders: 12,
      total_revenue: 45750.00,
      average_order_value: 305.00
    };

    // 2. إحصائيات المبيعات للفترة المحددة - بيانات تجريبية
    const salesStats = [{
      orders_count: 85,
      total_sales: 28500.00
    }];

    // 3. المبيعات اليومية - بيانات تجريبية
    const dailySales = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailySales.push({
        date: date.toISOString().split('T')[0],
        orders: Math.floor(Math.random() * 10) + 1,
        sales: Math.floor(Math.random() * 2000) + 500
      });
    }

    // 4. أفضل المنتجات - إنشاء بيانات تجريبية
    const topProducts = [
      {
        id: crypto.randomUUID(),
        name: 'منتج تجريبي 1',
        sales_count: 25,
        revenue: 3750.00
      },
      {
        id: crypto.randomUUID(),
        name: 'منتج تجريبي 2',
        sales_count: 18,
        revenue: 2890.00
      },
      {
        id: crypto.randomUUID(),
        name: 'منتج تجريبي 3',
        sales_count: 15,
        revenue: 2250.00
      },
      {
        id: crypto.randomUUID(),
        name: 'منتج تجريبي 4',
        sales_count: 12,
        revenue: 1800.00
      },
      {
        id: crypto.randomUUID(),
        name: 'منتج تجريبي 5',
        sales_count: 8,
        revenue: 1200.00
      }
    ];

    // 5. أداء الفئات - إنشاء بيانات تجريبية
    const categoriesPerformance = [
      {
        id: crypto.randomUUID(),
        name: 'الإلكترونيات',
        products_count: 15,
        orders_count: 45,
        revenue: 12500.00
      },
      {
        id: crypto.randomUUID(),
        name: 'الملابس',
        products_count: 25,
        orders_count: 32,
        revenue: 8750.00
      },
      {
        id: crypto.randomUUID(),
        name: 'المنزل والحديقة',
        products_count: 18,
        orders_count: 28,
        revenue: 6200.00
      }
    ];

    // حساب النسب المئوية للفئات
    const totalCategoriesRevenue = categoriesPerformance.reduce((sum, cat) => sum + cat.revenue, 0);
    categoriesPerformance.forEach(cat => {
      (cat as any).percentage = totalCategoriesRevenue > 0 ? ((cat.revenue / totalCategoriesRevenue) * 100) : 0;
    });

    // 6. توزيع حالات الطلبات - بيانات تجريبية
    const orderStatusDistribution = {
      pending: 12,
      confirmed: 45,
      processing: 28,
      shipped: 35,
      delivered: 25,
      cancelled: 5
    };

    // 7. رؤى العملاء - بيانات تجريبية
    const customerData = {
      total_customers: 125,
      new_customers: 35,
      returning_customers: 90,
      average_orders_per_customer: 2.4
    };

    // حساب نمو المبيعات - بيانات تجريبية
    const growthPercentage = 15.5;

    // تجميع البيانات
    const analytics = {
      overview: {
        total_products: overview.total_products,
        active_products: overview.active_products,
        total_categories: overview.total_categories,
        total_orders: overview.total_orders,
        pending_orders: overview.pending_orders,
        total_revenue: overview.total_revenue,
        average_order_value: overview.average_order_value
      },
      sales: {
        period: period,
        total_sales: salesStats[0].total_sales,
        orders_count: salesStats[0].orders_count,
        growth_percentage: growthPercentage,
        daily_sales: dailySales.map(day => ({
          date: day.date,
          sales: day.sales,
          orders: day.orders
        }))
      },
      top_products: topProducts.map(product => ({
        id: product.id,
        name: product.name,
        sales_count: product.sales_count,
        revenue: product.revenue,
        growth: 0 // يمكن حسابه لاحقاً بمقارنة الفترات
      })),
      categories_performance: categoriesPerformance.map(cat => ({
        id: cat.id,
        name: cat.name,
        products_count: cat.products_count,
        orders_count: cat.orders_count,
        revenue: cat.revenue,
        percentage: parseFloat(((cat as any).percentage).toFixed(1))
      })),
      order_status_distribution: orderStatusDistribution,
      customer_insights: {
        total_customers: customerData.total_customers,
        new_customers: customerData.new_customers,
        returning_customers: customerData.returning_customers,
        average_orders_per_customer: customerData.average_orders_per_customer
      }
    };

    console.log(`✅ [API] تم جلب إحصائيات المتجر للشركة: ${companyId} للفترة: ${period}`);

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
// 🔧 Middleware للأخطاء (تم نقله للنهاية)
// ===================================

// تم نقل middleware الأخطاء للنهاية بعد جميع المسارات

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

// ===================================
// 🛒 مسارات السلة (Cart APIs) - الجديدة بدون sessionId
// ===================================

// 🛒 جلب محتويات السلة (بدون sessionId)
console.log('🔧 [SETUP] تسجيل مسار جلب السلة الجديد: /api/companies/:companyId/cart');
app.get('/api/companies/:companyId/cart', async (req, res) => {
  console.log('🛒 [API] تم استدعاء مسار جلب السلة الجديد!');
  try {
    const { companyId } = req.params;

    console.log(`🛒 [API] جلب السلة المبسطة - الشركة: ${companyId}`);

    const pool = getPool();

    // جلب عناصر السلة (استخدام company_id فقط)
    const [cartItems] = await pool.execute(`
      SELECT * FROM cart_items
      WHERE company_id = ?
      ORDER BY created_at DESC
    `, [companyId]);

    // حساب الإجماليات
    let total = 0;
    let count = 0;
    const items = (cartItems as any[]).map((item: any) => {
      const itemTotal = item.quantity * item.price;
      total += itemTotal;
      count += item.quantity;

      return {
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url,
        total_price: itemTotal,
        created_at: item.created_at
      };
    });

    console.log(`✅ [API] تم جلب السلة: ${items.length} عنصر`);

    res.json({
      success: true,
      items,
      total,
      count
    });
  } catch (error: any) {
    console.error('❌ [API] خطأ في جلب السلة:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في جلب السلة'
    });
  }
});

// 🛒 إضافة منتج للسلة (بدون sessionId)
console.log('🔧 [SETUP] تسجيل مسار إضافة منتج للسلة الجديد: /api/companies/:companyId/cart/add');
app.post('/api/companies/:companyId/cart/add', async (req, res) => {
  console.log('🛒 [API] تم استدعاء مسار إضافة منتج للسلة الجديد!');
  try {
    const { companyId } = req.params;
    const { product_id, product_name, product_sku, price, quantity, image_url } = req.body;

    console.log(`🛒 [API] إضافة منتج للسلة المبسطة - الشركة: ${companyId}, المنتج: ${product_name}`);

    if (!product_id || !product_name || !price || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'بيانات المنتج غير مكتملة'
      });
    }

    const pool = getPool();

    // التحقق من وجود المنتج في السلة
    const [existingItems] = await pool.execute(`
      SELECT * FROM cart_items
      WHERE company_id = ? AND product_id = ?
    `, [companyId, product_id]);

    if ((existingItems as any[]).length > 0) {
      // تحديث الكمية
      const existingItem = (existingItems as any[])[0];
      const newQuantity = existingItem.quantity + parseInt(quantity);
      const newTotalPrice = newQuantity * parseFloat(price);

      await pool.execute(`
        UPDATE cart_items
        SET quantity = ?, total_price = ?, updated_at = NOW()
        WHERE id = ?
      `, [newQuantity, newTotalPrice, existingItem.id]);

      console.log(`✅ [API] تم تحديث كمية المنتج في السلة: ${product_name}`);
    } else {
      // إضافة منتج جديد
      const cartItemId = uuidv4();
      const totalPrice = parseInt(quantity) * parseFloat(price);

      await pool.execute(`
        INSERT INTO cart_items (
          id, company_id, product_id, product_name,
          product_sku, price, quantity, image_url, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        cartItemId, companyId, product_id, product_name,
        product_sku || null, parseFloat(price), parseInt(quantity), image_url || null, totalPrice
      ]);

      console.log(`✅ [API] تم إضافة منتج جديد للسلة: ${product_name}`);
    }

    // جلب عدد العناصر في السلة
    const [cartCount] = await pool.execute(`
      SELECT COUNT(*) as count, SUM(quantity) as total_items
      FROM cart_items
      WHERE company_id = ?
    `, [companyId]);

    res.json({
      success: true,
      message: 'تم إضافة المنتج للسلة بنجاح',
      cart_count: (cartCount as any[])[0].count,
      total_items: (cartCount as any[])[0].total_items
    });
  } catch (error: any) {
    console.error('❌ [API] خطأ في إضافة المنتج للسلة:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في إضافة المنتج للسلة'
    });
  }
});

// 🛒 تحديث كمية منتج في السلة (بدون sessionId)
console.log('🔧 [SETUP] تسجيل مسار تحديث كمية المنتج: /api/companies/:companyId/cart/update/:itemId');
app.put('/api/companies/:companyId/cart/update/:itemId', async (req, res) => {
  console.log('🛒 [API] تم استدعاء مسار تحديث كمية المنتج!');
  try {
    const { companyId, itemId } = req.params;
    const { quantity } = req.body;

    console.log(`🛒 [API] تحديث كمية المنتج - الشركة: ${companyId}, العنصر: ${itemId}, الكمية: ${quantity}`);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'الكمية يجب أن تكون أكبر من صفر'
      });
    }

    const pool = getPool();

    // التحقق من وجود العنصر
    const [existingItems] = await pool.execute(`
      SELECT * FROM cart_items
      WHERE id = ? AND company_id = ?
    `, [itemId, companyId]);

    if ((existingItems as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'العنصر غير موجود في السلة'
      });
    }

    const item = (existingItems as any[])[0];
    const newTotalPrice = parseInt(quantity) * item.price;

    await pool.execute(`
      UPDATE cart_items
      SET quantity = ?, total_price = ?, updated_at = NOW()
      WHERE id = ?
    `, [parseInt(quantity), newTotalPrice, itemId]);

    console.log(`✅ [API] تم تحديث كمية المنتج بنجاح`);

    res.json({
      success: true,
      message: 'تم تحديث كمية المنتج بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [API] خطأ في تحديث كمية المنتج:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في تحديث كمية المنتج'
    });
  }
});

// 🛒 حذف منتج من السلة (بدون sessionId)
console.log('🔧 [SETUP] تسجيل مسار حذف منتج من السلة: /api/companies/:companyId/cart/remove/:itemId');
app.delete('/api/companies/:companyId/cart/remove/:itemId', async (req, res) => {
  console.log('🛒 [API] تم استدعاء مسار حذف منتج من السلة!');
  try {
    const { companyId, itemId } = req.params;

    console.log(`🛒 [API] حذف منتج من السلة - الشركة: ${companyId}, العنصر: ${itemId}`);

    const pool = getPool();

    // حذف العنصر
    const [result] = await pool.execute(`
      DELETE FROM cart_items
      WHERE id = ? AND company_id = ?
    `, [itemId, companyId]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'العنصر غير موجود في السلة'
      });
    }

    console.log(`✅ [API] تم حذف المنتج من السلة بنجاح`);

    res.json({
      success: true,
      message: 'تم حذف المنتج من السلة بنجاح'
    });
  } catch (error: any) {
    console.error('❌ [API] خطأ في حذف المنتج من السلة:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في حذف المنتج من السلة'
    });
  }
});

// 🛒 مسح السلة بالكامل (بدون sessionId)
console.log('🔧 [SETUP] تسجيل مسار مسح السلة: /api/companies/:companyId/cart/clear');
app.delete('/api/companies/:companyId/cart/clear', async (req, res) => {
  console.log('🛒 [API] تم استدعاء مسار مسح السلة!');
  try {
    const { companyId } = req.params;

    console.log(`🛒 [API] مسح السلة بالكامل - الشركة: ${companyId}`);

    const pool = getPool();

    // مسح جميع عناصر السلة
    await pool.execute(`
      DELETE FROM cart_items
      WHERE company_id = ?
    `, [companyId]);

    console.log(`✅ [API] تم مسح السلة بالكامل`);

    res.json({
      success: true,
      message: 'تم مسح السلة بالكامل'
    });
  } catch (error: any) {
    console.error('❌ [API] خطأ في مسح السلة:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في مسح السلة'
    });
  }
});

// ===================================
// ✅ تم حذف جميع مسارات السلة القديمة - نستخدم الآن المسارات الجديدة المبسطة فقط
// ===================================

// 💳 إتمام الطلب (Checkout)
console.log('🔧 [SETUP] تسجيل مسار إتمام الطلب: /api/companies/:companyId/checkout');
app.post('/api/companies/:companyId/checkout', async (req, res) => {
  console.log('💳 [API] تم استدعاء مسار إتمام الطلب!');
  try {
    const { companyId } = req.params;
    const { customer_info, shipping_address, payment_method, notes } = req.body;

    console.log(`💳 [API] إتمام طلب جديد - الشركة: ${companyId}`);
    console.log(`💳 [API] معلومات العميل:`, customer_info);

    const pool = getPool();

    // جلب عناصر السلة
    const [cartItems] = await pool.execute(`
      SELECT ci.*, p.name as product_name, p.price as product_price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.company_id = ?
    `, [companyId]);

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'السلة فارغة'
      });
    }

    // حساب المجموع
    const total = (cartItems as any[]).reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // إنشاء الطلب
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await pool.execute(`
      INSERT INTO orders (
        id, company_id, order_number, total_amount, status, notes, created_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, NOW())
    `, [
      orderId,
      companyId,
      orderId, // استخدام orderId كـ order_number
      total,
      `العميل: ${customer_info.name}, البريد: ${customer_info.email}, الهاتف: ${customer_info.phone}, العنوان: ${JSON.stringify(shipping_address)}, طريقة الدفع: ${payment_method}. ${notes || ''}`
    ]);

    // إضافة عناصر الطلب
    for (const item of cartItems as any[]) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await pool.execute(`
        INSERT INTO order_items (
          id, order_id, product_id, quantity
        ) VALUES (?, ?, ?, ?)
      `, [
        itemId,
        orderId,
        item.product_id,
        item.quantity
      ]);
    }

    // مسح السلة بعد إتمام الطلب
    await pool.execute(`
      DELETE FROM cart_items WHERE company_id = ?
    `, [companyId]);

    console.log(`✅ [API] تم إنشاء الطلب بنجاح: ${orderId}`);

    res.json({
      success: true,
      message: 'تم إتمام الطلب بنجاح',
      data: {
        id: orderId,
        order_id: orderId,
        company_id: companyId,
        customer_name: customer_info.name,
        customer_email: customer_info.email,
        customer_phone: customer_info.phone,
        total_amount: total,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ [API] خطأ في إتمام الطلب:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'خطأ في إتمام الطلب'
    });
  }
});

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
// 🚨 معالجة الأخطاء الموحدة
// ===================================

// إضافة middleware معالجة الأخطاء في النهاية
app.use(ErrorHandler.expressErrorHandler);

// ===================================
// 🏁 نهاية الملف
// ===================================
