// إنشاء شركة مباشرة في قاعدة البيانات
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const config = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306
};

async function createCompanyDirect() {
  try {
    const conn = await mysql.createConnection(config);
    
    console.log('🏢 إنشاء شركة جديدة مباشرة...');
    
    const companyData = {
      name: 'شركة الاختبار الجديدة',
      email: 'test@newcompany.com',
      password: '123456'
    };
    
    const companyId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(companyData.password, 12);
    
    console.log('🆔 معرف الشركة الجديد:', companyId);
    
    // تعطيل الـ triggers مؤقتاً
    await conn.execute('SET @DISABLE_TRIGGERS = 1');
    
    // إدراج الشركة مباشرة
    await conn.execute(`
      INSERT INTO companies (
        id, name, email, password_hash, status, subscription_status, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      companyId,
      companyData.name,
      companyData.email,
      passwordHash,
      'active',
      'trial'
    ]);
    
    console.log('✅ تم إنشاء الشركة بنجاح');
    
    // فحص النتيجة
    const [companies] = await conn.execute(
      'SELECT id, name, email, status, subscription_status, created_at FROM companies WHERE id = ?',
      [companyId]
    );
    
    if (companies.length > 0) {
      console.log('📊 بيانات الشركة الجديدة:');
      console.log('  🆔 المعرف:', companies[0].id);
      console.log('  🏢 الاسم:', companies[0].name);
      console.log('  📧 الإيميل:', companies[0].email);
      console.log('  📊 الحالة:', companies[0].status);
      console.log('  💳 الاشتراك:', companies[0].subscription_status);
      console.log('  📅 تاريخ الإنشاء:', companies[0].created_at);
    }
    
    // فحص جميع الشركات
    const [allCompanies] = await conn.execute('SELECT COUNT(*) as count FROM companies');
    console.log('📊 إجمالي عدد الشركات:', allCompanies[0].count);
    
    await conn.end();
    
    console.log('🎉 تم إنشاء الشركة بنجاح!');
    console.log('🔗 يمكنك الآن استخدام معرف الشركة:', companyId);
    console.log('🔗 في APIs المنتجات: http://localhost:3002/api/companies/' + companyId + '/products');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الشركة:', error.message);
    console.error('📍 تفاصيل الخطأ:', error);
  }
}

createCompanyDirect();
