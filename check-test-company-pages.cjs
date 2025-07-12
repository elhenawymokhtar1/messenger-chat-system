/**
 * فحص الشركة التجريبية والصفحات المرتبطة بها
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

class CompanyPagesChecker {
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

  async checkTestCompany() {
    try {
      console.log('\n📋 البحث عن الشركة التجريبية...'.yellow);
      
      // البحث عن الشركة التجريبية
      const [companies] = await this.connection.execute(`
        SELECT * FROM companies 
        WHERE name LIKE '%تجريبية%' OR name LIKE '%test%' OR name LIKE '%demo%'
        ORDER BY created_at DESC
      `);

      if (companies.length === 0) {
        console.log('❌ لم يتم العثور على شركة تجريبية'.red);
        return null;
      }

      console.log(`✅ تم العثور على ${companies.length} شركة تجريبية:`.green);
      
      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        console.log(`\n🏢 الشركة ${i + 1}:`.cyan);
        console.log(`   📝 الاسم: ${company.name}`.white);
        console.log(`   🆔 المعرف: ${company.id}`.gray);
        console.log(`   📧 الإيميل: ${company.email || 'غير محدد'}`.white);
        console.log(`   📱 الهاتف: ${company.phone || 'غير محدد'}`.white);
        console.log(`   📊 الحالة: ${company.status}`.white);
        console.log(`   📅 تاريخ الإنشاء: ${company.created_at}`.gray);
        
        // فحص صفحات هذه الشركة
        await this.checkCompanyPages(company.id, company.name);
      }

      return companies[0]; // إرجاع أول شركة تجريبية
    } catch (error) {
      console.error('❌ خطأ في فحص الشركة التجريبية:'.red, error.message);
      return null;
    }
  }

  async checkCompanyPages(companyId, companyName) {
    try {
      console.log(`\n🔍 فحص صفحات الشركة: ${companyName}`.yellow);
      
      // فحص جدول facebook_settings
      const [facebookSettings] = await this.connection.execute(`
        SELECT * FROM facebook_settings 
        WHERE company_id = ?
        ORDER BY created_at DESC
      `, [companyId]);

      console.log(`📄 صفحات Facebook في جدول facebook_settings: ${facebookSettings.length}`.cyan);
      
      if (facebookSettings.length > 0) {
        facebookSettings.forEach((page, index) => {
          console.log(`\n   📄 صفحة ${index + 1}:`.white);
          console.log(`      🆔 معرف الصفحة: ${page.page_id}`.gray);
          console.log(`      📝 اسم الصفحة: ${page.page_name || 'غير محدد'}`.white);
          console.log(`      🔗 رابط الصفحة: ${page.page_username || 'غير محدد'}`.white);
          console.log(`      ✅ نشطة: ${page.is_active ? 'نعم' : 'لا'}`.white);
          console.log(`      🔔 Webhook مفعل: ${page.webhook_enabled ? 'نعم' : 'لا'}`.white);
          console.log(`      🔑 لديها Token: ${page.access_token ? 'نعم' : 'لا'}`.white);
          console.log(`      📅 تاريخ الإنشاء: ${page.created_at}`.gray);
        });
      } else {
        console.log('   ❌ لا توجد صفحات Facebook مرتبطة بهذه الشركة'.red);
      }

      // فحص جدول facebook_pages (إذا كان موجوداً)
      try {
        const [facebookPages] = await this.connection.execute(`
          SELECT * FROM facebook_pages 
          WHERE company_id = ?
          ORDER BY created_at DESC
        `, [companyId]);

        console.log(`📄 صفحات Facebook في جدول facebook_pages: ${facebookPages.length}`.cyan);
        
        if (facebookPages.length > 0) {
          facebookPages.forEach((page, index) => {
            console.log(`\n   📄 صفحة ${index + 1}:`.white);
            console.log(`      🆔 معرف الصفحة: ${page.page_id || page.facebook_page_id}`.gray);
            console.log(`      📝 اسم الصفحة: ${page.page_name || page.name}`.white);
            console.log(`      ✅ نشطة: ${page.is_active || page.status === 'active' ? 'نعم' : 'لا'}`.white);
            console.log(`      🔑 لديها Token: ${page.access_token ? 'نعم' : 'لا'}`.white);
            console.log(`      📅 تاريخ الإنشاء: ${page.created_at}`.gray);
          });
        }
      } catch (error) {
        console.log('   ℹ️ جدول facebook_pages غير موجود أو فارغ'.yellow);
      }

      // فحص المحادثات المرتبطة بهذه الشركة
      await this.checkCompanyConversations(companyId, companyName);

    } catch (error) {
      console.error('❌ خطأ في فحص صفحات الشركة:'.red, error.message);
    }
  }

  async checkCompanyConversations(companyId, companyName) {
    try {
      console.log(`\n💬 فحص محادثات الشركة: ${companyName}`.yellow);
      
      const [conversations] = await this.connection.execute(`
        SELECT COUNT(*) as total_conversations,
               COUNT(DISTINCT facebook_page_id) as unique_pages,
               COUNT(DISTINCT user_id) as unique_users
        FROM conversations 
        WHERE company_id = ?
      `, [companyId]);

      const stats = conversations[0];
      console.log(`   📊 إجمالي المحادثات: ${stats.total_conversations}`.white);
      console.log(`   📄 عدد الصفحات المختلفة: ${stats.unique_pages}`.white);
      console.log(`   👥 عدد المستخدمين المختلفين: ${stats.unique_users}`.white);

      // جلب آخر 5 محادثات
      const [recentConversations] = await this.connection.execute(`
        SELECT facebook_page_id, user_name, status, last_message_at, created_at
        FROM conversations 
        WHERE company_id = ?
        ORDER BY last_message_at DESC
        LIMIT 5
      `, [companyId]);

      if (recentConversations.length > 0) {
        console.log(`\n   📝 آخر ${recentConversations.length} محادثات:`.cyan);
        recentConversations.forEach((conv, index) => {
          console.log(`      ${index + 1}. ${conv.user_name || 'مستخدم غير معروف'} - ${conv.facebook_page_id} - ${conv.status}`.white);
          console.log(`         آخر رسالة: ${conv.last_message_at || 'غير محدد'}`.gray);
        });
      }

    } catch (error) {
      console.error('❌ خطأ في فحص محادثات الشركة:'.red, error.message);
    }
  }

  async checkAllFacebookPages() {
    try {
      console.log('\n🌐 فحص جميع صفحات Facebook في النظام...'.yellow);
      
      const [allPages] = await this.connection.execute(`
        SELECT fs.*, c.name as company_name
        FROM facebook_settings fs
        LEFT JOIN companies c ON fs.company_id = c.id
        ORDER BY fs.created_at DESC
      `);

      console.log(`📄 إجمالي صفحات Facebook: ${allPages.length}`.cyan);
      
      if (allPages.length > 0) {
        console.log('\n📋 قائمة جميع الصفحات:'.cyan);
        allPages.forEach((page, index) => {
          console.log(`\n   ${index + 1}. ${page.page_name || 'صفحة غير مسماة'}`.white);
          console.log(`      🆔 معرف الصفحة: ${page.page_id}`.gray);
          console.log(`      🏢 الشركة: ${page.company_name || 'غير مرتبطة بشركة'}`.white);
          console.log(`      ✅ نشطة: ${page.is_active ? 'نعم' : 'لا'}`.white);
          console.log(`      🔔 Webhook: ${page.webhook_enabled ? 'مفعل' : 'معطل'}`.white);
        });
      }

    } catch (error) {
      console.error('❌ خطأ في فحص جميع صفحات Facebook:'.red, error.message);
    }
  }

  async generateReport() {
    try {
      console.log('\n📊 إنشاء تقرير شامل...'.yellow);
      
      const report = {
        timestamp: new Date().toISOString(),
        companies: {},
        facebook_pages: {},
        conversations: {},
        summary: {}
      };

      // إحصائيات الشركات
      const [companiesStats] = await this.connection.execute(`
        SELECT COUNT(*) as total, 
               SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
        FROM companies
      `);
      report.companies = companiesStats[0];

      // إحصائيات صفحات Facebook
      const [pagesStats] = await this.connection.execute(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN company_id IS NOT NULL THEN 1 ELSE 0 END) as linked_to_company
        FROM facebook_settings
      `);
      report.facebook_pages = pagesStats[0];

      // إحصائيات المحادثات
      const [conversationsStats] = await this.connection.execute(`
        SELECT COUNT(*) as total,
               COUNT(DISTINCT company_id) as companies_with_conversations,
               COUNT(DISTINCT facebook_page_id) as pages_with_conversations
        FROM conversations
      `);
      report.conversations = conversationsStats[0];

      console.log('\n📊 التقرير النهائي:'.green);
      console.log('====================================='.green);
      console.log(`🏢 الشركات: ${report.companies.total} (نشطة: ${report.companies.active})`.white);
      console.log(`📄 صفحات Facebook: ${report.facebook_pages.total} (نشطة: ${report.facebook_pages.active}, مرتبطة: ${report.facebook_pages.linked_to_company})`.white);
      console.log(`💬 المحادثات: ${report.conversations.total} (شركات لديها محادثات: ${report.conversations.companies_with_conversations})`.white);
      console.log('====================================='.green);

      return report;

    } catch (error) {
      console.error('❌ خطأ في إنشاء التقرير:'.red, error.message);
      return null;
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل الفحص
async function main() {
  const checker = new CompanyPagesChecker();
  
  try {
    const connected = await checker.connect();
    if (!connected) {
      process.exit(1);
    }

    console.log('🔍 بدء فحص الشركة التجريبية والصفحات...'.cyan);
    console.log('='.repeat(50).cyan);

    // فحص الشركة التجريبية
    const testCompany = await checker.checkTestCompany();
    
    // فحص جميع صفحات Facebook
    await checker.checkAllFacebookPages();
    
    // إنشاء تقرير شامل
    await checker.generateReport();

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

module.exports = CompanyPagesChecker;
