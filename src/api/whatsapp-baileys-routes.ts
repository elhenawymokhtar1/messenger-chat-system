import express from 'express';
import multer from 'multer';
import { BaileysWhatsAppService } from '../services/baileysWhatsAppService';

const router = express.Router();

// إعداد Multer لرفع الملفات
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // السماح بأنواع الملفات المختلفة
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'));
    }
  }
});

// إعداد MySQL
import { WhatsAppService } from '../services/database';
import { BaileysWhatsAppService } from '../services/baileysWhatsAppService';

/**
 * بدء خدمة WhatsApp
 */
router.post('/start', async (req, res) => {
  try {
    console.log('🚀 [API] بدء خدمة WhatsApp Baileys...');

    await BaileysWhatsAppService.initialize();

    res.json({
      success: true,
      message: 'تم بدء خدمة WhatsApp بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في بدء WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في بدء خدمة WhatsApp'
    });
  }
});

/**
 * الحصول على حالة الاتصال
 */
router.get('/status', async (req, res) => {
  try {
    const connectionState = BaileysWhatsAppService.getConnectionState();
    const qrCode = BaileysWhatsAppService.getQRCode();

    res.json({
      success: true,
      isConnected: connectionState.isConnected,
      state: connectionState.state,
      qrCode: qrCode
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب حالة الاتصال:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب حالة الاتصال'
    });
  }
});

/**
 * إرسال رسالة
 */
router.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'رقم الهاتف والرسالة مطلوبان'
      });
    }

    const success = await BaileysWhatsAppService.sendMessage(phoneNumber, message);

    if (success) {
      res.json({
        success: true,
        message: 'تم إرسال الرسالة بنجاح'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'فشل في إرسال الرسالة'
      });
    }
  } catch (error) {
    console.error('❌ [API] خطأ في إرسال الرسالة:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في إرسال الرسالة'
    });
  }
});

/**
 * إرسال ملف
 */
