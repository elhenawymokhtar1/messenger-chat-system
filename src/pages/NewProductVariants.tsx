import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Package, 
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
  Palette,
  Ruler,
  Tag,
  Copy,
  RefreshCw,
  Eye,
  Settings,
  Layers
} from 'lucide-react';

// نوع البيانات لمتغير المنتج
interface ProductVariant {
  id?: string;
  product_id: string;
  product_name?: string;
  variant_name: string;
  sku: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  weight?: number;
  dimensions?: string;
  is_active: boolean;
  attributes: VariantAttribute[];
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

// نوع البيانات لخاصية المتغير
interface VariantAttribute {
  name: string;
  value: string;
  type: 'color' | 'size' | 'material' | 'style' | 'custom';
}

// نوع البيانات للمنتج
interface Product {
  id: string;
  name: string;
  sku: string;
  base_price: number;
}

// نوع البيانات للنموذج
interface VariantFormData {
  product_id: string;
  variant_name: string;
  sku: string;
  price: string;
  sale_price: string;
  stock_quantity: string;
  weight: string;
  dimensions: string;
  is_active: boolean;
  attributes: VariantAttribute[];
}

const NewProductVariants: React.FC = () => {
  const { toast } = useToast();
  
  // الحالات الأساسية
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // حالات النموذج
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  
  // حالات البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Company ID ثابت للاختبار
  const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

  // بيانات النموذج
  const [formData, setFormData] = useState<VariantFormData>({
    product_id: '',
    variant_name: '',
    sku: '',
    price: '',
    sale_price: '',
    stock_quantity: '',
    weight: '',
    dimensions: '',
    is_active: true,
    attributes: []
  });

  // دالة إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      product_id: '',
      variant_name: '',
      sku: '',
      price: '',
      sale_price: '',
      stock_quantity: '',
      weight: '',
      dimensions: '',
      is_active: true,
      attributes: []
    });
    setEditingVariant(null);
    setShowAddForm(false);
  };

  // دالة جلب المنتجات
  const fetchProducts = async () => {
    try {
      console.log('🔍 جلب المنتجات للشركة:', COMPANY_ID);
      
      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/products`, {
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
        setProducts(result.data || []);
        console.log('✅ تم جلب المنتجات بنجاح:', result.data?.length || 0);
      } else {
        throw new Error(result.message || 'فشل في جلب المنتجات');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المنتجات:', error);
      // بيانات وهمية للعرض
      setProducts([
        { id: '1', name: 'منتج تجريبي 1', sku: 'PROD001', base_price: 100 },
        { id: '2', name: 'منتج تجريبي 2', sku: 'PROD002', base_price: 200 },
        { id: '3', name: 'منتج تجريبي 3', sku: 'PROD003', base_price: 150 }
      ]);
    }
  };

  // دالة جلب متغيرات المنتجات
  const fetchVariants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 جلب متغيرات المنتجات للشركة:', COMPANY_ID);
      
      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/product-variants`, {
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
        setVariants(result.data || []);
        console.log('✅ تم جلب متغيرات المنتجات بنجاح:', result.data?.length || 0);
      } else {
        throw new Error(result.message || 'فشل في جلب متغيرات المنتجات');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب متغيرات المنتجات:', error);
      setError('فشل في تحميل متغيرات المنتجات');
      
      // بيانات وهمية للعرض
      setVariants([
        {
          id: '1',
          product_id: '1',
          product_name: 'منتج تجريبي 1',
          variant_name: 'أحمر - كبير',
          sku: 'PROD001-RED-L',
          price: 120,
          sale_price: 100,
          stock_quantity: 50,
          is_active: true,
          attributes: [
            { name: 'اللون', value: 'أحمر', type: 'color' },
            { name: 'الحجم', value: 'كبير', type: 'size' }
          ]
        },
        {
          id: '2',
          product_id: '1',
          product_name: 'منتج تجريبي 1',
          variant_name: 'أزرق - متوسط',
          sku: 'PROD001-BLUE-M',
          price: 120,
          stock_quantity: 30,
          is_active: true,
          attributes: [
            { name: 'اللون', value: 'أزرق', type: 'color' },
            { name: 'الحجم', value: 'متوسط', type: 'size' }
          ]
        }
      ]);
      
      toast({
        title: "تحذير",
        description: "تم عرض بيانات تجريبية - فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دالة إنشاء متغير جديد
  const createVariant = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const variantData = {
        product_id: formData.product_id,
        variant_name: formData.variant_name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        price: parseFloat(formData.price) || 0,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions.trim() || null,
        is_active: formData.is_active,
        attributes: formData.attributes
      };

      console.log('🔧 إنشاء متغير منتج جديد:', variantData);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/product-variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variantData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setVariants(prev => [result.data, ...prev]);
        resetForm();
        toast({
          title: "نجح",
          description: "تم إنشاء متغير المنتج بنجاح",
        });
        console.log('✅ تم إنشاء متغير المنتج بنجاح:', result.data.variant_name);
      } else {
        throw new Error(result.message || 'فشل في إنشاء متغير المنتج');
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء متغير المنتج:', error);
      setError('فشل في إنشاء متغير المنتج');
      toast({
        title: "خطأ",
        description: "فشل في إنشاء متغير المنتج",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // دالة تحديث متغير المنتج
  const updateVariant = async () => {
    if (!editingVariant) return;

    try {
      setIsSaving(true);
      setError(null);

      const updateData = {
        product_id: formData.product_id,
        variant_name: formData.variant_name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        price: parseFloat(formData.price) || 0,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: formData.dimensions.trim() || null,
        is_active: formData.is_active,
        attributes: formData.attributes
      };

      console.log('📝 تحديث متغير المنتج:', updateData);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/product-variants/${editingVariant.id}`, {
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
        setVariants(prev => prev.map(v => v.id === editingVariant.id ? result.data : v));
        resetForm();
        toast({
          title: "نجح",
          description: "تم تحديث متغير المنتج بنجاح",
        });
        console.log('✅ تم تحديث متغير المنتج بنجاح');
      } else {
        throw new Error(result.message || 'فشل في تحديث متغير المنتج');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث متغير المنتج:', error);
      setError('فشل في تحديث متغير المنتج');
      toast({
        title: "خطأ",
        description: "فشل في تحديث متغير المنتج",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    fetchProducts();
    fetchVariants();
  }, []);

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل متغيرات المنتجات...</h2>
            <p className="text-gray-500">يرجى الانتظار قليلاً</p>
          </div>
        </div>
      </div>
    );
  }

  // دالة حذف متغير المنتج
  const deleteVariant = async (variantId: string) => {
    try {
      setIsDeleting(variantId);
      setError(null);

      console.log('🗑️ حذف متغير المنتج:', variantId);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/product-variants/${variantId}`, {
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
        setVariants(prev => prev.filter(v => v.id !== variantId));
        toast({
          title: "نجح",
          description: "تم حذف متغير المنتج بنجاح",
        });
        console.log('✅ تم حذف متغير المنتج بنجاح');
      } else {
        throw new Error(result.message || 'فشل في حذف متغير المنتج');
      }
    } catch (error) {
      console.error('❌ خطأ في حذف متغير المنتج:', error);
      setError('فشل في حذف متغير المنتج');
      toast({
        title: "خطأ",
        description: "فشل في حذف متغير المنتج",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // دالة بدء التحرير
  const startEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      product_id: variant.product_id,
      variant_name: variant.variant_name,
      sku: variant.sku,
      price: variant.price.toString(),
      sale_price: variant.sale_price?.toString() || '',
      stock_quantity: variant.stock_quantity.toString(),
      weight: variant.weight?.toString() || '',
      dimensions: variant.dimensions || '',
      is_active: variant.is_active,
      attributes: [...variant.attributes]
    });
    setShowAddForm(true);
  };

  // دالة نسخ SKU
  const copySKU = (sku: string) => {
    navigator.clipboard.writeText(sku);
    toast({
      title: "تم النسخ",
      description: `تم نسخ SKU: ${sku}`,
    });
  };

  // دالة إضافة خاصية جديدة
  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { name: '', value: '', type: 'custom' }]
    }));
  };

  // دالة حذف خاصية
  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  // دالة تحديث خاصية
  const updateAttribute = (index: number, field: keyof VariantAttribute, value: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  // تحديث قيم النموذج
  const handleInputChange = (field: keyof VariantFormData, value: string | boolean | VariantAttribute[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // حفظ متغير المنتج (إنشاء أو تحديث)
  const saveVariant = () => {
    if (!formData.product_id || !formData.variant_name.trim() || !formData.sku.trim()) {
      toast({
        title: "خطأ",
        description: "المنتج واسم المتغير و SKU مطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "خطأ",
        description: "السعر مطلوب ويجب أن يكون أكبر من صفر",
        variant: "destructive"
      });
      return;
    }

    if (editingVariant) {
      updateVariant();
    } else {
      createVariant();
    }
  };

  // فلترة المتغيرات
  const filteredVariants = variants.filter(variant => {
    const matchesSearch = variant.variant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         variant.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (variant.product_name && variant.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesProduct = selectedProduct === 'all' || variant.product_id === selectedProduct;
    const matchesStatus = selectedStatus === 'all' ||
                         (selectedStatus === 'active' && variant.is_active) ||
                         (selectedStatus === 'inactive' && !variant.is_active);
    return matchesSearch && matchesProduct && matchesStatus;
  });

  // دالة الحصول على أيقونة نوع الخاصية
  const getAttributeIcon = (type: string) => {
    switch (type) {
      case 'color': return <Palette className="w-4 h-4 text-purple-600" />;
      case 'size': return <Ruler className="w-4 h-4 text-blue-600" />;
      case 'material': return <Layers className="w-4 h-4 text-green-600" />;
      case 'style': return <Settings className="w-4 h-4 text-orange-600" />;
      default: return <Tag className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            متغيرات المنتج الجديدة
          </h1>
          <p className="text-gray-600 mt-2">إدارة الألوان والأحجام والخيارات للمنتجات مع قاعدة البيانات المباشرة</p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة متغير جديد
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي المتغيرات</p>
                <p className="text-2xl font-bold text-gray-900">{variants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">متغيرات نشطة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {variants.filter(v => v.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">مخزون منخفض</p>
                <p className="text-2xl font-bold text-gray-900">
                  {variants.filter(v => v.stock_quantity < 10).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Tag className="w-8 h-8 text-purple-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">منتجات مختلفة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(variants.map(v => v.product_id)).size}
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
                placeholder="البحث في المتغيرات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="جميع المنتجات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المنتجات</SelectItem>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
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

            <Button variant="outline" onClick={fetchVariants}>
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث البيانات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة/تحرير المتغير */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingVariant ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingVariant ? 'تحرير متغير المنتج' : 'إضافة متغير منتج جديد'}
            </CardTitle>
            <CardDescription>
              {editingVariant ? 'تحديث معلومات متغير المنتج' : 'إضافة متغير جديد للمنتج مع الخصائص'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">المنتج *</label>
                <Select value={formData.product_id} onValueChange={(value) => handleInputChange('product_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنتج" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.sku}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">اسم المتغير *</label>
                <Input
                  value={formData.variant_name}
                  onChange={(e) => handleInputChange('variant_name', e.target.value)}
                  placeholder="أحمر - كبير"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">SKU *</label>
                <Input
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                  placeholder="PROD001-RED-L"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">السعر (ر.س) *</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="100.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">سعر التخفيض (ر.س)</label>
                <Input
                  type="number"
                  value={formData.sale_price}
                  onChange={(e) => handleInputChange('sale_price', e.target.value)}
                  placeholder="80.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">كمية المخزون *</label>
                <Input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                  placeholder="50"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الوزن (كجم)</label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="1.5"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الأبعاد (سم)</label>
                <Input
                  value={formData.dimensions}
                  onChange={(e) => handleInputChange('dimensions', e.target.value)}
                  placeholder="30x20x10"
                />
              </div>
            </div>

            {/* خصائص المتغير */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium">خصائص المتغير</label>
                <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة خاصية
                </Button>
              </div>

              <div className="space-y-3">
                {formData.attributes.map((attribute, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                    <div>
                      <Select
                        value={attribute.type}
                        onValueChange={(value) => updateAttribute(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="color">لون</SelectItem>
                          <SelectItem value="size">حجم</SelectItem>
                          <SelectItem value="material">مادة</SelectItem>
                          <SelectItem value="style">نمط</SelectItem>
                          <SelectItem value="custom">مخصص</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Input
                        value={attribute.name}
                        onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                        placeholder="اسم الخاصية"
                      />
                    </div>

                    <div>
                      <Input
                        value={attribute.value}
                        onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                        placeholder="قيمة الخاصية"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {getAttributeIcon(attribute.type)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttribute(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {formData.attributes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Tag className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>لا توجد خصائص مضافة</p>
                    <p className="text-sm">انقر على "إضافة خاصية" لإضافة خصائص للمتغير</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <label className="text-sm font-medium">متغير نشط</label>
            </div>

            <div className="flex gap-4 mt-6">
              <Button onClick={saveVariant} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    {editingVariant ? 'تحديث المتغير' : 'إضافة المتغير'}
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

      {/* قائمة المتغيرات */}
      {filteredVariants.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد متغيرات</h3>
            <p className="text-gray-500 mb-4">
              {variants.length === 0 ? 'لم يتم إضافة أي متغيرات بعد' : 'لا توجد متغيرات تطابق معايير البحث'}
            </p>
            {variants.length === 0 && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول متغير
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVariants.map((variant) => (
            <Card key={variant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                  {/* معلومات المتغير */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{variant.variant_name}</h3>
                        <p className="text-sm text-gray-500">{variant.product_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {variant.sku}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copySKU(variant.sku)}
                        className="p-1 h-auto"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* الخصائص */}
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {variant.attributes.map((attr, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <span className="flex items-center gap-1">
                            {getAttributeIcon(attr.type)}
                            {attr.name}: {attr.value}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* السعر */}
                  <div className="text-center">
                    <div className="flex items-center gap-2">
                      {variant.sale_price && (
                        <span className="text-sm text-gray-400 line-through">{variant.price} ر.س</span>
                      )}
                      <span className="font-bold text-green-600 text-lg">
                        {variant.sale_price || variant.price} ر.س
                      </span>
                    </div>
                    {variant.sale_price && (
                      <Badge className="bg-red-500 text-xs">
                        خصم {Math.round(((variant.price - variant.sale_price) / variant.price) * 100)}%
                      </Badge>
                    )}
                  </div>

                  {/* المخزون */}
                  <div className="text-center">
                    <p className={`font-bold text-lg ${
                      variant.stock_quantity > 10 ? 'text-green-600' :
                      variant.stock_quantity > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {variant.stock_quantity}
                    </p>
                    <p className="text-sm text-gray-500">قطعة</p>
                  </div>

                  {/* الحالة */}
                  <div className="text-center">
                    <Badge variant={variant.is_active ? 'default' : 'secondary'}>
                      {variant.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>

                  {/* الإجراءات */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(variant)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 ml-1" />
                      تحرير
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteVariant(variant.id!)}
                      disabled={isDeleting === variant.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isDeleting === variant.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewProductVariants;
