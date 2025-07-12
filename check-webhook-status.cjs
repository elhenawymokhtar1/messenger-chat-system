/**
 * فحص حالة الـ Webhook لجميع صفحات Facebook
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

class WebhookChecker {
  constructor() {
    this.connection = null;
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

  async checkWebhookStatus() {
    try {
      console.log('\n🔍 فحص حالة الـ Webhook لجميع الصفحات...'.yellow);
      console.log('='.repeat(60).cyan);

      // فحص جدول facebook_settings
      const [facebookSettings] = await this.connection.execute(`
        SELECT fs.*, c.name as company_name
        FROM facebook_settings fs
        LEFT JOIN companies c ON fs.company_id = c.id
        ORDER BY fs.created_at DESC
      `);

      console.log(`📄 إجمالي الصفحات: ${facebookSettings.length}`.cyan);

      if (facebookSettings.length === 0) {
        console.log('❌ لا توجد صفحات Facebook في النظام'.red);
        return;
      }

      let activeWebhooks = 0;
      let inactiveWebhooks = 0;
      let activePages = 0;
      let inactivePages = 0;

      console.log('\n📋 تفاصيل كل صفحة:'.yellow);
      
      facebookSettings.forEach((page, index) => {
        console.log(`\n${index + 1}. 📄 ${page.page_name || 'صفحة غير مسماة'}`.white.bold);
        console.log(`   🆔 معرف الصفحة: ${page.page_id}`.gray);
        console.log(`   🏢 الشركة: ${page.company_name || 'غير مرتبطة'}`.white);
        
        // حالة الصفحة
        const pageStatus = page.is_active ? '✅ نشطة' : '❌ معطلة';
        console.log(`   📊 حالة الصفحة: ${pageStatus}`.white);
        
        if (page.is_active) {
          activePages++;
        } else {
          inactivePages++;
        }

        // حالة الـ Webhook
        const webhookStatus = page.webhook_enabled ? '✅ مفعل' : '❌ معطل';
        const webhookColor = page.webhook_enabled ? 'green' : 'red';
        console.log(`   🔔 حالة الـ Webhook: ${webhookStatus}`[webhookColor]);
        
        if (page.webhook_enabled) {
          activeWebhooks++;
        } else {
          inactiveWebhooks++;
        }

        // معلومات إضافية
        console.log(`   🔑 لديها Token: ${page.access_token ? '✅ نعم' : '❌ لا'}`.white);
        console.log(`   🌐 رابط الـ Webhook: ${page.webhook_url || 'غير محدد'}`.gray);
        console.log(`   📅 تاريخ الإنشاء: ${page.created_at}`.gray);
        console.log(`   📅 آخر تحديث: ${page.updated_at}`.gray);

        // تحذيرات
        if (page.is_active && !page.webhook_enabled) {
          console.log(`   ⚠️ تحذير: الصفحة نشطة لكن الـ Webhook معطل!`.yellow.bold);
        }
        
        if (!page.access_token) {
          console.log(`   ⚠️ تحذير: لا يوجد Access Token!`.yellow.bold);
        }
      });

      // ملخص الإحصائيات
      console.log('\n📊 ملخص الإحصائيات:'.green.bold);
      console.log('='.repeat(40).green);
      console.log(`📄 إجمالي الصفحات: ${facebookSettings.length}`.white);
      console.log(`✅ صفحات نشطة: ${activePages}`.green);
      console.log(`❌ صفحات معطلة: ${inactivePages}`.red);
      console.log(`🔔 Webhooks مفعلة: ${activeWebhooks}`.green);
      console.log(`🚫 Webhooks معطلة: ${inactiveWebhooks}`.red);

      // تحليل المشاكل
      console.log('\n🔍 تحليل المشاكل:'.yellow.bold);
      console.log('='.repeat(30).yellow);
      
      if (inactiveWebhooks > 0) {
        console.log(`⚠️ يوجد ${inactiveWebhooks} صفحة بـ Webhook معطل`.red);
        console.log('   💡 هذا يعني أن هذه الصفحات لن تستقبل رسائل جديدة'.yellow);
      }
      
      if (activePages > activeWebhooks) {
        const problematicPages = activePages - activeWebhooks;
        console.log(`⚠️ يوجد ${problematicPages} صفحة نشطة لكن بـ Webhook معطل`.red);
        console.log('   💡 هذه مشكلة خطيرة - الصفحات لن تعمل بشكل صحيح'.red.bold);
      }

      if (activeWebhooks === 0) {
        console.log('🚨 تحذير خطير: لا يوجد أي Webhook مفعل في النظام!'.red.bold);
        console.log('   💡 النظام لن يستقبل أي رسائل من Facebook'.red);
      }

      return {
        totalPages: facebookSettings.length,
        activePages,
        inactivePages,
        activeWebhooks,
        inactiveWebhooks,
        pages: facebookSettings
      };

    } catch (error) {
      console.error('❌ خطأ في فحص حالة الـ Webhook:'.red, error.message);
      return null;
    }
  }

  async checkWebhookUrls() {
    try {
      console.log('\n🌐 فحص روابط الـ Webhook...'.yellow);
      
      const [webhookUrls] = await this.connection.execute(`
        SELECT DISTINCT webhook_url, COUNT(*) as count
        FROM facebook_settings 
        WHERE webhook_url IS NOT NULL AND webhook_url != ''
        GROUP BY webhook_url
        ORDER BY count DESC
      `);

      if (webhookUrls.length === 0) {
        console.log('❌ لا توجد روابط Webhook محددة'.red);
        return;
      }

      console.log(`📋 روابط الـ Webhook المستخدمة (${webhookUrls.length}):`.cyan);
      
      webhookUrls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url.webhook_url} (${url.count} صفحة)`.white);
      });

    } catch (error) {
      console.error('❌ خطأ في فحص روابط الـ Webhook:'.red, error.message);
    }
  }

  async suggestFixes() {
    console.log('\n🔧 اقتراحات الإصلاح:'.green.bold);
    console.log('='.repeat(30).green);
    
    console.log('1. 🔄 تفعيل الـ Webhook للصفحات المعطلة:'.yellow);
    console.log('   UPDATE facebook_settings SET webhook_enabled = 1 WHERE webhook_enabled = 0;'.gray);
    
    console.log('\n2. 🌐 تحديد رابط الـ Webhook:'.yellow);
    console.log('   UPDATE facebook_settings SET webhook_url = "https://your-domain.com/webhook";'.gray);
    
    console.log('\n3. ✅ تفعيل جميع الصفحات:'.yellow);
    console.log('   UPDATE facebook_settings SET is_active = 1;'.gray);
    
    console.log('\n4. 🔍 فحص إعدادات Facebook:'.yellow);
    console.log('   - تأكد من صحة الـ Access Tokens'.gray);
    console.log('   - تأكد من إعدادات الـ Webhook في Facebook Developer Console'.gray);
    console.log('   - تأكد من أن الـ Verify Token صحيح'.gray);
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل الفحص
async function main() {
  const checker = new WebhookChecker();
  
  try {
    const connected = await checker.connect();
    if (!connected) {
      process.exit(1);
    }

    console.log('🔍 بدء فحص حالة الـ Webhook...'.cyan.bold);
    
    // فحص حالة الـ Webhook
    const status = await checker.checkWebhookStatus();
    
    // فحص روابط الـ Webhook
    await checker.checkWebhookUrls();
    
    // اقتراحات الإصلاح
    await checker.suggestFixes();

  } catch (error) {
    console.error('💥 خطأ عام:'.red, error);
  } finally {
    await checker.close();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main().catch(console.error);
}

module.exports = WebhookChecker;
