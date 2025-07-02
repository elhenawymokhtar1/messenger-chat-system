/**
 * 🔧 إصلاح نظام المصادقة الصحيح
 * بيانات الشركة في قاعدة البيانات + token في localStorage
 */

import fs from 'fs';

class ProperAuthSystemFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
  }

  log(level, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const emoji = {
      'info': 'ℹ️',
      'fix': '🔧',
      'success': '✅',
      'fail': '❌',
      'warn': '⚠️'
    }[level] || '📝';
    
    console.log(`${emoji} [${timestamp}] ${message}`);
    if (details) {
      console.log(`   📋 التفاصيل: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async fixProperAuthSystem() {
    console.log('🔧 بدء إصلاح نظام المصادقة الصحيح...\n');
    this.log('info', 'إصلاح نظام المصادقة الصحيح');

    // 1. إنشاء نظام مصادقة صحيح
    await this.createProperAuthHook();
    
    // 2. إنشاء ProtectedRoute صحيح
    await this.createProperProtectedRoute();
    
    // 3. إنشاء API للمصادقة
    await this.createAuthAPI();
    
    // 4. إنشاء صفحة تسجيل دخول بسيطة
    await this.createSimpleLoginPage();

    this.generateReport();
  }

  async createProperAuthHook() {
    this.log('fix', 'إنشاء نظام مصادقة صحيح...');
    
    const authHookContent = `/**
 * 🔐 نظام المصادقة الصحيح
 * يحفظ token في localStorage ويجلب بيانات الشركة من API
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { companyApi } from '@/lib/mysql-api';

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
      const response = await companyApi.verifyToken(token);
      
      if (response.success && response.data) {
        console.log('✅ [AUTH] Token صحيح، جلب بيانات الشركة...');
        
        // جلب بيانات الشركة من قاعدة البيانات
        const companyResponse = await companyApi.getCompanyById(companyId);
        
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
      
      const response = await companyApi.login({ email, password });
      
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
};`;

    try {
      fs.writeFileSync('src/hooks/useProperAuth.ts', authHookContent);
      this.fixes.push('تم إنشاء نظام مصادقة صحيح');
      this.log('success', 'تم إنشاء نظام مصادقة صحيح');
    } catch (error) {
      this.errors.push(`فشل إنشاء نظام المصادقة: ${error.message}`);
      this.log('fail', 'فشل إنشاء نظام المصادقة', { error: error.message });
    }
  }

  async createProperProtectedRoute() {
    this.log('fix', 'إنشاء ProtectedRoute صحيح...');
    
    const protectedRouteContent = `/**
 * 🔐 مكون الحماية الصحيح
 * يستخدم نظام المصادقة الصحيح مع قاعدة البيانات
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useProperAuth';
import { Card, CardContent } from '@/components/ui/card';

interface ProperProtectedRouteProps {
  children: React.ReactNode;
}

const ProperProtectedRoute: React.FC<ProperProtectedRouteProps> = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // عرض شاشة التحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                جاري التحقق من تسجيل الدخول
              </h2>
              <p className="text-gray-600">يرجى الانتظار...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // إعادة توجيه لتسجيل الدخول إذا لم يكن مصادق عليه
  if (!isAuthenticated) {
    console.log('🔄 [AUTH] إعادة توجيه لصفحة تسجيل الدخول');
    return <Navigate to="/company-login" replace />;
  }

  console.log('✅ [AUTH] السماح بالوصول للمحتوى المحمي');
  return <>{children}</>;
};

export default ProperProtectedRoute;`;

    try {
      fs.writeFileSync('src/components/ProperProtectedRoute.tsx', protectedRouteContent);
      this.fixes.push('تم إنشاء ProtectedRoute صحيح');
      this.log('success', 'تم إنشاء ProtectedRoute صحيح');
    } catch (error) {
      this.errors.push(`فشل إنشاء ProtectedRoute: ${error.message}`);
      this.log('fail', 'فشل إنشاء ProtectedRoute', { error: error.message });
    }
  }

  async createAuthAPI() {
    this.log('fix', 'إنشاء API المصادقة...');
    
    const authAPIContent = `/**
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
        'Authorization': \`Bearer \${token}\`
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
    return apiRequest(\`/api/companies/\${companyId}\`);
  }
};`;

    try {
      fs.writeFileSync('src/lib/auth-api.ts', authAPIContent);
      this.fixes.push('تم إنشاء API المصادقة');
      this.log('success', 'تم إنشاء API المصادقة');
    } catch (error) {
      this.errors.push(`فشل إنشاء API المصادقة: ${error.message}`);
      this.log('fail', 'فشل إنشاء API المصادقة', { error: error.message });
    }
  }

  async createSimpleLoginPage() {
    this.log('fix', 'إنشاء صفحة تسجيل دخول بسيطة...');
    
    const loginPageContent = `/**
 * 🔐 صفحة تسجيل دخول بسيطة
 * تستخدم نظام المصادقة الصحيح
 */

import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useProperAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, Building } from 'lucide-react';

const SimpleCompanyLogin = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: 'test@conversations.com',
    password: 'password123'
  });
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState('');

  // إعادة توجيه إذا كان مسجل دخول بالفعل
  if (isAuthenticated) {
    return <Navigate to="/facebook-conversations" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    setError('');

    try {
      const success = await login(formData.email, formData.password);
      
      if (!success) {
        setError('فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.');
      }
    } catch (error) {
      setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleDevelopmentLogin = () => {
    setFormData({
      email: 'test@conversations.com',
      password: 'dev_password'
    });
    handleSubmit(new Event('submit') as any);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Building className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">تسجيل دخول الشركة</CardTitle>
          <p className="text-gray-600">ادخل بيانات شركتك للوصول للمحادثات</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="company@example.com"
                required
                disabled={isLogging}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                required
                disabled={isLogging}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLogging}
            >
              {isLogging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  تسجيل الدخول
                </>
              )}
            </Button>

            {process.env.NODE_ENV === 'development' && (
              <Button 
                type="button"
                variant="outline" 
                className="w-full" 
                onClick={handleDevelopmentLogin}
                disabled={isLogging}
              >
                🧪 دخول تجريبي (للتطوير)
              </Button>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>ليس لديك حساب؟ <a href="/company-register" className="text-blue-600 hover:underline">إنشاء حساب جديد</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleCompanyLogin;`;

    try {
      fs.writeFileSync('src/pages/SimpleCompanyLogin.tsx', loginPageContent);
      this.fixes.push('تم إنشاء صفحة تسجيل دخول بسيطة');
      this.log('success', 'تم إنشاء صفحة تسجيل دخول بسيطة');
    } catch (error) {
      this.errors.push(`فشل إنشاء صفحة تسجيل الدخول: ${error.message}`);
      this.log('fail', 'فشل إنشاء صفحة تسجيل الدخول', { error: error.message });
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 تقرير إصلاح نظام المصادقة الصحيح');
    console.log('='.repeat(80));
    
    console.log(`\n📊 النتائج:`);
    console.log(`  ✅ الإصلاحات المطبقة: ${this.fixes.length}`);
    console.log(`  ❌ الأخطاء: ${this.errors.length}`);
    
    if (this.fixes.length > 0) {
      console.log(`\n✅ الإصلاحات المطبقة:`);
      this.fixes.forEach(fix => {
        console.log(`  • ${fix}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ الأخطاء:`);
      this.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    console.log(`\n🎯 النظام الصحيح:`);
    console.log('  📱 localStorage: يحفظ auth_token + company_id فقط');
    console.log('  🗄️ قاعدة البيانات: تحفظ جميع بيانات الشركة');
    console.log('  🔐 المصادقة: التحقق من token مع الخادم');
    console.log('  📊 البيانات: جلب من قاعدة البيانات عند الحاجة');
    
    console.log(`\n📁 الملفات المُنشأة:`);
    console.log('  • src/hooks/useProperAuth.ts');
    console.log('  • src/components/ProperProtectedRoute.tsx');
    console.log('  • src/lib/auth-api.ts');
    console.log('  • src/pages/SimpleCompanyLogin.tsx');
    
    console.log(`\n💡 الخطوات التالية:`);
    console.log('  1. تحديث App.tsx لاستخدام AuthProvider');
    console.log('  2. تحديث routes لاستخدام ProperProtectedRoute');
    console.log('  3. إنشاء API endpoints للمصادقة في الخادم');
    console.log('  4. اختبار النظام الجديد');
    
    console.log(`\n🔧 إصلاح نظام المصادقة الصحيح اكتمل!`);
  }
}

// تشغيل إصلاح نظام المصادقة
const fixer = new ProperAuthSystemFixer();
fixer.fixProperAuthSystem().catch(error => {
  console.error('💥 خطأ في إصلاح نظام المصادقة:', error);
  process.exit(1);
});
