// عرض بنية جدول المنتجات والبيانات الفعلية
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

async function showProductsStructure() {
  let connection;
  
  try {
    console.log('🔍 عرض بنية جدول المنتجات والبيانات...');
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // عرض بنية الجدول
    const [columns] = await connection.execute(`DESCRIBE products`);
    
    console.log('\n📋 بنية جدول products:');
    console.log('=' .repeat(80));
    columns.forEach(column => {
      const nullable = column.Null === 'YES' ? '(يمكن أن يكون فارغ)' : '(مطلوب)';
      const defaultVal = column.Default ? `- افتراضي: ${column.Default}` : '';
      console.log(`📌 ${column.Field}: ${column.Type} ${nullable} ${defaultVal}`);
    });
    
    // عرض المنتجات لشركة kok@kok.com
    const [products] = await connection.execute(`
      SELECT p.*, c.name as company_name, c.email as company_email
      FROM products p
      JOIN companies c ON p.company_id = c.id
      WHERE c.email = 'kok@kok.com'
      ORDER BY p.created_at DESC
    `);
    
    console.log('\n🛍️ المنتجات الموجودة في قاعدة البيانات:');
    console.log('=' .repeat(80));
    
    if (products.length === 0) {
      console.log('❌ لا توجد منتجات لهذه الشركة');
      return;
    }
    
    products.forEach((product, index) => {
      console.log(`\n📦 المنتج ${index + 1}:`);
      console.log(`   🆔 المعرف: ${product.id}`);
      console.log(`   🏢 معرف الشركة: ${product.company_id}`);
      console.log(`   📧 إيميل الشركة: ${product.company_email}`);
      console.log(`   🏪 اسم الشركة: ${product.company_name}`);
      console.log(`   📦 اسم المنتج: ${product.name}`);
      console.log(`   📝 الوصف: ${product.description || 'غير محدد'}`);
      console.log(`   📝 الوصف المختصر: ${product.short_description || 'غير محدد'}`);
      console.log(`   🏷️ SKU: ${product.sku || 'غير محدد'}`);
      console.log(`   💰 السعر: ${product.price} ريال`);
      console.log(`   💸 سعر التخفيض: ${product.sale_price || 'غير محدد'}`);
      console.log(`   📦 الكمية: ${product.stock_quantity || 0}`);
      console.log(`   📂 الفئة: ${product.category || 'غير محدد'}`);
      console.log(`   🏷️ العلامة التجارية: ${product.brand || 'غير محدد'}`);
      console.log(`   🖼️ رابط الصورة: ${product.image_url || 'غير محدد'}`);
      console.log(`   ⭐ مميز: ${product.featured ? 'نعم' : 'لا'}`);
      console.log(`   ⚖️ الوزن: ${product.weight || 'غير محدد'} كجم`);
      console.log(`   📊 الحالة: ${product.status}`);
      console.log(`   📅 تاريخ الإنشاء: ${product.created_at}`);
      console.log(`   🔄 آخر تحديث: ${product.updated_at}`);
      console.log(`   🏪 معرف المتجر: ${product.store_id || 'غير محدد'}`);
      console.log(`   📂 معرف الفئة: ${product.category_id || 'غير محدد'}`);
      console.log(`   💲 سعر المقارنة: ${product.compare_price || 'غير محدد'}`);
      console.log(`   💵 سعر التكلفة: ${product.cost_price || 'غير محدد'}`);
      console.log(`   📊 تتبع المخزون: ${product.track_inventory ? 'نعم' : 'لا'}`);
      console.log(`   🔄 السماح بالطلب المسبق: ${product.allow_backorder ? 'نعم' : 'لا'}`);
      console.log(`   📐 الأبعاد: ${product.dimensions || 'غير محدد'}`);
      console.log(`   🖼️ الصور: ${product.images || 'غير محدد'}`);
      console.log(`   🏷️ العلامات: ${product.tags || 'غير محدد'}`);
      console.log(`   🔍 عنوان SEO: ${product.seo_title || 'غير محدد'}`);
      console.log(`   📝 وصف SEO: ${product.seo_description || 'غير محدد'}`);
    });
    
    // إحصائيات إضافية
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
        COUNT(CASE WHEN featured = 1 THEN 1 END) as featured_products,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        SUM(stock_quantity) as total_stock
      FROM products p
      JOIN companies c ON p.company_id = c.id
      WHERE c.email = 'kok@kok.com'
    `);
    
    const stat = stats[0];
    console.log('\n📊 إحصائيات المنتجات:');
    console.log('=' .repeat(50));
    console.log(`📦 إجمالي المنتجات: ${stat.total_products}`);
    console.log(`✅ المنتجات النشطة: ${stat.active_products}`);
    console.log(`⭐ المنتجات المميزة: ${stat.featured_products}`);
    console.log(`💰 متوسط السعر: ${parseFloat(stat.avg_price || 0).toFixed(2)} ريال`);
    console.log(`💸 أقل سعر: ${stat.min_price} ريال`);
    console.log(`💎 أعلى سعر: ${stat.max_price} ريال`);
    console.log(`📦 إجمالي المخزون: ${stat.total_stock || 0} قطعة`);
    
  } catch (error) {
    console.error('❌ خطأ في عرض البيانات:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
showProductsStructure()
  .then(() => {
    console.log('✅ انتهى العرض بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل العرض:', error);
    process.exit(1);
  });
