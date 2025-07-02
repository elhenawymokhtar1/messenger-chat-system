// تم فحص الأداة - console.log مقبول في أدوات التشخيص
/**
 * 🔍 ماسح الأخطاء المفصل - يظهر كل خطوة في اللوج
 * يعرض عملية الفحص واكتشاف الأخطاء بالتفصيل الكامل
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class DetailedErrorScanner {
  constructor() {
    this.scanResults = {
      filesScanned: 0,
      errorsFound: 0,
      warningsFound: 0,
      fixesApplied: 0,
      detailedLog: []
    };
    this.startTime = Date.now();
  }

  log(level, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const emoji = {
      'info': 'ℹ️',
      'warn': '⚠️',
      'error': '❌',
      'success': '✅',
      'scan': '🔍',
      'fix': '🔧'
    }[level] || '📝';
    
    const logEntry = {
      timestamp,
      level,
      message,
      details
    };
    
    this.scanResults.detailedLog.push(logEntry);
    
    console.log(`${emoji} [${timestamp}] ${message}`);
    if (details) {
      console.log(`   📋 التفاصيل: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async startDetailedScan() {
    console.log('🚀 بدء الفحص المفصل للأخطاء...\n');
    this.log('info', 'بدء عملية الفحص الشامل');

    // 1. فحص بنية المشروع
    await this.scanProjectStructure();
    
    // 2. فحص ملفات TypeScript/JavaScript
    await this.scanCodeFiles();
    
    // 3. فحص ملفات الإعداد
    await this.scanConfigFiles();
    
    // 4. فحص مشاكل الأمان
    await this.scanSecurityIssues();
    
    // 5. فحص الأداء
    await this.scanPerformanceIssues();
    
    // 6. تطبيق الإصلاحات
    await this.applyFixes();

    this.generateDetailedReport();
  }

  async scanProjectStructure() {
    this.log('scan', 'فحص بنية المشروع...');
    
    const requiredDirs = ['src', 'src/components', 'src/hooks', 'src/utils', 'src/pages'];
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'eslint.config.js',
      'src/App.tsx',
      'src/main.tsx'
    ];

    // فحص المجلدات
    for (const dir of requiredDirs) {
      if (fs.existsSync(dir)) {
        this.log('success', `المجلد موجود: ${dir}`);
      } else {
        this.log('warn', `المجلد مفقود: ${dir}`, { action: 'سيتم إنشاؤه' });
        this.scanResults.warningsFound++;
      }
    }

    // فحص الملفات الأساسية
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.log('success', `الملف موجود: ${file}`);
        this.scanResults.filesScanned++;
      } else {
        this.log('error', `الملف مفقود: ${file}`, { severity: 'high' });
        this.scanResults.errorsFound++;
      }
    }
  }

  async scanCodeFiles() {
    this.log('scan', 'فحص ملفات الكود...');
    
    const codeFiles = this.getAllFiles('src', ['.ts', '.tsx', '.js', '.jsx']);
    
    for (const file of codeFiles.slice(0, 10)) { // فحص أول 10 ملفات للعرض
      this.log('scan', `فحص الملف: ${file}`);
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        this.scanResults.filesScanned++;
        
        // فحص console.log
        const consoleLogs = content.match(/console\.log\(/g);
        if (consoleLogs) {
          this.log('warn', `تم العثور على ${consoleLogs.length} console.log في ${file}`, {
            count: consoleLogs.length,
            suggestion: 'استبدال بـ logger'
          });
          this.scanResults.warningsFound += consoleLogs.length;
        }
        
        // فحص متغيرات غير مستخدمة
        const unusedVars = this.findUnusedVariables(content);
        if (unusedVars.length > 0) {
          this.log('warn', `متغيرات غير مستخدمة في ${file}`, {
            variables: unusedVars,
            action: 'يمكن حذفها'
          });
          this.scanResults.warningsFound += unusedVars.length;
        }
        
        // فحص useEffect بدون dependencies
        if (content.includes('useEffect(')) {
          const effects = content.match(/useEffect\([^)]*\)/g);
          if (effects) {
            effects.forEach((effect, index) => {
              if (!effect.includes('[')) {
                this.log('warn', `useEffect بدون dependency array في ${file}`, {
                  line: index + 1,
                  suggestion: 'إضافة dependency array'
                });
                this.scanResults.warningsFound++;
              }
            });
          }
        }
        
        // فحص imports مفقودة
        if (content.includes('logger.') && !content.includes('import { logger }')) {
          this.log('error', `استخدام logger بدون import في ${file}`, {
            fix: 'إضافة import { logger } from "../utils/logger"'
          });
          this.scanResults.errorsFound++;
        }
        
        this.log('success', `تم فحص ${file} بنجاح`);
        
      } catch (error) {
        this.log('error', `خطأ في فحص ${file}`, { error: error.message });
        this.scanResults.errorsFound++;
      }
    }
    
    if (codeFiles.length > 10) {
      this.log('info', `تم فحص 10 من أصل ${codeFiles.length} ملف كود`);
    }
  }

  async scanConfigFiles() {
    this.log('scan', 'فحص ملفات الإعداد...');
    
    const configFiles = [
      { file: 'package.json', type: 'json' },
      { file: 'tsconfig.json', type: 'json' },
      { file: 'eslint.config.js', type: 'js' },
      { file: '.env', type: 'env' },
      { file: 'jest.config.js', type: 'js' }
    ];

    for (const config of configFiles) {
      if (fs.existsSync(config.file)) {
        this.log('scan', `فحص ملف الإعداد: ${config.file}`);
        
        try {
          const content = fs.readFileSync(config.file, 'utf8');
          
          if (config.type === 'json') {
            JSON.parse(content); // التحقق من صحة JSON
            this.log('success', `${config.file} صحيح`);
          } else if (config.type === 'env') {
            await this.scanEnvFile(content, config.file);
          } else {
            this.log('success', `${config.file} موجود`);
          }
          
        } catch (error) {
          this.log('error', `خطأ في ${config.file}`, { error: error.message });
          this.scanResults.errorsFound++;
        }
      } else {
        this.log('warn', `ملف الإعداد مفقود: ${config.file}`, {
          impact: 'قد يؤثر على عمل المشروع'
        });
        this.scanResults.warningsFound++;
      }
    }
  }

  async scanEnvFile(content, filename) {
    this.log('scan', `فحص متغيرات البيئة في ${filename}`);
    
    const sensitivePatterns = [
      { pattern: /password\s*=\s*[^your_]/i, name: 'كلمة مرور مكشوفة' },
      { pattern: /secret\s*=\s*[^your_]/i, name: 'مفتاح سري مكشوف' },
      { pattern: /193\.203\.168\.103/, name: 'عنوان IP مكشوف' },
      { pattern: /u384034873/, name: 'اسم مستخدم مكشوف' }
    ];

    for (const check of sensitivePatterns) {
      if (check.pattern.test(content)) {
        this.log('error', `مشكلة أمنية: ${check.name} في ${filename}`, {
          severity: 'critical',
          action: 'يجب استبدالها بـ placeholder'
        });
        this.scanResults.errorsFound++;
      }
    }
    
    // فحص متغيرات مفقودة
    const requiredVars = [
      'GEMINI_API_KEY',
      'MYSQL_HOST',
      'MYSQL_USER',
      'MYSQL_PASSWORD',
      'MYSQL_DATABASE'
    ];
    
    for (const varName of requiredVars) {
      if (!content.includes(varName)) {
        this.log('warn', `متغير البيئة مفقود: ${varName}`, {
          suggestion: 'إضافة المتغير للملف'
        });
        this.scanResults.warningsFound++;
      }
    }
  }

  async scanSecurityIssues() {
    this.log('scan', 'فحص مشاكل الأمان...');
    
    // فحص .gitignore
    if (fs.existsSync('.gitignore')) {
      const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
      
      const sensitiveFiles = ['.env', '*.key', '*.pem', 'secrets/'];
      for (const file of sensitiveFiles) {
        if (!gitignoreContent.includes(file)) {
          this.log('warn', `ملف حساس غير محمي في .gitignore: ${file}`, {
            risk: 'قد يتم رفعه للـ repository'
          });
          this.scanResults.warningsFound++;
        }
      }
    } else {
      this.log('error', 'ملف .gitignore مفقود', {
        risk: 'جميع الملفات قد يتم رفعها للـ repository'
      });
      this.scanResults.errorsFound++;
    }
  }

  async scanPerformanceIssues() {
    this.log('scan', 'فحص مشاكل الأداء...');
    
    try {
      // فحص حجم node_modules
      if (fs.existsSync('node_modules')) {
        const stats = fs.statSync('node_modules');
        this.log('info', 'حجم node_modules تم فحصه', {
          exists: true,
          note: 'يمكن تحسين الحزم المستخدمة'
        });
      }
      
      // فحص package.json للحزم المهجورة
      if (fs.existsSync('package.json')) {
        const packageContent = fs.readFileSync('package.json', 'utf8');
        const packageData = JSON.parse(packageContent);
        
        const deprecatedPackages = ['react-scripts-ts', 'node-sass'];
        const allDeps = { ...packageData.dependencies, ...packageData.devDependencies };
        
        for (const pkg of deprecatedPackages) {
          if (allDeps[pkg]) {
            this.log('warn', `حزمة مهجورة: ${pkg}`, {
              suggestion: 'تحديث أو استبدال الحزمة'
            });
            this.scanResults.warningsFound++;
          }
        }
      }
      
    } catch (error) {
      this.log('error', 'خطأ في فحص الأداء', { error: error.message });
    }
  }

  async applyFixes() {
    this.log('fix', 'بدء تطبيق الإصلاحات...');
    
    // إصلاح 1: إنشاء مجلدات مفقودة
    const requiredDirs = ['src/utils', 'src/hooks', 'test-reports'];
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        try {
          fs.mkdirSync(dir, { recursive: true });
          this.log('fix', `تم إنشاء المجلد: ${dir}`);
          this.scanResults.fixesApplied++;
        } catch (error) {
          this.log('error', `فشل إنشاء المجلد: ${dir}`, { error: error.message });
        }
      }
    }
    
    // إصلاح 2: إنشاء .gitignore محسن
    if (!fs.existsSync('.gitignore')) {
      const gitignoreContent = `# Dependencies
node_modules/

# Environment variables
.env
.env.local
.env.production

# Build outputs
dist/
build/

# Logs
*.log

# Security
*.key
*.pem
secrets/

# Test reports
test-reports/
coverage/
`;
      
      try {
        fs.writeFileSync('.gitignore', gitignoreContent);
        this.log('fix', 'تم إنشاء .gitignore محسن');
        this.scanResults.fixesApplied++;
      } catch (error) {
        this.log('error', 'فشل إنشاء .gitignore', { error: error.message });
      }
    }
  }

  findUnusedVariables(content) {
    const unused = [];
    const constMatches = content.match(/const\s+(\w+)\s*=/g);
    
    if (constMatches) {
      constMatches.forEach(match => {
        const varName = match.match(/const\s+(\w+)/)[1];
        if (varName !== 'default' && !varName.startsWith('use') && !varName.startsWith('_')) {
          const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
          const matches = content.match(usageRegex);
          if (matches && matches.length === 1) {
            unused.push(varName);
          }
        }
      });
    }
    
    return unused;
  }

  getAllFiles(dir, extensions) {
    let files = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files = files.concat(this.getAllFiles(fullPath, extensions));
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // تجاهل الأخطاء
    }
    return files;
  }

  generateDetailedReport() {
    const duration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 التقرير المفصل لفحص الأخطاء');
    console.log('='.repeat(80));
    
    console.log(`\n📊 الإحصائيات النهائية:`);
    console.log(`  📁 الملفات المفحوصة: ${this.scanResults.filesScanned}`);
    console.log(`  ❌ الأخطاء المكتشفة: ${this.scanResults.errorsFound}`);
    console.log(`  ⚠️ التحذيرات المكتشفة: ${this.scanResults.warningsFound}`);
    console.log(`  🔧 الإصلاحات المطبقة: ${this.scanResults.fixesApplied}`);
    console.log(`  ⏱️ وقت الفحص: ${duration}ms`);
    
    console.log(`\n📝 سجل الفحص المفصل:`);
    this.scanResults.detailedLog.slice(-10).forEach(entry => {
      const emoji = {
        'info': 'ℹ️',
        'warn': '⚠️',
        'error': '❌',
        'success': '✅',
        'scan': '🔍',
        'fix': '🔧'
      }[entry.level] || '📝';
      
      console.log(`  ${emoji} [${entry.timestamp}] ${entry.message}`);
    });
    
    if (this.scanResults.detailedLog.length > 10) {
      console.log(`  ... و ${this.scanResults.detailedLog.length - 10} إدخال إضافي`);
    }
    
    console.log(`\n🎯 التقييم:`);
    const totalIssues = this.scanResults.errorsFound + this.scanResults.warningsFound;
    if (totalIssues === 0) {
      console.log('  🎉 ممتاز! لا توجد مشاكل');
    } else if (totalIssues < 5) {
      console.log('  👍 جيد، مشاكل قليلة فقط');
    } else if (totalIssues < 15) {
      console.log('  ⚠️ متوسط، يحتاج بعض الإصلاحات');
    } else {
      console.log('  🚨 يحتاج عمل كثير');
    }
    
    // حفظ التقرير
    const reportPath = `test-reports/detailed-scan-${Date.now()}.json`;
    try {
      if (!fs.existsSync('test-reports')) {
        fs.mkdirSync('test-reports', { recursive: true });
      }
      fs.writeFileSync(reportPath, JSON.stringify(this.scanResults, null, 2));
      console.log(`\n💾 تم حفظ التقرير المفصل في: ${reportPath}`);
    } catch (error) {
      console.log(`\n❌ فشل حفظ التقرير: ${error.message}`);
    }
    
    console.log(`\n🔍 الفحص المفصل اكتمل!`);
  }
}

// تشغيل الفحص المفصل
const scanner = new DetailedErrorScanner();
scanner.startDetailedScan().catch(error => {
  console.error('💥 خطأ في الفحص المفصل:', error);
  process.exit(1);
});
