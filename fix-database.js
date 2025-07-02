import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixDatabase() {
  console.log('🔧 بدء إصلاح قاعدة البيانات...');
  
  try {
    // إنشاء اتصال قاعدة البيانات
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT || 3306,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ تم الاتصال بقاعدة البيانات');

    // 1. إضافة عمود image_url
    try {
      await connection.execute(`
        ALTER TABLE messages 
        ADD COLUMN image_url TEXT NULL
      `);
      console.log('✅ تم إضافة عمود image_url');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ عمود image_url موجود بالفعل');
      } else {
        console.error('❌ خطأ في إضافة image_url:', error.message);
      }
    }

    // 2. إضافة عمود attachments
    try {
      await connection.execute(`
        ALTER TABLE messages 
        ADD COLUMN attachments JSON NULL
      `);
      console.log('✅ تم إضافة عمود attachments');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ عمود attachments موجود بالفعل');
      } else {
        console.error('❌ خطأ في إضافة attachments:', error.message);
      }
    }

    // 3. التحقق من بنية الجدول
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM messages
    `);
    
    console.log('\n📊 بنية جدول messages:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });

    await connection.end();
    console.log('\n🎉 تم إصلاح قاعدة البيانات بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في إصلاح قاعدة البيانات:', error);
  }
}

fixDatabase();
