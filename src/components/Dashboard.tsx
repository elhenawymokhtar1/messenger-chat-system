/**
 * 📊 مكون Dashboard مساعد
 * تم إنشاؤه تلقائياً بواسطة Page Fixer
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Building 
} from 'lucide-react';

interface DashboardProps {
  title?: string;
  description?: string;
  stats?: {
    totalUsers?: number;
    totalMessages?: number;
    totalCompanies?: number;
    growth?: number;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ 
  title = "لوحة التحكم",
  description = "نظرة عامة على الإحصائيات",
  stats = {}
}) => {
  const {
    totalUsers = 0,
    totalMessages = 0,
    totalCompanies = 0,
    growth = 0
  } = stats;

  return (
    <div className="space-y-6" role="main" aria-label="لوحة التحكم الرئيسية">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{growth}% من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(growth * 1.2)}% من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الشركات النشطة</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompanies.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(growth * 0.8)}% من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النمو</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{growth}%</div>
            <Progress value={growth} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>النشاط الأخير</CardTitle>
          <CardDescription>آخر الأنشطة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">تم إضافة شركة جديدة</p>
                <p className="text-xs text-muted-foreground">منذ 5 دقائق</p>
              </div>
              <Badge variant="secondary">جديد</Badge>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">تم إرسال 50 رسالة</p>
                <p className="text-xs text-muted-foreground">منذ 15 دقيقة</p>
              </div>
              <Badge variant="outline">رسائل</Badge>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">تحديث إعدادات النظام</p>
                <p className="text-xs text-muted-foreground">منذ ساعة</p>
              </div>
              <Badge variant="secondary">إعدادات</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;