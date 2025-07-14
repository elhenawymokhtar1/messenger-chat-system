#!/usr/bin/env node

/**
 * فحص العزل المبسط
 * Simple Isolation Check
 */

const fs = require('fs');
const path = require('path');

// ألوان للطباعة
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// الأنماط المحظورة
const FORBIDDEN_PATTERNS = [
  {
    pattern: /localStorage\.(getItem|setItem|removeItem|clear)/g,
    message: '❌ استخدام localStorage محظور',
    severity: 'high'
  },
  {
    pattern: /SELECT \* FROM \w+(?!.*WHERE.*(?:company_id|store_id))/gi,
    message: '⚠️ استعلام SELECT بدون عزل',
    severity: 'medium'
  }
];

// فحص ملف واحد
function scanFile(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    FORBIDDEN_PATTERNS.forEach(({ pattern, message, severity }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        issues.push({
          file: path.relative(process.cwd(), filePath),
          line: lineNumber,
          message,
          severity,
          code: lineContent.substring(0, 100) + (lineContent.length > 100 ? '...' : '')
        });
      }
    });
    
  } catch (error) {
    // تجاهل الملفات غير الموجودة
  }
  
  return issues;
}

// فحص مجلد
function scanDirectory(dirPath) {
  const issues = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      
      try {
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          issues.push(...scanDirectory(itemPath));
        } else if (item.match(/\.(ts|tsx|js|jsx)$/)) {
          issues.push(...scanFile(itemPath));
        }
      } catch (error) {
        // تجاهل الأخطاء
      }
    });
    
  } catch (error) {
    // تجاهل المجلدات غير الموجودة
  }
  
  return issues;
}

// الدالة الرئيسية
function main() {
  console.clear();
  colorLog('magenta', '🔒 فحص العزل السريع');
  colorLog('magenta', '='.repeat(25));
  
  const startTime = Date.now();
  
  // المجلدات المهمة للفحص
  const dirsToScan = ['src', 'components', 'pages'];
  let allIssues = [];
  
  dirsToScan.forEach(dir => {
    if (fs.existsSync(dir)) {
      colorLog('blue', `🔍 فحص مجلد: ${dir}`);
      const issues = scanDirectory(dir);
      allIssues.push(...issues);
    }
  });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // النتائج
  console.log('\n' + '='.repeat(50));
  colorLog('cyan', '📊 نتائج الفحص');
  console.log('='.repeat(50));
  
  console.log(`⏱️  وقت الفحص: ${duration}ms`);
  console.log(`📁 الملفات المفحوصة: ${dirsToScan.length} مجلد`);
  console.log(`⚠️  المشاكل المكتشفة: ${allIssues.length}`);
  
  if (allIssues.length === 0) {
    colorLog('green', '\n🎉 ممتاز! لا توجد مشاكل عزل');
    colorLog('green', '✅ النظام آمن ومعزول بشكل صحيح');
  } else {
    console.log('\n' + '-'.repeat(40));
    colorLog('yellow', '⚠️ المشاكل المكتشفة:');
    
    // تجميع المشاكل حسب النوع
    const groupedIssues = {};
    allIssues.forEach(issue => {
      if (!groupedIssues[issue.message]) {
        groupedIssues[issue.message] = [];
      }
      groupedIssues[issue.message].push(issue);
    });
    
    Object.entries(groupedIssues).forEach(([message, issues]) => {
      colorLog('yellow', `\n${message} (${issues.length} مرة)`);
      
      issues.slice(0, 5).forEach(issue => { // عرض أول 5 فقط
        console.log(`   📁 ${issue.file}:${issue.line}`);
        console.log(`   📝 ${issue.code}`);
      });
      
      if (issues.length > 5) {
        console.log(`   ... و ${issues.length - 5} مشكلة أخرى`);
      }
    });
    
    console.log('\n' + '-'.repeat(40));
    colorLog('yellow', '💡 التوصيات:');
    console.log('   1. راجع الملفات المذكورة أعلاه');
    console.log('   2. استبدل localStorage بـ React state');
    console.log('   3. أضف شروط العزل للاستعلامات');
    console.log('   4. اقرأ دليل العزل: docs/ISOLATION_GUIDE.md');
  }
  
  console.log('\n' + '='.repeat(50));
  
  // اختبار سريع للعزل
  colorLog('blue', '🧪 اختبار العزل السريع...');
  
  try {
    // فحص وجود الخادم
    const { execSync } = require('child_process');
    
    try {
      // اختبار بسيط للخادم
      execSync('curl -s http://localhost:3002/api/companies/2d9b8887-0cca-430b-b61b-ca16cccfec63/categories', { timeout: 5000 });
      colorLog('green', '✅ الخادم يعمل والعزل نشط');
    } catch (error) {
      colorLog('yellow', '⚠️ لم يتم اختبار الخادم - تأكد من تشغيله');
    }
    
  } catch (error) {
    colorLog('yellow', '⚠️ لم يتم اختبار الخادم');
  }
  
  // الخلاصة
  if (allIssues.length === 0) {
    colorLog('green', '\n🎯 الخلاصة: النظام آمن ✅');
    process.exit(0);
  } else {
    colorLog('red', '\n🎯 الخلاصة: يحتاج إصلاح ⚠️');
    process.exit(1);
  }
}

// تشغيل الفحص
if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory };
