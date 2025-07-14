#!/usr/bin/env node

/**
 * 🧹 تنظيف localStorage من جميع ملفات التطبيق
 * يستبدل جميع استخدامات localStorage بتعليقات أو كود معطل
 */

import fs from 'fs';
import path from 'path';

class LocalStorageCleanup {
  constructor() {
    this.processedFiles = 0;
    this.changesCount = 0;
    this.patterns = [
      // أنماط localStorage الشائعة
      {
        pattern: /localStorage\.getItem\([^)]+\)/g,
        replacement: 'null /* localStorage معطل */',
        description: 'localStorage.getItem'
      },
      {
        pattern: /localStorage\.setItem\([^)]+\);?/g,
        replacement: '/* localStorage.setItem معطل */',
        description: 'localStorage.setItem'
      },
      {
        pattern: /localStorage\.removeItem\([^)]+\);?/g,
        replacement: '/* localStorage.removeItem معطل */',
        description: 'localStorage.removeItem'
      },
      {
        pattern: /localStorage\.clear\(\);?/g,
        replacement: '/* localStorage.clear معطل */',
        description: 'localStorage.clear'
      },
      // أنماط أكثر تعقيداً
      {
        pattern: /const\s+\w+\s*=\s*localStorage\.getItem\([^)]+\);?/g,
        replacement: (match) => {
          const varName = match.match(/const\s+(\w+)/)?.[1];
          return `const ${varName} = null; /* localStorage معطل */`;
        },
        description: 'const variable = localStorage.getItem'
      },
      {
        pattern: /if\s*\(\s*localStorage\.getItem\([^)]+\)\s*\)/g,
        replacement: 'if (false /* localStorage معطل */)',
        description: 'if localStorage.getItem condition'
      }
    ];
  }

  log(type, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const icons = {
      info: '📝',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      clean: '🧹'
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
            // تجاهل مجلدات معينة
            if (!['node_modules', '.git', 'dist', 'build', '__tests__'].includes(item)) {
              scanDirectory(fullPath);
            }
          } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            // تجاهل ملفات الاختبار
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

  cleanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let fileChanges = 0;

      // تطبيق جميع الأنماط
      for (const { pattern, replacement, description } of this.patterns) {
        const matches = content.match(pattern);
        if (matches) {
          if (typeof replacement === 'function') {
            newContent = newContent.replace(pattern, replacement);
          } else {
            newContent = newContent.replace(pattern, replacement);
          }
          
          fileChanges += matches.length;
          this.log('clean', `${description}: ${matches.length} تغيير في ${filePath}`);
        }
      }

      // حفظ الملف إذا تم تغييره
      if (fileChanges > 0) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.changesCount += fileChanges;
        this.log('success', `تم تنظيف ${filePath}`, { changes: fileChanges });
      }

      this.processedFiles++;
      return fileChanges;
    } catch (error) {
      this.log('error', `خطأ في معالجة ${filePath}`, error.message);
      return 0;
    }
  }

  async run() {
    this.log('info', '🧹 بدء تنظيف localStorage من جميع الملفات...');
    
    const files = await this.findTSFiles();
    this.log('info', `تم العثور على ${files.length} ملف للمعالجة`);

    for (const file of files) {
      this.cleanFile(file);
    }

    this.log('success', '🎉 تم الانتهاء من التنظيف!', {
      processedFiles: this.processedFiles,
      totalChanges: this.changesCount
    });
  }
}

// تشغيل التنظيف
const cleanup = new LocalStorageCleanup();
cleanup.run().catch(console.error);
