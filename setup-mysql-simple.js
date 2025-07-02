// 🗄️ إعداد قاعدة بيانات MySQL - نسخة مبسطة
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
  connectTimeout: 10000
};

console.log('🚀 بدء إعداد قاعدة بيانات MySQL...'.cyan.bold);
console.log('📍 الخادم:', DB_CONFIG.host.yellow);
console.log('🗄️ قاعدة البيانات:', DB_CONFIG.database.yellow);
console.log('');

async function setupDatabase() {
  let connection = null;
  
  try {
    console.log('⏳ الاتصال بقاعدة البيانات...'.yellow);
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بنجاح!'.green);
    
    // قراءة ملف المخطط المبسط
    console.log('\n📄 قراءة ملف المخطط...'.cyan);
    const schemaSQL = await fs.readFile('database/mysql-schema-simple.sql', 'utf8');
    console.log('✅ تم قراءة ملف المخطط بنجاح'.green);
    
    // تنظيف قاعدة البيانات
    console.log('\n🧹 تنظيف قاعدة البيانات...'.cyan);
    const [existingTables] = await connection.execute('SHOW TABLES');
    
    if (existingTables.length > 0) {
      console.log(`📋 وجدت ${existingTables.length} جدول موجود`.yellow);
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      for (const table of existingTables) {
        const tableName = Object.values(table)[0];
        await connection.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
        console.log(`  🗑️ تم حذف الجدول: ${tableName}`.gray);
      }
      
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ تم تنظيف قاعدة البيانات'.green);
    } else {
      console.log('📭 قاعدة البيانات فارغة - جاهزة للإعداد'.green);
    }
    
    // تقسيم الاستعلامات بطريقة أفضل
    console.log('\n⚙️ تطبيق المخطط الجديد...'.cyan);
    
    // إزالة التعليقات والأسطر الفارغة
    const cleanSQL = schemaSQL
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*');
      })
      .join('\n');
    
    // تقسيم حسب CREATE TABLE
    const tableStatements = cleanSQL.split(/(?=CREATE TABLE)/i).filter(stmt => stmt.trim());
    
    console.log(`📊 عدد الجداول للإنشاء: ${tableStatements.length}`.blue);
    
    let successCount = 0;
    let errorCount = 0;
    
    // إنشاء كل جدول على حدة
    for (let i = 0; i < tableStatements.length; i++) {
      const statement = tableStatements[i].trim();
      
      if (!statement) continue;
      
      try {
        await connection.execute(statement);
        successCount++;
        
        // استخراج اسم الجدول
        const tableMatch = statement.match(/CREATE TABLE (\w+)/i);
        const tableName = tableMatch ? tableMatch[1] : `جدول ${i + 1}`;
        console.log(`  ✅ تم إنشاء الجدول: ${tableName}`.green);
        
      } catch (error) {
        errorCount++;
        console.log(`  ❌ خطأ في إنشاء الجدول ${i + 1}:`, error.message.red);
        
        // عرض جزء من الاستعلام
        const preview = statement.substring(0, 100) + '...';
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
    
    // إدراج البيانات التجريبية
    if (newTables.length > 0) {
      console.log('\n📝 إدراج البيانات التجريبية...'.cyan);
      
      try {
        // إنشاء شركة تجريبية
        await connection.execute(`
          INSERT INTO companies (
            id, name, email, password_hash, 
            phone, city, country, status, 
            subscription_status, is_verified
          ) VALUES (
            'c677b32f-fe1c-4c64-8362-a1c03406608d',
            'شركة تجريبية',
            'test@example.com',
            '$2b$10$example.hash.here',
            '+201234567890',
            'القاهرة',
            'مصر',
            'active',
            'trial',
            TRUE
          )
        `);
        console.log('  ✅ تم إنشاء الشركة التجريبية'.green);
        
        // إنشاء مستخدم أساسي
        await connection.execute(`
          INSERT INTO company_users (
            id, company_id, name, email, 
            password_hash, role, is_active
          ) VALUES (
            UUID(),
            'c677b32f-fe1c-4c64-8362-a1c03406608d',
            'المدير العام',
            'admin@example.com',
            '$2b$10$example.hash.here',
            'admin',
            TRUE
          )
        `);
        console.log('  ✅ تم إنشاء المستخدم الأساسي'.green);
        
        // إعدادات الذكي الاصطناعي
        await connection.execute(`
          INSERT INTO gemini_settings (
            id, company_id, model, is_enabled, 
            auto_reply, response_delay, temperature, 
            max_tokens, system_prompt
          ) VALUES (
            UUID(),
            'c677b32f-fe1c-4c64-8362-a1c03406608d',
            'gemini-1.5-flash',
            FALSE,
            TRUE,
            2,
            0.7,
            1000,
            'أنت مساعد ذكي لخدمة العملاء. كن مفيداً ومهذباً واستجب باللغة العربية.'
          )
        `);
        console.log('  ✅ تم إنشاء إعدادات الذكي الاصطناعي'.green);
        
      } catch (insertError) {
        console.log('⚠️ خطأ في إدراج البيانات التجريبية:', insertError.message.yellow);
      }
    }
    
    // اختبار نهائي
    console.log('\n🧪 اختبار نهائي...'.cyan);
    try {
      const [companies] = await connection.execute('SELECT COUNT(*) as count FROM companies');
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM company_users');
      const [settings] = await connection.execute('SELECT COUNT(*) as count FROM gemini_settings');
      
      console.log(`  🏢 الشركات: ${companies[0].count}`.green);
      console.log(`  👥 المستخدمين: ${users[0].count}`.green);
      console.log(`  🤖 إعدادات الذكي الاصطناعي: ${settings[0].count}`.green);
      
    } catch (testError) {
      console.log('⚠️ خطأ في الاختبار النهائي:', testError.message.yellow);
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
setupDatabase()
  .then(result => {
    if (result.success) {
      console.log('\n🎯 النتيجة النهائية: تم إعداد قاعدة البيانات بنجاح! ✅'.green.bold);
      console.log(`📊 الإحصائيات:`.cyan);
      console.log(`  - الجداول المنشأة: ${result.tablesCreated}`.green);
      console.log(`  - الاستعلامات الناجحة: ${result.successfulStatements}`.green);
      if (result.failedStatements > 0) {
        console.log(`  - الاستعلامات الفاشلة: ${result.failedStatements}`.yellow);
      }
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
