const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const config = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'messenger_system',
  charset: 'utf8mb4'
};

async function createCompanyWithPhone() {
  let connection;
  
  try {
    console.log('🏢 إنشاء شركة جديدة برقم تلفون...');
    
    connection = await mysql.createConnection(config);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    const companyData = {
      name: 'شركة الحلول التقنية المتقدمة',
      email: 'tech-solutions@example.com',
      password: '123456',
      phone: '01012345678',
      city: 'القاهرة',
      country: 'Egypt'
    };
    
    const companyId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(companyData.password, 12);
    
    console.log('🆔 معرف الشركة الجديد:', companyId);
    console.log('📱 رقم التلفون:', companyData.phone);
    
    // تعطيل الـ triggers والفحوصات
    await connection.execute('SET @DISABLE_TRIGGERS = 1');
    await connection.execute('SET foreign_key_checks = 0');
    await connection.execute('SET sql_mode = ""');
    
    // إدراج الشركة مباشرة
    const insertQuery = `
      INSERT INTO companies (
        id, name, email, phone, city, country,
        password_hash, status, subscription_status, 
        is_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const insertData = [
      companyId,
      companyData.name,
      companyData.email,
      companyData.phone,
      companyData.city,
      companyData.country,
      passwordHash,
      'active',
      'trial',
      true
    ];
    
    await connection.execute(insertQuery, insertData);
    
    // إعادة تفعيل الإعدادات
    await connection.execute('SET foreign_key_checks = 1');
    await connection.execute('SET @DISABLE_TRIGGERS = 0');
    
    console.log('✅ تم إنشاء الشركة بنجاح!');
    
    // التحقق من الشركة المُنشأة
    const [companies] = await connection.execute(
      'SELECT id, name, email, phone, city, country, status, subscription_status, created_at FROM companies WHERE id = ?',
      [companyId]
    );
    
    if (companies.length > 0) {
      const company = companies[0];
      console.log('\n📋 بيانات الشركة المُنشأة:');
      console.log('- الاسم:', company.name);
      console.log('- الإيميل:', company.email);
      console.log('- رقم التلفون:', company.phone);
      console.log('- المدينة:', company.city);
      console.log('- الدولة:', company.country);
      console.log('- الحالة:', company.status);
      console.log('- نوع الاشتراك:', company.subscription_status);
      console.log('- تاريخ الإنشاء:', company.created_at);
      
      console.log('\n🔐 بيانات تسجيل الدخول:');
      console.log('- الإيميل:', company.email);
      console.log('- كلمة المرور:', companyData.password);
      
      console.log('\n🎉 يمكنك الآن تسجيل الدخول باستخدام هذه البيانات!');
    }
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الشركة:', error.message);
    console.error('تفاصيل الخطأ:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الدالة
createCompanyWithPhone().catch(console.error);
