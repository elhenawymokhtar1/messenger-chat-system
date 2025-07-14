#!/usr/bin/env node

/**
 * 🔧 إصلاح معرفات الشركة
 * يستبدل جميع معرفات الشركة القديمة بمعرف شركة kok@kok.com الثابت
 */

import fs from 'fs';
import path from 'path';

class CompanyIdFixer {
  constructor() {
    this.fixedFiles = 0;
    this.totalFixes = 0;
    this.oldCompanyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';
    this.newCompanyId = '2d9b8887-0cca-430b-b61b-ca16cccfec63';
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
      
      // التحقق من وجود المعرف القديم
      if (!content.includes(this.oldCompanyId)) {
        return 0;
      }

      // استبدال جميع المعرفات القديمة
      const newContent = content.replace(new RegExp(this.oldCompanyId, 'g'), this.newCompanyId);
      
      // حساب عدد التغييرات
      const matches = content.match(new RegExp(this.oldCompanyId, 'g'));
      const changeCount = matches ? matches.length : 0;

      if (changeCount > 0) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.totalFixes += changeCount;
        this.fixedFiles++;
        this.log('fix', `تم إصلاح ${changeCount} معرف في ${filePath}`);
      }

      return changeCount;
    } catch (error) {
      this.log('error', `خطأ في معالجة ${filePath}`, error.message);
      return 0;
    }
  }

  async run() {
    this.log('info', '🔧 بدء إصلاح معرفات الشركة...');
    this.log('info', `استبدال: ${this.oldCompanyId} → ${this.newCompanyId}`);
    
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
const fixer = new CompanyIdFixer();
fixer.run().catch(console.error);
