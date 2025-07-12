/**
 * نظام مراقبة مقارن لتوحيد جداول Facebook
 * يقارن النتائج بين الجدول الموحد والجداول القديمة
 * تاريخ الإنشاء: 11 يوليو 2025
 */

const mysql = require('mysql2/promise');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// إعدادات المراقبة
const MONITORING_CONFIG = {
  interval: 30000, // 30 ثانية
  logFile: path.join(__dirname, 'comparison-logs.txt'),
  alertThreshold: 5, // عدد الأخطاء المتتالية قبل التنبيه
  companies: ['company-2', 'company-1'] // الشركات المراد مراقبتها
};

class ComparisonMonitor {
  constructor() {
    this.connection = null;
    this.errorCount = 0;
    this.isRunning = false;
    this.intervalId = null;
  }

  async init() {
    try {
      console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
      this.connection = await mysql.createConnection(dbConfig);
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'.green);
      
      // إنشاء مجلد السجلات إذا لم يكن موجوداً
      const logDir = path.dirname(MONITORING_CONFIG.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      return true;
    } catch (error) {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:'.red, error.message);
      return false;
    }
  }

  async compareData(companyId) {
    try {
      console.log(`🔍 مقارنة البيانات للشركة ${companyId}...`.blue);
      
      // جلب البيانات من الجدول الموحد
      const [unifiedData] = await this.connection.execute(`
        SELECT page_id, page_name, company_id, is_active, webhook_enabled, 
               access_token, created_at, updated_at
        FROM facebook_pages_unified 
        WHERE company_id = ? AND is_active = TRUE
        ORDER BY page_id
      `, [companyId]);

      // جلب البيانات من الجداول القديمة
      const [settingsData] = await this.connection.execute(`
        SELECT page_id, page_name, company_id, is_active, webhook_enabled,
               access_token, created_at, updated_at
        FROM facebook_settings 
        WHERE company_id = ?
        ORDER BY page_id
      `, [companyId]);

      const [pagesData] = await this.connection.execute(`
        SELECT page_id, page_name, company_id, is_active, 
               COALESCE(webhook_verified, FALSE) as webhook_enabled,
               access_token, created_at, updated_at
        FROM facebook_pages 
        WHERE company_id = ?
        ORDER BY page_id
      `, [companyId]);

      // دمج البيانات القديمة
      const legacyData = [...settingsData, ...pagesData];

      // مقارنة النتائج
      const comparison = this.performComparison(unifiedData, legacyData, companyId);
      
      // تسجيل النتائج
      this.logComparison(comparison);
      
      return comparison;
      
    } catch (error) {
      console.error(`❌ خطأ في مقارنة البيانات للشركة ${companyId}:`.red, error.message);
      this.errorCount++;
      return { success: false, error: error.message, companyId };
    }
  }

  performComparison(unifiedData, legacyData, companyId) {
    const result = {
      companyId,
      timestamp: new Date().toISOString(),
      unifiedCount: unifiedData.length,
      legacyCount: legacyData.length,
      matches: 0,
      mismatches: [],
      missingInUnified: [],
      extraInUnified: [],
      success: true
    };

    // إنشاء خرائط للمقارنة السريعة
    const unifiedMap = new Map();
    const legacyMap = new Map();

    unifiedData.forEach(page => {
      unifiedMap.set(page.page_id, page);
    });

    legacyData.forEach(page => {
      legacyMap.set(page.page_id, page);
    });

    // البحث عن التطابقات والاختلافات
    for (const [pageId, unifiedPage] of unifiedMap) {
      if (legacyMap.has(pageId)) {
        const legacyPage = legacyMap.get(pageId);
        
        // مقارنة البيانات الأساسية
        if (this.pagesMatch(unifiedPage, legacyPage)) {
          result.matches++;
        } else {
          result.mismatches.push({
            pageId,
            unified: unifiedPage,
            legacy: legacyPage,
            differences: this.findDifferences(unifiedPage, legacyPage)
          });
        }
      } else {
        result.extraInUnified.push(unifiedPage);
      }
    }

    // البحث عن الصفحات المفقودة في الجدول الموحد
    for (const [pageId, legacyPage] of legacyMap) {
      if (!unifiedMap.has(pageId)) {
        result.missingInUnified.push(legacyPage);
      }
    }

    // تحديد حالة النجاح
    result.success = result.mismatches.length === 0 && 
                    result.missingInUnified.length === 0 && 
                    result.extraInUnified.length === 0;

    return result;
  }

  pagesMatch(unified, legacy) {
    return unified.page_id === legacy.page_id &&
           unified.page_name === legacy.page_name &&
           unified.company_id === legacy.company_id &&
           Boolean(unified.is_active) === Boolean(legacy.is_active);
  }

  findDifferences(unified, legacy) {
    const differences = [];
    
    if (unified.page_name !== legacy.page_name) {
      differences.push(`page_name: "${unified.page_name}" vs "${legacy.page_name}"`);
    }
    
    if (Boolean(unified.is_active) !== Boolean(legacy.is_active)) {
      differences.push(`is_active: ${unified.is_active} vs ${legacy.is_active}`);
    }
    
    if (Boolean(unified.webhook_enabled) !== Boolean(legacy.webhook_enabled)) {
      differences.push(`webhook_enabled: ${unified.webhook_enabled} vs ${legacy.webhook_enabled}`);
    }

    return differences;
  }

  logComparison(comparison) {
    const timestamp = new Date().toLocaleString('ar-EG');
    const status = comparison.success ? '✅ نجح' : '❌ فشل';
    
    let logEntry = `\n[${timestamp}] مقارنة الشركة ${comparison.companyId}: ${status}\n`;
    logEntry += `  📊 الجدول الموحد: ${comparison.unifiedCount} صفحة\n`;
    logEntry += `  📊 الجداول القديمة: ${comparison.legacyCount} صفحة\n`;
    logEntry += `  ✅ متطابقة: ${comparison.matches}\n`;
    
    if (comparison.mismatches.length > 0) {
      logEntry += `  ⚠️ اختلافات: ${comparison.mismatches.length}\n`;
      comparison.mismatches.forEach(mismatch => {
        logEntry += `    - ${mismatch.pageId}: ${mismatch.differences.join(', ')}\n`;
      });
    }
    
    if (comparison.missingInUnified.length > 0) {
      logEntry += `  ❌ مفقودة في الموحد: ${comparison.missingInUnified.length}\n`;
    }
    
    if (comparison.extraInUnified.length > 0) {
      logEntry += `  ➕ إضافية في الموحد: ${comparison.extraInUnified.length}\n`;
    }

    // كتابة السجل في الملف
    fs.appendFileSync(MONITORING_CONFIG.logFile, logEntry);
    
    // طباعة النتيجة في الكونسول
    console.log(logEntry.trim());
    
    // تنبيه في حالة الفشل
    if (!comparison.success) {
      console.log('🚨 تم اكتشاف اختلافات في البيانات!'.red.bold);
      this.errorCount++;
    } else {
      this.errorCount = 0; // إعادة تعيين عداد الأخطاء عند النجاح
    }
  }

  async runMonitoring() {
    if (this.isRunning) {
      console.log('⚠️ المراقبة تعمل بالفعل'.yellow);
      return;
    }

    console.log('🚀 بدء نظام المراقبة المقارن...'.green.bold);
    console.log(`📊 فترة المراقبة: ${MONITORING_CONFIG.interval / 1000} ثانية`.cyan);
    console.log(`📝 ملف السجلات: ${MONITORING_CONFIG.logFile}`.cyan);
    
    this.isRunning = true;
    
    const runCheck = async () => {
      if (!this.isRunning) return;
      
      try {
        console.log('\n🔄 بدء دورة مراقبة جديدة...'.yellow);
        
        for (const companyId of MONITORING_CONFIG.companies) {
          await this.compareData(companyId);
          
          // تأخير قصير بين الشركات
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // تحقق من عدد الأخطاء
        if (this.errorCount >= MONITORING_CONFIG.alertThreshold) {
          console.log(`🚨 تحذير: ${this.errorCount} أخطاء متتالية!`.red.bold);
          console.log('💡 يُنصح بمراجعة النظام فوراً'.yellow);
        }
        
      } catch (error) {
        console.error('❌ خطأ في دورة المراقبة:'.red, error.message);
        this.errorCount++;
      }
    };

    // تشغيل الفحص الأول فوراً
    await runCheck();
    
    // جدولة الفحوصات الدورية
    this.intervalId = setInterval(runCheck, MONITORING_CONFIG.interval);
  }

  stopMonitoring() {
    if (!this.isRunning) {
      console.log('⚠️ المراقبة متوقفة بالفعل'.yellow);
      return;
    }

    console.log('🛑 إيقاف نظام المراقبة...'.red);
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('✅ تم إيقاف المراقبة بنجاح'.green);
  }

  async close() {
    this.stopMonitoring();
    
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل المراقب
async function startMonitoring() {
  const monitor = new ComparisonMonitor();
  
  if (await monitor.init()) {
    await monitor.runMonitoring();
    
    // التعامل مع إشارات الإغلاق
    process.on('SIGINT', async () => {
      console.log('\n🛑 تم استلام إشارة الإغلاق...'.yellow);
      await monitor.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 تم استلام إشارة الإنهاء...'.yellow);
      await monitor.close();
      process.exit(0);
    });
    
  } else {
    console.error('❌ فشل في تهيئة نظام المراقبة'.red);
    process.exit(1);
  }
}

// تشغيل المراقب إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  startMonitoring().catch(console.error);
}

module.exports = { ComparisonMonitor };
