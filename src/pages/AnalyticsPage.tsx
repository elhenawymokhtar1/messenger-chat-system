import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Send, 
  Reply,
  Calendar,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  success: boolean;
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_customers_contacted: number;
    total_customers_replied: number;
    total_outgoing_messages: number;
    total_incoming_messages: number;
    response_rate: string;
    active_pages: number;
  };
  pages: Record<string, {
    page_name: string;
    customers_contacted: number;
    customers_replied: number;
    total_outgoing: number;
    total_incoming: number;
    response_rate: string;
  }>;
  hourly_distribution: Array<{
    hour: number;
    incoming_count: number;
    outgoing_count: number;
  }>;
  top_customers: Array<{
    user_id: string;
    user_name: string;
    facebook_page_id: string;
    total_messages: number;
    customer_messages: number;
    company_messages: number;
    last_message_at: string;
  }>;
  comparison?: {
    period: {
      start_date: string;
      end_date: string;
    };
    summary: {
      total_customers_contacted: number;
      total_customers_replied: number;
      total_outgoing_messages: number;
      total_incoming_messages: number;
      response_rate: string;
    };
    changes: {
      customers_contacted_change: string;
      customers_replied_change: string;
      response_rate_change: string;
    };
  };
}

const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // فلاتر التاريخ
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareStartDate, setCompareStartDate] = useState('');
  const [compareEndDate, setCompareEndDate] = useState('');

  // جلب البيانات
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        company_id: COMPANY_ID,
        start_date: startDate,
        end_date: endDate,
      });

      if (selectedPage !== 'all') {
        params.append('page_id', selectedPage);
      }

      if (compareEnabled && compareStartDate && compareEndDate) {
        params.append('compare_start_date', compareStartDate);
        params.append('compare_end_date', compareEndDate);
      }

      const response = await fetch(`http://localhost:3002/api/analytics/performance?${params}`);
      
      if (!response.ok) {
        throw new Error(`خطأ في الخادم: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'خطأ في جلب البيانات');
      }

      setData(result);
    } catch (err) {
      console.error('خطأ في جلب التحليلات:', err);
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  // تحديث البيانات عند تغيير الفلاتر
  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, selectedPage, compareEnabled, compareStartDate, compareEndDate]);

  // تحديث تلقائي كل 5 دقائق
  useEffect(() => {
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // فلاتر سريعة
  const setQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  // تفعيل المقارنة مع الفترة السابقة
  const enableComparison = () => {
    if (!compareEnabled) {
      const currentStart = new Date(startDate);
      const currentEnd = new Date(endDate);
      const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
      
      const compareEnd = new Date(currentStart);
      compareEnd.setDate(compareEnd.getDate() - 1);
      const compareStart = new Date(compareEnd);
      compareStart.setDate(compareStart.getDate() - daysDiff + 1);
      
      setCompareStartDate(compareStart.toISOString().split('T')[0]);
      setCompareEndDate(compareEnd.toISOString().split('T')[0]);
    }
    setCompareEnabled(!compareEnabled);
  };

  // مكون عرض الإحصائية
  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
  }> = ({ title, value, icon, change, changeType }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={`text-xs flex items-center mt-1 ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {changeType === 'positive' ? <TrendingUp className="w-3 h-3 mr-1" /> :
             changeType === 'negative' ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
            {change}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>جاري تحميل التحليلات...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">خطأ في تحميل البيانات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchAnalytics} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // تحضير بيانات الرسوم البيانية
  const pageChartData = Object.entries(data.pages).map(([pageId, pageData]) => ({
    name: pageData.page_name,
    contacted: pageData.customers_contacted,
    replied: pageData.customers_replied,
    response_rate: parseFloat(pageData.response_rate)
  }));

  const hourlyChartData = data.hourly_distribution.map(item => ({
    hour: `${item.hour}:00`,
    incoming: item.incoming_count,
    outgoing: item.outgoing_count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📊 تحليل أداء المحادثات</h1>
          <p className="text-gray-600">
            الفترة: {data.period.start_date} إلى {data.period.end_date}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            تحديث
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* فلاتر */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            فلاتر التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* فلاتر سريعة */}
            <div className="space-y-2">
              <label className="text-sm font-medium">فلاتر سريعة</label>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setQuickFilter(1)}>
                  اليوم
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuickFilter(7)}>
                  أسبوع
                </Button>
                <Button size="sm" variant="outline" onClick={() => setQuickFilter(30)}>
                  شهر
                </Button>
              </div>
            </div>

            {/* تاريخ البداية */}
            <div className="space-y-2">
              <label className="text-sm font-medium">من تاريخ</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* تاريخ النهاية */}
            <div className="space-y-2">
              <label className="text-sm font-medium">إلى تاريخ</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* اختيار الصفحة */}
            <div className="space-y-2">
              <label className="text-sm font-medium">الصفحة</label>
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصفحة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الصفحات</SelectItem>
                  {Object.entries(data.pages).map(([pageId, pageData]) => (
                    <SelectItem key={pageId} value={pageId}>
                      {pageData.page_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* مقارنة مع فترة سابقة */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center space-x-4">
              <Button
                variant={compareEnabled ? "default" : "outline"}
                onClick={enableComparison}
                size="sm"
              >
                مقارنة مع فترة سابقة
              </Button>
              
              {compareEnabled && (
                <div className="flex space-x-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">من</label>
                    <Input
                      type="date"
                      value={compareStartDate}
                      onChange={(e) => setCompareStartDate(e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">إلى</label>
                    <Input
                      type="date"
                      value={compareEndDate}
                      onChange={(e) => setCompareEndDate(e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="العملاء المراسلون"
          value={data.summary.total_customers_contacted}
          icon={<Users className="h-4 w-4 text-blue-600" />}
          change={data.comparison ? `${data.comparison.changes.customers_contacted_change}%` : undefined}
          changeType={data.comparison ? 
            (parseFloat(data.comparison.changes.customers_contacted_change) > 0 ? 'positive' : 
             parseFloat(data.comparison.changes.customers_contacted_change) < 0 ? 'negative' : 'neutral') : undefined}
        />
        
        <StatCard
          title="العملاء الذين ردوا"
          value={data.summary.total_customers_replied}
          icon={<Reply className="h-4 w-4 text-green-600" />}
          change={data.comparison ? `${data.comparison.changes.customers_replied_change}%` : undefined}
          changeType={data.comparison ? 
            (parseFloat(data.comparison.changes.customers_replied_change) > 0 ? 'positive' : 
             parseFloat(data.comparison.changes.customers_replied_change) < 0 ? 'negative' : 'neutral') : undefined}
        />
        
        <StatCard
          title="معدل الرد"
          value={`${data.summary.response_rate}%`}
          icon={<TrendingUp className="h-4 w-4 text-purple-600" />}
          change={data.comparison ? `${data.comparison.changes.response_rate_change}%` : undefined}
          changeType={data.comparison ? 
            (parseFloat(data.comparison.changes.response_rate_change) > 0 ? 'positive' : 
             parseFloat(data.comparison.changes.response_rate_change) < 0 ? 'negative' : 'neutral') : undefined}
        />
        
        <StatCard
          title="إجمالي الرسائل"
          value={data.summary.total_incoming_messages + data.summary.total_outgoing_messages}
          icon={<MessageSquare className="h-4 w-4 text-orange-600" />}
        />
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="pages">تفصيل الصفحات</TabsTrigger>
          <TabsTrigger value="customers">أفضل العملاء</TabsTrigger>
          <TabsTrigger value="timeline">التوزيع الزمني</TabsTrigger>
        </TabsList>

        {/* نظرة عامة */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* رسم بياني للصفحات */}
            <Card>
              <CardHeader>
                <CardTitle>أداء الصفحات</CardTitle>
                <CardDescription>مقارنة العملاء المراسلين والردود</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pageChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="contacted" fill="#8884d8" name="مراسلة" />
                    <Bar dataKey="replied" fill="#82ca9d" name="ردود" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* دائرة نسبية لمعدل الرد */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع معدل الرد</CardTitle>
                <CardDescription>حسب الصفحات</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pageChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, response_rate }) => `${name}: ${response_rate}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="response_rate"
                    >
                      {pageChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تفصيل الصفحات */}
        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>تفصيل أداء كل صفحة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-right">الصفحة</th>
                      <th className="border border-gray-300 p-3 text-center">عملاء مراسلون</th>
                      <th className="border border-gray-300 p-3 text-center">عملاء ردوا</th>
                      <th className="border border-gray-300 p-3 text-center">رسائل صادرة</th>
                      <th className="border border-gray-300 p-3 text-center">رسائل واردة</th>
                      <th className="border border-gray-300 p-3 text-center">معدل الرد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.pages).map(([pageId, pageData]) => (
                      <tr key={pageId} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3 font-medium">
                          {pageData.page_name}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {pageData.customers_contacted}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {pageData.customers_replied}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {pageData.total_outgoing}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          {pageData.total_incoming}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <Badge variant={parseFloat(pageData.response_rate) > 50 ? "default" : "secondary"}>
                            {pageData.response_rate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* أفضل العملاء */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>أفضل العملاء تفاعلاً</CardTitle>
              <CardDescription>العملاء الأكثر نشاطاً في المحادثات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.top_customers.map((customer, index) => (
                  <div key={customer.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{customer.user_name || 'عميل غير معروف'}</h3>
                        <p className="text-sm text-gray-600">
                          آخر رسالة: {new Date(customer.last_message_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{customer.total_messages}</div>
                      <div className="text-sm text-gray-600">
                        {customer.customer_messages} واردة • {customer.company_messages} صادرة
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التوزيع الزمني */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>التوزيع الزمني للرسائل</CardTitle>
              <CardDescription>نشاط الرسائل حسب ساعات اليوم</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={hourlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="incoming" stroke="#8884d8" name="رسائل واردة" />
                  <Line type="monotone" dataKey="outgoing" stroke="#82ca9d" name="رسائل صادرة" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* مقارنة مع الفترة السابقة */}
      {data.comparison && (
        <Card>
          <CardHeader>
            <CardTitle>مقارنة مع الفترة السابقة</CardTitle>
            <CardDescription>
              الفترة السابقة: {data.comparison.period.start_date} إلى {data.comparison.period.end_date}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {data.comparison.changes.customers_contacted_change}%
                </div>
                <div className="text-sm text-gray-600">تغيير في العملاء المراسلين</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {data.comparison.changes.customers_replied_change}%
                </div>
                <div className="text-sm text-gray-600">تغيير في العملاء الذين ردوا</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {data.comparison.changes.response_rate_change}%
                </div>
                <div className="text-sm text-gray-600">تغيير في معدل الرد</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;
