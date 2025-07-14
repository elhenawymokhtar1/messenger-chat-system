import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useCart } from '@/contexts/CartContext';
import { useNewCart } from '@/hooks/useNewCart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Star, 
  Eye,
  Plus,
  Minus,
  Heart,
  Share2,
  Grid3X3,
  List,
  Palette,
  Ruler,
  Grid2X2,
  LayoutGrid,
  Columns4,
  Loader2,
  AlertCircle,
  Package,
  DollarSign,
  Tag
} from 'lucide-react';

// إعدادات API
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// نوع البيانات للمنتج
interface Product {
  id: string;
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

// نوع البيانات للفئة
interface Category {
  id: string;
  name: string;
  slug: string;
  products_count?: number;
}

// نوع البيانات لعنصر السلة
interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
}

const NewShop: React.FC = () => {
  const { toast } = useToast();
  const { company, loading: companyLoading, setCompany } = useCurrentCompany();
  const { cartCount, setCartCount } = useCart();
  const { addToCart: addToCartMutation } = useNewCart();

  // تهيئة صفحة المتجر
  useEffect(() => {
    console.log('🏪 [SHOP] تهيئة صفحة المتجر...');

    // إعداد شركة kok@kok.com الثابتة إذا لم تكن موجودة
    if (!company && !companyLoading) {
      const fixedCompany = {
        id: '2d9b8887-0cca-430b-b61b-ca16cccfec63',
        name: 'kok',
        email: 'kok@kok.com',
        status: 'active'
      };
      setCompany(fixedCompany);
      console.log('✅ [SHOP] تم تعيين شركة kok@kok.com الثابتة:', fixedCompany.name);
    }
  }, [company, companyLoading, setCompany]);

  // الحالات الأساسية
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);



  // حالات البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridColumns, setGridColumns] = useState(3);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // حالة السلة
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Company ID من React Query
  const COMPANY_ID = company?.id || '2d9b8887-0cca-430b-b61b-ca16cccfec63';

  // دالة جلب المنتجات
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 جلب المنتجات للمتجر:', COMPANY_ID);
      
      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/products`, {
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
        // فلترة المنتجات النشطة فقط (بدون شرط المخزون لعرض جميع المنتجات)
        const activeProducts = (result.data || []).filter((p: Product) => p.status === 'active');
        setProducts(activeProducts);
        console.log('✅ تم جلب المنتجات بنجاح:', activeProducts.length);
        console.log('📦 المنتجات المجلبة:', activeProducts.map(p => ({ name: p.name, stock: p.stock_quantity })));
      } else {
        throw new Error(result.message || 'فشل في جلب المنتجات');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المنتجات:', error);
      setError('فشل في تحميل المنتجات');
      toast({
        title: "خطأ",
        description: "فشل في تحميل المنتجات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دالة جلب الفئات
  const fetchCategories = async () => {
    try {
      console.log('🔍 جلب الفئات للمتجر:', COMPANY_ID);
      
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
        // فلترة الفئات النشطة فقط
        const activeCategories = (result.data || []).filter((c: Category) => c.name);
        setCategories(activeCategories);
        console.log('✅ تم جلب الفئات بنجاح:', activeCategories.length);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الفئات:', error);
    }
  };

  // دالة إضافة منتج للسلة
  const addToCart = async (product: Product) => {
    try {
      setIsAddingToCart(product.id);

      console.log('🛒 إضافة منتج للسلة:', product.name);
      console.log('🔑 النظام المبسط - استخدام useNewCart!');

      // استخدام useNewCart mutation
      addToCartMutation({
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        price: parseFloat(product.sale_price || product.price),
        quantity: 1,
        image_url: product.image_url || ''
      });

      console.log('✅ تم إرسال المنتج للسلة باستخدام useNewCart');

    } catch (error) {
      console.error('❌ خطأ في إضافة المنتج للسلة:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المنتج للسلة",
        variant: "destructive"
      });
    } finally {
      setIsAddingToCart(null);
    }
  };

  // دالة الانتقال إلى صفحة السلة
  const goToCart = () => {
    console.log('🛒 الانتقال إلى صفحة السلة');
    window.location.href = '/new-cart';
  };

  // فلترة وترتيب المنتجات
  const getFilteredProducts = () => {
    let filtered = products.filter(product => {
      // فلتر البحث
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // فلتر الفئة
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

      // فلتر العلامة التجارية
      const matchesBrand = selectedBrand === 'all' || product.brand === selectedBrand;

      // فلتر السعر
      const price = product.sale_price || product.price;
      const matchesPrice = (!priceRange.min || price >= parseFloat(priceRange.min)) &&
                          (!priceRange.max || price <= parseFloat(priceRange.max));

      return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
    });

    // ترتيب المنتجات
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        break;
    }

    return filtered;
  };

  // الحصول على العلامات التجارية الفريدة
  const getBrands = () => {
    return [...new Set(products.map(p => p.brand).filter(Boolean))];
  };

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل المتجر...</h2>
            <p className="text-gray-500">يرجى الانتظار قليلاً</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();
  const brands = getBrands();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">متجر سوان شوب الجديد</h1>
              <p className="text-gray-600">اكتشف أحدث المنتجات العصرية مع قاعدة البيانات المباشرة</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4 ml-2" />
                المفضلة
              </Button>
              <Button
                onClick={goToCart}
                variant="outline"
                size="sm"
                className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <ShoppingCart className="w-4 h-4 ml-2" />
                السلة ({cartCount})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Package className="w-6 h-6 mx-auto mb-1 text-blue-600" />
              <p className="text-sm text-gray-600">المنتجات</p>
              <p className="font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="text-center">
              <Tag className="w-6 h-6 mx-auto mb-1 text-green-600" />
              <p className="text-sm text-gray-600">الفئات</p>
              <p className="font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="text-center">
              <Star className="w-6 h-6 mx-auto mb-1 text-yellow-600" />
              <p className="text-sm text-gray-600">المميزة</p>
              <p className="font-bold text-gray-900">{products.filter(p => p.featured).length}</p>
            </div>
            <div className="text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-1 text-purple-600" />
              <p className="text-sm text-gray-600">متوسط السعر</p>
              <p className="font-bold text-gray-900">
                {products.length > 0 ?
                  Math.round(products.reduce((sum, p) => {
                    const price = parseFloat(p.sale_price || p.price || 0);
                    return sum + (isNaN(price) ? 0 : price);
                  }, 0) / products.length) : 0
                } ر.س
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* أدوات البحث والفلترة */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            <div className="relative md:col-span-2">
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
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
                <SelectValue placeholder="جميع العلامات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العلامات</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="featured">المميزة</SelectItem>
                <SelectItem value="price-low">السعر: من الأقل</SelectItem>
                <SelectItem value="price-high">السعر: من الأعلى</SelectItem>
                <SelectItem value="name">الاسم</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* فلتر السعر */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">نطاق السعر:</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="من"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                className="w-20"
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                placeholder="إلى"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                className="w-20"
              />
              <span className="text-sm text-gray-500">ر.س</span>
            </div>

            {viewMode === 'grid' && (
              <div className="flex items-center gap-2 mr-auto">
                <span className="text-sm font-medium text-gray-700">الأعمدة:</span>
                <Select value={gridColumns.toString()} onValueChange={(value) => setGridColumns(parseInt(value))}>
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-6 py-8">
        {/* نتائج البحث */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {searchTerm ? `نتائج البحث عن "${searchTerm}"` : 'جميع المنتجات'}
            </h2>
            <p className="text-gray-600">
              عرض {filteredProducts.length} من أصل {products.length} منتج
            </p>
          </div>

          <Button variant="outline" onClick={fetchProducts}>
            <Package className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </div>

        {/* قائمة المنتجات */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد منتجات</h3>
              <p className="text-gray-500 mb-4">
                {products.length === 0 ? 'لا توجد منتجات متاحة حالياً' : 'لا توجد منتجات تطابق معايير البحث'}
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  مسح البحث
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid'
              ? `grid-cols-1 md:grid-cols-${gridColumns === 2 ? '2' : gridColumns === 3 ? '3' : gridColumns === 4 ? '4' : '6'}`
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product) => (
              <Card key={product.id} className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${
                viewMode === 'list' ? 'flex flex-row' : ''
              }`}>
                <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className={`object-cover transition-all duration-300 ${
                        viewMode === 'list' ? 'w-48 h-32' : 'w-full h-48'
                      }`}
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
                  ) : (
                    <div className={`bg-gray-200 flex items-center justify-center ${
                      viewMode === 'list' ? 'w-48 h-32' : 'w-full h-48'
                    }`}>
                      <ShoppingCart className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  {product.featured && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500">
                      <Star className="w-3 h-3 ml-1" />
                      مميز
                    </Badge>
                  )}

                  {product.sale_price && (
                    <Badge className="absolute top-2 left-2 bg-red-500">
                      خصم {Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                    </Badge>
                  )}

                  {product.stock_quantity <= 0 && (
                    <Badge className="absolute bottom-2 left-2 bg-gray-500">
                      نفد المخزون
                    </Badge>
                  )}
                </div>

                <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{product.name}</h3>
                    <Button variant="ghost" size="sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.short_description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">السعر:</span>
                      <div className="flex items-center gap-2">
                        {product.sale_price && (
                          <span className="text-sm text-gray-400 line-through">{parseFloat(product.price || 0).toFixed(2)} ر.س</span>
                        )}
                        <span className="font-bold text-green-600 text-lg">
                          {parseFloat(product.sale_price || product.price || 0).toFixed(2)} ر.س
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">المتوفر:</span>
                      <span className={`text-sm font-medium ${
                        product.stock_quantity > 10 ? 'text-green-600' :
                        product.stock_quantity > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {product.stock_quantity} قطعة
                      </span>
                    </div>

                    {product.category && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">الفئة:</span>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                    )}

                    {product.brand && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">العلامة:</span>
                        <Badge variant="outline">{product.brand}</Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={isAddingToCart === product.id || product.stock_quantity === 0}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isAddingToCart === product.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          جاري الإضافة...
                        </>
                      ) : product.stock_quantity === 0 ? (
                        'نفد المخزون'
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 ml-2" />
                          أضف للسلة
                        </>
                      )}
                    </Button>

                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewShop;
