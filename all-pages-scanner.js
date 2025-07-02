/**
 * 🔍 فاحص جميع صفحات الموقع
 * يفحص كل صفحة ويكتشف المشاكل
 */

import fs from 'fs';
import path from 'path';

class AllPagesScanner {
  constructor() {
    this.pages = [];
    this.totalIssues = 0;
    this.totalPages = 0;
    this.scanResults = {};
    this.startTime = Date.now();
  }

  log(level, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const emoji = {
      'info': 'ℹ️',
      'scan': '🔍',
      'pass': '✅',
      'fail': '❌',
      'warn': '⚠️',
      'summary': '📊'
    }[level] || '📝';
    
    console.log(`${emoji} [${timestamp}] ${message}`);
    if (details) {
      console.log(`   📋 التفاصيل: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async scanAllPages() {
    console.log('🔍 بدء فحص جميع صفحات الموقع...\n');
    this.log('info', 'بدء الفحص الشامل لجميع الصفحات');

    // 1. اكتشاف جميع الصفحات
    await this.discoverAllPages();
    
    // 2. فحص كل صفحة
    await this.scanEachPage();
    
    // 3. فحص التوجيه العام
    await this.scanRouting();
    
    // 4. فحص الملفات المشتركة
    await this.scanSharedFiles();

    this.generateComprehensiveReport();
  }

  async discoverAllPages() {
    this.log('scan', 'اكتشاف جميع الصفحات...');
    
    // البحث في مجلد pages
    const pagesDir = 'src/pages';
    if (fs.existsSync(pagesDir)) {
      const pageFiles = fs.readdirSync(pagesDir).filter(file => 
        file.endsWith('.tsx') || file.endsWith('.ts')
      );
      
      pageFiles.forEach(file => {
        const pageName = file.replace(/\.(tsx|ts)$/, '');
        this.pages.push({
          name: pageName,
          path: path.join(pagesDir, file),
          type: 'page',
          route: this.guessRoute(pageName)
        });
      });
    }
    
    // البحث في مجلد components للصفحات
    const componentsDir = 'src/components';
    if (fs.existsSync(componentsDir)) {
      const componentFiles = fs.readdirSync(componentsDir).filter(file => 
        file.endsWith('.tsx') && (
          file.includes('Page') || 
          file.includes('Dashboard') ||
          file.includes('Home') ||
          file.includes('Login') ||
          file.includes('Register')
        )
      );
      
      componentFiles.forEach(file => {
        const componentName = file.replace(/\.(tsx|ts)$/, '');
        this.pages.push({
          name: componentName,
          path: path.join(componentsDir, file),
          type: 'component-page',
          route: this.guessRoute(componentName)
        });
      });
    }
    
    this.totalPages = this.pages.length;
    this.log('info', `تم اكتشاف ${this.totalPages} صفحة`, {
      pages: this.pages.map(p => p.name)
    });
  }

  guessRoute(pageName) {
    const routeMap = {
      'Home': '/',
      'SimpleHome': '/',
      'Login': '/login',
      'Register': '/register',
      'CompanyDashboard': '/company-dashboard',
      'Dashboard': '/dashboard',
      'Messages': '/messages',
      'Analytics': '/analytics',
      'Settings': '/settings',
      'Profile': '/profile',
      'Companies': '/companies',
      'Users': '/users'
    };
    
    return routeMap[pageName] || `/${pageName.toLowerCase()}`;
  }

  async scanEachPage() {
    this.log('scan', 'فحص كل صفحة بالتفصيل...');
    
    for (const page of this.pages) {
      this.log('scan', `فحص الصفحة: ${page.name}`);
      
      const pageResult = {
        name: page.name,
        path: page.path,
        route: page.route,
        type: page.type,
        issues: [],
        score: 0,
        status: 'unknown'
      };
      
      try {
        if (!fs.existsSync(page.path)) {
          pageResult.issues.push('الملف غير موجود');
          pageResult.status = 'missing';
          this.log('fail', `الصفحة مفقودة: ${page.name}`);
        } else {
          const content = fs.readFileSync(page.path, 'utf8');
          
          // فحص بنية الصفحة
          await this.checkPageStructure(content, pageResult);
          
          // فحص React/TypeScript
          await this.checkReactTypeScript(content, pageResult);
          
          // فحص إمكانية الوصول
          await this.checkAccessibility(content, pageResult);
          
          // فحص الأداء
          await this.checkPerformance(page.path, content, pageResult);
          
          // فحص الأمان
          await this.checkSecurity(content, pageResult);
          
          // حساب النتيجة
          this.calculatePageScore(pageResult);
        }
        
      } catch (error) {
        pageResult.issues.push(`خطأ في الفحص: ${error.message}`);
        pageResult.status = 'error';
        this.log('fail', `خطأ في فحص ${page.name}`, { error: error.message });
      }
      
      this.scanResults[page.name] = pageResult;
      this.totalIssues += pageResult.issues.length;
      
      // عرض نتيجة سريعة
      if (pageResult.issues.length === 0) {
        this.log('pass', `${page.name}: لا توجد مشاكل (${pageResult.score}/100)`);
      } else {
        this.log('warn', `${page.name}: ${pageResult.issues.length} مشاكل (${pageResult.score}/100)`);
      }
    }
  }

  async checkPageStructure(content, pageResult) {
    // فحص export
    if (!content.includes('export default') && !content.includes('export {')) {
      pageResult.issues.push('لا يوجد export للمكون');
    }
    
    // فحص React component
    if (!content.includes('function') && !content.includes('const') && !content.includes('class')) {
      pageResult.issues.push('بنية المكون غير صحيحة');
    }
    
    // فحص JSX return
    if (!content.includes('return') || !content.includes('<')) {
      pageResult.issues.push('لا يوجد JSX return');
    }
  }

  async checkReactTypeScript(content, pageResult) {
    // فحص React imports
    if (!content.includes('import React') && !content.includes('import {')) {
      pageResult.issues.push('React imports مفقودة');
    }
    
    // فحص TypeScript
    if (content.includes('any') && content.match(/:\s*any/g)?.length > 2) {
      pageResult.issues.push('استخدام مفرط لـ any في TypeScript');
    }
    
    // فحص hooks usage
    if (content.includes('useState') && !content.includes('import { useState')) {
      pageResult.issues.push('useState مستخدم بدون import');
    }
    
    if (content.includes('useEffect') && !content.includes('import { useEffect')) {
      pageResult.issues.push('useEffect مستخدم بدون import');
    }
  }

  async checkAccessibility(content, pageResult) {
    // فحص aria-label
    if (content.includes('<button') && !content.includes('aria-label')) {
      pageResult.issues.push('أزرار بدون aria-label');
    }
    
    // فحص semantic HTML
    if (!content.includes('<main>') && !content.includes('role="main"')) {
      pageResult.issues.push('لا يوجد main element');
    }
    
    // فحص alt text للصور
    if (content.includes('<img') && !content.includes('alt=')) {
      pageResult.issues.push('صور بدون alt text');
    }
  }

  async checkPerformance(filePath, content, pageResult) {
    // فحص حجم الملف
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;
    
    if (sizeKB > 100) {
      pageResult.issues.push(`ملف كبير: ${sizeKB.toFixed(1)}KB`);
    }
    
    // فحص console.log
    const consoleLogs = content.match(/console\.log\(/g);
    if (consoleLogs && consoleLogs.length > 3) {
      pageResult.issues.push(`${consoleLogs.length} console.log statements`);
    }
    
    // فحص inline styles
    if (content.includes('style={{') && content.match(/style=\{\{/g)?.length > 5) {
      pageResult.issues.push('استخدام مفرط للـ inline styles');
    }
  }

  async checkSecurity(content, pageResult) {
    // فحص dangerouslySetInnerHTML
    if (content.includes('dangerouslySetInnerHTML')) {
      pageResult.issues.push('استخدام dangerouslySetInnerHTML (مخاطر أمنية)');
    }
    
    // فحص eval
    if (content.includes('eval(')) {
      pageResult.issues.push('استخدام eval() (مخاطر أمنية)');
    }
    
    // فحص localStorage بدون تشفير
    if (content.includes('localStorage.setItem') && !content.includes('encrypt')) {
      pageResult.issues.push('استخدام localStorage بدون تشفير');
    }
  }

  calculatePageScore(pageResult) {
    let score = 100;
    
    // خصم نقاط حسب نوع المشكلة
    pageResult.issues.forEach(issue => {
      if (issue.includes('مفقود') || issue.includes('غير موجود')) {
        score -= 20;
      } else if (issue.includes('أمنية')) {
        score -= 15;
      } else if (issue.includes('كبير') || issue.includes('console.log')) {
        score -= 10;
      } else {
        score -= 5;
      }
    });
    
    pageResult.score = Math.max(score, 0);
    
    if (pageResult.score >= 90) {
      pageResult.status = 'excellent';
    } else if (pageResult.score >= 70) {
      pageResult.status = 'good';
    } else if (pageResult.score >= 50) {
      pageResult.status = 'fair';
    } else {
      pageResult.status = 'poor';
    }
  }

  async scanRouting() {
    this.log('scan', 'فحص نظام التوجيه...');
    
    const appPath = 'src/App.tsx';
    if (!fs.existsSync(appPath)) {
      this.log('fail', 'ملف App.tsx مفقود');
      return;
    }
    
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    // فحص React Router
    if (!appContent.includes('BrowserRouter') && !appContent.includes('Router')) {
      this.log('warn', 'React Router غير مستخدم');
    }
    
    // فحص Routes
    if (!appContent.includes('Routes') && !appContent.includes('Switch')) {
      this.log('warn', 'لا توجد Routes مُعرفة');
    }
    
    // فحص 404 page
    if (!appContent.includes('404') && !appContent.includes('NotFound')) {
      this.log('warn', 'لا توجد صفحة 404');
    }
  }

  async scanSharedFiles() {
    this.log('scan', 'فحص الملفات المشتركة...');
    
    const sharedFiles = [
      { path: 'src/App.tsx', name: 'App الرئيسي' },
      { path: 'src/main.tsx', name: 'Entry Point' },
      { path: 'src/index.css', name: 'Styles الرئيسية' },
      { path: 'package.json', name: 'Package Configuration' },
      { path: 'tsconfig.json', name: 'TypeScript Configuration' },
      { path: '.env', name: 'Environment Variables' }
    ];
    
    sharedFiles.forEach(file => {
      if (fs.existsSync(file.path)) {
        this.log('pass', `${file.name}: موجود`);
      } else {
        this.log('fail', `${file.name}: مفقود`);
      }
    });
  }

  generateComprehensiveReport() {
    const duration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('🔍 تقرير فحص جميع صفحات الموقع');
    console.log('='.repeat(80));
    
    console.log(`\n📊 الإحصائيات العامة:`);
    console.log(`  📄 إجمالي الصفحات: ${this.totalPages}`);
    console.log(`  ❌ إجمالي المشاكل: ${this.totalIssues}`);
    console.log(`  ⏱️ وقت الفحص: ${duration}ms`);
    
    // تجميع النتائج حسب الحالة
    const statusCounts = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      missing: 0,
      error: 0
    };
    
    Object.values(this.scanResults).forEach(result => {
      statusCounts[result.status]++;
    });
    
    console.log(`\n📈 توزيع الصفحات حسب الحالة:`);
    console.log(`  🎉 ممتاز (90-100): ${statusCounts.excellent} صفحات`);
    console.log(`  👍 جيد (70-89): ${statusCounts.good} صفحات`);
    console.log(`  ⚠️ متوسط (50-69): ${statusCounts.fair} صفحات`);
    console.log(`  🚨 ضعيف (0-49): ${statusCounts.poor} صفحات`);
    console.log(`  ❌ مفقود: ${statusCounts.missing} صفحات`);
    console.log(`  💥 خطأ: ${statusCounts.error} صفحات`);
    
    console.log(`\n📋 تفاصيل كل صفحة:`);
    Object.entries(this.scanResults).forEach(([name, result]) => {
      const statusEmoji = {
        excellent: '🎉',
        good: '👍',
        fair: '⚠️',
        poor: '🚨',
        missing: '❌',
        error: '💥'
      }[result.status] || '❓';
      
      console.log(`  ${statusEmoji} ${name} (${result.score}/100) - ${result.route}`);
      
      if (result.issues.length > 0) {
        result.issues.slice(0, 3).forEach(issue => {
          console.log(`    • ${issue}`);
        });
        if (result.issues.length > 3) {
          console.log(`    ... و ${result.issues.length - 3} مشاكل أخرى`);
        }
      }
    });
    
    // أكثر المشاكل شيوعاً
    const allIssues = Object.values(this.scanResults).flatMap(r => r.issues);
    const issueFrequency = {};
    allIssues.forEach(issue => {
      const key = issue.split(':')[0]; // أخذ الجزء الأول من المشكلة
      issueFrequency[key] = (issueFrequency[key] || 0) + 1;
    });
    
    const topIssues = Object.entries(issueFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    if (topIssues.length > 0) {
      console.log(`\n🔍 أكثر المشاكل شيوعاً:`);
      topIssues.forEach(([issue, count]) => {
        console.log(`  • ${issue}: ${count} مرة`);
      });
    }
    
    // التوصيات
    console.log(`\n💡 التوصيات:`);
    if (this.totalIssues === 0) {
      console.log('  🎉 ممتاز! جميع الصفحات تعمل بشكل مثالي');
    } else if (this.totalIssues < 10) {
      console.log('  👍 الوضع جيد، مشاكل قليلة فقط');
      console.log('  🔧 يُنصح بإصلاح المشاكل المتبقية');
    } else {
      console.log('  ⚠️ يوجد عدد من المشاكل تحتاج إصلاح');
      console.log('  🚨 ابدأ بالصفحات ذات النتائج المنخفضة');
    }
    
    // حفظ التقرير
    const reportPath = `test-reports/all-pages-scan-${Date.now()}.json`;
    try {
      if (!fs.existsSync('test-reports')) {
        fs.mkdirSync('test-reports', { recursive: true });
      }
      
      const report = {
        summary: {
          totalPages: this.totalPages,
          totalIssues: this.totalIssues,
          duration,
          statusCounts
        },
        pages: this.scanResults,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 تم حفظ التقرير المفصل في: ${reportPath}`);
    } catch (error) {
      console.log(`\n❌ فشل حفظ التقرير: ${error.message}`);
    }
    
    console.log(`\n🔍 فحص جميع الصفحات اكتمل!`);
  }
}

// تشغيل فحص جميع الصفحات
const scanner = new AllPagesScanner();
scanner.scanAllPages().catch(error => {
  console.error('💥 خطأ في فحص الصفحات:', error);
  process.exit(1);
});
