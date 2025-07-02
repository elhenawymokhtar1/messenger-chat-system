console.log('--- EXECUTING api-server.cjs ---');

/**
 * 🚀 خادم API بسيط لاختبار النظام
 * يوفر endpoints أساسية للشركات والمحادثات
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// 🏥 Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// 🏢 جلب بيانات الشركة
app.get('/api/companies/:id', (req, res) => {
  const { id } = req.params;
  
  console.log('🔍 [API] جلب بيانات الشركة:', id);
  
  // بيانات تجريبية
  const company = {
    id: id,
    name: 'شركة تجريبية للمحادثات',
    description: 'شركة لاختبار نظام المحادثات',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString()
  };
  
  console.log('✅ [API] تم جلب بيانات الشركة:', company.name);
  
  res.json({
    success: true,
    data: company
  });
});

// 💬 جلب محادثات الشركة
app.get('/api/companies/:id/conversations', (req, res) => {
  const { id } = req.params;
  
  console.log('🔍 [API] جلب محادثات الشركة:', id);
  
  // بيانات تجريبية
  const conversations = [
    {
      id: 'conv_1',
      company_id: id,
      customer_name: 'أحمد محمد',
      customer_phone: '+966501234567',
      platform: 'whatsapp',
      status: 'active',
      last_message: 'مرحبا، أريد الاستفسار عن المنتج',
      last_message_time: '2024-01-15T10:30:00Z',
      unread_count: 2,
      created_at: '2024-01-15T09:00:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 'conv_2',
      company_id: id,
      customer_name: 'فاطمة علي',
      customer_phone: '+966507654321',
      platform: 'facebook',
      status: 'active',
      last_message: 'شكرا لكم على الخدمة الممتازة',
      last_message_time: '2024-01-15T11:15:00Z',
      unread_count: 0,
      created_at: '2024-01-15T08:30:00Z',
      updated_at: '2024-01-15T11:15:00Z'
    },
    {
      id: 'conv_3',
      company_id: id,
      customer_name: 'محمد السعيد',
      customer_phone: '+966509876543',
      platform: 'whatsapp',
      status: 'closed',
      last_message: 'تم حل المشكلة، شكرا لكم',
      last_message_time: '2024-01-14T16:45:00Z',
      unread_count: 0,
      created_at: '2024-01-14T14:00:00Z',
      updated_at: '2024-01-14T16:45:00Z'
    }
  ];
  
  console.log('✅ [API] تم جلب', conversations.length, 'محادثة تجريبية للشركة');
  
  res.json({
    success: true,
    data: conversations
  });
});

// 📨 جلب رسائل المحادثة
app.get('/api/conversations/:id/messages', (req, res) => {
  const { id } = req.params;
  const { company_id } = req.query;
  
  console.log('🔍 [API] جلب رسائل المحادثة:', id, 'للشركة:', company_id);
  
  // بيانات تجريبية
  const messages = [
    {
      id: 'msg_1',
      conversation_id: id,
      sender_type: 'customer',
      sender_name: 'أحمد محمد',
      content: 'مرحبا، أريد الاستفسار عن المنتج',
      timestamp: '2024-01-15T10:00:00Z',
      message_type: 'text',
      status: 'delivered'
    },
    {
      id: 'msg_2',
      conversation_id: id,
      sender_type: 'agent',
      sender_name: 'خدمة العملاء',
      content: 'مرحبا بك، كيف يمكنني مساعدتك؟',
      timestamp: '2024-01-15T10:15:00Z',
      message_type: 'text',
      status: 'delivered'
    },
    {
      id: 'msg_3',
      conversation_id: id,
      sender_type: 'customer',
      sender_name: 'أحمد محمد',
      content: 'أريد معرفة الأسعار والمواصفات',
      timestamp: '2024-01-15T10:30:00Z',
      message_type: 'text',
      status: 'delivered'
    }
  ];
  
  console.log('✅ [API] تم جلب', messages.length, 'رسالة تجريبية');
  
  res.json({
    success: true,
    data: messages
  });
});

// 📤 إرسال رسالة جديدة
app.post('/api/conversations/:id/messages', (req, res) => {
  const { id } = req.params;
  const { content, sender_type = 'agent', sender_name = 'خدمة العملاء' } = req.body;
  
  console.log('📤 [API] إرسال رسالة جديدة للمحادثة:', id);
  console.log('📝 [API] محتوى الرسالة:', content);
  
  // إنشاء رسالة جديدة
  const newMessage = {
    id: `msg_${Date.now()}`,
    conversation_id: id,
    sender_type,
    sender_name,
    content,
    timestamp: new Date().toISOString(),
    message_type: 'text',
    status: 'delivered'
  };
  
  console.log('✅ [API] تم إرسال الرسالة بنجاح');
  
  res.json({
    success: true,
    data: newMessage
  });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log('🚀 [API] الخادم يعمل على المنفذ', PORT);
  console.log('📍 [API] Health Check: http://localhost:' + PORT + '/api/health');
  console.log('🏢 [API] Companies: http://localhost:' + PORT + '/api/companies/:id');
  console.log('💬 [API] Conversations: http://localhost:' + PORT + '/api/companies/:id/conversations');
  console.log('📨 [API] Messages: http://localhost:' + PORT + '/api/conversations/:id/messages');
});
