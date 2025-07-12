import mysql from 'mysql2/promise';

async function updateCompanyId() {
  const pool = mysql.createPool({
    host: '193.203.168.103',
    user: 'u384034873_conversations',
    password: 'Mokhtar@123',
    database: 'u384034873_conversations',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🔄 تحديث معرف الشركة للصفحة 250528358137901...');
    
    // تحديث معرف الشركة
    const [result] = await pool.execute(
      'UPDATE facebook_settings SET company_id = ? WHERE page_id = ?',
      ['c677b32f-fe1c-4c64-8362-a1c03406608d', '250528358137901']
    );
    
    console.log('✅ تم تحديث', result.affectedRows, 'صفحة');
    
    // التحقق من النتيجة
    const [pages] = await pool.execute(
      'SELECT page_id, page_name, company_id FROM facebook_settings WHERE page_id = ?',
      ['250528358137901']
    );
    
    console.log('📄 الصفحات المحدثة:');
    pages.forEach(page => {
      console.log(`   - ${page.page_name} (${page.page_id}) -> ${page.company_id}`);
    });
    
    // تحديث المحادثات أيضاً
    console.log('🔄 تحديث معرف الشركة للمحادثات...');
    const [conversationResult] = await pool.execute(
      'UPDATE conversations SET company_id = ? WHERE facebook_page_id = ?',
      ['c677b32f-fe1c-4c64-8362-a1c03406608d', '250528358137901']
    );
    
    console.log('✅ تم تحديث', conversationResult.affectedRows, 'محادثة');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await pool.end();
  }
}

updateCompanyId();
