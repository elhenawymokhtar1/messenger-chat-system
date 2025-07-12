/**
 * 🔐 Hook لإدارة حالة تسجيل الدخول بشكل دائم
 * يحل مشكلة فقدان حالة تسجيل الدخول عند تحديث الصفحة
 */

import { useState, useEffect, useCallback } from 'react';
import { CompanyServiceMySQL } from '@/lib/mysql-company-api';

export interface AuthUser {
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

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEYS = {
  COMPANY: 'company',
  AUTH_TOKEN: 'auth_token',
  LAST_CHECK: 'last_auth_check'
};

// مدة صلاحية التحقق (5 دقائق)
const CHECK_VALIDITY_DURATION = 5 * 60 * 1000;

export const useAuthPersistence = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  /**
   * 💾 حفظ بيانات المصادقة (تم إيقافه - استخدم React Query)
   */
  const saveAuthData = useCallback((user: AuthUser) => {
    console.log('⚠️ [AUTH] saveAuthData مُعطل - استخدم React Query بدلاً من ذلك');
  }, []);

  /**
   * 🗑️ مسح بيانات المصادقة (تم إيقافه - استخدم React Query)
   */
  const clearAuthData = useCallback(() => {
    console.log('⚠️ [AUTH] clearAuthData مُعطل - استخدم React Query بدلاً من ذلك');
  }, []);

  /**
   * 📋 جلب بيانات المصادقة (تم إيقافه - استخدم React Query)
   */
  const getStoredAuthData = useCallback((): AuthUser | null => {
    console.log('⚠️ [AUTH] getStoredAuthData مُعطل - استخدم React Query بدلاً من ذلك');
    return null;
  }, []);

  /**
   * 🔍 التحقق من صحة بيانات المصادقة مع الخادم
   */
  const validateAuthWithServer = useCallback(async (user: AuthUser): Promise<boolean> => {
    try {
      console.log('🔍 [AUTH] التحقق من صحة البيانات مع الخادم...');
      
      const validUser = await CompanyServiceMySQL.getCompany(user.id);
      
      if (validUser && validUser.email === user.email) {
        // تحديث البيانات المحلية بالبيانات الحديثة من الخادم
        if (JSON.stringify(validUser) !== JSON.stringify(user)) {
          console.log('🔄 [AUTH] تحديث البيانات المحلية');
          saveAuthData(validUser);
          
          setAuthState(prev => ({
            ...prev,
            user: validUser
          }));
        }
        
        console.log('✅ [AUTH] البيانات صحيحة');
        return true;
      } else {
        console.warn('⚠️ [AUTH] البيانات غير صحيحة أو الشركة غير موجودة');
        return false;
      }
    } catch (error) {
      console.error('❌ [AUTH] خطأ في التحقق من البيانات:', error);
      // في حالة خطأ الشبكة، نعتبر البيانات صحيحة مؤقتاً
      return true;
    }
  }, [saveAuthData]);

  /**
   * 🔐 تسجيل الدخول
   */
  const login = useCallback(async (email: string, password: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await CompanyServiceMySQL.loginCompany(email, password);
      
      if (result.success && result.company) {
        saveAuthData(result.company);
        
        setAuthState({
          isAuthenticated: true,
          user: result.company,
          loading: false,
          error: null
        });
        
        console.log('✅ [AUTH] تم تسجيل الدخول بنجاح:', result.company.name);
        
        return {
          success: true,
          message: 'تم تسجيل الدخول بنجاح'
        };
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: result.message
        }));
        
        return {
          success: false,
          message: result.message
        };
      }
    } catch (error) {
      const errorMessage = 'فشل في تسجيل الدخول';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }, [saveAuthData]);

  /**
   * 🚪 تسجيل الخروج
   */
  const logout = useCallback(() => {
    clearAuthData();
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    });
    
    console.log('👋 [AUTH] تم تسجيل الخروج');
  }, [clearAuthData]);

  /**
   * 🔄 إعادة تحميل حالة المصادقة
   */
  const reloadAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const storedUser = getStoredAuthData();
      
      if (!storedUser) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null
        });
        return;
      }
      
      // التحقق من آخر مرة تم فيها التحقق
      const lastCheck = localStorage.getItem(STORAGE_KEYS.LAST_CHECK);
      const now = Date.now();
      
      if (lastCheck && (now - parseInt(lastCheck)) < CHECK_VALIDITY_DURATION) {
        // البيانات حديثة، لا نحتاج للتحقق من الخادم
        setAuthState({
          isAuthenticated: true,
          user: storedUser,
          loading: false,
          error: null
        });
        
        console.log('✅ [AUTH] استخدام البيانات المحفوظة (حديثة)');
        return;
      }
      
      // التحقق من صحة البيانات مع الخادم
      const isValid = await validateAuthWithServer(storedUser);
      
      if (isValid) {
        localStorage.setItem(STORAGE_KEYS.LAST_CHECK, now.toString());
        
        setAuthState({
          isAuthenticated: true,
          user: storedUser,
          loading: false,
          error: null
        });
      } else {
        clearAuthData();
        
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: 'انتهت صلاحية جلسة العمل'
        });
      }
    } catch (error) {
      console.error('❌ [AUTH] خطأ في إعادة تحميل المصادقة:', error);
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'خطأ في التحقق من حالة تسجيل الدخول'
      }));
    }
  }, [getStoredAuthData, validateAuthWithServer, clearAuthData]);

  /**
   * 🔄 تحديث بيانات المستخدم
   */
  const updateUser = useCallback((updatedUser: Partial<AuthUser>) => {
    setAuthState(prev => {
      if (!prev.user) return prev;
      
      const newUser = { ...prev.user, ...updatedUser };
      saveAuthData(newUser);
      
      return {
        ...prev,
        user: newUser
      };
    });
  }, [saveAuthData]);

  // تحميل حالة المصادقة عند بدء التطبيق
  useEffect(() => {
    reloadAuth();
  }, [reloadAuth]);

  // الاستماع لتغييرات التخزين المحلي (للتزامن بين التبويبات)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.COMPANY) {
        console.log('🔄 [AUTH] تغيير في بيانات المصادقة من تبويب آخر');
        reloadAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [reloadAuth]);

  return {
    ...authState,
    login,
    logout,
    reloadAuth,
    updateUser
  };
};