router.post('/send-file', upload.single('file'), async (req, res) => {
  try {
    const { phoneNumber, caption } = req.body;
    const file = req.file;

    if (!phoneNumber || !file) {
      return res.status(400).json({
        success: false,
        error: 'رقم الهاتف والملف مطلوبان'
      });
    }

    console.log(`📎 [API] إرسال ملف إلى ${phoneNumber}:`, {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      caption: caption
    });

    // حفظ الملف مؤقتاً للعرض
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), 'uploads');

    // إنشاء مجلد uploads إذا لم يكن موجود
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, file.originalname);
    fs.writeFileSync(filePath, file.buffer);

    // إرسال الملف عبر WhatsApp
    const success = await BaileysWhatsAppService.sendFile(
      phoneNumber,
      file.buffer,
      file.originalname,
      file.mimetype,
      caption
    );

    if (success) {
      res.json({
        success: true,
        message: 'تم إرسال الملف بنجاح',
        fileUrl: `/api/whatsapp-baileys/files/${file.originalname}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'فشل في إرسال الملف'
      });
    }
  } catch (error) {
    console.error('❌ [API] خطأ في إرسال الملف:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ في إرسال الملف'
    });
  }
});

/**
 * خدمة الملفات المرفوعة
 */
router.get('/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(process.cwd(), 'uploads', filename);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({
        success: false,
        error: 'الملف غير موجود'
      });
    }
  } catch (error) {
    console.error('❌ [API] خطأ في خدمة الملف:', error);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم'
    });
  }
});

/**
 * قطع الاتصال
 */
router.post('/disconnect', async (req, res) => {
  try {
    await BaileysWhatsAppService.disconnect();

    res.json({
      success: true,
      message: 'تم قطع الاتصال بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في قطع الاتصال:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في قطع الاتصال'
    });
  }
});

/**
 * إعادة تشغيل WhatsApp
 */
router.post('/restart', async (req, res) => {
  try {
    console.log('🔄 [API] طلب إعادة تشغيل WhatsApp...');
    await BaileysWhatsAppService.restart();

    res.json({
      success: true,
      message: 'تم إعادة تشغيل WhatsApp بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إعادة تشغيل WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إعادة تشغيل WhatsApp: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

/**
 * إصلاح مشاكل الاتصال
 */
router.post('/fix-connection', async (req, res) => {
  try {
    console.log('🔧 [API] طلب إصلاح مشاكل الاتصال...');
    await BaileysWhatsAppService.fixConnectionIssues();

    res.json({
      success: true,
      message: 'تم إصلاح مشاكل الاتصال - يمكن الآن إعادة التشغيل'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إصلاح مشاكل الاتصال:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إصلاح مشاكل الاتصال: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

/**
 * الحصول على الرسائل الأخيرة
 */
router.get('/messages', async (req, res) => {
  try {
    console.log('📱 [API] جلب رسائل WhatsApp...');

    // جلب آخر 50 رسالة من WhatsApp
    const messages = await WhatsAppService.getRecentMessages(50);

    console.log(`📱 [API] تم جلب ${messages.length} رسالة WhatsApp`);

    res.json({
      success: true,
      messages: messages
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب الرسائل:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الرسائل'
    });
  }
});

/**
 * الحصول على الإحصائيات
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 [API] جلب إحصائيات WhatsApp...');

    // جلب الإحصائيات من قاعدة البيانات
    const stats = await WhatsAppService.getStats();

    console.log('📊 [API] إحصائيات WhatsApp:', stats);

    res.json({
      success: true,
      stats: {
        totalMessages: stats.totalMessages || 0,
        todayMessages: stats.todayMessages || 0,
        activeChats: stats.activeChats || 0
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب الإحصائيات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الإحصائيات'
    });
  }
});

/**
 * إرسال رسالة WhatsApp
 */
router.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message, contactName } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'رقم الهاتف والرسالة مطلوبان'
      });
    }

    console.log(`📤 [API] إرسال رسالة WhatsApp إلى: ${phoneNumber}`);

    // حفظ الرسالة في قاعدة البيانات كرسالة صادرة
    const messageData = {
      message_id: `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone_number: phoneNumber,
      contact_name: contactName || phoneNumber,
      message_text: message,
      message_type: 'outgoing' as const
    };

    const success = await WhatsAppService.saveMessage(messageData);

    if (success) {
      console.log(`✅ [API] تم حفظ رسالة WhatsApp الصادرة`);

      // إرسال فعلي عبر Baileys
      try {
        const sent = await BaileysWhatsAppService.sendMessage(phoneNumber, message);
        if (sent) {
          console.log('📱 [API] تم إرسال الرسالة عبر Baileys بنجاح');
          res.json({
            success: true,
            message: 'تم إرسال الرسالة بنجاح',
            messageId: messageData.message_id,
            sent: true
          });
        } else {
          console.log('⚠️ [API] فشل إرسال الرسالة عبر Baileys');
          res.json({
            success: true,
            message: 'تم حفظ الرسالة ولكن فشل الإرسال (WhatsApp غير متصل)',
            messageId: messageData.message_id,
            sent: false
          });
        }
      } catch (error) {
        console.error('❌ [API] خطأ في إرسال الرسالة عبر Baileys:', error);
        res.json({
          success: true,
          message: 'تم حفظ الرسالة ولكن فشل الإرسال',
          messageId: messageData.message_id,
          sent: false,
          error: error.message
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'فشل في حفظ الرسالة'
      });
    }
  } catch (error) {
    console.error('❌ [API] خطأ في إرسال رسالة WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إرسال الرسالة'
    });
  }
});

/**
 * الحصول على جهات الاتصال
 */
router.get('/contacts', async (req, res) => {
  try {
    console.log('📞 [API] جلب جهات الاتصال...');

    // جلب أرقام فريدة من رسائل WhatsApp مع آخر رسالة
    const messages = await WhatsAppService.getContacts();

    // تجميع جهات الاتصال الفريدة
    const contactsMap = new Map();

    messages?.forEach(msg => {
      if (!contactsMap.has(msg.phone_number)) {
        contactsMap.set(msg.phone_number, {
          phone: msg.phone_number,
          name: msg.contact_name || msg.phone_number,
          lastMessage: msg.message_text || 'لا توجد رسائل',
          lastMessageTime: msg.created_at,
          unreadCount: 0, // يمكن تحسينه لاحقاً
          isOnline: false // يمكن تحسينه لاحقاً
        });
      }
    });

    const contacts = Array.from(contactsMap.values());

    console.log(`✅ [API] تم جلب ${contacts.length} جهة اتصال`);

    res.json({
      success: true,
      contacts: contacts
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب جهات الاتصال:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب جهات الاتصال'
    });
  }
});

