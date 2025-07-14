// 🗄️ طبقة الوصول لقاعدة البيانات (Database Access Layer)
import { executeQuery, executeInsert, executeUpdate, executeTransaction } from '../config/mysql';
import crypto from 'crypto';

// ===================================
// 🏢 خدمات الشركات
// ===================================

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country: string;
  password_hash: string;
  is_verified: boolean;
  verification_token?: string;
  status: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export class CompanyService {
  /**
   * الحصول على شركة بالمعرف
   */
  static async getById(id: string): Promise<Company | null> {
    const companies = await executeQuery<Company>(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );
    return companies[0] || null;
  }

  /**
   * الحصول على شركة بالإيميل
   */
  static async getByEmail(email: string): Promise<Company | null> {
    const companies = await executeQuery<Company>(
      'SELECT * FROM companies WHERE email = ?',
      [email]
    );
    return companies[0] || null;
  }

  /**
   * الحصول على جميع الشركات
   */
  static async getAll(): Promise<Company[]> {
    const companies = await executeQuery<Company>(
      'SELECT * FROM companies ORDER BY created_at DESC'
    );
    return companies || [];
  }

  /**
   * إنشاء شركة جديدة
   */
  static async create(data: Partial<Company>): Promise<string> {
    const result = await executeInsert(`
      INSERT INTO companies (
        id, name, email, phone, website, address, city, country,
        password_hash, is_verified, status, subscription_status
      ) VALUES (
        UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `, [
      data.name,
      data.email,
      data.phone || null,
      data.website || null,
      data.address || null,
      data.city || null,
      data.country || 'Egypt',
      data.password_hash,
      data.is_verified || false,
      data.status || 'active',
      data.subscription_status || 'trial'
    ]);

    return result.insertId;
  }

  /**
   * تحديث شركة
   */
  static async update(id: string, data: Partial<Company>): Promise<boolean> {
    const result = await executeUpdate(`
      UPDATE companies SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        website = COALESCE(?, website),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        country = COALESCE(?, country),
        is_verified = COALESCE(?, is_verified),
        status = COALESCE(?, status),
        subscription_status = COALESCE(?, subscription_status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      data.name,
      data.phone,
      data.website,
      data.address,
      data.city,
      data.country,
      data.is_verified,
      data.status,
      data.subscription_status,
      id
    ]);

    return result.affectedRows > 0;
  }
}

// ===================================
// 📱 خدمات إعدادات فيسبوك
// ===================================

export interface FacebookSettings {
  id: string;
  company_id: string;
  page_id: string;
  page_name: string;
  access_token: string;
  is_active: boolean;
  webhook_verified: boolean;
  total_messages: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export class FacebookService {
  /**
   * الحصول على إعدادات فيسبوك للشركة من الجدول الموحد
   */
  static async getByCompanyId(companyId: string): Promise<FacebookSettings[]> {
    // استخدام الجدول الموحد الجديد
    const pages = await executeQuery<FacebookSettings>(
      'SELECT * FROM facebook_pages_unified WHERE company_id = ? AND is_active = TRUE ORDER BY created_at DESC',
      [companyId]
    );

    console.log(`📊 FacebookService: Found ${pages.length} pages for company ${companyId} from unified table`);

    return pages;
  }

  // تم حذف دالة getByCompanyIdLegacy - لم تعد مستخدمة

  /**
   * الحصول على إعدادات بمعرف الصفحة من الجدول الموحد
   */
  static async getByPageId(pageId: string): Promise<FacebookSettings | null> {
    const settings = await executeQuery<FacebookSettings>(
      'SELECT * FROM facebook_pages_unified WHERE page_id = ?',
      [pageId]
    );
    return settings[0] || null;
  }

  /**
   * الحصول على إعدادات بمعرف الصفحة والشركة من الجدول الموحد
   */
  static async getByPageIdAndCompany(pageId: string, companyId: string): Promise<FacebookSettings | null> {
    const settings = await executeQuery<FacebookSettings>(
      'SELECT * FROM facebook_pages_unified WHERE page_id = ? AND company_id = ?',
      [pageId, companyId]
    );
    return settings[0] || null;
  }

  // تم حذف دالة getByPageIdLegacy - لم تعد مستخدمة

  /**
   * إنشاء إعدادات فيسبوك جديدة في الجدول الموحد
   */
  static async create(data: Partial<FacebookSettings>): Promise<string> {
    const id = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await executeQuery(`
      INSERT INTO facebook_pages_unified (
        id, company_id, page_id, page_name, access_token,
        is_active, webhook_verified, webhook_enabled, source_table,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
      )
    `, [
      id,
      data.company_id,
      data.page_id,
      data.page_name,
      data.access_token,
      data.is_active || true,
      data.webhook_verified || false,
      data.webhook_enabled || false,
      'unified'
    ]);

    console.log(`📊 FacebookService: Created new page ${data.page_name} (${data.page_id}) in unified table`);
    return id;
  }

  // تم حذف دالة createLegacy - لم تعد مستخدمة

  /**
   * تحديث إعدادات فيسبوك في الجدول الموحد
   */
  static async update(pageId: string, data: Partial<FacebookSettings>): Promise<boolean> {
    const result = await executeUpdate(`
      UPDATE facebook_pages_unified SET
        page_name = COALESCE(?, page_name),
        access_token = COALESCE(?, access_token),
        is_active = COALESCE(?, is_active),
        webhook_verified = COALESCE(?, webhook_verified),
        updated_at = NOW()
      WHERE page_id = ?
    `, [
      data.page_name,
      data.access_token,
      data.is_active,
      data.webhook_verified,
      pageId
    ]);

    console.log(`📊 FacebookService: Updated page ${pageId} in unified table`);
    return result.affectedRows > 0;
  }

  /**
   * حذف إعدادات فيسبوك بمعرف الصفحة من الجدول الموحد (soft delete)
   */
  static async deleteByPageId(pageId: string): Promise<boolean> {
    const result = await executeUpdate(`
      UPDATE facebook_pages_unified SET is_active = FALSE, updated_at = NOW() WHERE page_id = ?
    `, [pageId]);

    console.log(`📊 FacebookService: Soft deleted page ${pageId} from unified table`);
    return result.affectedRows > 0;
  }

  // تم حذف دالة deleteByPageIdLegacy - لم تعد مستخدمة
}

// ===================================
// 💬 خدمات المحادثات
// ===================================

export interface Conversation {
  id: string;
  company_id: string;
  facebook_page_id: string;
  participant_id: string;  // تم تغيير من user_id إلى participant_id
  user_id?: string;        // إبقاء user_id كخاصية اختيارية للتوافق مع الكود القديم
  user_name?: string;
  status: string;
  priority: string;
  total_messages: number;
  unread_messages: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export class ConversationService {
  /**
   * الحصول على محادثة بالمعرف
   */
  static async getById(id: string): Promise<Conversation | null> {
    const conversations = await executeQuery<Conversation>(
      'SELECT * FROM conversations WHERE id = ?',
      [id]
    );
    return conversations[0] || null;
  }

  /**
   * الحصول على محادثة
   */
  static async getByUserAndPage(userId: string, pageId: string): Promise<Conversation | null> {
    const conversations = await executeQuery<Conversation>(
      'SELECT * FROM conversations WHERE user_id = ? AND facebook_page_id = ?',
      [userId, pageId]
    );
    return conversations[0] || null;
  }

  /**
   * الحصول على محادثات الشركة
   */
  static async getByCompanyId(companyId: string, limit = 50): Promise<Conversation[]> {
    return await executeQuery<Conversation>(
      `SELECT
        c.*,
        c.customer_name,

        -- عدد الرسائل غير المقروءة (مؤقتاً نحسب كل الرسائل من العملاء)
        (SELECT COUNT(*)
         FROM messages m
         WHERE m.conversation_id = c.id
         AND m.is_from_page = 0
        ) as unread_count,

        -- آخر رسالة مع معلومات المرسل
        COALESCE(
          (SELECT
             CASE
               WHEN m.message_type = 'image' THEN '📷 صورة'
               WHEN m.message_type = 'file' THEN '📎 ملف'
               WHEN m.message_type = 'audio' THEN '🎵 رسالة صوتية'
               WHEN m.message_text IS NULL OR m.message_text = '' THEN
                 CASE m.message_type
                   WHEN 'image' THEN '📷 صورة'
                   ELSE 'رسالة'
                 END
               ELSE m.message_text
             END
           FROM messages m
           WHERE m.conversation_id = c.id
           ORDER BY m.created_at DESC
           LIMIT 1
          ), 'لا توجد رسائل'
        ) as last_message,

        -- نوع آخر رسالة
        (SELECT m.message_type
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC
         LIMIT 1
        ) as last_message_type,

        -- هل آخر رسالة من الصفحة (أنت) أم من العميل
        COALESCE(
          (SELECT m.is_from_page
           FROM messages m
           WHERE m.conversation_id = c.id
           ORDER BY m.created_at DESC
           LIMIT 1
          ), 0
        ) as last_message_is_from_page,

        -- وقت آخر رسالة
        COALESCE(
          (SELECT m.created_at
           FROM messages m
           WHERE m.conversation_id = c.id
           ORDER BY m.created_at DESC
           LIMIT 1
          ), c.updated_at
        ) as last_message_time
       FROM conversations c
       WHERE c.company_id = ?
       ORDER BY COALESCE(
         (SELECT m.created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
         ), c.updated_at
       ) DESC
       LIMIT ?`,
      [companyId, limit]
    );
  }

  /**
   * الحصول على محادثات الشركة مع عدد الرسائل الحديثة فقط (آخر 24 ساعة)
   */
  static async getByCompanyIdWithRecentMessages(companyId: string, limit = 50): Promise<Conversation[]> {
    console.log('🔍🔍🔍 [DEBUG] استدعاء getByCompanyIdWithRecentMessages مع companyId:', companyId);

    const result = await executeQuery<Conversation>(
      `SELECT
        c.*,
        c.customer_name,
        c.updated_at as display_time,

        -- عدد الرسائل غير المقروءة (مؤقتاً نحسب كل الرسائل من العملاء)
        (SELECT COUNT(*)
         FROM messages m
         WHERE m.conversation_id = c.id
         AND m.is_from_page = 0
        ) as unread_count,

        -- آخر رسالة مع معلومات المرسل
        COALESCE(
          (SELECT
             CASE
               WHEN m.message_type = 'image' THEN '📷 صورة'
               WHEN m.message_type = 'file' THEN '📎 ملف'
               WHEN m.message_type = 'audio' THEN '🎵 رسالة صوتية'
               WHEN m.message_text IS NULL OR m.message_text = '' THEN
                 CASE m.message_type
                   WHEN 'image' THEN '📷 صورة'
                   ELSE 'رسالة'
                 END
               ELSE m.message_text
             END
           FROM messages m
           WHERE m.conversation_id = c.id
           ORDER BY m.created_at DESC
           LIMIT 1
          ), 'لا توجد رسائل'
        ) as last_message,

        -- نوع آخر رسالة
        COALESCE(
          (SELECT m.message_type
           FROM messages m
           WHERE m.conversation_id = c.id
           ORDER BY m.created_at DESC
           LIMIT 1
          ), 'text'
        ) as last_message_type,

        -- هل آخر رسالة من الصفحة (أنت) أم من العميل
        COALESCE(
          (SELECT m.is_from_page
           FROM messages m
           WHERE m.conversation_id = c.id
           ORDER BY m.created_at DESC
           LIMIT 1
          ), 0
        ) as last_message_is_from_page,

        -- وقت آخر رسالة
        COALESCE(
          (SELECT m.created_at
           FROM messages m
           WHERE m.conversation_id = c.id
           ORDER BY m.created_at DESC
           LIMIT 1
          ), c.updated_at
        ) as last_message_time,

        0 as recent_messages_count
       FROM conversations c
       WHERE c.company_id = ?
       ORDER BY COALESCE(
         (SELECT m.created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
         ), c.updated_at
       ) DESC
       LIMIT ?`,
      [companyId, limit]
    );

    console.log('🔍🔍🔍 [DEBUG] نتائج getByCompanyIdWithRecentMessages:', {
      count: result.length,
      first: result[0] ? {
        id: result[0].id.slice(-8),
        customer_name: result[0].customer_name,
        last_message: result[0].last_message,
        last_message_is_from_page: result[0].last_message_is_from_page,
        unread_count: result[0].unread_count,
        last_message_time: result[0].last_message_time,
        created_at: result[0].created_at,
        updated_at: result[0].updated_at
      } : null
    });

    return result;
  }

  /**
   * إنشاء محادثة جديدة في الجدول الموحد
   */
  static async create(data: Partial<Conversation>): Promise<string> {
    const conversationId = crypto.randomUUID();

    await executeInsert(`
      INSERT INTO conversations (
        id, company_id, facebook_page_id, participant_id, customer_name,
        unread_count, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, NOW(), NOW()
      )
    `, [
      conversationId,
      data.company_id,
      data.facebook_page_id,
      data.user_id || data.participant_id, // دعم كلا الاسمين للتوافق
      data.user_name || data.customer_name || null,
      1 // unread_count افتراضي
    ]);

    console.log(`📊 ConversationService: Created conversation ${conversationId} in unified table`);
    return conversationId;
  }

  /**
   * تحديث إحصائيات المحادثة
   */
  static async updateStats(conversationId: string): Promise<boolean> {
    try {
      console.log('🔄 [DEBUG] بدء تحديث إحصائيات المحادثة:', conversationId);

      // عندما ترد على رسالة، نصفر عدد الرسائل غير المقروءة
      // ونحدث آخر رسالة لتكون من الصفحة
      const result = await executeQuery(`
        UPDATE conversations SET
          unread_count = 0,
          updated_at = NOW()
        WHERE id = ?
      `, [conversationId]);

      console.log('✅ [DEBUG] تم تحديث إحصائيات المحادثة:', conversationId, 'تأثر', result.affectedRows, 'صف');

      // التحقق من أن التحديث تم بنجاح
      if (result.affectedRows === 0) {
        console.warn('⚠️ [DEBUG] لم يتم العثور على محادثة بالمعرف:', conversationId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ [DEBUG] خطأ في تحديث إحصائيات المحادثة:', conversationId, error);
      return false;
    }
  }

  /**
   * تحديث إحصائيات المحادثة مع تفاصيل آخر رسالة
   */
  static async updateConversationStats(
    conversationId: string,
    lastMessage: string,
    lastMessageTime: string,
    lastMessageIsFromPage: number
  ): Promise<boolean> {
    try {
      console.log(`🔄 [DEBUG] تحديث إحصائيات المحادثة ${conversationId} مع:`, {
        lastMessage,
        lastMessageTime,
        lastMessageIsFromPage
      });

      await executeQuery(`
        UPDATE conversations SET
          last_message = ?,
          last_message_time = ?,
          last_message_is_from_page = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [lastMessage, lastMessageTime, lastMessageIsFromPage, conversationId]);

      console.log('✅ تم تحديث إحصائيات المحادثة بنجاح:', conversationId);
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث إحصائيات المحادثة:', error);
      return false;
    }
  }

  /**
   * تحديث وقت آخر نشاط للمحادثة
   */
  static async updateLastActivity(conversationId: string): Promise<boolean> {
    try {
      await executeQuery(
        'UPDATE conversations SET updated_at = NOW() WHERE id = ?',
        [conversationId]
      );
      return true;
    } catch (error) {
      console.error('❌ خطأ في تحديث آخر نشاط للمحادثة:', error);
      return false;
    }
  }
}

