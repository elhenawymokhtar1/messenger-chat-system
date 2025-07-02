const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const config = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306,
  charset: 'utf8mb4'
};

async function resetPassword() {
  let connection;
  
  try {
    console.log('🔐 إعادة تعيين كلمة المرور...');
    
    connection = await mysql.createConnection(config);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    const email = 'dummy@example.com';
    const newPassword = '123456';
    
    // البحث عن الشركة
    const [companies] = await connection.execute(
      'SELECT id, name, email FROM companies WHERE email = ?',
      [email]
    );
    
    if (companies.length === 0) {
      console.log('❌ الشركة غير موجودة');
      return;
    }
    
    const company = companies[0];
    console.log('🏢 الشركة الموجودة:', company.name);
    console.log('📧 الإيميل:', company.email);
    
    // تشفير كلمة المرور الجديدة
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // تحديث كلمة المرور
    await connection.execute(
      'UPDATE companies SET password_hash = ? WHERE email = ?',
      [passwordHash, email]
    );
    
    console.log('✅ تم تحديث كلمة المرور بنجاح');
    console.log('🔑 كلمة المرور الجديدة:', newPassword);
    
    // اختبار تسجيل الدخول
    console.log('\n🧪 اختبار تسجيل الدخول...');
    
    const [testCompanies] = await connection.execute(
      'SELECT id, name, email, password_hash FROM companies WHERE email = ?',
      [email]
    );
    
    if (testCompanies.length > 0) {
      const testCompany = testCompanies[0];
      const isValid = await bcrypt.compare(newPassword, testCompany.password_hash);
      
      if (isValid) {
        console.log('✅ اختبار تسجيل الدخول نجح');
        console.log('\n📋 بيانات تسجيل الدخول:');
        console.log('- الإيميل:', email);
        console.log('- كلمة المرور:', newPassword);
      } else {
        console.log('❌ اختبار تسجيل الدخول فشل');
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الدالة
resetPassword().catch(console.error);
