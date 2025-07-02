/**
 * 🔧 إصلاح جميع صفحات الموقع
 * يصلح المشاكل الشائعة في جميع الصفحات
 */

import fs from 'fs';
import path from 'path';

class AllPagesFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
    this.totalFixed = 0;
    this.totalPages = 0;
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

  async fixAllPages() {
    console.log('🔧 بدء إصلاح جميع صفحات الموقع...\n');
    this.log('info', 'بدء الإصلاح الشامل لجميع الصفحات');

    // 1. اكتشاف جميع الصفحات
    const pages = await this.discoverPages();
    this.totalPages = pages.length;
    
    // 2. إصلاح كل صفحة
    for (const page of pages) {
      await this.fixPage(page);
    }

    this.generateReport();
  }

  async discoverPages() {
    const pages = [];
    
    // البحث في مجلد pages
    const pagesDir = 'src/pages';
    if (fs.existsSync(pagesDir)) {
      const pageFiles = fs.readdirSync(pagesDir).filter(file => 
        file.endsWith('.tsx') || file.endsWith('.ts')
      );
      
      pageFiles.forEach(file => {
        pages.push({
          name: file.replace(/\.(tsx|ts)$/, ''),
          path: path.join(pagesDir, file),
          type: 'page'
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
        pages.push({
          name: file.replace(/\.(tsx|ts)$/, ''),
          path: path.join(componentsDir, file),
          type: 'component-page'
        });
      });
    }
    
    return pages;
  }

  async fixPage(page) {
    this.log('fix', `إصلاح الصفحة: ${page.name}`);
    
    try {
      if (!fs.existsSync(page.path)) {
        this.log('warn', `الصفحة مفقودة: ${page.name}`);
        return;
      }
      
      let content = fs.readFileSync(page.path, 'utf8');
      let originalContent = content;
      let fixesApplied = 0;
      
      // إصلاح 1: إضافة React imports المفقودة
      fixesApplied += this.fixReactImports(content, page);
      content = this.getUpdatedContent(page.path);
      
      // إصلاح 2: إضافة main element
      fixesApplied += this.fixMainElement(content, page);
      content = this.getUpdatedContent(page.path);
      
      // إصلاح 3: إضافة aria-labels للأزرار
      fixesApplied += this.fixAriaLabels(content, page);
      content = this.getUpdatedContent(page.path);
      
      // إصلاح 4: تنظيف console.log
      fixesApplied += this.fixConsoleLogs(content, page);
      content = this.getUpdatedContent(page.path);
      
      if (fixesApplied > 0) {
        this.totalFixed++;
        this.log('success', `تم إصلاح ${page.name} (${fixesApplied} إصلاحات)`);
      } else {
        this.log('info', `${page.name}: لا يحتاج إصلاح`);
      }
      
    } catch (error) {
      this.errors.push(`خطأ في إصلاح ${page.name}: ${error.message}`);
      this.log('fail', `فشل إصلاح ${page.name}`, { error: error.message });
    }
  }

  getUpdatedContent(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      return '';
    }
  }

  fixReactImports(content, page) {
    let fixes = 0;
    let newContent = content;
    
    // فحص useState
    if (content.includes('useState') && !content.includes('import { useState')) {
      if (content.includes('import React from')) {
        newContent = newContent.replace(
          'import React from \'react\';',
          'import React, { useState } from \'react\';'
        );
      } else if (content.includes('import React, {')) {
        newContent = newContent.replace(
          'import React, {',
          'import React, { useState,'
        );
      } else {
        newContent = 'import React, { useState } from \'react\';\n' + newContent;
      }
      fixes++;
    }
    
    // فحص useEffect
    if (content.includes('useEffect') && !content.includes('import { useEffect')) {
      if (newContent.includes('import React, { useState }')) {
        newContent = newContent.replace(
          'import React, { useState }',
          'import React, { useState, useEffect }'
        );
      } else if (newContent.includes('import React, {')) {
        newContent = newContent.replace(
          'import React, {',
          'import React, { useEffect,'
        );
      } else {
        newContent = 'import React, { useEffect } from \'react\';\n' + newContent;
      }
      fixes++;
    }
    
    if (fixes > 0) {
      fs.writeFileSync(page.path, newContent);
      this.fixes.push(`${page.name}: إضافة React imports`);
    }
    
    return fixes;
  }

  fixMainElement(content, page) {
    let fixes = 0;
    
    if (!content.includes('<main>') && !content.includes('role="main"')) {
      let newContent = content;
      
      // البحث عن div الرئيسي وإضافة role="main"
      const divMatches = content.match(/<div className="[^"]*">/g);
      if (divMatches && divMatches.length > 0) {
        const firstDiv = divMatches[0];
        const newDiv = firstDiv.replace('>', ' role="main">');
        newContent = newContent.replace(firstDiv, newDiv);
        
        fs.writeFileSync(page.path, newContent);
        this.fixes.push(`${page.name}: إضافة main element`);
        fixes++;
      }
    }
    
    return fixes;
  }

  fixAriaLabels(content, page) {
    let fixes = 0;
    let newContent = content;
    
    // البحث عن أزرار بدون aria-label
    const buttonMatches = content.match(/<button[^>]*>/g);
    if (buttonMatches) {
      buttonMatches.forEach(button => {
        if (!button.includes('aria-label')) {
          // استخراج النص من الزر
          const buttonText = this.extractButtonText(content, button);
          if (buttonText) {
            const newButton = button.replace('>', ` aria-label="${buttonText}">`);
            newContent = newContent.replace(button, newButton);
            fixes++;
          }
        }
      });
    }
    
    if (fixes > 0) {
      fs.writeFileSync(page.path, newContent);
      this.fixes.push(`${page.name}: إضافة aria-labels (${fixes} أزرار)`);
    }
    
    return fixes;
  }

  extractButtonText(content, buttonTag) {
    const buttonIndex = content.indexOf(buttonTag);
    const closingTag = content.indexOf('</button>', buttonIndex);
    
    if (closingTag !== -1) {
      const buttonContent = content.substring(buttonIndex + buttonTag.length, closingTag);
      // استخراج النص البسيط
      const textMatch = buttonContent.match(/>([^<]+)</);
      if (textMatch) {
        return textMatch[1].trim();
      }
      
      // إذا لم يوجد نص، استخدم نص افتراضي
      if (buttonContent.includes('login') || buttonContent.includes('تسجيل الدخول')) {
        return 'تسجيل الدخول';
      } else if (buttonContent.includes('register') || buttonContent.includes('تسجيل')) {
        return 'تسجيل جديد';
      } else if (buttonContent.includes('save') || buttonContent.includes('حفظ')) {
        return 'حفظ';
      } else if (buttonContent.includes('submit') || buttonContent.includes('إرسال')) {
        return 'إرسال';
      }
    }
    
    return 'زر';
  }

  fixConsoleLogs(content, page) {
    let fixes = 0;
    
    const consoleLogs = content.match(/console\.log\(/g);
    if (consoleLogs && consoleLogs.length > 3) {
      let newContent = content;
      
      // استبدال console.log بـ logger أو تعليق
      newContent = newContent.replace(/console\.log\(/g, '// console.log(');
      
      fs.writeFileSync(page.path, newContent);
      this.fixes.push(`${page.name}: تنظيف console.log (${consoleLogs.length} statements)`);
      fixes++;
    }
    
    return fixes;
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 تقرير إصلاح جميع الصفحات');
    console.log('='.repeat(80));
    
    console.log(`\n📊 الإحصائيات النهائية:`);
    console.log(`  📄 إجمالي الصفحات: ${this.totalPages}`);
    console.log(`  🔧 الصفحات المُصلحة: ${this.totalFixed}`);
    console.log(`  ✅ الإصلاحات المطبقة: ${this.fixes.length}`);
    console.log(`  ❌ الأخطاء: ${this.errors.length}`);
    
    if (this.fixes.length > 0) {
      console.log(`\n✅ الإصلاحات المطبقة:`);
      // عرض أول 20 إصلاح
      this.fixes.slice(0, 20).forEach(fix => {
        console.log(`  • ${fix}`);
      });
      
      if (this.fixes.length > 20) {
        console.log(`  ... و ${this.fixes.length - 20} إصلاحات أخرى`);
      }
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ الأخطاء:`);
      this.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    // تجميع أنواع الإصلاحات
    const fixTypes = {};
    this.fixes.forEach(fix => {
      const type = fix.split(':')[1]?.trim() || 'أخرى';
      fixTypes[type] = (fixTypes[type] || 0) + 1;
    });
    
    console.log(`\n📈 أنواع الإصلاحات:`);
    Object.entries(fixTypes).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count} مرة`);
    });
    
    console.log(`\n🎯 النتيجة:`);
    const successRate = Math.round((this.totalFixed / this.totalPages) * 100);
    
    if (successRate >= 90) {
      console.log('  🎉 ممتاز! تم إصلاح معظم الصفحات');
    } else if (successRate >= 70) {
      console.log('  👍 جيد، تم إصلاح نسبة كبيرة من الصفحات');
    } else if (successRate >= 50) {
      console.log('  ⚠️ متوسط، تم إصلاح نصف الصفحات');
    } else {
      console.log('  🚨 يحتاج المزيد من العمل');
    }
    
    console.log(`\n💡 التوصيات:`);
    console.log('  • إعادة تشغيل فحص الصفحات: node all-pages-scanner.js');
    console.log('  • فحص صفحة محددة: node page-specific-tester.js [URL]');
    console.log('  • اختبار الموقع: npm run dev');
    
    console.log(`\n🔧 إصلاح جميع الصفحات اكتمل!`);
  }
}

// تشغيل إصلاح جميع الصفحات
const fixer = new AllPagesFixer();
fixer.fixAllPages().catch(error => {
  console.error('💥 خطأ في إصلاح الصفحات:', error);
  process.exit(1);
});
