import mysql from 'mysql2/promise';

async function updateImageUrls() {
  const connection = await mysql.createConnection({
    host: '193.203.168.103',
    user: 'u384034873_conversations',
    password: '0165676135Aa@A',
    database: 'u384034873_conversations',
    charset: 'utf8mb4'
  });

  try {
    console.log('🔍 البحث عن الصور التي تحتاج تحديث...');
    
    // البحث عن جميع الصور التي تحتوي على الرابط القديم
    const [oldImages] = await connection.execute(
      `SELECT id, image_url FROM messages WHERE image_url LIKE '%10f9ac7ca0ba.ngrok-free.app%'`
    );
    
    console.log(`📊 وجدت ${oldImages.length} صورة تحتاج تحديث`);
    
    if (oldImages.length === 0) {
      console.log('✅ لا توجد صور تحتاج تحديث');
      return;
    }
    
    // عرض بعض الأمثلة
    console.log('\n📋 أمثلة على الصور التي ستتم تحديثها:');
    oldImages.slice(0, 3).forEach((img, index) => {
      console.log(`${index + 1}. ${img.image_url}`);
    });
    
    // تحديث جميع الروابط
    console.log('\n🔄 تحديث روابط الصور...');
    
    const [result] = await connection.execute(
      `UPDATE messages 
       SET image_url = REPLACE(image_url, 'https://10f9ac7ca0ba.ngrok-free.app', 'https://3665736ca926.ngrok-free.app')
       WHERE image_url LIKE '%10f9ac7ca0ba.ngrok-free.app%'`
    );
    
    console.log(`✅ تم تحديث ${result.affectedRows} صورة بنجاح!`);
    
    // التحقق من النتيجة
    console.log('\n🔍 التحقق من النتيجة...');
    const [updatedImages] = await connection.execute(
      `SELECT id, image_url FROM messages WHERE image_url LIKE '%3665736ca926.ngrok-free.app%' LIMIT 3`
    );
    
    console.log('📋 أمثلة على الصور بعد التحديث:');
    updatedImages.forEach((img, index) => {
      console.log(`${index + 1}. ${img.image_url}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await connection.end();
  }
}

updateImageUrls();
