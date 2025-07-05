import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Truck,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
  DollarSign,
  User,
  Phone,
  MapPin,
  RefreshCw,
  Download,
  FileText
} from 'lucide-react';

// إعدادات API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// نوع البيانات للطلب
interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  items_count: number;
  session_id: string;
  coupon_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

// نوع البيانات لعنصر الطلب
interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string;
  product_image?: string;
  price: number;
  quantity: number;
  total: number;
}

const NewOrders: React.FC = () => {
  const { toast } = useToast();

  // تسجيل دخول تلقائي للتأكد من عمل الصفحة
  useEffect(() => {
    console.log('🔄 [ORDERS] فحص تسجيل الدخول...');

    // إجبار استخدام الشركة التي تحتوي على البيانات
    const testToken = 'test-token-c677b32f-fe1c-4c64-8362-a1c03406608d';
    const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

    localStorage.setItem('auth_token', testToken);
    localStorage.setItem('company_id', companyId);

    console.log('✅ [ORDERS] تم تعيين معرف الشركة:', companyId);
  }, []);

  // الحالات الأساسية
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // حالات البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // حالة عرض التفاصيل
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Company ID ثابت للاختبار
  const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

  // دالة جلب الطلبات
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 جلب الطلبات للشركة:', COMPANY_ID);
      
      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/orders`, {
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
        setOrders(result.data || []);
        console.log('✅ تم جلب الطلبات بنجاح:', result.data?.length || 0);
      } else {
        throw new Error(result.message || 'فشل في جلب الطلبات');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب الطلبات:', error);
      setError('فشل في تحميل الطلبات');
      toast({
        title: "خطأ",
        description: "فشل في تحميل الطلبات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دالة تحديث حالة الطلب
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsUpdating(orderId);
      setError(null);

      console.log('📝 تحديث حالة الطلب:', orderId, newStatus);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus as any } : order
        ));
        toast({
          title: "تم التحديث",
          description: "تم تحديث حالة الطلب بنجاح",
        });
        console.log('✅ تم تحديث حالة الطلب بنجاح');
      } else {
        throw new Error(result.message || 'فشل في تحديث حالة الطلب');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة الطلب:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الطلب",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // دالة تحديث حالة الدفع
  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      setIsUpdating(orderId);
      setError(null);

      console.log('💳 تحديث حالة الدفع:', orderId, newPaymentStatus);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_status: newPaymentStatus })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, payment_status: newPaymentStatus as any } : order
        ));
        toast({
          title: "تم التحديث",
          description: "تم تحديث حالة الدفع بنجاح",
        });
        console.log('✅ تم تحديث حالة الدفع بنجاح');
      } else {
        throw new Error(result.message || 'فشل في تحديث حالة الدفع');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة الدفع:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الدفع",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // دالة عرض تفاصيل الطلب
  const viewOrderDetails = async (orderId: string) => {
    try {
      console.log('👁️ عرض تفاصيل الطلب:', orderId);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/orders/${orderId}`, {
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
        setSelectedOrder(result.data);
        setShowDetails(true);
        console.log('✅ تم جلب تفاصيل الطلب بنجاح');
      } else {
        throw new Error(result.message || 'فشل في جلب تفاصيل الطلب');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب تفاصيل الطلب:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب تفاصيل الطلب",
        variant: "destructive"
      });
    }
  };

  // فلترة الطلبات
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (order.customer_email && order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.payment_status === selectedPaymentStatus;
    
    let matchesDate = true;
    if (dateRange.from && dateRange.to) {
      const orderDate = new Date(order.created_at);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      matchesDate = orderDate >= fromDate && orderDate <= toDate;
    }
    
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDate;
  });

  // دالة الحصول على لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // دالة الحصول على لون حالة الدفع
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // دالة الحصول على نص الحالة
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'processing': return 'قيد التجهيز';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التسليم';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  // دالة الحصول على نص حالة الدفع
  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'paid': return 'مدفوع';
      case 'failed': return 'فشل';
      case 'refunded': return 'مسترد';
      default: return status;
    }
  };

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    fetchOrders();
  }, []);

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل الطلبات...</h2>
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
            إدارة الطلبات الجديدة
          </h1>
          <p className="text-gray-600 mt-2">إدارة ومتابعة طلبات العملاء مع قاعدة البيانات المباشرة</p>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>

          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">في الانتظار</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-purple-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">قيد الشحن</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'shipped').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">مكتملة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(o => o.status === 'delivered').length}
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
                <p className="text-sm font-medium text-gray-600">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(0)} ر.س
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات البحث والفلترة */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في الطلبات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="confirmed">مؤكد</SelectItem>
                <SelectItem value="processing">قيد التجهيز</SelectItem>
                <SelectItem value="shipped">تم الشحن</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="حالة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع حالات الدفع</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="failed">فشل</SelectItem>
                <SelectItem value="refunded">مسترد</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="من تاريخ"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            />

            <Input
              type="date"
              placeholder="إلى تاريخ"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* قائمة الطلبات */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد طلبات</h3>
            <p className="text-gray-500 mb-4">
              {orders.length === 0 ? 'لم يتم إنشاء أي طلبات بعد' : 'لا توجد طلبات تطابق معايير البحث'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                  {/* معلومات الطلب */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>

                    {order.customer_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{order.customer_name}</span>
                      </div>
                    )}
                  </div>

                  {/* الحالات */}
                  <div className="space-y-2">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                    <Badge className={getPaymentStatusColor(order.payment_status)}>
                      {getPaymentStatusText(order.payment_status)}
                    </Badge>
                  </div>

                  {/* المبلغ والعناصر */}
                  <div className="text-center">
                    <p className="font-bold text-lg text-green-600">{order.total_amount} ر.س</p>
                    <p className="text-sm text-gray-500">{order.items_count} منتج</p>
                  </div>

                  {/* تحديث الحالة */}
                  <div className="space-y-2">
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                      disabled={isUpdating === order.id}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">في الانتظار</SelectItem>
                        <SelectItem value="confirmed">مؤكد</SelectItem>
                        <SelectItem value="processing">قيد التجهيز</SelectItem>
                        <SelectItem value="shipped">تم الشحن</SelectItem>
                        <SelectItem value="delivered">تم التسليم</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={order.payment_status}
                      onValueChange={(value) => updatePaymentStatus(order.id, value)}
                      disabled={isUpdating === order.id}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">في الانتظار</SelectItem>
                        <SelectItem value="paid">مدفوع</SelectItem>
                        <SelectItem value="failed">فشل</SelectItem>
                        <SelectItem value="refunded">مسترد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* الإجراءات */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewOrderDetails(order.id)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      عرض
                    </Button>

                    {isUpdating === order.id && (
                      <div className="flex items-center justify-center w-8">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* نافذة تفاصيل الطلب */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">تفاصيل الطلب {selectedOrder.order_number}</h2>
                <Button variant="ghost" onClick={() => setShowDetails(false)}>
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* معلومات العميل */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      معلومات العميل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedOrder.customer_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{selectedOrder.customer_name}</span>
                      </div>
                    )}
                    {selectedOrder.customer_email && (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 text-gray-500">@</span>
                        <span>{selectedOrder.customer_email}</span>
                      </div>
                    )}
                    {selectedOrder.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{selectedOrder.customer_phone}</span>
                      </div>
                    )}
                    {selectedOrder.customer_address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{selectedOrder.customer_address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      ملخص الطلب
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span>{selectedOrder.subtotal} ر.س</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الشحن:</span>
                      <span>{selectedOrder.shipping_cost} ر.س</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الضريبة:</span>
                      <span>{selectedOrder.tax_amount} ر.س</span>
                    </div>
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>الخصم:</span>
                        <span>-{selectedOrder.discount_amount} ر.س</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>المجموع الإجمالي:</span>
                      <span className="text-green-600">{selectedOrder.total_amount} ر.س</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* عناصر الطلب */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      عناصر الطلب ({selectedOrder.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <h4 className="font-medium">{item.product_name}</h4>
                            <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                            <p className="text-sm text-gray-600">
                              {item.price} ر.س × {item.quantity}
                            </p>
                          </div>

                          <div className="text-left">
                            <p className="font-bold">{item.total} ر.س</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOrders;
