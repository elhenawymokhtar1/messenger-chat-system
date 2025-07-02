// 🗄️ طبقة الوصول لقاعدة البيانات (Database Access Layer)
import { executeQuery, executeInsert, executeUpdate, executeTransaction } from '../config/mysql';

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
   * الحصول على إعدادات فيسبوك للشركة
   */
  static async getByCompanyId(companyId: string): Promise<FacebookSettings[]> {
    return await executeQuery<FacebookSettings>(
      'SELECT * FROM facebook_settings WHERE company_id = ? AND is_active = TRUE',
      [companyId]
    );
  }

  /**
   * الحصول على إعدادات بمعرف الصفحة
   */
  static async getByPageId(pageId: string): Promise<FacebookSettings | null> {
    const settings = await executeQuery<FacebookSettings>(
      'SELECT * FROM facebook_settings WHERE page_id = ?',
      [pageId]
    );
    return settings[0] || null;
  }

  /**
   * إنشاء إعدادات فيسبوك جديدة
   */
  static async create(data: Partial<FacebookSettings>): Promise<string> {
    const result = await executeInsert(`
      INSERT INTO facebook_settings (
        id, company_id, page_id, page_name, access_token,
        is_active, webhook_verified
      ) VALUES (
        UUID(), ?, ?, ?, ?, ?, ?
      )
    `, [
      data.company_id,
      data.page_id,
      data.page_name,
      data.access_token,
      data.is_active || true,
      data.webhook_verified || false
    ]);
    
    return result.insertId;
  }

  /**
   * تحديث إعدادات فيسبوك
   */
  static async update(pageId: string, data: Partial<FacebookSettings>): Promise<boolean> {
    const result = await executeUpdate(`
      UPDATE facebook_settings SET
        page_name = COALESCE(?, page_name),
        access_token = COALESCE(?, access_token),
        is_active = COALESCE(?, is_active),
        webhook_verified = COALESCE(?, webhook_verified),
        updated_at = CURRENT_TIMESTAMP
      WHERE page_id = ?
    `, [
      data.page_name,
      data.access_token,
      data.is_active,
      data.webhook_verified,
      pageId
    ]);
    
    return result.affectedRows > 0;
  }

  /**
   * حذف إعدادات فيسبوك بمعرف الصفحة
   */
  static async deleteByPageId(pageId: string): Promise<boolean> {
    const result = await executeUpdate(`
      DELETE FROM facebook_settings WHERE page_id = ?
    `, [pageId]);

    return result.affectedRows > 0;
  }
}

// ===================================
// 💬 خدمات المحادثات
// ===================================

export interface Conversation {
  id: string;
  company_id: string;
  facebook_page_id: string;
  user_id: string;
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
        COALESCE(c.customer_name, c.user_name, CONCAT('مستخدم ', SUBSTRING(c.customer_facebook_id, -4))) as customer_name,
        (SELECT m.message_text
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY COALESCE(m.sent_at, m.created_at) DESC
         LIMIT 1
        ) as last_message,
        (SELECT m.message_type
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY COALESCE(m.sent_at, m.created_at) DESC
         LIMIT 1
        ) as last_message_type
       FROM conversations c
       WHERE c.company_id = ?
       ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
       LIMIT ?`,
      [companyId, limit]
    );
  }

  /**
   * الحصول على محادثات الشركة مع عدد الرسائل الحديثة فقط (آخر 24 ساعة)
   */
  static async getByCompanyIdWithRecentMessages(companyId: string, limit = 50): Promise<Conversation[]> {
    return await executeQuery<Conversation>(
      `SELECT
        c.*,
        COALESCE(c.customer_name, c.user_name, CONCAT('مستخدم ', SUBSTRING(c.customer_facebook_id, -4))) as customer_name,
        COALESCE(c.last_message_at, c.created_at) as display_time,
        (SELECT COUNT(*)
         FROM messages m
         WHERE m.conversation_id = c.id
         AND COALESCE(m.sent_at, m.created_at) >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ) as recent_messages_count,
        (SELECT COUNT(*)
         FROM messages m
         WHERE m.conversation_id = c.id
         AND COALESCE(m.sent_at, m.created_at) >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         AND m.direction = 'incoming'
         AND m.is_read = 0
        ) as unread_count,
        (SELECT m.message_text
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY COALESCE(m.sent_at, m.created_at) DESC
         LIMIT 1
        ) as last_message,
        (SELECT m.message_type
         FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY COALESCE(m.sent_at, m.created_at) DESC
         LIMIT 1
        ) as last_message_type
       FROM conversations c
       WHERE c.company_id = ?
       ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
       LIMIT ?`,
      [companyId, limit]
    );
  }

  /**
   * إنشاء محادثة جديدة
   */
  static async create(data: Partial<Conversation>): Promise<string> {
    const result = await executeInsert(`
      INSERT INTO conversations (
        id, company_id, facebook_page_id, user_id, user_name,
        status, priority
      ) VALUES (
        UUID(), ?, ?, ?, ?, ?, ?
      )
    `, [
      data.company_id,
      data.facebook_page_id,
      data.user_id,
      data.user_name || null,
      data.status || 'active',
      data.priority || 'normal'
    ]);
    
    return result.insertId;
  }

  /**
   * تحديث إحصائيات المحادثة
   */
  static async updateStats(conversationId: string): Promise<boolean> {
    const result = await executeUpdate(`
      UPDATE conversations 
      SET 
        total_messages = (
          SELECT COUNT(*) 
          FROM messages 
          WHERE conversation_id = ?
        ),
        unread_messages = (
          SELECT COUNT(*) 
          FROM messages 
          WHERE conversation_id = ? 
          AND direction = 'incoming' 
          AND is_read = FALSE
        ),
        last_message_at = (
          SELECT MAX(sent_at) 
          FROM messages 
          WHERE conversation_id = ?
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [conversationId, conversationId, conversationId, conversationId]);
    
    return result.affectedRows > 0;
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
  status: string;
  is_read: boolean;
  ai_processed: boolean;
  ai_response?: string;
  sent_at?: string;
  created_at: string;
}

export class MessageService {
  /**
   * إنشاء رسالة جديدة
   */
  static async create(data: Partial<Message>): Promise<string> {
    // إنشاء UUID مسبقاً
    const { randomUUID } = await import('crypto');
    const messageId = randomUUID();

    await executeInsert(`
      INSERT INTO messages (
        id, conversation_id, company_id, facebook_message_id,
        sender_id, recipient_id, message_text, message_type,
        attachments, direction, status, is_read, sent_at, image_url
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `, [
      messageId,
      data.conversation_id,
      data.company_id,
      data.facebook_message_id || null,
      data.sender_id,
      data.recipient_id,
      data.message_text || null,
      data.message_type || 'text',
      data.attachments ? JSON.stringify(data.attachments) : null,
      data.direction,
      data.status || 'sent',
      data.is_read || false,
      data.sent_at || new Date().toISOString(),
      data.image_url || null
    ]);

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
       ORDER BY COALESCE(sent_at, created_at) DESC
       LIMIT ?`,
      [conversationId, limit]
    );

    // عكس الترتيب لعرض الرسائل من الأقدم للأحدث
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
       AND COALESCE(sent_at, created_at) >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY COALESCE(sent_at, created_at) DESC
       LIMIT ?`,
      [conversationId, limit]
    );

    // عكس الترتيب لعرض الرسائل من الأقدم للأحدث
    return messages.reverse();
  }

  /**
   * الحصول على الرسائل الحديثة للشركة
   */
  static async getRecentByCompanyId(companyId: string, limit = 100): Promise<Message[]> {
    return await executeQuery<Message>(
      `SELECT m.*, c.user_name, c.facebook_page_id
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE m.company_id = ?
       ORDER BY COALESCE(m.sent_at, m.created_at) DESC
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
        status = ?,
        is_read = COALESCE(?, is_read)
      WHERE id = ?
    `, [status, isRead, messageId]);

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
}

// ===================================
// 🤖 خدمات الذكي الاصطناعي
// ===================================

export interface GeminiSettings {
  id: string;
  company_id: string;
  api_key?: string;
  model: string;
  is_enabled: boolean;
  auto_reply: boolean;
  response_delay: number;
  system_prompt?: string;
  temperature: number;
  max_tokens: number;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  created_at: string;
  updated_at: string;
}

export class GeminiService {
  /**
   * الحصول على إعدادات الذكي الاصطناعي للشركة
   */
  static async getByCompanyId(companyId: string): Promise<GeminiSettings | null> {
    const settings = await executeQuery<GeminiSettings>(
      'SELECT * FROM gemini_settings WHERE company_id = ?',
      [companyId]
    );
    return settings[0] || null;
  }

  /**
   * تحديث إعدادات الذكي الاصطناعي
   */
  static async update(companyId: string, data: Partial<GeminiSettings>): Promise<boolean> {
    const result = await executeUpdate(`
      UPDATE gemini_settings SET
        api_key = COALESCE(?, api_key),
        model = COALESCE(?, model),
        is_enabled = COALESCE(?, is_enabled),
        auto_reply = COALESCE(?, auto_reply),
        response_delay = COALESCE(?, response_delay),
        system_prompt = COALESCE(?, system_prompt),
        temperature = COALESCE(?, temperature),
        max_tokens = COALESCE(?, max_tokens),
        updated_at = CURRENT_TIMESTAMP
      WHERE company_id = ?
    `, [
      data.api_key || null,
      data.model || null,
      data.is_enabled !== undefined ? data.is_enabled : null,
      data.auto_reply !== undefined ? data.auto_reply : null,
      data.response_delay || null,
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
        (SELECT COUNT(*) FROM messages WHERE company_id = ? AND direction = 'incoming' AND is_read = FALSE) as unreadMessages,
        (SELECT COUNT(*) FROM facebook_settings WHERE company_id = ? AND is_active = TRUE) as activePages
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
