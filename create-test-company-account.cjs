/**
 * 🏢 إنشاء حساب الشركة التجريبية test@company.com
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306,
  charset: 'utf8mb4',
  connectTimeout: 10000
};

async function createTestCompanyAccount() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(dbConfig);
    
    // بيانات الشركة التجريبية
    const companyData = {
      id: 'company-2',
      name: 'شركة تجريبية',
      email: 'test@company.com',
      password: '123456',
      phone: '+201111111111',
      website: 'https://test-company.com',
      address: 'شارع التحرير، وسط البلد',
      city: 'القاهرة',
      country: 'Egypt'
    };
    
    console.log('🔍 التحقق من وجود الحساب...');
    const [existing] = await connection.execute(
      'SELECT id, name, email FROM companies WHERE email = ?',
      [companyData.email]
    );
    
    if (existing.length > 0) {
      console.log('✅ الشركة موجودة بالفعل:');
      console.log('🆔 المعرف:', existing[0].id);
      console.log('👤 الاسم:', existing[0].name);
      console.log('📧 الإيميل:', existing[0].email);
      console.log('🔑 كلمة المرور: 123456');
      
      // تحديث كلمة المرور للتأكد
      const passwordHash = await bcrypt.hash(companyData.password, 12);
      await connection.execute(
        'UPDATE companies SET password_hash = ? WHERE email = ?',
        [passwordHash, companyData.email]
      );
      console.log('🔄 تم تحديث كلمة المرور');
      return;
    }
    
    console.log('🏢 إنشاء حساب الشركة التجريبية...');
    
    // تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(companyData.password, 12);
    
    // إدراج الحساب
    await connection.execute(`
      INSERT INTO companies (
        id, name, email, password_hash, phone, website, address, city, country,
        status, subscription_status, is_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      companyData.id,
      companyData.name,
      companyData.email,
      passwordHash,
      companyData.phone,
      companyData.website,
      companyData.address,
      companyData.city,
      companyData.country,
      'active',
      'trial',
      true
    ]);
    
    console.log('✅ تم إنشاء حساب الشركة التجريبية بنجاح!');
    console.log('');
    console.log('📋 بيانات الدخول:');
    console.log('🆔 المعرف:', companyData.id);
    console.log('👤 الاسم:', companyData.name);
    console.log('📧 الإيميل:', companyData.email);
    console.log('🔑 كلمة المرور:', companyData.password);
    console.log('📱 الهاتف:', companyData.phone);
    console.log('🌐 الموقع:', companyData.website);
    console.log('📍 العنوان:', companyData.address);
    console.log('🏙️ المدينة:', companyData.city);
    console.log('');
    console.log('🌐 رابط تسجيل الدخول:');
    console.log('http://localhost:8080/company-login');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('💡 يبدو أن جدول companies غير موجود. تحقق من إعداد قاعدة البيانات.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 تحقق من بيانات الاتصال بقاعدة البيانات.');
    } else if (error.code === 'ER_DUP_ENTRY') {
      console.log('💡 الشركة موجودة بالفعل. استخدم البيانات المعروضة أعلاه.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// تشغيل الدالة
createTestCompanyAccount();
