/**
 * 🏢 API للشركات - MySQL
 * يحل محل Supabase للواجهة الأمامية
 */

// إعدادات الخادم
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

/**
 * دالة مساعدة لإرسال الطلبات - محسنة ومضمونة
 */
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  console.log(`📡 [API] ${options.method || 'GET'} ${url}`);
  console.log(`📤 [API] البيانات المرسلة:`, options.body);

  try {
    const response = await fetch(url, defaultOptions);

    console.log(`📊 [API] حالة الاستجابة:`, response.status, response.statusText);

    // التحقق من وجود محتوى في الاستجابة
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`❌ [API] نوع المحتوى غير صحيح:`, contentType);
      throw new Error('استجابة غير صحيحة من الخادم');
    }

    const data = await response.json();
    console.log(`📥 [API] البيانات المستلمة:`, data);

    if (!response.ok) {
      console.error(`❌ [API] خطأ ${response.status}:`, data);
      throw new Error(data.error || data.message || `خطأ HTTP ${response.status}`);
    }

    console.log(`✅ [API] نجح الطلب بنجاح`);
    return data;
  } catch (error) {
    console.error(`💥 [API] خطأ في الطلب:`, error);

    // إذا كان خطأ في الشبكة
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('فشل في الاتصال بالخادم. تأكد من أن الخادم يعمل.');
    }

    throw error;
  }
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country: string;
  status: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface CompanyRegistrationData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
}

/**
 * 🏢 خدمة الشركات للواجهة الأمامية
 */
export class CompanyServiceMySQL {

