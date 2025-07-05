console.log('--- EXECUTING api-server.js ---');

/**
 * 🚀 خادم API بسيط لاختبار النظام
 * يوفر endpoints أساسية للشركات والمحادثات
 */

import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

// إعدادات قاعدة البيانات
const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

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

app.post('/api/companies', async (req, res) => {
  const { name, email } = req.body;
  console.log('🏢 [API] إنشاء شركة جديدة:', { name, email });

  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    const [result] = await connection.execute(
      'INSERT INTO companies (name, owner_email, settings) VALUES (?, ?, ?)',
      [name, email, JSON.stringify({})]
    );
    const [newCompany] = await connection.execute('SELECT * FROM companies WHERE id = ?', [result.insertId]);
    await connection.end();

    console.log('✅ [API] تم إنشاء الشركة:', newCompany[0].name);
    res.status(201).json({ success: true, data: newCompany[0] });
  } catch (error) {
    console.error('❌ [API] خطأ في إنشاء الشركة:', error.message);
    res.status(500).json({ success: false, message: 'فشل في إنشاء الشركة', error: error.message });
  }
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

// 🏪 Store Management Endpoints

// جلب متجر الشركة
app.get('/api/companies/:companyId/store', async (req, res) => {
  const { companyId } = req.params;
  console.log('🔍 [STORE] جلب متجر الشركة:', companyId);

  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    const [rows] = await connection.execute(
      'SELECT * FROM stores WHERE company_id = ?',
      [companyId]
    );
    await connection.end();

    if (rows.length > 0) {
      console.log('✅ [STORE] تم جلب متجر الشركة:', rows[0].name);
      res.json({ success: true, data: rows[0] });
    } else {
      console.log('🟡 [STORE] لا يوجد متجر لهذه الشركة');
      res.status(404).json({ success: false, message: 'لم يتم العثور على متجر' });
    }
  } catch (error) {
    console.error('❌ [STORE] خطأ في جلب المتجر:', error.message);
    res.status(500).json({ success: false, message: 'فشل في جلب المتجر', error: error.message });
  }
});

