import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Store, 
  Globe, 
  Palette, 
  Bell, 
  Shield, 
  CreditCard, 
  Mail,
  Phone,
  MapPin,
  Clock,
  Save,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Image,
  Link,
  Users,
  Package
} from 'lucide-react';

// نوع البيانات لإعدادات المتجر
interface StoreSettings {
  // معلومات أساسية
  store_name: string;
  store_description: string;
  store_logo?: string;
  store_banner?: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  store_website?: string;
  
  // إعدادات العملة والمنطقة
  currency: string;
  timezone: string;
  language: string;
  country: string;
  
  // إعدادات التشغيل
  is_active: boolean;
  maintenance_mode: boolean;
  allow_guest_checkout: boolean;
  require_account_verification: boolean;
  
  // إعدادات الضرائب
  tax_enabled: boolean;
  tax_rate: number;
  tax_inclusive: boolean;
  
  // إعدادات الشحن
  free_shipping_threshold: number;
  default_shipping_cost: number;
  
  // إعدادات الإشعارات
  email_notifications: boolean;
  sms_notifications: boolean;
  order_notifications: boolean;
  low_stock_notifications: boolean;
  
  // إعدادات الأمان
  enable_ssl: boolean;
  enable_captcha: boolean;
  max_login_attempts: number;
  session_timeout: number;
  
  // إعدادات SEO
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  
  // إعدادات التخصيص
  primary_color: string;
  secondary_color: string;
  custom_css?: string;
  custom_js?: string;
  
  created_at?: string;
  updated_at?: string;
}

