import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Store, Edit, Save, Globe, Mail, Phone, MapPin, Building, Power, PowerOff, Loader2 } from 'lucide-react';
import { useStoreManagement, CompanyStore } from '@/hooks/useStoreManagement';

interface StoreFormData {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  logo_url: string;
}

const StoreManagement: React.FC = () => {
  const { toast } = useToast();
  const { company } = useCurrentCompany();
  const [editing, setEditing] = useState(false);

  // إضافة company ID افتراضي للاختبار إذا لم يكن متوفر
  const companyId = company?.id || 'c677b32f-fe1c-4c64-8362-a1c03406608d';

  // استخدام hook إدارة المتجر الجديد
  const {
    store,
    isLoading,
    error,
    refetch,
    createStore,
    updateStore,
    toggleStoreStatus,
    isCreating,
    isUpdating,
    isToggling
  } = useStoreManagement(companyId);

  const [storeForm, setStoreForm] = useState<StoreFormData>({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    logo_url: ''
  });

  // تحديث النموذج عند تحميل بيانات المتجر
  useEffect(() => {
    if (store) {
      setStoreForm({
        name: store.name || '',
        description: store.description || '',
        phone: store.phone || '',
        email: store.email || '',
        address: store.address || '',
        website: store.website || '',
        logo_url: store.logo_url || ''
      });
    }
  }, [store]);

  // إعادة جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    if (company?.id && !store && !isLoading) {
      console.log('🔄 إعادة جلب بيانات المتجر...');
      refetch();
    }
  }, [company?.id, store, isLoading, refetch]);

  // إنشاء متجر جديد إذا لم يكن موجوداً
  const handleCreateStore = async () => {
    if (!company?.name) {
      toast({
        title: "خطأ",
        description: "بيانات الشركة غير مكتملة",
        variant: "destructive"
      });
      return;
    }

    try {
      await createStore.mutateAsync({
        name: company.name,
        description: `متجر ${company.name}`,
        email: company.email || '',
        phone: '',
        address: '',
        website: '',
        logo_url: ''
      });
    } catch (error) {
      console.error('خطأ في إنشاء المتجر:', error);
    }
  };

  // حفظ تغييرات المتجر
  const handleSaveChanges = async () => {
    // التحقق من صحة البيانات
    if (!storeForm.name?.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المتجر",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateStore.mutateAsync({
        name: storeForm.name.trim(),
        description: storeForm.description?.trim() || '',
        phone: storeForm.phone?.trim() || '',
        email: storeForm.email?.trim() || '',
        address: storeForm.address?.trim() || '',
        website: storeForm.website?.trim() || '',
        logo_url: storeForm.logo_url?.trim() || ''
      });

      setEditing(false);
    } catch (error) {
      console.error('خطأ في حفظ التغييرات:', error);
    }
  };
  // إلغاء التعديل والعودة للبيانات الأصلية
  const handleCancelEdit = () => {
    if (store) {
      setStoreForm({
        name: store.name || '',
        description: store.description || '',
        phone: store.phone || '',
        email: store.email || '',
        address: store.address || '',
        website: store.website || '',
        logo_url: store.logo_url || ''
      });
    }
    setEditing(false);
  };

  // تفعيل/إلغاء تفعيل المتجر
  const handleToggleStatus = async () => {
    if (!store) return;

    try {
      await toggleStoreStatus.mutateAsync(!store.is_active);
    } catch (error) {
      console.error('خطأ في تغيير حالة المتجر:', error);
    }
  };

  // عرض حالة التحميل
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="main">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <p className="text-gray-600">جاري تحميل بيانات المتجر...</p>
        </div>
      </div>
    );
  }

  // عرض خطأ عدم وجود شركة
  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">يرجى تحديد شركة أولاً</p>
        </div>
      </div>
    );
  }

  // عرض خطأ في تحميل البيانات
  if (error && !store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-red-600 mb-4">خطأ في تحميل بيانات المتجر</p>
          <Button onClick={() => refetch()} variant="outline">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  // عرض إنشاء متجر جديد إذا لم يكن موجوداً
  if (!store && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">لا يوجد متجر للشركة</h2>
          <p className="text-gray-600 mb-4">يمكنك إنشاء متجر جديد للشركة</p>
          <Button
            onClick={handleCreateStore}
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Store className="w-4 h-4" />
            )}
            إنشاء متجر جديد
          </Button>
        </div>
      </div>
    );
  }

  // Debug info (مفيد للتطوير)
  console.log('🔍 Store Management Debug:', {
    companyId: companyId,
    companyFromAuth: company?.id,
    store: store ? { name: store.name, active: store.is_active } : null,
    isLoading,
    error: error?.message
  });

  // Loading screen شامل
  if (isLoading && !store) {
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

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* تحذير في حالة استخدام company ID افتراضي */}
      {!company?.id && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ يتم استخدام company ID افتراضي للاختبار. يرجى تسجيل الدخول للحصول على البيانات الصحيحة.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إعدادات المتجر</h1>
          <p className="text-gray-600 mt-2">إدارة بيانات متجر شركة {company.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={store?.is_active ? "default" : "secondary"}>
            {store?.is_active ? '🟢 متجر نشط' : '🔴 متجر معطل'}
          </Badge>

          {/* زر التحديث */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="text-sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              "🔄"
            )}
            تحديث
          </Button>

          {!editing && store && (
            <div className="flex gap-2">
              <Button
                onClick={() => setEditing(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <Edit className="w-4 h-4 ml-2" />
                تعديل البيانات
              </Button>
              <Button
                onClick={handleToggleStatus}
                variant={store?.is_active ? "destructive" : "default"}
                disabled={isToggling}
                className={store?.is_active ? "" : "bg-green-600 hover:bg-green-700 text-white"}
              >
                {isToggling ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : store?.is_active ? (
                  <PowerOff className="w-4 h-4 ml-2" />
                ) : (
                  <Power className="w-4 h-4 ml-2" />
                )}
                {isToggling ? 'جاري التحديث...' : (store?.is_active ? 'إلغاء التفعيل' : 'تفعيل المتجر')}
              </Button>
            </div>
          )}
          {!store && !isLoading && (
            <div className="flex items-center gap-2">
              <div className="text-red-600 text-sm">
                لا يوجد متجر للشركة {company?.name}
              </div>
              <Button
                onClick={handleCreateStore}
                size="sm"
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Store className="w-4 h-4 ml-2" />
                )}
                {isCreating ? 'جاري الإنشاء...' : 'إنشاء متجر'}
              </Button>
            </div>
          )}
          {isLoading && (
            <div className="text-blue-600 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري تحميل بيانات المتجر...
            </div>
          )}
          {error && (
            <div className="text-red-600 text-sm flex items-center gap-2">
              ❌ خطأ في تحميل البيانات
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="text-xs"
              >
                إعادة المحاولة
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* معلومات المتجر */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Store className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">1</p>
                <p className="text-gray-600">متجر واحد</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{company.name}</p>
                <p className="text-gray-600">الشركة المالكة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 ${store?.is_active ? 'bg-green-100' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                <div className={`w-4 h-4 ${store?.is_active ? 'bg-green-600' : 'bg-gray-600'} rounded-full`}></div>
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">
                  {store?.is_active ? 'نشط' : 'معطل'}
                </p>
                <p className="text-gray-600">حالة المتجر</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نموذج تعديل المتجر */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {editing ? 'تعديل بيانات المتجر' : 'بيانات المتجر'}
          </CardTitle>
          <CardDescription>
            {editing ? 'قم بتعديل البيانات وحفظ التغييرات' : 'عرض بيانات المتجر الحالية'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المتجر *
              </label>
              <Input
                value={storeForm.name}
                onChange={(e) => setStoreForm({...storeForm, name: e.target.value})}
                placeholder="اسم المتجر"
                disabled={!editing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                value={storeForm.email}
                onChange={(e) => setStoreForm({...storeForm, email: e.target.value})}
                placeholder="store@example.com"
                disabled={!editing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <Input
                value={storeForm.phone}
                onChange={(e) => setStoreForm({...storeForm, phone: e.target.value})}
                placeholder="+20 123 456 7890"
                disabled={!editing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الموقع الإلكتروني
              </label>
              <Input
                value={storeForm.website}
                onChange={(e) => setStoreForm({...storeForm, website: e.target.value})}
                placeholder="https://example.com"
                disabled={!editing}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف
              </label>
              <Textarea
                value={storeForm.description}
                onChange={(e) => setStoreForm({...storeForm, description: e.target.value})}
                placeholder="وصف المتجر..."
                rows={3}
                disabled={!editing}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان
              </label>
              <Textarea
                value={storeForm.address}
                onChange={(e) => setStoreForm({...storeForm, address: e.target.value})}
                placeholder="عنوان المتجر..."
                rows={2}
                disabled={!editing}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط الشعار
              </label>
              <Input
                value={storeForm.logo_url}
                onChange={(e) => setStoreForm({...storeForm, logo_url: e.target.value})}
                placeholder="https://example.com/logo.png"
                disabled={!editing}
              />
            </div>
          </div>

          {editing ? (
            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleSaveChanges}
                className="bg-green-600 hover:bg-green-700"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}
                {isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isUpdating}
              >
                إلغاء
              </Button>
            </div>
          ) : (
            <div className="flex gap-4 mt-6">
              <Button
                onClick={() => setEditing(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 ml-2" />
                تعديل المتجر
              </Button>
              {store && (
                <Button
                  onClick={handleToggleStatus}
                  variant={store.is_active ? "destructive" : "default"}
                  disabled={isToggling}
                >
                  {isToggling ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : store.is_active ? (
                    <PowerOff className="w-4 h-4 ml-2" />
                  ) : (
                    <Power className="w-4 h-4 ml-2" />
                  )}
                  {isToggling ? 'جاري التحديث...' : (store.is_active ? 'إلغاء التفعيل' : 'تفعيل المتجر')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      {store && (
        <Card>
          <CardHeader>
            <CardTitle>معلومات المتجر</CardTitle>
            <CardDescription>تفاصيل إضافية عن المتجر</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">معلومات الاتصال</h4>
                <div className="space-y-2">
                  {store.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 ml-2" />
                      <a href={`mailto:${store.email}`} className="text-blue-600 hover:underline">
                        {store.email}
                      </a>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 ml-2" />
                      <a href={`tel:${store.phone}`} className="text-blue-600 hover:underline">
                        {store.phone}
                      </a>
                    </div>
                  )}
                  {store.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="w-4 h-4 ml-2" />
                      <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {store.website}
                      </a>
                    </div>
                  )}
                  {store.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 ml-2" />
                      {store.address}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">معلومات النظام</h4>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <strong>معرف المتجر:</strong> {store.id}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>تاريخ الإنشاء:</strong> {new Date(store.created_at).toLocaleDateString('ar-EG')}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>الحالة:</strong>
                    <Badge variant={store.is_active ? "default" : "secondary"} className="mr-2">
                      {store.is_active ? 'نشط' : 'معطل'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info - سيتم إزالته لاحقاً */}
      <Card className="mt-6 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">معلومات التشخيص</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs space-y-1">
            <div><strong>الشركة:</strong> {company?.name} (ID: {company?.id})</div>
            <div><strong>المتجر:</strong> {store?.name || 'غير موجود'} (ID: {store?.id || 'غير موجود'})</div>
            <div><strong>حالة التحميل:</strong> {isLoading ? 'جاري التحميل' : 'مكتمل'}</div>
            <div><strong>حالة التعديل:</strong> {editing ? 'في وضع التعديل' : 'في وضع العرض'}</div>
            <div><strong>حالة المتجر:</strong> {store?.is_active ? 'نشط' : 'معطل'}</div>
            <div><strong>حالة الإنشاء:</strong> {isCreating ? 'جاري الإنشاء' : 'جاهز'}</div>
            <div><strong>حالة التحديث:</strong> {isUpdating ? 'جاري التحديث' : 'جاهز'}</div>
            <div><strong>حالة التفعيل:</strong> {isToggling ? 'جاري التغيير' : 'جاهز'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreManagement;
