/**
 * 🏷️ خدمة تحديث أسماء العملاء في MySQL
 * تجلب أسماء العملاء الحقيقية من Facebook API وتحدثها في قاعدة البيانات
 */

import mysql from 'mysql2/promise';

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

const getPool = () => mysql.createPool(dbConfig);
import { FacebookApiService } from './facebookApi';

interface ConversationData {
  id: string;
  participant_id: string;
  customer_name: string | null;
  facebook_page_id: string;
  company_id: string;
}

interface FacebookPageSettings {
  page_id: string;
  access_token: string;
  page_name: string;
  company_id: string;
}

export class MySQLNameUpdateService {
  private static userNameCache = new Map<string, { name: string; timestamp: number }>();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ساعة

  /**
   * تحديث أسماء العملاء لشركة معينة
   */
  static async updateCustomerNamesForCompany(companyId: string): Promise<{
    success: boolean;
    updated: number;
    errors: number;
    message: string;
  }> {
    const pool = getPool();
    let updated = 0;
    let errors = 0;

    try {
      console.log(`🏷️ [NAME_UPDATE] بدء تحديث أسماء العملاء للشركة: ${companyId}`);

      // 1. جلب إعدادات Facebook للشركة من الجدول الموحد
      const [facebookSettings] = await pool.execute<FacebookPageSettings[]>(
        'SELECT page_id, access_token, page_name, company_id FROM facebook_pages_unified WHERE company_id = ? AND is_active = 1',
        [companyId]
      );

      if (!facebookSettings || facebookSettings.length === 0) {
        return {
          success: false,
          updated: 0,
          errors: 0,
          message: 'لا توجد إعدادات Facebook نشطة للشركة'
        };
      }

      // 2. جلب المحادثات التي تحتاج تحديث أسماء
      const [conversations] = await pool.execute<ConversationData[]>(
        `SELECT id, participant_id, customer_name, facebook_page_id, company_id
         FROM conversations
         WHERE company_id = ?
         AND participant_id IS NOT NULL
         AND participant_id != ''
         AND (customer_name IS NULL OR customer_name = '' OR customer_name = 'undefined' OR customer_name = 'null')
         ORDER BY last_message_time DESC
         LIMIT 50`,
        [companyId]
      );

      if (!conversations || conversations.length === 0) {
        return {
          success: true,
          updated: 0,
          errors: 0,
          message: 'جميع المحادثات لديها أسماء محدثة'
        };
      }

      console.log(`📋 [NAME_UPDATE] وجدت ${conversations.length} محادثة تحتاج تحديث أسماء`);

      // 3. تحديث الأسماء لكل صفحة
      for (const pageSettings of facebookSettings) {
        const pageConversations = conversations.filter(
          conv => conv.facebook_page_id === pageSettings.page_id
        );

        if (pageConversations.length === 0) continue;

        console.log(`📄 [NAME_UPDATE] معالجة ${pageConversations.length} محادثة للصفحة: ${pageSettings.page_name}`);

        // 4. جلب أسماء المستخدمين من Facebook API
        const userNames = await this.getFacebookUserNames(
          pageSettings.access_token,
          pageSettings.page_id
        );

        console.log(`👥 [NAME_UPDATE] تم جلب ${userNames.size} اسم من Facebook API`);

        // 5. تحديث كل محادثة
        for (const conversation of pageConversations) {
          try {
            let realName = userNames.get(conversation.participant_id);

            // إذا لم نجد الاسم في المحادثات، جرب طرق متعددة
            if (!realName) {
              // جرب API مباشرة أولاً
              realName = await this.getUserNameDirectly(
                conversation.participant_id,
                pageSettings.access_token
              );

              // إذا فشل، جرب البحث في المحادثات مرة أخرى بطريقة مختلفة
              if (!realName) {
                realName = await this.searchInConversationsAPI(
                  conversation.participant_id,
                  pageSettings.access_token,
                  pageSettings.page_id
                );
              }

              // إذا فشل كل شيء، لا تحفظ اسم افتراضي
              if (!realName) {
                console.log(`⚠️ [NAME_UPDATE] لم يتم العثور على اسم حقيقي للمستخدم: ${conversation.participant_id}`);
              }
            }

            // فقط حدث إذا وجدنا اسم حقيقي وهو مختلف عن الحالي
            if (realName &&
                realName.trim() !== '' &&
                !realName.startsWith('مستخدم ') &&
                !realName.startsWith('عميل ') &&
                realName !== conversation.customer_name) {
              // تحديث الاسم في قاعدة البيانات
              await pool.execute(
                'UPDATE conversations SET customer_name = ?, updated_at = NOW() WHERE id = ?',
                [realName, conversation.id]
              );

              console.log(`✅ [NAME_UPDATE] تم تحديث: ${conversation.customer_name || 'غير معروف'} → ${realName}`);
              updated++;

              // حفظ في الكاش
              this.userNameCache.set(conversation.participant_id, {
                name: realName,
                timestamp: Date.now()
              });
            }
          } catch (error) {
            console.error(`❌ [NAME_UPDATE] خطأ في تحديث المحادثة ${conversation.id}:`, error);
            errors++;
          }
        }
      }

      return {
        success: true,
        updated,
        errors,
        message: `تم تحديث ${updated} اسم بنجاح${errors > 0 ? ` مع ${errors} أخطاء` : ''}`
      };

    } catch (error) {
      console.error('❌ [NAME_UPDATE] خطأ عام في تحديث الأسماء:', error);
      return {
        success: false,
        updated,
        errors: errors + 1,
        message: `خطأ في تحديث الأسماء: ${error.message}`
      };
    }
  }