/**
 * الحصول على معلومات جهة اتصال معينة
 */
router.get('/contact/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    console.log(`📞 [API] جلب معلومات جهة الاتصال WhatsApp: ${phoneNumber}`);

    // جلب آخر رسالة لهذا الرقم للحصول على الاسم
    const lastMessage = await WhatsAppService.getContact(phoneNumber);

    const contact = {
      phone: phoneNumber,
      name: lastMessage?.contact_name || phoneNumber,
      isOnline: false, // يمكن تحسينه لاحقاً
      lastSeen: lastMessage?.created_at || null
    };

    console.log(`📞 [API] تم جلب معلومات جهة الاتصال WhatsApp: ${contact.name}`);

    res.json({
      success: true,
      contact: contact
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب معلومات جهة الاتصال:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب معلومات جهة الاتصال'
    });
  }
});

/**
 * الحصول على محادثة معينة
 */
router.get('/conversation/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    console.log(`📱 [API] جلب محادثة WhatsApp للرقم: ${phoneNumber}`);

    const messages = await WhatsAppService.getConversation(phoneNumber);
    console.log(`📱 [API] تم جلب ${messages.length} رسالة WhatsApp للرقم ${phoneNumber}`);

    res.json({
      success: true,
      messages: messages || []
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب المحادثة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب المحادثة'
    });
  }
});

/**
 * حذف رسالة
 */
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const { error } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API
      .eq('message_id', messageId);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'تم حذف الرسالة بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في حذف الرسالة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في حذف الرسالة'
    });
  }
});

/**
 * تحديث إعدادات WhatsApp
 */
router.put('/settings', async (req, res) => {
  try {
    const { auto_reply_enabled, welcome_message } = req.body;
    
    // TODO: Replace with MySQL API
    console.log('تحديث إعدادات WhatsApp:', { auto_reply_enabled, welcome_message });

    // تم تحديث الإعدادات بنجاح (mock)
    
    res.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في تحديث الإعدادات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تحديث الإعدادات'
    });
  }
});

/**
 * الحصول على إعدادات WhatsApp
 */
router.get('/settings', async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API
      .eq('id', 1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    res.json({
      success: true,
      settings: settings || {
        auto_reply_enabled: true,
        welcome_message: 'مرحباً بك! كيف يمكنني مساعدتك؟'
      }
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب الإعدادات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الإعدادات'
    });
  }
});

/**
 * الحصول على إعدادات الذكاء الاصطناعي لـ WhatsApp
 */
