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
  Truck, 
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
  MapPin,
  Clock,
  DollarSign,
  Package,
  Globe,
  Plane,
  Ship,
  RefreshCw
} from 'lucide-react';

// نوع البيانات لطريقة الشحن
interface ShippingMethod {
  id?: string;
  name: string;
  description: string;
  type: 'standard' | 'express' | 'same_day' | 'economy' | 'pickup';
  cost: number;
  cost_per_kg?: number;
  free_shipping_threshold?: number;
  estimated_days_min: number;
  estimated_days_max: number;
  delivery_time_unit?: 'hours' | 'days' | 'weeks';
  is_active: boolean;
  available_cities: string[];
  max_weight?: number;
  max_dimensions?: string;
  tracking_available?: boolean;
  insurance_available?: boolean;
  store_id?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

// نوع البيانات للنموذج
interface ShippingFormData {
  name: string;
  description: string;
  type: 'standard' | 'express' | 'same_day' | 'economy' | 'pickup';
  cost: string;
  cost_per_kg: string;
  free_shipping_threshold: string;
  estimated_days_min: string;
  estimated_days_max: string;
  delivery_time_unit: 'hours' | 'days' | 'weeks';
  is_active: boolean;
  available_cities: string;
  max_weight: string;
  max_dimensions: string;
  tracking_available: boolean;
  insurance_available: boolean;
}

const NewShipping: React.FC = () => {
  const { toast } = useToast();
  
  // الحالات الأساسية
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // حالات النموذج
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  
  // حالات البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Company ID ثابت للاختبار
  const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

  // بيانات النموذج
  const [formData, setFormData] = useState<ShippingFormData>({
    name: '',
    description: '',
    type: 'standard',
    cost: '',
    cost_per_kg: '',
    free_shipping_threshold: '',
    estimated_days_min: '',
    estimated_days_max: '',
    delivery_time_unit: 'days',
    is_active: true,
    available_cities: '',
    max_weight: '',
    max_dimensions: '',
    tracking_available: false,
    insurance_available: false
  });

  // دالة إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'standard',
      cost: '',
      cost_per_kg: '',
      free_shipping_threshold: '',
      estimated_days_min: '',
      estimated_days_max: '',
      delivery_time_unit: 'days',
      is_active: true,
      available_cities: '',
      max_weight: '',
      max_dimensions: '',
      tracking_available: false,
      insurance_available: false
    });
    setEditingMethod(null);
    setShowAddForm(false);
  };

  // دالة جلب طرق الشحن
  const fetchShippingMethods = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 جلب طرق الشحن للشركة:', COMPANY_ID);
      
      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/shipping-methods`, {
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
        setShippingMethods(result.data || []);
        console.log('✅ تم جلب طرق الشحن بنجاح:', result.data?.length || 0);
      } else {
        throw new Error(result.message || 'فشل في جلب طرق الشحن');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب طرق الشحن:', error);
      setError('فشل في تحميل طرق الشحن');
      toast({
        title: "خطأ",
        description: "فشل في تحميل طرق الشحن",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دالة إنشاء طريقة شحن جديدة
  const createShippingMethod = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const methodData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        cost: parseFloat(formData.cost) || 0,
        cost_per_kg: formData.cost_per_kg ? parseFloat(formData.cost_per_kg) : null,
        free_shipping_threshold: formData.free_shipping_threshold ? parseFloat(formData.free_shipping_threshold) : null,
        estimated_days_min: parseInt(formData.estimated_days_min) || 1,
        estimated_days_max: parseInt(formData.estimated_days_max) || 1,
        delivery_time_unit: formData.delivery_time_unit,
        is_active: formData.is_active,
        available_cities: formData.available_cities.split(',').map(r => r.trim()).filter(Boolean),
        max_weight: formData.max_weight ? parseFloat(formData.max_weight) : null,
        max_dimensions: formData.max_dimensions.trim() || null,
        tracking_available: formData.tracking_available,
        insurance_available: formData.insurance_available
      };

      console.log('🚚 إنشاء طريقة شحن جديدة:', methodData);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/shipping-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(methodData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setShippingMethods(prev => [result.data, ...prev]);
        resetForm();
        toast({
          title: "نجح",
          description: "تم إنشاء طريقة الشحن بنجاح",
        });
        console.log('✅ تم إنشاء طريقة الشحن بنجاح:', result.data.name);
      } else {
        throw new Error(result.message || 'فشل في إنشاء طريقة الشحن');
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء طريقة الشحن:', error);
      setError('فشل في إنشاء طريقة الشحن');
      toast({
        title: "خطأ",
        description: "فشل في إنشاء طريقة الشحن",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // دالة تحديث طريقة الشحن
  const updateShippingMethod = async () => {
    if (!editingMethod) return;

    try {
      setIsSaving(true);
      setError(null);

      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        cost: parseFloat(formData.cost) || 0,
        cost_per_kg: formData.cost_per_kg ? parseFloat(formData.cost_per_kg) : null,
        free_shipping_threshold: formData.free_shipping_threshold ? parseFloat(formData.free_shipping_threshold) : null,
        estimated_days_min: parseInt(formData.estimated_days_min) || 1,
        estimated_days_max: parseInt(formData.estimated_days_max) || 1,
        delivery_time_unit: formData.delivery_time_unit,
        is_active: formData.is_active,
        available_cities: formData.available_cities.split(',').map(r => r.trim()).filter(Boolean),
        max_weight: formData.max_weight ? parseFloat(formData.max_weight) : null,
        max_dimensions: formData.max_dimensions.trim() || null,
        tracking_available: formData.tracking_available,
        insurance_available: formData.insurance_available
      };

      console.log('📝 تحديث طريقة الشحن:', updateData);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/shipping-methods/${editingMethod.id}`, {
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
        setShippingMethods(prev => prev.map(m => m.id === editingMethod.id ? result.data : m));
        resetForm();
        toast({
          title: "نجح",
          description: "تم تحديث طريقة الشحن بنجاح",
        });
        console.log('✅ تم تحديث طريقة الشحن بنجاح');
      } else {
        throw new Error(result.message || 'فشل في تحديث طريقة الشحن');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث طريقة الشحن:', error);
      setError('فشل في تحديث طريقة الشحن');
      toast({
        title: "خطأ",
        description: "فشل في تحديث طريقة الشحن",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // دالة حذف طريقة الشحن
  const deleteShippingMethod = async (methodId: string) => {
    try {
      setIsDeleting(methodId);
      setError(null);

      console.log('🗑️ حذف طريقة الشحن:', methodId);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/shipping-methods/${methodId}`, {
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
        setShippingMethods(prev => prev.filter(m => m.id !== methodId));
        toast({
          title: "نجح",
          description: "تم حذف طريقة الشحن بنجاح",
        });
        console.log('✅ تم حذف طريقة الشحن بنجاح');
      } else {
        throw new Error(result.message || 'فشل في حذف طريقة الشحن');
      }
    } catch (error) {
      console.error('❌ خطأ في حذف طريقة الشحن:', error);
      setError('فشل في حذف طريقة الشحن');
      toast({
        title: "خطأ",
        description: "فشل في حذف طريقة الشحن",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // دالة بدء التحرير
  const startEdit = (method: ShippingMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      description: method.description,
      type: method.type,
      cost: method.cost.toString(),
      cost_per_kg: method.cost_per_kg?.toString() || '',
      free_shipping_threshold: method.free_shipping_threshold?.toString() || '',
      estimated_days_min: method.estimated_days_min.toString(),
      estimated_days_max: method.estimated_days_max.toString(),
      delivery_time_unit: method.delivery_time_unit || 'days',
      is_active: method.is_active,
      available_cities: method.available_cities.join(', '),
      max_weight: method.max_weight?.toString() || '',
      max_dimensions: method.max_dimensions || '',
      tracking_available: method.tracking_available || false,
      insurance_available: method.insurance_available || false
    });
    setShowAddForm(true);
  };

  // تحديث قيم النموذج
  const handleInputChange = (field: keyof ShippingFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // حفظ طريقة الشحن (إنشاء أو تحديث)
  const saveShippingMethod = () => {
    if (!formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "اسم طريقة الشحن مطلوب",
        variant: "destructive"
      });
      return;
    }

    if (!formData.cost || parseFloat(formData.cost) < 0) {
      toast({
        title: "خطأ",
        description: "التكلفة مطلوبة ويجب أن تكون صفر أو أكثر",
        variant: "destructive"
      });
      return;
    }

    if (editingMethod) {
      updateShippingMethod();
    } else {
      createShippingMethod();
    }
  };

  // فلترة طرق الشحن
  const filteredMethods = shippingMethods.filter(method => {
    const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         method.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || method.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && method.is_active) ||
                         (selectedStatus === 'inactive' && !method.is_active);
    return matchesSearch && matchesType && matchesStatus;
  });

  // دالة الحصول على أيقونة نوع الشحن
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'standard': return <Truck className="w-5 h-5 text-blue-600" />;
      case 'express': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'overnight': return <Plane className="w-5 h-5 text-red-600" />;
      case 'international': return <Globe className="w-5 h-5 text-purple-600" />;
      default: return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  // دالة الحصول على نص نوع الشحن
  const getTypeText = (type: string) => {
    switch (type) {
      case 'standard': return 'عادي';
      case 'express': return 'سريع';
      case 'overnight': return 'ليلي';
      case 'international': return 'دولي';
      default: return type;
    }
  };

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    fetchShippingMethods();
  }, []);

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل طرق الشحن...</h2>
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
            <Truck className="w-8 h-8 text-blue-600" />
            إدارة الشحن الجديدة
          </h1>
          <p className="text-gray-600 mt-2">إدارة طرق وتكاليف الشحن مع قاعدة البيانات المباشرة</p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة طريقة شحن جديدة
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي طرق الشحن</p>
                <p className="text-2xl font-bold text-gray-900">{shippingMethods.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">طرق نشطة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shippingMethods.filter(m => m.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">شحن سريع</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shippingMethods.filter(m => m.type === 'express').length}
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
                <p className="text-sm font-medium text-gray-600">متوسط التكلفة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shippingMethods.length > 0 ?
                    Math.round(shippingMethods.reduce((sum, m) => sum + m.base_cost, 0) / shippingMethods.length) : 0
                  } ر.س
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
                placeholder="البحث في طرق الشحن..."
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
                <SelectItem value="standard">عادي</SelectItem>
                <SelectItem value="express">سريع</SelectItem>
                <SelectItem value="overnight">ليلي</SelectItem>
                <SelectItem value="international">دولي</SelectItem>
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

            <Button variant="outline" onClick={fetchShippingMethods}>
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث البيانات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة/تحرير طريقة الشحن */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingMethod ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingMethod ? 'تحرير طريقة الشحن' : 'إضافة طريقة شحن جديدة'}
            </CardTitle>
            <CardDescription>
              {editingMethod ? 'تحديث معلومات طريقة الشحن' : 'إضافة طريقة شحن جديدة للمتجر'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">اسم طريقة الشحن *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="شحن عادي"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">نوع الشحن *</label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">عادي</SelectItem>
                    <SelectItem value="express">سريع</SelectItem>
                    <SelectItem value="overnight">ليلي</SelectItem>
                    <SelectItem value="international">دولي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">وصف طريقة الشحن</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="وصف تفصيلي لطريقة الشحن"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">التكلفة (ر.س) *</label>
                <Input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="25.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">تكلفة إضافية لكل كيلو (ر.س)</label>
                <Input
                  type="number"
                  value={formData.cost_per_kg}
                  onChange={(e) => handleInputChange('cost_per_kg', e.target.value)}
                  placeholder="5.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">حد الشحن المجاني (ر.س)</label>
                <Input
                  type="number"
                  value={formData.free_shipping_threshold}
                  onChange={(e) => handleInputChange('free_shipping_threshold', e.target.value)}
                  placeholder="200.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">وقت التسليم الأدنى *</label>
                <Input
                  type="number"
                  value={formData.estimated_days_min}
                  onChange={(e) => handleInputChange('estimated_days_min', e.target.value)}
                  placeholder="1"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">وقت التسليم الأقصى *</label>
                <Input
                  type="number"
                  value={formData.estimated_days_max}
                  onChange={(e) => handleInputChange('estimated_days_max', e.target.value)}
                  placeholder="3"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">وحدة الوقت *</label>
                <Select value={formData.delivery_time_unit} onValueChange={(value) => handleInputChange('delivery_time_unit', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">ساعات</SelectItem>
                    <SelectItem value="days">أيام</SelectItem>
                    <SelectItem value="weeks">أسابيع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">الحد الأقصى للوزن (كجم)</label>
                <Input
                  type="number"
                  value={formData.max_weight}
                  onChange={(e) => handleInputChange('max_weight', e.target.value)}
                  placeholder="30"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الأبعاد القصوى (سم)</label>
                <Input
                  value={formData.max_dimensions}
                  onChange={(e) => handleInputChange('max_dimensions', e.target.value)}
                  placeholder="100x80x60"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">المدن المتاحة (مفصولة بفواصل)</label>
              <Input
                value={formData.available_cities}
                onChange={(e) => handleInputChange('available_cities', e.target.value)}
                placeholder="الرياض, جدة, الدمام, مكة"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <label className="text-sm font-medium">طريقة نشطة</label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.tracking_available}
                  onCheckedChange={(checked) => handleInputChange('tracking_available', checked)}
                />
                <label className="text-sm font-medium">تتبع متاح</label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.insurance_available}
                  onCheckedChange={(checked) => handleInputChange('insurance_available', checked)}
                />
                <label className="text-sm font-medium">تأمين متاح</label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button onClick={saveShippingMethod} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    {editingMethod ? 'تحديث طريقة الشحن' : 'إضافة طريقة الشحن'}
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

      {/* قائمة طرق الشحن */}
      {filteredMethods.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Truck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد طرق شحن</h3>
            <p className="text-gray-500 mb-4">
              {shippingMethods.length === 0 ? 'لم يتم إضافة أي طرق شحن بعد' : 'لا توجد طرق شحن تطابق معايير البحث'}
            </p>
            {shippingMethods.length === 0 && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول طريقة شحن
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMethods.map((method) => (
            <Card key={method.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getTypeIcon(method.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{method.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {getTypeText(method.type)}
                      </Badge>
                    </div>
                  </div>

                  <Badge variant={method.is_active ? 'default' : 'secondary'}>
                    {method.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{method.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">التكلفة:</span>
                    <span className="font-bold text-green-600">{method.cost} ر.س</span>
                  </div>

                  {method.cost_per_kg && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">لكل كيلو:</span>
                      <span className="text-sm font-medium">{method.cost_per_kg} ر.س</span>
                    </div>
                  )}

                  {method.free_shipping_threshold && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">شحن مجاني من:</span>
                      <span className="text-sm font-medium text-green-600">{method.free_shipping_threshold} ر.س</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">وقت التسليم:</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        {method.estimated_days_min === method.estimated_days_max
                          ? `${method.estimated_days_min}`
                          : `${method.estimated_days_min}-${method.estimated_days_max}`
                        } {(method.delivery_time_unit || 'days') === 'hours' ? 'ساعة' : (method.delivery_time_unit || 'days') === 'days' ? 'يوم' : 'أسبوع'}
                      </span>
                    </div>
                  </div>

                  {method.max_weight && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">الحد الأقصى للوزن:</span>
                      <span className="text-sm font-medium">{method.max_weight} كجم</span>
                    </div>
                  )}

                  {method.available_cities && method.available_cities.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">المدن:</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{method.available_cities.length} مدينة</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">تاريخ الإنشاء:</span>
                    <span className="text-sm text-gray-600">
                      {method.created_at ? new Date(method.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </span>
                  </div>
                </div>

                {/* المميزات */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {method.tracking_available && (
                    <Badge variant="outline" className="text-xs">
                      <Package className="w-3 h-3 ml-1" />
                      تتبع
                    </Badge>
                  )}
                  {method.insurance_available && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 ml-1" />
                      تأمين
                    </Badge>
                  )}
                  {method.free_shipping_threshold && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      <DollarSign className="w-3 h-3 ml-1" />
                      شحن مجاني
                    </Badge>
                  )}
                </div>

                {/* تحذيرات */}
                {!method.is_active && (
                  <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">طريقة الشحن غير نشطة</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(method)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    تحرير
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteShippingMethod(method.id!)}
                    disabled={isDeleting === method.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isDeleting === method.id ? (
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

export default NewShipping;