// ===================================
// 💌 خدمات الرسائل
// ===================================

export interface Message {
  id: string;
  conversation_id: string;
  company_id: string;
  facebook_message_id?: string;
  sender_id: string;
  recipient_id: string;
  message_text?: string;
  message_type: string;
  attachments?: any;
  direction: string;
  is_from_page?: number; // 0 أو 1 (TINYINT في قاعدة البيانات)
  status: string;
  is_read: boolean;
  ai_processed: boolean;
  ai_response?: string;
  sent_at?: string;
  created_at: string;
  image_url?: string; // رابط الصورة
}

export class MessageService {
  /**
   * إنشاء رسالة جديدة
   */
  static async create(data: Partial<Message>): Promise<string> {
    // إنشاء UUID مسبقاً
    const { randomUUID } = await import('crypto');
    const messageId = randomUUID();

    console.log('💾 [DEBUG] إنشاء رسالة جديدة:', {
      messageId,
      conversation_id: data.conversation_id,
      message_type: data.message_type,
      sender_id: data.sender_id,
      is_from_page: data.is_from_page,
      image_url: data.image_url
    });

    // إزالة company_id مؤقتاً حتى يتم إضافة العمود
    await executeInsert(`
      INSERT INTO messages (
        id, conversation_id, facebook_message_id,
        sender_id, message_text, message_type,
        is_from_page, attachments, created_at, image_url
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `, [
      messageId,
      data.conversation_id,
      data.facebook_message_id || null,
      data.sender_id,
      data.message_text || null,
      data.message_type || 'text',
      data.is_from_page || false,
      data.attachments ? JSON.stringify(data.attachments) : null,
      data.sent_at || new Date().toISOString(),
      data.image_url || null
    ]);

    console.log('✅ [DEBUG] تم إنشاء الرسالة بنجاح:', messageId);

    // تحديث وقت آخر نشاط للمحادثة
    await ConversationService.updateLastActivity(data.conversation_id);

    return messageId;
  }

