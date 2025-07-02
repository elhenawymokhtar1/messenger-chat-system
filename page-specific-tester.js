/**
 * 🔍 فاحص الصفحات المحدد
 * يفحص صفحة معينة بالتفصيل
 */

import fs from 'fs';
import { execSync } from 'child_process';

class PageSpecificTester {
  constructor(pageUrl) {
    this.pageUrl = pageUrl;
    this.testResults = {
      pageUrl: pageUrl,
      accessibility: { score: 0, issues: [] },
      performance: { score: 0, metrics: {} },
      security: { score: 0, issues: [] },
      functionality: { score: 0, issues: [] },
      routing: { score: 0, issues: [] },
      components: { score: 0, issues: [] },
      api: { score: 0, issues: [] },
      overall: { score: 0, status: 'unknown' }
    };
    this.startTime = Date.now();
  }

  log(level, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const emoji = {
      'info': 'ℹ️',
      'test': '🧪',
      'pass': '✅',
      'fail': '❌',
      'warn': '⚠️',
      'scan': '🔍'
    }[level] || '📝';
    
    console.log(`${emoji} [${timestamp}] ${message}`);
    if (details) {
      console.log(`   📋 التفاصيل: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async testPage() {
    console.log(`🔍 بدء فحص الصفحة: ${this.pageUrl}\n`);
    this.log('info', `فحص الصفحة: ${this.pageUrl}`);

    // 1. فحص التوجيه (Routing)
    await this.testRouting();
    
    // 2. فحص المكونات (Components)
    await this.testComponents();
    
    // 3. فحص API
    await this.testAPI();
    
    // 4. فحص الأمان
    await this.testSecurity();
    
    // 5. فحص الأداء
    await this.testPerformance();
    
    // 6. فحص إمكانية الوصول
    await this.testAccessibility();
    
    // 7. فحص الوظائف
    await this.testFunctionality();

    this.calculateOverallScore();
    this.generateReport();
  }

  async testRouting() {
    this.log('test', 'فحص التوجيه (Routing)...');
    
    try {
      // فحص ملفات التوجيه
      const routeFiles = [
        'src/App.tsx',
        'src/pages/CompanyDashboard.tsx',
        'src/components/CompanyDashboard.tsx'
      ];
      
      let routingScore = 0;
      let routesFound = 0;
      
      for (const file of routeFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          
          // فحص وجود route للـ company-dashboard
          if (content.includes('company-dashboard') || content.includes('CompanyDashboard')) {
            routesFound++;
            this.log('pass', `تم العثور على route في ${file}`);
          }
          
          // فحص React Router
          if (content.includes('BrowserRouter') || content.includes('Routes') || content.includes('Route')) {
            routingScore += 20;
            this.log('pass', `React Router موجود في ${file}`);
          }
        } else {
          this.log('fail', `ملف التوجيه مفقود: ${file}`);
          this.testResults.routing.issues.push(`ملف مفقود: ${file}`);
        }
      }
      
      if (routesFound > 0) {
        routingScore += 30;
        this.log('pass', `تم العثور على ${routesFound} routes للصفحة`);
      } else {
        this.log('fail', 'لم يتم العثور على routes للصفحة');
        this.testResults.routing.issues.push('لا توجد routes للصفحة');
      }
      
      this.testResults.routing.score = Math.min(routingScore, 100);
      
    } catch (error) {
      this.log('fail', 'خطأ في فحص التوجيه', { error: error.message });
      this.testResults.routing.issues.push(`خطأ: ${error.message}`);
    }
  }

  async testComponents() {
    this.log('test', 'فحص المكونات (Components)...');
    
    try {
      const componentFiles = [
        'src/pages/CompanyDashboard.tsx',
        'src/components/CompanyDashboard.tsx',
        'src/components/Dashboard.tsx'
      ];
      
      let componentScore = 0;
      let componentsFound = 0;
      
      for (const file of componentFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          componentsFound++;
          
          // فحص بنية المكون
          if (content.includes('export') && (content.includes('function') || content.includes('const'))) {
            componentScore += 25;
            this.log('pass', `مكون صحيح: ${file}`);
          }
          
          // فحص استخدام hooks
          if (content.includes('useState') || content.includes('useEffect')) {
            componentScore += 15;
            this.log('pass', `يستخدم React hooks: ${file}`);
          }
          
          // فحص TypeScript
          if (content.includes('interface') || content.includes('type')) {
            componentScore += 10;
            this.log('pass', `يستخدم TypeScript: ${file}`);
          }
          
        } else {
          this.log('warn', `مكون مفقود: ${file}`);
          this.testResults.components.issues.push(`مكون مفقود: ${file}`);
        }
      }
      
      if (componentsFound === 0) {
        this.log('fail', 'لم يتم العثور على أي مكونات للصفحة');
        this.testResults.components.issues.push('لا توجد مكونات للصفحة');
      }
      
      this.testResults.components.score = Math.min(componentScore, 100);
      
    } catch (error) {
      this.log('fail', 'خطأ في فحص المكونات', { error: error.message });
      this.testResults.components.issues.push(`خطأ: ${error.message}`);
    }
  }

  async testAPI() {
    this.log('test', 'فحص API endpoints...');
    
    try {
      // فحص API endpoints المطلوبة للـ dashboard
      const requiredEndpoints = [
        '/api/companies',
        '/api/messages',
        '/api/analytics/dashboard',
        '/api/status'
      ];
      
      let apiScore = 0;
      
      for (const endpoint of requiredEndpoints) {
        try {
          // محاولة الوصول للـ endpoint
          const testUrl = `http://localhost:3002${endpoint}`;
          
          // فحص وجود الـ endpoint في server.ts
          if (fs.existsSync('src/api/server.ts')) {
            const serverContent = fs.readFileSync('src/api/server.ts', 'utf8');
            
            if (serverContent.includes(endpoint)) {
              apiScore += 25;
              this.log('pass', `API endpoint موجود: ${endpoint}`);
            } else {
              this.log('fail', `API endpoint مفقود: ${endpoint}`);
              this.testResults.api.issues.push(`endpoint مفقود: ${endpoint}`);
            }
          }
          
        } catch (error) {
          this.log('fail', `خطأ في فحص ${endpoint}`, { error: error.message });
          this.testResults.api.issues.push(`خطأ في ${endpoint}: ${error.message}`);
        }
      }
      
      this.testResults.api.score = Math.min(apiScore, 100);
      
    } catch (error) {
      this.log('fail', 'خطأ في فحص API', { error: error.message });
      this.testResults.api.issues.push(`خطأ عام: ${error.message}`);
    }
  }

  async testSecurity() {
    this.log('test', 'فحص الأمان...');
    
    try {
      let securityScore = 100;
      
      // فحص authentication
      const authFiles = [
        'src/components/AuthenticatedLayout.tsx',
        'src/hooks/useAuth.ts',
        'src/context/AuthContext.tsx'
      ];
      
      let authFound = false;
      for (const file of authFiles) {
        if (fs.existsSync(file)) {
          authFound = true;
          this.log('pass', `ملف المصادقة موجود: ${file}`);
          break;
        }
      }
      
      if (!authFound) {
        securityScore -= 30;
        this.log('fail', 'لا توجد آلية مصادقة واضحة');
        this.testResults.security.issues.push('لا توجد آلية مصادقة');
      }
      
      // فحص حماية الـ routes
      if (fs.existsSync('src/App.tsx')) {
        const appContent = fs.readFileSync('src/App.tsx', 'utf8');
        
        if (appContent.includes('PrivateRoute') || appContent.includes('AuthenticatedLayout')) {
          this.log('pass', 'الـ routes محمية');
        } else {
          securityScore -= 20;
          this.log('warn', 'الـ routes قد تكون غير محمية');
          this.testResults.security.issues.push('routes غير محمية');
        }
      }
      
      // فحص متغيرات البيئة
      if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        
        if (envContent.includes('JWT_SECRET') || envContent.includes('AUTH_SECRET')) {
          this.log('pass', 'متغيرات الأمان موجودة');
        } else {
          securityScore -= 25;
          this.log('warn', 'متغيرات الأمان مفقودة');
          this.testResults.security.issues.push('متغيرات الأمان مفقودة');
        }
      }
      
      this.testResults.security.score = Math.max(securityScore, 0);
      
    } catch (error) {
      this.log('fail', 'خطأ في فحص الأمان', { error: error.message });
      this.testResults.security.issues.push(`خطأ: ${error.message}`);
    }
  }

  async testPerformance() {
    this.log('test', 'فحص الأداء...');
    
    try {
      let performanceScore = 80; // نقطة بداية جيدة
      
      // فحص حجم الملفات
      const pageFiles = [
        'src/pages/CompanyDashboard.tsx',
        'src/components/CompanyDashboard.tsx'
      ];
      
      for (const file of pageFiles) {
        if (fs.existsSync(file)) {
          const stats = fs.statSync(file);
          const sizeKB = stats.size / 1024;
          
          if (sizeKB > 50) {
            performanceScore -= 10;
            this.log('warn', `ملف كبير: ${file} (${sizeKB.toFixed(1)}KB)`);
            this.testResults.performance.metrics[file] = `${sizeKB.toFixed(1)}KB`;
          } else {
            this.log('pass', `حجم ملف جيد: ${file} (${sizeKB.toFixed(1)}KB)`);
          }
        }
      }
      
      // فحص lazy loading
      if (fs.existsSync('src/App.tsx')) {
        const appContent = fs.readFileSync('src/App.tsx', 'utf8');
        
        if (appContent.includes('lazy') || appContent.includes('Suspense')) {
          performanceScore += 10;
          this.log('pass', 'يستخدم lazy loading');
        } else {
          this.log('warn', 'لا يستخدم lazy loading');
        }
      }
      
      this.testResults.performance.score = Math.min(performanceScore, 100);
      
    } catch (error) {
      this.log('fail', 'خطأ في فحص الأداء', { error: error.message });
    }
  }

  async testAccessibility() {
    this.log('test', 'فحص إمكانية الوصول...');
    
    try {
      let accessibilityScore = 70; // نقطة بداية متوسطة
      
      const pageFiles = [
        'src/pages/CompanyDashboard.tsx',
        'src/components/CompanyDashboard.tsx'
      ];
      
      for (const file of pageFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          
          // فحص aria labels
          if (content.includes('aria-label') || content.includes('aria-describedby')) {
            accessibilityScore += 10;
            this.log('pass', `يستخدم ARIA labels: ${file}`);
          }
          
          // فحص semantic HTML
          if (content.includes('<main>') || content.includes('<section>') || content.includes('<header>')) {
            accessibilityScore += 10;
            this.log('pass', `يستخدم semantic HTML: ${file}`);
          }
          
          // فحص alt text للصور
          if (content.includes('<img') && content.includes('alt=')) {
            accessibilityScore += 5;
            this.log('pass', `يستخدم alt text: ${file}`);
          }
        }
      }
      
      this.testResults.accessibility.score = Math.min(accessibilityScore, 100);
      
    } catch (error) {
      this.log('fail', 'خطأ في فحص إمكانية الوصول', { error: error.message });
    }
  }

  async testFunctionality() {
    this.log('test', 'فحص الوظائف...');
    
    try {
      let functionalityScore = 60; // نقطة بداية متوسطة
      
      // فحص وجود dashboard features
      const dashboardFeatures = [
        'analytics',
        'messages',
        'companies',
        'statistics',
        'chart',
        'graph'
      ];
      
      const pageFiles = [
        'src/pages/CompanyDashboard.tsx',
        'src/components/CompanyDashboard.tsx'
      ];
      
      for (const file of pageFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8').toLowerCase();
          
          dashboardFeatures.forEach(feature => {
            if (content.includes(feature)) {
              functionalityScore += 5;
              this.log('pass', `ميزة موجودة: ${feature} في ${file}`);
            }
          });
          
          // فحص state management
          if (content.includes('usestate') || content.includes('usecontext')) {
            functionalityScore += 10;
            this.log('pass', `يستخدم state management: ${file}`);
          }
          
          // فحص API calls
          if (content.includes('fetch') || content.includes('axios') || content.includes('api')) {
            functionalityScore += 10;
            this.log('pass', `يستخدم API calls: ${file}`);
          }
        }
      }
      
      this.testResults.functionality.score = Math.min(functionalityScore, 100);
      
    } catch (error) {
      this.log('fail', 'خطأ في فحص الوظائف', { error: error.message });
    }
  }

  calculateOverallScore() {
    const scores = [
      this.testResults.routing.score,
      this.testResults.components.score,
      this.testResults.api.score,
      this.testResults.security.score,
      this.testResults.performance.score,
      this.testResults.accessibility.score,
      this.testResults.functionality.score
    ];
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    this.testResults.overall.score = Math.round(averageScore);
    
    if (averageScore >= 80) {
      this.testResults.overall.status = 'excellent';
    } else if (averageScore >= 60) {
      this.testResults.overall.status = 'good';
    } else if (averageScore >= 40) {
      this.testResults.overall.status = 'fair';
    } else {
      this.testResults.overall.status = 'poor';
    }
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log(`🔍 تقرير فحص الصفحة: ${this.pageUrl}`);
    console.log('='.repeat(80));
    
    console.log(`\n📊 النتائج التفصيلية:`);
    console.log(`  🛣️ التوجيه (Routing): ${this.testResults.routing.score}/100`);
    console.log(`  🧩 المكونات (Components): ${this.testResults.components.score}/100`);
    console.log(`  🌐 API: ${this.testResults.api.score}/100`);
    console.log(`  🔒 الأمان (Security): ${this.testResults.security.score}/100`);
    console.log(`  ⚡ الأداء (Performance): ${this.testResults.performance.score}/100`);
    console.log(`  ♿ إمكانية الوصول: ${this.testResults.accessibility.score}/100`);
    console.log(`  ⚙️ الوظائف: ${this.testResults.functionality.score}/100`);
    
    console.log(`\n🏆 التقييم العام: ${this.testResults.overall.score}/100 (${this.testResults.overall.status})`);
    console.log(`⏱️ وقت الفحص: ${duration}ms`);
    
    // عرض المشاكل
    const allIssues = [
      ...this.testResults.routing.issues,
      ...this.testResults.components.issues,
      ...this.testResults.api.issues,
      ...this.testResults.security.issues,
      ...this.testResults.accessibility.issues
    ];
    
    if (allIssues.length > 0) {
      console.log(`\n⚠️ المشاكل المكتشفة (${allIssues.length}):`);
      allIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    } else {
      console.log(`\n✅ لا توجد مشاكل مكتشفة!`);
    }
    
    // حفظ التقرير
    const reportPath = `test-reports/page-test-${Date.now()}.json`;
    try {
      if (!fs.existsSync('test-reports')) {
        fs.mkdirSync('test-reports', { recursive: true });
      }
      
      fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
      console.log(`\n💾 تم حفظ التقرير في: ${reportPath}`);
    } catch (error) {
      console.log(`\n❌ فشل حفظ التقرير: ${error.message}`);
    }
    
    console.log(`\n🔍 فحص الصفحة اكتمل!`);
  }
}

// فحص الصفحة المحددة
const pageUrl = process.argv[2] || 'http://localhost:8080/company-dashboard';
const tester = new PageSpecificTester(pageUrl);
tester.testPage().catch(error => {
  console.error('💥 خطأ في فحص الصفحة:', error);
  process.exit(1);
});
