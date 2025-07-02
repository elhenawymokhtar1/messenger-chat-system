/**
 * 🔐 API المصادقة الصحيح
 * يتعامل مع قاعدة البيانات لتسجيل الدخول والتحقق من token
 */

import { apiRequest } from './mysql-api';

export const authApi = {
  // تسجيل الدخول
  async login(credentials: { email: string; password: string }) {
    console.log('🔐 authApi.login:', { email: credentials.email });
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // التحقق من صحة token
  async verifyToken(token: string) {
    console.log('🔍 authApi.verifyToken');
    return apiRequest('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // تسجيل الخروج
  async logout() {
    console.log('🚪 authApi.logout');
    return apiRequest('/api/auth/logout', {
      method: 'POST'
    });
  },

  // تجديد token
  async refreshToken() {
    console.log('🔄 authApi.refreshToken');
    return apiRequest('/api/auth/refresh', {
      method: 'POST'
    });
  }
};

// إضافة دوال المصادقة لـ companyApi
export const companyAuthApi = {
  // تسجيل الدخول للشركة
  async login(credentials: { email: string; password: string }) {
    // للتطوير: إرجاع بيانات تجريبية
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        data: {
          token: 'dev_token_' + Date.now(),
          company: {
            id: 'c677b32f-fe1c-4c64-8362-a1c03406608d',
            name: 'شركة تجريبية للمحادثات',
            email: credentials.email,
            status: 'active',
            created_at: new Date().toISOString()
          }
        }
      };
    }
    
    return authApi.login(credentials);
  },

  // التحقق من token
  async verifyToken(token: string) {
    // للتطوير: قبول أي token يبدأ بـ dev_
    if (process.env.NODE_ENV === 'development' && token.startsWith('dev_token_')) {
      return {
        success: true,
        data: { valid: true }
      };
    }
    
    return authApi.verifyToken(token);
  },

  // جلب بيانات الشركة بالمعرف
  async getCompanyById(companyId: string) {
    console.log('🏢 companyAuthApi.getCompanyById:', companyId);
    return apiRequest(`/api/companies/${companyId}`);
  }
};