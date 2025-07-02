/**
 * 🔐 مكون حماية المسارات المحسن
 * يستخدم نظام المصادقة الجديد لحل مشكلة فقدان حالة تسجيل الدخول
 */

import React, { createContext, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Shield, Lock, AlertCircle } from 'lucide-react';
import { useAuthPersistence, AuthState, AuthUser } from '@/hooks/useAuthPersistence';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  reloadAuth: () => Promise<void>;
  updateUser: (updatedUser: Partial<AuthUser>) => void;
}

// إنشاء Context للمصادقة
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * 🔐 مزود السياق للمصادقة
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authData = useAuthPersistence();

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 🪝 Hook لاستخدام سياق المصادقة
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * 🔐 مكون حماية المسارات
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/company-login' 
}) => {
  const location = useLocation();
  const { isAuthenticated, user, loading, error } = useAuth();

  // عرض شاشة التحميل
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Shield className="h-12 w-12 text-blue-600" />
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin absolute -top-1 -right-1" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  جاري التحقق من تسجيل الدخول
                </h3>
                <p className="text-sm text-gray-600">
                  يرجى الانتظار...
                </p>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض رسالة الخطأ
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
              
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  خطأ في المصادقة
                </h3>
                <p className="text-sm text-gray-600">
                  {error}
                </p>
              </div>
              
              <button
                onClick={() => window.location.href = redirectTo}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                تسجيل الدخول مرة أخرى
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // التحقق من المصادقة
  if (requireAuth && !isAuthenticated) {
    console.log('🔐 [PROTECTED] المستخدم غير مسجل الدخول، إعادة توجيه إلى:', redirectTo);
    
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // إذا كان المستخدم مسجل الدخول ولكن يحاول الوصول لصفحة تسجيل الدخول
  if (isAuthenticated && (location.pathname === '/company-login' || location.pathname === '/company-register')) {
    console.log('✅ [PROTECTED] المستخدم مسجل الدخول، إعادة توجيه إلى لوحة التحكم');
    
    return <Navigate to="/company-dashboard" replace />;
  }

  // عرض المحتوى المحمي
  return (
    <div className="protected-content">
      {children}
    </div>
  );
};

/**
 * 🔐 مكون حماية المسارات مع معلومات المستخدم
 */
export const ProtectedRouteWithUser: React.FC<ProtectedRouteProps & {
  renderUser?: (user: AuthUser) => React.ReactNode;
}> = ({ children, renderUser, ...props }) => {
  const { user } = useAuth();

  return (
    <ProtectedRoute {...props}>
      {renderUser && user && (
        <div className="user-info-header">
          {renderUser(user)}
        </div>
      )}
      {children}
    </ProtectedRoute>
  );
};

/**
 * 🔐 مكون عرض معلومات المستخدم الحالي
 */
export const CurrentUserInfo: React.FC<{
  className?: string;
  showDetails?: boolean;
}> = ({ className = '', showDetails = false }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className={`current-user-info ${className}`}>
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.name.charAt(0)}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name}
          </p>
          {showDetails && (
            <p className="text-xs text-gray-500 truncate">
              {user.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 🚪 مكون زر تسجيل الخروج
 */
export const LogoutButton: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className = '', children }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/company-login';
  };

  return (
    <button
      onClick={handleLogout}
      className={`logout-button ${className}`}
     aria-label="زر">
      {children || 'تسجيل الخروج'}
    </button>
  );
};

/**
 * 🔍 Hook للتحقق من حالة المصادقة
 */
export const useAuthStatus = () => {
  const { isAuthenticated, user, loading } = useAuth();
  
  return {
    isAuthenticated,
    user,
    loading,
    isLoggedIn: isAuthenticated && !!user,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.name
  };
};

export default ProtectedRoute;
