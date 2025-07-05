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
      console.log('🔍 [AUTH] بدء التحقق من حالة المصادقة...');
      const companyData = localStorage.getItem('company');

      if (companyData) {
        try {
          const company = JSON.parse(companyData);
          console.log('📋 [AUTH] بيانات محفوظة موجودة:', {
            id: company.id,
            email: company.email,
            name: company.name,
            hasId: !!company.id,
            hasEmail: !!company.email,
            hasName: !!company.name
          });

          // تحقق مرن - يكفي وجود ID والاسم
          if (company.id && company.name) {
            console.log('✅ [AUTH] تم العثور على بيانات صحيحة:', company.name);
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

      console.log('❌ [AUTH] فشل التحقق - إعادة تعيين حالة المصادقة');
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
    console.log('🔐 [AUTH] محاولة تسجيل دخول:', userData);

    const requiredFields = ['id', 'name'];
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

    console.log('💾 [AUTH] حفظ بيانات تسجيل الدخول:', loginData);
    localStorage.setItem('company', JSON.stringify(loginData));

    // التحقق من الحفظ
    const savedData = localStorage.getItem('company');
    if (savedData) {
      console.log('✅ [AUTH] تم حفظ البيانات بنجاح');
    } else {
      console.error('❌ [AUTH] فشل في حفظ البيانات');
    }

    setAuthState({
      isAuthenticated: true,
      user: loginData,
      loading: false
    });

    console.log('🎉 [AUTH] تم تسجيل الدخول بنجاح');
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
