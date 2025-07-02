/**
 * 📊 إضافة بيانات تجريبية للمحادثات
 * لاختبار صفحة المحادثات وعرض البيانات بشكل واقعي
 */

const mysql = require('mysql2/promise');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4'
};

const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

class ConversationDataGenerator {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      console.log('🔗 الاتصال بقاعدة البيانات...');
      this.connection = await mysql.createConnection(dbConfig);
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    } catch (error) {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
    }
  }

  async checkExistingData() {
    try {
      console.log('🔍 فحص البيانات الموجودة...');
      
      // فحص المحادثات الموجودة
      const [conversations] = await this.connection.execute(
        'SELECT COUNT(*) as count FROM conversations WHERE company_id = ?',
        [COMPANY_ID]
      );
      
      console.log(`📊 المحادثات الموجودة: ${conversations[0].count}`);
      
      return conversations[0].count;
    } catch (error) {
      console.error('❌ خطأ في فحص البيانات:', error.message);
      return 0;
    }
  }

  async clearExistingData() {
    try {
      console.log('🗑️ حذف البيانات الموجودة...');
      
      // حذف الرسائل أولاً
      await this.connection.execute(
        'DELETE FROM messages WHERE company_id = ?',
        [COMPANY_ID]
      );
      
      // ثم حذف المحادثات
      await this.connection.execute(
        'DELETE FROM conversations WHERE company_id = ?',
        [COMPANY_ID]
      );
      
      console.log('✅ تم حذف البيانات الموجودة');
    } catch (error) {
      console.error('❌ خطأ في حذف البيانات:', error.message);
    }
  }

  async createSampleConversations() {
    try {
      console.log('📝 إنشاء محادثات تجريبية...');
      
      const conversations = [
        {
          id: 'conv-test-001',
          company_id: COMPANY_ID,
          facebook_page_id: 'final_test_1751212022774',
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
          company_id: COMPANY_ID,
          facebook_page_id: 'final_test_1751212022774',
          user_id: 'fb_customer_002',
          user_name: 'سارة أحمد حسن',
          status: 'resolved',
          priority: 'low',
          total_messages: 5,
          unread_messages: 0,
          last_message_at: new Date(Date.now() - 1800000).toISOString(),
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: 'conv-test-003',
          company_id: COMPANY_ID,
          facebook_page_id: 'final_test_1751212022774',
          user_id: 'fb_customer_003',
          user_name: 'محمد حسن علي',
          status: 'pending',
          priority: 'high',
          total_messages: 2,
          unread_messages: 1,
          last_message_at: new Date(Date.now() - 3600000).toISOString(),
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'conv-test-004',
          company_id: COMPANY_ID,
          facebook_page_id: 'final_test_1751212022774',
          user_id: 'fb_customer_004',
          user_name: 'فاطمة محمد',
          status: 'active',
          priority: 'urgent',
          total_messages: 7,
          unread_messages: 3,
          last_message_at: new Date(Date.now() - 900000).toISOString(),
          created_at: new Date(Date.now() - 14400000).toISOString(),
          updated_at: new Date(Date.now() - 900000).toISOString()
        },
        {
          id: 'conv-test-005',
          company_id: COMPANY_ID,
          facebook_page_id: 'final_test_1751212022774',
          user_id: 'fb_customer_005',
          user_name: 'عبدالله أحمد',
          status: 'archived',
          priority: 'normal',
          total_messages: 1,
          unread_messages: 0,
          last_message_at: new Date(Date.now() - 86400000).toISOString(),
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      for (const conversation of conversations) {
        await this.connection.execute(`
          INSERT INTO conversations (
            id, company_id, facebook_page_id, user_id, user_name,
            status, priority, total_messages, unread_messages,
            last_message_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          conversation.id,
          conversation.company_id,
          conversation.facebook_page_id,
          conversation.user_id,
          conversation.user_name,
          conversation.status,
          conversation.priority,
          conversation.total_messages,
          conversation.unread_messages,
          conversation.last_message_at,
          conversation.created_at,
          conversation.updated_at
        ]);
        
        console.log(`✅ تم إنشاء المحادثة: ${conversation.user_name}`);
      }

      console.log(`🎉 تم إنشاء ${conversations.length} محادثة تجريبية`);
      return conversations;
    } catch (error) {
      console.error('❌ خطأ في إنشاء المحادثات:', error.message);
      throw error;
    }
  }

  async createSampleMessages(conversations) {
    try {
      console.log('💬 إنشاء رسائل تجريبية...');
      
      const messageTemplates = [
        {
          conversationId: 'conv-test-001',
          messages: [
            { sender_type: 'customer', text: 'مرحباً، أريد الاستفسار عن منتجاتكم', time: -600000 },
            { sender_type: 'page', text: 'مرحباً بك! كيف يمكنني مساعدتك؟', time: -300000 },
            { sender_type: 'customer', text: 'أريد معرفة الأسعار والعروض المتاحة', time: 0 }
          ]
        },
        {
          conversationId: 'conv-test-002',
          messages: [
            { sender_type: 'customer', text: 'السلام عليكم', time: -3600000 },
            { sender_type: 'page', text: 'وعليكم السلام ورحمة الله وبركاته', time: -3300000 },
            { sender_type: 'customer', text: 'أريد طلب منتج معين', time: -3000000 },
            { sender_type: 'page', text: 'بالطبع، ما هو المنتج المطلوب؟', time: -2700000 },
            { sender_type: 'customer', text: 'شكراً لكم على الخدمة الممتازة', time: -1800000 }
          ]
        },
        {
          conversationId: 'conv-test-003',
          messages: [
            { sender_type: 'customer', text: 'متى سيتم توصيل الطلب؟', time: -3600000 },
            { sender_type: 'page', text: 'سيتم التوصيل خلال 24 ساعة', time: -3300000 }
          ]
        },
        {
          conversationId: 'conv-test-004',
          messages: [
            { sender_type: 'customer', text: 'لدي مشكلة في الطلب', time: -14400000 },
            { sender_type: 'page', text: 'نعتذر عن المشكلة، ما هي التفاصيل؟', time: -14100000 },
            { sender_type: 'customer', text: 'الطلب لم يصل في الموعد المحدد', time: -13800000 },
            { sender_type: 'page', text: 'سنتابع الأمر فوراً مع شركة الشحن', time: -13500000 },
            { sender_type: 'customer', text: 'شكراً لكم', time: -13200000 },
            { sender_type: 'page', text: 'تم حل المشكلة، الطلب في الطريق إليك', time: -1800000 },
            { sender_type: 'customer', text: 'ممتاز، شكراً لكم على المتابعة', time: -900000 }
          ]
        },
        {
          conversationId: 'conv-test-005',
          messages: [
            { sender_type: 'customer', text: 'شكراً لكم على الخدمة', time: -86400000 }
          ]
        }
      ];

      let totalMessages = 0;
      
      for (const template of messageTemplates) {
        for (const msgTemplate of template.messages) {
          const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const timestamp = new Date(Date.now() + msgTemplate.time).toISOString();
          
          await this.connection.execute(`
            INSERT INTO messages (
              id, conversation_id, company_id, sender_id, recipient_id,
              message_text, message_type, direction, status, is_read, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            messageId,
            template.conversationId,
            COMPANY_ID,
            msgTemplate.sender_type === 'customer' ? 'customer' : 'page',
            msgTemplate.sender_type === 'customer' ? 'page' : 'customer',
            msgTemplate.text,
            'text',
            msgTemplate.sender_type === 'customer' ? 'incoming' : 'outgoing',
            'delivered',
            msgTemplate.sender_type === 'page',
            timestamp
          ]);
          
          totalMessages++;
        }
        
        console.log(`✅ تم إنشاء رسائل المحادثة: ${template.conversationId}`);
      }

      console.log(`🎉 تم إنشاء ${totalMessages} رسالة تجريبية`);
    } catch (error) {
      console.error('❌ خطأ في إنشاء الرسائل:', error.message);
      throw error;
    }
  }

  async run() {
    try {
      await this.connect();
      
      const existingCount = await this.checkExistingData();
      
      if (existingCount > 0) {
        console.log('⚠️ توجد بيانات موجودة، سيتم حذفها...');
        await this.clearExistingData();
      }
      
      const conversations = await this.createSampleConversations();
      await this.createSampleMessages(conversations);
      
      console.log('\n🎉 تم إنشاء البيانات التجريبية بنجاح!');
      console.log('📊 يمكنك الآن اختبار صفحة المحادثات على:');
      console.log('🔗 http://localhost:8080/facebook-conversations');
      
    } catch (error) {
      console.error('💥 فشل في إنشاء البيانات التجريبية:', error.message);
    } finally {
      await this.disconnect();
    }
  }
}

// تشغيل السكريبت
const generator = new ConversationDataGenerator();
generator.run().catch(console.error);
