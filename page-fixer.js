/**
 * 🔧 مصلح مشاكل الصفحات
 * يصلح المشاكل المكتشفة في الصفحات
 */

import fs from 'fs';

class PageFixer {
  constructor() {
    this.fixes = [];
    this.issues = [];
  }

  log(level, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const emoji = {
      'info': 'ℹ️',
      'fix': '🔧',
      'success': '✅',
      'fail': '❌',
      'warn': '⚠️'
    }[level] || '📝';
    
    console.log(`${emoji} [${timestamp}] ${message}`);
    if (details) {
      console.log(`   📋 التفاصيل: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async fixCompanyDashboardPage() {
    console.log('🔧 بدء إصلاح مشاكل صفحة company-dashboard...\n');
    this.log('info', 'بدء إصلاح مشاكل الصفحة');

    // 1. إضافة route للصفحة في App.tsx
    await this.addRouteToApp();
    
    // 2. إنشاء مكون Dashboard مساعد
    await this.createDashboardComponent();
    
    // 3. تحسين الأداء بـ lazy loading
    await this.addLazyLoading();
    
    // 4. تحسين إمكانية الوصول
    await this.improveAccessibility();

    this.generateReport();
  }

  async addRouteToApp() {
    this.log('fix', 'إضافة route للصفحة في App.tsx...');
    
    try {
      const appPath = 'src/App.tsx';
      
      if (!fs.existsSync(appPath)) {
        this.log('fail', 'ملف App.tsx غير موجود');
        return;
      }
      
      let content = fs.readFileSync(appPath, 'utf8');
      
      // التحقق من وجود route للصفحة
      if (content.includes('company-dashboard') || content.includes('CompanyDashboard')) {
        this.log('info', 'Route موجود بالفعل');
        return;
      }
      
      // إضافة import للصفحة
      if (!content.includes('import CompanyDashboard')) {
        const importLine = 'import CompanyDashboard from "./pages/CompanyDashboard";';
        content = content.replace(
          'import SimpleHome from "./pages/SimpleHome";',
          `import SimpleHome from "./pages/SimpleHome";\n${importLine}`
        );
        this.log('fix', 'تم إضافة import للصفحة');
      }
      
      // إضافة route للصفحة
      const routeCode = `
            <Route path="/company-dashboard" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <CompanyDashboard />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
`;
      
      content = content.replace(
        '            {/* صفحة 404 */}',
        `${routeCode}
            {/* صفحة 404 */}`
      );
      
      // حفظ الملف
      fs.writeFileSync(appPath, content);
      
      this.fixes.push('✅ تم إضافة route للصفحة في App.tsx');
      this.log('success', 'تم إضافة route للصفحة بنجاح');
      
    } catch (error) {
      this.issues.push(`❌ فشل إضافة route: ${error.message}`);
      this.log('fail', 'فشل إضافة route', { error: error.message });
    }
  }

  async createDashboardComponent() {
    this.log('fix', 'إنشاء مكون Dashboard مساعد...');
    
    const componentPath = 'src/components/Dashboard.tsx';
    
    if (fs.existsSync(componentPath)) {
      this.log('info', 'مكون Dashboard موجود بالفعل');
      return;
    }
    
    const dashboardComponent = `/**
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

export default Dashboard;`;

    try {
      fs.writeFileSync(componentPath, dashboardComponent);
      this.fixes.push('✅ تم إنشاء مكون Dashboard مساعد');
      this.log('success', 'تم إنشاء مكون Dashboard بنجاح');
    } catch (error) {
      this.issues.push(`❌ فشل إنشاء مكون Dashboard: ${error.message}`);
      this.log('fail', 'فشل إنشاء مكون Dashboard', { error: error.message });
    }
  }

  async addLazyLoading() {
    this.log('fix', 'إضافة lazy loading للأداء...');
    
    try {
      const appPath = 'src/App.tsx';
      let content = fs.readFileSync(appPath, 'utf8');
      
      // التحقق من وجود lazy loading
      if (content.includes('React.lazy') || content.includes('Suspense')) {
        this.log('info', 'Lazy loading موجود بالفعل');
        return;
      }
      
      // إضافة imports للـ lazy loading
      content = content.replace(
        'import React, { useEffect } from \'react\';',
        'import React, { useEffect, Suspense } from \'react\';'
      );
      
      // تحويل import العادي إلى lazy
      content = content.replace(
        'import CompanyDashboard from "./pages/CompanyDashboard";',
        'const CompanyDashboard = React.lazy(() => import("./pages/CompanyDashboard"));'
      );
      
      // إضافة Suspense wrapper
      content = content.replace(
        '<CompanyDashboard />',
        `<Suspense fallback={<div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>}>
                    <CompanyDashboard />
                  </Suspense>`
      );
      
      fs.writeFileSync(appPath, content);
      this.fixes.push('✅ تم إضافة lazy loading للأداء');
      this.log('success', 'تم إضافة lazy loading بنجاح');
      
    } catch (error) {
      this.issues.push(`❌ فشل إضافة lazy loading: ${error.message}`);
      this.log('fail', 'فشل إضافة lazy loading', { error: error.message });
    }
  }

  async improveAccessibility() {
    this.log('fix', 'تحسين إمكانية الوصول...');
    
    try {
      const pagePath = 'src/pages/CompanyDashboard.tsx';
      
      if (!fs.existsSync(pagePath)) {
        this.log('warn', 'ملف الصفحة غير موجود');
        return;
      }
      
      let content = fs.readFileSync(pagePath, 'utf8');
      
      // إضافة aria-label للعناصر الرئيسية
      if (!content.includes('aria-label')) {
        // البحث عن div الرئيسي وإضافة aria-label
        content = content.replace(
          '<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">',
          '<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" role="main" aria-label="لوحة تحكم الشركة">'
        );
        
        this.fixes.push('✅ تم تحسين إمكانية الوصول');
        this.log('success', 'تم تحسين إمكانية الوصول');
        
        fs.writeFileSync(pagePath, content);
      } else {
        this.log('info', 'إمكانية الوصول محسنة بالفعل');
      }
      
    } catch (error) {
      this.issues.push(`❌ فشل تحسين إمكانية الوصول: ${error.message}`);
      this.log('fail', 'فشل تحسين إمكانية الوصول', { error: error.message });
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 تقرير إصلاح مشاكل الصفحة');
    console.log('='.repeat(80));
    
    console.log(`\n✅ الإصلاحات المنجزة (${this.fixes.length}):`);
    this.fixes.forEach(fix => console.log(`  ${fix}`));
    
    if (this.issues.length > 0) {
      console.log(`\n❌ المشاكل المتبقية (${this.issues.length}):`);
      this.issues.forEach(issue => console.log(`  ${issue}`));
    }
    
    console.log(`\n🎯 النتيجة:`);
    if (this.fixes.length > 0 && this.issues.length === 0) {
      console.log('  🎉 تم إصلاح جميع المشاكل بنجاح!');
    } else if (this.fixes.length > 0) {
      console.log(`  👍 تم إصلاح ${this.fixes.length} مشاكل، ${this.issues.length} مشاكل متبقية`);
    } else {
      console.log('  ⚠️ لم يتم إصلاح أي مشاكل');
    }
    
    console.log('\n💡 التوصيات:');
    console.log('  • تشغيل الخادم: npm run dev');
    console.log('  • زيارة الصفحة: http://localhost:8080/company-dashboard');
    console.log('  • إعادة اختبار الصفحة: node page-specific-tester.js');
    
    console.log('\n🔧 إصلاح الصفحة اكتمل!');
  }
}

// تشغيل إصلاح الصفحة
const fixer = new PageFixer();
fixer.fixCompanyDashboardPage().catch(error => {
  console.error('💥 خطأ في إصلاح الصفحة:', error);
  process.exit(1);
});