  /**
   * الحصول على رسائل المحادثة
   */
  static async getByConversationId(conversationId: string, limit = 50): Promise<Message[]> {
    // جلب الرسائل الأحدث أولاً ثم عكس الترتيب للعرض
    const messages = await executeQuery<Message>(
      `SELECT * FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [conversationId, limit]
    );

    // عكس الترتيب لعرض الرسائل من الأقدم للأحدث
    console.log('📊 [DEBUG] عدد الرسائل من قاعدة البيانات:', messages.length);
    if (messages && messages.length > 0) {
      console.log('📊 [DEBUG] أول رسالة من قاعدة البيانات:', messages[0]);
      console.log('📊 [DEBUG] أعمدة الرسالة من قاعدة البيانات:', Object.keys(messages[0]));
    }
    return messages.reverse();
  }

  /**
   * الحصول على الرسائل الحديثة فقط (آخر 24 ساعة)
   */
  static async getRecentByConversationId(conversationId: string, limit = 50): Promise<Message[]> {
    // جلب الرسائل الحديثة فقط (آخر 24 ساعة)
    const messages = await executeQuery<Message>(
      `SELECT * FROM messages
       WHERE conversation_id = ?
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY created_at DESC
       LIMIT ?`,
      [conversationId, limit]
    );

    // عكس الترتيب لعرض الرسائل من الأقدم للأحدث
    console.log('📊 [DEBUG] عدد الرسائل الحديثة من قاعدة البيانات:', messages.length);
    if (messages && messages.length > 0) {
      console.log('📊 [DEBUG] أول رسالة حديثة من قاعدة البيانات:', messages[0]);
      console.log('📊 [DEBUG] أعمدة الرسالة الحديثة من قاعدة البيانات:', Object.keys(messages[0]));

      // تشخيص مفصل لكل رسالة
      messages.forEach((msg, index) => {
        console.log(`🔍 [DB] Message ${index + 1}:`, {
          id: msg.id,
          sender_id: msg.sender_id,
          is_from_page: msg.is_from_page,
          is_from_page_type: typeof msg.is_from_page,
          direction: msg.direction,
          message_text: msg.message_text?.substring(0, 30)
        });
      });
    }
    return messages.reverse();
  }

  /**
   * الحصول على الرسائل الحديثة للشركة
   */
  static async getRecentByCompanyId(companyId: string, limit = 100): Promise<Message[]> {
    return await executeQuery<Message>(
      `SELECT m.*, c.customer_name, c.facebook_page_id
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE m.company_id = ?
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [companyId, limit]
    );
  }

