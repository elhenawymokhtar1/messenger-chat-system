const mysql = require('mysql2/promise');

const config = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306,
  charset: 'utf8mb4'
};

async function findAndRemoveTrigger() {
  let connection;

  try {
    console.log('🔍 البحث عن triggers في قاعدة البيانات...');

    connection = await mysql.createConnection(config);
    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. البحث عن جميع triggers
    console.log('\n1️⃣ البحث عن جميع triggers...');
    const [triggers] = await connection.execute(`
      SELECT 
        TRIGGER_NAME,
        EVENT_MANIPULATION,
        EVENT_OBJECT_TABLE,
        ACTION_TIMING,
        ACTION_STATEMENT
      FROM information_schema.TRIGGERS 
      WHERE TRIGGER_SCHEMA = 'u384034873_conversations'
      ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME
    `);

    if (triggers.length === 0) {
      console.log('❌ لم يتم العثور على أي triggers');
    } else {
      console.log(`✅ تم العثور على ${triggers.length} trigger(s):`);

      triggers.forEach((trigger, index) => {
        console.log(`\n${index + 1}. ${trigger.TRIGGER_NAME}`);
        console.log(`   - الجدول: ${trigger.EVENT_OBJECT_TABLE}`);
        console.log(`   - الحدث: ${trigger.ACTION_TIMING} ${trigger.EVENT_MANIPULATION}`);
        console.log(`   - الكود: ${trigger.ACTION_STATEMENT.substring(0, 200)}...`);
      });
    }

    // 2. البحث عن triggers خاصة بجدول companies
    console.log('\n2️⃣ البحث عن triggers خاصة بجدول companies...');
    const [companyTriggers] = await connection.execute(`
      SELECT 
        TRIGGER_NAME,
        EVENT_MANIPULATION,
        ACTION_TIMING,
        ACTION_STATEMENT
      FROM information_schema.TRIGGERS 
      WHERE TRIGGER_SCHEMA = 'u384034873_conversations'
      AND EVENT_OBJECT_TABLE = 'companies'
    `);

    if (companyTriggers.length === 0) {
      console.log('❌ لم يتم العثور على triggers لجدول companies');
    } else {
      console.log(`✅ تم العثور على ${companyTriggers.length} trigger(s) لجدول companies:`);

      for (const trigger of companyTriggers) {
        console.log(`\n🔧 Trigger: ${trigger.TRIGGER_NAME}`);
        console.log(`   - الحدث: ${trigger.ACTION_TIMING} ${trigger.EVENT_MANIPULATION}`);
        console.log(`   - الكود الكامل:`);
        console.log(`   ${trigger.ACTION_STATEMENT}`);

        // فحص إذا كان يحتوي على كلمات مشبوهة
        const suspiciousWords = ['اختبار', 'تجريبي', 'مشبوه', 'suspicious', 'test', 'demo'];
        const hasSuspiciousCheck = suspiciousWords.some(word =>
          trigger.ACTION_STATEMENT.toLowerCase().includes(word.toLowerCase())
        );

        if (hasSuspiciousCheck) {
          console.log(`   ⚠️ هذا الـ trigger يحتوي على فحص للكلمات المشبوهة!`);

          // حذف الـ trigger
          console.log(`   🗑️ حذف الـ trigger: ${trigger.TRIGGER_NAME}...`);
          try {
            await connection.execute(`DROP TRIGGER IF EXISTS ${trigger.TRIGGER_NAME}`);
            console.log(`   ✅ تم حذف الـ trigger بنجاح`);
          } catch (error) {
            console.log(`   ❌ فشل في حذف الـ trigger: ${error.message}`);
          }
        }
      }
    }

    // 3. البحث عن stored procedures أو functions
    console.log('\n3️⃣ البحث عن stored procedures...');
    const [procedures] = await connection.execute(`
      SELECT 
        ROUTINE_NAME,
        ROUTINE_TYPE,
        ROUTINE_DEFINITION
      FROM information_schema.ROUTINES 
      WHERE ROUTINE_SCHEMA = 'u384034873_conversations'
      AND ROUTINE_DEFINITION LIKE '%اختبار%' 
      OR ROUTINE_DEFINITION LIKE '%تجريبي%'
      OR ROUTINE_DEFINITION LIKE '%مشبوه%'
      OR ROUTINE_DEFINITION LIKE '%suspicious%'
      OR ROUTINE_DEFINITION LIKE '%SIGNAL%'
    `);

    if (procedures.length > 0) {
      console.log(`✅ تم العثور على ${procedures.length} procedure(s) مشبوهة:`);

      for (const proc of procedures) {
        console.log(`\n🔧 ${proc.ROUTINE_TYPE}: ${proc.ROUTINE_NAME}`);
        console.log(`   - الكود: ${proc.ROUTINE_DEFINITION.substring(0, 300)}...`);

        // حذف الـ procedure
        console.log(`   🗑️ حذف الـ ${proc.ROUTINE_TYPE}: ${proc.ROUTINE_NAME}...`);
        try {
          await connection.execute(`DROP ${proc.ROUTINE_TYPE} IF EXISTS ${proc.ROUTINE_NAME}`);
          console.log(`   ✅ تم حذف الـ ${proc.ROUTINE_TYPE} بنجاح`);
        } catch (error) {
          console.log(`   ❌ فشل في حذف الـ ${proc.ROUTINE_TYPE}: ${error.message}`);
        }
      }
    } else {
      console.log('❌ لم يتم العثور على stored procedures مشبوهة');
    }

    // 4. اختبار إنشاء شركة جديدة
    console.log('\n4️⃣ اختبار إنشاء شركة جديدة...');

    const testCompany = {
      id: require('crypto').randomUUID(),
      name: 'شركة اختبار الـ trigger',
      email: 'trigger-test@example.com',
      password_hash: '$2b$12$test.hash.here',
      phone: '01012345678',
      city: 'القاهرة',
      country: 'Egypt'
    };

    try {
      await connection.execute(`
        INSERT INTO companies (
          id, name, email, password_hash, phone, city, country,
          status, subscription_status, is_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'trial', TRUE, NOW(), NOW())
      `, [
        testCompany.id,
        testCompany.name,
        testCompany.email,
        testCompany.password_hash,
        testCompany.phone,
        testCompany.city,
        testCompany.country
      ]);

      console.log('✅ تم إنشاء شركة الاختبار بنجاح!');
      console.log(`   - الاسم: ${testCompany.name}`);
      console.log(`   - الإيميل: ${testCompany.email}`);
      console.log(`   - رقم التلفون: ${testCompany.phone}`);

      // حذف شركة الاختبار
      await connection.execute('DELETE FROM companies WHERE id = ?', [testCompany.id]);
      console.log('🗑️ تم حذف شركة الاختبار');

    } catch (error) {
      console.log('❌ فشل في إنشاء شركة الاختبار:', error.message);
      console.log('تفاصيل الخطأ:', error);
    }

    console.log('\n🎉 تم الانتهاء من فحص وإصلاح triggers!');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    console.error('تفاصيل الخطأ:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الدالة
findAndRemoveTrigger().catch(console.error);
