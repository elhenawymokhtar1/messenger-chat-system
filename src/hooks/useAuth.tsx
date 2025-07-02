/**
 * 🔐 Hook للمصادقة
 * يدير حالة تسجيل الدخول والخروج
 */

import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  const updateLastActivity = () => {
    try {
      const companyData = localStorage.getItem('company');
      if (companyData) {
        const company = JSON.parse(companyData);
        company.lastActivity = new Date().toISOString();
        localStorage.setItem('company', JSON.stringify(company));
      }
    } catch (error) {
      console.error('❌ [AUTH] خطأ في تحديث آخر نشاط:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const companyData = localStorage.getItem('company');
      if (companyData) {
        try {
          const company = JSON.parse(companyData);
          if (company.id && company.email && company.name) {
            setAuthState({
              isAuthenticated: true,
              user: company,
              loading: false
            });
            return;
          } else {
            console.warn('⚠️ [AUTH] بيانات غير مكتملة:', company);
          }
        } catch (parseError) {
          console.error('❌ [AUTH] خطأ في تحليل بيانات الشركة:', parseError);
          localStorage.removeItem('company');
        }
      } else {
        console.log('ℹ️ [AUTH] لا توجد بيانات محفوظة');
      }
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    } catch (error) {
      console.error('❌ [AUTH] خطأ في التحقق من حالة المصادقة:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  };

  useEffect(() => {
    checkAuthStatus();
    const handleStorageChange = () => {
      checkAuthStatus();
    };
    const handleUserActivity = () => {
      updateLastActivity();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, []);

  const login = (userData: any) => {
    const requiredFields = ['id', 'name', 'email'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    if (missingFields.length > 0) {
      console.error('❌ [AUTH] بيانات ناقصة للتسجيل:', missingFields);
      return;
    }
    const loginData = {
      ...userData,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    localStorage.setItem('company', JSON.stringify(loginData));
    setAuthState({
      isAuthenticated: true,
      user: userData,
      loading: false
    });
  };

  const logout = () => {
    localStorage.removeItem('company');
    localStorage.removeItem('userToken');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  };

  return {
    ...authState,
    login,
    logout,
    updateLastActivity,
    checkAuthStatus
  };
};
