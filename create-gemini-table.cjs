const mysql = require('mysql2/promise');

// إعدادات قاعدة البيانات
const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function createGeminiTable() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بنجاح');

    // إنشاء جدول gemini_settings
    console.log('🔧 إنشاء جدول gemini_settings...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS gemini_settings (
          id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
          company_id CHAR(36) NOT NULL,
          
          -- 🔑 إعدادات API
          api_key TEXT COMMENT 'مفتاح API للذكي الاصطناعي',
          model VARCHAR(100) DEFAULT 'gemini-1.5-flash' COMMENT 'نموذج الذكي الاصطناعي',
          
          -- ⚙️ الإعدادات
          is_enabled BOOLEAN DEFAULT FALSE COMMENT 'مفعل أم لا',
          auto_reply BOOLEAN DEFAULT TRUE COMMENT 'الرد التلقائي',
          response_delay INT DEFAULT 2 COMMENT 'تأخير الرد بالثواني',
          
          -- 📝 الإعدادات المتقدمة
          system_prompt TEXT COMMENT 'التعليمات الأساسية للذكي الاصطناعي',
          temperature DECIMAL(3,2) DEFAULT 0.7 COMMENT 'درجة الإبداع',
          max_tokens INT DEFAULT 1000 COMMENT 'أقصى عدد كلمات',
          
          -- 📊 الإحصائيات
          total_requests INT DEFAULT 0 COMMENT 'إجمالي الطلبات',
          successful_requests INT DEFAULT 0 COMMENT 'الطلبات الناجحة',
          failed_requests INT DEFAULT 0 COMMENT 'الطلبات الفاشلة',
          
          -- 📅 التواريخ
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          -- العلاقات والفهارس
          UNIQUE KEY unique_company_gemini (company_id),
          INDEX idx_gemini_company (company_id),
          INDEX idx_gemini_enabled (is_enabled)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='إعدادات الذكي الاصطناعي';
    `;

    await connection.execute(createTableQuery);
    console.log('✅ تم إنشاء جدول gemini_settings بنجاح');

    // إضافة سجل افتراضي للشركة التجريبية
    console.log('📝 إضافة سجل افتراضي...');
    
    const insertQuery = `
      INSERT IGNORE INTO gemini_settings (
          id, company_id, model, is_enabled,
          auto_reply, response_delay, temperature,
          max_tokens, system_prompt
      ) VALUES (
          UUID(),
          '2d9b8887-0cca-430b-b61b-ca16cccfec63',
          'gemini-1.5-flash',
          FALSE,
          TRUE,
          2,
          0.7,
          1000,
          'أنت مساعد ذكي لخدمة العملاء. كن مفيداً ومهذباً واستجب باللغة العربية.'
      )
    `;

    await connection.execute(insertQuery);
    console.log('✅ تم إضافة السجل الافتراضي');

    // فحص النتيجة
    console.log('🔍 فحص النتيجة...');
    const [rows] = await connection.execute('SELECT * FROM gemini_settings');
    console.log(`📊 عدد السجلات: ${rows.length}`);
    
    if (rows.length > 0) {
      console.log('📋 السجل الأول:');
      console.log(`   - ID: ${rows[0].id}`);
      console.log(`   - Company ID: ${rows[0].company_id}`);
      console.log(`   - Model: ${rows[0].model}`);
      console.log(`   - Enabled: ${rows[0].is_enabled}`);
    }

    console.log('🎉 تم إنشاء الجدول والبيانات بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم إغلاق الاتصال');
    }
  }
}

// تشغيل الدالة
createGeminiTable()
  .then(() => {
    console.log('\n🏁 انتهت العملية بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 فشلت العملية:', error);
    process.exit(1);
  });