router.get('/ai-settings', async (req, res) => {
  try {
    console.log('🤖 [API] جلب إعدادات WhatsApp AI...');

    const { data: settings, error } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [API] خطأ في قاعدة البيانات:', error);
      throw error;
    }

    if (!settings) {
      console.log('📝 [API] لا توجد إعدادات، إرجاع الإعدادات الافتراضية...');
      // إرجاع إعدادات افتراضية
      const defaultSettings = {
        is_enabled: false,
        use_existing_prompt: true,
        custom_prompt: 'أنت مساعد ذكي لمتجر WhatsApp. اسمك سارة وأنت بائعة لطيفة ومتفهمة.\n\n🎯 مهامك:\n- مساعدة العملاء في اختيار المنتجات\n- الرد على الاستفسارات بطريقة ودودة\n- إنشاء الطلبات عند اكتمال البيانات\n- تقديم معلومات المنتجات والأسعار\n\n💬 أسلوب التحدث:\n- استخدمي اللهجة المصرية البسيطة\n- كوني ودودة ومساعدة\n- اشرحي بوضوح ووضوح\n\n🛒 للطلبات:\n- اجمعي: الاسم، الهاتف، العنوان، المنتج، المقاس، اللون\n- عند اكتمال البيانات: [CREATE_ORDER: البيانات]\n\n📱 للتواصل:\n- واتساب: 01032792040\n- المتجر: /shop\n- السلة: /cart',
        api_key: '',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        max_tokens: 1000,
        can_access_orders: true,
        can_access_products: true,
        auto_reply_enabled: true
      };

      return res.json({
        success: true,
        settings: defaultSettings
      });
    }

    console.log('✅ [API] تم جلب إعدادات WhatsApp AI بنجاح');
    res.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    console.error('❌ [API] خطأ في جلب إعدادات WhatsApp AI:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الإعدادات: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

/**
 * حفظ إعدادات الذكاء الاصطناعي لـ WhatsApp
 */
router.post('/ai-settings', async (req, res) => {
  try {
    console.log('💾 [API] حفظ إعدادات WhatsApp AI...');
    console.log('📝 [API] البيانات المرسلة:', req.body);

    const settings = req.body;

    // التحقق من وجود سجل موجود
    const { data: existingSettings, error: selectError } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API
      .limit(1)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    let result;
    if (existingSettings) {
      // تحديث السجل الموجود
      console.log('🔄 [API] تحديث السجل الموجود...');
      // TODO: Replace with MySQL API - تحديث السجل الموجود
      console.log('🔄 [API] تحديث السجل الموجود...');
    } else {
      // إنشاء سجل جديد
      console.log('➕ [API] إنشاء سجل جديد...');
      // TODO: Replace with MySQL API - إنشاء سجل جديد
    }

    // تم حفظ الإعدادات بنجاح (mock)

    console.log('✅ [API] تم حفظ إعدادات WhatsApp AI بنجاح');

    res.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في حفظ إعدادات WhatsApp AI:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في حفظ الإعدادات: ' + (error.message || 'خطأ غير معروف')
    });
  }
});

/**
 * اختبار الذكاء الاصطناعي لـ WhatsApp
 */
router.post('/test-ai', async (req, res) => {
  try {
    console.log('🧪 [API] اختبار WhatsApp AI...');

    const { message, settings } = req.body;

    if (!message || !settings) {
      return res.status(400).json({
        success: false,
        error: 'الرسالة والإعدادات مطلوبة'
      });
    }

    // استيراد خدمة WhatsApp AI
    const { WhatsAppAIService } = await import('../services/whatsappAIService');

    const success = await WhatsAppAIService.testAI(message, settings);

    res.json({
      success: success,
      message: success ? 'نجح الاختبار' : 'فشل الاختبار'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في اختبار WhatsApp AI:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في اختبار الذكاء الاصطناعي'
    });
  }
});

/**
 * إعادة تحميل إعدادات WhatsApp AI
 */
router.post('/reload-settings', async (req, res) => {
  try {
    console.log('🔄 [API] إعادة تحميل إعدادات WhatsApp AI...');

    // استيراد خدمة WhatsApp AI
    const { WhatsAppAIService } = await import('../services/whatsappAIService');

    await WhatsAppAIService.reloadSettings();

    res.json({
      success: true,
      message: 'تم إعادة تحميل الإعدادات بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إعادة تحميل الإعدادات:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إعادة تحميل الإعدادات'
    });
  }
});

/**
 * فحص صحة الاتصال
 */
router.get('/health', async (req, res) => {
  try {
    const health = BaileysWhatsAppService.getConnectionHealth();

    res.json({
      success: true,
      health: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [API] خطأ في فحص صحة الاتصال:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في فحص صحة الاتصال'
    });
  }
});

/**
 * إضافة بيانات تجريبية لـ WhatsApp
 */
router.post('/add-sample-data', async (req, res) => {
  try {
    console.log('📱 [API] إضافة بيانات تجريبية لـ WhatsApp...');

    const sampleMessages = [
      // محادثة أحمد محمد
      {
        message_id: 'whatsapp_sample_1_' + Date.now(),
        phone_number: '+201234567890',
        contact_name: 'أحمد محمد',
        message_text: 'مرحباً، أريد الاستفسار عن المنتجات المتوفرة',
        message_type: 'incoming' as const
      },
      {
        message_id: 'whatsapp_sample_2_' + Date.now(),
        phone_number: '+201234567890',
        contact_name: 'أحمد محمد',
        message_text: 'مرحباً بك! يسعدنا خدمتك. لدينا مجموعة متنوعة من المنتجات عالية الجودة',
        message_type: 'outgoing' as const
      },

      // محادثة فاطمة علي
      {
        message_id: 'whatsapp_sample_3_' + Date.now(),
        phone_number: '+201987654321',
        contact_name: 'فاطمة علي',
        message_text: 'هل يمكنني معرفة أسعار الأحذية النسائية؟',
        message_type: 'incoming' as const
      },
      {
        message_id: 'whatsapp_sample_4_' + Date.now(),
        phone_number: '+201987654321',
        contact_name: 'فاطمة علي',
        message_text: 'بالطبع! أسعار الأحذية النسائية تبدأ من 299 جنيه وتصل إلى 899 جنيه حسب النوع والجودة',
        message_type: 'outgoing' as const
      },

      // محادثة محمد حسن
      {
        message_id: 'whatsapp_sample_5_' + Date.now(),
        phone_number: '+201555666777',
        contact_name: 'محمد حسن',
        message_text: 'متى يمكنني استلام الطلب؟',
        message_type: 'incoming' as const
      },
      {
        message_id: 'whatsapp_sample_6_' + Date.now(),
        phone_number: '+201555666777',
        contact_name: 'محمد حسن',
        message_text: 'سيتم تسليم طلبك خلال 2-3 أيام عمل. سنرسل لك رسالة تأكيد مع رقم التتبع',
        message_type: 'outgoing' as const
      },

      // محادثة جديدة - سارة أحمد
      {
        message_id: 'whatsapp_sample_7_' + Date.now(),
        phone_number: '+201111222333',
        contact_name: 'سارة أحمد',
        message_text: 'هل لديكم خدمة توصيل مجاني؟',
        message_type: 'incoming' as const
      },
      {
        message_id: 'whatsapp_sample_8_' + Date.now(),
        phone_number: '+201111222333',
        contact_name: 'سارة أحمد',
        message_text: 'نعم! التوصيل مجاني للطلبات أكثر من 500 جنيه داخل القاهرة والجيزة',
        message_type: 'outgoing' as const
      },

      // محادثة جديدة - كريم محمود
      {
        message_id: 'whatsapp_sample_9_' + Date.now(),
        phone_number: '+201444555666',
        contact_name: 'كريم محمود',
        message_text: 'أريد إرجاع منتج اشتريته الأسبوع الماضي',
        message_type: 'incoming' as const
      },
      {
        message_id: 'whatsapp_sample_10_' + Date.now(),
        phone_number: '+201444555666',
        contact_name: 'كريم محمود',
        message_text: 'بالطبع يمكنك الإرجاع خلال 14 يوم. يرجى إرسال صورة الفاتورة ورقم الطلب',
        message_type: 'outgoing' as const
      }
    ];

    let successCount = 0;
    for (const message of sampleMessages) {
      const success = await WhatsAppService.saveMessage(message);
      if (success) successCount++;
    }

    console.log(`✅ [API] تم إضافة ${successCount}/${sampleMessages.length} رسالة تجريبية لـ WhatsApp`);

    res.json({
      success: true,
      message: `تم إضافة ${successCount} رسالة تجريبية بنجاح`,
      added: successCount,
      total: sampleMessages.length
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إضافة البيانات التجريبية:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إضافة البيانات التجريبية'
    });
  }
});

/**
 * إيقاف خدمة WhatsApp وتنظيف الجلسة
 */
router.post('/stop', async (req, res) => {
  try {
    console.log('🛑 [API] إيقاف خدمة WhatsApp...');

    await BaileysWhatsAppService.disconnect();

    console.log('✅ [API] تم إيقاف خدمة WhatsApp بنجاح');

    res.json({
      success: true,
      message: 'تم إيقاف خدمة WhatsApp بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إيقاف خدمة WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إيقاف خدمة WhatsApp'
    });
  }
});

/**
 * إعادة تعيين وتنظيف جلسة WhatsApp
 */
router.post('/reset', async (req, res) => {
  try {
    console.log('🔄 [API] إعادة تعيين جلسة WhatsApp...');

    // إيقاف الخدمة أولاً
    await BaileysWhatsAppService.disconnect();

    // تنظيف الجلسة
    await BaileysWhatsAppService.fixConnectionIssues();

    // انتظار قليل
    await new Promise(resolve => setTimeout(resolve, 2000));

    // بدء جديد
    await BaileysWhatsAppService.initialize();

    console.log('✅ [API] تم إعادة تعيين جلسة WhatsApp بنجاح');

    res.json({
      success: true,
      message: 'تم إعادة تعيين جلسة WhatsApp بنجاح'
    });
  } catch (error) {
    console.error('❌ [API] خطأ في إعادة تعيين جلسة WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إعادة تعيين جلسة WhatsApp'
    });
  }
});

export default router;
