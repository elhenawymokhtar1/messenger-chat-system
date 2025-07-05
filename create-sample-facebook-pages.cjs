const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'facebook_reply_system',
  charset: 'utf8mb4'
};

async function createSampleFacebookPages() {
  let connection;
  
  try {
    console.log('🔗 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // الشركة التجريبية
    const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    
    // صفحات فيسبوك تجريبية
    const samplePages = [
      {
        id: uuidv4(),
        company_id: companyId,
        page_id: '250528358137901',
        page_name: 'سولا 132',
        access_token: 'EAAG7ZCcZCZCZCOBAMtesttoken1234567890',
        page_category: 'Local Business',
        is_active: true,
        webhook_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        company_id: companyId,
        page_id: '240244019177739',
        page_name: 'متجر الإلكترونيات الذكية',
        access_token: 'EAAG7ZCcZCZCZCOBAMtesttoken0987654321',
        page_category: 'Electronics Store',
        is_active: true,
        webhook_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        company_id: companyId,
        page_id: '123456789012345',
        page_name: 'مطعم الأصالة',
        access_token: 'EAAG7ZCcZCZCZCOBAMtesttoken1122334455',
        page_category: 'Restaurant',
        is_active: false,
        webhook_verified: false,
        created_at: new Date(Date.now() - 86400000).toISOString(), // أمس
        updated_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    
    console.log('📄 إضافة صفحات فيسبوك تجريبية...');
    
    for (const page of samplePages) {
      const insertQuery = `
        INSERT INTO facebook_settings (
          id, company_id, page_id, page_name, access_token, 
          page_category, is_active, webhook_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          page_name = VALUES(page_name),
          access_token = VALUES(access_token),
          page_category = VALUES(page_category),
          is_active = VALUES(is_active),
          webhook_verified = VALUES(webhook_verified),
          updated_at = VALUES(updated_at)
      `;
      
      await connection.execute(insertQuery, [
        page.id,
        page.company_id,
        page.page_id,
        page.page_name,
        page.access_token,
        page.page_category,
        page.is_active,
        page.webhook_verified,
        page.created_at,
        page.updated_at
      ]);
      
      console.log(`✅ تم إضافة صفحة: ${page.page_name} (${page.page_id})`);
    }
    
    // إضافة محادثات تجريبية
    console.log('💬 إضافة محادثات تجريبية...');
    
    const sampleConversations = [
      {
        id: uuidv4(),
        company_id: companyId,
        page_id: '250528358137901',
        customer_id: 'customer_001',
        customer_name: 'أحمد محمد علي',
        conversation_status: 'active',
        last_message: 'مرحبا، أريد الاستفسار عن المنتجات المتوفرة',
        last_message_time: new Date().toISOString(),
        unread_count: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        company_id: companyId,
        page_id: '240244019177739',
        customer_id: 'customer_002',
        customer_name: 'فاطمة أحمد',
        conversation_status: 'resolved',
        last_message: 'شكراً لكم على الخدمة الممتازة',
        last_message_time: new Date(Date.now() - 3600000).toISOString(),
        unread_count: 0,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: uuidv4(),
        company_id: companyId,
        page_id: '250528358137901',
        customer_id: 'customer_003',
        customer_name: 'محمد سالم',
        conversation_status: 'pending',
        last_message: 'هل يمكنني معرفة أسعار التوصيل؟',
        last_message_time: new Date(Date.now() - 1800000).toISOString(),
        unread_count: 1,
        created_at: new Date(Date.now() - 5400000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];
    
    for (const conversation of sampleConversations) {
      const insertQuery = `
        INSERT INTO conversations (
          id, company_id, page_id, customer_id, customer_name,
          conversation_status, last_message, last_message_time,
          unread_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(insertQuery, [
        conversation.id,
        conversation.company_id,
        conversation.page_id,
        conversation.customer_id,
        conversation.customer_name,
        conversation.conversation_status,
        conversation.last_message,
        conversation.last_message_time,
        conversation.unread_count,
        conversation.created_at,
        conversation.updated_at
      ]);
      
      console.log(`✅ تم إضافة محادثة: ${conversation.customer_name}`);
    }
    
    console.log('');
    console.log('🎉 تم إنشاء البيانات التجريبية بنجاح!');
    console.log('📊 الإحصائيات:');
    console.log(`   📄 صفحات فيسبوك: ${samplePages.length}`);
    console.log(`   💬 محادثات: ${sampleConversations.length}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات التجريبية:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

// تشغيل الدالة
createSampleFacebookPages();
