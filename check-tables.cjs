const mysql = require('mysql2/promise');

async function checkTableStructure() {
  const pool = mysql.createPool({
    host: '193.203.168.103',
    user: 'u384034873_conversations',
    password: 'Aa123456789@',
    database: 'u384034873_conversations',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🔍 فحص هيكل الجداول...\n');
    
    // فحص جدول conversations
    console.log('📊 جدول conversations:');
    const [conversationsColumns] = await pool.execute('DESCRIBE conversations');
    conversationsColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
