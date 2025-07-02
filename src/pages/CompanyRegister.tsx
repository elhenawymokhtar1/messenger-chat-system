import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Mail, Phone, Globe, MapPin, Eye, EyeOff } from 'lucide-react';
import { CompanyServiceMySQL } from '@/lib/mysql-company-api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * 🏢 صفحة تسجيل الشركات
 * تاريخ الإنشاء: 22 يونيو 2025
 */
const CompanyRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    country: 'Egypt'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // إزالة الخطأ عند التعديل
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    // التحقق من الحقول المطلوبة
    if (!formData.name.trim()) {
      newErrors.name = 'اسم الشركة مطلوب';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }
    // التحقق من رقم الهاتف (اختياري ولكن إذا تم إدخاله يجب أن يكون صحيح)
    if (formData.phone) {
      const phoneClean = formData.phone.replace(/[\s\-\(\)]/g, ''); // إزالة المسافات والرموز

      // دعم الأرقام المصرية والدولية
      const isValidPhone =
        /^(\+20)?01[0-9]{9}$/.test(phoneClean) ||  // أرقام مصرية: 01xxxxxxxxx أو +2001xxxxxxxxx
        /^01[0-9]{9}$/.test(phoneClean) ||         // أرقام مصرية: 01xxxxxxxxx
        /^\+[1-9]\d{1,14}$/.test(phoneClean) ||   // أرقام دولية: +xxxxxxxxxxxxxxx
        /^[0-9]{10,15}$/.test(phoneClean);        // أرقام عامة: 10-15 رقم

      if (!isValidPhone) {
        newErrors.phone = 'رقم الهاتف غير صحيح (مثال: 01012345678 أو +201012345678)';
      }
    }
    // التحقق من الموقع الإلكتروني (اختياري)
    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      newErrors.website = 'رابط الموقع غير صحيح (يجب أن يبدأ بـ http:// أو https://)';
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
      console.log('🚀 [REGISTER] بدء عملية التسجيل...');
      console.log('📝 [REGISTER] البيانات:', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country
      });

      const result = await CompanyServiceMySQL.registerCompany({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        website: formData.website.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country
      });

      console.log('📋 [REGISTER] نتيجة التسجيل الكاملة:', result);

      // التحقق من صحة النتيجة
      if (!result || typeof result !== 'object') {
        console.error('❌ [REGISTER] نتيجة غير صحيحة:', result);
        toast({
          title: "خطأ في التسجيل",
          description: "استجابة غير صحيحة من الخادم",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ [REGISTER] حالة النجاح:', result.success);
      console.log('🏢 [REGISTER] بيانات الشركة:', result.company);
      console.log('💬 [REGISTER] الرسالة:', result.message);

      if (result.success === true) {
        if (result.company && typeof result.company === 'object') {
          console.log('🎉 [REGISTER] التسجيل نجح! حفظ بيانات الشركة...');
          console.log('👤 [REGISTER] بيانات الشركة للحفظ:', result.company);

          // حفظ بيانات الشركة باستخدام useAuth
          try {
            await login(result.company);
            console.log('✅ [REGISTER] تم حفظ بيانات الشركة في النظام');

            toast({
              title: "تم التسجيل بنجاح! 🎉",
              description: "مرحباً بك في نظام الرد التلقائي. تم تفعيل الخطة المجانية لك."
            });

            // الانتقال مباشرة للوحة التحكم
            console.log('🔄 [REGISTER] الانتقال للوحة التحكم...');
            navigate('/company-dashboard');
          } catch (loginError) {
            console.error('❌ [REGISTER] خطأ في حفظ بيانات الشركة:', loginError);
            toast({
              title: "تم التسجيل لكن حدث خطأ",
              description: "تم إنشاء الحساب بنجاح، يرجى تسجيل الدخول يدوياً",
              variant: "destructive"
            });
          }
        } else {
          console.error('❌ [REGISTER] بيانات الشركة مفقودة أو غير صحيحة:', result.company);
          toast({
            title: "خطأ في التسجيل",
            description: "تم إنشاء الحساب لكن بيانات الشركة غير مكتملة",
            variant: "destructive"
          });
        }
      } else {
        console.log('❌ [REGISTER] التسجيل فشل:', result.message);
        toast({
          title: "خطأ في التسجيل",
          description: result.message || "فشل في تسجيل الشركة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('💥 [REGISTER] خطأ استثنائي:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" role="main">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500 rounded-full">
              <Building className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            تسجيل شركة جديدة
          </CardTitle>
          <CardDescription className="text-lg">
            انضم إلى آلاف الشركات التي تستخدم نظامنا للرد التلقائي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* معلومات الشركة الأساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  اسم الشركة *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="مثال: شركة التقنية المتقدمة"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  البريد الإلكتروني *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="info@company.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>
            </div>
            {/* كلمات المرور */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="أعد كتابة كلمة المرور"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "إخفاء تأكيد كلمة المرور" : "إظهار تأكيد كلمة المرور"}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
              </div>
            </div>
            {/* معلومات الاتصال */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  رقم الهاتف
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+20 123 456 7890"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  الموقع الإلكتروني
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.company.com"
                  className={errors.website ? 'border-red-500' : ''}
                />
                {errors.website && <p className="text-red-500 text-sm">{errors.website}</p>}
              </div>
            </div>
            {/* العنوان */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                العنوان
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="العنوان التفصيلي للشركة"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">المدينة</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="القاهرة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">الدولة</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Egypt">مصر</SelectItem>
                    <SelectItem value="Saudi Arabia">السعودية</SelectItem>
                    <SelectItem value="UAE">الإمارات</SelectItem>
                    <SelectItem value="Kuwait">الكويت</SelectItem>
                    <SelectItem value="Qatar">قطر</SelectItem>
                    <SelectItem value="Bahrain">البحرين</SelectItem>
                    <SelectItem value="Oman">عمان</SelectItem>
                    <SelectItem value="Jordan">الأردن</SelectItem>
                    <SelectItem value="Lebanon">لبنان</SelectItem>
                    <SelectItem value="Other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* معلومات الخطة المجانية */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">🎉 ستحصل على الخطة المجانية</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ 10 منتجات</li>
                <li>✅ 200 رسالة شهرياً</li>
                <li>✅ 50 صورة</li>
                <li>✅ ردود ذكية بالذكاء الاصطناعي</li>
                <li>✅ إرسال صور تلقائي</li>
              </ul>
            </div>
            {/* زر التسجيل */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  جاري التسجيل...
                </div>
              ) : (
                'تسجيل الشركة'
              )}
            </Button>
            {/* رابط تسجيل الدخول */}
            <div className="text-center">
              <p className="text-gray-600">
                لديك حساب بالفعل؟{' '}
                <button
                  type="button"
                  onClick={() => navigate('/company-login')}
                  aria-label="تسجيل الدخول"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  تسجيل الدخول
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
export default CompanyRegister;
