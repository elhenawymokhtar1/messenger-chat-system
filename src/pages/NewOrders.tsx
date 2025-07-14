import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OrdersService, Order, OrderItem } from '@/services/ordersService';
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
  Download, 
  RefreshCw, 
  Eye, 
  User, 
  Calendar, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  FileText, 
  Loader2 
} from 'lucide-react';

// تم نقل تعريفات الأنواع إلى ملف الخدمة الموحد

const NewOrders: React.FC = () => {
  const { toast } = useToast();

  // الحالات
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // حالة عرض التفاصيل
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // دالة جلب الطلبات باستخدام الخدمة الموحدة
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await OrdersService.getOrders();
      setOrders(response.orders);

      toast({
        title: "تم تحميل الطلبات",
        description: `تم تحميل ${response.orders.length} طلب من الخادم`,
        variant: "default"
      });

    } catch (error) {
      console.error('❌ خطأ في تحميل الطلبات:', error);
      setError('فشل في تحميل الطلبات من الخادم');
      setOrders([]); // قائمة فارغة بدلاً من البيانات التجريبية
      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل الطلبات من الخادم. تأكد من تشغيل الخادم الخلفي.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دالة تحديث حالة الطلب باستخدام الخدمة الموحدة
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsUpdating(orderId);

      const updatedOrder = await OrdersService.updateOrderStatus(orderId, newStatus);

      // تحديث الطلب في القائمة
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? updatedOrder : order
        )
      );

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الطلب بنجاح",
      });

    } catch (error) {
      console.error('❌ خطأ في تحديث حالة الطلب:', error);

      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث حالة الطلب. تأكد من تشغيل الخادم الخلفي.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // دالة تحديث حالة الدفع باستخدام الخدمة الموحدة
  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      setIsUpdating(orderId);

      const updatedOrder = await OrdersService.updatePaymentStatus(orderId, newPaymentStatus);

      // تحديث الطلب في القائمة
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? updatedOrder : order
        )
      );

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الدفع بنجاح",
      });

    } catch (error) {
      console.error('❌ خطأ في تحديث حالة الدفع:', error);

      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث حالة الدفع. تأكد من تشغيل الخادم الخلفي.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(null);
    }
  };

  // دالة تصدير الطلبات
  const exportOrders = () => {
    try {
      const csvContent = [
        // Headers
        ['رقم الطلب', 'اسم العميل', 'البريد الإلكتروني', 'الهاتف', 'الحالة', 'حالة الدفع', 'المبلغ', 'التاريخ'].join(','),
        // Data
        ...filteredOrders.map(order => [
          order.order_number || order.id,
          order.customer_name || 'غير محدد',
          order.customer_email || 'غير محدد',
          order.customer_phone || 'غير محدد',
          getStatusText(order.status),
          getPaymentStatusText(order.payment_status),
          `${parseFloat(order.total_amount || 0).toFixed(2)} ج`,
          new Date(order.created_at).toLocaleDateString('ar-SA')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "تم التصدير",
        description: `تم تصدير ${filteredOrders.length} طلب بنجاح`,
      });
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير الطلبات",
        variant: "destructive"
      });
    }
  };

  // دالة عرض تفاصيل الطلب باستخدام الخدمة الموحدة
  const viewOrderDetails = async (orderId: string) => {
    try {
      const order = await OrdersService.getOrder(orderId);
      setSelectedOrder(order);
      setShowOrderDetails(true);

    } catch (error) {
      console.error('❌ خطأ في تحميل تفاصيل الطلب:', error);

      toast({
        title: "خطأ في التحميل",
        description: "فشل في جلب تفاصيل الطلب. تأكد من تشغيل الخادم الخلفي.",
        variant: "destructive"
      });
    }
  };

  // فلترة الطلبات باستخدام الخدمة الموحدة
  const filteredOrders = OrdersService.filterOrders(
    orders,
    searchTerm,
    selectedStatus,
    selectedPaymentStatus,
    dateRange
  );

  // دوال مساعدة للألوان والنصوص
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    إدارة الطلبات
                  </h1>
                  <p className="text-gray-600 text-lg mt-1">إدارة ومتابعة طلبات العملاء وتحديث حالاتها</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchOrders}
                className="bg-white hover:bg-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث
              </Button>

              <Button
                variant="outline"
                onClick={exportOrders}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير ({filteredOrders.length})
              </Button>
            </div>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-8">
          {/* إجمالي الطلبات */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">إجمالي الطلبات</p>
                <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* في الانتظار */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">في الانتظار</p>
                <p className="text-3xl font-bold text-amber-600">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* قيد الشحن */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">قيد الشحن</p>
                <p className="text-3xl font-bold text-purple-600">
                  {orders.filter(o => o.status === 'shipped').length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* مكتملة */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">مكتملة</p>
                <p className="text-3xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* إجمالي المبيعات */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">إجمالي المبيعات</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toFixed(2)} ج
                </p>
              </div>
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* أدوات البحث والفلترة */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">البحث والفلترة</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في الطلبات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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
              <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
            />

            <Input
              type="date"
              placeholder="إلى تاريخ"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
            />
          </div>
        </div>

        {/* قائمة الطلبات */}
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse"></div>
                <Loader2 className="w-16 h-16 absolute top-2 left-2 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2 mt-6">جاري تحميل الطلبات...</h3>
              <p className="text-gray-500 text-lg">يرجى الانتظار</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-red-100 rounded-full mb-6">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">خطأ في التحميل</h3>
              <p className="text-gray-500 mb-6 text-lg">{error}</p>
              <Button
                onClick={fetchOrders}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                إعادة المحاولة
              </Button>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-gray-100 rounded-full mb-6">
                <Package className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">لا توجد طلبات</h3>
              <p className="text-gray-500 mb-6 text-lg">
                {orders.length === 0 ? 'لم يتم إنشاء أي طلبات بعد' : 'لا توجد طلبات تطابق معايير البحث'}
              </p>
              <Button
                onClick={() => window.location.href = '/new-shop'}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Package className="w-4 h-4 ml-2" />
                انتقل للمتجر
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6 items-start lg:items-center">
                    {/* معلومات الطلب */}
                    <div className="md:col-span-2 xl:col-span-2">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{order.order_number}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(order.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      </div>

                      {order.customer_name && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{order.customer_name}</span>
                        </div>
                      )}
                    </div>

                    {/* الحالات والمبلغ */}
                    <div className="md:col-span-2 lg:col-span-1 xl:col-span-2 space-y-4">
                      {/* الحالات */}
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <Badge className={`${getStatusColor(order.status)} px-3 py-1 text-sm font-medium rounded-full`}>
                          {getStatusText(order.status)}
                        </Badge>
                        <Badge className={`${getPaymentStatusColor(order.payment_status)} px-3 py-1 text-sm font-medium rounded-full`}>
                          {getPaymentStatusText(order.payment_status)}
                        </Badge>
                      </div>

                      {/* المبلغ والعناصر */}
                      <div className="text-center md:text-right bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                        <p className="font-bold text-xl lg:text-2xl text-green-600 mb-1">
                          {parseFloat(order.total_amount || 0).toFixed(2)} ج
                        </p>
                        <p className="text-sm text-gray-600 flex items-center justify-center md:justify-start gap-1">
                          <Package className="w-4 h-4" />
                          {order.items_count} منتج
                        </p>
                      </div>
                    </div>

                    {/* أدوات التحديث والإجراءات */}
                    <div className="md:col-span-2 xl:col-span-2 space-y-4">
                      {/* تحديث الحالات */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600">حالة الطلب</label>
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                            disabled={isUpdating === order.id}
                          >
                            <SelectTrigger className="w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600">حالة الدفع</label>
                          <Select
                            value={order.payment_status}
                            onValueChange={(value) => updatePaymentStatus(order.id, value)}
                            disabled={isUpdating === order.id}
                          >
                            <SelectTrigger className="w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
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
                      </div>

                      {/* الإجراءات */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewOrderDetails(order.id)}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          عرض التفاصيل
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/order-confirmation/${order.id}`}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <FileText className="w-4 h-4 ml-1" />
                          صفحة التأكيد
                        </Button>
                      </div>

                      {/* حالة التحديث */}
                      {isUpdating === order.id && (
                        <div className="flex items-center justify-center py-2 bg-blue-50 rounded-lg">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <span className="mr-2 text-sm text-blue-600 font-medium">جاري التحديث...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* نافذة عرض تفاصيل الطلب */}
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">تفاصيل الطلب {selectedOrder.order_number}</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOrderDetails(false)}
                    className="rounded-full"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* معلومات العميل */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      معلومات العميل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">الاسم</label>
                        <p className="text-gray-900">{selectedOrder.customer_name || 'غير محدد'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">البريد الإلكتروني</label>
                        <p className="text-gray-900">{selectedOrder.customer_email || 'غير محدد'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">رقم الهاتف</label>
                        <p className="text-gray-900">{selectedOrder.customer_phone || 'غير محدد'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">تاريخ الطلب</label>
                        <p className="text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ملخص الطلب */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      ملخص الطلب
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* التفاصيل المالية */}
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">المجموع الفرعي:</span>
                          <span className="font-medium">{selectedOrder.subtotal} ج</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">الشحن:</span>
                          <span className="font-medium">{selectedOrder.shipping_cost} ج</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">الضريبة:</span>
                          <span className="font-medium">{selectedOrder.tax_amount} ج</span>
                        </div>
                        {selectedOrder.discount_amount && parseFloat(selectedOrder.discount_amount) > 0 && (
                          <div className="flex justify-between py-2 border-b border-gray-100 text-red-600">
                            <span>الخصم:</span>
                            <span className="font-medium">-{selectedOrder.discount_amount} ج</span>
                          </div>
                        )}
                      </div>

                      {/* المجموع الكلي */}
                      <div className="flex items-center justify-center">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 text-center w-full">
                          <p className="text-sm text-gray-600 mb-2">المجموع الكلي</p>
                          <p className="text-3xl font-bold text-green-600">
                            {parseFloat(selectedOrder.total_amount || 0).toFixed(2)} ج
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* عناصر الطلب */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      عناصر الطلب ({selectedOrder.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 text-lg">{item.product_name}</h4>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>السعر:</span>
                              <span className="font-medium">{item.price} ج</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>الكمية:</span>
                              <span className="font-medium">{item.quantity}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                              <span className="font-medium text-gray-700">المجموع:</span>
                              <span className="font-bold text-green-600 text-lg">{item.total} ج</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewOrders;
