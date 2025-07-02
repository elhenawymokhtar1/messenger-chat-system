/**
 * 🔐 نظام المصادقة المبسط والصحيح
 * يحفظ token في localStorage ويجلب بيانات الشركة من قاعدة البيانات
 */

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
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
        
        // للتطوير: إنشاء session تجريبي تلقائياً
        console.log('🧪 [AUTH] إنشاء session تجريبي للتطوير...');
        await createDevelopmentSession();
        
        setLoading(false);
        return;
      }
      
      // للتطوير: قبول أي token يبدأ بـ dev_ وجلب البيانات من API
      if (token.startsWith('dev_token_')) {
        console.log('✅ [AUTH] Token تجريبي صحيح، جلب بيانات الشركة من API...');

        try {
          // جلب بيانات الشركة من API الحقيقي
          const response = await fetch(`http://localhost:3002/api/companies/${companyId}`);

          if (response.ok) {
            const apiData = await response.json();

            if (apiData.success && apiData.data) {
              const companyData: AuthUser = {
                id: apiData.data.id,
                name: apiData.data.name,
                email: apiData.data.email,
                status: apiData.data.status,
                created_at: apiData.data.created_at
              };

              setUser(companyData);
              console.log('✅ [AUTH] تم تحميل بيانات الشركة من API:', companyData.name);
            } else {
              console.warn('⚠️ [AUTH] فشل جلب بيانات الشركة من API');
              logout();
            }
          } else {
            console.warn('⚠️ [AUTH] خطأ في API الشركات:', response.status);
            logout();
          }
        } catch (error) {
          console.error('❌ [AUTH] خطأ في جلب بيانات الشركة:', error);
          logout();
        }
      } else {
        console.warn('⚠️ [AUTH] Token غير معروف');
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
      
      // للتطوير: قبول أي بيانات
      if (process.env.NODE_ENV === 'development') {
        const testCompany: AuthUser = {
          id: 'c677b32f-fe1c-4c64-8362-a1c03406608d',
          name: 'شركة تجريبية للمحادثات',
          email: email,
          status: 'active',
          created_at: new Date().toISOString()
        };
        
        // إنشاء token تجريبي
        const testToken = 'dev_token_' + Date.now();
        
        // حفظ token و company_id فقط في localStorage
        localStorage.setItem('auth_token', testToken);
        localStorage.setItem('company_id', testCompany.id);
        
        // حفظ بيانات الشركة في state
        setUser(testCompany);
        
        console.log('✅ [AUTH] تم تسجيل الدخول بنجاح:', testCompany.name);
        return true;
      }
      
      // في الإنتاج: استدعاء API حقيقي
      console.warn('⚠️ [AUTH] API المصادقة غير مُعد بعد');
      return false;
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
  const createDevelopmentSession = async () => {
    const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    const testToken = 'dev_token_' + Date.now();

    // حفظ token و company_id
    localStorage.setItem('auth_token', testToken);
    localStorage.setItem('company_id', companyId);

    try {
      // جلب بيانات الشركة من API
      const response = await fetch(`http://localhost:3002/api/companies/${companyId}`);

      if (response.ok) {
        const apiData = await response.json();

        if (apiData.success && apiData.data) {
          const companyData: AuthUser = {
            id: apiData.data.id,
            name: apiData.data.name,
            email: apiData.data.email,
            status: apiData.data.status,
            created_at: apiData.data.created_at
          };

          setUser(companyData);
          console.log('🧪 [AUTH] تم إنشاء session تجريبي مع بيانات حقيقية:', companyData.name);
        } else {
          console.warn('⚠️ [AUTH] فشل جلب بيانات الشركة للـ session التجريبي');
        }
      } else {
        console.warn('⚠️ [AUTH] خطأ في API للـ session التجريبي');
      }
    } catch (error) {
      console.error('❌ [AUTH] خطأ في إنشاء session تجريبي:', error);

      // fallback: استخدام بيانات افتراضية
      const fallbackCompany: AuthUser = {
        id: companyId,
        name: 'شركة تجريبية للمحادثات',
        email: 'test@conversations.com',
        status: 'active',
        created_at: new Date().toISOString()
      };

      setUser(fallbackCompany);
      console.log('🧪 [AUTH] تم إنشاء session تجريبي مع بيانات افتراضية');
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
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
