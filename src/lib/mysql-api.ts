// 🗄️ طبقة API للاتصال بخادم MySQL من الواجهة الأمامية
// تحل محل Supabase client

// إعدادات الخادم
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
// تم التحويل للنظام المباشر - نستخدم نفس الخادم الرئيسي
const STORE_API_BASE_URL = import.meta.env.VITE_STORE_API_URL || 'http://localhost:3002';

// دالة مساعدة لإجراء طلبات HTTP
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    console.log('🌐 إرسال طلب إلى:', url);
    console.log('🔧 خيارات الطلب:', { ...defaultOptions, ...options });

    const response = await fetch(url, { ...defaultOptions, ...options });

    console.log('📡 استجابة الخادم:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));

      // التعامل مع API error format الجديد
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.success === false && errorData.message) {
        errorMessage = errorData.message;
      }

      return {
        data: null,
        error: errorMessage
      };
    }

    const responseData = await response.json();

    console.log('📊 استجابة JSON:', responseData);

    // التعامل مع API response format الجديد
    if (responseData.success !== undefined) {
      console.log('🔍 تحقق من success:', responseData.success);
      // إذا كان الـ response يحتوي على success field
      if (responseData.success) {
        console.log('✅ نجح الطلب، إرجاع البيانات');
        return { data: responseData.data, error: null };
      } else {
        console.log('❌ فشل الطلب:', responseData.error);
        return { data: null, error: responseData.error || 'API Error' };
      }
    }

    console.log('📦 استجابة مباشرة');
    // إذا كان الـ response مباشر
    return { data: responseData, error: null };
  } catch (error) {
    console.error('API Request Error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// دالة مساعدة لإجراء طلبات HTTP للـ Store API
async function storeApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const url = `${STORE_API_BASE_URL}${endpoint}`;
    console.log('🔗 Store API Request:', { url, options });

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      console.error('❌ Store API Error:', errorMessage);

      return {
        data: null,
        error: errorMessage
      };
    }

    const responseData = await response.json();

    // التعامل مع Store API response format
    if (responseData.success !== undefined) {
      if (responseData.success) {
        return { data: responseData.data, error: null };
      } else {
        return { data: null, error: responseData.error || 'Store API Error' };
      }
    }

    // إذا كان الـ response مباشر
    return { data: responseData, error: null };
  } catch (error) {
    console.error('Store API Request Error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ===================================
// 🏢 Company APIs
// ===================================

export const companyApi = {
  // الحصول على معلومات الشركة
  async getById(id: string) {
    return apiRequest(`/api/companies/${id}`);
  },

  // الحصول على إحصائيات الشركة
  async getStats(id: string) {
    return apiRequest(`/api/companies/${id}/stats`);
  },

  // تحديث معلومات الشركة
  async update(id: string, data: any) {
    return apiRequest(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ===================================
// 📱 Facebook APIs
// ===================================

export const facebookApi = {
  // الحصول على إعدادات فيسبوك للشركة
  async getSettings(companyId: string) {
    return apiRequest(`/api/facebook/settings?company_id=${companyId}`);
  },

  // إضافة صفحة فيسبوك جديدة
  async addPage(data: {
    company_id: string;
    page_id: string;
    page_name: string;
    access_token: string;
  }) {
    return apiRequest('/api/facebook/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // تحديث إعدادات صفحة فيسبوك
  async updatePage(pageId: string, data: any) {
    return apiRequest(`/api/facebook/settings/${pageId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // حذف صفحة فيسبوك
  async deletePage(pageId: string) {
    return apiRequest(`/api/facebook/settings/${pageId}`, {
      method: 'DELETE',
    });
  },
};

// ===================================
// 💬 Conversations APIs
// ===================================

export const conversationsApi = {
  // الحصول على محادثات الشركة (الدالة الرئيسية)
  async getConversations(companyId: string, limit = 50, recentOnly = true) {
    console.log('🔍 conversationsApi.getConversations:', { companyId, limit, recentOnly });

    // إضافة timestamp لكسر cache
    const timestamp = Date.now();
    const url = `/api/companies/${companyId}/conversations?limit=${limit}&recent_only=${recentOnly}&_t=${timestamp}`;

    console.log('📡 طلب API:', `${API_BASE_URL}${url}`);

    const result = await apiRequest(url);

    console.log('📊 نتيجة API:', result);

    return result;
  },

  // الحصول على محادثات الشركة (اسم بديل)
  async getByCompany(companyId: string, limit = 50, recentOnly = true) {
    return this.getConversations(companyId, limit, recentOnly);
  },

  // الحصول على محادثة معينة
  async getById(id: string) {
    return apiRequest(`/api/conversations/${id}`);
  },

  // البحث في المحادثات
  async search(companyId: string, query: string) {
    return apiRequest(`/api/conversations/search?company_id=${companyId}&q=${encodeURIComponent(query)}`);
  },

  // تحديث حالة المحادثة
  async updateStatus(id: string, status: string) {
    return apiRequest(`/api/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // حذف محادثة
  async deleteConversation(id: string) {
    return apiRequest(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
  },
};

// ===================================
// 💌 Messages APIs
// ===================================

export const messagesApi = {
  // الحصول على رسائل محادثة معينة (الدالة الرئيسية)
  async getMessages(conversationId: string, companyId: string, limit = 50, recentOnly = true) {
    console.log('🔍 messagesApi.getMessages:', { conversationId, companyId, limit, recentOnly });

    // إضافة timestamp لكسر cache
    const timestamp = Date.now();
    const url = `/api/conversations/${conversationId}/messages?company_id=${companyId}&limit=${limit}&recent_only=${recentOnly}&_t=${timestamp}`;

    console.log('📡 طلب رسائل API:', `${API_BASE_URL}${url}`);

    const result = await apiRequest(url);

    console.log('📊 نتيجة رسائل API:', result);

    return result;
  },

  // الحصول على الرسائل الحديثة فقط (آخر 24 ساعة)
  async getRecentMessages(conversationId: string, companyId: string, limit = 50) {
    console.log('🔍 messagesApi.getRecentMessages:', { conversationId, companyId, limit });

    // إضافة timestamp لكسر cache
    const timestamp = Date.now();
    const url = `/api/conversations/${conversationId}/messages/recent?company_id=${companyId}&limit=${limit}&_t=${timestamp}`;

    console.log('📡 طلب رسائل حديثة API:', `${API_BASE_URL}${url}`);

    const result = await apiRequest(url);

    console.log('📊 نتيجة رسائل حديثة API:', result);

    return result;
  },

  // الحصول على رسائل محادثة معينة (اسم بديل)
  async getByConversation(conversationId: string, limit = 50) {
    return apiRequest(`/api/conversations/${conversationId}/messages?limit=${limit}`);
  },

  // الحصول على الرسائل الحديثة للشركة
  async getRecent(companyId: string, limit = 100) {
    return apiRequest(`/api/messages/recent?company_id=${companyId}&limit=${limit}`);
  },

  // إرسال رسالة جديدة (الدالة الرئيسية)
  async sendMessage(data: {
    conversation_id: string;
    company_id: string;
    message_text: string;
    message_type?: string;
    sender_type?: string;
    image_data?: string;      // بيانات الصورة base64
    image_name?: string;      // اسم الصورة
  }) {
    console.log('📤 messagesApi.sendMessage:', data);
    return apiRequest(`/api/conversations/${data.conversation_id}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // إرسال رسالة جديدة (اسم بديل)
  async send(conversationId: string, data: {
    content: string;
    company_id: string;
    sender_type?: string;
  }) {
    return this.sendMessage({
      conversation_id: conversationId,
      company_id: data.company_id,
      message_text: data.content,
      sender_type: data.sender_type || 'page'
    });
  },

  // تحديث حالة الرسالة
  async updateStatus(messageId: string, status: string, isRead?: boolean) {
    return apiRequest(`/api/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, is_read: isRead }),
    });
  },
};

// ===================================
// 🤖 Gemini AI APIs
// ===================================

export const geminiApi = {
  // الحصول على إعدادات الذكي الاصطناعي
  async getSettings(companyId: string) {
    return apiRequest(`/api/gemini/settings?company_id=${companyId}`);
  },

  // تحديث إعدادات الذكي الاصطناعي
  async updateSettings(data: any) {
    return apiRequest('/api/gemini/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // اختبار الذكي الاصطناعي
  async test(companyId: string, message: string) {
    return apiRequest('/api/gemini/test', {
      method: 'POST',
      body: JSON.stringify({ company_id: companyId, message }),
    });
  },
};

// ===================================
// 📊 Analytics & Stats APIs
// ===================================

export const analyticsApi = {
  // إحصائيات عامة
  async getOverview(companyId: string) {
    return apiRequest(`/api/analytics/overview?company_id=${companyId}`);
  },

  // إحصائيات المحادثات
  async getConversationsStats(companyId: string, period = '7d') {
    return apiRequest(`/api/analytics/conversations?company_id=${companyId}&period=${period}`);
  },

  // إحصائيات الرسائل
  async getMessagesStats(companyId: string, period = '7d') {
    return apiRequest(`/api/analytics/messages?company_id=${companyId}&period=${period}`);
  },
};

// ===================================
// 🏪 Store APIs
// ===================================

export const storeApi = {
  // الحصول على متجر الشركة
  async getByCompany(companyId: string) {
    console.log('🔍 storeApi.getByCompany:', { companyId });
    return storeApiRequest(`/api/companies/${companyId}/store`);
  },

  // إنشاء متجر جديد للشركة
  async create(companyId: string, storeData: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    logo_url?: string;
  }) {
    console.log('🏪 storeApi.create:', { companyId, storeData });
    return storeApiRequest(`/api/companies/${companyId}/store`, {
      method: 'POST',
      body: JSON.stringify(storeData),
    });
  },

  // تحديث متجر الشركة
  async update(companyId: string, storeData: {
    name?: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    logo_url?: string;
    is_active?: boolean;
  }) {
    console.log('📝 storeApi.update:', { companyId, storeData });
    return storeApiRequest(`/api/companies/${companyId}/store`, {
      method: 'PUT',
      body: JSON.stringify(storeData),
    });
  },

  // تفعيل/إلغاء تفعيل المتجر
  async toggleStatus(companyId: string, isActive: boolean) {
    console.log('🔄 storeApi.toggleStatus:', { companyId, isActive });
    return storeApiRequest(`/api/companies/${companyId}/store/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  },
};

// ===================================
// 🔧 System APIs
// ===================================

export const systemApi = {
  // فحص صحة النظام
  async health() {
    return apiRequest('/api/health');
  },

  // معلومات النظام
  async info() {
    return apiRequest('/api/system/info');
  },
};

// ===================================
// 🔄 Real-time Subscriptions (محاكاة)
// ===================================

// محاكاة subscriptions باستخدام polling
export class MySQLSubscription {
  private intervalId: number | null = null;
  private callback: (data: any) => void;
  private endpoint: string;
  private interval: number;

  constructor(endpoint: string, callback: (data: any) => void, interval = 5000) {
    this.endpoint = endpoint;
    this.callback = callback;
    this.interval = interval;
  }

  subscribe() {
    // استعلام فوري
    this.fetchData();
    
    // استعلام دوري
    this.intervalId = window.setInterval(() => {
      this.fetchData();
    }, this.interval);

    return this;
  }

  unsubscribe() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async fetchData() {
    try {
      const result = await apiRequest(this.endpoint);
      if (result.data) {
        this.callback(result.data);
      }
    } catch (error) {
      console.error('Subscription fetch error:', error);
    }
  }
}

// دالة مساعدة لإنشاء subscriptions
export function createSubscription(
  endpoint: string, 
  callback: (data: any) => void, 
  interval = 5000
) {
  return new MySQLSubscription(endpoint, callback, interval);
}

// ===================================
// 🔐 Auth APIs (للمستقبل)
// ===================================

export const authApi = {
  // تسجيل الدخول
  async login(email: string, password: string) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // تسجيل الخروج
  async logout() {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  // الحصول على المستخدم الحالي
  async getCurrentUser() {
    return apiRequest('/api/auth/user');
  },
};

// 🏪 Store API مباشر (بدلاً من Simple Store Server)
export const directStoreApi = {
  // جلب متجر الشركة
  async getByCompany(companyId: string) {
    return apiRequest<{
      id: string;
      company_id: string;
      name: string;
      description?: string;
      phone?: string;
      email?: string;
      address?: string;
      website?: string;
      logo_url?: string;
      is_active: boolean;
      created_at: string;
      updated_at?: string;
    }>(`/companies/${companyId}/store`);
  },

  // إنشاء متجر جديد
  async create(companyId: string, storeData: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    logo_url?: string;
  }) {
    return apiRequest(`/companies/${companyId}/store`, {
      method: 'POST',
      body: JSON.stringify(storeData),
    });
  },

  // تحديث متجر
  async update(companyId: string, storeData: {
    name?: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
    logo_url?: string;
  }) {
    return apiRequest(`/companies/${companyId}/store`, {
      method: 'PUT',
      body: JSON.stringify(storeData),
    });
  },

  // تفعيل/إلغاء تفعيل المتجر
  async toggleStatus(companyId: string, isActive: boolean) {
    return apiRequest(`/companies/${companyId}/store/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
  },

  // حذف المتجر
  async delete(companyId: string) {
    return apiRequest(`/companies/${companyId}/store`, {
      method: 'DELETE',
    });
  },
};

// تصدير API الرئيسي
export const mysqlApi = {
  company: companyApi,
  facebook: facebookApi,
  conversations: conversationsApi,
  messages: messagesApi,
  store: storeApi,
  directStore: directStoreApi, // Store API مباشر
  gemini: geminiApi,
  analytics: analyticsApi,
  system: systemApi,
  auth: authApi,
};

// تصدير افتراضي
export default mysqlApi;
