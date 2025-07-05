/**
 * 👑 إنشاء حساب إدارة للنظام
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

async function createAdminAccount() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(dbConfig);
    
    // بيانات حساب الإدارة
    const adminData = {
      id: crypto.randomUUID(),
      name: 'مدير النظام الرئيسي',
      email: 'admin@system.com',
      password: 'admin123456',
      phone: '+201000000000',
      city: 'القاهرة',
      country: 'Egypt'
    };
    
    console.log('🔍 التحقق من وجود الحساب...');
    const [existing] = await connection.execute(
      'SELECT id, name, email FROM companies WHERE email = ?',
      [adminData.email]
    );
    
    if (existing.length > 0) {
      console.log('✅ حساب الإدارة موجود بالفعل:');
      console.log('🆔 المعرف:', existing[0].id);
      console.log('👤 الاسم:', existing[0].name);
      console.log('📧 الإيميل:', existing[0].email);
      console.log('🔑 كلمة المرور: admin123456');
      return;
    }
    
    console.log('🏢 إنشاء حساب الإدارة...');
    
    // تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(adminData.password, 12);
    
    // إدراج الحساب
    await connection.execute(`
      INSERT INTO companies (
        id, name, email, password_hash, phone, city, country,
        status, subscription_status, is_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      adminData.id,
      adminData.name,
      adminData.email,
      passwordHash,
      adminData.phone,
      adminData.city,
      adminData.country,
      'active',
      'premium',
      true
    ]);
    
    console.log('✅ تم إنشاء حساب الإدارة بنجاح!');
    console.log('');
    console.log('📋 بيانات الدخول:');
    console.log('🆔 المعرف:', adminData.id);
    console.log('👤 الاسم:', adminData.name);
    console.log('📧 الإيميل:', adminData.email);
    console.log('🔑 كلمة المرور:', adminData.password);
    console.log('📱 الهاتف:', adminData.phone);
    console.log('🏙️ المدينة:', adminData.city);
    console.log('');
    console.log('🌐 رابط تسجيل الدخول:');
    console.log('http://localhost:8080/company-login');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('💡 يبدو أن جدول companies غير موجود. تحقق من إعداد قاعدة البيانات.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 تحقق من بيانات الاتصال بقاعدة البيانات.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// تشغيل الدالة
createAdminAccount();