  /**
   * 🏢 تسجيل شركة جديدة
   */
  static async registerCompany(data: CompanyRegistrationData): Promise<{
    success: boolean;
    message: string;
    company?: Company;
  }> {
    try {
      console.log('🏢 [FRONTEND] بدء تسجيل شركة جديدة:', data.name);
      console.log('📝 [FRONTEND] البيانات المرسلة:', { ...data, password: '***' });

      const response = await apiRequest('/api/companies/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      console.log('📡 [FRONTEND] استجابة الخادم الكاملة:', response);

      // التحقق من صحة الاستجابة
      if (!response || typeof response !== 'object') {
        console.error('❌ [FRONTEND] استجابة غير صحيحة:', response);
        return {
          success: false,
          message: 'استجابة غير صحيحة من الخادم'
        };
      }

      // التحقق من وجود success في الاستجابة
      if (typeof response.success !== 'boolean') {
        console.error('❌ [FRONTEND] حقل success مفقود أو غير صحيح:', response.success);
        return {
          success: false,
          message: 'استجابة غير مكتملة من الخادم'
        };
      }

      console.log('✅ [FRONTEND] حالة النجاح:', response.success);
      console.log('💬 [FRONTEND] الرسالة:', response.message);
      console.log('🏢 [FRONTEND] بيانات الشركة:', response.company);

      // إذا نجح التسجيل
      if (response.success) {
        // التحقق من وجود بيانات الشركة
        const companyData = response.company || response.data;

        if (!companyData) {
          console.error('❌ [FRONTEND] بيانات الشركة مفقودة في الاستجابة');
          return {
            success: false,
            message: 'بيانات الشركة مفقودة في الاستجابة'
          };
        }

        console.log('🎉 [FRONTEND] تم التسجيل بنجاح!');
        return {
          success: true,
          message: response.message || 'تم التسجيل بنجاح',
          company: companyData
        };
      } else {
        // فشل التسجيل
        console.log('❌ [FRONTEND] فشل التسجيل:', response.message);
        return {
          success: false,
          message: response.message || 'فشل في تسجيل الشركة'
        };
      }

    } catch (error) {
      console.error('💥 [FRONTEND] خطأ استثنائي في تسجيل الشركة:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      };
    }
  }

  /**
   * 🔐 تسجيل دخول الشركة
   */
  static async loginCompany(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    company?: Company;
  }> {
    try {
      console.log('🔐 [FRONTEND] تسجيل دخول شركة:', email);

      const response = await apiRequest('/api/companies/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      console.log('📥 [FRONTEND] استجابة تسجيل الدخول:', response);

      // تحويل الاستجابة للتنسيق المتوقع
      if (response.success && response.data?.company) {
        return {
          success: true,
          message: response.message || 'تم تسجيل الدخول بنجاح',
          company: response.data.company
        };
      } else {
        return {
          success: false,
          message: response.message || 'فشل في تسجيل الدخول'
        };
      }
    } catch (error) {
      console.error('❌ [FRONTEND] خطأ في تسجيل الدخول:', error);
      return {
        success: false,
        message: error.message || 'فشل في تسجيل الدخول'
      };
    }
  }

  /**
   * 📋 جلب معلومات الشركة
   */
  static async getCompany(companyId: string): Promise<Company | null> {
    try {
      console.log('📋 [FRONTEND] جلب معلومات الشركة:', companyId);

      const response = await apiRequest(`/api/companies/${companyId}`);

      return response.success ? response.data : null;
    } catch (error) {
      console.error('❌ [FRONTEND] خطأ في جلب الشركة:', error);
      return null;
    }
  }

  /**
   * 📋 جلب جميع الشركات
   */
  static async getAllCompanies(): Promise<Company[]> {
    try {
      console.log('📋 [FRONTEND] جلب جميع الشركات');

      const response = await apiRequest('/api/companies');

      return response.success ? response.data : [];
    } catch (error) {
      console.error('❌ [FRONTEND] خطأ في جلب الشركات:', error);
      return [];
    }
  }

  /**
   * 🔄 تحديث معلومات الشركة
   */
  static async updateCompany(companyId: string, data: Partial<Company>): Promise<{
    success: boolean;
    message: string;
    company?: Company;
  }> {
    try {
      console.log('🔄 [FRONTEND] تحديث معلومات الشركة:', companyId);

      const response = await apiRequest(`/api/companies/${companyId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      return response;
    } catch (error) {
      console.error('❌ [FRONTEND] خطأ في تحديث الشركة:', error);
      return {
        success: false,
        message: error.message || 'فشل في تحديث الشركة'
      };
    }
  }

  /**
   * 🗑️ حذف الشركة
   */
  static async deleteCompany(companyId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log('🗑️ [FRONTEND] حذف الشركة:', companyId);

      const response = await apiRequest(`/api/companies/${companyId}`, {
        method: 'DELETE',
      });

      return response;
    } catch (error) {
      console.error('❌ [FRONTEND] خطأ في حذف الشركة:', error);
      return {
        success: false,
        message: error.message || 'فشل في حذف الشركة'
      };
    }
  }

  /**
   * 📊 جلب إحصائيات الشركة
   */
  static async getCompanyStats(companyId: string): Promise<{
    conversations: number;
    messages: number;
    facebook_pages: number;
    whatsapp_sessions: number;
  } | null> {
    try {
      console.log('📊 [FRONTEND] جلب إحصائيات الشركة:', companyId);

      const response = await apiRequest(`/api/analytics/overview?company_id=${companyId}`);

      return response.success ? response.data : null;
    } catch (error) {
      console.error('❌ [FRONTEND] خطأ في جلب الإحصائيات:', error);
      return null;
    }
  }

  /**
   * 🔍 البحث في الشركات
   */
  static async searchCompanies(query: string): Promise<Company[]> {
    try {
      console.log('🔍 [FRONTEND] البحث في الشركات:', query);

      const response = await apiRequest(`/api/companies/search?q=${encodeURIComponent(query)}`);

      return response.success ? response.data : [];
    } catch (error) {
      console.error('❌ [FRONTEND] خطأ في البحث:', error);
      return [];
    }
  }

  /**
   * 🔐 تغيير كلمة المرور
   */
  static async changePassword(companyId: string, currentPassword: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log('🔐 [FRONTEND] تغيير كلمة المرور:', companyId);

      const response = await apiRequest(`/api/companies/${companyId}/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      return response;
    } catch (error) {
      console.error('❌ [FRONTEND] خطأ في تغيير كلمة المرور:', error);
      return {
        success: false,
        message: error.message || 'فشل في تغيير كلمة المرور'
      };
    }
  }

  /**
   * 📧 إرسال رمز التحقق
   */
  static async sendVerificationCode(email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log('📧 [FRONTEND] إرسال رمز التحقق:', email);

      const response = await apiRequest('/api/companies/send-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      return response;
    } catch (error) {
      console.error('❌ [FRONTEND] خطأ في إرسال رمز التحقق:', error);
      return {
        success: false,
        message: error.message || 'فشل في إرسال رمز التحقق'
      };
    }
  }

  /**
   * ✅ تأكيد البريد الإلكتروني
   */
  static async verifyEmail(email: string, code: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log('✅ [FRONTEND] تأكيد البريد الإلكتروني:', email);

      const response = await apiRequest('/api/companies/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });

      return response;
    } catch (error) {
      console.error('❌ [FRONTEND] خطأ في تأكيد البريد:', error);
      return {
        success: false,
        message: error.message || 'فشل في تأكيد البريد الإلكتروني'
      };
    }
  }
}

// تصدير افتراضي
export default CompanyServiceMySQL;
