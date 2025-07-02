/**
 * 🔧 إصلاح مشاكل الـ imports
 * يحل مشاكل useState المتعددة والـ imports غير المستخدمة
 */

import fs from 'fs';
import path from 'path';

class ImportsIssuesFixer {
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

  async fixAllImportsIssues() {
    console.log('🔧 بدء إصلاح مشاكل الـ imports...\n');
    this.log('info', 'بدء إصلاح مشاكل الـ imports');

    // البحث عن جميع ملفات TypeScript/JavaScript
    const files = await this.findAllFiles();
    
    for (const file of files) {
      await this.fixFileImports(file);
    }

    this.generateReport();
  }

  async findAllFiles() {
    const files = [];
    
    // البحث في مجلدات مختلفة
    const directories = ['src/pages', 'src/components', 'src/hooks', 'src/services'];
    
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

  async fixFileImports(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      let fixesApplied = 0;
      
      // إصلاح 1: useState متعدد
      fixesApplied += this.fixDuplicateUseState(content, filePath);
      content = fs.readFileSync(filePath, 'utf8');
      
      // إصلاح 2: useEffect متعدد
      fixesApplied += this.fixDuplicateUseEffect(content, filePath);
      content = fs.readFileSync(filePath, 'utf8');
      
      // إصلاح 3: imports غير مستخدمة
      fixesApplied += this.removeUnusedImports(content, filePath);
      content = fs.readFileSync(filePath, 'utf8');
      
      // إصلاح 4: تنظيم imports
      fixesApplied += this.organizeImports(content, filePath);
      
      if (fixesApplied > 0) {
        this.totalFixed++;
        this.log('success', `تم إصلاح ${path.basename(filePath)} (${fixesApplied} إصلاحات)`);
      }
      
    } catch (error) {
      this.errors.push(`خطأ في إصلاح ${filePath}: ${error.message}`);
      this.log('fail', `فشل إصلاح ${path.basename(filePath)}`, { error: error.message });
    }
  }

