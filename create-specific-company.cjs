// إنشاء الشركة المطلوبة للاختبار
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const config = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306
};

async function createSpecificCompany() {
  try {
    const conn = await mysql.createConnection(config);
    
    const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    
    // فحص وجود الشركة
    const [existing] = await conn.execute('SELECT * FROM companies WHERE id = ?', [companyId]);
    
    if (existing.length > 0) {
      console.log('✅ الشركة موجودة بالفعل:', existing[0].name);
    } else {
      console.log('🏢 إنشاء الشركة المطلوبة...');
      
      const passwordHash = await bcrypt.hash('123456', 12);
      
      await conn.execute(`
        INSERT INTO companies (id, name, email, password_hash, status, subscription_status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [companyId, 'شركة تجريبية', 'test@example.com', passwordHash, 'active', 'active']);
      
      console.log('✅ تم إنشاء الشركة بنجاح');
      console.log('🆔 معرف الشركة:', companyId);
      console.log('📧 الإيميل: test@example.com');
      console.log('🔑 كلمة المرور: 123456');
    }
    
    await conn.end();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

createSpecificCompany();