const NewStoreSetup: React.FC = () => {
  const { toast } = useToast();
  
  // الحالات الأساسية
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Company ID ثابت للاختبار
  const COMPANY_ID = '2d9b8887-0cca-430b-b61b-ca16cccfec63';

  // دالة جلب إعدادات المتجر
  const fetchStoreSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('⚙️ جلب إعدادات المتجر للشركة:', COMPANY_ID);
      
      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/store-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
        console.log('✅ تم جلب إعدادات المتجر بنجاح');
      } else {
        throw new Error(result.message || 'فشل في جلب إعدادات المتجر');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب إعدادات المتجر:', error);
      setError('فشل في تحميل إعدادات المتجر');
      
      // إعدادات افتراضية للعرض
      setSettings({
        store_name: 'متجري الإلكتروني',
        store_description: 'متجر إلكتروني متميز لبيع المنتجات عالية الجودة',
        store_email: 'info@mystore.com',
        store_phone: '+966501234567',
        store_address: 'الرياض، المملكة العربية السعودية',
        currency: 'SAR',
        timezone: 'Asia/Riyadh',
        language: 'ar',
        country: 'SA',
        is_active: true,
        maintenance_mode: false,
        allow_guest_checkout: true,
        require_account_verification: false,
        tax_enabled: true,
        tax_rate: 15,
        tax_inclusive: false,
        free_shipping_threshold: 200,
        default_shipping_cost: 25,
        email_notifications: true,
        sms_notifications: false,
        order_notifications: true,
        low_stock_notifications: true,
        enable_ssl: true,
        enable_captcha: false,
        max_login_attempts: 5,
        session_timeout: 30,
        primary_color: '#3B82F6',
        secondary_color: '#10B981'
      });
      
      toast({
        title: "تحذير",
        description: "تم عرض إعدادات افتراضية - فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دالة حفظ إعدادات المتجر
  const saveStoreSettings = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      setError(null);

      console.log('💾 حفظ إعدادات المتجر:', settings);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/store-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
        toast({
          title: "نجح",
          description: "تم حفظ إعدادات المتجر بنجاح",
        });
        console.log('✅ تم حفظ إعدادات المتجر بنجاح');
      } else {
        throw new Error(result.message || 'فشل في حفظ إعدادات المتجر');
      }
    } catch (error) {
      console.error('❌ خطأ في حفظ إعدادات المتجر:', error);
      setError('فشل في حفظ إعدادات المتجر');
      toast({
        title: "خطأ",
        description: "فشل في حفظ إعدادات المتجر",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // دالة تحديث الإعدادات
  const updateSetting = (key: keyof StoreSettings, value: any) => {
    if (!settings) return;
    setSettings(prev => ({
      ...prev!,
      [key]: value
    }));
  };

  // دالة رفع الصور
  const uploadImage = async (file: File, type: 'logo' | 'banner') => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/upload-store-image`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        updateSetting(type === 'logo' ? 'store_logo' : 'store_banner', result.data.url);
        toast({
          title: "نجح",
          description: `تم رفع ${type === 'logo' ? 'الشعار' : 'البانر'} بنجاح`,
        });
      } else {
        throw new Error(result.message || 'فشل في رفع الصورة');
      }
    } catch (error) {
      console.error('❌ خطأ في رفع الصورة:', error);
      toast({
        title: "خطأ",
        description: "فشل في رفع الصورة",
        variant: "destructive"
      });
    }
  };

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    fetchStoreSettings();
  }, []);

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل إعدادات المتجر...</h2>
            <p className="text-gray-500">يرجى الانتظار قليلاً</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">خطأ في تحميل الإعدادات</h3>
            <p className="text-gray-500 mb-4">فشل في تحميل إعدادات المتجر</p>
            <Button onClick={fetchStoreSettings}>
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            إعداد المتجر الجديد
          </h1>
          <p className="text-gray-600 mt-2">إعدادات شاملة للمتجر والتخصيص مع قاعدة البيانات المباشرة</p>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={fetchStoreSettings}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>

          <Button
            onClick={saveStoreSettings}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      </div>

      {/* حالة المتجر */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">حالة المتجر</h3>
                <p className="text-gray-600">إدارة حالة تشغيل المتجر</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.is_active}
                  onCheckedChange={(checked) => updateSetting('is_active', checked)}
                />
                <div>
                  <p className="font-medium">المتجر نشط</p>
                  <p className="text-sm text-gray-500">تفعيل/إلغاء تفعيل المتجر</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
                />
                <div>
                  <p className="font-medium">وضع الصيانة</p>
                  <p className="text-sm text-gray-500">إغلاق مؤقت للصيانة</p>
                </div>
              </div>

              <Badge variant={settings.is_active ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                {settings.is_active ? (settings.maintenance_mode ? 'صيانة' : 'نشط') : 'معطل'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            عام
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            المظهر
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            التجارة
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            الإشعارات
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            الأمان
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        {/* تبويب الإعدادات العامة */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  معلومات المتجر الأساسية
                </CardTitle>
                <CardDescription>المعلومات الأساسية للمتجر</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">اسم المتجر *</label>
                  <Input
                    value={settings.store_name}
                    onChange={(e) => updateSetting('store_name', e.target.value)}
                    placeholder="اسم المتجر"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">وصف المتجر</label>
                  <Textarea
                    value={settings.store_description}
                    onChange={(e) => updateSetting('store_description', e.target.value)}
                    placeholder="وصف مختصر عن المتجر"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">البريد الإلكتروني *</label>
                  <Input
                    type="email"
                    value={settings.store_email}
                    onChange={(e) => updateSetting('store_email', e.target.value)}
                    placeholder="info@store.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
                  <Input
                    value={settings.store_phone}
                    onChange={(e) => updateSetting('store_phone', e.target.value)}
                    placeholder="+966501234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">العنوان</label>
                  <Textarea
                    value={settings.store_address}
                    onChange={(e) => updateSetting('store_address', e.target.value)}
                    placeholder="عنوان المتجر الكامل"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الموقع الإلكتروني</label>
                  <Input
                    value={settings.store_website || ''}
                    onChange={(e) => updateSetting('store_website', e.target.value)}
                    placeholder="https://www.store.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  الإعدادات الإقليمية
                </CardTitle>
                <CardDescription>العملة والمنطقة الزمنية واللغة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">العملة</label>
                  <Select value={settings.currency} onValueChange={(value) => updateSetting('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                      <SelectItem value="EUR">يورو (EUR)</SelectItem>
                      <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">المنطقة الزمنية</label>
                  <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Riyadh">الرياض (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">دبي (GMT+4)</SelectItem>
                      <SelectItem value="Asia/Kuwait">الكويت (GMT+3)</SelectItem>
                      <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">اللغة</label>
                  <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">البلد</label>
                  <Select value={settings.country} onValueChange={(value) => updateSetting('country', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SA">المملكة العربية السعودية</SelectItem>
                      <SelectItem value="AE">الإمارات العربية المتحدة</SelectItem>
                      <SelectItem value="KW">الكويت</SelectItem>
                      <SelectItem value="QA">قطر</SelectItem>
                      <SelectItem value="BH">البحرين</SelectItem>
                      <SelectItem value="OM">عمان</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">السماح بالشراء كضيف</p>
                      <p className="text-sm text-gray-500">السماح للزوار بالشراء بدون تسجيل</p>
                    </div>
                    <Switch
                      checked={settings.allow_guest_checkout}
                      onCheckedChange={(checked) => updateSetting('allow_guest_checkout', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">تأكيد الحساب مطلوب</p>
                      <p className="text-sm text-gray-500">طلب تأكيد البريد الإلكتروني</p>
                    </div>
                    <Switch
                      checked={settings.require_account_verification}
                      onCheckedChange={(checked) => updateSetting('require_account_verification', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب المظهر */}
        <TabsContent value="appearance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  الصور والشعارات
                </CardTitle>
                <CardDescription>رفع وإدارة صور المتجر</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">شعار المتجر</label>
                  <div className="flex items-center gap-4">
                    {settings.store_logo && (
                      <img src={settings.store_logo} alt="شعار المتجر" className="w-16 h-16 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file, 'logo');
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG حتى 2MB</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">بانر المتجر</label>
                  <div className="flex items-center gap-4">
                    {settings.store_banner && (
                      <img src={settings.store_banner} alt="بانر المتجر" className="w-24 h-16 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file, 'banner');
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG حتى 5MB</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  الألوان والتخصيص
                </CardTitle>
                <CardDescription>تخصيص ألوان وشكل المتجر</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">اللون الأساسي</label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.primary_color}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">اللون الثانوي</label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => updateSetting('secondary_color', e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={settings.secondary_color}
                      onChange={(e) => updateSetting('secondary_color', e.target.value)}
                      placeholder="#10B981"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">CSS مخصص</label>
                  <Textarea
                    value={settings.custom_css || ''}
                    onChange={(e) => updateSetting('custom_css', e.target.value)}
                    placeholder="/* أضف CSS مخصص هنا */"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">JavaScript مخصص</label>
                  <Textarea
                    value={settings.custom_js || ''}
                    onChange={(e) => updateSetting('custom_js', e.target.value)}
                    placeholder="// أضف JavaScript مخصص هنا"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب الإعدادات التجارية */}
        <TabsContent value="business">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  إعدادات الضرائب
                </CardTitle>
                <CardDescription>إعداد الضرائب والرسوم</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">تفعيل الضرائب</p>
                    <p className="text-sm text-gray-500">إضافة ضريبة القيمة المضافة</p>
                  </div>
                  <Switch
                    checked={settings.tax_enabled}
                    onCheckedChange={(checked) => updateSetting('tax_enabled', checked)}
                  />
                </div>

                {settings.tax_enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">معدل الضريبة (%)</label>
                      <Input
                        type="number"
                        value={settings.tax_rate}
                        onChange={(e) => updateSetting('tax_rate', parseFloat(e.target.value) || 0)}
                        placeholder="15"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">الضريبة شاملة</p>
                        <p className="text-sm text-gray-500">الأسعار تشمل الضريبة</p>
                      </div>
                      <Switch
                        checked={settings.tax_inclusive}
                        onCheckedChange={(checked) => updateSetting('tax_inclusive', checked)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  إعدادات الشحن
                </CardTitle>
                <CardDescription>إعداد تكاليف الشحن الافتراضية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">تكلفة الشحن الافتراضية (ر.س)</label>
                  <Input
                    type="number"
                    value={settings.default_shipping_cost}
                    onChange={(e) => updateSetting('default_shipping_cost', parseFloat(e.target.value) || 0)}
                    placeholder="25"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">حد الشحن المجاني (ر.س)</label>
                  <Input
                    type="number"
                    value={settings.free_shipping_threshold}
                    onChange={(e) => updateSetting('free_shipping_threshold', parseFloat(e.target.value) || 0)}
                    placeholder="200"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">شحن مجاني للطلبات أكثر من هذا المبلغ</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب الإشعارات */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                إعدادات الإشعارات
              </CardTitle>
              <CardDescription>تحكم في أنواع الإشعارات المختلفة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">إشعارات البريد الإلكتروني</h4>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">تفعيل إشعارات البريد</p>
                      <p className="text-sm text-gray-500">إرسال إشعارات عبر البريد الإلكتروني</p>
                    </div>
                    <Switch
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">إشعارات الطلبات</p>
                      <p className="text-sm text-gray-500">إشعار عند وصول طلب جديد</p>
                    </div>
                    <Switch
                      checked={settings.order_notifications}
                      onCheckedChange={(checked) => updateSetting('order_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">إشعارات المخزون المنخفض</p>
                      <p className="text-sm text-gray-500">تنبيه عند نفاد المخزون</p>
                    </div>
                    <Switch
                      checked={settings.low_stock_notifications}
                      onCheckedChange={(checked) => updateSetting('low_stock_notifications', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-lg">إشعارات الرسائل النصية</h4>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">تفعيل الرسائل النصية</p>
                      <p className="text-sm text-gray-500">إرسال إشعارات عبر SMS</p>
                    </div>
                    <Switch
                      checked={settings.sms_notifications}
                      onCheckedChange={(checked) => updateSetting('sms_notifications', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الأمان */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                إعدادات الأمان
              </CardTitle>
              <CardDescription>تحكم في إعدادات الأمان والحماية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">إعدادات الحماية</h4>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">تفعيل SSL</p>
                      <p className="text-sm text-gray-500">استخدام HTTPS للاتصال الآمن</p>
                    </div>
                    <Switch
                      checked={settings.enable_ssl}
                      onCheckedChange={(checked) => updateSetting('enable_ssl', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">تفعيل CAPTCHA</p>
                      <p className="text-sm text-gray-500">حماية من الروبوتات</p>
                    </div>
                    <Switch
                      checked={settings.enable_captcha}
                      onCheckedChange={(checked) => updateSetting('enable_captcha', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-lg">إعدادات الجلسة</h4>

                  <div>
                    <label className="block text-sm font-medium mb-2">الحد الأقصى لمحاولات تسجيل الدخول</label>
                    <Input
                      type="number"
                      value={settings.max_login_attempts}
                      onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value) || 5)}
                      placeholder="5"
                      min="1"
                      max="20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">مهلة انتهاء الجلسة (دقيقة)</label>
                    <Input
                      type="number"
                      value={settings.session_timeout}
                      onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value) || 30)}
                      placeholder="30"
                      min="5"
                      max="1440"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب SEO */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                إعدادات تحسين محركات البحث (SEO)
              </CardTitle>
              <CardDescription>تحسين ظهور المتجر في محركات البحث</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">عنوان الصفحة (Meta Title)</label>
                <Input
                  value={settings.meta_title || ''}
                  onChange={(e) => updateSetting('meta_title', e.target.value)}
                  placeholder="متجري الإلكتروني - أفضل المنتجات بأسعار مميزة"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(settings.meta_title || '').length}/60 حرف
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">وصف الصفحة (Meta Description)</label>
                <Textarea
                  value={settings.meta_description || ''}
                  onChange={(e) => updateSetting('meta_description', e.target.value)}
                  placeholder="اكتشف مجموعة واسعة من المنتجات عالية الجودة بأسعار تنافسية. تسوق الآن واستمتع بخدمة عملاء ممتازة وشحن سريع."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(settings.meta_description || '').length}/160 حرف
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الكلمات المفتاحية (Meta Keywords)</label>
                <Input
                  value={settings.meta_keywords || ''}
                  onChange={(e) => updateSetting('meta_keywords', e.target.value)}
                  placeholder="متجر إلكتروني، تسوق أونلاين، منتجات عالية الجودة"
                />
                <p className="text-xs text-gray-500 mt-1">
                  افصل الكلمات المفتاحية بفواصل
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">نصائح لتحسين SEO:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• استخدم عنواناً وصفياً وجذاباً (50-60 حرف)</li>
                  <li>• اكتب وصفاً مفيداً ومقنعاً (150-160 حرف)</li>
                  <li>• اختر كلمات مفتاحية ذات صلة بمنتجاتك</li>
                  <li>• تأكد من أن المحتوى فريد وذو قيمة</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NewStoreSetup;
