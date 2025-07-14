// إصلاح صور المنتجات التي تستخدم via.placeholder.com
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

// صور بديلة من Unsplash
const replacementImages = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop&crop=center', // حذاء أحمر
  'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop&crop=center', // حذاء أسود
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop&crop=center', // منتج عام
  'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&h=300&fit=crop&crop=center', // حذاء أبيض
  'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=300&h=300&fit=crop&crop=center', // حذاء بني
];

async function fixPlaceholderImages() {
  let connection;
  
  try {
    console.log('🔧 بدء إصلاح صور المنتجات...');
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // البحث عن المنتجات التي تستخدم via.placeholder.com
    const [products] = await connection.execute(`
      SELECT id, name, image_url, images
      FROM products
      WHERE image_url LIKE '%via.placeholder.com%'
         OR images LIKE '%via.placeholder.com%'
    `);
    
    console.log(`🔍 وجدت ${products.length} منتج يحتاج إصلاح الصور`);
    
    if (products.length === 0) {
      console.log('✅ لا توجد منتجات تحتاج إصلاح');
      return;
    }
    
    let fixedCount = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const newImageUrl = replacementImages[i % replacementImages.length];
      
      console.log(`🔧 إصلاح المنتج: ${product.name}`);
      console.log(`   الصورة القديمة: ${product.image_url}`);
      console.log(`   الصورة الجديدة: ${newImageUrl}`);
      
      // تحديث image_url
      await connection.execute(`
        UPDATE products
        SET image_url = ?,
            images = ?,
            updated_at = NOW()
        WHERE id = ?
      `, [newImageUrl, JSON.stringify([newImageUrl]), product.id]);
      
      fixedCount++;
      console.log(`   ✅ تم الإصلاح (${fixedCount}/${products.length})`);
    }
    
    console.log(`\n🎉 تم إصلاح ${fixedCount} منتج بنجاح!`);
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح الصور:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
fixPlaceholderImages()
  .then(() => {
    console.log('✅ انتهى السكريبت بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل السكريبت:', error);
    process.exit(1);
  });
