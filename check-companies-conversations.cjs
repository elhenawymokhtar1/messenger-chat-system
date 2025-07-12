const mysql = require('mysql2/promise');

async function checkAllCompanies() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'facebook_reply_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🔍 فحص جميع الشركات والمحادثات...\n');
    
    // 1. جلب جميع الشركات
    const [companies] = await pool.execute(`
      SELECT id, name, email, created_at 
      FROM companies 
      ORDER BY created_at DESC
    `);
    
    console.log(`🏢 إجمالي الشركات: ${companies.length}\n`);
    
    // 2. فحص المحادثات لكل شركة
    for (const company of companies) {
      console.log(`📊 شركة: ${company.name} (${company.email})`);
      console.log(`   ID: ${company.id}`);
      
      // عدد المحادثات
      const [conversations] = await pool.execute(`
        SELECT COUNT(*) as count 
        FROM conversations 
        WHERE company_id = ?
      `, [company.id]);
      
      const conversationCount = conversations[0].count;
      console.log(`   💬 المحادثات: ${conversationCount}`);
      
      // إذا كان فيه محادثات، اعرض أول 3
      if (conversationCount > 0) {
        const [sampleConversations] = await pool.execute(`
          SELECT id, customer_name, last_message, last_message_at
          FROM conversations 
          WHERE company_id = ?
          ORDER BY last_message_at DESC
          LIMIT 3
        `, [company.id]);
        
        console.log(`   📝 عينة من المحادثات:`);
        sampleConversations.forEach((conv, index) => {
          console.log(`      ${index + 1}. ${conv.customer_name}: "${conv.last_message?.substring(0, 50)}..."`);
        });
      }
      
      console.log(''); // سطر فارغ
    }
    
    // 3. فحص المحادثات بدون company_id
    const [orphanConversations] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM conversations 
      WHERE company_id IS NULL
    `);
    
    console.log(`🔍 محادثات بدون company_id: ${orphanConversations[0].count}`);
    
    // 4. فحص المحادثات مع الـ ID الثابت القديم
    const [fixedIdConversations] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM conversations 
      WHERE company_id = ?
    `, ['c677b32f-fe1c-4c64-8362-a1c03406608d']);
    
    console.log(`🔍 محادثات مع الـ ID الثابت القديم: ${fixedIdConversations[0].count}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllCompanies();
