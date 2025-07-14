/**
 * 🔐 نظام المصادقة الصحيح - معطل localStorage
 * يستخدم React state فقط مع شركة kok@kok.com الثابتة
 */

import React, { useState, useEffect, createContext, useContext } from 'react';

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
      console.log('🔧 [AUTH] استخدام شركة kok@kok.com الثابتة (بدون localStorage)');

      // استخدام شركة kok@kok.com الثابتة دائماً
      const fixedCompany: AuthUser = {
        id: '2d9b8887-0cca-430b-b61b-ca16cccfec63',
        name: 'kok',
        email: 'kok@kok.com',
        status: 'active',
        created_at: '2025-07-12T21:00:00.000Z'
      };

      console.log('✅ [AUTH] تم تعيين شركة kok@kok.com');
      setUser(fixedCompany);
      setLoading(false);
      return;

    } catch (error) {
      console.error('❌ [AUTH] خطأ في التحقق من حالة المصادقة:', error);
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 [AUTH] محاولة تسجيل الدخول...');
      console.log('✅ [AUTH] تسجيل دخول تلقائي لشركة kok@kok.com');

      // استخدام شركة kok@kok.com الثابتة دائماً
      const fixedCompany: AuthUser = {
        id: '2d9b8887-0cca-430b-b61b-ca16cccfec63',
        name: 'kok',
        email: 'kok@kok.com',
        status: 'active',
        created_at: '2025-07-12T21:00:00.000Z'
      };

      setUser(fixedCompany);
      console.log('✅ [AUTH] تم تسجيل الدخول بنجاح:', fixedCompany.name);
      return true;
    } catch (error) {
      console.error('❌ [AUTH] خطأ في تسجيل الدخول:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('🚪 [AUTH] تسجيل الخروج...');
    setUser(null);
    console.log('✅ [AUTH] تم تسجيل الخروج');
  };

  // للتطوير: إنشاء session تجريبي
  const createDevelopmentSession = () => {
    // استخدام شركة kok@kok.com الثابتة دائماً
    const fixedCompany: AuthUser = {
      id: '2d9b8887-0cca-430b-b61b-ca16cccfec63',
      name: 'kok',
      email: 'kok@kok.com',
      status: 'active',
      created_at: '2025-07-12T21:00:00.000Z'
    };

    setUser(fixedCompany);
    console.log('🧪 [AUTH] تم إنشاء session تجريبي لشركة kok@kok.com');
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