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
  Layers, 
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
  FolderOpen,
  Tag,
  Grid3X3,
  TreePine
} from 'lucide-react';

// إعدادات API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// نوع البيانات للفئة
interface Category {
  id?: string;
  name: string;
  description: string;
  slug: string;
  parent_id?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  meta_title?: string;
  meta_description?: string;
  store_id?: string;
  created_at?: string;
  updated_at?: string;
  children?: Category[];
  parent?: Category;
  products_count?: number;
}

// نوع البيانات للنموذج
interface CategoryFormData {
  name: string;
  description: string;
  slug: string;
  parent_id: string;
  image_url: string;
  is_active: boolean;
  sort_order: string;
  meta_title: string;
  meta_description: string;
}

const NewCategories: React.FC = () => {
  const { toast } = useToast();

  // تسجيل دخول تلقائي للتأكد من عمل الصفحة
  useEffect(() => {
    console.log('🔄 [CATEGORIES] فحص تسجيل الدخول...');

    // إجبار استخدام الشركة التي تحتوي على البيانات
    const testToken = 'test-token-2d9b8887-0cca-430b-b61b-ca16cccfec63';
    const companyId = '2d9b8887-0cca-430b-b61b-ca16cccfec63';

    /* localStorage.setItem معطل */
    /* localStorage.setItem معطل */

    console.log('✅ [CATEGORIES] تم تعيين معرف الشركة:', companyId);
  }, []);

  // الحالات الأساسية
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // حالات النموذج
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // حالات البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParent, setSelectedParent] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Company ID ثابت للاختبار
  const COMPANY_ID = '2d9b8887-0cca-430b-b61b-ca16cccfec63';

  // بيانات النموذج
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    slug: '',
    parent_id: '',
    image_url: '',
    is_active: true,
    sort_order: '0',
    meta_title: '',
    meta_description: ''
  });

  // دالة إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      slug: '',
      parent_id: '',
      image_url: '',
      is_active: true,
      sort_order: '0',
      meta_title: '',
      meta_description: ''
    });
    setEditingCategory(null);
    setShowAddForm(false);
  };

  // دالة توليد slug من الاسم
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[أ-ي]/g, (match) => {
        const arabicToEnglish: { [key: string]: string } = {
          'أ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
          'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's',
          'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
          'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y'
        };
        return arabicToEnglish[match] || match;
      })
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // دالة جلب الفئات
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 جلب الفئات للشركة:', COMPANY_ID);
      
      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/categories`, {
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
        setCategories(result.data || []);
        console.log('✅ تم جلب الفئات بنجاح:', result.data?.length || 0);
      } else {
        throw new Error(result.message || 'فشل في جلب الفئات');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الفئات:', error);
      setError('فشل في تحميل الفئات');
      toast({
        title: "خطأ",
        description: "فشل في تحميل الفئات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دالة إنشاء فئة جديدة
  const createCategory = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        parent_id: formData.parent_id || null,
        image_url: formData.image_url.trim(),
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order) || 0,
        meta_title: formData.meta_title.trim(),
        meta_description: formData.meta_description.trim()
      };

      console.log('🏷️ إنشاء فئة جديدة:', categoryData);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCategories(prev => [result.data, ...prev]);
        resetForm();
        toast({
          title: "نجح",
          description: "تم إنشاء الفئة بنجاح",
        });
        console.log('✅ تم إنشاء الفئة بنجاح:', result.data.name);
      } else {
        throw new Error(result.message || 'فشل في إنشاء الفئة');
      }
    } catch (error) {
      console.error('❌ خطأ في إنشاء الفئة:', error);
      setError('فشل في إنشاء الفئة');
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الفئة",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // دالة تحديث الفئة
  const updateCategory = async () => {
    if (!editingCategory) return;

    try {
      setIsSaving(true);
      setError(null);

      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        parent_id: formData.parent_id || null,
        image_url: formData.image_url.trim(),
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order) || 0,
        meta_title: formData.meta_title.trim(),
        meta_description: formData.meta_description.trim()
      };

      console.log('📝 تحديث الفئة:', updateData);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/categories/${editingCategory.id}`, {
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
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? result.data : c));
        resetForm();
        toast({
          title: "نجح",
          description: "تم تحديث الفئة بنجاح",
        });
        console.log('✅ تم تحديث الفئة بنجاح');
      } else {
        throw new Error(result.message || 'فشل في تحديث الفئة');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث الفئة:', error);
      setError('فشل في تحديث الفئة');
      toast({
        title: "خطأ",
        description: "فشل في تحديث الفئة",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // دالة حذف الفئة
  const deleteCategory = async (categoryId: string) => {
    try {
      setIsDeleting(categoryId);
      setError(null);

      console.log('🗑️ حذف الفئة:', categoryId);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/categories/${categoryId}`, {
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
        setCategories(prev => prev.filter(c => c.id !== categoryId));
        toast({
          title: "نجح",
          description: "تم حذف الفئة بنجاح",
        });
        console.log('✅ تم حذف الفئة بنجاح');
      } else {
        throw new Error(result.message || 'فشل في حذف الفئة');
      }
    } catch (error) {
      console.error('❌ خطأ في حذف الفئة:', error);
      setError('فشل في حذف الفئة');
      toast({
        title: "خطأ",
        description: "فشل في حذف الفئة",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // دالة بدء التحرير
  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      slug: category.slug,
      parent_id: category.parent_id || '',
      image_url: category.image_url || '',
      is_active: category.is_active,
      sort_order: category.sort_order.toString(),
      meta_title: category.meta_title || '',
      meta_description: category.meta_description || ''
    });
    setShowAddForm(true);
  };

  // تحديث قيم النموذج
  const handleInputChange = (field: keyof CategoryFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // توليد slug تلقائياً عند تغيير الاسم
    if (field === 'name' && typeof value === 'string') {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }
  };

  // حفظ الفئة (إنشاء أو تحديث)
  const saveCategory = () => {
    if (!formData.name.trim()) {
      toast({
        title: "خطأ",
        description: "اسم الفئة مطلوب",
        variant: "destructive"
      });
      return;
    }

    if (editingCategory) {
      updateCategory();
    } else {
      createCategory();
    }
  };

  // فلترة الفئات
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParent = selectedParent === 'all' || 
                         (selectedParent === 'root' && !category.parent_id) ||
                         category.parent_id === selectedParent;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && category.is_active) ||
                         (selectedStatus === 'inactive' && !category.is_active);
    return matchesSearch && matchesParent && matchesStatus;
  });

  // الحصول على الفئات الرئيسية (للاختيار كفئة أب)
  const parentCategories = categories.filter(c => !c.parent_id);

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    fetchCategories();
  }, []);

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل الفئات...</h2>
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
            <Layers className="w-8 h-8 text-blue-600" />
            إدارة الفئات الجديدة
          </h1>
          <p className="text-gray-600 mt-2">إدارة فئات وتصنيفات المنتجات مع قاعدة البيانات المباشرة</p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة فئة جديدة
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Layers className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الفئات</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TreePine className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">فئات رئيسية</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => !c.parent_id).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FolderOpen className="w-8 h-8 text-yellow-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">فئات فرعية</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => c.parent_id).length}
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
                <p className="text-sm font-medium text-gray-600">فئات نشطة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => c.is_active).length}
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
                placeholder="البحث في الفئات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={selectedParent} onValueChange={setSelectedParent}>
              <SelectTrigger>
                <SelectValue placeholder="جميع المستويات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستويات</SelectItem>
                <SelectItem value="root">فئات رئيسية فقط</SelectItem>
                {parentCategories.map(category => (
                  <SelectItem key={category.id} value={category.id!}>
                    فرعية من: {category.name}
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

            <Button variant="outline" onClick={fetchCategories}>
              <Grid3X3 className="w-4 h-4 ml-2" />
              تحديث البيانات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة/تحرير الفئة */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingCategory ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingCategory ? 'تحرير الفئة' : 'إضافة فئة جديدة'}
            </CardTitle>
            <CardDescription>
              {editingCategory ? 'تحديث معلومات الفئة' : 'إضافة فئة جديدة للمنتجات'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">اسم الفئة *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="أدخل اسم الفئة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الرابط المختصر (Slug)</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="category-slug"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">وصف الفئة</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="وصف تفصيلي للفئة"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">الفئة الأب</label>
                <Select value={formData.parent_id} onValueChange={(value) => handleInputChange('parent_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="فئة رئيسية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">فئة رئيسية</SelectItem>
                    {parentCategories.map(category => (
                      <SelectItem key={category.id} value={category.id!}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">ترتيب العرض</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => handleInputChange('sort_order', e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <label className="text-sm font-medium">فئة نشطة</label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رابط الصورة</label>
              <Input
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                placeholder="https://example.com/category-image.jpg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">عنوان SEO</label>
                <Input
                  value={formData.meta_title}
                  onChange={(e) => handleInputChange('meta_title', e.target.value)}
                  placeholder="عنوان محركات البحث"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">وصف SEO</label>
                <Input
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  placeholder="وصف محركات البحث"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button onClick={saveCategory} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    {editingCategory ? 'تحديث الفئة' : 'إضافة الفئة'}
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

      {/* قائمة الفئات */}
      {filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Layers className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد فئات</h3>
            <p className="text-gray-500 mb-4">
              {categories.length === 0 ? 'لم يتم إضافة أي فئات بعد' : 'لا توجد فئات تطابق معايير البحث'}
            </p>
            {categories.length === 0 && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول فئة
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {category.image_url && (
                <div className="h-32 bg-gray-200 relative">
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-gray-200">
                            <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                            </svg>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              )}

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{category.name}</h3>
                  <Badge variant={category.is_active ? 'default' : 'secondary'}>
                    {category.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{category.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">الرابط:</span>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      /{category.slug}
                    </span>
                  </div>

                  {category.parent_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">فئة فرعية من:</span>
                      <Badge variant="outline">
                        {categories.find(c => c.id === category.parent_id)?.name || 'غير معروف'}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">الترتيب:</span>
                    <span className="text-sm font-medium">{category.sort_order}</span>
                  </div>

                  {category.products_count !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">المنتجات:</span>
                      <Badge variant="outline">{category.products_count}</Badge>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">تاريخ الإنشاء:</span>
                    <span className="text-sm text-gray-600">
                      {category.created_at ? new Date(category.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(category)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    تحرير
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCategory(category.id!)}
                    disabled={isDeleting === category.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isDeleting === category.id ? (
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

export default NewCategories;
