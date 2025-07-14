#!/usr/bin/env node

/**
 * 🔧 إصلاح الأخطاء النحوية الناتجة عن تنظيف localStorage
 * يصلح الأقواس الإضافية والأخطاء النحوية
 */

import fs from 'fs';
import path from 'path';

class SyntaxErrorFixer {
  constructor() {
    this.fixedFiles = 0;
    this.totalFixes = 0;
  }

  log(type, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const icons = {
      info: '📝',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      fix: '🔧'
    };
    
    console.log(`${icons[type] || '📝'} [${timestamp}] ${message}`);
    if (details) {
      console.log(`   ${JSON.stringify(details, null, 2)}`);
    }
  }

  async findTSFiles() {
    const files = [];
    
    const scanDirectory = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build', '__tests__'].includes(item)) {
              scanDirectory(fullPath);
            }
          } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            if (!item.includes('.test.') && !item.includes('.spec.')) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        this.log('error', `خطأ في قراءة المجلد: ${dir}`, error.message);
      }
    };

    scanDirectory('src');
    return files;
  }

  fixFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let fileChanges = 0;

      // إصلاح الأقواس الإضافية بعد التعليقات
      const patterns = [
        {
          pattern: /\/\* localStorage\.(setItem|getItem|removeItem|clear) معطل \*\/\);/g,
          replacement: '/* localStorage.$1 معطل */',
          description: 'إزالة الأقواس الإضافية'
        },
        {
          pattern: /\/\* localStorage\.(setItem|getItem|removeItem|clear) معطل \*\/\)\s*;/g,
          replacement: '/* localStorage.$1 معطل */',
          description: 'إزالة الأقواس والفاصلة المنقوطة الإضافية'
        },
        {
          pattern: /null \/\* localStorage معطل \*\/\);/g,
          replacement: 'null /* localStorage معطل */',
          description: 'إزالة الأقواس الإضافية من null'
        },
        {
          pattern: /\/\* localStorage\.(setItem|getItem|removeItem|clear) معطل \*\/\)\s*\)/g,
          replacement: '/* localStorage.$1 معطل */',
          description: 'إزالة الأقواس المتعددة'
        }
      ];

      for (const { pattern, replacement, description } of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          newContent = newContent.replace(pattern, replacement);
          fileChanges += matches.length;
          this.log('fix', `${description}: ${matches.length} إصلاح في ${filePath}`);
        }
      }

      // حفظ الملف إذا تم تغييره
      if (fileChanges > 0) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.totalFixes += fileChanges;
        this.fixedFiles++;
        this.log('success', `تم إصلاح ${filePath}`, { changes: fileChanges });
      }

      return fileChanges;
    } catch (error) {
      this.log('error', `خطأ في معالجة ${filePath}`, error.message);
      return 0;
    }
  }

  async run() {
    this.log('info', '🔧 بدء إصلاح الأخطاء النحوية...');
    
    const files = await this.findTSFiles();
    this.log('info', `تم العثور على ${files.length} ملف للفحص`);

    for (const file of files) {
      this.fixFile(file);
    }

    this.log('success', '🎉 تم الانتهاء من الإصلاح!', {
      fixedFiles: this.fixedFiles,
      totalFixes: this.totalFixes
    });
  }
}

// تشغيل الإصلاح
const fixer = new SyntaxErrorFixer();
fixer.run().catch(console.error);
