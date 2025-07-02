/**
 * 🔐 نظام المصادقة الصحيح
 * يحفظ token في localStorage ويجلب بيانات الشركة من API
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { companyAuthApi } from '@/lib/auth-api';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // التحقق من المصادقة عند تحميل التطبيق
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 [AUTH] التحقق من حالة المصادقة...');
      
      // فحص وجود token
      const token = localStorage.getItem('auth_token');
      const companyId = localStorage.getItem('company_id');
      
      if (!token || !companyId) {
        console.log('ℹ️ [AUTH] لا يوجد token أو company_id');
        setLoading(false);
        return;
      }
      
      // التحقق من صحة token مع الخادم
      const response = await companyAuthApi.verifyToken(token);

      if (response.success && response.data) {
        console.log('✅ [AUTH] Token صحيح، جلب بيانات الشركة...');

        // جلب بيانات الشركة من قاعدة البيانات
        const companyResponse = await companyAuthApi.getCompanyById(companyId);
        
        if (companyResponse.success && companyResponse.data) {
          setUser(companyResponse.data);
          console.log('✅ [AUTH] تم تحميل بيانات الشركة:', companyResponse.data.name);
        } else {
          console.warn('⚠️ [AUTH] فشل جلب بيانات الشركة');
          logout();
        }
      } else {
        console.warn('⚠️ [AUTH] Token غير صحيح');
        logout();
      }
    } catch (error) {
      console.error('❌ [AUTH] خطأ في التحقق من المصادقة:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 [AUTH] محاولة تسجيل الدخول...');
      
      const response = await companyAuthApi.login({ email, password });
      
      if (response.success && response.data) {
        const { token, company } = response.data;
        
        // حفظ token و company_id فقط في localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('company_id', company.id);
        
        // حفظ بيانات الشركة في state
        setUser(company);
        
        console.log('✅ [AUTH] تم تسجيل الدخول بنجاح:', company.name);
        return true;
      } else {
        console.warn('⚠️ [AUTH] فشل تسجيل الدخول:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ [AUTH] خطأ في تسجيل الدخول:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('🚪 [AUTH] تسجيل الخروج...');
    
    // مسح localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('company_id');
    
    // مسح state
    setUser(null);
    
    console.log('✅ [AUTH] تم تسجيل الخروج');
  };

  // للتطوير: إنشاء session تجريبي
  const createDevelopmentSession = () => {
    const testCompany = {
      id: 'c677b32f-fe1c-4c64-8362-a1c03406608d',
      name: 'شركة تجريبية للمحادثات',
      email: 'test@conversations.com',
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    // إنشاء token تجريبي
    const testToken = 'dev_token_' + Date.now();
    
    localStorage.setItem('auth_token', testToken);
    localStorage.setItem('company_id', testCompany.id);
    setUser(testCompany);
    
    console.log('🧪 [AUTH] تم إنشاء session تجريبي');
  };

  // للتطوير: إنشاء session تلقائياً إذا لم يوجد
  useEffect(() => {
    if (!loading && !user && process.env.NODE_ENV === 'development') {
      console.log('🧪 [AUTH] إنشاء session تجريبي للتطوير...');
      createDevelopmentSession();
    }
  }, [loading, user]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook مبسط للحصول على الشركة الحالية
export const useCurrentCompany = () => {
  const { user, loading } = useAuth();
  
  return {
    company: user,
    loading,
    isNewCompany: user ? isCompanyNew(user.created_at) : false
  };
};

// دالة للتحقق من كون الشركة جديدة
const isCompanyNew = (createdAt: string): boolean => {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffInDays <= 7;
};