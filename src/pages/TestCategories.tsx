import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Save, X } from 'lucide-react';

interface Category {
  id?: string;
  name: string;
  description: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  color?: string;
  created_at?: string;
}

const TestCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    sort_order: '1',
    is_active: true,
    color: '#007bff'
  });

  const COMPANY_ID = '2d9b8887-0cca-430b-b61b-ca16cccfec63';

  // دالة جلب الفئات
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 جلب الفئات للشركة:', COMPANY_ID);
      
      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 حالة الاستجابة:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📝 نتيجة الاستجابة:', result);
      
      if (result.success) {
        setCategories(result.data || []);
        console.log('✅ تم جلب الفئات بنجاح:', result.data?.length || 0);
      } else {
        throw new Error(result.message || 'فشل في جلب الفئات');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الفئات:', error);
      setError(`فشل في تحميل الفئات: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // دالة إضافة فئة
  const addCategory = async () => {
    if (!formData.name.trim()) {
      setError('اسم الفئة مطلوب');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        slug: formData.slug.trim() || formData.name.trim().replace(/\s+/g, '-').toLowerCase(),
        sort_order: parseInt(formData.sort_order) || 1,
        is_active: formData.is_active,
        color: formData.color
      };

      console.log('🆕 إضافة فئة جديدة:', categoryData);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData)
      });

      console.log('📊 حالة إضافة الفئة:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📝 نتيجة الإضافة:', result);

      if (result.success) {
        setCategories(prev => [result.data, ...prev]);
        setFormData({
          name: '',
          description: '',
          slug: '',
          sort_order: '1',
          is_active: true,
          color: '#007bff'
        });
        setShowAddForm(false);
        console.log('✅ تم إضافة الفئة بنجاح:', result.data.name);
      } else {
        throw new Error(result.message || 'فشل في إضافة الفئة');
      }
    } catch (error) {
      console.error('❌ خطأ في إضافة الفئة:', error);
      setError(`فشل في إضافة الفئة: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900">اختبار الفئات</h1>
          <p className="text-gray-600 mt-2">صفحة اختبار لإدارة الفئات</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة فئة جديدة
        </Button>
      </div>

      {/* عرض الأخطاء */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>خطأ:</strong> {error}
        </div>
      )}

      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
              <p className="text-gray-600">إجمالي الفئات</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {categories.filter(c => c.is_active).length}
              </p>
              <p className="text-gray-600">فئات نشطة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {categories.filter(c => !c.is_active).length}
              </p>
              <p className="text-gray-600">فئات غير نشطة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نموذج الإضافة */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>إضافة فئة جديدة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">اسم الفئة *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="أدخل اسم الفئة"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف الفئة"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">الرابط المختصر</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="category-slug"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ترتيب العرض</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                  placeholder="1"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button onClick={addCategory} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    إضافة الفئة
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
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
      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد فئات</h3>
            <p className="text-gray-500 mb-4">لم يتم إضافة أي فئات بعد</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة أول فئة
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">{category.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    category.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">الرابط:</span>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      /{category.slug}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">الترتيب:</span>
                    <span className="text-sm font-medium">{category.sort_order}</span>
                  </div>
                  {category.color && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">اللون:</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm font-mono">{category.color}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">تاريخ الإنشاء:</span>
                    <span className="text-sm text-gray-600">
                      {category.created_at ? new Date(category.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </span>
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

export default TestCategories;
