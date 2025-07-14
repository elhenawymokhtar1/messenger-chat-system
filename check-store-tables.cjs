const mysql = require('mysql2/promise');

async function checkStoreTables() {
  let connection;
  
  try {
    console.log('🔍 الاتصال بقاعدة البيانات...');
    
    connection = await mysql.createConnection({
      host: '193.203.168.103',
      user: 'u384034873_conversations',
      password: 'Mokhtar123@',
      database: 'u384034873_conversations'
    });

    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // فحص جداول المتجر
    const storeTables = [
      'stores',
      'products', 
      'categories',
      'cart_items',
      'orders',
      'order_items'
    ];
    
    console.log('\n🏪 فحص جداول المتجر الإلكتروني:');
    console.log('='.repeat(50));
    
    for (const tableName of storeTables) {
      try {
        // فحص وجود الجدول
        const [tables] = await connection.execute(
          'SHOW TABLES LIKE ?', 
          [tableName]
        );
        
        if (tables.length > 0) {
          console.log(`\n✅ جدول ${tableName} موجود`);
          
          // فحص بنية الجدول
          const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
          
          console.log(`📋 بنية جدول ${tableName}:`);
          structure.forEach(col => {
            const key = col.Key ? ` (${col.Key})` : '';
            const nullable = col.Null === 'YES' ? ' NULL' : ' NOT NULL';
            console.log(`   - ${col.Field}: ${col.Type}${nullable}${key}`);
          });
          
          // فحص عزل البيانات
          const hasCompanyId = structure.some(col => col.Field === 'company_id');
          const hasStoreId = structure.some(col => col.Field === 'store_id');
          
          if (hasCompanyId) {
            console.log(`🔒 عزل البيانات: مباشر عبر company_id`);
            
            // عد البيانات لكل شركة
            const [companyCounts] = await connection.execute(
              `SELECT company_id, COUNT(*) as count FROM ${tableName} GROUP BY company_id`
            );
            
            console.log(`📊 توزيع البيانات:`);
            companyCounts.forEach(row => {
              console.log(`   - الشركة ${row.company_id}: ${row.count} سجل`);
            });
            
          } else if (hasStoreId) {
            console.log(`🔒 عزل البيانات: غير مباشر عبر store_id`);
            
            // ربط مع جدول stores للحصول على company_id
            try {
              const [companyCounts] = await connection.execute(`
                SELECT s.company_id, COUNT(t.*) as count 
                FROM ${tableName} t
                JOIN stores s ON t.store_id = s.id
                GROUP BY s.company_id
              `);
              
              console.log(`📊 توزيع البيانات:`);
              companyCounts.forEach(row => {
                console.log(`   - الشركة ${row.company_id}: ${row.count} سجل`);
              });
            } catch (err) {
              console.log(`⚠️  لا يمكن ربط البيانات مع جدول stores`);
            }
            
          } else {
            console.log(`❌ لا يوجد عزل للبيانات - خطر أمني!`);
          }
          
          // عد إجمالي السجلات
          const [totalCount] = await connection.execute(
            `SELECT COUNT(*) as total FROM ${tableName}`
          );
          console.log(`📈 إجمالي السجلات: ${totalCount[0].total}`);
          
        } else {
          console.log(`❌ جدول ${tableName} غير موجود`);
        }
        
      } catch (error) {
        console.log(`❌ خطأ في فحص جدول ${tableName}:`, error.message);
      }
    }
    
    // فحص العلاقات بين الجداول
    console.log('\n🔗 فحص العلاقات بين الجداول:');
    console.log('='.repeat(50));
    
    try {
      // فحص العلاقة stores -> products
      const [storeProductRelation] = await connection.execute(`
        SELECT 
          s.company_id,
          s.name as store_name,
          COUNT(p.id) as products_count
        FROM stores s
        LEFT JOIN products p ON s.id = p.store_id
        GROUP BY s.id, s.company_id, s.name
        ORDER BY s.company_id
      `);
      
      console.log('🏪➡️📦 العلاقة: المتاجر والمنتجات');
      storeProductRelation.forEach(row => {
        console.log(`   - ${row.store_name} (${row.company_id}): ${row.products_count} منتج`);
      });
      
    } catch (error) {
      console.log('❌ خطأ في فحص العلاقات:', error.message);
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 تم إغلاق الاتصال');
    }
  }
}

checkStoreTables().catch(console.error);
