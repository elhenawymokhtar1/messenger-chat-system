import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Mail, Eye, EyeOff, LogIn, Info } from 'lucide-react';
import { CompanyServiceMySQL } from '@/lib/mysql-company-api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
/**
 * 🔐 صفحة تسجيل دخول الشركات
 * تاريخ الإنشاء: 22 يونيو 2025
 */
const CompanyLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [redirectMessage, setRedirectMessage] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { setCompany } = useCurrentCompany();
  useEffect(() => {
    // التحقق من وجود رسالة redirect
    if (location.state?.message) {
      setRedirectMessage(location.state.message);
    }
  }, [location]);
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // إزالة الخطأ عند التعديل
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
      const result = await CompanyServiceMySQL.loginCompany(
        formData.email.trim().toLowerCase(),
        formData.password
      );
      if (result.success && result.company) {
        // حفظ بيانات الشركة باستخدام Zustand
        console.log('💾 [LOGIN] حفظ بيانات الشركة:', result.company);
        console.log('🆔 [LOGIN] معرف الشركة:', result.company.id);
        setCompany(result.company);
        toast({
          title: "مرحباً بك! 👋",
          description: `أهلاً بك ${result.company.name}`
        });
        // الانتقال للصفحة المطلوبة أو لوحة التحكم
        const redirectTo = location.state?.from || '/company-dashboard';
        navigate(redirectTo, { replace: true });
      } else {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: result.message || "فشل في تسجيل الدخول",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" role="main">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500 rounded-full">
              <Building className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            تسجيل دخول الشركة
          </CardTitle>
          <CardDescription className="text-lg">
            ادخل إلى لوحة تحكم شركتك
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* رسالة التوجيه */}
          {redirectMessage && (
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>{redirectMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* البريد الإلكتروني */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="info@company.com"
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
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>
            {/* خيارات إضافية */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="mr-2 text-sm text-gray-600">تذكرني</span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700"
                onClick={() => {
                  toast({
                    title: "قريباً",
                    description: "ميزة استعادة كلمة المرور ستكون متاحة قريباً"
                  });
                }}
              >
                نسيت كلمة المرور؟
              </button>
            </div>
            {/* زر تسجيل الدخول */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
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
            {/* روابط إضافية */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600">
                  ليس لديك حساب؟{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/company-register')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    تسجيل شركة جديدة
                  </button>
                </p>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/subscription-plans')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  عرض خطط الاشتراك
                </button>
              </div>
            </div>
          </form>
          {/* بيانات تجريبية */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">🧪 شركات للاختبار:</h3>
            <div className="text-sm text-blue-700 space-y-3">

              {/* شركة تجريبية - تحتوي على بيانات */}
              <div className="p-2 bg-white rounded border">
                <p className="font-semibold">🏢 شركة تجريبية (تحتوي على محادثات)</p>
                <p>📧 test@company.com</p>
                <p>🔑 123456</p>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        email: 'test@company.com',
                        password: '123456'
                      });
                    }}
                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    دخول عادي
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        console.log('🔧 [FIX] إصلاح البيانات: نقل البيانات للشركة الصحيحة...');

                        // 1. جلب بيانات الشركة التجريبية الحقيقية
                        const companyResponse = await fetch('http://localhost:3002/api/companies/test@company.com');

                        if (!companyResponse.ok) {
                          throw new Error(`فشل في جلب بيانات الشركة: ${companyResponse.status}`);
                        }

                        const companyResult = await companyResponse.json();
                        if (!companyResult.success || !companyResult.data) {
                          throw new Error('لم يتم العثور على الشركة التجريبية');
                        }

                        const realCompany = companyResult.data;
                        console.log('🏢 [FIX] الشركة الحقيقية:', realCompany);

                        // 2. نقل البيانات من الـ ID الثابت للـ ID الحقيقي
                        const fixResponse = await fetch('http://localhost:3002/api/debug/fix-data-isolation', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            fromCompanyId: 'c677b32f-fe1c-4c64-8362-a1c03406608d', // الـ ID الثابت
                            toCompanyId: realCompany.id // الـ ID الحقيقي
                          })
                        });

                        const fixResult = await fixResponse.json();
                        console.log('🔄 [FIX] نتيجة نقل البيانات:', fixResult);

                        // 3. حفظ بيانات الشركة الصحيحة
                        setCompany(realCompany);
                        console.log('✅ [FIX] تم حفظ بيانات الشركة الصحيحة:', realCompany.id);

                        alert(`✅ تم إصلاح البيانات بنجاح!\n\nالشركة: ${realCompany.name}\nالمعرف الجديد: ${realCompany.id}\nالمحادثات المنقولة: ${fixResult.data?.conversationsUpdated || 0}\nالرسائل المنقولة: ${fixResult.data?.messagesUpdated || 0}`);

                        window.location.href = '/facebook-conversations';

                      } catch (error) {
                        console.error('❌ خطأ في إصلاح البيانات:', error);
                        alert('❌ حدث خطأ في إصلاح البيانات: ' + error.message);
                      }
                    }}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    إصلاح البيانات
                  </button>
                </div>
              </div>

              {/* شركة الفا - فارغة */}
              <div className="p-2 bg-white rounded border">
                <p className="font-semibold">🏢 شركة الفا (فارغة)</p>
                <p>📧 fake@example.com</p>
                <p>🔑 123456</p>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      email: 'fake@example.com',
                      password: '123456'
                    });
                  }}
                  className="mt-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  دخول (شركة فارغة)
                </button>
              </div>

              {/* الفنار - فارغة */}
              <div className="p-2 bg-white rounded border">
                <p className="font-semibold">🏢 الفنار (فارغة)</p>
                <p>📧 asa2@qw.com</p>
                <p>🔑 123456</p>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      email: 'asa2@qw.com',
                      password: '123456'
                    });
                  }}
                  className="mt-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  دخول (شركة فارغة)
                </button>
              </div>
            </div>
          </div>

          {/* معلومات الدعم */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">تحتاج مساعدة؟</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📧 البريد الإلكتروني: support@company.com</p>
              <p>📞 الهاتف: +20 123 456 7890</p>
              <p>💬 الدردشة المباشرة متاحة 24/7</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default CompanyLogin;
