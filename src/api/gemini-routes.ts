import { logger } from '../utils/logger';
import express from 'express';

// import { GeminiAiServiceSimplified } from '../services/geminiAiSimplified'; // تم حذفه
// import { GeminiMessageProcessor } from '../services/geminiMessageProcessor'; // تم حذفه
import { SimpleGeminiService } from '../services/simpleGeminiService';

const router = express.Router();

// تم إزالة Supabase - نستخدم MySQL الآن
// TODO: Replace with MySQL API


// Test route
router.get('/test', (req, res) => {
  logger.info('🧪 [GEMINI] Test route called!');
  res.json({ message: 'Gemini API is working!' });
});

// Gemini message processing endpoint (enhanced)
router.post('/process', async (req, res) => {
  logger.info('🤖🤖🤖 [GEMINI] PROCESS ENDPOINT HIT! 🤖🤖🤖');
  logger.info('📝 [GEMINI] Body:', JSON.stringify(req.body, null, 2));
  logger.info('🕒 [GEMINI] Timestamp:', new Date().toISOString());

  try {
    const { senderId, messageText, pageId, conversationId: customConversationId } = req.body;

    if (!senderId || !messageText || !pageId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: senderId, messageText, pageId'
      });
    }

    // استخدام conversation ID مخصص إذا تم توفيره، وإلا إنشاء مؤقت
    const conversationId = customConversationId || `temp_${senderId}_${pageId}`;
    logger.info('🆔 [GEMINI] Using conversation ID:', conversationId);

    logger.info('🚀🚀🚀 Processing message with simple processor...');
    logger.info(`📨 Message: "${messageText}"`);
    logger.info(`👤 Sender: ${senderId}`);
    logger.info(`💬 Conversation: ${conversationId}`);

    const success = await SimpleGeminiService.processMessage(
      messageText,
      conversationId,
      senderId
    );

    logger.info(`✅ SimpleGeminiService result: ${success}`);

    res.json({
      success: success,
      message: success ? 'Gemini AI processed successfully' : 'Gemini AI failed to process message'
    });

  } catch (error) {
    console.error('❌ Error in Gemini process:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Get Gemini settings
router.get('/settings', async (req, res) => {
  try {
    const { company_id } = req.query;
    logger.info('🤖 Fetching Gemini settings...', { company_id });

    // جلب الإعدادات مع فلترة حسب الشركة
    let query = supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API;

    if (company_id) {
      query = query.eq('company_id', company_id);
    } else {
      // إذا لم يتم تمرير company_id، جلب الإعدادات العامة (company_id = null)
      query = query.is('company_id', null);
    }

    const { data: settings, error } = await query
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!settings) {
      logger.info('⚠️ No Gemini settings found, returning defaults');
      return res.json({
        api_key: '',
        model: 'gemini-1.5-flash',
        prompt_template: '',
        personality_prompt: '',
        products_prompt: '',
        is_enabled: false,
        max_tokens: 1000,
        temperature: 0.7,
        company_id: company_id || null
      });
    }

    logger.info('✅ Gemini settings found:', {
      model: settings.model,
      is_enabled: settings.is_enabled,
      hasApiKey: !!settings.api_key
    });

    res.json(settings);
  } catch (error) {
    console.error('❌ Error in GET /api/gemini/settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save Gemini settings
router.post('/settings', async (req, res) => {
  try {
    logger.info('🤖 Saving Gemini settings...');
    const settings = req.body;
    const { company_id } = settings;

    logger.info('🏢 Company ID:', company_id);

    // تحضير البيانات للحفظ
    const settingsData = {
      ...settings,
      company_id: company_id || null,
      updated_at: new Date().toISOString()
    };

    // حفظ الإعدادات مع ربطها بالشركة
    const { data: savedSettings, error } = await supabase
      // TODO: Replace with MySQL API
      .upsert(settingsData)
      // TODO: Replace with MySQL API
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    logger.info('✅ Gemini settings saved successfully');
    res.json(savedSettings);
  } catch (error) {
    console.error('❌ Error in POST /api/gemini/settings:', error);
    res.status(500).json({ error: 'Failed to save Gemini settings' });
  }
});

// Test Gemini connection
router.post('/test', async (req, res) => {
  try {
    const { api_key } = req.body;

    if (!api_key) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // اختبار الاتصال مباشرة مع Gemini API
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${api_key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'مرحبا، هذا اختبار للاتصال' }] }]
        })
      }
    );

    if (testResponse.ok) {
      res.json({
        success: true,
        message: 'تم الاتصال بـ Gemini AI بنجاح'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'فشل في الاتصال بـ Gemini API'
      });
    }
  } catch (error) {
    console.error('❌ Error in POST /api/gemini/test:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during test'
    });
  }
});

export default router;
