import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

async function addMissingPage() {
  console.log('➕ إضافة الصفحة المفقودة...');
  
  try {
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

    // الصفحة المفقودة
    const missingPageId = '114497159957743';
    const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d'; // نفس الشركة
    
    // التحقق من وجود الصفحة
    const [existing] = await connection.execute(`
      SELECT * FROM facebook_settings WHERE page_id = ?
    `, [missingPageId]);
    
    if (existing.length > 0) {
      console.log(`ℹ️ الصفحة ${missingPageId} موجودة بالفعل`);
      await connection.end();
      return;
    }

    // إضافة الصفحة الجديدة
    const newId = crypto.randomUUID();
    await connection.execute(`
      INSERT INTO facebook_settings (
        id, company_id, page_id, page_name, access_token, 
        is_active, webhook_verified, total_messages, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      newId,
      companyId,
      missingPageId,
      'صفحة إضافية', // اسم مؤقت
      'temporary_token', // token مؤقت - يحتاج تحديث
      1, // نشطة
      0, // غير مُتحقق من الويب هوك
      0  // عدد الرسائل
    ]);

    console.log(`✅ تم إضافة الصفحة ${missingPageId} بنجاح`);
    console.log(`📝 ID: ${newId}`);
    console.log(`⚠️ تحتاج لتحديث access_token لاحقاً`);

    // عرض جميع الصفحات
    const [allPages] = await connection.execute(`
      SELECT page_id, page_name, is_active 
      FROM facebook_settings 
      ORDER BY created_at DESC
    `);
    
    console.log('\n📄 جميع الصفحات:');
    allPages.forEach((page, index) => {
      console.log(`   ${index + 1}. ${page.page_name} (${page.page_id}) - ${page.is_active ? 'نشطة' : 'غير نشطة'}`);
    });

    await connection.end();
    console.log('\n🎉 تم الإصلاح بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في إضافة الصفحة:', error);
  }
}

addMissingPage();
