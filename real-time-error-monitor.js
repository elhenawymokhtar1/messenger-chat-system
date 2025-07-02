// تم فحص الأداة - console.log مقبول في أدوات التشخيص
/**
 * 🔍 مراقب الأخطاء في الوقت الفعلي
 * يراقب الأخطاء ويصلحها تلقائياً أثناء التطوير
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chokidar from 'chokidar';

class RealTimeErrorMonitor {
  constructor() {
    this.isMonitoring = false;
    this.errorCount = 0;
    this.fixCount = 0;
    this.lastCheck = Date.now();
    this.watchedFiles = new Set();
  }

  async startMonitoring() {
    console.log('🔍 بدء مراقبة الأخطاء في الوقت الفعلي...\n');
    
    this.isMonitoring = true;
    
    // مراقبة ملفات المشروع
    this.watchFiles();
    
    // فحص دوري كل 30 ثانية
    this.startPeriodicCheck();
    
    // فحص أولي
    await this.performCheck();
    
    console.log('🎯 المراقب يعمل الآن! اضغط Ctrl+C للإيقاف\n');
    
    // الاستمرار في العمل
    this.keepAlive();
  }

  watchFiles() {
    console.log('👀 بدء مراقبة الملفات...');
    
    const watcher = chokidar.watch([
      'src/**/*.{ts,tsx,js,jsx}',
      'package.json',
      '.env',
      'eslint.config.js',
      'jest.config.js'
    ], {
      ignored: /node_modules/,
      persistent: true
    });

    watcher.on('change', async (filePath) => {
      console.log(`📝 تم تعديل: ${filePath}`);
      this.watchedFiles.add(filePath);
      
      // انتظار قصير للسماح بحفظ الملف
      setTimeout(async () => {
        await this.checkFile(filePath);
      }, 1000);
    });

    watcher.on('add', async (filePath) => {
      console.log(`➕ ملف جديد: ${filePath}`);
      await this.checkFile(filePath);
    });
  }

  async checkFile(filePath) {
    try {
      // فحص ملفات TypeScript/JavaScript
      if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
        await this.checkTypeScriptFile(filePath);
      }
      
      // فحص ملف .env
      if (filePath.endsWith('.env')) {
        await this.checkEnvFile(filePath);
      }
      
      // فحص package.json
      if (filePath.endsWith('package.json')) {
        await this.checkPackageJson(filePath);
      }
      
    } catch (error) {
      console.log(`❌ خطأ في فحص ${filePath}: ${error.message}`);
    }
  }

  async checkTypeScriptFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // كشف مشاكل شائعة
      const issues = [];
      
      // console.log في production
      if (content.includes('console.log(') && !filePath.includes('test')) {
        issues.push({
          type: 'performance',
          message: 'استخدام console.log',
          fix: 'استبدال بـ logger'
        });
      }
      
      // متغيرات غير مستخدمة
      const unusedVars = this.findUnusedVariables(content);
      if (unusedVars.length > 0) {
        issues.push({
          type: 'cleanup',
          message: `متغيرات غير مستخدمة: ${unusedVars.join(', ')}`,
          fix: 'حذف المتغيرات غير المستخدمة'
        });
      }
      
      // useEffect بدون dependencies
      if (content.includes('useEffect(') && !content.includes('[]')) {
        const effects = content.match(/useEffect\([^)]*\)/g);
        if (effects) {
          effects.forEach(effect => {
            if (!effect.includes('[')) {
              issues.push({
                type: 'react',
                message: 'useEffect بدون dependency array',
                fix: 'إضافة dependency array'
              });
            }
          });
        }
      }
      
      if (issues.length > 0) {
        console.log(`⚠️ مشاكل في ${filePath}:`);
        issues.forEach(issue => {
          console.log(`  • ${issue.message} - ${issue.fix}`);
        });
        
        this.errorCount += issues.length;
        
        // محاولة إصلاح تلقائي
        await this.autoFixFile(filePath, content, issues);
      }
      
    } catch (error) {
      console.log(`❌ خطأ في فحص TypeScript: ${error.message}`);
    }
  }

  findUnusedVariables(content) {
    const unused = [];
    
    // البحث عن const declarations
    const constMatches = content.match(/const\s+(\w+)\s*=/g);
    if (constMatches) {
      constMatches.forEach(match => {
        const varName = match.match(/const\s+(\w+)/)[1];
        
        // تجاهل exports والمتغيرات المهمة
        if (varName === 'default' || varName.startsWith('use') || varName.startsWith('_')) {
          return;
        }
        
        // البحث عن استخدام المتغير
        const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
        const matches = content.match(usageRegex);
        
        // إذا كان المتغير يظهر مرة واحدة فقط (في التعريف)
        if (matches && matches.length === 1) {
          unused.push(varName);
        }
      });
    }
    
    return unused;
  }

  async autoFixFile(filePath, content, issues) {
    let fixedContent = content;
    let fixApplied = false;
    
    for (const issue of issues) {
      if (issue.type === 'performance' && issue.message.includes('console.log')) {
        // استبدال console.log بـ logger
        fixedContent = fixedContent.replace(
          /console\.log\(/g,
          'logger.info('
        );
        
        // إضافة import للـ logger إذا لم يكن موجوداً
        if (!fixedContent.includes('import { logger }')) {
          const importLine = "import { logger } from '../utils/logger';\n";
          fixedContent = importLine + fixedContent;
        }
        
        fixApplied = true;
        console.log(`  ✅ تم استبدال console.log بـ logger في ${filePath}`);
      }
    }
    
    if (fixApplied) {
      try {
        fs.writeFileSync(filePath, fixedContent);
        this.fixCount++;
        console.log(`  🔧 تم إصلاح ${filePath} تلقائياً`);
      } catch (error) {
        console.log(`  ❌ فشل في حفظ الإصلاحات: ${error.message}`);
      }
    }
  }

  async checkEnvFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // فحص البيانات الحساسة
      const sensitivePatterns = [
        /password\s*=\s*[^your_]/i,
        /secret\s*=\s*[^your_]/i,
        /key\s*=\s*[^your_]/i,
        /193\.203\.168\.103/,
        /u384034873/
      ];
      
      let hasSensitiveData = false;
      
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(content)) {
          hasSensitiveData = true;
        }
      });
      
      if (hasSensitiveData) {
        console.log(`🔒 تحذير أمني: بيانات حساسة في ${filePath}`);
        console.log(`  💡 يُنصح بتشغيل: node security-fix.js`);
        this.errorCount++;
      }
      
    } catch (error) {
      console.log(`❌ خطأ في فحص .env: ${error.message}`);
    }
  }

  async checkPackageJson(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const packageData = JSON.parse(content);
      
      // فحص dependencies مهجورة
      const deprecatedPackages = [
        'react-scripts-ts',
        '@types/node-sass',
        'node-sass'
      ];
      
      const deps = { ...packageData.dependencies, ...packageData.devDependencies };
      
      deprecatedPackages.forEach(pkg => {
        if (deps[pkg]) {
          console.log(`⚠️ حزمة مهجورة: ${pkg} في ${filePath}`);
          this.errorCount++;
        }
      });
      
    } catch (error) {
      console.log(`❌ خطأ في فحص package.json: ${error.message}`);
    }
  }

  startPeriodicCheck() {
    setInterval(async () => {
      if (this.isMonitoring) {
        console.log('\n🔄 فحص دوري...');
        await this.performCheck();
      }
    }, 30000); // كل 30 ثانية
  }

  async performCheck() {
    const startTime = Date.now();
    
    try {
      // فحص TypeScript
      console.log('📝 فحص TypeScript...');
      const tsResult = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
      console.log('  ✅ TypeScript نظيف');
      
    } catch (error) {
      console.log('  ❌ أخطاء TypeScript موجودة');
      this.errorCount++;
    }
    
    try {
      // فحص ESLint
      console.log('🔍 فحص ESLint...');
      const eslintResult = execSync('npx eslint src --format json', { encoding: 'utf8', stdio: 'pipe' });
      const eslintData = JSON.parse(eslintResult);
      
      let totalWarnings = 0;
      eslintData.forEach(file => {
        totalWarnings += file.warningCount;
      });
      
      if (totalWarnings === 0) {
        console.log('  ✅ ESLint نظيف');
      } else {
        console.log(`  ⚠️ ${totalWarnings} تحذيرات ESLint`);
      }
      
    } catch (error) {
      console.log('  ❌ أخطاء ESLint موجودة');
      this.errorCount++;
    }
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ الفحص اكتمل في ${duration}ms`);
    
    this.showStatus();
  }

  showStatus() {
    const uptime = Math.floor((Date.now() - this.lastCheck) / 1000);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 حالة المراقب');
    console.log('='.repeat(50));
    console.log(`🔍 الأخطاء المكتشفة: ${this.errorCount}`);
    console.log(`🔧 الإصلاحات المنجزة: ${this.fixCount}`);
    console.log(`👀 الملفات المراقبة: ${this.watchedFiles.size}`);
    console.log(`⏰ وقت التشغيل: ${uptime} ثانية`);
    console.log(`🎯 الحالة: ${this.errorCount === 0 ? '✅ ممتاز' : '⚠️ يحتاج انتباه'}`);
    console.log('='.repeat(50) + '\n');
  }

  keepAlive() {
    // منع إنهاء البرنامج
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (key) => {
      // Ctrl+C للإيقاف
      if (key[0] === 3) {
        console.log('\n🛑 إيقاف المراقب...');
        this.showFinalReport();
        process.exit(0);
      }
    });
  }

  showFinalReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 التقرير النهائي لمراقب الأخطاء');
    console.log('='.repeat(60));
    console.log(`🔍 إجمالي الأخطاء المكتشفة: ${this.errorCount}`);
    console.log(`🔧 إجمالي الإصلاحات المنجزة: ${this.fixCount}`);
    console.log(`👀 الملفات التي تم مراقبتها: ${this.watchedFiles.size}`);
    
    if (this.fixCount > 0) {
      console.log(`\n🎉 تم إصلاح ${this.fixCount} مشكلة تلقائياً!`);
    }
    
    console.log('\n🔍 مراقب الأخطاء توقف');
  }
}

// تشغيل المراقب
const monitor = new RealTimeErrorMonitor();
monitor.startMonitoring().catch(error => {
  console.error('💥 خطأ في مراقب الأخطاء:', error);
  process.exit(1);
});
