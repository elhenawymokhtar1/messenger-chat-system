/**
 * 👑 صفحة تسجيل دخول المستخدم الأساسي
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Shield, Eye, EyeOff, LogIn, Info, Settings } from 'lucide-react';
import { toast } from 'sonner';

const SuperAdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: 'admin@system.com', // مملوء مسبقاً للسهولة
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // التحقق من بيانات الدخول محلياً (مؤقت)
      const email = formData.email.trim().toLowerCase();
      const password = formData.password;

      // بيانات الدخول الافتراضية
      if (email === 'admin@system.com' && (password === 'Admin123456!' || password === 'admin123456')) {
        // إنشاء بيانات المستخدم الأساسي
        const superAdminData = {
          id: 'super-admin-001',
          name: 'مدير النظام الأساسي',
          email: 'admin@system.com',
          role: 'super_admin',
          permissions: ['all'],
          loginTime: new Date().toISOString()
        };

        // حفظ بيانات المستخدم الأساسي
        localStorage.setItem('superAdmin', JSON.stringify(superAdminData));

        toast.success('مرحباً بك مدير النظام! 👑');

        // الانتقال للوحة تحكم المستخدم الأساسي
        navigate('/super-admin-dashboard');
      } else {
        toast.error('بيانات الدخول غير صحيحة');
      }
    } catch (error) {
      console.error('Super admin login error:', error);
      toast.error('حدث خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuperAdmin = async () => {
    try {
      setLoading(true);

      // إنشاء المستخدم الأساسي محلياً (مؤقت)
      toast.success('المستخدم الأساسي موجود بالفعل! 🎉');
      toast.info('يمكنك تسجيل الدخول باستخدام البيانات المعروضة');

      // ملء كلمة المرور تلقائياً
      setFormData(prev => ({ ...prev, password: 'admin123456' }));

    } catch (error) {
      console.error('Create super admin error:', error);
      toast.error('حدث خطأ في إنشاء المستخدم الأساسي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4" role="main">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            مدير النظام الأساسي
          </CardTitle>
          <CardDescription className="text-lg">
            تسجيل دخول للوحة تحكم النظام
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* معلومات المستخدم الافتراضي */}
          <Alert className="mb-6 border-purple-200 bg-purple-50">
            <Info className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <strong>بيانات المستخدم الافتراضي:</strong><br />
              الإيميل: admin@system.com<br />
              كلمة المرور: admin123456 أو Admin123456!
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* البريد الإلكتروني */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="admin@system.com"
                className={errors.email ? 'border-red-500' : ''}
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            {/* كلمة المرور */}
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="كلمة المرور"
                  className={errors.password ? 'border-red-500' : ''}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>

            {/* أزرار الإجراءات */}
            <div className="space-y-4">
              {/* زر تسجيل الدخول */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 text-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="h-5 w-5 mr-2" />
                    تسجيل الدخول
                  </div>
                )}
              </Button>

              {/* زر إنشاء المستخدم الأساسي */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={handleCreateSuperAdmin}
                disabled={loading}
              >
                <Settings className="h-4 w-4 mr-2" />
                إنشاء المستخدم الأساسي
              </Button>
            </div>

            {/* روابط إضافية */}
            <div className="space-y-4">
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/company-login')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  تسجيل دخول الشركة
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/system-test')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  اختبار النظام
                </button>
              </div>
            </div>
          </form>

          {/* معلومات الدعم */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <Crown className="h-4 w-4 mr-2" />
              صلاحيات المدير الأساسي
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• إدارة جميع الشركات والمستخدمين</p>
              <p>• عرض إحصائيات النظام الشاملة</p>
              <p>• إدارة خطط الاشتراك والأسعار</p>
              <p>• مراقبة أداء النظام والأمان</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminLogin;
