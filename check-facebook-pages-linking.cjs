/**
 * فحص ربط صفحات Facebook بالشركات
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

class FacebookPagesLinkingChecker {
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

  async checkCompanyPages() {
    try {
      console.log('\n🔍 فحص ربط الصفحات بالشركات...'.yellow);
      console.log('='.repeat(60).cyan);

      // البحث عن الشركة test@company.com
      const [companies] = await this.connection.execute(`
        SELECT * FROM companies 
        WHERE email = 'test@company.com'
      `);

      if (companies.length === 0) {
        console.log('❌ لم يتم العثور على شركة بالإيميل test@company.com'.red);
        return;
      }

      const company = companies[0];
      console.log('🏢 بيانات الشركة:'.cyan.bold);
      console.log(`   📝 الاسم: ${company.name}`.white);
      console.log(`   🆔 المعرف: ${company.id}`.gray);
      console.log(`   📧 الإيميل: ${company.email}`.white);
      console.log(`   📊 الحالة: ${company.status}`.white);

      // فحص الصفحات المرتبطة بهذه الشركة
      await this.checkPagesForCompany(company.id, company.name);

      // فحص جميع الصفحات في النظام
      await this.checkAllPages();

      // فحص الصفحات غير المرتبطة
      await this.checkUnlinkedPages();

    } catch (error) {
      console.error('❌ خطأ في فحص ربط الصفحات:'.red, error.message);
    }
  }

  async checkPagesForCompany(companyId, companyName) {
    try {
      console.log(`\n📄 الصفحات المرتبطة بـ "${companyName}":`.yellow);

      // فحص جدول facebook_settings
      const [facebookSettings] = await this.connection.execute(`
        SELECT * FROM facebook_settings 
        WHERE company_id = ?
        ORDER BY created_at DESC
      `, [companyId]);

      console.log(`📋 في جدول facebook_settings: ${facebookSettings.length} صفحة`.cyan);
      
      if (facebookSettings.length > 0) {
        facebookSettings.forEach((page, index) => {
          console.log(`\n   ${index + 1}. 📄 ${page.page_name || 'صفحة غير مسماة'}`.white.bold);
          console.log(`      🆔 معرف الصفحة: ${page.page_id}`.gray);
          console.log(`      ✅ نشطة: ${page.is_active ? 'نعم' : 'لا'}`.white);
          console.log(`      🔔 Webhook: ${page.webhook_enabled ? 'مفعل' : 'معطل'}`.white);
          console.log(`      🔑 لديها Token: ${page.access_token ? 'نعم' : 'لا'}`.white);
          console.log(`      📅 تاريخ الإنشاء: ${page.created_at}`.gray);
        });
      } else {
        console.log('   ❌ لا توجد صفحات في جدول facebook_settings'.red);
      }

      // فحص جدول facebook_pages
      try {
        const [facebookPages] = await this.connection.execute(`
          SELECT * FROM facebook_pages 
          WHERE company_id = ?
          ORDER BY created_at DESC
        `, [companyId]);

        console.log(`📋 في جدول facebook_pages: ${facebookPages.length} صفحة`.cyan);
        
        if (facebookPages.length > 0) {
          facebookPages.forEach((page, index) => {
            console.log(`\n   ${index + 1}. 📄 ${page.page_name || page.name || 'صفحة غير مسماة'}`.white.bold);
            console.log(`      🆔 معرف الصفحة: ${page.page_id || page.facebook_page_id}`.gray);
            console.log(`      ✅ نشطة: ${page.is_active || page.status === 'active' ? 'نعم' : 'لا'}`.white);
            console.log(`      🔑 لديها Token: ${page.access_token ? 'نعم' : 'لا'}`.white);
            console.log(`      📅 تاريخ الإنشاء: ${page.created_at}`.gray);
          });
        } else {
          console.log('   ❌ لا توجد صفحات في جدول facebook_pages'.red);
        }
      } catch (error) {
        console.log('   ℹ️ جدول facebook_pages غير موجود أو فارغ'.yellow);
      }

    } catch (error) {
      console.error('❌ خطأ في فحص صفحات الشركة:'.red, error.message);
    }
  }

  async checkAllPages() {
    try {
      console.log('\n🌐 جميع صفحات Facebook في النظام:'.yellow);

      const [allPages] = await this.connection.execute(`
        SELECT fs.*, c.name as company_name, c.email as company_email
        FROM facebook_settings fs
        LEFT JOIN companies c ON fs.company_id = c.id
        ORDER BY fs.created_at DESC
      `);

      console.log(`📄 إجمالي الصفحات: ${allPages.length}`.cyan);
      
      if (allPages.length > 0) {
        allPages.forEach((page, index) => {
          console.log(`\n   ${index + 1}. 📄 ${page.page_name || 'صفحة غير مسماة'}`.white.bold);
          console.log(`      🆔 معرف الصفحة: ${page.page_id}`.gray);
          console.log(`      🏢 الشركة: ${page.company_name || 'غير مرتبطة'}`.white);
          console.log(`      📧 إيميل الشركة: ${page.company_email || 'غير محدد'}`.gray);
          console.log(`      ✅ نشطة: ${page.is_active ? 'نعم' : 'لا'}`.white);
          console.log(`      🔔 Webhook: ${page.webhook_enabled ? 'مفعل' : 'معطل'}`.white);
        });
      }

    } catch (error) {
      console.error('❌ خطأ في فحص جميع الصفحات:'.red, error.message);
    }
  }

  async checkUnlinkedPages() {
    try {
      console.log('\n🔗 الصفحات غير المرتبطة بشركات:'.yellow);

      const [unlinkedPages] = await this.connection.execute(`
        SELECT * FROM facebook_settings 
        WHERE company_id IS NULL OR company_id = ''
        ORDER BY created_at DESC
      `);

      if (unlinkedPages.length > 0) {
        console.log(`⚠️ يوجد ${unlinkedPages.length} صفحة غير مرتبطة:`.red);
        
        unlinkedPages.forEach((page, index) => {
          console.log(`\n   ${index + 1}. 📄 ${page.page_name || 'صفحة غير مسماة'}`.white.bold);
          console.log(`      🆔 معرف الصفحة: ${page.page_id}`.gray);
          console.log(`      ✅ نشطة: ${page.is_active ? 'نعم' : 'لا'}`.white);
          console.log(`      🔑 لديها Token: ${page.access_token ? 'نعم' : 'لا'}`.white);
        });

        console.log('\n💡 يمكن ربط هذه الصفحات بالشركة test@company.com'.yellow);
      } else {
        console.log('✅ جميع الصفحات مرتبطة بشركات'.green);
      }

    } catch (error) {
      console.error('❌ خطأ في فحص الصفحات غير المرتبطة:'.red, error.message);
    }
  }

  async suggestSolutions() {
    try {
      console.log('\n🔧 الحلول المقترحة:'.green.bold);
      console.log('='.repeat(40).green);

      // البحث عن الشركة
      const [companies] = await this.connection.execute(`
        SELECT id FROM companies WHERE email = 'test@company.com'
      `);

      if (companies.length === 0) {
        console.log('❌ الشركة غير موجودة - يجب إنشاؤها أولاً'.red);
        return;
      }

      const companyId = companies[0].id;

      // البحث عن صفحات غير مرتبطة
      const [unlinkedPages] = await this.connection.execute(`
        SELECT page_id, page_name FROM facebook_settings 
        WHERE company_id IS NULL OR company_id = '' OR company_id != ?
      `, [companyId]);

      if (unlinkedPages.length > 0) {
        console.log('1. 🔗 ربط الصفحات الموجودة بالشركة:'.yellow);
        unlinkedPages.forEach((page, index) => {
          console.log(`   ${index + 1}. ربط صفحة "${page.page_name}" (${page.page_id})`.white);
          console.log(`      UPDATE facebook_settings SET company_id = '${companyId}' WHERE page_id = '${page.page_id}';`.gray);
        });
      }

      console.log('\n2. 📄 إضافة صفحة جديدة:'.yellow);
      console.log('   - اذهب إلى Facebook Developer Console'.white);
      console.log('   - أضف صفحة جديدة للتطبيق'.white);
      console.log('   - احصل على Page Access Token'.white);
      console.log('   - أضف الصفحة لقاعدة البيانات'.white);

      console.log('\n3. 🔑 التحقق من صلاحيات Facebook:'.yellow);
      console.log('   - تأكد من أن التطبيق له صلاحية الوصول للصفحة'.white);
      console.log('   - تأكد من أن المستخدم admin أو editor للصفحة'.white);
      console.log('   - تحقق من صحة الـ Access Tokens'.white);

    } catch (error) {
      console.error('❌ خطأ في اقتراح الحلول:'.red, error.message);
    }
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
  const checker = new FacebookPagesLinkingChecker();
  
  try {
    const connected = await checker.connect();
    if (!connected) {
      process.exit(1);
    }

    console.log('🔍 بدء فحص ربط صفحات Facebook...'.cyan.bold);
    
    // فحص ربط الصفحات
    await checker.checkCompanyPages();
    
    // اقتراح الحلول
    await checker.suggestSolutions();

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

module.exports = FacebookPagesLinkingChecker;
