/**
 * 🔐 Hook للمصادقة
 * يدير حالة تسجيل الدخول والخروج باستخدام React Query فقط
 */

import { useCurrentCompany } from './useCurrentCompany';

export const useAuth = () => {
  const { company, loading, setCompany, clearCompany, updateCompany } = useCurrentCompany();

  // حالة المصادقة مبنية على وجود بيانات الشركة
  const isAuthenticated = !!(company?.id && company?.name);
  const user = company;

  const updateLastActivity = () => {
    try {
      if (company) {
        const updatedCompany = {
          ...company,
          lastActivity: new Date().toISOString()
        };
        updateCompany(updatedCompany);
      }
    } catch (error) {
      console.error('❌ [AUTH] خطأ في تحديث آخر نشاط:', error);
    }
  };

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
    setCompany(loginData);

    console.log('🎉 [AUTH] تم تسجيل الدخول بنجاح');
  };

  const logout = () => {
    console.log('👋 [AUTH] تسجيل الخروج');
    clearCompany();
  };

  const checkAuthStatus = () => {
    // لا نحتاج هذه الدالة مع React Query - البيانات تُجلب تلقائياً
    console.log('🔍 [AUTH] حالة المصادقة:', { isAuthenticated, hasUser: !!user });
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    updateLastActivity,
    checkAuthStatus
  };
};
