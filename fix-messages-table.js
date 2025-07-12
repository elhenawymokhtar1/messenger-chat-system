const mysql = require('mysql2/promise');

async function fixMessagesTable() {
const connection = await mysql.createConnection({
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4'
});

console.log('🔧 إصلاح جدول messages...');

try {
  // 1. التحقق من الأعمدة الموجودة
  console.log('🔍 التحقق من بنية الجدول الحالية...');
  const [columns] = await connection.execute('SHOW COLUMNS FROM messages');
  
  console.log('📊 الأعمدة الموجودة:');
  columns.forEach(col => {
    console.log(`   - ${col.Field}: ${col.Type}`);
  });

  const existingColumns = columns.map(col => col.Field);

  // 2. إضافة عمود company_id إذا لم يكن موجود
  if (!existingColumns.includes('company_id')) {
    console.log('➕ إضافة عمود company_id...');
    await connection.execute(`
      ALTER TABLE messages 
      ADD COLUMN company_id CHAR(36) NULL
    `);
    console.log('✅ تم إضافة عمود company_id');
  } else {
    console.log('ℹ️ عمود company_id موجود بالفعل');
  }

  // 3. إضافة عمود image_url إذا لم يكن موجود
  if (!existingColumns.includes('image_url')) {
    console.log('➕ إضافة عمود image_url...');
    await connection.execute(`
      ALTER TABLE messages 
      ADD COLUMN image_url TEXT NULL
    `);
    console.log('✅ تم إضافة عمود image_url');
  } else {
    console.log('ℹ️ عمود image_url موجود بالفعل');
  }

  // 4. إضافة عمود is_from_page إذا لم يكن موجود
  if (!existingColumns.includes('is_from_page')) {
    console.log('➕ إضافة عمود is_from_page...');
    await connection.execute(`
      ALTER TABLE messages 
      ADD COLUMN is_from_page TINYINT(1) DEFAULT 0
    `);
    console.log('✅ تم إضافة عمود is_from_page');
  } else {
    console.log('ℹ️ عمود is_from_page موجود بالفعل');
  }

  // 5. تحديث الرسائل الموجودة بـ company_id من المحادثات
  console.log('🔄 تحديث company_id للرسائل الموجودة...');
  await connection.execute(`
    UPDATE messages m
    JOIN conversations c ON m.conversation_id = c.id
    SET m.company_id = c.company_id
    WHERE m.company_id IS NULL
  `);
  console.log('✅ تم تحديث company_id للرسائل الموجودة');

  // 6. التحقق من النتيجة النهائية
  console.log('\n🔍 التحقق من البنية النهائية...');
  const [finalColumns] = await connection.execute('SHOW COLUMNS FROM messages');
  
  console.log('📊 البنية النهائية لجدول messages:');
  finalColumns.forEach(col => {
    console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
  });

  console.log('\n🎉 تم إصلاح جدول messages بنجاح!');

} catch (error) {
  console.error('❌ خطأ في إصلاح الجدول:', error);
} finally {
  await connection.end();
}
}

fixMessagesTable().catch(console.error);
