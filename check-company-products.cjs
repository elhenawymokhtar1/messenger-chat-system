// فحص عدد المنتجات لشركة معينة
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

async function checkCompanyProducts(email) {
  let connection;
  
  try {
    console.log(`🔍 البحث عن الشركة: ${email}`);
    
    // الاتصال بقاعدة البيانات
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ تم الاتصال بقاعدة البيانات');
    
    // البحث عن الشركة بالإيميل
    const [companies] = await connection.execute(`
      SELECT id, name, email, created_at, status
      FROM companies 
      WHERE email = ?
    `, [email]);
    
    if (companies.length === 0) {
      console.log(`❌ لم يتم العثور على شركة بالإيميل: ${email}`);
      return;
    }
    
    const company = companies[0];
    console.log(`✅ تم العثور على الشركة:`);
    console.log(`   📧 الإيميل: ${company.email}`);
    console.log(`   🏢 الاسم: ${company.name}`);
    console.log(`   🆔 المعرف: ${company.id}`);
    console.log(`   📅 تاريخ الإنشاء: ${company.created_at}`);
    console.log(`   📊 الحالة: ${company.status}`);
    
    // حساب عدد المنتجات
    const [products] = await connection.execute(`
      SELECT COUNT(*) as total_count,
             COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
             COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count,
             COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count
      FROM products 
      WHERE company_id = ?
    `, [company.id]);
    
    const counts = products[0];
    
    console.log(`\n📦 إحصائيات المنتجات:`);
    console.log(`   📊 إجمالي المنتجات: ${counts.total_count}`);
    console.log(`   ✅ المنتجات النشطة: ${counts.active_count}`);
    console.log(`   ❌ المنتجات غير النشطة: ${counts.inactive_count}`);
    console.log(`   📝 المسودات: ${counts.draft_count}`);
    
    // جلب عينة من المنتجات
    if (counts.total_count > 0) {
      const [sampleProducts] = await connection.execute(`
        SELECT id, name, price, status, created_at
        FROM products 
        WHERE company_id = ?
        ORDER BY created_at DESC
        LIMIT 5
      `, [company.id]);
      
      console.log(`\n📋 عينة من المنتجات (آخر 5 منتجات):`);
      sampleProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
        console.log(`      💰 السعر: ${product.price} ريال`);
        console.log(`      📊 الحالة: ${product.status}`);
        console.log(`      📅 تاريخ الإضافة: ${product.created_at}`);
        console.log(`      🆔 المعرف: ${product.id}`);
        console.log('');
      });
    }
    
    // فحص الفئات إذا كانت موجودة
    const [categories] = await connection.execute(`
      SELECT category, COUNT(*) as count
      FROM products 
      WHERE company_id = ? AND category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY count DESC
    `, [company.id]);
    
    if (categories.length > 0) {
      console.log(`📂 الفئات:`);
      categories.forEach(cat => {
        console.log(`   - ${cat.category}: ${cat.count} منتج`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص المنتجات:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل السكريبت
const email = process.argv[2] || 'kok@kok.com';

checkCompanyProducts(email)
  .then(() => {
    console.log('✅ انتهى الفحص بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل الفحص:', error);
    process.exit(1);
  });
