/**
 * 🔐 صفحة تسجيل دخول بسيطة
 * تستخدم نظام المصادقة الصحيح
 */

import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, Building } from 'lucide-react';

const SimpleCompanyLogin = () => {
  // هذا الملف معطل مؤقتاً - استخدم CompanyLogin بدلاً منه
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">صفحة معطلة</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              هذه الصفحة معطلة مؤقتاً. يرجى استخدام صفحة تسجيل الدخول الرئيسية.
            </AlertDescription>
          </Alert>
          <Button
            className="w-full mt-4"
            onClick={() => window.location.href = '/company-login'}
          >
            الذهاب لصفحة تسجيل الدخول
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const { company, loading } = useCurrentCompany();
  const isAuthenticated = !!company;
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

export default SimpleCompanyLogin;