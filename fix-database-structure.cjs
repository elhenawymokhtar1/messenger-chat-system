// إصلاح هيكل قاعدة البيانات
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

async function fixDatabaseStructure() {
  try {
    const conn = await mysql.createConnection(config);
    
    console.log('🔧 بدء إصلاح هيكل قاعدة البيانات...');
    
    // 1. إنشاء شركة حقيقية بمعرف محدد
    const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    
    try {
      // محاولة إنشاء الشركة مباشرة بدون trigger
      await conn.execute(`
        SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO'
      `);
      
      await conn.execute(`
        INSERT IGNORE INTO companies 
        (id, name, email, password_hash, status, subscription_status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        companyId, 
        'شركة المنتجات التجريبية', 
        'products@demo.local', 
        await bcrypt.hash('123456', 12), 
        'active', 
        'active'
      ]);
      
      console.log('✅ تم إنشاء الشركة بنجاح');
      
    } catch (error) {
      console.log('⚠️ الشركة موجودة بالفعل أو هناك قيود');
    }
    
    // 2. نقل البيانات من products_temp إلى products الحقيقي
    console.log('📦 نقل بيانات المنتجات...');
    
    try {
      // فحص وجود بيانات في products_temp
      const [tempProducts] = await conn.execute('SELECT * FROM products_temp');
      console.log('📊 عدد المنتجات في الجدول المؤقت:', tempProducts.length);
      
      if (tempProducts.length > 0) {
        // نقل البيانات إلى الجدول الحقيقي
        for (const product of tempProducts) {
          try {
            await conn.execute(`
              INSERT IGNORE INTO products (
                id, company_id, name, description, short_description, sku,
                price, sale_price, stock_quantity, category, brand,
                image_url, featured, weight, status, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              product.id, companyId, product.name, product.description,
              product.short_description, product.sku, product.price,
              product.sale_price, product.stock_quantity, product.category,
              product.brand, product.image_url, product.featured,
              product.weight, product.status, product.created_at, product.updated_at
            ]);
            console.log('✅ تم نقل المنتج:', product.name);
          } catch (error) {
            console.log('⚠️ خطأ في نقل المنتج:', product.name, error.message);
          }
        }
      }
      
    } catch (error) {
      console.log('⚠️ الجدول المؤقت غير موجود');
    }
    
    // 3. فحص النتيجة النهائية
    const [finalProducts] = await conn.execute(
      'SELECT COUNT(*) as count FROM products WHERE company_id = ?', 
      [companyId]
    );
    
    console.log('📊 عدد المنتجات النهائي للشركة:', finalProducts[0].count);
    
    // 4. فحص الشركة
    const [company] = await conn.execute(
      'SELECT id, name, email FROM companies WHERE id = ?', 
      [companyId]
    );
    
    if (company.length > 0) {
      console.log('✅ الشركة موجودة:');
      console.log('  🆔 المعرف:', company[0].id);
      console.log('  🏢 الاسم:', company[0].name);
      console.log('  📧 الإيميل:', company[0].email);
    }
    
    await conn.end();
    
    console.log('🎉 تم إصلاح هيكل قاعدة البيانات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح قاعدة البيانات:', error.message);
  }
}

fixDatabaseStructure();