  fixDuplicateUseState(content, filePath) {
    let fixes = 0;
    
    // البحث عن useState متعدد في نفس السطر
    const useStateMatches = content.match(/import.*useState.*useState/g);
    if (useStateMatches) {
      let newContent = content;
      
      // إصلاح useState المتعدد
      newContent = newContent.replace(
        /import\s+React,?\s*\{\s*useState,?\s*useState,?\s*([^}]*)\s*\}/g,
        'import React, { useState, $1 }'
      );
      
      // إزالة الفواصل الزائدة
      newContent = newContent.replace(/,\s*,/g, ',');
      newContent = newContent.replace(/\{\s*,/g, '{');
      newContent = newContent.replace(/,\s*\}/g, '}');
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        this.fixes.push(`${path.basename(filePath)}: إصلاح useState المتعدد`);
        fixes++;
      }
    }
    
    return fixes;
  }

  fixDuplicateUseEffect(content, filePath) {
    let fixes = 0;
    
    // البحث عن useEffect متعدد
    const useEffectMatches = content.match(/import.*useEffect.*useEffect/g);
    if (useEffectMatches) {
      let newContent = content;
      
      // إصلاح useEffect المتعدد
      newContent = newContent.replace(
        /import\s+React,?\s*\{\s*([^}]*),?\s*useEffect,?\s*useEffect,?\s*([^}]*)\s*\}/g,
        'import React, { $1, useEffect, $2 }'
      );
      
      // تنظيف الفواصل
      newContent = newContent.replace(/,\s*,/g, ',');
      newContent = newContent.replace(/\{\s*,/g, '{');
      newContent = newContent.replace(/,\s*\}/g, '}');
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        this.fixes.push(`${path.basename(filePath)}: إصلاح useEffect المتعدد`);
        fixes++;
      }
    }
    
    return fixes;
  }

  removeUnusedImports(content, filePath) {
    let fixes = 0;
    let newContent = content;
    
    // قائمة الـ imports المحتملة غير المستخدمة
    const potentialUnusedImports = [
      'useNavigate',
      'useLocation',
      'useParams',
      'useMemo',
      'useCallback',
      'useRef',
      'useContext'
    ];
    
    for (const importName of potentialUnusedImports) {
      // فحص إذا كان الـ import موجود لكن غير مستخدم
      if (content.includes(importName) && content.includes(`import`)) {
        const importRegex = new RegExp(`import.*${importName}`, 'g');
        const usageRegex = new RegExp(`${importName}\\s*\\(`, 'g');
        
        const hasImport = importRegex.test(content);
        const hasUsage = usageRegex.test(content);
        
        if (hasImport && !hasUsage) {
          // إزالة الـ import غير المستخدم
          newContent = newContent.replace(
            new RegExp(`,?\\s*${importName}\\s*,?`, 'g'),
            ''
          );
          
          // تنظيف الفواصل الزائدة
          newContent = newContent.replace(/,\s*,/g, ',');
          newContent = newContent.replace(/\{\s*,/g, '{');
          newContent = newContent.replace(/,\s*\}/g, '}');
          
          this.fixes.push(`${path.basename(filePath)}: إزالة ${importName} غير المستخدم`);
          fixes++;
        }
      }
    }
    
    if (fixes > 0) {
      fs.writeFileSync(filePath, newContent);
    }
    
    return fixes;
  }

  organizeImports(content, filePath) {
    let fixes = 0;
    let newContent = content;
    
    // تنظيم imports React
    const reactImportRegex = /import\s+React,?\s*\{([^}]*)\}\s*from\s*['"]react['"];?/g;
    const reactImportMatch = reactImportRegex.exec(content);
    
    if (reactImportMatch) {
      const imports = reactImportMatch[1]
        .split(',')
        .map(imp => imp.trim())
        .filter(imp => imp.length > 0)
        .filter((imp, index, arr) => arr.indexOf(imp) === index) // إزالة المتكررات
        .sort();
      
      if (imports.length > 0) {
        const newImport = `import React, { ${imports.join(', ')} } from 'react';`;
        newContent = newContent.replace(reactImportRegex, newImport);
        
        if (newContent !== content) {
          fs.writeFileSync(filePath, newContent);
          this.fixes.push(`${path.basename(filePath)}: تنظيم React imports`);
          fixes++;
        }
      }
    }
    
    return fixes;
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 تقرير إصلاح مشاكل الـ imports');
    console.log('='.repeat(80));
    
    console.log(`\n📊 الإحصائيات النهائية:`);
    console.log(`  📄 الملفات المُصلحة: ${this.totalFixed}`);
    console.log(`  ✅ الإصلاحات المطبقة: ${this.fixes.length}`);
    console.log(`  ❌ الأخطاء: ${this.errors.length}`);
    
    if (this.fixes.length > 0) {
      console.log(`\n✅ الإصلاحات المطبقة:`);
      this.fixes.slice(0, 15).forEach(fix => {
        console.log(`  • ${fix}`);
      });
      
      if (this.fixes.length > 15) {
        console.log(`  ... و ${this.fixes.length - 15} إصلاحات أخرى`);
      }
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ الأخطاء:`);
      this.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    console.log(`\n🎯 النتيجة:`);
    if (this.fixes.length > 0 && this.errors.length === 0) {
      console.log('  🎉 تم إصلاح جميع مشاكل الـ imports بنجاح!');
    } else if (this.fixes.length > 0) {
      console.log(`  👍 تم إصلاح ${this.fixes.length} مشاكل`);
    } else {
      console.log('  ℹ️ لم يتم العثور على مشاكل imports');
    }
    
    console.log(`\n💡 التوصيات:`);
    console.log('  • إعادة تشغيل الخادم: npm run dev');
    console.log('  • فحص الأخطاء: npm run build');
    console.log('  • اختبار الصفحات المُصلحة');
    
    console.log(`\n🔧 إصلاح مشاكل الـ imports اكتمل!`);
  }
}

// تشغيل إصلاح مشاكل الـ imports
const fixer = new ImportsIssuesFixer();
fixer.fixAllImportsIssues().catch(error => {
  console.error('💥 خطأ في إصلاح مشاكل الـ imports:', error);
  process.exit(1);
});
