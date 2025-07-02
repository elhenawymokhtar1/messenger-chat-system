import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Loader2,
  Eye,
  FileText,
  PieChart,
  LineChart,
  Activity,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';

// نوع البيانات للتقرير
interface ReportData {
  sales: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
    growth_rate: number;
    monthly_revenue: Array<{ month: string; revenue: number; orders: number }>;
  };
  products: {
    total_products: number;
    active_products: number;
    low_stock_products: number;
    top_selling: Array<{ name: string; sales: number; revenue: number }>;
  };
  customers: {
    total_customers: number;
    new_customers: number;
    returning_customers: number;
    customer_retention_rate: number;
  };
  orders: {
    pending_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    average_processing_time: number;
  };
}

// نوع البيانات للفترة الزمنية
interface DateRange {
  from: string;
  to: string;
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

const NewReports: React.FC = () => {
  const { toast } = useToast();
  
  // الحالات الأساسية
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // حالات الفلترة
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // آخر 30 يوم
    to: new Date().toISOString().split('T')[0],
    period: 'month'
  });

  // Company ID ثابت للاختبار
  const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

  // دالة جلب بيانات التقارير
  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('📊 جلب بيانات التقارير للشركة:', COMPANY_ID);
      
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
        period: dateRange.period
      });

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/reports?${params}`, {
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
        setReportData(result.data);
        console.log('✅ تم جلب بيانات التقارير بنجاح');
      } else {
        throw new Error(result.message || 'فشل في جلب بيانات التقارير');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب بيانات التقارير:', error);
      setError('فشل في تحميل التقارير');
      
      // بيانات وهمية للعرض
      setReportData({
        sales: {
          total_revenue: 125000,
          total_orders: 450,
          average_order_value: 278,
          growth_rate: 15.5,
          monthly_revenue: [
            { month: 'يناير', revenue: 95000, orders: 320 },
            { month: 'فبراير', revenue: 110000, orders: 380 },
            { month: 'مارس', revenue: 125000, orders: 450 }
          ]
        },
        products: {
          total_products: 150,
          active_products: 142,
          low_stock_products: 12,
          top_selling: [
            { name: 'منتج أ', sales: 85, revenue: 12750 },
            { name: 'منتج ب', sales: 72, revenue: 10800 },
            { name: 'منتج ج', sales: 68, revenue: 9520 }
          ]
        },
        customers: {
          total_customers: 1250,
          new_customers: 180,
          returning_customers: 320,
          customer_retention_rate: 72.5
        },
        orders: {
          pending_orders: 25,
          completed_orders: 425,
          cancelled_orders: 15,
          average_processing_time: 2.5
        }
      });
      
      toast({
        title: "تحذير",
        description: "تم عرض بيانات تجريبية - فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // دالة تصدير التقرير
  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      setIsExporting(true);
      
      console.log(`📄 تصدير التقرير بصيغة ${format}`);
      
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
        period: dateRange.period,
        format: format
      });

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/reports/export?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // تحميل الملف
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report_${dateRange.from}_${dateRange.to}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "نجح",
        description: `تم تصدير التقرير بصيغة ${format.toUpperCase()}`,
      });
      
      console.log('✅ تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تصدير التقرير:', error);
      toast({
        title: "خطأ",
        description: "فشل في تصدير التقرير",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // دالة تحديث الفترة الزمنية
  const updateDateRange = (period: string) => {
    const today = new Date();
    let from = new Date();
    
    switch (period) {
      case 'today':
        from = new Date(today);
        break;
      case 'week':
        from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        from = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        from = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return; // للفترة المخصصة
    }
    
    setDateRange({
      from: from.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
      period: period as any
    });
  };

  // دالة حساب النسبة المئوية للتغيير
  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // دالة تنسيق الأرقام
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  // دالة تنسيق العملة
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  // تحميل البيانات عند تغيير الفترة الزمنية
  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">جاري تحميل التقارير...</h2>
            <p className="text-gray-500">يرجى الانتظار قليلاً</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="container mx-auto px-6 py-8" dir="rtl">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">خطأ في تحميل التقارير</h3>
            <p className="text-gray-500 mb-4">فشل في تحميل بيانات التقارير</p>
            <Button onClick={fetchReportData}>
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            التقارير والإحصائيات الجديدة
          </h1>
          <p className="text-gray-600 mt-2">تقارير شاملة ومفصلة عن أداء المتجر مع قاعدة البيانات المباشرة</p>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={fetchReportData}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>

          <Select onValueChange={(value) => exportReport(value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="تصدير التقرير" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">تصدير PDF</SelectItem>
              <SelectItem value="excel">تصدير Excel</SelectItem>
              <SelectItem value="csv">تصدير CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* أدوات الفلترة */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">الفترة الزمنية</label>
              <Select value={dateRange.period} onValueChange={updateDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">آخر أسبوع</SelectItem>
                  <SelectItem value="month">آخر شهر</SelectItem>
                  <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
                  <SelectItem value="year">آخر سنة</SelectItem>
                  <SelectItem value="custom">فترة مخصصة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">من تاريخ</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value, period: 'custom' }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">إلى تاريخ</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value, period: 'custom' }))}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={fetchReportData} className="w-full">
                <Filter className="w-4 h-4 ml-2" />
                تطبيق الفلتر
              </Button>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => exportReport('pdf')}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Download className="w-4 h-4 ml-2" />
                )}
                تصدير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات المبيعات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.sales.total_revenue)}</p>
                <div className="flex items-center mt-2">
                  {reportData.sales.growth_rate >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 ml-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 ml-1" />
                  )}
                  <span className={`text-sm font-medium ${reportData.sales.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(reportData.sales.growth_rate).toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.sales.total_orders)}</p>
                <p className="text-sm text-gray-500 mt-2">طلب جديد</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">متوسط قيمة الطلب</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.sales.average_order_value)}</p>
                <p className="text-sm text-gray-500 mt-2">لكل طلب</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي العملاء</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.customers.total_customers)}</p>
                <p className="text-sm text-gray-500 mt-2">عميل مسجل</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تقارير تفصيلية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* تقرير المنتجات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              تقرير المنتجات
            </CardTitle>
            <CardDescription>إحصائيات المنتجات والمخزون</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{reportData.products.total_products}</p>
                <p className="text-sm text-gray-600">إجمالي المنتجات</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{reportData.products.active_products}</p>
                <p className="text-sm text-gray-600">منتجات نشطة</p>
              </div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{reportData.products.low_stock_products}</p>
              <p className="text-sm text-gray-600">منتجات قليلة المخزون</p>
            </div>

            <div>
              <h4 className="font-medium mb-3">أكثر المنتجات مبيعاً</h4>
              <div className="space-y-2">
                {reportData.products.top_selling.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{product.name}</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-green-600">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-gray-500">{product.sales} مبيعة</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تقرير الطلبات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              تقرير الطلبات
            </CardTitle>
            <CardDescription>حالة ومعالجة الطلبات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{reportData.orders.pending_orders}</p>
                <p className="text-sm text-gray-600">طلبات معلقة</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{reportData.orders.completed_orders}</p>
                <p className="text-sm text-gray-600">طلبات مكتملة</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{reportData.orders.cancelled_orders}</p>
                <p className="text-sm text-gray-600">طلبات ملغية</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{reportData.orders.average_processing_time}</p>
                <p className="text-sm text-gray-600">متوسط المعالجة (يوم)</p>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">معدل إتمام الطلبات</span>
                <span className="font-bold text-purple-600">
                  {((reportData.orders.completed_orders / (reportData.orders.completed_orders + reportData.orders.cancelled_orders)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(reportData.orders.completed_orders / (reportData.orders.completed_orders + reportData.orders.cancelled_orders)) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تقرير العملاء */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            تقرير العملاء
          </CardTitle>
          <CardDescription>إحصائيات العملاء والاحتفاظ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{formatNumber(reportData.customers.total_customers)}</p>
              <p className="text-sm text-gray-600 mt-2">إجمالي العملاء</p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{formatNumber(reportData.customers.new_customers)}</p>
              <p className="text-sm text-gray-600 mt-2">عملاء جدد</p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{formatNumber(reportData.customers.returning_customers)}</p>
              <p className="text-sm text-gray-600 mt-2">عملاء عائدون</p>
            </div>

            <div className="text-center p-6 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{reportData.customers.customer_retention_rate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600 mt-2">معدل الاحتفاظ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الإيرادات الشهرية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            الإيرادات الشهرية
          </CardTitle>
          <CardDescription>تطور الإيرادات والطلبات عبر الأشهر</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.sales.monthly_revenue.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{month.month}</h4>
                    <p className="text-sm text-gray-500">{formatNumber(month.orders)} طلب</p>
                  </div>
                </div>

                <div className="text-left">
                  <p className="font-bold text-green-600 text-lg">{formatCurrency(month.revenue)}</p>
                  <p className="text-sm text-gray-500">إيرادات الشهر</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewReports;
