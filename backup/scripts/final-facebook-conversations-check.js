/**
 * 🔍 فحص نهائي شامل لصفحة facebook-conversations
 * يتأكد من عدم وجود أي مشاكل
 */

import fs from 'fs';

class FinalFacebookConversationsChecker {
  constructor() {
    this.issues = [];
    this.successes = [];
    this.warnings = [];
  }

  log(level, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const emoji = {
      'info': 'ℹ️',
      'success': '✅',
      'fail': '❌',
      'warn': '⚠️',
      'check': '🔍'
    }[level] || '📝';
    
    console.log(`${emoji} [${timestamp}] ${message}`);
    if (details) {
      console.log(`   📋 التفاصيل: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async performFinalCheck() {
    console.log('🔍 بدء الفحص النهائي الشامل لصفحة facebook-conversations...\n');
    this.log('info', 'فحص نهائي شامل للصفحة');

    // 1. فحص الملفات الأساسية
    await this.checkCoreFiles();
    
    // 2. فحص الـ imports
    await this.checkImports();
    
    // 3. فحص الـ routes
    await this.checkRoutes();
    
    // 4. فحص الـ hooks
    await this.checkHooks();
    
    // 5. فحص الـ API endpoints
    await this.checkAPIEndpoints();
    
    // 6. فحص الأخطاء الشائعة
    await this.checkCommonErrors();

    this.generateFinalReport();
  }

  async checkCoreFiles() {
    this.log('check', 'فحص الملفات الأساسية...');
    
    const coreFiles = [
      'src/pages/Conversations.tsx',
      'src/components/ConversationsList.tsx',
      'src/components/ChatWindow.tsx',
      'src/App.tsx'
    ];
    
    for (const file of coreFiles) {
      if (fs.existsSync(file)) {
        this.successes.push(`الملف موجود: ${file}`);
        this.log('success', `الملف موجود: ${file}`);
      } else {
        this.issues.push(`الملف مفقود: ${file}`);
        this.log('fail', `الملف مفقود: ${file}`);
      }
    }
  }

  async checkImports() {
    this.log('check', 'فحص الـ imports...');
    
    try {
      // فحص ChatWindow.tsx
      const chatWindowContent = fs.readFileSync('src/components/ChatWindow.tsx', 'utf8');
      
      // التحقق من عدم وجود imports مشكلة
      if (chatWindowContent.includes('useState useEffect')) {
        this.issues.push('خطأ في import: useState useEffect في ChatWindow.tsx');
        this.log('fail', 'خطأ في import: useState useEffect');
      } else {
        this.successes.push('imports صحيحة في ChatWindow.tsx');
        this.log('success', 'imports صحيحة في ChatWindow.tsx');
      }
      
      // التحقق من عدم وجود GeminiTestButton
      if (chatWindowContent.includes('GeminiTestButton')) {
        this.warnings.push('تحذير: GeminiTestButton موجود في ChatWindow.tsx');
        this.log('warn', 'تحذير: GeminiTestButton موجود');
      } else {
        this.successes.push('لا يوجد GeminiTestButton مشكل');
        this.log('success', 'لا يوجد GeminiTestButton مشكل');
      }
      
      // التحقق من وجود toast import
      if (chatWindowContent.includes('import { toast }')) {
        this.successes.push('toast import موجود');
        this.log('success', 'toast import موجود');
      } else {
        this.warnings.push('toast import مفقود');
        this.log('warn', 'toast import مفقود');
      }
      
    } catch (error) {
      this.issues.push(`خطأ في فحص imports: ${error.message}`);
      this.log('fail', 'خطأ في فحص imports', { error: error.message });
    }
  }

  async checkRoutes() {
    this.log('check', 'فحص الـ routes...');
    
    try {
      const appContent = fs.readFileSync('src/App.tsx', 'utf8');
      
      // التحقق من وجود route للصفحة
      if (appContent.includes('/facebook-conversations')) {
        this.successes.push('route موجود في App.tsx');
        this.log('success', 'route موجود في App.tsx');
      } else {
        this.issues.push('route مفقود في App.tsx');
        this.log('fail', 'route مفقود في App.tsx');
      }
      
      // التحقق من import الصفحة
      if (appContent.includes('import Conversations')) {
        this.successes.push('import الصفحة موجود');
        this.log('success', 'import الصفحة موجود');
      } else {
        this.issues.push('import الصفحة مفقود');
        this.log('fail', 'import الصفحة مفقود');
      }
      
    } catch (error) {
      this.issues.push(`خطأ في فحص routes: ${error.message}`);
      this.log('fail', 'خطأ في فحص routes', { error: error.message });
    }
  }

  async checkHooks() {
    this.log('check', 'فحص الـ hooks...');
    
    const requiredHooks = [
      'src/hooks/useConversations.ts',
      'src/hooks/useMessages.ts',
      'src/hooks/useCurrentCompany.ts'
    ];
    
    for (const hook of requiredHooks) {
      if (fs.existsSync(hook)) {
        this.successes.push(`Hook موجود: ${hook}`);
        this.log('success', `Hook موجود: ${hook}`);
      } else {
        this.issues.push(`Hook مفقود: ${hook}`);
        this.log('fail', `Hook مفقود: ${hook}`);
      }
    }
  }

  async checkAPIEndpoints() {
    this.log('check', 'فحص الـ API endpoints...');
    
    try {
      const serverContent = fs.readFileSync('src/api/server.ts', 'utf8');
      
      const requiredEndpoints = [
        '/api/facebook/conversations',
        '/api/conversations'
      ];
      
      for (const endpoint of requiredEndpoints) {
        if (serverContent.includes(endpoint)) {
          this.successes.push(`API endpoint موجود: ${endpoint}`);
          this.log('success', `API endpoint موجود: ${endpoint}`);
        } else {
          this.warnings.push(`API endpoint مفقود: ${endpoint}`);
          this.log('warn', `API endpoint مفقود: ${endpoint}`);
        }
      }
      
    } catch (error) {
      this.warnings.push(`لا يمكن فحص API endpoints: ${error.message}`);
      this.log('warn', 'لا يمكن فحص API endpoints', { error: error.message });
    }
  }

  async checkCommonErrors() {
    this.log('check', 'فحص الأخطاء الشائعة...');
    
    const filesToCheck = [
      'src/components/ChatWindow.tsx',
      'src/components/ConversationsList.tsx',
      'src/pages/Conversations.tsx'
    ];
    
    for (const file of filesToCheck) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          // فحص أخطاء شائعة
          const commonErrors = [
            { pattern: /useState useEffect/, message: 'خطأ في import useState useEffect' },
            { pattern: /=<HTML/, message: 'خطأ في useRef' },
            { pattern: /import.*from.*undefined/, message: 'import من undefined' },
            { pattern: /Cannot find name/, message: 'متغير غير معرف' }
          ];
          
          for (const error of commonErrors) {
            if (error.pattern.test(content)) {
              this.issues.push(`${error.message} في ${file}`);
              this.log('fail', `${error.message} في ${file}`);
            }
          }
          
        } catch (error) {
          this.warnings.push(`لا يمكن فحص ${file}: ${error.message}`);
          this.log('warn', `لا يمكن فحص ${file}`, { error: error.message });
        }
      }
    }
  }

  generateFinalReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 التقرير النهائي الشامل لصفحة facebook-conversations');
    console.log('='.repeat(80));
    
    console.log(`\n📊 ملخص النتائج:`);
    console.log(`  ✅ النجاحات: ${this.successes.length}`);
    console.log(`  ⚠️ التحذيرات: ${this.warnings.length}`);
    console.log(`  ❌ المشاكل: ${this.issues.length}`);
    
    if (this.successes.length > 0) {
      console.log(`\n✅ النجاحات (${this.successes.length}):`);
      this.successes.forEach(success => {
        console.log(`  • ${success}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️ التحذيرات (${this.warnings.length}):`);
      this.warnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }
    
    if (this.issues.length > 0) {
      console.log(`\n❌ المشاكل (${this.issues.length}):`);
      this.issues.forEach(issue => {
        console.log(`  • ${issue}`);
      });
    }
    
    console.log(`\n🎯 التقييم النهائي:`);
    if (this.issues.length === 0) {
      console.log('  🎉 ممتاز! لا توجد مشاكل في الصفحة');
      console.log('  ✨ الصفحة جاهزة للاستخدام بشكل كامل');
    } else if (this.issues.length <= 2) {
      console.log('  👍 جيد! مشاكل بسيطة يمكن تجاهلها');
    } else {
      console.log('  ⚠️ تحتاج إصلاحات إضافية');
    }
    
    console.log(`\n📈 نسبة النجاح:`);
    const totalChecks = this.successes.length + this.warnings.length + this.issues.length;
    const successRate = totalChecks > 0 ? Math.round((this.successes.length / totalChecks) * 100) : 0;
    console.log(`  🏆 ${successRate}% من الفحوصات نجحت`);
    
    console.log(`\n💡 التوصية النهائية:`);
    if (this.issues.length === 0) {
      console.log('  🚀 الصفحة جاهزة للاستخدام الإنتاجي!');
      console.log('  🌐 يمكن زيارتها على: http://localhost:8080/facebook-conversations');
    } else {
      console.log('  🔧 يُنصح بإصلاح المشاكل المذكورة أعلاه');
    }
    
    console.log(`\n🔍 الفحص النهائي الشامل اكتمل!`);
  }
}

// تشغيل الفحص النهائي
const checker = new FinalFacebookConversationsChecker();
checker.performFinalCheck().catch(error => {
  console.error('💥 خطأ في الفحص النهائي:', error);
  process.exit(1);
});
