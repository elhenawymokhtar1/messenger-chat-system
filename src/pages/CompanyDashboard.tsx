/**
 * 📊 لوحة تحكم الشركة
 * تاريخ الإنشاء: 22 يونيو 2025
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SubscriptionNotifications from '@/components/SubscriptionNotifications';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  MessageSquare, 
  Image, 
  Package, 
  Users, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { SubscriptionService, Company, CompanySubscription, UsageStats } from '@/services/subscriptionService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';

const CompanyDashboard: React.FC = () => {
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();
  const navigate = useNavigate();

  // استخدام نظام المصادقة الموحد
  const { company, loading: companyLoading, clearCompany, reloadCompany } = useCurrentCompany();

  useEffect(() => {
    loadDashboardData();
  }, [company]);

  // إعادة توجيه إذا لم توجد شركة
  useEffect(() => {
    if (!companyLoading && !company) {
      console.log('⚠️ لا توجد شركة حالية، محاولة إعادة تحميل البيانات...');
      reloadCompany();

      // localStorage معطل - استخدام شركة kok@kok.com الثابتة
      console.log('🔧 [DASHBOARD] localStorage معطل - استخدام شركة kok@kok.com الثابتة');
    }
  }, [company, companyLoading, navigate, reloadCompany]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // التحقق من وجود شركة حالية
      if (!company) {
        console.log('⚠️ [loadDashboardData] لا توجد شركة حالية، تخطي تحميل البيانات');
        setLoading(false);
        return;
      }

      console.log('🏢 تحميل بيانات لوحة التحكم للشركة:', company.name);

      // بيانات تجريبية للاشتراك
      const mockSubscription: CompanySubscription = {
        id: 'sub-123',
        company_id: company.id,
        plan_id: 'basic',
        billing_cycle: 'monthly',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 يوم من الآن
        amount: 29,
        currency: 'USD',
        status: 'active',
        auto_renew: true,
        plan: {
          id: 'basic',
          name: 'Basic',
          name_ar: 'الأساسي',
          description: 'Great for growing businesses',
          description_ar: 'رائع للشركات النامية',
          monthly_price: 29,
          yearly_price: 290,
          max_products: 50,
          max_messages_per_month: 1000,
          max_images: 200,
          max_active_conversations: 25,
          max_users: 3,
          features: {
            ai_responses: true,
            image_sending: true,
            basic_analytics: true,
            api_access: false,
            priority_support: false,
            unlimited: false
          },
          display_order: 2
        }
      };

      // بيانات تجريبية للاستخدام
      const mockUsage: UsageStats = {
        messages_sent: 245,
        images_sent: 67,
        products_count: 23,
        active_conversations: 12,
        api_calls: 0,
        storage_used: 1.2
      };

      setSubscription(mockSubscription);
      setUsage(mockUsage);

    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات لوحة التحكم",
        variant: "destructive"});
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearCompany();
    navigate('/company-login');
    toast({
      title: "تم تسجيل الخروج",
      description: "نراك قريباً!"});
  };

  // تحميل البيانات عندما تصبح الشركة متاحة
  useEffect(() => {
    if (company && !companyLoading) {
      console.log('🏢 [useEffect] الشركة متاحة، تحميل بيانات لوحة التحكم...');
      loadDashboardData();
    }
  }, [company, companyLoading]);

  const getUsagePercentage = (current: number, limit: number): number => {
    if (limit === -1) return 0; // غير محدود
    if (limit === 0) return 100;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatLimit = (limit: number): string => {
    if (limit === -1) return 'غير محدود';
    if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`;
    return limit.toString();
  };

  const getDaysUntilRenewal = (): number => {
    if (!subscription) return 0;
    const endDate = new Date(subscription.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="main">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (!company || !subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">خطأ في تحميل البيانات</h2>
            <p className="text-gray-600 mb-4">لم نتمكن من تحميل بيانات شركتك</p>
            <Button onClick={() => navigate('/company-login')}>
              العودة لتسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysUntilRenewal = getDaysUntilRenewal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط التنقل العلوي */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{company.name}</h1>
                <p className="text-sm text-gray-500">{company.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                {subscription.plan?.name_ar}
              </Badge>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                الإعدادات
              </Button>

              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* إشعارات الاشتراك */}
        {company?.id && (
          <SubscriptionNotifications companyId={company.id} />
        )}

        {/* تنبيه انتهاء الاشتراك */}
        {daysUntilRenewal <= 7 && daysUntilRenewal > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">
                سينتهي اشتراكك خلال {daysUntilRenewal} أيام. 
                <Button variant="link" className="p-0 h-auto text-yellow-800 underline mr-1">
                  جدد الآن
                </Button>
              </p>
            </div>
          </div>
        )}

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* الرسائل */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">الرسائل هذا الشهر</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usage?.messages_sent || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    من {formatLimit(subscription.plan?.max_messages_per_month || 0)}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              {subscription.plan?.max_messages_per_month !== -1 && (
                <div className="mt-4">
                  <Progress 
                    value={getUsagePercentage(usage?.messages_sent || 0, subscription.plan?.max_messages_per_month || 0)}
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* الصور */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">الصور المرسلة</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usage?.images_sent || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    من {formatLimit(subscription.plan?.max_images || 0)}
                  </p>
                </div>
                <Image className="h-8 w-8 text-green-600" />
              </div>
              {subscription.plan?.max_images !== -1 && (
                <div className="mt-4">
                  <Progress 
                    value={getUsagePercentage(usage?.images_sent || 0, subscription.plan?.max_images || 0)}
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* المنتجات */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">المنتجات</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usage?.products_count || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    من {formatLimit(subscription.plan?.max_products || 0)}
                  </p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
              {subscription.plan?.max_products !== -1 && (
                <div className="mt-4">
                  <Progress 
                    value={getUsagePercentage(usage?.products_count || 0, subscription.plan?.max_products || 0)}
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* المحادثات النشطة */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">المحادثات النشطة</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usage?.active_conversations || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    من {formatLimit(subscription.plan?.max_active_conversations || 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              {subscription.plan?.max_active_conversations !== -1 && (
                <div className="mt-4">
                  <Progress 
                    value={getUsagePercentage(usage?.active_conversations || 0, subscription.plan?.max_active_conversations || 0)}
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* معلومات الاشتراك */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2" />
                تفاصيل الاشتراك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الخطة الحالية:</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {subscription.plan?.name_ar}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">نوع الفوترة:</span>
                <span className="font-semibold">
                  {subscription.billing_cycle === 'monthly' ? 'شهري' : 'سنوي'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">المبلغ:</span>
                <span className="font-semibold">
                  ${subscription.amount} {subscription.currency}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">تاريخ التجديد:</span>
                <span className="font-semibold">
                  {new Date(subscription.end_date).toLocaleDateString('ar-EG')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">التجديد التلقائي:</span>
                <Badge variant={subscription.auto_renew ? 'default' : 'secondary'}>
                  {subscription.auto_renew ? 'مفعل' : 'معطل'}
                </Badge>
              </div>

              <div className="pt-4 border-t">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate('/upgrade-plan')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  ترقية الخطة
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* إجراءات سريعة */}
          <Card>
            <CardHeader>
              <CardTitle>إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate('/user-management')}
              >
                <Users className="h-4 w-4 mr-2" />
                إدارة المستخدمين
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={() => navigate('/subscription-management')}
              >
                <Crown className="h-4 w-4 mr-2" />
                إدارة الاشتراك
              </Button>

              <Button className="w-full" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                إدارة الرسائل
              </Button>

              <Button className="w-full" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                إدارة المنتجات
              </Button>

              <Button className="w-full" variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                التقارير والإحصائيات
              </Button>
              
              <Button className="w-full" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                إعدادات الحساب
              </Button>
              
              <Button className="w-full" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                سجل الفواتير
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
