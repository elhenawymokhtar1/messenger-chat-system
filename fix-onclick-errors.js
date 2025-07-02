/**
 * 🔧 إصلاح أخطاء onClick
 * يصلح أخطاء onClick المشوهة في جميع الملفات
 */

import fs from 'fs';
import path from 'path';

class OnClickErrorsFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
    this.totalFixed = 0;
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

  async fixAllOnClickErrors() {
    console.log('🔧 بدء إصلاح أخطاء onClick...\n');
    this.log('info', 'بدء إصلاح أخطاء onClick');

    // البحث عن جميع ملفات TypeScript/JavaScript
    const files = await this.findAllFiles();
    
    for (const file of files) {
      await this.fixFileOnClickErrors(file);
    }

    this.generateReport();
  }

  async findAllFiles() {
    const files = [];
    
    // البحث في مجلدات مختلفة
    const directories = ['src/pages', 'src/components'];
    
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        const dirFiles = fs.readdirSync(dir)
          .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
          .map(file => path.join(dir, file));
        
        files.push(...dirFiles);
      }
    }
    
    return files;
  }

  async fixFileOnClickErrors(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      let fixesApplied = 0;
      
      // البحث عن أخطاء onClick المشوهة
      const onClickErrors = content.match(/onClick=\(\(\)\s*=\s*aria-label="[^"]*">\s*[^}]+\}/g);
      
      if (onClickErrors) {
        for (const error of onClickErrors) {
          const fixed = this.fixOnClickError(error);
          if (fixed) {
            content = content.replace(error, fixed);
            fixesApplied++;
          }
        }
      }
      
      // البحث عن أنماط أخرى من الأخطاء
      const patterns = [
        // نمط: onClick={() = aria-label="{condition ?"> function()}
        {
          regex: /onClick=\(\(\)\s*=\s*aria-label="[^"]*">\s*([^}]+)\}/g,
          fix: (match, func) => `onClick={() => ${func.trim()}}`
        },
        
        // نمط: onClick={() = aria-label="{showPassword ?"> setShowPassword(!showPassword)}
        {
          regex: /onClick=\(\(\)\s*=\s*aria-label="\{[^}]+\?\s*">\s*([^}]+)\}/g,
          fix: (match, func) => `onClick={() => ${func.trim()}}`
        }
      ];
      
      for (const pattern of patterns) {
        const matches = content.match(pattern.regex);
        if (matches) {
          for (const match of matches) {
            const funcMatch = match.match(/>\s*([^}]+)\}/);
            if (funcMatch) {
              const func = funcMatch[1];
              const fixed = `onClick={() => ${func.trim()}}`;
              content = content.replace(match, fixed);
              fixesApplied++;
            }
          }
        }
      }
      
      // إصلاح aria-label المفقودة
      fixesApplied += this.addMissingAriaLabels(content, filePath);
      content = fs.readFileSync(filePath, 'utf8'); // إعادة قراءة المحتوى المحدث
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        this.totalFixed++;
        this.log('success', `تم إصلاح ${path.basename(filePath)} (${fixesApplied} إصلاحات)`);
      }
      
    } catch (error) {
      this.errors.push(`خطأ في إصلاح ${filePath}: ${error.message}`);
      this.log('fail', `فشل إصلاح ${path.basename(filePath)}`, { error: error.message });
    }
  }

  fixOnClickError(errorString) {
    // استخراج الدالة من النص المشوه
    const funcMatch = errorString.match(/>\s*([^}]+)\}/);
    if (funcMatch) {
      const func = funcMatch[1].trim();
      return `onClick={() => ${func}}`;
    }
    return null;
  }

  addMissingAriaLabels(content, filePath) {
    let fixes = 0;
    let newContent = content;
    
    // البحث عن أزرار بدون aria-label
    const buttonRegex = /<button[^>]*onClick[^>]*>/g;
    const buttons = content.match(buttonRegex);
    
    if (buttons) {
      for (const button of buttons) {
        if (!button.includes('aria-label')) {
          // تحديد نوع الزر وإضافة aria-label مناسب
          let ariaLabel = 'زر';
          
          if (button.includes('showPassword') || button.includes('password')) {
            ariaLabel = 'إظهار/إخفاء كلمة المرور';
          } else if (button.includes('submit') || button.includes('login')) {
            ariaLabel = 'تسجيل الدخول';
          } else if (button.includes('register') || button.includes('signup')) {
            ariaLabel = 'تسجيل جديد';
          } else if (button.includes('save')) {
            ariaLabel = 'حفظ';
          } else if (button.includes('cancel')) {
            ariaLabel = 'إلغاء';
          } else if (button.includes('delete')) {
            ariaLabel = 'حذف';
          } else if (button.includes('edit')) {
            ariaLabel = 'تعديل';
          }
          
          const newButton = button.replace('>', ` aria-label="${ariaLabel}">`);
          newContent = newContent.replace(button, newButton);
          fixes++;
        }
      }
    }
    
    if (fixes > 0) {
      fs.writeFileSync(filePath, newContent);
      this.fixes.push(`${path.basename(filePath)}: إضافة ${fixes} aria-labels`);
    }
    
    return fixes;
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 تقرير إصلاح أخطاء onClick');
    console.log('='.repeat(80));
    
    console.log(`\n📊 الإحصائيات النهائية:`);
    console.log(`  📄 الملفات المُصلحة: ${this.totalFixed}`);
    console.log(`  ✅ الإصلاحات المطبقة: ${this.fixes.length}`);
    console.log(`  ❌ الأخطاء: ${this.errors.length}`);
    
    if (this.fixes.length > 0) {
      console.log(`\n✅ الإصلاحات المطبقة:`);
      this.fixes.forEach(fix => {
        console.log(`  • ${fix}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ الأخطاء:`);
      this.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    console.log(`\n🎯 النتيجة:`);
    if (this.fixes.length > 0 && this.errors.length === 0) {
      console.log('  🎉 تم إصلاح جميع أخطاء onClick بنجاح!');
    } else if (this.fixes.length > 0) {
      console.log(`  👍 تم إصلاح ${this.fixes.length} مشاكل`);
    } else {
      console.log('  ℹ️ لم يتم العثور على أخطاء onClick');
    }
    
    console.log(`\n💡 التوصيات:`);
    console.log('  • إعادة تشغيل البناء: npm run build');
    console.log('  • تشغيل الخادم: npm run dev');
    console.log('  • اختبار الصفحات المُصلحة');
    
    console.log(`\n🔧 إصلاح أخطاء onClick اكتمل!`);
  }
}

// تشغيل إصلاح أخطاء onClick
const fixer = new OnClickErrorsFixer();
fixer.fixAllOnClickErrors().catch(error => {
  console.error('💥 خطأ في إصلاح أخطاء onClick:', error);
  process.exit(1);
});
