// ملف إعدادات API موحد لمنع تكرار الأخطاء

// إعدادات البيئة
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// عناوين الخوادم
export const API_CONFIG = {
  // الخادم الرئيسي
  BASE_URL: isDevelopment
    ? 'http://localhost:3002'
    : 'https://your-production-api.com',
  
  // خادم المصادقة (إذا كان منفصل)
  AUTH_URL: isDevelopment 
    ? 'http://localhost:3002' 
    : 'https://your-auth-api.com',
  
  // المهلة الزمنية للطلبات
  TIMEOUT: 10000, // 10 ثواني
  
  // إعدادات إعادة المحاولة
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 ثانية
};

// نقاط النهاية (Endpoints)
export const API_ENDPOINTS = {
  // الطلبات
  ORDERS: {
    LIST: '/api/companies/kok/orders',
    DETAIL: (id: string) => `/api/companies/kok/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/api/companies/kok/orders/${id}/status`,
    UPDATE_PAYMENT: (id: string) => `/api/companies/kok/orders/${id}/payment`,
  },
  
  // المنتجات
  PRODUCTS: {
    LIST: '/api/products',
    DETAIL: (id: string) => `/api/products/${id}`,
    CREATE: '/api/products',
    UPDATE: (id: string) => `/api/products/${id}`,
    DELETE: (id: string) => `/api/products/${id}`,
  },
  
  // العملاء
  CUSTOMERS: {
    LIST: '/api/customers',
    DETAIL: (id: string) => `/api/customers/${id}`,
  },
  
  // السلة
  CART: {
    GET: '/api/cart',
    ADD: '/api/cart/add',
    UPDATE: '/api/cart/update',
    REMOVE: '/api/cart/remove',
    CLEAR: '/api/cart/clear',
  },
  
  // المصادقة
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
  },
};

// دالة بناء URL كامل
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// دالة إعدادات الطلب الافتراضية
export const getDefaultHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

// دالة إعدادات الطلب مع المصادقة
export const getAuthHeaders = (token?: string): HeadersInit => {
  const headers = getDefaultHeaders();
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  return headers;
};

// دالة معالجة الأخطاء الموحدة
export const handleApiError = (error: any): string => {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.';
  }
  
  if (error.status) {
    switch (error.status) {
      case 400:
        return 'طلب غير صحيح. تحقق من البيانات المرسلة.';
      case 401:
        return 'غير مصرح. يرجى تسجيل الدخول مرة أخرى.';
      case 403:
        return 'ممنوع. ليس لديك صلاحية للوصول.';
      case 404:
        return 'المورد غير موجود.';
      case 500:
        return 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
      default:
        return `خطأ غير متوقع: ${error.status}`;
    }
  }
  
  return error.message || 'حدث خطأ غير متوقع';
};

// دالة طلب API موحدة مع معالجة الأخطاء
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = buildApiUrl(endpoint);
  const defaultOptions: RequestInit = {
    headers: getDefaultHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
};

// دالة طلب مع إعادة المحاولة
export const apiRequestWithRetry = async <T>(
  endpoint: string,
  options: RequestInit = {},
  maxRetries: number = API_CONFIG.RETRY_ATTEMPTS
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiRequest<T>(endpoint, options);
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`محاولة ${attempt} فشلت، إعادة المحاولة...`);
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt));
      }
    }
  }
  
  throw lastError;
};

// تصدير الإعدادات
export default {
  API_CONFIG,
  API_ENDPOINTS,
  buildApiUrl,
  getDefaultHeaders,
  getAuthHeaders,
  handleApiError,
  apiRequest,
  apiRequestWithRetry,
};
