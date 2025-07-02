/**
 * 🔍 فحص هيكل جدول الفئات واختبار الإضافة
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations'
};

async function checkCategoriesTable() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // فحص هيكل جدول الفئات
    console.log('\n📂 فحص هيكل جدول categories:');
    const [categoryColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories'
      ORDER BY ORDINAL_POSITION
    `, [DB_CONFIG.database]);
    
    if (categoryColumns.length === 0) {
      console.log('❌ جدول categories غير موجود!');
      return;
    }
    
    console.log('📋 أعمدة جدول categories:');
    categoryColumns.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      const key = col.COLUMN_KEY ? ` (${col.COLUMN_KEY})` : '';
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${nullable}${key}`);
    });
    
    // عرض البيانات الموجودة
    console.log('\n📊 البيانات الموجودة في جدول categories:');
    const [existingCategories] = await connection.execute(
      'SELECT * FROM categories ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log(`📂 عدد الفئات الموجودة: ${existingCategories.length}`);
    
    if (existingCategories.length > 0) {
      console.log('📋 آخر 5 فئات:');
      existingCategories.forEach((category, index) => {
        console.log(`  ${index + 1}. ${category.name} (${category.id})`);
        console.log(`     - الشركة: ${category.company_id}`);
        console.log(`     - الرابط: ${category.slug}`);
        console.log(`     - نشط: ${category.is_active ? 'نعم' : 'لا'}`);
        console.log(`     - تاريخ الإنشاء: ${category.created_at}`);
      });
    }
    
    // اختبار إضافة فئة جديدة
    console.log('\n🆕 اختبار إضافة فئة جديدة...');
    
    const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    const categoryId = uuidv4();
    
    const testCategory = {
      id: categoryId,
      company_id: companyId,
      name: 'فئة اختبار مباشر',
      slug: 'test-category-direct',
      description: 'فئة تجريبية لاختبار النظام',
      icon: 'test-icon',
      color: '#007bff',
      image_url: 'https://example.com/test.jpg',
      sort_order: 1,
      is_active: 1
    };
    
    try {
      const [insertResult] = await connection.execute(`
        INSERT INTO categories (
          id, company_id, name, slug, description, icon, color, 
          image_url, sort_order, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        testCategory.id,
        testCategory.company_id,
        testCategory.name,
        testCategory.slug,
        testCategory.description,
        testCategory.icon,
        testCategory.color,
        testCategory.image_url,
        testCategory.sort_order,
        testCategory.is_active
      ]);
      
      console.log('✅ تم إضافة الفئة التجريبية بنجاح!');
      console.log(`📂 معرف الفئة: ${categoryId}`);
      console.log(`📝 اسم الفئة: ${testCategory.name}`);
      
      // التحقق من الفئة المضافة
      const [newCategory] = await connection.execute(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );
      
      if (newCategory.length > 0) {
        console.log('\n✅ تأكيد البيانات المضافة:');
        const category = newCategory[0];
        console.log(`  - الاسم: ${category.name}`);
        console.log(`  - الرابط: ${category.slug}`);
        console.log(`  - الوصف: ${category.description}`);
        console.log(`  - اللون: ${category.color}`);
        console.log(`  - الترتيب: ${category.sort_order}`);
        console.log(`  - نشط: ${category.is_active ? 'نعم' : 'لا'}`);
        console.log(`  - تاريخ الإنشاء: ${category.created_at}`);
      }
      
    } catch (insertError) {
      console.error('❌ خطأ في إضافة الفئة:', insertError.message);
      
      if (insertError.code === 'ER_DUP_ENTRY') {
        console.log('⚠️ الفئة موجودة بالفعل');
      } else if (insertError.code === 'ER_NO_REFERENCED_ROW_2') {
        console.log('⚠️ مشكلة في المفاتيح الخارجية');
      }
    }
    
    // عرض إحصائيات نهائية
    console.log('\n📊 إحصائيات نهائية:');
    
    const [totalCategories] = await connection.execute(
      'SELECT COUNT(*) as total FROM categories WHERE company_id = ?',
      [companyId]
    );
    
    const [activeCategories] = await connection.execute(
      'SELECT COUNT(*) as active FROM categories WHERE company_id = ? AND is_active = 1',
      [companyId]
    );
    
    console.log(`📂 إجمالي الفئات للشركة: ${totalCategories[0].total}`);
    console.log(`✅ الفئات النشطة: ${activeCategories[0].active}`);
    
    // اختبار API endpoint
    console.log('\n🌐 اختبار API endpoint...');
    
    const http = require('http');
    
    const testAPICall = () => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'localhost',
          port: 3002,
          path: `/api/companies/${companyId}/categories`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const req = http.request(options, (res) => {
          let body = '';
          
          res.on('data', (chunk) => {
            body += chunk;
          });
          
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(body);
              resolve({
                status: res.statusCode,
                data: jsonData
              });
            } catch (e) {
              resolve({
                status: res.statusCode,
                data: body
              });
            }
          });
        });

        req.on('error', (err) => {
          reject(err);
        });
        
        req.end();
      });
    };
    
    try {
      const apiResult = await testAPICall();
      console.log('📊 حالة API:', apiResult.status);
      
      if (apiResult.data.success) {
        console.log('✅ API يعمل بنجاح');
        console.log(`📂 عدد الفئات من API: ${apiResult.data.data.length}`);
      } else {
        console.log('❌ API لا يعمل:', apiResult.data.message || apiResult.data);
      }
    } catch (apiError) {
      console.log('❌ خطأ في اتصال API:', apiError.message);
    }
    
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// تشغيل الفحص
checkCategoriesTable()
  .then(() => {
    console.log('\n🎉 انتهى فحص جدول الفئات!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل الفحص:', error.message);
    process.exit(1);
  });
