import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ArrowRight,
  Download,
  Share2,
  ShoppingBag,
  Star,
  Gift,
  Heart
} from 'lucide-react';

// إعدادات API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

interface OrderDetails {
  id: string;
  order_number: string;
  total_amount: number;
  items_count: number;
  status: string;
  payment_status: string;
  created_at: string;
}

const ThankYou: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const orderNumber = searchParams.get('order');
  const amount = searchParams.get('amount');
  const items = searchParams.get('items');
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // تسجيل دخول تلقائي للتأكد من عمل الصفحة
  useEffect(() => {
    console.log('🔄 [THANK_YOU] فحص تسجيل الدخول...');
    
    const testToken = 'test-token-2d9b8887-0cca-430b-b61b-ca16cccfec63';
    const companyId = '2d9b8887-0cca-430b-b61b-ca16cccfec63';
    
    /* localStorage.setItem معطل */
    /* localStorage.setItem معطل */
    
    console.log('✅ [THANK_YOU] تم تعيين معرف الشركة:', companyId);
  }, []);

  useEffect(() => {
    if (!orderNumber) {
      // إذا لم يكن هناك رقم طلب، انتقل للمتجر
      navigate('/new-shop');
      return;
    }

    // محاكاة تفاصيل الطلب
    const mockOrderDetails: OrderDetails = {
      id: `order-${Date.now()}`,
      order_number: orderNumber,
      total_amount: parseFloat(amount || '0'),
      items_count: parseInt(items || '0'),
      status: 'confirmed',
      payment_status: 'paid',
      created_at: new Date().toISOString()
    };

    setOrderDetails(mockOrderDetails);
    
    // إرسال إشعار نجاح
    console.log('🎉 تم إتمام الطلب بنجاح:', orderNumber);
  }, [orderNumber, amount, items, navigate]);

  const handleContinueShopping = () => {
    navigate('/new-shop');
  };

  const handleViewOrders = () => {
    navigate('/new-orders');
  };

  const handleDownloadReceipt = () => {
    console.log('📄 تحميل فاتورة الطلب:', orderNumber);
    // محاكاة تحميل الفاتورة
    alert('سيتم تحميل الفاتورة قريباً');
  };

  const handleShareOrder = () => {
    console.log('📤 مشاركة تفاصيل الطلب:', orderNumber);
    // محاكاة مشاركة الطلب
    if (navigator.share) {
      navigator.share({
        title: 'تم إتمام طلبي بنجاح',
        text: `تم إتمام طلب رقم ${orderNumber} بنجاح!`,
        url: window.location.href
      });
    } else {
      // نسخ الرابط للحافظة
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط الطلب للحافظة');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل تفاصيل الطلب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* رسالة النجاح الرئيسية */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 شكراً لك! تم إتمام طلبك بنجاح
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            تم استلام طلبك وسنبدأ في تحضيره فوراً
          </p>
          {orderDetails && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
              <Package className="w-4 h-4" />
              <span className="font-semibold">رقم الطلب: {orderDetails.order_number}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* تفاصيل الطلب */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
              <CardTitle className="flex items-center">
                <Package className="w-6 h-6 ml-3" />
                تفاصيل طلبك
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {orderDetails && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">رقم الطلب:</span>
                    <span className="font-semibold">{orderDetails.order_number}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">إجمالي المبلغ:</span>
                    <span className="font-bold text-lg text-green-600">
                      {orderDetails.total_amount.toFixed(2)} ر.س
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">عدد المنتجات:</span>
                    <span className="font-semibold">{orderDetails.items_count} منتج</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">حالة الطلب:</span>
                    <Badge className="bg-green-100 text-green-800">
                      مؤكد
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">حالة الدفع:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      مدفوع
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">تاريخ الطلب:</span>
                    <span className="font-semibold">
                      {new Date(orderDetails.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* الخطوات التالية */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <CardTitle className="flex items-center">
                <Truck className="w-6 h-6 ml-3" />
                ماذا بعد؟
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">تأكيد الطلب</h4>
                    <p className="text-sm text-gray-600">سنتواصل معك خلال ساعات لتأكيد التفاصيل</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">تحضير الطلب</h4>
                    <p className="text-sm text-gray-600">تحضير وتغليف منتجاتك بعناية</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">الشحن والتوصيل</h4>
                    <p className="text-sm text-gray-600">توصيل الطلب خلال 2-3 أيام عمل</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* أزرار الإجراءات */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            onClick={handleContinueShopping}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ShoppingBag className="w-4 h-4 ml-2" />
            متابعة التسوق
          </Button>
          
          <Button 
            onClick={handleViewOrders}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <Package className="w-4 h-4 ml-2" />
            عرض طلباتي
          </Button>
          
          <Button 
            onClick={handleDownloadReceipt}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Download className="w-4 h-4 ml-2" />
            تحميل الفاتورة
          </Button>
          
          <Button 
            onClick={handleShareOrder}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <Share2 className="w-4 h-4 ml-2" />
            مشاركة الطلب
          </Button>
        </div>

        {/* رسالة شكر إضافية */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-6 rounded-lg">
            <div className="flex justify-center mb-4">
              <Heart className="w-8 h-8 text-pink-500" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2 text-lg">
              💖 نقدر ثقتك بنا
            </h3>
            <p className="text-gray-700 mb-4">
              شكراً لاختيارك متجرنا. نحن ملتزمون بتقديم أفضل خدمة وأعلى جودة لك
            </p>
            <div className="flex justify-center items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
              <span className="mr-2 text-sm text-gray-600">تقييم 5 نجوم من عملائنا</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
