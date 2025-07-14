import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Star,
  Eye,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  DollarSign,
  BarChart3,
  ShoppingBag,
  Image as ImageIcon
} from 'lucide-react';

// إعدادات API
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// نوع البيانات للمنتج
interface Product {
  id?: string;
  name: string;
  description: string;
  short_description: string;
  sku: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  status: string;
  featured: boolean;
  image_url?: string;
  category: string;
  brand: string;
  weight?: number;
  store_id?: string;
  created_at?: string;
  updated_at?: string;
}

// نوع البيانات للنموذج
interface ProductFormData {
  name: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  sale_price: string;
  stock_quantity: string;
  category: string;
  brand: string;
  image_url: string;
  featured: boolean;
  weight: string;
}

const NewEcommerceProducts: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  // تسجيل دخول تلقائي للتأكد من عمل الصفحة
  useEffect(() => {
    console.log('🔄 [PRODUCTS] localStorage معطل - استخدام شركة kok@kok.com الثابتة');
    console.log('✅ [PRODUCTS] معرف الشركة الثابت: 2d9b8887-0cca-430b-b61b-ca16cccfec63');
  }, []);

  // الحالات الأساسية
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // حالات النموذج
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // حالات البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // الحصول على معرف الشركة من المستخدم المسجل دخوله (شركة kok@kok.com الثابتة)
  const COMPANY_ID = user?.id || '2d9b8887-0cca-430b-b61b-ca16cccfec63';

  // تسجيل معلومات التشخيص
  console.log('🔍 [PRODUCTS] معلومات المستخدم:', user);
  console.log('🆔 [PRODUCTS] معرف الشركة:', COMPANY_ID);

  // التحقق من تسجيل الدخول (مؤقتاً معطل للاختبار)
  // if (!user) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <Card className="w-96">
  //         <CardContent className="pt-6">
  //           <div className="text-center">
  //             <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
  //             <h3 className="text-lg font-semibold mb-2">يجب تسجيل الدخول</h3>
  //             <p className="text-gray-600 mb-4">يرجى تسجيل الدخول للوصول إلى إدارة المنتجات</p>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  // بيانات النموذج
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    short_description: '',
    sku: '',
    price: '',
    sale_price: '',
    stock_quantity: '',
    category: '',
    brand: '',
    image_url: '',
    featured: false,
    weight: ''
  });

  // دالة إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      short_description: '',
      sku: '',
      price: '',
      sale_price: '',
      stock_quantity: '',
      category: '',
      brand: '',
      image_url: '',
      featured: false,
      weight: ''
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  // دالة جلب المنتجات - مبسطة وموثوقة
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 [PRODUCTS] جلب المنتجات للشركة:', COMPANY_ID);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/products`);
      console.log('📡 [PRODUCTS] حالة الاستجابة:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('📥 [PRODUCTS] البيانات:', result);

        if (result.success && result.data) {
          setProducts(result.data);
          console.log('✅ [PRODUCTS] تم جلب', result.data.length, 'منتج');
        } else {
          setProducts([]);
          console.log('ℹ️ [PRODUCTS] لا توجد منتجات');
        }
      } else {
        setProducts([]);
        console.log('⚠️ [PRODUCTS] خطأ في الاستجابة:', response.status);
      }
    } catch (error) {
      console.error('❌ [PRODUCTS] خطأ:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // دالة إنشاء منتج جديد - مبسطة
  const createProduct = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // التحقق من البيانات المطلوبة
      if (!formData.name.trim() || !formData.description.trim() || !formData.price) {
        toast({
          title: "خطأ",
          description: "يرجى ملء جميع الحقول المطلوبة",
          variant: "destructive"
        });
        return;
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        short_description: formData.short_description.trim(),
        sku: formData.sku.trim() || `SKU-${Date.now()}`,
        price: parseFloat(formData.price) || 0,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category: formData.category.trim(),
        brand: formData.brand.trim(),
        image_url: formData.image_url.trim(),
        featured: formData.featured,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        status: 'active'
      };

      console.log('🏪 [PRODUCTS] إنشاء منتج:', productData.name);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      console.log('📡 [PRODUCTS] حالة الإنشاء:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('📥 [PRODUCTS] نتيجة الإنشاء:', result);

        if (result.success && result.data) {
          setProducts(prev => [result.data, ...prev]);
          resetForm();

          toast({
            title: "نجح! 🎉",
            description: `تم إنشاء "${result.data.name}" بنجاح`
          });

          console.log('✅ [PRODUCTS] تم إنشاء المنتج بنجاح');
        } else {
          throw new Error(result.message || 'فشل في إنشاء المنتج');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`خطأ ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ [PRODUCTS] خطأ في الإنشاء:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : 'فشل في إنشاء المنتج',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // دالة تحديث المنتج
  const updateProduct = async () => {
    if (!editingProduct) return;

    try {
      setIsSaving(true);
      setError(null);

      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        short_description: formData.short_description.trim(),
        sku: formData.sku.trim(),
        price: parseFloat(formData.price) || 0,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category: formData.category.trim(),
        brand: formData.brand.trim(),
        image_url: formData.image_url.trim(),
        featured: formData.featured,
        weight: formData.weight ? parseFloat(formData.weight) : null
      };

      console.log('📝 تحديث المنتج:', updateData);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/products/${editingProduct.id}`, {
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
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? result.data : p));
        resetForm();
        toast({
          title: "نجح",
          description: "تم تحديث المنتج بنجاح",
        });
        console.log('✅ تم تحديث المنتج بنجاح');
      } else {
        throw new Error(result.message || 'فشل في تحديث المنتج');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث المنتج:', error);
      setError('فشل في تحديث المنتج');
      toast({
        title: "خطأ",
        description: "فشل في تحديث المنتج",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // دالة حذف المنتج
  const deleteProduct = async (productId: string) => {
    try {
      setIsDeleting(productId);
      setError(null);

      console.log('🗑️ حذف المنتج:', productId);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/products/${productId}`, {
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
        setProducts(prev => prev.filter(p => p.id !== productId));
        toast({
          title: "نجح",
          description: "تم حذف المنتج بنجاح",
        });
        console.log('✅ تم حذف المنتج بنجاح');
      } else {
        throw new Error(result.message || 'فشل في حذف المنتج');
      }
    } catch (error) {
      console.error('❌ خطأ في حذف المنتج:', error);
      setError('فشل في حذف المنتج');
      toast({
        title: "خطأ",
        description: "فشل في حذف المنتج",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // دالة بدء التحرير
  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      short_description: product.short_description,
      sku: product.sku,
      price: product.price.toString(),
      sale_price: product.sale_price?.toString() || '',
      stock_quantity: product.stock_quantity.toString(),
      category: product.category,
      brand: product.brand,
      image_url: product.image_url || '',
      featured: product.featured,
      weight: product.weight?.toString() || ''
    });
    setShowAddForm(true);
  };

  // تحديث قيم النموذج
  const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // حفظ المنتج (إنشاء أو تحديث)
  const saveProduct = () => {
    if (!formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "اسم المنتج مطلوب",
        variant: "destructive"
      });
      return;
    }

    if (editingProduct) {
      updateProduct();
    } else {
      createProduct();
    }
  };

  // فلترة المنتجات
  const filteredProducts = (Array.isArray(products) ? products : []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // الحصول على الفئات الفريدة
  const categories = [...new Set((Array.isArray(products) ? products : []).map(p => p.category).filter(Boolean))];

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    console.log('🚀 [PRODUCTS] بدء تحميل الصفحة');
    console.log('🆔 [PRODUCTS] معرف الشركة:', COMPANY_ID);
    fetchProducts();
  }, [COMPANY_ID]);

  // عرض شاشة التحميل البسيطة
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل المنتجات...</h2>
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
            <Package className="w-8 h-8 text-blue-600" />
            إدارة المنتجات الجديدة
          </h1>
          <p className="text-gray-600 mt-2">إدارة منتجات المتجر الإلكتروني مع قاعدة البيانات المباشرة</p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة منتج جديد
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي المنتجات</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="w-8 h-8 text-yellow-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">منتجات مميزة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.featured).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">متوسط السعر</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.length > 0 ?
                    Math.round(products.reduce((sum, p) => {
                      const price = parseFloat(p.price || 0);
                      return sum + (isNaN(price) ? 0 : price);
                    }, 0) / products.length) : 0
                  } ر.س
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">منتجات نشطة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.status === 'active').length}
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
                placeholder="البحث في المنتجات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
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
                <SelectItem value="draft">مسودة</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchProducts}>
              <BarChart3 className="w-4 h-4 ml-2" />
              تحديث البيانات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة/تحرير المنتج */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingProduct ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingProduct ? 'تحرير المنتج' : 'إضافة منتج جديد'}
            </CardTitle>
            <CardDescription>
              {editingProduct ? 'تحديث معلومات المنتج' : 'إضافة منتج جديد إلى المتجر'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">اسم المنتج *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="أدخل اسم المنتج"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">رمز المنتج (SKU)</label>
                <Input
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="SKU-12345"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الوصف المختصر</label>
              <Input
                value={formData.short_description}
                onChange={(e) => handleInputChange('short_description', e.target.value)}
                placeholder="وصف مختصر للمنتج"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الوصف التفصيلي</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="وصف تفصيلي للمنتج"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">السعر الأساسي *</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">سعر التخفيض</label>
                <Input
                  type="number"
                  value={formData.sale_price}
                  onChange={(e) => handleInputChange('sale_price', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الكمية المتاحة</label>
                <Input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">الفئة</label>
                <Input
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="فئة المنتج"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">العلامة التجارية</label>
                <Input
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="العلامة التجارية"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الوزن (كجم)</label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="0.0"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رابط الصورة</label>
              <Input
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => handleInputChange('featured', checked)}
              />
              <label className="text-sm font-medium">منتج مميز</label>
            </div>

            <div className="flex gap-4 mt-6">
              <Button onClick={saveProduct} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    {editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
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

      {/* قائمة المنتجات */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-500 mb-4">
              {products.length === 0 ? 'لم يتم إضافة أي منتجات بعد' : 'لا توجد منتجات تطابق معايير البحث'}
            </p>
            {products.length === 0 && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول منتج
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {product.image_url && (
                <div className="h-48 bg-gray-200 relative">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-gray-200">
                            <svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                            </svg>
                          </div>
                        `;
                      }
                    }}
                  />
                  {product.featured && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500">
                      <Star className="w-3 h-3 ml-1" />
                      مميز
                    </Badge>
                  )}
                </div>
              )}

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{product.name}</h3>
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status === 'active' ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.short_description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">السعر:</span>
                    <div className="flex items-center gap-2">
                      {product.sale_price && (
                        <span className="text-sm text-gray-400 line-through">{parseFloat(product.price || 0).toFixed(2)} ر.س</span>
                      )}
                      <span className="font-bold text-green-600">
                        {parseFloat(product.sale_price || product.price || 0).toFixed(2)} ر.س
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">الكمية:</span>
                    <span className={`text-sm font-medium ${product.stock_quantity > 10 ? 'text-green-600' :
                      product.stock_quantity > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                      {product.stock_quantity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">SKU:</span>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{product.sku}</span>
                  </div>

                  {product.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">الفئة:</span>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(product)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    تحرير
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteProduct(product.id!)}
                    disabled={isDeleting === product.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isDeleting === product.id ? (
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

export default NewEcommerceProducts;