  /**
   * تحديث حالة الرسالة
   */
  static async updateStatus(messageId: string, status: string, isRead?: boolean): Promise<boolean> {
    const result = await executeUpdate(`
      UPDATE messages SET
        status = ?
      WHERE id = ?
    `, [status, messageId]);

    return result.affectedRows > 0;
  }

  /**
   * تحديث معالجة الذكي الاصطناعي
   */
  static async updateAIProcessing(messageId: string, aiResponse: string): Promise<boolean> {
    const result = await executeUpdate(`
      UPDATE messages SET
        ai_processed = TRUE,
        ai_response = ?
      WHERE id = ?
    `, [aiResponse, messageId]);

    return result.affectedRows > 0;
  }

  /**
   * تصحيح البيانات - إصلاح is_from_page للرسائل الإدارية
   */
  static async fixAdminMessages(): Promise<any> {
    try {
      const query = `
        UPDATE messages
        SET is_from_page = 1
        WHERE sender_id = 'admin' AND (is_from_page = 0 OR is_from_page IS NULL)
      `;

      const result = await executeUpdate(query, []);
      console.log('✅ [FIX] تم تصحيح رسائل الإدارة:', result);
      return result;
    } catch (error) {
      console.error('❌ [FIX] خطأ في تصحيح رسائل الإدارة:', error);
      throw error;
    }
  }
}

