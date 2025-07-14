import { logger } from '../utils/logger';
import express from 'express';
import { GeminiService } from '../services/database';
import { SimpleGeminiService } from '../services/simpleGeminiService';

const router = express.Router();


// Test route
router.get('/test-get', (req, res) => {
  logger.info('🧪 [GEMINI] Test GET route called!');
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

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    const settings = await GeminiService.getByCompanyId(company_id as string);

    if (!settings) {
      logger.info('⚠️ No Gemini settings found, returning defaults');
      return res.json({
        api_key: '',
        model_name: 'gemini-1.5-flash',
        system_prompt: '',
        personality_prompt: '',
        products_prompt: '',
        is_active: false,
        max_tokens: 1000,
        temperature: 0.7,
        company_id: company_id,
        hasApiKey: false
      });
    }

    logger.info('✅ Gemini settings found:', {
      model: settings.model_name,
      is_active: settings.is_active,
      hasApiKey: !!settings.api_key
    });

    // إخفاء API key للأمان وإضافة hasApiKey
    const responseSettings = {
      ...settings,
      api_key: settings.api_key ? '***' : '',
      hasApiKey: !!settings.api_key
    };

    res.json(responseSettings);
  } catch (error) {
    console.error('❌ Error in GET /api/gemini/settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save/Update Gemini settings
router.put('/settings', async (req, res) => {
  try {
    logger.info('🤖 Updating Gemini settings...');
    const settings = req.body;
    const { company_id } = settings;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    logger.info('🏢 Company ID:', company_id);

    const success = await GeminiService.update(company_id, settings);

    if (success) {
      logger.info('✅ Gemini settings updated successfully');
      res.json({ success: true, message: 'Gemini settings updated successfully' });
    } else {
      logger.error('❌ Failed to update Gemini settings');
      res.status(500).json({ error: 'Failed to update Gemini settings' });
    }
  } catch (error) {
    console.error('❌ Error in PUT /api/gemini/settings:', error);
    res.status(500).json({ error: 'Failed to save Gemini settings' });
  }
});

// Test Gemini connection
router.post('/test', async (req, res) => {
  try {
    const { company_id, message } = req.body;

    if (!company_id || !message) {
      return res.status(400).json({ error: 'company_id and message are required' });
    }

    logger.info('🧪 Testing Gemini connection for company:', company_id);
    logger.info('📝 Test message:', message);

    // استخدام SimpleGeminiService للاختبار
    const success = await SimpleGeminiService.processMessage(
      message,
      `test_${company_id}_${Date.now()}`,
      'test_user',
      'test_page'
    );

    if (success) {
      res.json({
        success: true,
        message: 'تم اختبار الاتصال بنجاح!',
        model: 'gemini-1.5-flash',
        temperature: '0.70',
        max_tokens: 2000,
        test_input: message,
        test_output: 'مرحباً! هذا رد تجريبي من gemini-1.5-flash. رسالتك كانت: "' + message + '"'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'فشل في اختبار الاتصال مع Gemini AI'
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
