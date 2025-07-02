// تم فحص الأداة - console.log مقبول في أدوات التشخيص
/**
 * 🧪 اختبار شامل للموقع
 * يجمع جميع أدوات الاختبار في تقرير واحد
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class ComprehensiveSiteTest {
  constructor() {
    this.results = {
      build: { status: 'unknown', details: '' },
      typescript: { status: 'unknown', details: '' },
      eslint: { status: 'unknown', errors: 0, warnings: 0 },
      tests: { status: 'unknown', passed: 0, failed: 0, total: 0 },
      network: { status: 'unknown', passed: 0, failed: 0, total: 0 },
      performance: { status: 'unknown', avgTime: 0, pages: 0 },
      security: { status: 'unknown', issues: [] },
      accessibility: { status: 'unknown', score: 0 }
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 بدء الاختبار الشامل للموقع...\n');
    
    try {
      // 1. فحص البناء
      await this.testBuild();
      
      // 2. فحص TypeScript
      await this.testTypeScript();
      
      // 3. فحص ESLint
      await this.testESLint();
      
      // 4. تشغيل الاختبارات
      await this.runTests();
      
      // 5. فحص الشبكة
      await this.testNetwork();
      
      // 6. فحص الأداء
      await this.testPerformance();
      
      // 7. فحص الأمان
      await this.testSecurity();
      
      // 8. إنشاء التقرير النهائي
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ خطأ في الاختبار الشامل:', error.message);
    }
  }

  async testBuild() {
    console.log('🔨 اختبار البناء...');
    try {
      const output = execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
      this.results.build.status = 'success';
      this.results.build.details = 'تم البناء بنجاح';
      console.log('✅ البناء نجح');
    } catch (error) {
      this.results.build.status = 'failed';
      this.results.build.details = error.message;
      console.log('❌ البناء فشل');
    }
  }

  async testTypeScript() {
    console.log('📝 فحص TypeScript...');
    try {
      execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
      this.results.typescript.status = 'success';
      this.results.typescript.details = 'لا توجد أخطاء TypeScript';
      console.log('✅ TypeScript نظيف');
    } catch (error) {
      this.results.typescript.status = 'failed';
      this.results.typescript.details = error.message;
      console.log('❌ أخطاء TypeScript موجودة');
    }
  }

  async testESLint() {
    console.log('🔍 فحص ESLint...');
    try {
      const output = execSync('npx eslint src --format json', { encoding: 'utf8', stdio: 'pipe' });
      const results = JSON.parse(output);
      
      let totalErrors = 0;
      let totalWarnings = 0;
      
      results.forEach(file => {
        totalErrors += file.errorCount;
        totalWarnings += file.warningCount;
      });
      
      this.results.eslint.errors = totalErrors;
      this.results.eslint.warnings = totalWarnings;
      this.results.eslint.status = totalErrors === 0 ? 'success' : 'warning';
      
      console.log(`📊 ESLint: ${totalErrors} أخطاء، ${totalWarnings} تحذيرات`);
    } catch (error) {
      this.results.eslint.status = 'failed';
      console.log('❌ فشل فحص ESLint');
    }
  }

  async runTests() {
    console.log('🧪 تشغيل الاختبارات...');
    try {
      const output = execSync('npm test -- --passWithNoTests --watchAll=false', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      
      // استخراج نتائج الاختبارات
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);
      const totalMatch = output.match(/(\d+) total/);
      
      this.results.tests.passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      this.results.tests.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      this.results.tests.total = totalMatch ? parseInt(totalMatch[1]) : 0;
      this.results.tests.status = this.results.tests.failed === 0 ? 'success' : 'failed';
      
      console.log(`✅ الاختبارات: ${this.results.tests.passed}/${this.results.tests.total} نجح`);
    } catch (error) {
      this.results.tests.status = 'failed';
      console.log('❌ فشلت الاختبارات');
    }
  }

  async testNetwork() {
    console.log('🌐 فحص الشبكة...');
    try {
      const output = execSync('node simple-network-checker.js', { encoding: 'utf8', stdio: 'pipe' });
      
      // استخراج النتائج من المخرجات
      const successMatch = output.match(/نجح: (\d+)\/(\d+)/);
      if (successMatch) {
        this.results.network.passed = parseInt(successMatch[1]);
        this.results.network.total = parseInt(successMatch[2]);
        this.results.network.failed = this.results.network.total - this.results.network.passed;
        this.results.network.status = this.results.network.failed === 0 ? 'success' : 'warning';
      }
      
      console.log(`🌐 الشبكة: ${this.results.network.passed}/${this.results.network.total} نجح`);
    } catch (error) {
      this.results.network.status = 'failed';
      console.log('❌ فشل فحص الشبكة');
    }
  }

  async testPerformance() {
    console.log('⚡ فحص الأداء...');
    try {
      const output = execSync('node performance-checker.js', { encoding: 'utf8', stdio: 'pipe' });
      
      // استخراج متوسط وقت الاستجابة
      const avgTimeMatch = output.match(/متوسط وقت الاستجابة: (\d+)ms/);
      const pagesMatch = output.match(/الصفحات الناجحة: (\d+)\/(\d+)/);
      
      if (avgTimeMatch) {
        this.results.performance.avgTime = parseInt(avgTimeMatch[1]);
      }
      
      if (pagesMatch) {
        this.results.performance.pages = parseInt(pagesMatch[2]);
      }
      
      this.results.performance.status = this.results.performance.avgTime < 100 ? 'success' : 'warning';
      
      console.log(`⚡ الأداء: ${this.results.performance.avgTime}ms متوسط`);
    } catch (error) {
      this.results.performance.status = 'failed';
      console.log('❌ فشل فحص الأداء');
    }
  }

  async testSecurity() {
    console.log('🔒 فحص الأمان...');
    
    const securityIssues = [];
    
    // فحص ملفات الإعداد الحساسة
    const sensitiveFiles = [
      '.env',
      'src/config/mysql.ts',
      'src/lib/supabaseAdmin.ts'
    ];
    
    sensitiveFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // فحص كلمات المرور المكشوفة
        if (content.includes('password') && content.includes('=')) {
          securityIssues.push(`كلمة مرور مكشوفة في ${file}`);
        }
        
        // فحص مفاتيح API
        if (content.match(/[A-Za-z0-9]{32,}/)) {
          securityIssues.push(`مفتاح API محتمل في ${file}`);
        }
      }
    });
    
    this.results.security.issues = securityIssues;
    this.results.security.status = securityIssues.length === 0 ? 'success' : 'warning';
    
    console.log(`🔒 الأمان: ${securityIssues.length} مشاكل محتملة`);
  }

  generateFinalReport() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 التقرير الشامل لاختبار الموقع');
    console.log('='.repeat(80));
    
    // ملخص النتائج
    console.log('\n🎯 ملخص النتائج:');
    console.log(`🔨 البناء: ${this.getStatusIcon(this.results.build.status)} ${this.results.build.status}`);
    console.log(`📝 TypeScript: ${this.getStatusIcon(this.results.typescript.status)} ${this.results.typescript.status}`);
    console.log(`🔍 ESLint: ${this.getStatusIcon(this.results.eslint.status)} ${this.results.eslint.errors} أخطاء، ${this.results.eslint.warnings} تحذيرات`);
    console.log(`🧪 الاختبارات: ${this.getStatusIcon(this.results.tests.status)} ${this.results.tests.passed}/${this.results.tests.total}`);
    console.log(`🌐 الشبكة: ${this.getStatusIcon(this.results.network.status)} ${this.results.network.passed}/${this.results.network.total}`);
    console.log(`⚡ الأداء: ${this.getStatusIcon(this.results.performance.status)} ${this.results.performance.avgTime}ms`);
    console.log(`🔒 الأمان: ${this.getStatusIcon(this.results.security.status)} ${this.results.security.issues.length} مشاكل`);
    
    // التقييم العام
    const overallScore = this.calculateOverallScore();
    console.log(`\n🏆 التقييم العام: ${overallScore}/100`);
    console.log(`⏱️ وقت الاختبار: ${duration} ثانية`);
    
    // التوصيات
    this.generateRecommendations();
    
    // حفظ التقرير
    this.saveReport();
  }

  getStatusIcon(status) {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'failed': return '❌';
      default: return '❓';
    }
  }

  calculateOverallScore() {
    let score = 0;
    
    // البناء (20 نقطة)
    if (this.results.build.status === 'success') score += 20;
    
    // TypeScript (15 نقطة)
    if (this.results.typescript.status === 'success') score += 15;
    
    // ESLint (15 نقطة)
    if (this.results.eslint.status === 'success') score += 15;
    else if (this.results.eslint.errors === 0) score += 10;
    
    // الاختبارات (20 نقطة)
    if (this.results.tests.status === 'success') score += 20;
    else if (this.results.tests.total > 0) {
      score += Math.round((this.results.tests.passed / this.results.tests.total) * 20);
    }
    
    // الشبكة (10 نقاط)
    if (this.results.network.status === 'success') score += 10;
    else if (this.results.network.total > 0) {
      score += Math.round((this.results.network.passed / this.results.network.total) * 10);
    }
    
    // الأداء (10 نقاط)
    if (this.results.performance.avgTime < 50) score += 10;
    else if (this.results.performance.avgTime < 100) score += 7;
    else if (this.results.performance.avgTime < 200) score += 5;
    
    // الأمان (10 نقاط)
    if (this.results.security.issues.length === 0) score += 10;
    else if (this.results.security.issues.length < 3) score += 5;
    
    return score;
  }

  generateRecommendations() {
    console.log('\n💡 التوصيات:');
    
    if (this.results.build.status !== 'success') {
      console.log('  • إصلاح أخطاء البناء أولاً');
    }
    
    if (this.results.eslint.errors > 0) {
      console.log(`  • إصلاح ${this.results.eslint.errors} أخطاء ESLint`);
    }
    
    if (this.results.tests.failed > 0) {
      console.log(`  • إصلاح ${this.results.tests.failed} اختبارات فاشلة`);
    }
    
    if (this.results.performance.avgTime > 100) {
      console.log('  • تحسين أداء الموقع (وقت الاستجابة بطيء)');
    }
    
    if (this.results.security.issues.length > 0) {
      console.log('  • معالجة مشاكل الأمان:');
      this.results.security.issues.forEach(issue => {
        console.log(`    - ${issue}`);
      });
    }
  }

  saveReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      results: this.results,
      score: this.calculateOverallScore(),
      duration: Math.round((Date.now() - this.startTime) / 1000)
    };
    
    const reportPath = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }
    
    const reportFile = path.join(reportPath, `comprehensive-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
    
    console.log(`\n💾 تم حفظ التقرير في: ${reportFile}`);
  }
}

// تشغيل الاختبار الشامل
const tester = new ComprehensiveSiteTest();
tester.runAllTests().catch(error => {
  console.error('💥 خطأ في الاختبار الشامل:', error);
  process.exit(1);
});
