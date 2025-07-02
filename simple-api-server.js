/**
 * 🚀 خادم API بسيط لاختبار النظام
 * يوفر endpoints أساسية للشركات والمحادثات
 */

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = 3004;

// Middleware
app.use(cors());
app.use(express.json());

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4'
};

// إنشاء pool للاتصالات
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 🏥 Health Check
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    res.json({
      success: true,
      message: 'API Server is healthy',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// 🏢 جلب بيانات شركة
app.get('/api/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 [API] جلب بيانات الشركة: ${id}`);

    const [rows] = await pool.execute(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      console.log(`⚠️ [API] الشركة غير موجودة: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const company = rows[0];
    console.log(`✅ [API] تم جلب بيانات الشركة: ${company.name}`);

    res.json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        email: company.email,
        status: company.status,
        created_at: company.created_at
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب بيانات الشركة:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 💬 جلب محادثات الشركة (بيانات تجريبية)
app.get('/api/companies/:id/conversations', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 [API] جلب محادثات الشركة: ${id}`);

    // إرجاع بيانات تجريبية للتطوير
    const mockConversations = [
      {
        id: 'conv_1',
        company_id: id,
        customer_name: 'أحمد محمد',
        customer_facebook_id: 'fb_123456',
        last_message: 'مرحباً، أريد الاستفسار عن منتجاتكم',
        last_message_at: new Date().toISOString(),
        is_online: true,
        unread_count: 2,
        conversation_status: 'active',
        page_name: 'صفحة تجريبية',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'conv_2',
        company_id: id,
        customer_name: 'فاطمة علي',
        customer_facebook_id: 'fb_789012',
        last_message: 'شكراً لكم على الخدمة الممتازة',
        last_message_at: new Date(Date.now() - 3600000).toISOString(),
        is_online: false,
        unread_count: 0,
        conversation_status: 'resolved',
        page_name: 'صفحة تجريبية',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'conv_3',
        company_id: id,
        customer_name: 'محمد حسن',
        customer_facebook_id: 'fb_345678',
        last_message: 'متى سيتم توصيل الطلب؟',
        last_message_at: new Date(Date.now() - 7200000).toISOString(),
        is_online: false,
        unread_count: 1,
        conversation_status: 'pending',
        page_name: 'صفحة تجريبية',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    console.log(`✅ [API] تم جلب ${mockConversations.length} محادثة تجريبية للشركة`);

    res.json({
      success: true,
      data: mockConversations,
      count: mockConversations.length
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب المحادثات:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 📄 جلب صفحات الفيسبوك للشركة
app.get('/api/companies/:id/facebook-pages', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 [API] جلب صفحات الفيسبوك للشركة: ${id}`);

    const [rows] = await pool.execute(
      'SELECT * FROM facebook_pages WHERE company_id = ?',
      [id]
    );

    console.log(`✅ [API] تم جلب ${rows.length} صفحة فيسبوك للشركة`);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب صفحات الفيسبوك:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 🔐 تسجيل دخول الشركة
app.post('/api/companies/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 [API] محاولة تسجيل دخول: ${email}`);

    // للتطوير: قبول أي بيانات
    if (process.env.NODE_ENV !== 'production') {
      const testCompany = {
        id: 'c677b32f-fe1c-4c64-8362-a1c03406608d',
        name: 'شركة تجريبية للمحادثات',
        email: email,
        status: 'active',
        created_at: new Date().toISOString()
      };

      console.log('✅ [API] تسجيل دخول تجريبي نجح');

      res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        company: testCompany
      });
      return;
    }

    // في الإنتاج: التحقق من قاعدة البيانات
    const [rows] = await pool.execute(
      'SELECT * FROM companies WHERE email = ? AND status = "active"',
      [email.toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'بيانات تسجيل الدخول غير صحيحة'
      });
    }

    const company = rows[0];
    console.log(`✅ [API] تم تسجيل الدخول: ${company.name}`);

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        status: company.status,
        created_at: company.created_at
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

// 🛠️ إنشاء بيانات تجريبية كاملة (للتطوير)
app.post('/api/companies/create-test', async (req, res) => {
  try {
    const testCompany = {
      id: 'c677b32f-fe1c-4c64-8362-a1c03406608d',
      name: 'شركة تجريبية للمحادثات',
      email: 'test@conversations.com',
      status: 'active'
    };

    console.log('🧪 [API] إنشاء بيانات تجريبية كاملة...');

    // إنشاء الشركة
    await pool.execute(`
      INSERT INTO companies (id, name, email, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      email = VALUES(email),
      status = VALUES(status),
      updated_at = NOW()
    `, [testCompany.id, testCompany.name, testCompany.email, testCompany.status]);

    // إنشاء محادثات تجريبية (بدون قيود foreign key)
    const conversations = [
      {
        id: 'conv_1',
        customer_name: 'أحمد محمد',
        customer_facebook_id: 'fb_123456',
        last_message: 'مرحباً، أريد الاستفسار عن منتجاتكم'
      },
      {
        id: 'conv_2',
        customer_name: 'فاطمة علي',
        customer_facebook_id: 'fb_789012',
        last_message: 'شكراً لكم على الخدمة الممتازة'
      },
      {
        id: 'conv_3',
        customer_name: 'محمد حسن',
        customer_facebook_id: 'fb_345678',
        last_message: 'متى سيتم توصيل الطلب؟'
      }
    ];

    for (const conv of conversations) {
      await pool.execute(`
        INSERT INTO conversations (
          id, company_id, customer_name, customer_facebook_id,
          last_message, last_message_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        customer_name = VALUES(customer_name),
        last_message = VALUES(last_message),
        last_message_at = NOW(),
        updated_at = NOW()
      `, [conv.id, testCompany.id, conv.customer_name, conv.customer_facebook_id, conv.last_message]);
    }

    // إنشاء رسائل تجريبية
    const messages = [
      { id: 'msg_1', conversation_id: 'conv_1', message_text: 'مرحباً، أريد الاستفسار عن منتجاتكم', sender_type: 'user' },
      { id: 'msg_2', conversation_id: 'conv_1', message_text: 'أهلاً وسهلاً! كيف يمكنني مساعدتك؟', sender_type: 'page' },
      { id: 'msg_3', conversation_id: 'conv_2', message_text: 'شكراً لكم على الخدمة الممتازة', sender_type: 'user' },
      { id: 'msg_4', conversation_id: 'conv_2', message_text: 'شكراً لك! نحن سعداء بخدمتك', sender_type: 'page' },
      { id: 'msg_5', conversation_id: 'conv_3', message_text: 'متى سيتم توصيل الطلب؟', sender_type: 'user' }
    ];

    for (const msg of messages) {
      await pool.execute(`
        INSERT INTO messages (
          id, conversation_id, message_text, sender_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        message_text = VALUES(message_text),
        updated_at = NOW()
      `, [msg.id, msg.conversation_id, msg.message_text, msg.sender_type]);
    }

    console.log('✅ [API] تم إنشاء البيانات التجريبية بنجاح');

    res.json({
      success: true,
      message: 'Test data created successfully',
      data: {
        company: testCompany,
        conversations: conversations.length,
        messages: messages.length
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إنشاء البيانات التجريبية:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 💬 جلب رسائل محادثة معينة (بيانات تجريبية)
app.get('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { company_id } = req.query;

    console.log(`🔍 [API] جلب رسائل المحادثة: ${conversationId} للشركة: ${company_id}`);

    // إرجاع رسائل تجريبية حسب المحادثة
    const mockMessages = {
      'conv_1': [
        {
          id: 'msg_1',
          conversation_id: conversationId,
          message_text: 'مرحباً، أريد الاستفسار عن منتجاتكم',
          sender_type: 'user',
          message_type: 'text',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'msg_2',
          conversation_id: conversationId,
          message_text: 'أهلاً وسهلاً! كيف يمكنني مساعدتك؟',
          sender_type: 'page',
          message_type: 'text',
          created_at: new Date(Date.now() - 3500000).toISOString(),
          updated_at: new Date(Date.now() - 3500000).toISOString()
        },
        {
          id: 'msg_3',
          conversation_id: conversationId,
          message_text: 'أريد معرفة أسعار المنتجات الجديدة',
          sender_type: 'user',
          message_type: 'text',
          created_at: new Date(Date.now() - 1800000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString()
        }
      ],
      'conv_2': [
        {
          id: 'msg_4',
          conversation_id: conversationId,
          message_text: 'شكراً لكم على الخدمة الممتازة',
          sender_type: 'user',
          message_type: 'text',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'msg_5',
          conversation_id: conversationId,
          message_text: 'شكراً لك! نحن سعداء بخدمتك',
          sender_type: 'page',
          message_type: 'text',
          created_at: new Date(Date.now() - 7100000).toISOString(),
          updated_at: new Date(Date.now() - 7100000).toISOString()
        }
      ],
      'conv_3': [
        {
          id: 'msg_6',
          conversation_id: conversationId,
          message_text: 'متى سيتم توصيل الطلب؟',
          sender_type: 'user',
          message_type: 'text',
          created_at: new Date(Date.now() - 10800000).toISOString(),
          updated_at: new Date(Date.now() - 10800000).toISOString()
        }
      ]
    };

    const messages = mockMessages[conversationId] || [];

    console.log(`✅ [API] تم جلب ${messages.length} رسالة تجريبية`);

    res.json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب الرسائل:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 📤 إرسال رسالة جديدة
app.post('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message, company_id } = req.body;

    console.log(`📤 [API] إرسال رسالة للمحادثة: ${conversationId}`);

    // التحقق من أن المحادثة تنتمي للشركة
    const [conversationCheck] = await pool.execute(
      'SELECT id FROM conversations WHERE id = ? AND company_id = ?',
      [conversationId, company_id]
    );

    if (conversationCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // إدراج الرسالة الجديدة
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await pool.execute(`
      INSERT INTO messages (
        id, conversation_id, message_text, sender_type,
        created_at, updated_at
      ) VALUES (?, ?, ?, 'page', NOW(), NOW())
    `, [messageId, conversationId, message]);

    // تحديث آخر رسالة في المحادثة
    await pool.execute(`
      UPDATE conversations
      SET last_message = ?, last_message_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `, [message, conversationId]);

    console.log(`✅ [API] تم إرسال الرسالة بنجاح`);

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        id: messageId,
        conversation_id: conversationId,
        message_text: message,
        sender_type: 'page',
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إرسال الرسالة:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 🚀 تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 [API] الخادم يعمل على المنفذ ${PORT}`);
  console.log(`📍 [API] Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🏢 [API] Companies: http://localhost:${PORT}/api/companies/:id`);
  console.log(`💬 [API] Conversations: http://localhost:${PORT}/api/companies/:id/conversations`);
  console.log(`📨 [API] Messages: http://localhost:${PORT}/api/conversations/:id/messages`);
});

// معالجة الأخطاء
process.on('uncaughtException', (error) => {
  console.error('❌ [API] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [API] Unhandled Rejection at:', promise, 'reason:', reason);
});
