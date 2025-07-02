// إنشاء شركة اختبار للمنتجات
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

async function createTestCompany() {
  try {
    const conn = await mysql.createConnection(config);
    
    // فحص وجود شركات
    const [existing] = await conn.execute('SELECT COUNT(*) as count FROM companies');
    console.log('📊 عدد الشركات الموجودة:', existing[0].count);
    
    if (existing[0].count === 0) {
      console.log('🏢 إنشاء شركة اختبار...');
      
      const passwordHash = await bcrypt.hash('123456', 12);
      const companyId = crypto.randomUUID();
      
      // إدراج مباشر
      await conn.execute(`
        INSERT INTO companies (id, name, email, password_hash, status, subscription_status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [companyId, 'شركة الاختبار', 'test@company.local', passwordHash, 'active', 'active']);
      
      console.log('✅ تم إنشاء الشركة بنجاح');
      console.log('🆔 معرف الشركة:', companyId);
      console.log('📧 الإيميل: test@company.local');
      console.log('🔑 كلمة المرور: 123456');
    } else {
      // عرض الشركات الموجودة
      const [companies] = await conn.execute('SELECT id, name, email FROM companies LIMIT 1');
      if (companies.length > 0) {
        console.log('✅ شركة موجودة بالفعل:');
        console.log('🆔 معرف الشركة:', companies[0].id);
        console.log('📧 الإيميل:', companies[0].email);
        console.log('🏢 الاسم:', companies[0].name);
      }
    }
    
    await conn.end();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

createTestCompany();
