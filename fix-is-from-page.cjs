const mysql = require('mysql2/promise');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function fixIsFromPageValues() {
  let connection;
  
  try {
    console.log('🔧 [DEBUG] بدء تصحيح قيم is_from_page...');
    
    // إنشاء اتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ [DEBUG] تم الاتصال بقاعدة البيانات');
    
    // تحديث الرسائل من الإدارة
    console.log('📊 [DEBUG] تحديث رسائل الإدارة...');
    const [adminResult] = await connection.execute(
      `UPDATE messages SET is_from_page = 1 WHERE sender_id = 'admin'`
    );
    console.log(`📊 [DEBUG] رسائل الإدارة المُحدثة: ${adminResult.affectedRows}`);
    
    // تحديث الرسائل من الصفحات (page_id)
    console.log('📊 [DEBUG] تحديث رسائل الصفحات...');
    const [pageResult] = await connection.execute(
      `UPDATE messages SET is_from_page = 1 WHERE sender_id IN (
        SELECT page_id FROM facebook_settings WHERE page_id IS NOT NULL
      )`
    );
    console.log(`📊 [DEBUG] رسائل الصفحات المُحدثة: ${pageResult.affectedRows}`);
    
    // عرض إحصائيات
    const [stats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_messages,
        SUM(CASE WHEN is_from_page = 1 THEN 1 ELSE 0 END) as from_page_messages,
        SUM(CASE WHEN is_from_page = 0 THEN 1 ELSE 0 END) as from_customer_messages
       FROM messages`
    );
    
    console.log('📊 [DEBUG] إحصائيات الرسائل بعد التصحيح:');
    console.log(`   📨 إجمالي الرسائل: ${stats[0].total_messages}`);
    console.log(`   📤 رسائل من الصفحة: ${stats[0].from_page_messages}`);
    console.log(`   📥 رسائل من العملاء: ${stats[0].from_customer_messages}`);
    
    console.log('✅ [DEBUG] تم تصحيح قيم is_from_page بنجاح');
    
    return {
      success: true,
      adminUpdated: adminResult.affectedRows,
      pageUpdated: pageResult.affectedRows,
      stats: stats[0]
    };
    
  } catch (error) {
    console.error('❌ [DEBUG] خطأ في تصحيح is_from_page:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 [DEBUG] تم إغلاق اتصال قاعدة البيانات');
    }
  }
}

// تشغيل الدالة
fixIsFromPageValues()
  .then(result => {
    console.log('🎉 [DEBUG] النتيجة النهائية:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 [DEBUG] خطأ عام:', error);
    process.exit(1);
  });
