/**
 * إصلاح مشاكل الـ Webhook لصفحات Facebook
 * تاريخ الإنشاء: 11 يوليو 2025
 */

const mysql = require('mysql2/promise');
const colors = require('colors');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

class WebhookFixer {
  constructor() {
    this.connection = null;
    this.fixes = [];
    this.errors = [];
  }

  async connect() {
    try {
      console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
      this.connection = await mysql.createConnection(dbConfig);
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'.green);
      return true;
    } catch (error) {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:'.red, error.message);
      return false;
    }
  }

  async checkTableStructure() {
    try {
      console.log('\n🔍 فحص بنية جدول facebook_settings...'.yellow);
      
      const [columns] = await this.connection.execute(`
        SHOW COLUMNS FROM facebook_settings
      `);

      console.log('📋 الأعمدة الموجودة:'.cyan);
      const existingColumns = [];
      columns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`.white);
        existingColumns.push(col.Field);
      });

      // فحص الأعمدة المطلوبة
      const requiredColumns = [
        'webhook_enabled',
        'webhook_url',
        'webhook_verify_token',
        'is_active'
      ];

      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️ أعمدة مفقودة:'.yellow);
        missingColumns.forEach(col => {
          console.log(`   - ${col}`.red);
        });
        return { existingColumns, missingColumns };
      } else {
        console.log('\n✅ جميع الأعمدة المطلوبة موجودة'.green);
        return { existingColumns, missingColumns: [] };
      }

    } catch (error) {
      console.error('❌ خطأ في فحص بنية الجدول:'.red, error.message);
      this.errors.push(`فشل فحص بنية الجدول: ${error.message}`);
      return null;
    }
  }

  async addMissingColumns() {
    try {
      console.log('\n🔧 إضافة الأعمدة المفقودة...'.yellow);

      // إضافة عمود webhook_url إذا لم يكن موجوداً
      try {
        await this.connection.execute(`
          ALTER TABLE facebook_settings 
          ADD COLUMN webhook_url TEXT COMMENT 'رابط الـ Webhook'
        `);
        console.log('✅ تم إضافة عمود webhook_url'.green);
        this.fixes.push('إضافة عمود webhook_url');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('ℹ️ عمود webhook_url موجود بالفعل'.blue);
        } else {
          throw error;
        }
      }

      // إضافة عمود webhook_verify_token إذا لم يكن موجوداً
      try {
        await this.connection.execute(`
          ALTER TABLE facebook_settings 
          ADD COLUMN webhook_verify_token VARCHAR(255) COMMENT 'رمز التحقق من الـ Webhook'
        `);
        console.log('✅ تم إضافة عمود webhook_verify_token'.green);
        this.fixes.push('إضافة عمود webhook_verify_token');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('ℹ️ عمود webhook_verify_token موجود بالفعل'.blue);
        } else {
          throw error;
        }
      }

      // التأكد من وجود عمود webhook_enabled
      try {
        await this.connection.execute(`
          ALTER TABLE facebook_settings 
          ADD COLUMN webhook_enabled BOOLEAN DEFAULT FALSE COMMENT 'حالة تفعيل الـ Webhook'
        `);
        console.log('✅ تم إضافة عمود webhook_enabled'.green);
        this.fixes.push('إضافة عمود webhook_enabled');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('ℹ️ عمود webhook_enabled موجود بالفعل'.blue);
        } else {
          throw error;
        }
      }

    } catch (error) {
      console.error('❌ خطأ في إضافة الأعمدة:'.red, error.message);
      this.errors.push(`فشل إضافة الأعمدة: ${error.message}`);
    }
  }

  async enableWebhooks() {
    try {
      console.log('\n🔄 تفعيل الـ Webhooks للصفحات النشطة...'.yellow);

      // تفعيل الـ Webhook لجميع الصفحات النشطة
      const [result] = await this.connection.execute(`
        UPDATE facebook_settings 
        SET webhook_enabled = 1 
        WHERE is_active = 1
      `);

      console.log(`✅ تم تفعيل الـ Webhook لـ ${result.affectedRows} صفحة`.green);
      this.fixes.push(`تفعيل الـ Webhook لـ ${result.affectedRows} صفحة`);

    } catch (error) {
      console.error('❌ خطأ في تفعيل الـ Webhooks:'.red, error.message);
      this.errors.push(`فشل تفعيل الـ Webhooks: ${error.message}`);
    }
  }

  async setWebhookUrl() {
    try {
      console.log('\n🌐 تحديد رابط الـ Webhook...'.yellow);

      // استخدام رابط محلي للتطوير
      const webhookUrl = 'http://localhost:3002/api/webhook/facebook';
      
      const [result] = await this.connection.execute(`
        UPDATE facebook_settings 
        SET webhook_url = ?
        WHERE webhook_url IS NULL OR webhook_url = ''
      `, [webhookUrl]);

      console.log(`✅ تم تحديد رابط الـ Webhook لـ ${result.affectedRows} صفحة`.green);
      console.log(`🔗 الرابط: ${webhookUrl}`.cyan);
      this.fixes.push(`تحديد رابط الـ Webhook: ${webhookUrl}`);

    } catch (error) {
      console.error('❌ خطأ في تحديد رابط الـ Webhook:'.red, error.message);
      this.errors.push(`فشل تحديد رابط الـ Webhook: ${error.message}`);
    }
  }

  async setVerifyToken() {
    try {
      console.log('\n🔑 تحديد رمز التحقق...'.yellow);

      const verifyToken = 'facebook_verify_token_123';
      
      const [result] = await this.connection.execute(`
        UPDATE facebook_settings 
        SET webhook_verify_token = ?
        WHERE webhook_verify_token IS NULL OR webhook_verify_token = ''
      `, [verifyToken]);

      console.log(`✅ تم تحديد رمز التحقق لـ ${result.affectedRows} صفحة`.green);
      console.log(`🔑 رمز التحقق: ${verifyToken}`.cyan);
      this.fixes.push(`تحديد رمز التحقق: ${verifyToken}`);

    } catch (error) {
      console.error('❌ خطأ في تحديد رمز التحقق:'.red, error.message);
      this.errors.push(`فشل تحديد رمز التحقق: ${error.message}`);
    }
  }

  async verifyFixes() {
    try {
      console.log('\n✅ التحقق من الإصلاحات...'.yellow);

      const [pages] = await this.connection.execute(`
        SELECT page_id, page_name, is_active, webhook_enabled, webhook_url, webhook_verify_token
        FROM facebook_settings
      `);

      console.log('📋 حالة الصفحات بعد الإصلاح:'.cyan);
      
      pages.forEach((page, index) => {
        console.log(`\n${index + 1}. 📄 ${page.page_name || 'صفحة غير مسماة'}`.white.bold);
        console.log(`   🆔 معرف الصفحة: ${page.page_id}`.gray);
        console.log(`   📊 حالة الصفحة: ${page.is_active ? '✅ نشطة' : '❌ معطلة'}`.white);
        console.log(`   🔔 حالة الـ Webhook: ${page.webhook_enabled ? '✅ مفعل' : '❌ معطل'}`.white);
        console.log(`   🌐 رابط الـ Webhook: ${page.webhook_url || 'غير محدد'}`.gray);
        console.log(`   🔑 رمز التحقق: ${page.webhook_verify_token || 'غير محدد'}`.gray);
      });

      // إحصائيات
      const activeWebhooks = pages.filter(p => p.webhook_enabled).length;
      const totalPages = pages.length;

      console.log('\n📊 النتائج النهائية:'.green.bold);
      console.log('='.repeat(30).green);
      console.log(`📄 إجمالي الصفحات: ${totalPages}`.white);
      console.log(`🔔 Webhooks مفعلة: ${activeWebhooks}`.green);
      console.log(`🚫 Webhooks معطلة: ${totalPages - activeWebhooks}`.red);

      if (activeWebhooks === totalPages && totalPages > 0) {
        console.log('\n🎉 ممتاز! جميع الصفحات لديها Webhook مفعل'.green.bold);
      } else if (activeWebhooks > 0) {
        console.log('\n⚠️ بعض الصفحات لا تزال بحاجة لإصلاح'.yellow);
      } else {
        console.log('\n❌ لا يزال هناك مشاكل في الـ Webhooks'.red);
      }

    } catch (error) {
      console.error('❌ خطأ في التحقق من الإصلاحات:'.red, error.message);
      this.errors.push(`فشل التحقق من الإصلاحات: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📋 تقرير الإصلاحات:'.blue.bold);
    console.log('='.repeat(40).blue);
    
    if (this.fixes.length > 0) {
      console.log('✅ الإصلاحات المنجزة:'.green);
      this.fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`.white);
      });
    }

    if (this.errors.length > 0) {
      console.log('\n❌ الأخطاء:'.red);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`.white);
      });
    }

    console.log('\n💡 الخطوات التالية:'.yellow.bold);
    console.log('1. تأكد من تشغيل السرفر على المنفذ 3002'.white);
    console.log('2. اذهب إلى Facebook Developer Console'.white);
    console.log('3. أضف رابط الـ Webhook: http://localhost:3002/api/webhook/facebook'.white);
    console.log('4. استخدم رمز التحقق: facebook_verify_token_123'.white);
    console.log('5. اختبر الـ Webhook من Facebook'.white);
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل الإصلاح
async function main() {
  const fixer = new WebhookFixer();
  
  try {
    const connected = await fixer.connect();
    if (!connected) {
      process.exit(1);
    }

    console.log('🔧 بدء إصلاح مشاكل الـ Webhook...'.cyan.bold);
    console.log('='.repeat(50).cyan);

    // فحص بنية الجدول
    await fixer.checkTableStructure();
    
    // إضافة الأعمدة المفقودة
    await fixer.addMissingColumns();
    
    // تفعيل الـ Webhooks
    await fixer.enableWebhooks();
    
    // تحديد رابط الـ Webhook
    await fixer.setWebhookUrl();
    
    // تحديد رمز التحقق
    await fixer.setVerifyToken();
    
    // التحقق من الإصلاحات
    await fixer.verifyFixes();
    
    // إنشاء تقرير
    await fixer.generateReport();

  } catch (error) {
    console.error('💥 خطأ عام:'.red, error);
  } finally {
    await fixer.close();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main().catch(console.error);
}

module.exports = WebhookFixer;
