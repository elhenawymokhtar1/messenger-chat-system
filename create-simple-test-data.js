/**
 * 📊 إنشاء بيانات تجريبية مبسطة
 * يتجنب مشاكل Foreign Key Constraints
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

class SimpleTestDataCreator {
  constructor() {
    this.connection = null;
    this.testCompanyId = 'test-company-123';
    this.testPageId = 'fb_page_001';
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

  async createSimpleTestData() {
    console.log('📊 بدء إنشاء بيانات تجريبية مبسطة...\n');
    this.log('info', 'إنشاء بيانات تجريبية مبسطة');

    try {
      // الاتصال بقاعدة البيانات
      await this.connect();
      
      // إنشاء شركة تجريبية
      await this.createTestCompany();
      
      // إنشاء إعدادات فيسبوك
      await this.createFacebookSettings();
      
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

  async createTestCompany() {
    this.log('create', 'إنشاء شركة تجريبية...');
    
    try {
      await this.connection.execute(`
        INSERT INTO companies (id, name, email, password_hash, is_verified, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        updated_at = VALUES(updated_at)
      `, [
        this.testCompanyId,
        'شركة تجريبية للمحادثات',
        'test@company.com',
        'hashed_password_123',
        true,
        'active',
        new Date().toISOString(),
        new Date().toISOString()
      ]);
      
      this.log('success', 'تم إنشاء الشركة التجريبية');
    } catch (error) {
      this.log('fail', 'خطأ في إنشاء الشركة', { error: error.message });
    }
  }

  async createFacebookSettings() {
    this.log('create', 'إنشاء إعدادات فيسبوك...');
    
    try {
      await this.connection.execute(`
        INSERT INTO facebook_settings (
          id, company_id, page_id, page_name, page_access_token,
          app_id, app_secret, verify_token, webhook_url, is_active, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        page_name = VALUES(page_name),
        is_active = VALUES(is_active),
        updated_at = VALUES(updated_at)
      `, [
        'fb_settings_001',
        this.testCompanyId,
        this.testPageId,
        'صفحة الشركة التجريبية',
        'test_access_token_123',
        'test_app_id',
        'test_app_secret',
        'test_verify_token',
        'https://example.com/webhook',
        true,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
      
      this.log('success', 'تم إنشاء إعدادات فيسبوك');
    } catch (error) {
      this.log('fail', 'خطأ في إنشاء إعدادات فيسبوك', { error: error.message });
    }
  }

  async createTestConversations() {
    this.log('create', 'إنشاء محادثات تجريبية...');
    
    const conversations = [
      {
        id: 'conv-001',
        company_id: this.testCompanyId,
        facebook_page_id: this.testPageId,
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
        id: 'conv-002',
        company_id: this.testCompanyId,
        facebook_page_id: this.testPageId,
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
        id: 'conv-003',
        company_id: this.testCompanyId,
        facebook_page_id: this.testPageId,
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
        id: 'msg-001',
        conversation_id: 'conv-001',
        company_id: this.testCompanyId,
        sender_id: 'fb_customer_001',
        recipient_id: this.testPageId,
        message_text: 'مرحباً',
        message_type: 'text',
        direction: 'incoming',
        status: 'delivered',
        is_read: true,
        sent_at: new Date(Date.now() - 600000).toISOString(),
        created_at: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: 'msg-002',
        conversation_id: 'conv-001',
        company_id: this.testCompanyId,
        sender_id: this.testPageId,
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
        id: 'msg-003',
        conversation_id: 'conv-001',
        company_id: this.testCompanyId,
        sender_id: 'fb_customer_001',
        recipient_id: this.testPageId,
        message_text: 'أريد الاستفسار عن المنتجات المتاحة',
        message_type: 'text',
        direction: 'incoming',
        status: 'delivered',
        is_read: false,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      // رسائل المحادثة الثانية
      {
        id: 'msg-004',
        conversation_id: 'conv-002',
        company_id: this.testCompanyId,
        sender_id: 'fb_customer_002',
        recipient_id: this.testPageId,
        message_text: 'شكراً لكم على الخدمة الممتازة',
        message_type: 'text',
        direction: 'incoming',
        status: 'delivered',
        is_read: true,
        sent_at: new Date(Date.now() - 1800000).toISOString(),
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      // رسائل المحادثة الثالثة
      {
        id: 'msg-005',
        conversation_id: 'conv-003',
        company_id: this.testCompanyId,
        sender_id: 'fb_customer_003',
        recipient_id: this.testPageId,
        message_text: 'متى سيتم توصيل الطلب؟',
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
const creator = new SimpleTestDataCreator();
creator.createSimpleTestData().catch(error => {
  console.error('💥 خطأ في إنشاء البيانات التجريبية:', error);
  process.exit(1);
});
