// 🗄️ إعداد قاعدة بيانات MySQL الجديدة
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import colors from 'colors';

// بيانات الاتصال
const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectTimeout: 10000,
  multipleStatements: true // للسماح بتنفيذ عدة استعلامات
};

console.log('🚀 بدء إعداد قاعدة بيانات MySQL الجديدة...'.cyan.bold);
console.log('📍 الخادم:', DB_CONFIG.host.yellow);
console.log('🗄️ قاعدة البيانات:', DB_CONFIG.database.yellow);
console.log('');

async function setupMySQLDatabase() {
  let connection = null;
  
  try {
    console.log('⏳ الاتصال بقاعدة البيانات...'.yellow);
    
    // إنشاء الاتصال
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بنجاح!'.green);
    
    // قراءة ملف المخطط
    console.log('\n📄 قراءة ملف المخطط...'.cyan);
    const schemaSQL = await fs.readFile('database/mysql-schema.sql', 'utf8');
    console.log('✅ تم قراءة ملف المخطط بنجاح'.green);
    
    // تنظيف قاعدة البيانات (حذف الجداول الموجودة)
    console.log('\n🧹 تنظيف قاعدة البيانات...'.cyan);
    
    // الحصول على قائمة الجداول الموجودة
    const [existingTables] = await connection.execute('SHOW TABLES');
    
    if (existingTables.length > 0) {
      console.log(`📋 وجدت ${existingTables.length} جدول موجود`.yellow);
      
      // تعطيل فحص المفاتيح الخارجية مؤقتاً
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      // حذف كل جدول
      for (const table of existingTables) {
        const tableName = Object.values(table)[0];
        await connection.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
        console.log(`  🗑️ تم حذف الجدول: ${tableName}`.gray);
      }
      
      // إعادة تفعيل فحص المفاتيح الخارجية
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('✅ تم تنظيف قاعدة البيانات'.green);
    } else {
      console.log('📭 قاعدة البيانات فارغة - جاهزة للإعداد'.green);
    }
    
    // تقسيم الاستعلامات
    console.log('\n⚙️ تطبيق المخطط الجديد...'.cyan);
    
    // تقسيم الملف إلى استعلامات منفصلة
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 عدد الاستعلامات: ${statements.length}`.blue);
    
    let successCount = 0;
    let errorCount = 0;
    
    // تنفيذ كل استعلام على حدة
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // تخطي التعليقات والاستعلامات الفارغة
        if (statement.startsWith('--') || statement.trim() === '') {
          continue;
        }
        
        await connection.execute(statement);
        successCount++;
        
        // عرض تقدم العملية
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i)?.[1];
          console.log(`  ✅ تم إنشاء الجدول: ${tableName}`.green);
        } else if (statement.includes('INSERT INTO')) {
          const tableName = statement.match(/INSERT INTO `?(\w+)`?/i)?.[1];
          console.log(`  📝 تم إدراج بيانات في: ${tableName}`.blue);
        } else if (statement.includes('CREATE PROCEDURE')) {
          const procName = statement.match(/CREATE PROCEDURE `?(\w+)`?/i)?.[1];
          console.log(`  🔧 تم إنشاء الإجراء: ${procName}`.magenta);
        }
        
      } catch (error) {
        errorCount++;
        console.log(`  ❌ خطأ في الاستعلام ${i + 1}:`, error.message.red);
        
        // عرض جزء من الاستعلام المسبب للخطأ
        const preview = statement.substring(0, 100) + (statement.length > 100 ? '...' : '');
        console.log(`     الاستعلام: ${preview}`.gray);
      }
    }
    
    console.log(`\n📊 النتائج:`.cyan);
    console.log(`  ✅ نجح: ${successCount}`.green);
    console.log(`  ❌ فشل: ${errorCount}`.red);
    
    // التحقق من الجداول المنشأة
    console.log('\n🔍 التحقق من الجداول المنشأة...'.cyan);
    const [newTables] = await connection.execute('SHOW TABLES');
    
    console.log(`📋 تم إنشاء ${newTables.length} جدول:`.green);
    newTables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`.green);
    });
    
    // اختبار البيانات التجريبية
    console.log('\n🧪 اختبار البيانات التجريبية...'.cyan);
    
    try {
      const [companies] = await connection.execute('SELECT COUNT(*) as count FROM companies');
      const [stores] = await connection.execute('SELECT COUNT(*) as count FROM stores');
      const [settings] = await connection.execute('SELECT COUNT(*) as count FROM gemini_settings');
      
      console.log(`  🏢 الشركات: ${companies[0].count}`.green);
      console.log(`  🏪 المتاجر: ${stores[0].count}`.green);
      console.log(`  🤖 إعدادات الذكي الاصطناعي: ${settings[0].count}`.green);
      
    } catch (testError) {
      console.log('⚠️ خطأ في اختبار البيانات:', testError.message.yellow);
    }
    
    console.log('\n🎉 تم إعداد قاعدة البيانات بنجاح!'.green.bold);
    
    return {
      success: true,
      tablesCreated: newTables.length,
      successfulStatements: successCount,
      failedStatements: errorCount
    };
    
  } catch (error) {
    console.log('\n💥 فشل في إعداد قاعدة البيانات:'.red.bold);
    console.log('📄 رسالة الخطأ:', error.message.red);
    
    return {
      success: false,
      error: error.message
    };
    
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('\n🔌 تم إغلاق الاتصال'.gray);
      } catch (closeError) {
        console.log('⚠️ خطأ في إغلاق الاتصال:', closeError.message.yellow);
      }
    }
  }
}

// تشغيل الإعداد
setupMySQLDatabase()
  .then(result => {
    if (result.success) {
      console.log('\n🎯 النتيجة النهائية: تم إعداد قاعدة البيانات بنجاح! ✅'.green.bold);
      console.log(`📊 الإحصائيات:`.cyan);
      console.log(`  - الجداول المنشأة: ${result.tablesCreated}`.green);
      console.log(`  - الاستعلامات الناجحة: ${result.successfulStatements}`.green);
      console.log(`  - الاستعلامات الفاشلة: ${result.failedStatements}`.yellow);
      process.exit(0);
    } else {
      console.log('\n💥 النتيجة النهائية: فشل في إعداد قاعدة البيانات! ❌'.red.bold);
      process.exit(1);
    }
  })
  .catch(error => {
    console.log('\n💥 خطأ غير متوقع:', error.message.red);
    process.exit(1);
  });
