import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Store, Edit, Save, Globe, Mail, Phone, MapPin, Building, Power, PowerOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// نوع البيانات للمتجر (يطابق API)
interface StoreData {
  id?: string;
  store_name: string;
  store_description: string;
  store_phone: string;
  store_email: string;
  store_address: string;
  store_website: string;
  store_logo: string;
  is_active: boolean;
  company_id: string;
  created_at?: string;
  updated_at?: string;
}

// نوع البيانات للنموذج
interface StoreFormData {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  logo_url: string;
}

const NewStoreManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  // الحالات الأساسية
  const [store, setStore] = useState<StoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // استخدام معرف الشركة من المستخدم المسجل
  const COMPANY_ID = user?.id || '2d9b8887-0cca-430b-b61b-ca16cccfec63';

  // بيانات النموذج
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    logo_url: ''
  });

  // دالة جلب بيانات المتجر
  const fetchStore = async () => {
    if (!COMPANY_ID) {
      console.log('⚠️ لا يوجد معرف شركة');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 جلب بيانات المتجر للشركة:', COMPANY_ID);
      console.log('👤 بيانات المستخدم:', user);
      
      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/store`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setStore(result.data);
        setFormData({
          name: result.data.store_name || '',
          description: result.data.store_description || '',
          phone: result.data.store_phone || '',
          email: result.data.store_email || '',
          address: result.data.store_address || '',
          website: result.data.store_website || '',
          logo_url: result.data.store_logo || ''
        });
        console.log('✅ تم جلب بيانات المتجر بنجاح:', result.data.store_name);
      } else {
        console.log('⚠️ لا يوجد متجر للشركة');
        setStore(null);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات المتجر:', error);
      setError('فشل في تحميل بيانات المتجر');
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المتجر",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دالة إنشاء متجر جديد
  const createStore = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const storeData = {
        store_name: formData.name.trim() || 'متجر جديد',
        store_description: formData.description.trim() || 'وصف المتجر',
        store_phone: formData.phone.trim() || '',
        store_email: formData.email.trim() || '',
        store_address: formData.address.trim() || '',
        store_website: formData.website.trim() || '',
        store_logo: formData.logo_url.trim() || '',
        is_active: true
      };

      console.log('🏪 إنشاء متجر جديد:', storeData);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storeData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setStore(result.data);
        toast({
          title: "نجح",
          description: "تم إنشاء المتجر بنجاح",
        });
        console.log('✅ تم إنشاء المتجر بنجاح:', result.data.name);
      } else {
        throw new Error(result.message || 'فشل في إنشاء المتجر');
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء المتجر:', error);
      setError('فشل في إنشاء المتجر');
      toast({
        title: "خطأ",
        description: "فشل في إنشاء المتجر",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // دالة تحديث المتجر
  const updateStore = async () => {
    if (!store) return;

    try {
      setIsSaving(true);
      setError(null);

      const updateData = {
        store_name: formData.name.trim(),
        store_description: formData.description.trim(),
        store_phone: formData.phone.trim(),
        store_email: formData.email.trim(),
        store_address: formData.address.trim(),
        store_website: formData.website.trim(),
        store_logo: formData.logo_url.trim(),
        is_active: true
      };

      console.log('📝 تحديث المتجر:', updateData);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/store`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setStore(result.data);
        setIsEditing(false);
        toast({
          title: "نجح",
          description: "تم تحديث المتجر بنجاح",
        });
        console.log('✅ تم تحديث المتجر بنجاح');
      } else {
        throw new Error(result.message || 'فشل في تحديث المتجر');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث المتجر:', error);
      setError('فشل في تحديث المتجر');
      toast({
        title: "خطأ",
        description: "فشل في تحديث المتجر",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // دالة تغيير حالة المتجر
  const toggleStoreStatus = async () => {
    if (!store) return;

    try {
      setIsToggling(true);
      setError(null);

      const newStatus = !store.is_active;
      console.log('🔄 تغيير حالة المتجر إلى:', newStatus);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/store/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setStore(prev => prev ? { ...prev, is_active: newStatus } : null);
        toast({
          title: "نجح",
          description: `تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} المتجر`,
        });
        console.log('✅ تم تغيير حالة المتجر بنجاح');
      } else {
        throw new Error(result.message || 'فشل في تغيير حالة المتجر');
      }
    } catch (error) {
      console.error('❌ خطأ في تغيير حالة المتجر:', error);
      setError('فشل في تغيير حالة المتجر');
      toast({
        title: "خطأ",
        description: "فشل في تغيير حالة المتجر",
        variant: "destructive"
      });
    } finally {
      setIsToggling(false);
    }
  };

  // تحديث قيم النموذج
  const handleInputChange = (field: keyof StoreFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // تحميل البيانات عند بدء التشغيل أو تغيير المستخدم
  useEffect(() => {
    if (user?.id) {
      fetchStore();
    }
  }, [user?.id]);

  // عرض رسالة إذا لم يكن هناك مستخدم مسجل
  if (!user) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">يرجى تسجيل الدخول أولاً</h2>
            <p className="text-gray-500">تحتاج لتسجيل الدخول لإدارة المتجر</p>
          </div>
        </div>
      </div>
    );
  }

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل بيانات المتجر...</h2>
            <p className="text-gray-500">يرجى الانتظار قليلاً</p>
          </div>
        </div>
      </div>
    );
  }

  // عرض رسالة الخطأ
  if (error && !store) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">حدث خطأ</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchStore} variant="outline">
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Store className="w-8 h-8 text-blue-600" />
            إدارة المتجر
          </h1>
          <p className="text-gray-600 mt-2">إدارة معلومات وإعدادات متجرك</p>
        </div>
        
        {/* معلومات الشركة */}
        <div className="text-left">
          <p className="text-sm text-gray-500">معرف الشركة</p>
          <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{COMPANY_ID}</p>
          {user && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">اسم الشركة</p>
              <p className="text-sm font-medium">{user.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      {!store ? (
        // لا يوجد متجر - عرض نموذج الإنشاء
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <Store className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <CardTitle>إنشاء متجر جديد</CardTitle>
            <CardDescription>
              لا يوجد متجر مرتبط بهذه الشركة. يمكنك إنشاء متجر جديد الآن.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">اسم المتجر *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="أدخل اسم المتجر"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">وصف المتجر</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="أدخل وصف المتجر"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+966501234567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="store@example.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">العنوان</label>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="أدخل عنوان المتجر"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">الموقع الإلكتروني</label>
              <Input
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            
            <Button 
              onClick={createStore} 
              disabled={isSaving || !formData.name.trim()}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Store className="w-4 h-4 ml-2" />
                  إنشاء المتجر
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        // يوجد متجر - عرض البيانات
        <div className="space-y-6">
          {/* معلومات المتجر */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Store className="w-6 h-6 text-blue-600" />
                  <div>
                    <CardTitle>{store.store_name || 'غير محدد'}</CardTitle>
                    <CardDescription>{store.store_description || 'غير محدد'}</CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={store.is_active ? "default" : "secondary"}>
                    {store.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3 ml-1" />
                        نشط
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 ml-1" />
                        غير نشط
                      </>
                    )}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleStoreStatus}
                    disabled={isToggling}
                  >
                    {isToggling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : store.is_active ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {isEditing ? (
                // نموذج التحرير
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">اسم المتجر</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">وصف المتجر</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">العنوان</label>
                    <Input
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">الموقع الإلكتروني</label>
                    <Input
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={updateStore} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 ml-2" />
                          حفظ التغييرات
                        </>
                      )}
                    </Button>
                    
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                // عرض البيانات
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">الهاتف:</span>
                      <span>{store.store_phone || 'غير محدد'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">البريد:</span>
                      <span>{store.store_email || 'غير محدد'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">العنوان:</span>
                      <span>{store.store_address || 'غير محدد'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">الموقع:</span>
                      <span>{store.store_website || 'غير محدد'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">تاريخ الإنشاء:</span>
                      <span>{store.created_at ? new Date(store.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NewStoreManagement;
