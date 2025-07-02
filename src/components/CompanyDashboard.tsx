/**
 * 🏢 مكون لوحة تحكم الشركة
 * تم إنشاؤه تلقائياً بواسطة Remaining Issues Fixer
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Settings,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface CompanyStats {
  totalMessages: number;
  activeUsers: number;
  monthlyGrowth: number;
  revenue: number;
  satisfaction: number;
}

interface CompanyDashboardProps {
  companyId?: string;
  companyName?: string;
  className?: string;
}

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ 
  companyId = "default",
  companyName = "شركتي",
  className = ""
}) => {
  const [stats, setStats] = useState<CompanyStats>({
    totalMessages: 0,
    activeUsers: 0,
    monthlyGrowth: 0,
    revenue: 0,
    satisfaction: 0
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyStats();
  }, [companyId]);

  const loadCompanyStats = async () => {
    try {
      setLoading(true);
      
      // محاكاة تحميل البيانات
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // بيانات تجريبية
      setStats({
        totalMessages: Math.floor(Math.random() * 10000) + 1000,
        activeUsers: Math.floor(Math.random() * 500) + 100,
        monthlyGrowth: Math.floor(Math.random() * 30) + 5,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        satisfaction: Math.floor(Math.random() * 30) + 70
      });
      
    } catch (error) {
      console.error('خطأ في تحميل إحصائيات الشركة:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`} role="status" aria-label="جاري التحميل">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="main"></div>
        <span className="sr-only">جاري تحميل بيانات الشركة...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} role="region" aria-label={`لوحة تحكم ${companyName}`}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">لوحة تحكم {companyName}</h2>
        <p className="text-muted-foreground">نظرة عامة على أداء الشركة والإحصائيات</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" aria-label={`${stats.totalMessages.toLocaleString()} رسالة`}>
              {stats.totalMessages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.monthlyGrowth}% من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" aria-label={`${stats.activeUsers.toLocaleString()} مستخدم نشط`}>
              {stats.activeUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(stats.monthlyGrowth * 0.8)}% من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" aria-label={`${stats.revenue.toLocaleString()} ريال`}>
              {stats.revenue.toLocaleString()} ر.س
            </div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(stats.monthlyGrowth * 1.2)}% من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">رضا العملاء</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" aria-label={`${stats.satisfaction}% رضا العملاء`}>
              {stats.satisfaction}%
            </div>
            <Progress value={stats.satisfaction} className="mt-2" aria-label="مستوى رضا العملاء" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
              الأداء الشهري
            </CardTitle>
            <CardDescription>إحصائيات الرسائل والمستخدمين</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">الرسائل المرسلة</span>
                <span className="font-medium">{stats.totalMessages.toLocaleString()}</span>
              </div>
              <Progress value={(stats.totalMessages / 15000) * 100} />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">المستخدمون النشطون</span>
                <span className="font-medium">{stats.activeUsers.toLocaleString()}</span>
              </div>
              <Progress value={(stats.activeUsers / 1000) * 100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" aria-hidden="true" />
              توزيع الاستخدام
            </CardTitle>
            <CardDescription>أنواع الرسائل والقنوات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Facebook</span>
                </div>
                <span className="font-medium">65%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">WhatsApp</span>
                </div>
                <span className="font-medium">35%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" aria-hidden="true" />
            إجراءات سريعة
          </CardTitle>
          <CardDescription>الإجراءات الأكثر استخداماً</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Button variant="outline" className="justify-start" aria-label="عرض الرسائل">
              <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
              عرض الرسائل
            </Button>
            <Button variant="outline" className="justify-start" aria-label="إدارة المستخدمين">
              <Users className="h-4 w-4 mr-2" aria-hidden="true" />
              إدارة المستخدمين
            </Button>
            <Button variant="outline" className="justify-start" aria-label="التقارير والإحصائيات">
              <Activity className="h-4 w-4 mr-2" aria-hidden="true" />
              التقارير
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDashboard;