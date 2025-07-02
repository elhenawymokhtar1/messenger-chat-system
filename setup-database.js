// 🗄️ إعداد قاعدة البيانات وإنشاء الجداول المطلوبة
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const config = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306
};

async function setupDatabase() {
  try {
    console.log('🔧 بدء إعداد قاعدة البيانات...');
    
    const conn = await mysql.createConnection(config);
    
    // إنشاء جدول الشركات
    console.log('🏢 إنشاء جدول الشركات...');
    
    const createCompaniesTable = `
    CREATE TABLE IF NOT EXISTS companies (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL COMMENT 'اسم الشركة',
        email VARCHAR(255) UNIQUE NOT NULL COMMENT 'إيميل الشركة',
        phone VARCHAR(50) COMMENT 'رقم الهاتف',
        website VARCHAR(255) COMMENT 'الموقع الإلكتروني',
        address TEXT COMMENT 'العنوان',
        city VARCHAR(100) COMMENT 'المدينة',
        country VARCHAR(100) DEFAULT 'Egypt' COMMENT 'الدولة',
        password_hash VARCHAR(255) NOT NULL COMMENT 'كلمة المرور مشفرة',
        is_verified BOOLEAN DEFAULT FALSE COMMENT 'تم التحقق من الإيميل',
        verification_token VARCHAR(255) COMMENT 'رمز التحقق',
        status VARCHAR(50) DEFAULT 'active' COMMENT 'active, suspended, cancelled',
        subscription_status VARCHAR(50) DEFAULT 'trial' COMMENT 'trial, active, expired, cancelled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP NULL,
        INDEX idx_companies_email (email),
        INDEX idx_companies_status (status),
        INDEX idx_companies_subscription (subscription_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول الشركات';
    `;
    
    await conn.execute(createCompaniesTable);
    console.log('✅ تم إنشاء جدول الشركات بنجاح');
    
    // فحص وجود شركات
    const [existingCompanies] = await conn.execute('SELECT COUNT(*) as count FROM companies');
    console.log('📊 عدد الشركات الموجودة:', existingCompanies[0].count);
    
    // إنشاء شركة تجريبية إذا لم توجد شركات
    if (existingCompanies[0].count === 0) {
      console.log('🏢 إنشاء شركة تجريبية...');
      
      const passwordHash = await bcrypt.hash('123456', 12);
      
      await conn.execute(`
        INSERT INTO companies (id, name, email, password_hash, status, subscription_status) 
        VALUES (UUID(), 'شركة تجريبية', 'test@example.com', ?, 'active', 'active')
      `, [passwordHash]);
      
      console.log('✅ تم إنشاء الشركة التجريبية');
      console.log('📧 الإيميل: test@example.com');
      console.log('🔑 كلمة المرور: 123456');
    }
    
    // فحص النتيجة النهائية
    const [finalCompanies] = await conn.execute('SELECT COUNT(*) as count FROM companies');
    console.log('📊 إجمالي الشركات:', finalCompanies[0].count);
    
    // عرض الشركات الموجودة
    const [companies] = await conn.execute('SELECT id, name, email, status FROM companies LIMIT 5');
    console.log('📋 الشركات الموجودة:');
    companies.forEach(company => {
      console.log(`  - ${company.name} (${company.email}) - ${company.status}`);
    });
    
    await conn.end();
    console.log('✅ تم إعداد قاعدة البيانات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إعداد قاعدة البيانات:', error.message);
    console.error('📍 التفاصيل:', error);
  }
}

// تشغيل الإعداد
setupDatabase();