  /**
   * جلب أسماء المستخدمين من Facebook Conversations API
   */
  private static async getFacebookUserNames(
    accessToken: string,
    pageId: string
  ): Promise<Map<string, string>> {
    try {
      const userNames = new Map<string, string>();
      let nextUrl = `https://graph.facebook.com/v18.0/me/conversations?fields=participants&access_token=${accessToken}&limit=100`;
      let pageCount = 0;

      while (nextUrl && pageCount < 3) { // حد أقصى 3 صفحات
        pageCount++;

        const response = await fetch(nextUrl);

        if (!response.ok) {
          console.error(`❌ [NAME_UPDATE] خطأ في Facebook API: ${response.status}`);
          break;
        }

        const data = await response.json();

        if (data.error) {
          console.error('❌ [NAME_UPDATE] خطأ في Facebook API:', data.error.message);
          break;
        }

        // استخراج أسماء المستخدمين
        if (data.data) {
          data.data.forEach((conversation: any) => {
            if (conversation.participants && conversation.participants.data) {
              conversation.participants.data.forEach((participant: any) => {
                // تجاهل الصفحة نفسها
                if (participant.id !== pageId && participant.name) {
                  userNames.set(participant.id, participant.name);
                }
              });
            }
          });
        }

        // الانتقال للصفحة التالية
        nextUrl = data.paging?.next || null;

        // انتظار قصير لتجنب rate limiting
        if (nextUrl) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      return userNames;
    } catch (error) {
      console.error('❌ [NAME_UPDATE] خطأ في جلب أسماء المستخدمين:', error);
      return new Map();
    }
  }

  /**
   * الحصول على اسم المستخدم مباشرة من Facebook API
   */
  private static async getUserNameDirectly(
    userId: string,
    accessToken: string
  ): Promise<string | null> {
    try {
      // فحص الكاش أولاً
      const cached = this.userNameCache.get(userId);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        return cached.name;
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${userId}?fields=name&access_token=${accessToken}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.error || !data.name) {
        return null;
      }

      // حفظ في الكاش
      this.userNameCache.set(userId, {
        name: data.name,
        timestamp: Date.now()
      });

      return data.name;
    } catch (error) {
      console.error(`❌ [NAME_UPDATE] خطأ في الحصول على اسم المستخدم ${userId}:`, error);
      return null;
    }
  }

  /**
   * تنظيف الأسماء الافتراضية وإعادة محاولة جلب الأسماء الحقيقية
   */
  static async cleanupDefaultNames(companyId: string): Promise<{
    success: boolean;
    cleaned: number;
    updated: number;
    message: string;
  }> {
    const pool = getPool();
    let cleaned = 0;
    let updated = 0;

    try {
      console.log(`🧹 [CLEANUP] بدء تنظيف الأسماء الافتراضية للشركة: ${companyId}`);

      // 1. جلب المحادثات ذات الأسماء الافتراضية
      const [conversations] = await pool.execute(`
        SELECT c.id, c.participant_id, c.customer_name, c.facebook_page_id,
               p.access_token, p.page_name
        FROM conversations c
        JOIN facebook_pages_unified p ON c.facebook_page_id = p.page_id
        WHERE c.company_id = ?
        AND p.is_active = 1
        AND (c.customer_name LIKE 'عميل %'
             OR c.customer_name LIKE 'مستخدم %'
             OR c.customer_name = 'undefined'
             OR c.customer_name IS NULL
             OR c.customer_name = '')
      `, [companyId]);

      console.log(`🔍 [CLEANUP] وجدت ${(conversations as any[]).length} محادثة تحتاج تنظيف`);

      // 2. تنظيف كل محادثة
      for (const conv of conversations as any[]) {
        try {
          // محاولة جلب الاسم الحقيقي
          const realName = await this.getUserNameDirectly(
            conv.participant_id,
            conv.access_token
          );

          if (realName && realName.trim() !== '') {
            // تحديث بالاسم الحقيقي
            await pool.execute(
              'UPDATE conversations SET customer_name = ?, updated_at = NOW() WHERE id = ?',
              [realName, conv.id]
            );

            console.log(`✅ [CLEANUP] تم تحديث: ${conv.customer_name || 'فارغ'} → ${realName}`);
            updated++;
          } else {
            // حذف الاسم الافتراضي وتركه فارغ
            await pool.execute(
              'UPDATE conversations SET customer_name = NULL, updated_at = NOW() WHERE id = ?',
              [conv.id]
            );

            console.log(`🧹 [CLEANUP] تم تنظيف الاسم الافتراضي: ${conv.customer_name}`);
            cleaned++;
          }
        } catch (error) {
          console.error(`❌ [CLEANUP] خطأ في تنظيف المحادثة ${conv.id}:`, error);
        }
      }

      return {
        success: true,
        cleaned,
        updated,
        message: `تم تنظيف ${cleaned} اسم افتراضي وتحديث ${updated} اسم حقيقي`
      };

    } catch (error) {
      console.error('❌ [CLEANUP] خطأ في تنظيف الأسماء الافتراضية:', error);
      return {
        success: false,
        cleaned: 0,
        updated: 0,
        message: 'فشل في تنظيف الأسماء الافتراضية'
      };
    }
  }