// ===================================
// 🤖 خدمات الذكي الاصطناعي
// ===================================

export interface GeminiSettings {
  id: string;
  company_id: string;
  provider: string;
  api_key?: string;
  model_name: string;
  is_active: boolean;
  system_prompt?: string;
  temperature: number;
  max_tokens: number;
  usage_limit: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export class GeminiService {
  /**
   * الحصول على إعدادات الذكي الاصطناعي للشركة
   */
  static async getByCompanyId(companyId: string): Promise<GeminiSettings | null> {
    const settings = await executeQuery<GeminiSettings>(
      'SELECT * FROM ai_settings WHERE company_id = ? AND provider = "gemini"',
      [companyId]
    );
    return settings[0] || null;
  }

  /**
   * تحديث إعدادات الذكي الاصطناعي
   */
  static async update(companyId: string, data: Partial<GeminiSettings>): Promise<boolean> {
    const result = await executeUpdate(`
      UPDATE ai_settings SET
        api_key = COALESCE(?, api_key),
        model_name = COALESCE(?, model_name),
        is_active = COALESCE(?, is_active),
        system_prompt = COALESCE(?, system_prompt),
        temperature = COALESCE(?, temperature),
        max_tokens = COALESCE(?, max_tokens),
        updated_at = CURRENT_TIMESTAMP
      WHERE company_id = ? AND provider = 'gemini'
    `, [
      data.api_key || null,
      data.model_name || null,
      data.is_active !== undefined ? data.is_active : null,
      data.system_prompt || null,
      data.temperature || null,
      data.max_tokens || null,
      companyId
    ]);

    return result.affectedRows > 0;
  }

  /**
   * تحديث إحصائيات الاستخدام
   */
  static async updateStats(companyId: string, success: boolean): Promise<boolean> {
    const result = await executeUpdate(`
      UPDATE gemini_settings SET
        total_requests = total_requests + 1,
        successful_requests = successful_requests + ${success ? 1 : 0},
        failed_requests = failed_requests + ${success ? 0 : 1},
        updated_at = CURRENT_TIMESTAMP
      WHERE company_id = ?
    `, [companyId]);

    return result.affectedRows > 0;
  }
}

// ===================================
// 📱 خدمات WhatsApp
// ===================================

export interface WhatsAppMessage {
  id?: number;
  message_id: string;
  phone_number: string;
  contact_name?: string;
  message_text: string;
  message_type: 'incoming' | 'outgoing';
  file_url?: string;
  file_name?: string;
  created_at?: string;
}

export class WhatsAppService {
  /**
   * حفظ رسالة WhatsApp
   */
  static async saveMessage(message: WhatsAppMessage): Promise<boolean> {
    try {
      await executeInsert(`
        INSERT INTO whatsapp_messages (
          message_id, phone_number, contact_name, message_text,
          message_type, file_url, file_name, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        message.message_id,
        message.phone_number,
        message.contact_name || null,
        message.message_text,
        message.message_type,
        message.file_url || null,
        message.file_name || null
      ]);
      return true;
    } catch (error) {
      console.error('❌ [WHATSAPP] خطأ في حفظ الرسالة:', error);
      return false;
    }
  }

  /**
   * جلب محادثات WhatsApp
   */
  static async getContacts(): Promise<any[]> {
    return await executeQuery(`
      SELECT
        phone_number,
        contact_name,
        message_text,
        created_at,
        message_type
      FROM whatsapp_messages
      WHERE phone_number IN (
        SELECT DISTINCT phone_number
        FROM whatsapp_messages
        ORDER BY created_at DESC
      )
      ORDER BY created_at DESC
    `);
  }

  /**
   * جلب رسائل محادثة معينة
   */
  static async getConversation(phoneNumber: string): Promise<WhatsAppMessage[]> {
    return await executeQuery<WhatsAppMessage>(`
      SELECT
        message_id,
        phone_number,
        contact_name,
        message_text,
        message_type,
        created_at,
        file_url,
        file_name
      FROM whatsapp_messages
      WHERE phone_number = ?
      ORDER BY created_at ASC
    `, [phoneNumber]);
  }

  /**
   * جلب معلومات جهة اتصال
   */
  static async getContact(phoneNumber: string): Promise<any> {
    const [rows] = await executeQuery(`
      SELECT
        contact_name,
        created_at
      FROM whatsapp_messages
      WHERE phone_number = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [phoneNumber]);

    return rows || null;
  }

  /**
   * جلب آخر الرسائل
   */
  static async getRecentMessages(limit: number = 50): Promise<WhatsAppMessage[]> {
    return await executeQuery<WhatsAppMessage>(`
      SELECT
        message_id,
        phone_number,
        contact_name,
        message_text,
        message_type,
        created_at,
        file_url,
        file_name
      FROM whatsapp_messages
      ORDER BY created_at DESC
      LIMIT ?
    `, [limit]);
  }

  /**
   * جلب إحصائيات WhatsApp
   */
  static async getStats(): Promise<any> {
    try {
      // إجمالي الرسائل
      const [totalResult] = await executeQuery(`
        SELECT COUNT(*) as total FROM whatsapp_messages
      `);
      const totalMessages = totalResult?.total || 0;

      // رسائل اليوم
      const [todayResult] = await executeQuery(`
        SELECT COUNT(*) as today FROM whatsapp_messages
        WHERE DATE(created_at) = CURDATE()
      `);
      const todayMessages = todayResult?.today || 0;

      // المحادثات النشطة (أرقام فريدة في آخر 7 أيام)
      const [activeResult] = await executeQuery(`
        SELECT COUNT(DISTINCT phone_number) as active
        FROM whatsapp_messages
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      const activeChats = activeResult?.active || 0;

      return {
        totalMessages,
        todayMessages,
        activeChats
      };
    } catch (error) {
      console.error('❌ [WHATSAPP] خطأ في جلب الإحصائيات:', error);
      return {
        totalMessages: 0,
        todayMessages: 0,
        activeChats: 0
      };
    }
  }

  /**
   * إنشاء جدول WhatsApp إذا لم يكن موجوداً
   */
  static async createTableIfNotExists(): Promise<void> {
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS whatsapp_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          message_id VARCHAR(255) NOT NULL,
          phone_number VARCHAR(50) NOT NULL,
          contact_name VARCHAR(255),
          message_text TEXT,
          message_type ENUM('incoming', 'outgoing') NOT NULL,
          file_url TEXT,
          file_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_phone_number (phone_number),
          INDEX idx_created_at (created_at),
          INDEX idx_message_type (message_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ [WHATSAPP] تم إنشاء جدول whatsapp_messages بنجاح');
    } catch (error) {
      console.error('❌ [WHATSAPP] خطأ في إنشاء جدول whatsapp_messages:', error);
    }
  }
}

// ===================================
// 📊 خدمات عامة
// ===================================

export class DatabaseService {
  /**
   * الحصول على إحصائيات الشركة
   */
  static async getCompanyStats(companyId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    unreadMessages: number;
    activePages: number;
  }> {
    const [stats] = await executeQuery(`
      SELECT
        (SELECT COUNT(*) FROM conversations WHERE company_id = ?) as totalConversations,
        (SELECT COUNT(*) FROM messages WHERE company_id = ?) as totalMessages,
        (SELECT COUNT(*) FROM messages WHERE company_id = ? AND direction = 'incoming') as unreadMessages,
        (SELECT COUNT(*) FROM facebook_pages_unified WHERE company_id = ? AND is_active = TRUE) as activePages
    `, [companyId, companyId, companyId, companyId]);

    return {
      totalConversations: stats.totalConversations || 0,
      totalMessages: stats.totalMessages || 0,
      unreadMessages: stats.unreadMessages || 0,
      activePages: stats.activePages || 0
    };
  }

  /**
   * البحث في المحادثات
   */
  static async searchConversations(companyId: string, query: string, limit = 20): Promise<Conversation[]> {
    return await executeQuery<Conversation>(`
      SELECT * FROM conversations
      WHERE company_id = ?
      AND (user_name LIKE ? OR user_id LIKE ?)
      ORDER BY last_message_at DESC
      LIMIT ?
    `, [companyId, `%${query}%`, `%${query}%`, limit]);
  }
}
