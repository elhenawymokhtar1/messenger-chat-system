/**
 * فحص مفصل لجميع صفحات الشركة التجريبية
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

class DetailedCompanyPagesChecker {
  constructor() {
    this.connection = null;
    this.companyId = 'company-2';
    this.companyEmail = 'test@company.com';
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

  async checkCompanyData() {
    try {
      console.log('\n🏢 فحص بيانات الشركة التجريبية...'.yellow.bold);
      console.log('='.repeat(60).cyan);

      // البحث بالمعرف
      const [companyById] = await this.connection.execute(`
        SELECT * FROM companies WHERE id = ?
      `, [this.companyId]);

      // البحث بالإيميل
      const [companyByEmail] = await this.connection.execute(`
        SELECT * FROM companies WHERE email = ?
      `, [this.companyEmail]);

      console.log(`🔍 البحث بالمعرف (${this.companyId}): ${companyById.length} نتيجة`.cyan);
      console.log(`🔍 البحث بالإيميل (${this.companyEmail}): ${companyByEmail.length} نتيجة`.cyan);

      if (companyById.length > 0) {
        const company = companyById[0];
        console.log('\n📊 بيانات الشركة:'.green);
        console.log(`   🆔 المعرف: ${company.id}`.white);
        console.log(`   📝 الاسم: ${company.name}`.white);
        console.log(`   📧 الإيميل: ${company.email}`.white);
        console.log(`   📱 الهاتف: ${company.phone || 'غير محدد'}`.white);
        console.log(`   📊 الحالة: ${company.status}`.white);
        console.log(`   📅 تاريخ الإنشاء: ${company.created_at}`.gray);
        return company;
      } else {
        console.log('❌ لم يتم العثور على الشركة'.red);
        return null;
      }

    } catch (error) {
      console.error('❌ خطأ في فحص بيانات الشركة:'.red, error.message);
      return null;
    }
  }

  async checkAllFacebookTables() {
    try {
      console.log('\n📋 فحص جميع جداول Facebook...'.yellow.bold);
      console.log('='.repeat(60).cyan);

      // فحص جدول facebook_settings
      await this.checkFacebookSettingsTable();
      
      // فحص جدول facebook_pages (إذا كان موجوداً)
      await this.checkFacebookPagesTable();
      
      // فحص أي جداول أخرى قد تحتوي على صفحات Facebook
      await this.checkOtherFacebookTables();

    } catch (error) {
      console.error('❌ خطأ في فحص جداول Facebook:'.red, error.message);
    }
  }

  async checkFacebookSettingsTable() {
    try {
      console.log('\n📄 جدول facebook_settings:'.yellow);
      
      // جلب جميع الصفحات للشركة
      const [pages] = await this.connection.execute(`
        SELECT * FROM facebook_settings 
        WHERE company_id = ?
        ORDER BY created_at DESC
      `, [this.companyId]);

      console.log(`📊 عدد الصفحات: ${pages.length}`.cyan);

      if (pages.length > 0) {
        pages.forEach((page, index) => {
          console.log(`\n   📄 صفحة ${index + 1}:`.white.bold);
          console.log(`      🆔 معرف الصفحة: ${page.page_id}`.gray);
          console.log(`      📝 اسم الصفحة: ${page.page_name || 'غير محدد'}`.white);
          console.log(`      🔗 اسم المستخدم: ${page.page_username || 'غير محدد'}`.white);
          console.log(`      🏢 معرف الشركة: ${page.company_id}`.gray);
          console.log(`      ✅ نشطة: ${page.is_active ? 'نعم' : 'لا'}`.white);
          console.log(`      🔔 Webhook مفعل: ${page.webhook_enabled ? 'نعم' : 'لا'}`.white);
          console.log(`      🌐 رابط Webhook: ${page.webhook_url || 'غير محدد'}`.gray);
          console.log(`      🔑 لديها Token: ${page.access_token ? 'نعم' : 'لا'}`.white);
          console.log(`      📅 تاريخ الإنشاء: ${page.created_at}`.gray);
          console.log(`      📅 آخر تحديث: ${page.updated_at}`.gray);
        });
      } else {
        console.log('   ❌ لا توجد صفحات في جدول facebook_settings'.red);
      }

      return pages;

    } catch (error) {
      console.error('❌ خطأ في فحص جدول facebook_settings:'.red, error.message);
      return [];
    }
  }

  async checkFacebookPagesTable() {
    try {
      console.log('\n📄 جدول facebook_pages:'.yellow);
      
      const [pages] = await this.connection.execute(`
        SELECT * FROM facebook_pages 
        WHERE company_id = ?
        ORDER BY created_at DESC
      `, [this.companyId]);

      console.log(`📊 عدد الصفحات: ${pages.length}`.cyan);

      if (pages.length > 0) {
        pages.forEach((page, index) => {
          console.log(`\n   📄 صفحة ${index + 1}:`.white.bold);
          console.log(`      🆔 معرف الصفحة: ${page.page_id || page.facebook_page_id}`.gray);
          console.log(`      📝 اسم الصفحة: ${page.page_name || page.name}`.white);
          console.log(`      🏢 معرف الشركة: ${page.company_id}`.gray);
          console.log(`      ✅ نشطة: ${page.is_active || page.status === 'active' ? 'نعم' : 'لا'}`.white);
          console.log(`      🔑 لديها Token: ${page.access_token ? 'نعم' : 'لا'}`.white);
          console.log(`      📅 تاريخ الإنشاء: ${page.created_at}`.gray);
        });
      } else {
        console.log('   ❌ لا توجد صفحات في جدول facebook_pages'.red);
      }

      return pages;

    } catch (error) {
      console.log('   ℹ️ جدول facebook_pages غير موجود أو فارغ'.yellow);
      return [];
    }
  }

  async checkOtherFacebookTables() {
    try {
      console.log('\n🔍 البحث عن جداول Facebook أخرى...'.yellow);
      
      // الحصول على قائمة جميع الجداول
      const [tables] = await this.connection.execute(`
        SHOW TABLES LIKE '%facebook%'
      `);

      console.log(`📋 جداول Facebook الموجودة: ${tables.length}`.cyan);
      
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   📄 ${tableName}`.white);
      });

      // فحص كل جدول للبحث عن صفحات مرتبطة بالشركة
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        if (tableName !== 'facebook_settings' && tableName !== 'facebook_pages') {
          await this.checkCustomFacebookTable(tableName);
        }
      }

    } catch (error) {
      console.error('❌ خطأ في البحث عن جداول Facebook أخرى:'.red, error.message);
    }
  }

  async checkCustomFacebookTable(tableName) {
    try {
      console.log(`\n📄 فحص جدول ${tableName}:`.yellow);
      
      // فحص بنية الجدول
      const [columns] = await this.connection.execute(`
        SHOW COLUMNS FROM ${tableName}
      `);

      const columnNames = columns.map(col => col.Field);
      console.log(`   📋 الأعمدة: ${columnNames.join(', ')}`.gray);

      // البحث عن أعمدة تحتوي على company_id
      if (columnNames.includes('company_id')) {
        const [rows] = await this.connection.execute(`
          SELECT * FROM ${tableName} WHERE company_id = ?
        `, [this.companyId]);

        console.log(`   📊 عدد الصفوف: ${rows.length}`.cyan);
        
        if (rows.length > 0) {
          rows.forEach((row, index) => {
            console.log(`   📄 صف ${index + 1}:`.white);
            Object.keys(row).forEach(key => {
              console.log(`      ${key}: ${row[key]}`.gray);
            });
          });
        }
      } else {
        console.log('   ℹ️ لا يحتوي على عمود company_id'.yellow);
      }

    } catch (error) {
      console.log(`   ❌ خطأ في فحص جدول ${tableName}: ${error.message}`.red);
    }
  }

  async checkAllCompanyReferences() {
    try {
      console.log('\n🔍 البحث عن جميع المراجع للشركة في قاعدة البيانات...'.yellow.bold);
      console.log('='.repeat(60).cyan);

      // البحث في جميع الجداول عن company_id
      const [tables] = await this.connection.execute(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND COLUMN_NAME = 'company_id'
      `, [dbConfig.database]);

      console.log(`📋 الجداول التي تحتوي على company_id: ${tables.length}`.cyan);

      for (const table of tables) {
        const tableName = table.TABLE_NAME;
        console.log(`\n📄 فحص جدول ${tableName}:`.yellow);
        
        try {
          const [rows] = await this.connection.execute(`
            SELECT COUNT(*) as count FROM ${tableName} WHERE company_id = ?
          `, [this.companyId]);

          const count = rows[0].count;
          console.log(`   📊 عدد الصفوف: ${count}`.cyan);

          if (count > 0) {
            // جلب أول 5 صفوف للعرض
            const [sampleRows] = await this.connection.execute(`
              SELECT * FROM ${tableName} WHERE company_id = ? LIMIT 5
            `, [this.companyId]);

            sampleRows.forEach((row, index) => {
              console.log(`   📄 صف ${index + 1}:`.white);
              Object.keys(row).slice(0, 5).forEach(key => { // عرض أول 5 أعمدة فقط
                console.log(`      ${key}: ${row[key]}`.gray);
              });
              if (Object.keys(row).length > 5) {
                console.log(`      ... و ${Object.keys(row).length - 5} أعمدة أخرى`.gray);
              }
            });
          }
        } catch (error) {
          console.log(`   ❌ خطأ في فحص ${tableName}: ${error.message}`.red);
        }
      }

    } catch (error) {
      console.error('❌ خطأ في البحث عن مراجع الشركة:'.red, error.message);
    }
  }

  async generateDetailedReport() {
    try {
      console.log('\n📊 تقرير مفصل شامل...'.green.bold);
      console.log('='.repeat(60).green);

      // إحصائيات عامة
      const [totalPages] = await this.connection.execute(`
        SELECT COUNT(*) as count FROM facebook_settings WHERE company_id = ?
      `, [this.companyId]);

      const [activePagesCount] = await this.connection.execute(`
        SELECT COUNT(*) as count FROM facebook_settings WHERE company_id = ? AND is_active = 1
      `, [this.companyId]);

      const [webhookEnabledCount] = await this.connection.execute(`
        SELECT COUNT(*) as count FROM facebook_settings WHERE company_id = ? AND webhook_enabled = 1
      `, [this.companyId]);

      console.log('📈 الإحصائيات:'.cyan);
      console.log(`   📄 إجمالي الصفحات: ${totalPages[0].count}`.white);
      console.log(`   ✅ الصفحات النشطة: ${activePagesCount[0].count}`.white);
      console.log(`   🔔 Webhooks مفعلة: ${webhookEnabledCount[0].count}`.white);

      // قائمة مفصلة بجميع الصفحات
      const [allPages] = await this.connection.execute(`
        SELECT page_id, page_name, page_username, is_active, webhook_enabled, 
               access_token IS NOT NULL as has_token, created_at
        FROM facebook_settings 
        WHERE company_id = ?
        ORDER BY created_at DESC
      `, [this.companyId]);

      console.log('\n📋 قائمة مفصلة بجميع الصفحات:'.cyan);
      if (allPages.length > 0) {
        allPages.forEach((page, index) => {
          console.log(`\n${index + 1}. 📄 ${page.page_name || 'صفحة غير مسماة'}`.white.bold);
          console.log(`   🆔 المعرف: ${page.page_id}`.gray);
          console.log(`   👤 اسم المستخدم: ${page.page_username || 'غير محدد'}`.white);
          console.log(`   ✅ نشطة: ${page.is_active ? 'نعم' : 'لا'}`.white);
          console.log(`   🔔 Webhook: ${page.webhook_enabled ? 'مفعل' : 'معطل'}`.white);
          console.log(`   🔑 Token: ${page.has_token ? 'موجود' : 'مفقود'}`.white);
          console.log(`   📅 تاريخ الإنشاء: ${page.created_at}`.gray);
        });
      } else {
        console.log('❌ لا توجد صفحات مرتبطة بهذه الشركة'.red);
      }

      return allPages;

    } catch (error) {
      console.error('❌ خطأ في إنشاء التقرير المفصل:'.red, error.message);
      return [];
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل الفحص المفصل
async function main() {
  const checker = new DetailedCompanyPagesChecker();
  
  try {
    const connected = await checker.connect();
    if (!connected) {
      process.exit(1);
    }

    console.log('🔍 بدء الفحص المفصل للشركة التجريبية...'.cyan.bold);
    
    // فحص بيانات الشركة
    const company = await checker.checkCompanyData();
    
    if (company) {
      // فحص جميع جداول Facebook
      await checker.checkAllFacebookTables();
      
      // البحث عن جميع مراجع الشركة
      await checker.checkAllCompanyReferences();
      
      // إنشاء تقرير مفصل
      await checker.generateDetailedReport();
    }

  } catch (error) {
    console.error('💥 خطأ عام:'.red, error);
  } finally {
    await checker.close();
  }
}

// تشغيل السكريپت
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DetailedCompanyPagesChecker;
