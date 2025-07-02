/**
 * 🚫 خدمة التحقق من حدود الخطة
 * تاريخ الإنشاء: 22 يونيو 2025
 * تم التحديث: 29 يونيو 2025 - تحويل إلى MySQL
 */

export interface PlanLimits {
  max_users: number;
  max_messages: number;
  max_images: number;
  max_products: number;
  features: string[];
}

export class PlanLimitsService {
  
  /**
   * 📊 الحصول على حدود الخطة حسب النوع
   */
  static getPlanLimits(planType: string): PlanLimits {
    const plans: Record<string, PlanLimits> = {
      free: {
        max_users: 2,
        max_messages: 100,
        max_images: 10,
        max_products: 50,
        features: ['basic_chat', 'basic_analytics']
      },
      premium: {
        max_users: 20,
        max_messages: 10000,
        max_images: 1000,
        max_products: 1000,
        features: ['basic_chat', 'basic_analytics', 'auto_replies', 'advanced_analytics', 'ai_responses']
      }
    };

    return plans[planType] || plans.free;
  }

  /**
   * 🔍 التحقق من حدود الخطة للشركة
   */
  static async checkLimits(companyId: string) {
    try {
      console.log('🔍 [LIMITS] فحص حدود الخطة للشركة:', companyId);

      // TODO: Replace with MySQL API
      // مؤقتاً نرجع حدود افتراضية حتى يتم تطوير MySQL API
      
      const defaultLimits = this.getPlanLimits('premium');
      const mockUsage = { users: 1, messages: 10, images: 5, products: 20 };
      const canAdd = {
        users: mockUsage.users < defaultLimits.max_users,
        messages: mockUsage.messages < defaultLimits.max_messages,
        images: mockUsage.images < defaultLimits.max_images,
        products: mockUsage.products < defaultLimits.max_products
      };

      return {
        limits: defaultLimits,
        usage: mockUsage,
        canAdd
      };

    } catch (error) {
      console.error('❌ [LIMITS] خطأ في فحص الحدود:', error);
      
      const defaultLimits = this.getPlanLimits('free');
      return {
        limits: defaultLimits,
        usage: { users: 0, messages: 0, images: 0, products: 0 },
        canAdd: { users: true, messages: true, images: true, products: true }
      };
    }
  }
}

export default PlanLimitsService;
