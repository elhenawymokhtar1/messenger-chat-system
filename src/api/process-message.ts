import { logger } from '../utils/logger';
// API endpoint لمعالجة الرسائل من Webhook Server - النظام البسيط الجديد
import { SimpleGeminiService } from '../services/simpleGeminiService';


// تم إزالة Supabase - نستخدم MySQL الآن
// TODO: Replace with MySQL API


export interface ProcessMessageRequest {
  senderId: string;
  messageText: string;
  messageId?: string;
  pageId: string;
  timestamp: number;
  imageUrl?: string;
  senderType?: 'customer' | 'page';
  isEcho?: boolean;
}

export interface ProcessMessageResponse {
  success: boolean;
  message: string;
  autoReplyWasSent?: boolean;
  conversationId?: string;
}

// معالج الرسائل الواردة من Webhook
export async function processIncomingMessage(
  request: ProcessMessageRequest
): Promise<ProcessMessageResponse> {
  const { senderId, messageText, messageId, pageId, timestamp, imageUrl, senderType = 'customer', isEcho = false } = request;

  // إصلاح ترميز النص العربي
  let fixedMessageText = messageText;
  try {
    // محاولة إصلاح الترميز إذا كان مُشوه
    if (messageText && messageText.includes('?')) {
      // تجربة فك الترميز
      const buffer = Buffer.from(messageText, 'latin1');
      const decodedText = buffer.toString('utf8');
      if (decodedText && !decodedText.includes('?')) {
        fixedMessageText = decodedText;
        logger.info(`🔧 Fixed encoding: "${messageText}" → "${fixedMessageText}"`);
      }
    }
  } catch (error) {
    logger.info('⚠️ Could not fix encoding, using original text');
  }

  try {
    const messageTypeLabel = senderType === 'page' ? 'page admin' : 'customer';
    logger.info(`📨 Processing message from ${messageTypeLabel} ${senderId}: "${messageText}"`);
    logger.info(`📋 Message details:`, { senderId, messageId, pageId, senderType, isEcho, timestamp });

    // الحصول على المحادثة (بسيط وموحد)
    logger.info('📥 Getting/creating conversation...');
    const senderName = await getSenderName(senderId, pageId) || `User ${senderId}`;
    const conversationId = await getOrCreateConversation(senderId, senderName, pageId);

    if (!conversationId) {
      throw new Error('Failed to create or get conversation');
    }

    logger.info(`💾 Saving message to conversation: ${conversationId}`);

    // حفظ الرسالة الواردة (تجاهل المكررة)
    try {
      await saveIncomingMessage(conversationId, fixedMessageText, messageId, timestamp, imageUrl, senderType, pageId);
    } catch (error: any) {
      if (error.code === '23505') {
        logger.info('⚠️ Duplicate message ignored:', messageId);
        return {
          success: true,
          message: 'Duplicate message ignored',
          autoReplyWasSent: false,
          conversationId
        };
      }
      throw error;
    }

    // معالجة الرد الآلي الذكي (فقط للرسائل من العملاء)
    let autoReplyWasSent = false;
    if (senderType === 'customer' && !isEcho) {
      logger.info('🚀 Starting smart auto reply processing...');
      autoReplyWasSent = await SimpleGeminiService.processMessage(
        fixedMessageText,
        conversationId,
        senderId,
        pageId
      );
      logger.info('🤖 Smart auto reply result:', autoReplyWasSent);
    } else {
      logger.info('📤 Message from page admin - no auto reply needed');
    }

    // تحديث المحادثة
    await updateConversation(conversationId, fixedMessageText, senderType);

    logger.info(`✅ Message processed successfully for conversation: ${conversationId}`);

    return {
      success: true,
      message: 'Message processed successfully',
      autoReplyWasSent,
      conversationId
    };

  } catch (error) {
    console.error('❌ Error processing incoming message:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// حفظ الرسالة الواردة في قاعدة البيانات
async function saveIncomingMessage(
  conversationId: string,
  messageText: string,
  messageId?: string,
  timestamp?: number,
  imageUrl?: string,
  senderType: 'customer' | 'page' = 'customer',
  pageId?: string
): Promise<void> {
  try {
    // إذا كانت هناك صورة، أضفها للمحتوى
    let content = messageText;
    if (imageUrl) {
      content = messageText ? `${messageText}\n[صورة: ${imageUrl}]` : `[صورة: ${imageUrl}]`;
      logger.info('📸 Saving message with image:', imageUrl);
    }

    // TODO: Replace with MySQL API - حفظ الرسالة الواردة
    console.log('💾 حفظ الرسالة الواردة:', { messageData });

    // تم حفظ الرسالة بنجاح (mock)

    const messageTypeLabel = senderType === 'page' ? 'page admin' : 'customer';
    logger.info(`✅ ${messageTypeLabel} message saved to database`);
  } catch (error) {
    console.error('Error in saveIncomingMessage:', error);
    throw error;
  }
}

// تحديث المحادثة
async function updateConversation(conversationId: string, lastMessage: string, senderType: 'customer' | 'page' = 'customer'): Promise<void> {
  try {
    // أولاً، احصل على العدد الحالي للرسائل غير المقروءة
    const { data: conversation, error: fetchError } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      console.error('Error fetching conversation:', fetchError);
      throw fetchError;
    }

    const currentUnreadCount = conversation?.unread_count || 0;

    // زيادة عدد الرسائل غير المقروءة فقط للرسائل من العملاء
    const newUnreadCount = senderType === 'customer' ? currentUnreadCount + 1 : currentUnreadCount;

    // تحديث المحادثة
    const { error: updateError } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API.toISOString(),
        unread_count: newUnreadCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      throw updateError;
    }

    logger.info('✅ Conversation updated');
  } catch (error) {
    console.error('Error in updateConversation:', error);
    throw error;
  }
}

// الحصول على اسم المرسل من Facebook API وتحديث قاعدة البيانات
async function getSenderName(senderId: string, pageId: string): Promise<string | null> {
  try {
    const { FacebookApiService } = await import('../services/facebookApi');
    const pageSettings = await FacebookApiService.getPageSettings(pageId);

    if (pageSettings && pageSettings.access_token) {
      const facebookService = new FacebookApiService(pageSettings.access_token);
      const userInfo = await facebookService.getUserInfo(senderId, pageSettings.access_token);

      if (userInfo && userInfo.name) {
        logger.info(`✅ Got real user name: ${userInfo.name} for ID: ${senderId}`);

        // تحديث الاسم في قاعدة البيانات فوراً إذا كان مختلف
        await updateUserNameInDatabase(senderId, userInfo.name);

        return userInfo.name;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting sender name:', error);
    return null;
  }
}

// تحديث اسم المستخدم في قاعدة البيانات
async function updateUserNameInDatabase(customerFacebookId: string, realName: string): Promise<void> {
  try {
    // البحث عن المحادثة الموجودة
    const { data: conversation, error: fetchError } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API
      .eq('customer_facebook_id', customerFacebookId)
      .single();

    if (fetchError) {
      logger.info(`⚠️ No existing conversation found for ${customerFacebookId}`);
      return;
    }

    // تحديث الاسم إذا كان مختلف
    if (conversation.customer_name !== realName) {
      const { error: updateError } = await supabase
        // TODO: Replace with MySQL API
        // TODO: Replace with MySQL API.toISOString()
        })
        .eq('id', conversation.id);

      if (updateError) {
        console.error(`❌ Error updating user name for ${customerFacebookId}:`, updateError);
      } else {
        logger.info(`🔄 Updated user name: ${conversation.customer_name} → ${realName}`);
      }
    }
  } catch (error) {
    console.error('Error updating user name in database:', error);
  }
}

// إنشاء محادثة جديدة إذا لم تكن موجودة (بسيط)
async function getOrCreateConversation(
  customerFacebookId: string,
  customerName: string,
  pageId: string
): Promise<string | null> {
  try {
    // البحث عن محادثة موجودة
    const { data: existingConversation, error: searchError } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API
      .eq('customer_facebook_id', customerFacebookId)
      .maybeSingle();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error searching for conversation:', searchError);
      return null;
    }

    if (existingConversation) {
      return existingConversation.id;
    }

    // جلب معلومات الصفحة والشركة
    const { data: pageInfo, error: pageError } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API
      .eq('page_id', pageId)
      .single();

    if (pageError) {
      console.error('Error fetching page info:', pageError);
      // استخدام قيم افتراضية إذا لم نجد الصفحة
    }

    // إنشاء محادثة جديدة مع ربطها بالشركة
    const { data: newConversation, error: createError } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API.toISOString(),
        is_online: true,
        unread_count: 0
      })
      // TODO: Replace with MySQL API
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      return null;
    }

    return newConversation.id;
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    return null;
  }
}

// تصدير دالة مساعدة للتحقق من صحة الطلب
export function validateMessageRequest(request: any): request is ProcessMessageRequest {
  return (
    typeof request.senderId === 'string' &&
    typeof request.messageText === 'string' &&
    typeof request.pageId === 'string' &&
    typeof request.timestamp === 'number'
  );
}
