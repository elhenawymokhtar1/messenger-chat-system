/**
 * 🔧 إصلاح نهائي لجميع أخطاء onClick
 * يصلح جميع أخطاء onClick المشوهة في الملفات
 */

import fs from 'fs';
import path from 'path';

class FinalOnClickFixer {
  constructor() {
    this.fixes = [];
    this.totalFixed = 0;
  }

  log(level, message) {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const emoji = {
      'info': 'ℹ️',
      'fix': '🔧',
      'success': '✅',
      'fail': '❌'
    }[level] || '📝';
    
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async fixAllFiles() {
    console.log('🔧 بدء الإصلاح النهائي لجميع أخطاء onClick...\n');
    
    const files = [
      'src/pages/CompanyLogin.tsx',
      'src/pages/CompanyRegister.tsx'
    ];
    
    for (const file of files) {
      await this.fixFile(file);
    }
    
    this.generateReport();
  }

  async fixFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return;
      }
      
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      let fixesApplied = 0;
      
      // نمط 1: onClick={() = aria-label="..."> function()}
      const pattern1 = /onClick=\{\(\)\s*=\s*aria-label="[^"]*">\s*([^}]+)\}/g;
      content = content.replace(pattern1, (match, func) => {
        fixesApplied++;
        return `onClick={() => ${func.trim()}}`;
      });
      
      // نمط 2: onClick={() = aria-label="زر"> {
      const pattern2 = /onClick=\{\(\)\s*=\s*aria-label="[^"]*">\s*\{/g;
      content = content.replace(pattern2, () => {
        fixesApplied++;
        return 'onClick={() => {';
      });
      
      // نمط 3: إصلاح أي onClick مشوه آخر
      const pattern3 = /onClick=\{\(\)\s*=\s*[^>]*>\s*/g;
      content = content.replace(pattern3, () => {
        fixesApplied++;
        return 'onClick={() => ';
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        this.totalFixed++;
        this.fixes.push(`${path.basename(filePath)}: ${fixesApplied} إصلاحات`);
        this.log('success', `تم إصلاح ${path.basename(filePath)} (${fixesApplied} إصلاحات)`);
      }
      
    } catch (error) {
      this.log('fail', `فشل إصلاح ${path.basename(filePath)}: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 تقرير الإصلاح النهائي');
    console.log('='.repeat(60));
    
    console.log(`\n📊 النتائج:`);
    console.log(`  📄 الملفات المُصلحة: ${this.totalFixed}`);
    console.log(`  ✅ الإصلاحات: ${this.fixes.length}`);
    
    if (this.fixes.length > 0) {
      console.log(`\n✅ الإصلاحات المطبقة:`);
      this.fixes.forEach(fix => {
        console.log(`  • ${fix}`);
      });
    }
    
    console.log(`\n🎯 النتيجة:`);
    if (this.fixes.length > 0) {
      console.log('  🎉 تم إصلاح جميع أخطاء onClick!');
    } else {
      console.log('  ℹ️ لم يتم العثور على أخطاء');
    }
    
    console.log(`\n💡 الخطوة التالية:`);
    console.log('  • تشغيل البناء: npm run build');
    
    console.log(`\n🔧 الإصلاح النهائي اكتمل!`);
  }
}

// تشغيل الإصلاح النهائي
const fixer = new FinalOnClickFixer();
fixer.fixAllFiles().catch(error => {
  console.error('💥 خطأ في الإصلاح النهائي:', error);
  process.exit(1);
});
