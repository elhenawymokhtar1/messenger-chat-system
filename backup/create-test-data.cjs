// إنشاء بيانات اختبار للمنتجات
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const config = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306
};

async function createTestData() {
  try {
    const conn = await mysql.createConnection(config);
    
    // إنشاء شركة اختبار
    const companyId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash('123456', 12);
    
    console.log('🏢 إنشاء شركة اختبار...');
    
    try {
      await conn.execute(`
        INSERT INTO companies (id, name, email, password_hash, status, subscription_status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [companyId, 'شركة اختبار المنتجات', 'products@test.local', passwordHash, 'active', 'active']);
      
      console.log('✅ تم إنشاء الشركة بنجاح');
      console.log('🆔 معرف الشركة:', companyId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('⚠️ الشركة موجودة بالفعل');
        // جلب الشركة الموجودة
        const [companies] = await conn.execute('SELECT id FROM companies LIMIT 1');
        if (companies.length > 0) {
          companyId = companies[0].id;
          console.log('🆔 استخدام معرف الشركة الموجود:', companyId);
        }
      } else {
        throw error;
      }
    }
    
    // إنشاء منتج اختبار
    console.log('📦 إنشاء منتج اختبار...');
    
    const productId = crypto.randomUUID();
    
    await conn.execute(`
      INSERT INTO products (
        id, company_id, name, description, short_description, sku,
        price, sale_price, stock_quantity, category, brand,
        image_url, featured, weight, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      productId,
      companyId,
      'منتج اختبار رائع',
      'هذا منتج اختبار لتجربة النظام',
      'منتج اختبار',
      `SKU-${Date.now()}`,
      99.99,
      79.99,
      50,
      'إلكترونيات',
      'علامة تجارية',
      'https://example.com/image.jpg',
      1,
      1.5,
      'active'
    ]);
    
    console.log('✅ تم إنشاء المنتج بنجاح');
    console.log('🆔 معرف المنتج:', productId);
    
    // فحص النتيجة
    const [products] = await conn.execute('SELECT COUNT(*) as count FROM products WHERE company_id = ?', [companyId]);
    console.log('📊 عدد منتجات الشركة:', products[0].count);
    
    console.log('\n🎯 بيانات الاختبار:');
    console.log('🏢 معرف الشركة:', companyId);
    console.log('📦 معرف المنتج:', productId);
    console.log('🔗 API للمنتجات:', `http://localhost:3003/api/companies/${companyId}/products`);
    
    await conn.end();
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

createTestData();
