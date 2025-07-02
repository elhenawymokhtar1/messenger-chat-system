import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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

// نوع البيانات لعنصر السلة
interface CartItem {
  id?: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_sku: string;
  price: number;
  quantity: number;
  total: number;
  stock_quantity: number;
  session_id: string;
  created_at?: string;
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
  
  // الحالات الأساسية
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // حالات الكوبون
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // حالات الطلب
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Session ID للسلة (يمكن ربطه بالمستخدم لاحقاً)
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('cart_session_id');
    if (stored) return stored;
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cart_session_id', newId);
    return newId;
  });

  // Company ID ثابت للاختبار
  const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

  // دالة جلب عناصر السلة
  const fetchCartItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 جلب عناصر السلة للجلسة:', sessionId);
      
      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/cart/${sessionId}`, {
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
        setCartItems(result.data || []);
        console.log('✅ تم جلب عناصر السلة بنجاح:', result.data?.length || 0);
      } else {
        throw new Error(result.message || 'فشل في جلب عناصر السلة');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب عناصر السلة:', error);
      setError('فشل في تحميل السلة');
      toast({
        title: "خطأ",
        description: "فشل في تحميل السلة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دالة تحديث كمية المنتج
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setIsUpdating(itemId);
      setError(null);

      console.log('📝 تحديث كمية المنتج:', itemId, newQuantity);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/cart/${sessionId}/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setCartItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity, total: item.price * newQuantity } : item
        ));
        toast({
          title: "تم التحديث",
          description: "تم تحديث كمية المنتج بنجاح",
        });
        console.log('✅ تم تحديث كمية المنتج بنجاح');
      } else {
        throw new Error(result.message || 'فشل في تحديث الكمية');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث الكمية:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث كمية المنتج",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // دالة حذف منتج من السلة
  const removeItem = async (itemId: string) => {
    try {
      setIsRemoving(itemId);
      setError(null);

      console.log('🗑️ حذف منتج من السلة:', itemId);

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/cart/${sessionId}/${itemId}`, {
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
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        toast({
          title: "تم الحذف",
          description: "تم حذف المنتج من السلة",
        });
        console.log('✅ تم حذف المنتج من السلة بنجاح');
      } else {
        throw new Error(result.message || 'فشل في حذف المنتج');
      }
    } catch (error) {
      console.error('❌ خطأ في حذف المنتج:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المنتج من السلة",
        variant: "destructive"
      });
    } finally {
      setIsRemoving(null);
    }
  };

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

  // دالة حساب ملخص السلة
  const calculateSummary = (): CartSummary => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const shipping = subtotal > 200 ? 0 : 25; // شحن مجاني للطلبات أكثر من 200 ر.س
    const tax = subtotal * 0.15; // ضريبة القيمة المضافة 15%
    
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percentage') {
        discount = subtotal * (appliedCoupon.discount_value / 100);
      } else {
        discount = appliedCoupon.discount_value;
      }
    }
    
    const total = subtotal + shipping + tax - discount;
    
    return {
      subtotal,
      shipping,
      tax,
      discount,
      total: Math.max(0, total),
      items_count: cartItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  };

  // دالة إتمام الطلب
  const checkout = async () => {
    try {
      setIsCheckingOut(true);
      setError(null);

      const summary = calculateSummary();
      
      console.log('💳 إتمام الطلب:', summary);

      const orderData = {
        session_id: sessionId,
        items: cartItems,
        summary: summary,
        coupon: appliedCoupon
      };

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/orders`, {
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
        // مسح السلة بعد إتمام الطلب
        setCartItems([]);
        setAppliedCoupon(null);
        setCouponCode('');
        
        toast({
          title: "تم إتمام الطلب",
          description: `رقم الطلب: ${result.data.order_number}`,
        });
        
        console.log('✅ تم إتمام الطلب بنجاح:', result.data.order_number);
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

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    fetchCartItems();
  }, []);

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
          
          <Button variant="outline" onClick={fetchCartItems}>
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
                      <p className="text-lg font-bold text-green-600">{item.price} ر.س</p>
                      <p className="text-sm text-gray-500">
                        متوفر: {item.stock_quantity} قطعة
                      </p>
                    </div>

                    {/* تحكم في الكمية */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id!, item.quantity - 1)}
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
                        onClick={() => updateQuantity(item.id!, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_quantity || isUpdating === item.id}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* المجموع وحذف */}
                    <div className="text-left">
                      <p className="font-bold text-lg text-gray-900">{item.total} ر.س</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id!)}
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

                <Button
                  onClick={checkout}
                  disabled={isCheckingOut || cartItems.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      جاري إتمام الطلب...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 ml-2" />
                      إتمام الطلب ({summary.total.toFixed(2)} ر.س)
                    </>
                  )}
                </Button>

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
