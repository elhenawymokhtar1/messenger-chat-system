/**
 * 📊 إنشاء بيانات تجريبية نهائية
 * يستخدم البيانات الموجودة في قاعدة البيانات
 */

import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

class FinalTestDataCreator {
  constructor() {
    this.connection = null;
    this.testCompanyId = 'test-company-123';
    this.existingPageId = 'final_test_1751212022774'; // من البيانات الموجودة
    this.existingCompanyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d'; // من البيانات الموجودة
  }

  log(level, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const emoji = {
      'info': 'ℹ️',
      'create': '📊',
      'success': '✅',
      'fail': '❌',
      'warn': '⚠️'
    }[level] || '📝';
    
    console.log(`${emoji} [${timestamp}] ${message}`);
    if (details) {
      console.log(`   📋 التفاصيل: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async createFinalTestData() {
    console.log('📊 بدء إنشاء بيانات تجريبية نهائية...\n');
    this.log('info', 'إنشاء بيانات تجريبية نهائية');

    try {
      // الاتصال بقاعدة البيانات
      await this.connect();
      
      // إنشاء محادثات تجريبية
      await this.createTestConversations();
      
      // إنشاء رسائل تجريبية
      await this.createTestMessages();
      
      this.log('success', 'تم إنشاء جميع البيانات التجريبية بنجاح!');
      
    } catch (error) {
      this.log('fail', 'خطأ في إنشاء البيانات التجريبية', { error: error.message });
    } finally {
      if (this.connection) {
        await this.connection.end();
      }
    }
  }

  async connect() {
    this.log('info', 'الاتصال بقاعدة البيانات...');
    this.connection = await mysql.createConnection(DB_CONFIG);
    this.log('success', 'تم الاتصال بقاعدة البيانات');
  }

  async createTestConversations() {
    this.log('create', 'إنشاء محادثات تجريبية...');
    
    const conversations = [
      {
        id: 'conv-test-001',
        company_id: this.existingCompanyId,
        facebook_page_id: this.existingPageId,
        user_id: 'fb_customer_001',
        user_name: 'أحمد محمد علي',
        status: 'active',
        priority: 'normal',
        total_messages: 3,
        unread_messages: 2,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'conv-test-002',
        company_id: this.existingCompanyId,
        facebook_page_id: this.existingPageId,
        user_id: 'fb_customer_002',
        user_name: 'سارة أحمد حسن',
        status: 'resolved',
        priority: 'low',
        total_messages: 1,
        unread_messages: 0,
        last_message_at: new Date(Date.now() - 1800000).toISOString(),
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'conv-test-003',
        company_id: this.existingCompanyId,
        facebook_page_id: this.existingPageId,
        user_id: 'fb_customer_003',
        user_name: 'محمد علي يوسف',
        status: 'pending',
        priority: 'high',
        total_messages: 1,
        unread_messages: 1,
        last_message_at: new Date(Date.now() - 900000).toISOString(),
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 900000).toISOString()
      }
    ];

    for (const conv of conversations) {
      try {
        await this.connection.execute(`
          INSERT INTO conversations (
            id, company_id, facebook_page_id, user_id, user_name,
            status, priority, total_messages, unread_messages,
            last_message_at, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          user_name = VALUES(user_name),
          status = VALUES(status),
          total_messages = VALUES(total_messages),
          unread_messages = VALUES(unread_messages),
          last_message_at = VALUES(last_message_at),
          updated_at = VALUES(updated_at)
        `, [
          conv.id, conv.company_id, conv.facebook_page_id, conv.user_id, conv.user_name,
          conv.status, conv.priority, conv.total_messages, conv.unread_messages,
          conv.last_message_at, conv.created_at, conv.updated_at
        ]);
        
        this.log('success', `تم إنشاء محادثة: ${conv.user_name}`);
      } catch (error) {
        this.log('fail', `خطأ في إنشاء محادثة ${conv.user_name}`, { error: error.message });
      }
    }
  }

  async createTestMessages() {
    this.log('create', 'إنشاء رسائل تجريبية...');
    
    const messages = [
      // رسائل المحادثة الأولى
      {
        id: 'msg-test-001',
        conversation_id: 'conv-test-001',
        company_id: this.existingCompanyId,
        sender_id: 'fb_customer_001',
        recipient_id: this.existingPageId,
        message_text: 'مرحباً، أريد الاستفسار عن المنتجات',
        message_type: 'text',
        direction: 'incoming',
        status: 'delivered',
        is_read: false,
        sent_at: new Date(Date.now() - 600000).toISOString(),
        created_at: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: 'msg-test-002',
        conversation_id: 'conv-test-001',
        company_id: this.existingCompanyId,
        sender_id: this.existingPageId,
        recipient_id: 'fb_customer_001',
        message_text: 'مرحباً بك! كيف يمكنني مساعدتك؟',
        message_type: 'text',
        direction: 'outgoing',
        status: 'delivered',
        is_read: true,
        sent_at: new Date(Date.now() - 300000).toISOString(),
        created_at: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 'msg-test-003',
        conversation_id: 'conv-test-001',
        company_id: this.existingCompanyId,
        sender_id: 'fb_customer_001',
        recipient_id: this.existingPageId,
        message_text: 'أريد معرفة الأسعار والعروض المتاحة',
        message_type: 'text',
        direction: 'incoming',
        status: 'delivered',
        is_read: false,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      // رسائل المحادثة الثانية
      {
        id: 'msg-test-004',
        conversation_id: 'conv-test-002',
        company_id: this.existingCompanyId,
        sender_id: 'fb_customer_002',
        recipient_id: this.existingPageId,
        message_text: 'شكراً لكم على الخدمة الممتازة والسريعة',
        message_type: 'text',
        direction: 'incoming',
        status: 'delivered',
        is_read: true,
        sent_at: new Date(Date.now() - 1800000).toISOString(),
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      // رسائل المحادثة الثالثة
      {
        id: 'msg-test-005',
        conversation_id: 'conv-test-003',
        company_id: this.existingCompanyId,
        sender_id: 'fb_customer_003',
        recipient_id: this.existingPageId,
        message_text: 'متى سيتم توصيل الطلب؟ أنتظر منذ أسبوع',
        message_type: 'text',
        direction: 'incoming',
        status: 'delivered',
        is_read: false,
        sent_at: new Date(Date.now() - 900000).toISOString(),
        created_at: new Date(Date.now() - 900000).toISOString()
      }
    ];

    for (const msg of messages) {
      try {
        await this.connection.execute(`
          INSERT INTO messages (
            id, conversation_id, company_id, sender_id, recipient_id,
            message_text, message_type, direction, status, is_read,
            sent_at, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          message_text = VALUES(message_text),
          is_read = VALUES(is_read),
          status = VALUES(status)
        `, [
          msg.id, msg.conversation_id, msg.company_id, msg.sender_id, msg.recipient_id,
          msg.message_text, msg.message_type, msg.direction, msg.status, msg.is_read,
          msg.sent_at, msg.created_at
        ]);
        
        this.log('success', `تم إنشاء رسالة: ${msg.message_text.substring(0, 30)}...`);
      } catch (error) {
        this.log('fail', `خطأ في إنشاء رسالة`, { error: error.message });
      }
    }
  }
}

// تشغيل إنشاء البيانات التجريبية
const creator = new FinalTestDataCreator();
creator.createFinalTestData().catch(error => {
  console.error('💥 خطأ في إنشاء البيانات التجريبية:', error);
  process.exit(1);
});