// إنشاء متجر جديد
app.post('/api/companies/:companyId/store', async (req, res) => {
  const { companyId } = req.params;
  const storeData = req.body;
  console.log('🏪 [STORE] إنشاء متجر جديد:', { companyId, storeData });

  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    const [result] = await connection.execute(
      `INSERT INTO stores (company_id, name, slug, description, logo_url, banner_url, theme_color, owner_email, domain, currency, timezone, is_active, is_published, settings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        storeData.name,
        storeData.slug,
        storeData.description,
        storeData.logo_url,
        storeData.banner_url,
        storeData.theme_color,
        storeData.owner_email,
        storeData.domain,
        storeData.currency,
        storeData.timezone,
        storeData.is_active,
        storeData.is_published,
        JSON.stringify(storeData.settings || {})
      ]
    );
    const [newStore] = await connection.execute('SELECT * FROM stores WHERE id = ?', [result.insertId]);
    await connection.end();

    console.log('✅ [STORE] تم إنشاء المتجر:', newStore[0].name);
    res.status(201).json({ success: true, data: newStore[0] });
  } catch (error) {
    console.error('❌ [STORE] خطأ في إنشاء المتجر:', error.message);
    res.status(500).json({ success: false, message: 'فشل في إنشاء المتجر', error: error.message });
  }
});

// تحديث متجر
app.put('/api/companies/:companyId/store', async (req, res) => {
  const { companyId } = req.params;
  const updateData = req.body;
  console.log('📝 [STORE] تحديث متجر الشركة:', { companyId, updateData });

  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    const [result] = await connection.execute(
      `UPDATE stores SET 
        name = ?, slug = ?, description = ?, logo_url = ?, banner_url = ?, theme_color = ?, owner_email = ?, domain = ?, currency = ?, timezone = ?, is_active = ?, is_published = ?, settings = ?
       WHERE company_id = ?`,
      [
        updateData.name,
        updateData.slug,
        updateData.description,
        updateData.logo_url,
        updateData.banner_url,
        updateData.theme_color,
        updateData.owner_email,
        updateData.domain,
        updateData.currency,
        updateData.timezone,
        updateData.is_active,
        updateData.is_published,
        JSON.stringify(updateData.settings || {}),
        companyId
      ]
    );
    
    if (result.affectedRows > 0) {
        const [updatedStore] = await connection.execute('SELECT * FROM stores WHERE company_id = ?', [companyId]);
        await connection.end();
        console.log('✅ [STORE] تم تحديث المتجر:', updatedStore[0].name);
        res.json({ success: true, data: updatedStore[0] });
    } else {
        await connection.end();
        res.status(404).json({ success: false, message: 'لم يتم العثور على متجر لتحديثه' });
    }
  } catch (error) {
    console.error('❌ [STORE] خطأ في تحديث المتجر:', error.message);
    res.status(500).json({ success: false, message: 'فشل في تحديث المتجر', error: error.message });
  }
});

// تفعيل/إلغاء تفعيل المتجر
app.patch('/api/companies/:companyId/store/status', async (req, res) => {
  const { companyId } = req.params;
  const { is_active } = req.body;
  console.log('🔄 [STORE] تغيير حالة المتجر:', { companyId, is_active });

  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    const [result] = await connection.execute(
      'UPDATE stores SET is_active = ? WHERE company_id = ?',
      [is_active, companyId]
    );
    await connection.end();

    if (result.affectedRows > 0) {
      console.log('✅ [STORE] تم تغيير حالة المتجر:', is_active ? 'مفعل' : 'معطل');
      res.json({ success: true, message: 'تم تغيير حالة المتجر بنجاح' });
    } else {
      res.status(404).json({ success: false, message: 'لم يتم العثور على متجر لتغيير حالته' });
    }
  } catch (error) {
    console.error('❌ [STORE] خطأ في تغيير حالة المتجر:', error.message);
    res.status(500).json({ success: false, message: 'فشل في تغيير حالة المتجر', error: error.message });
  }
});

// حذف متجر
app.delete('/api/companies/:companyId/store', async (req, res) => {
  const { companyId } = req.params;
  console.log('🗑️ [STORE] حذف متجر الشركة:', companyId);

  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('🗑️ [STORE] جارٍ حذف المتجر من قاعدة البيانات...');
    const [result] = await connection.execute(
      'DELETE FROM stores WHERE company_id = ?',
      [companyId]
    );
    await connection.end();

    console.log('🗑️ [STORE] نتيجة الحذف:', result);

    if (result.affectedRows > 0) {
      console.log('✅ [STORE] تم حذف المتجر');
      res.json({ success: true, message: 'تم حذف المتجر بنجاح' });
    } else {
      console.log('🟡 [STORE] لم يتم العثور على متجر لحذفه');
      res.status(404).json({ success: false, message: 'لم يتم العثور على متجر لحذفه' });
    }
  } catch (error) {
    console.error('❌ [STORE] خطأ في حذف المتجر:', error.message);
    res.status(500).json({ success: false, message: 'فشل في حذف المتجر', error: error.message });
  }
});

// 🛍️ إدارة المنتجات
// جلب المنتجات
app.get('/api/companies/:companyId/products', async (req, res) => {
  const { companyId } = req.params;

  console.log('🔍 [PRODUCTS] جلب المنتجات للشركة:', companyId);

  try {
    const mysql = require('mysql2/promise');

    const connection = await mysql.createConnection({
      host: '193.203.168.103',
      user: 'u384034873_conversations',
      password: '0165676135Aa@A',
      database: 'u384034873_conversations'
    });

    const [rows] = await connection.execute(
      'SELECT * FROM products WHERE company_id = ? ORDER BY created_at DESC',
      [companyId]
    );

    await connection.end();

    console.log('✅ [PRODUCTS] تم جلب', rows.length, 'منتج');

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في جلب المنتجات:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب المنتجات',
      error: error.message
    });
  }
});

// إضافة منتج جديد
app.post('/api/companies/:companyId/products', async (req, res) => {
  const { companyId } = req.params;
  const data = req.body;

  console.log('🏪 [PRODUCTS] إضافة منتج جديد للشركة:', companyId);
  console.log('📦 [PRODUCTS] اسم المنتج:', data.name);

  try {
    const mysql = require('mysql2/promise');

    const connection = await mysql.createConnection({
      host: '193.203.168.103',
      user: 'u384034873_conversations',
      password: '0165676135Aa@A',
      database: 'u384034873_conversations'
    });

    const [result] = await connection.execute(`
      INSERT INTO products (
        company_id, name, description, short_description, sku,
        price, sale_price, stock_quantity, category, brand,
        image_url, featured, weight, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      companyId,
      data.name || '',
      data.description || '',
      data.short_description || '',
      data.sku || `SKU-${Date.now()}`,
      parseFloat(data.price) || 0,
      data.sale_price ? parseFloat(data.sale_price) : null,
      parseInt(data.stock_quantity) || 0,
      data.category || '',
      data.brand || '',
      data.image_url || '',
      data.featured ? 1 : 0,
      data.weight ? parseFloat(data.weight) : null,
      data.status || 'active'
    ]);

    const [newProduct] = await connection.execute(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    await connection.end();

    console.log('✅ [PRODUCTS] تم إضافة المنتج بنجاح:', newProduct[0].name);

    res.json({
      success: true,
      data: newProduct[0],
      message: 'تم إضافة المنتج بنجاح'
    });

  } catch (error) {
    console.error('❌ [PRODUCTS] خطأ في إضافة المنتج:', error.message);
    res.status(500).json({
      success: false,
      message: 'فشل في إضافة المنتج',
      error: error.message
    });
  }
});

