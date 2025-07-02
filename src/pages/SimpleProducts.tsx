import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category: string;
  status: string;
  created_at: string;
}

const SimpleProducts: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // الحالات الأساسية
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category: ''
  });

  // معرف الشركة
  const COMPANY_ID = user?.id || 'test-company-id';

  // دالة جلب المنتجات
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 [SIMPLE-PRODUCTS] جلب المنتجات للشركة:', COMPANY_ID);

      const response = await fetch(`/api/companies/${COMPANY_ID}/products`);
      console.log('📡 [SIMPLE-PRODUCTS] حالة الاستجابة:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('📥 [SIMPLE-PRODUCTS] البيانات:', result);
        
        if (result.success && result.data) {
          setProducts(result.data);
          console.log('✅ [SIMPLE-PRODUCTS] تم جلب', result.data.length, 'منتج');
        } else {
          setProducts([]);
          console.log('ℹ️ [SIMPLE-PRODUCTS] لا توجد منتجات');
        }
      } else {
        setProducts([]);
        console.log('⚠️ [SIMPLE-PRODUCTS] خطأ في الاستجابة:', response.status);
      }
    } catch (error) {
      console.error('❌ [SIMPLE-PRODUCTS] خطأ:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // دالة إنشاء منتج
  const createProduct = async () => {
    try {
      setIsSaving(true);
      
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
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category: formData.category.trim() || 'عام'
      };

      console.log('🏪 [SIMPLE-PRODUCTS] إنشاء منتج:', productData);

      const response = await fetch(`/api/companies/${COMPANY_ID}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      console.log('📡 [SIMPLE-PRODUCTS] حالة الإنشاء:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('📥 [SIMPLE-PRODUCTS] نتيجة الإنشاء:', result);
        
        if (result.success && result.data) {
          setProducts(prev => [result.data, ...prev]);
          setFormData({ name: '', description: '', price: '', stock_quantity: '', category: '' });
          setShowAddForm(false);
          
          toast({
            title: "نجح! 🎉",
            description: `تم إنشاء "${result.data.name}" بنجاح`
          });
          
          console.log('✅ [SIMPLE-PRODUCTS] تم إنشاء المنتج بنجاح');
        } else {
          throw new Error(result.message || 'فشل في إنشاء المنتج');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`خطأ ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ [SIMPLE-PRODUCTS] خطأ في الإنشاء:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : 'فشل في إنشاء المنتج',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // تحميل المنتجات عند بدء التشغيل
  useEffect(() => {
    console.log('🚀 [SIMPLE-PRODUCTS] بدء تحميل الصفحة');
    fetchProducts();
  }, [COMPANY_ID]);

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* العنوان الرئيسي */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المنتجات</h1>
        <p className="text-gray-600">إضافة وإدارة منتجات متجرك</p>
      </div>

      {/* أزرار التحكم */}
      <div className="mb-6 flex gap-4">
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة منتج جديد
        </Button>
        
        <Button 
          variant="outline" 
          onClick={fetchProducts}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Package className="w-4 h-4 ml-2" />}
          تحديث القائمة
        </Button>
      </div>

      {/* نموذج إضافة منتج */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              إضافة منتج جديد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">اسم المنتج *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="أدخل اسم المنتج"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">الفئة</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="مثل: إلكترونيات، ملابس"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">السعر *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">الكمية</label>
                <Input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">الوصف *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف المنتج"
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={createProduct}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                حفظ المنتج
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
              >
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* قائمة المنتجات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            المنتجات ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>جاري تحميل المنتجات...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">لا توجد منتجات</h3>
              <p className="text-gray-600 mb-4">ابدأ بإضافة منتجك الأول</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة منتج
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="border">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-green-600">{product.price} ج.م</span>
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      الكمية: {product.stock_quantity}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleProducts;
