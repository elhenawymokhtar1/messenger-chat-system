import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useCart } from '@/contexts/CartContext';
import { useNewCart } from '@/hooks/useNewCart';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight,
  Package,
  CreditCard,
  Truck,
  Gift,
  Percent,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShoppingBag,
  X,
  RefreshCw
} from 'lucide-react';

// إعدادات API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// نوع البيانات لعنصر السلة
interface CartItem {
  id?: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_sku: string;
  unit_price: number;
  sale_price?: number;
  quantity: number;
  total_price: number;
  stock_available: number;
  added_at?: string;
  updated_at?: string;
}

// نوع البيانات لملخص السلة
interface CartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  items_count: number;
}

// نوع البيانات للكوبون
interface Coupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_amount?: number;
}

const NewCart: React.FC = () => {
  const { toast } = useToast();
  const { company, loading: companyLoading, setCompany } = useCurrentCompany();
  const { cartCount, isLoadingCount } = useCart();

  // استخدام useNewCart للتكامل مع صفحة Checkout
  const {
    cartItems: newCartItems,
    getCartSummary,
    clearCart: clearNewCart,
    isLoading: newCartLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    isUpdating: newCartUpdating,
    isRemoving: newCartRemoving,
    refetch
  } = useNewCart();

  // تهيئة صفحة السلة
  useEffect(() => {
    console.log('🛒 [CART] تهيئة صفحة السلة...');

    // إعداد شركة kok@kok.com الثابتة إذا لم تكن موجودة
    if (!company && !companyLoading) {
      const fixedCompany = {
        id: '2d9b8887-0cca-430b-b61b-ca16cccfec63',
        name: 'kok',
        email: 'kok@kok.com',
        status: 'active'
      };
      setCompany(fixedCompany);
      console.log('✅ [CART] تم تعيين شركة kok@kok.com الثابتة:', fixedCompany.name);
    }
  }, [company, companyLoading, setCompany]);

  // الحالات الأساسية - استخدام البيانات من useNewCart
  const cartItems = newCartItems || [];
  const isLoading = newCartLoading;
  const isUpdating = newCartUpdating;
  const isRemoving = newCartRemoving;
  const [error, setError] = useState<string | null>(null);

  // حالات الكوبون
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // حالات الطلب
  const [isCheckingOut, setIsCheckingOut] = useState(false);



  // Company ID من React Query
  const COMPANY_ID = company?.id || '2d9b8887-0cca-430b-b61b-ca16cccfec63';

  // تم استبدال fetchCartItems بـ useNewCart

  // تم استبدال updateQuantity بـ useNewCart

  // تم استبدال removeItem بـ useNewCart

  // دالة تطبيق كوبون الخصم
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز الكوبون",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsApplyingCoupon(true);
      setError(null);

      console.log('🎫 تطبيق كوبون الخصم:', couponCode);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/coupons/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: couponCode,
          cart_total: calculateSummary().subtotal
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setAppliedCoupon(result.data);
        toast({
          title: "تم التطبيق",
          description: `تم تطبيق كوبون الخصم: ${result.data.discount_value}${result.data.discount_type === 'percentage' ? '%' : ' ر.س'}`,
        });
        console.log('✅ تم تطبيق كوبون الخصم بنجاح');
      } else {
        throw new Error(result.message || 'كوبون غير صالح');
      }
    } catch (error) {
      console.error('❌ خطأ في تطبيق الكوبون:', error);
      toast({
        title: "خطأ",
        description: "كوبون غير صالح أو منتهي الصلاحية",
        variant: "destructive"
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // دالة إزالة الكوبون
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast({
      title: "تم الإزالة",
      description: "تم إزالة كوبون الخصم",
    });
  };

  // دالة حساب ملخص السلة - استخدام getCartSummary من useNewCart
  const calculateSummary = (): CartSummary => {
    const summary = getCartSummary();

    // حساب الخصم إذا كان هناك كوبون مطبق
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percentage') {
        discount = summary.subtotal * (appliedCoupon.discount_value / 100);
      } else {
        discount = appliedCoupon.discount_value;
      }
    }

    // إضافة حقول إضافية للتوافق مع الكود الحالي
    return {
      ...summary,
      discount,
      total: Math.max(0, summary.total - discount),
      items_count: summary.items_count || cartItems.length
    };
  };

  // دالة مسح السلة من الخادم - استخدام clearNewCart
  const clearCartFromServer = async () => {
    try {
      console.log('🗑️ مسح السلة من الخادم للجلسة:', sessionId);
      clearNewCart();
      console.log('✅ تم مسح السلة من الخادم بنجاح');
    } catch (error) {
      console.error('❌ خطأ في مسح السلة من الخادم:', error);
      // لا نوقف العملية حتى لو فشل مسح السلة من الخادم
    }
  };

  // دالة إتمام الطلب
  const checkout = async () => {
    try {
      setIsCheckingOut(true);
      setError(null);

      const summary = calculateSummary();
      
      console.log('💳 إتمام الطلب:', summary);

      const orderData = {
        // البيانات المطلوبة من الخادم
        customer_name: 'عميل تجريبي',
        customer_email: 'test@example.com',
        customer_phone: '+966500000000',
        customer_address: 'عنوان تجريبي، الرياض، السعودية',
        total_amount: summary.total,
        payment_method: 'cash_on_delivery',
        payment_status: 'pending',
        notes: 'طلب من المتجر الإلكتروني',
        items: cartItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price || item.product_price,
          total_price: item.total_price || (item.quantity * (item.price || item.product_price))
        }))
      };

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // مسح السلة من الخادم والواجهة الأمامية
        await clearCartFromServer();

        // مسح السلة محلياً
        setCartItems([]);
        setCartCount(0);
        setAppliedCoupon(null);
        setCouponCode('');

        // تم إتمام الطلب بنجاح

        toast({
          title: "تم إتمام الطلب",
          description: `رقم الطلب: ${result.data.order_number}`,
        });

        console.log('✅ تم إتمام الطلب بنجاح:', result.data.order_number);

        // الانتقال لصفحة الشكر مع تفاصيل الطلب
        const thankYouUrl = `/thank-you?order=${result.data.order_number}&amount=${summary.total}&items=${summary.items_count}`;
        console.log('🎉 الانتقال لصفحة الشكر:', thankYouUrl);

        setTimeout(() => {
          window.location.href = thankYouUrl;
        }, 1500); // انتظار قصير لعرض رسالة النجاح
      } else {
        throw new Error(result.message || 'فشل في إتمام الطلب');
      }
    } catch (error) {
      console.error('❌ خطأ في إتمام الطلب:', error);
      toast({
        title: "خطأ",
        description: "فشل في إتمام الطلب",
        variant: "destructive"
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // تم استبدال useEffect بـ useNewCart الذي يجلب البيانات تلقائياً

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل السلة...</h2>
            <p className="text-gray-500">يرجى الانتظار قليلاً</p>
          </div>
        </div>
      </div>
    );
  }

  const summary = calculateSummary();

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            سلة التسوق الجديدة
          </h1>
          <p className="text-gray-600 mt-2">إدارة منتجات السلة مع قاعدة البيانات المباشرة</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Package className="w-4 h-4 ml-2" />
            {summary.items_count} منتج
          </Badge>
          
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      {cartItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">السلة فارغة</h3>
            <p className="text-gray-500 mb-6">لم تقم بإضافة أي منتجات إلى السلة بعد</p>
            <Button onClick={() => window.location.href = '/new-shop'}>
              <ShoppingBag className="w-4 h-4 ml-2" />
              تصفح المنتجات
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* قائمة المنتجات */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  منتجات السلة ({cartItems.length})
                </CardTitle>
                <CardDescription>
                  يمكنك تعديل الكميات أو حذف المنتجات من هنا
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    {/* صورة المنتج */}
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                                  <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* معلومات المنتج */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                      <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                      <div className="flex items-center gap-2">
                        {item.sale_price ? (
                          <>
                            <p className="text-lg font-bold text-green-600">{item.sale_price} ر.س</p>
                            <p className="text-sm text-gray-500 line-through">{item.unit_price} ر.س</p>
                          </>
                        ) : (
                          <p className="text-lg font-bold text-green-600">{item.unit_price} ر.س</p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        متوفر: {item.stock_available} قطعة
                      </p>
                    </div>

                    {/* تحكم في الكمية */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity({ itemId: item.id!, quantity: item.quantity - 1 })}
                        disabled={item.quantity <= 1 || isUpdating === item.id}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>

                      <span className="w-12 text-center font-medium">
                        {isUpdating === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          item.quantity
                        )}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity({ itemId: item.id!, quantity: item.quantity + 1 })}
                        disabled={item.quantity >= item.stock_available || isUpdating === item.id}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* المجموع وحذف */}
                    <div className="text-left">
                      <p className="font-bold text-lg text-gray-900">{item.total_price} ر.س</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id!)}
                        disabled={isRemoving === item.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {isRemoving === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ملخص الطلب */}
          <div className="space-y-6">
            {/* كوبون الخصم */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  كوبون الخصم
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appliedCoupon ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                        <p className="text-sm text-green-600">
                          خصم {appliedCoupon.discount_value}
                          {appliedCoupon.discount_type === 'percentage' ? '%' : ' ر.س'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeCoupon}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="أدخل رمز الكوبون"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button
                      onClick={applyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                      className="w-full"
                      variant="outline"
                    >
                      {isApplyingCoupon ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          جاري التطبيق...
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4 ml-2" />
                          تطبيق الكوبون
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ملخص الطلب */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  ملخص الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">المجموع الفرعي:</span>
                    <span className="font-medium">{summary.subtotal.toFixed(2)} ر.س</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">الشحن:</span>
                    <span className="font-medium">
                      {summary.shipping === 0 ? (
                        <Badge variant="outline" className="text-green-600">مجاني</Badge>
                      ) : (
                        `${summary.shipping.toFixed(2)} ر.س`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">ضريبة القيمة المضافة (15%):</span>
                    <span className="font-medium">{summary.tax.toFixed(2)} ر.س</span>
                  </div>

                  {summary.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>الخصم:</span>
                      <span className="font-medium">-{summary.discount.toFixed(2)} ر.س</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>المجموع الإجمالي:</span>
                    <span className="text-green-600">{summary.total.toFixed(2)} ر.س</span>
                  </div>
                </div>

                {summary.shipping === 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Truck className="w-4 h-4" />
                      <span className="text-sm font-medium">شحن مجاني!</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      للطلبات أكثر من 200 ر.س
                    </p>
                  </div>
                )}

                {/* خيارات إتمام الطلب */}
                <div className="space-y-3">
                  {/* الانتقال لصفحة Checkout المتطورة */}
                  <Link to="/checkout">
                    <Button
                      disabled={cartItems.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <CreditCard className="w-4 h-4 ml-2" />
                      الانتقال لصفحة الدفع ({summary.total.toFixed(2)} ر.س)
                    </Button>
                  </Link>

                  {/* إتمام سريع (الطريقة الحالية) */}
                  <Button
                    onClick={checkout}
                    disabled={isCheckingOut || cartItems.length === 0}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        جاري إتمام الطلب...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4 ml-2" />
                        إتمام سريع (بيانات تجريبية)
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/new-shop'}
                  className="w-full"
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  متابعة التسوق
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewCart;