// 📡 Facebook Webhook - استقبال الرسائل من العملاء
app.get('/api/webhook/facebook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

  console.log('🔍 [WEBHOOK] Facebook verification request:', { mode, token, challenge });

  // التحقق من صحة الـ token (يمكن تخصيصه حسب الحاجة)
  const VERIFY_TOKEN = 'facebook_webhook_verify_token_123';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ [WEBHOOK] Facebook webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ [WEBHOOK] Facebook webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

app.post('/api/webhook/facebook', (req, res) => {
  const body = req.body;

  console.log('📨 [WEBHOOK] Facebook message received:', JSON.stringify(body, null, 2));

  if (body.object === 'page') {
    body.entry?.forEach(entry => {
      const pageId = entry.id;
      const time = entry.time;

      entry.messaging?.forEach(async (messagingEvent) => {
        const senderId = messagingEvent.sender?.id;
        const recipientId = messagingEvent.recipient?.id;
        const message = messagingEvent.message;

        if (message && senderId && recipientId) {
          console.log('💬 [WEBHOOK] Processing message:', {
            senderId,
            recipientId,
            pageId,
            messageText: message.text,
            messageId: message.mid
          });

          try {
            // إنشاء أو العثور على المحادثة
            const conversationId = `conv_${pageId}_${senderId}`;

            // حفظ الرسالة (محاكاة - في التطبيق الحقيقي ستحفظ في قاعدة البيانات)
            const messageData = {
              id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              conversation_id: conversationId,
              facebook_message_id: message.mid,
              sender_id: senderId,
              recipient_id: recipientId,
              message_text: message.text,
              message_type: 'text',
              direction: 'incoming', // رسالة واردة من العميل
              status: 'delivered',
              is_read: 0,
              sent_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            };

            console.log('💾 [WEBHOOK] Message saved:', messageData);

            // إرسال تحديث فوري عبر SSE (إذا كان متاح)
            // هنا يمكن إضافة إرسال تحديث للعملاء المتصلين

            console.log('✅ [WEBHOOK] Message processed successfully');

          } catch (error) {
            console.error('❌ [WEBHOOK] Error processing message:', error);
          }
        }
      });
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.status(404).send('Not Found');
  }
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log('🚀 [API] الخادم يعمل على المنفذ', PORT);
  console.log('📍 [API] Health Check: http://localhost:' + PORT + '/api/health');
  console.log('🏢 [API] Companies: http://localhost:' + PORT + '/api/companies/:id');
  console.log('💬 [API] Conversations: http://localhost:' + PORT + '/api/companies/:id/conversations');
  console.log('📨 [API] Messages: http://localhost:' + PORT + '/api/conversations/:id/messages');
  console.log('🏪 [API] Store Management: http://localhost:' + PORT + '/api/companies/:companyId/store');
  console.log('📡 [API] Facebook Webhook: http://localhost:' + PORT + '/api/webhook/facebook');
});