  /**
   * تحديث اسم مستخدم واحد
   */
  static async updateSingleUserName(
    userId: string,
    pageId: string,
    companyId: string
  ): Promise<boolean> {
    const pool = getPool();

    try {
      console.log(`🔍 [NAME_UPDATE] بدء تحديث اسم المستخدم: ${userId}`);

      // 1. التحقق من Cache أولاً
      const cacheKey = `${userId}_${pageId}`;
      if (this.userNameCache.has(cacheKey)) {
        const cached = this.userNameCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 3600000) { // ساعة واحدة
          console.log(`📋 [NAME_UPDATE] استخدام اسم من Cache: ${cached.name}`);

          await pool.execute(
            'UPDATE conversations SET customer_name = ?, updated_at = NOW() WHERE participant_id = ? AND facebook_page_id = ? AND company_id = ?',
            [cached.name, userId, pageId, companyId]
          );

          console.log(`✅ [NAME_UPDATE] تم تحديث اسم المستخدم من Cache: ${userId} → ${cached.name}`);
          return true;
        }
      }

      // 2. جلب إعدادات الصفحة من الجدول الموحد
      const [pageSettings] = await pool.execute<FacebookPageSettings[]>(
        'SELECT access_token FROM facebook_pages_unified WHERE page_id = ? AND company_id = ? AND is_active = 1',
        [pageId, companyId]
      );

      if (!pageSettings || pageSettings.length === 0) {
        console.log(`❌ [NAME_UPDATE] لا توجد إعدادات نشطة للصفحة: ${pageId}`);
        return false;
      }

      // 3. جلب الاسم بطرق متعددة
      let realName = null;

      // الطريقة 1: API مباشرة
      console.log(`🔍 [NAME_UPDATE] جلب الاسم من API مباشرة...`);
      realName = await this.getUserNameDirectly(userId, pageSettings[0].access_token);

      // الطريقة 2: البحث في المحادثات
      if (!realName) {
        console.log(`🔍 [NAME_UPDATE] البحث في المحادثات...`);
        realName = await this.searchInConversationsAPI(
          userId,
          pageSettings[0].access_token,
          pageId
        );
      }

      // الطريقة 3: اسم افتراضي ذكي
      if (!realName) {
        realName = `عميل ${userId.slice(-4)}`;
        console.log(`⚠️ [NAME_UPDATE] استخدام اسم افتراضي: ${realName}`);
      }

      // 4. حفظ في Cache
      this.userNameCache.set(cacheKey, {
        name: realName,
        timestamp: Date.now()
      });

      // 5. تحديث الاسم في قاعدة البيانات
      const [updateResult] = await pool.execute(
        'UPDATE conversations SET customer_name = ?, updated_at = NOW() WHERE participant_id = ? AND facebook_page_id = ? AND company_id = ?',
        [realName, userId, pageId, companyId]
      );

      if (updateResult.affectedRows > 0) {
        console.log(`✅ [NAME_UPDATE] تم تحديث اسم المستخدم: ${userId} → ${realName}`);
        return true;
      } else {
        console.log(`⚠️ [NAME_UPDATE] لم يتم تحديث أي محادثة للمستخدم: ${userId}`);
        return false;
      }

    } catch (error) {
      console.error(`❌ [NAME_UPDATE] خطأ في تحديث اسم المستخدم ${userId}:`, error);
      return false;
    }
  }

  /**
   * البحث عن اسم المستخدم في Conversations API بطريقة مختلفة
   */
  private static async searchInConversationsAPI(
    userId: string,
    accessToken: string,
    pageId: string
  ): Promise<string | null> {
    try {
      console.log(`🔍 [NAME_UPDATE] البحث المتقدم عن المستخدم: ${userId}`);

      // البحث في المحادثات الحديثة
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/conversations?fields=participants,updated_time&access_token=${accessToken}&limit=100`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.error || !data.data) {
        return null;
      }

      // البحث في جميع المحادثات
      for (const conversation of data.data) {
        if (conversation.participants && conversation.participants.data) {
          for (const participant of conversation.participants.data) {
            if (participant.id === userId && participant.name) {
              console.log(`✅ [NAME_UPDATE] وجدت الاسم في المحادثات: ${participant.name}`);
              return participant.name;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`❌ [NAME_UPDATE] خطأ في البحث المتقدم للمستخدم ${userId}:`, error);
      return null;
    }
  }
}
