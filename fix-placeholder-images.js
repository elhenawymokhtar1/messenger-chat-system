// إصلاح صور المنتجات التي تستخدم via.placeholder.com
import mysql from 'mysql2/promise';
import colors from 'colors';

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: 'Aa123456789',
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
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=300&fit=crop&crop=center', // حذاء بيج
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop&crop=center', // تيشيرت
  'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=300&fit=crop&crop=center', // بلوزة
  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop&crop=center', // بلوزة 2
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop&crop=center'  // فستان
];

async function fixPlaceholderImages() {
  let connection;
  
  try {
    console.log('🔧 بدء إصلاح صور المنتجات...'.cyan.bold);
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات'.green);
    
    // البحث عن المنتجات التي تستخدم via.placeholder.com
    const [products] = await connection.execute(`
      SELECT id, name, image_url, images 
      FROM ecommerce_products 
      WHERE image_url LIKE '%via.placeholder.com%' 
         OR images LIKE '%via.placeholder.com%'
    `);
    
    console.log(`🔍 وجدت ${products.length} منتج يحتاج إصلاح الصور`.yellow);
    
    if (products.length === 0) {
      console.log('✅ لا توجد منتجات تحتاج إصلاح'.green);
      return;
    }
    
    let fixedCount = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const newImageUrl = replacementImages[i % replacementImages.length];
      
      console.log(`🔧 إصلاح المنتج: ${product.name}`.cyan);
      console.log(`   الصورة القديمة: ${product.image_url}`.gray);
      console.log(`   الصورة الجديدة: ${newImageUrl}`.green);
      
      // تحديث image_url
      await connection.execute(`
        UPDATE ecommerce_products 
        SET image_url = ?, 
            images = ?,
            updated_at = NOW()
        WHERE id = ?
      `, [newImageUrl, JSON.stringify([newImageUrl]), product.id]);
      
      fixedCount++;
      console.log(`   ✅ تم الإصلاح (${fixedCount}/${products.length})`.green);
    }
    
    console.log(`\n🎉 تم إصلاح ${fixedCount} منتج بنجاح!`.green.bold);
    
    // فحص النتائج
    const [updatedProducts] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM ecommerce_products 
      WHERE image_url LIKE '%via.placeholder.com%' 
         OR images LIKE '%via.placeholder.com%'
    `);
    
    if (updatedProducts[0].count === 0) {
      console.log('✅ تم إصلاح جميع الصور بنجاح!'.green.bold);
    } else {
      console.log(`⚠️ لا يزال هناك ${updatedProducts[0].count} منتج يحتاج إصلاح`.yellow);
    }
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح الصور:'.red, error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل السكريبت
if (import.meta.url === `file://${process.argv[1]}`) {
  fixPlaceholderImages()
    .then(() => {
      console.log('✅ انتهى السكريبت بنجاح'.green.bold);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل السكريبت:'.red, error);
      process.exit(1);
    });
}

export { fixPlaceholderImages };
