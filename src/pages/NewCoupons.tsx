import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Gift, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Tag,
  Copy,
  RefreshCw
} from 'lucide-react';

// نوع البيانات للكوبون
interface Coupon {
  id?: string;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_amount?: number;
  max_amount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  store_id?: string;
  created_at?: string;
  updated_at?: string;
}

// نوع البيانات للنموذج
interface CouponFormData {
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  min_amount: string;
  max_amount: string;
  usage_limit: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

const NewCoupons: React.FC = () => {
  const { toast } = useToast();
  
  // الحالات الأساسية
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // حالات النموذج
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  // حالات البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Company ID ثابت للاختبار
  const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

  // بيانات النموذج
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_amount: '',
    max_amount: '',
    usage_limit: '',
    is_active: true,
    start_date: '',
    end_date: ''
  });

  // دالة إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_amount: '',
      max_amount: '',
      usage_limit: '',
      is_active: true,
      start_date: '',
      end_date: ''
    });
    setEditingCoupon(null);
    setShowAddForm(false);
  };

  // دالة توليد رمز كوبون عشوائي
  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  // دالة جلب الكوبونات
  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 جلب الكوبونات للشركة:', COMPANY_ID);
      
      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/coupons`, {
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
        setCoupons(result.data || []);
        console.log('✅ تم جلب الكوبونات بنجاح:', result.data?.length || 0);
      } else {
        throw new Error(result.message || 'فشل في جلب الكوبونات');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الكوبونات:', error);
      setError('فشل في تحميل الكوبونات');
      toast({
        title: "خطأ",
        description: "فشل في تحميل الكوبونات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دالة إنشاء كوبون جديد
  const createCoupon = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const couponData = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        min_amount: formData.min_amount ? parseFloat(formData.min_amount) : null,
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      console.log('🎫 إنشاء كوبون جديد:', couponData);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCoupons(prev => [result.data, ...prev]);
        resetForm();
        toast({
          title: "نجح",
          description: "تم إنشاء الكوبون بنجاح",
        });
        console.log('✅ تم إنشاء الكوبون بنجاح:', result.data.code);
      } else {
        throw new Error(result.message || 'فشل في إنشاء الكوبون');
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء الكوبون:', error);
      setError('فشل في إنشاء الكوبون');
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الكوبون",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // دالة تحديث الكوبون
  const updateCoupon = async () => {
    if (!editingCoupon) return;

    try {
      setIsSaving(true);
      setError(null);

      const updateData = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value) || 0,
        min_amount: formData.min_amount ? parseFloat(formData.min_amount) : null,
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      console.log('📝 تحديث الكوبون:', updateData);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/coupons/${editingCoupon.id}`, {
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
        setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? result.data : c));
        resetForm();
        toast({
          title: "نجح",
          description: "تم تحديث الكوبون بنجاح",
        });
        console.log('✅ تم تحديث الكوبون بنجاح');
      } else {
        throw new Error(result.message || 'فشل في تحديث الكوبون');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث الكوبون:', error);
      setError('فشل في تحديث الكوبون');
      toast({
        title: "خطأ",
        description: "فشل في تحديث الكوبون",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // دالة حذف الكوبون
  const deleteCoupon = async (couponId: string) => {
    try {
      setIsDeleting(couponId);
      setError(null);

      console.log('🗑️ حذف الكوبون:', couponId);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCoupons(prev => prev.filter(c => c.id !== couponId));
        toast({
          title: "نجح",
          description: "تم حذف الكوبون بنجاح",
        });
        console.log('✅ تم حذف الكوبون بنجاح');
      } else {
        throw new Error(result.message || 'فشل في حذف الكوبون');
      }
    } catch (error) {
      console.error('❌ خطأ في حذف الكوبون:', error);
      setError('فشل في حذف الكوبون');
      toast({
        title: "خطأ",
        description: "فشل في حذف الكوبون",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // دالة بدء التحرير
  const startEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_amount: coupon.min_amount?.toString() || '',
      max_amount: coupon.max_amount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      is_active: coupon.is_active,
      start_date: coupon.start_date ? coupon.start_date.split('T')[0] : '',
      end_date: coupon.end_date ? coupon.end_date.split('T')[0] : ''
    });
    setShowAddForm(true);
  };

  // دالة نسخ رمز الكوبون
  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "تم النسخ",
      description: `تم نسخ رمز الكوبون: ${code}`,
    });
  };

  // تحديث قيم النموذج
  const handleInputChange = (field: keyof CouponFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // حفظ الكوبون (إنشاء أو تحديث)
  const saveCoupon = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "رمز الكوبون والاسم مطلوبان",
        variant: "destructive"
      });
      return;
    }

    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      toast({
        title: "خطأ",
        description: "قيمة الخصم مطلوبة ويجب أن تكون أكبر من صفر",
        variant: "destructive"
      });
      return;
    }

    if (editingCoupon) {
      updateCoupon();
    } else {
      createCoupon();
    }
  };

  // فلترة الكوبونات
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || coupon.discount_type === selectedType;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && coupon.is_active) ||
                         (selectedStatus === 'inactive' && !coupon.is_active);
    return matchesSearch && matchesType && matchesStatus;
  });

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    fetchCoupons();
  }, []);

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل الكوبونات...</h2>
            <p className="text-gray-500">يرجى الانتظار قليلاً</p>
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
            <Gift className="w-8 h-8 text-blue-600" />
            إدارة الكوبونات الجديدة
          </h1>
          <p className="text-gray-600 mt-2">إدارة كوبونات الخصم والعروض الترويجية مع قاعدة البيانات المباشرة</p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة كوبون جديد
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Gift className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الكوبونات</p>
                <p className="text-2xl font-bold text-gray-900">{coupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">كوبونات نشطة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coupons.filter(c => c.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Percent className="w-8 h-8 text-yellow-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">خصم نسبي</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coupons.filter(c => c.discount_type === 'percentage').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-emerald-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">خصم ثابت</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coupons.filter(c => c.discount_type === 'fixed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والفلترة */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في الكوبونات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الأنواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="percentage">خصم نسبي</SelectItem>
                <SelectItem value="fixed">خصم ثابت</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchCoupons}>
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث البيانات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة/تحرير الكوبون */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingCoupon ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingCoupon ? 'تحرير الكوبون' : 'إضافة كوبون جديد'}
            </CardTitle>
            <CardDescription>
              {editingCoupon ? 'تحديث معلومات الكوبون' : 'إضافة كوبون خصم جديد للمتجر'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">رمز الكوبون *</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    placeholder="SAVE20"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCouponCode}
                  >
                    توليد
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">اسم الكوبون *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="خصم 20%"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">وصف الكوبون</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="وصف تفصيلي للكوبون"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">نوع الخصم *</label>
                <Select value={formData.discount_type} onValueChange={(value) => handleInputChange('discount_type', value as 'percentage' | 'fixed')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت (ر.س)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  قيمة الخصم * {formData.discount_type === 'percentage' ? '(%)' : '(ر.س)'}
                </label>
                <Input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => handleInputChange('discount_value', e.target.value)}
                  placeholder={formData.discount_type === 'percentage' ? '20' : '50'}
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">حد الاستخدام</label>
                <Input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => handleInputChange('usage_limit', e.target.value)}
                  placeholder="100"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">الحد الأدنى للطلب (ر.س)</label>
                <Input
                  type="number"
                  value={formData.min_amount}
                  onChange={(e) => handleInputChange('min_amount', e.target.value)}
                  placeholder="100"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الحد الأقصى للخصم (ر.س)</label>
                <Input
                  type="number"
                  value={formData.max_amount}
                  onChange={(e) => handleInputChange('max_amount', e.target.value)}
                  placeholder="500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">تاريخ البداية</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">تاريخ الانتهاء</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <label className="text-sm font-medium">كوبون نشط</label>
            </div>

            <div className="flex gap-4 mt-6">
              <Button onClick={saveCoupon} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    {editingCoupon ? 'تحديث الكوبون' : 'إضافة الكوبون'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={isSaving}
              >
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة الكوبونات */}
      {filteredCoupons.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد كوبونات</h3>
            <p className="text-gray-500 mb-4">
              {coupons.length === 0 ? 'لم يتم إضافة أي كوبونات بعد' : 'لا توجد كوبونات تطابق معايير البحث'}
            </p>
            {coupons.length === 0 && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول كوبون
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => (
            <Card key={coupon.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Gift className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{coupon.name}</h3>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCouponCode(coupon.code)}
                          className="p-1 h-auto"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                    {coupon.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{coupon.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">نوع الخصم:</span>
                    <div className="flex items-center gap-1">
                      {coupon.discount_type === 'percentage' ? (
                        <Percent className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-green-600" />
                      )}
                      <span className="font-medium">
                        {coupon.discount_type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">قيمة الخصم:</span>
                    <span className="font-bold text-green-600 text-lg">
                      {coupon.discount_value}
                      {coupon.discount_type === 'percentage' ? '%' : ' ر.س'}
                    </span>
                  </div>

                  {coupon.min_amount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">الحد الأدنى:</span>
                      <span className="text-sm font-medium">{coupon.min_amount} ر.س</span>
                    </div>
                  )}

                  {coupon.usage_limit && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">حد الاستخدام:</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {coupon.used_count} / {coupon.usage_limit}
                        </span>
                      </div>
                    </div>
                  )}

                  {coupon.end_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">ينتهي في:</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {new Date(coupon.end_date).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">تاريخ الإنشاء:</span>
                    <span className="text-sm text-gray-600">
                      {coupon.created_at ? new Date(coupon.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </span>
                  </div>
                </div>

                {/* شريط التقدم للاستخدام */}
                {coupon.usage_limit && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>الاستخدام</span>
                      <span>{Math.round((coupon.used_count / coupon.usage_limit) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((coupon.used_count / coupon.usage_limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* تحذيرات */}
                {coupon.end_date && new Date(coupon.end_date) < new Date() && (
                  <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">انتهت صلاحية الكوبون</span>
                    </div>
                  </div>
                )}

                {coupon.usage_limit && coupon.used_count >= coupon.usage_limit && (
                  <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">تم استنفاد حد الاستخدام</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(coupon)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    تحرير
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCoupon(coupon.id!)}
                    disabled={isDeleting === coupon.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isDeleting === coupon.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewCoupons;
