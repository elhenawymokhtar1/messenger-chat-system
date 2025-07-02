#!/usr/bin/env node

/**
 * 🔍 أداة فحص JSX متقدمة
 */

import fs from 'fs';

function validateJSX(filePath) {
  console.log(`🔍 فحص JSX في ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ الملف غير موجود: ${filePath}`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const stack = [];
  const errors = [];
  let isValid = true;
  
  // تحليل JSX tags
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // البحث عن JSX tags
    const tagMatches = line.match(/<[^>]+>/g) || [];
    
    for (const tag of tagMatches) {
      // تجاهل التعليقات
      if (tag.includes('<!--') || tag.includes('-->')) continue;
      
      // Self-closing tags
      if (tag.endsWith('/>')) {
        console.log(`✅ السطر ${lineNumber}: Self-closing tag: ${tag}`);
        continue;
      }
      
      // Closing tags
      if (tag.startsWith('</')) {
        const tagName = tag.match(/<\/([^>]+)>/)?.[1];
        if (tagName) {
          const lastOpen = stack.pop();
          if (!lastOpen) {
            errors.push(`❌ السطر ${lineNumber}: Closing tag بدون opening tag: ${tag}`);
            isValid = false;
          } else if (lastOpen.name !== tagName) {
            errors.push(`❌ السطر ${lineNumber}: Mismatched tags: expected </${lastOpen.name}> but found ${tag}`);
            isValid = false;
          } else {
            console.log(`✅ السطر ${lineNumber}: Matched ${lastOpen.name} (opened at line ${lastOpen.line})`);
          }
        }
        continue;
      }
      
      // Opening tags
      const tagName = tag.match(/<([^>\s]+)/)?.[1];
      if (tagName) {
        // تجاهل HTML void elements
        const voidElements = ['img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
        if (!voidElements.includes(tagName.toLowerCase())) {
          stack.push({ name: tagName, line: lineNumber, tag });
          console.log(`📝 السطر ${lineNumber}: Opening tag: ${tag}`);
        } else {
          console.log(`✅ السطر ${lineNumber}: Void element: ${tag}`);
        }
      }
    }
  }
  
  // فحص tags غير مغلقة
  if (stack.length > 0) {
    for (const unclosed of stack) {
      errors.push(`❌ السطر ${unclosed.line}: Unclosed tag: ${unclosed.tag}`);
      isValid = false;
    }
  }
  
  // فحص الأقواس المجعدة
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push(`❌ عدم توازن الأقواس المجعدة: ${openBraces} مفتوحة، ${closeBraces} مغلقة`);
    isValid = false;
  }
  
  // فحص الأقواس العادية
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  
  if (openParens !== closeParens) {
    errors.push(`❌ عدم توازن الأقواس العادية: ${openParens} مفتوحة، ${closeParens} مغلقة`);
    isValid = false;
  }
  
  // النتيجة
  if (isValid) {
    console.log(`✅ ${filePath}: JSX صحيح`);
  } else {
    console.log(`❌ ${filePath}: يحتوي على أخطاء JSX`);
    errors.forEach(error => console.log(`   ${error}`));
  }
  
  return isValid;
}

function fixJSXFile(filePath) {
  console.log(`🔧 إصلاح JSX في ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ الملف غير موجود: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fixed = false;
  
  // إزالة console.log
  const originalConsoleCount = (content.match(/console\.log/g) || []).length;
  content = content.replace(/\s*console\.log\([^)]*\);?\s*/g, '');
  const newConsoleCount = (content.match(/console\.log/g) || []).length;
  
  if (originalConsoleCount > newConsoleCount) {
    console.log(`🧹 تم إزالة ${originalConsoleCount - newConsoleCount} console.log`);
    fixed = true;
  }
  
  // إصلاح المسافات
  const originalLength = content.length;
  content = content.replace(/\s+$/gm, ''); // إزالة مسافات نهاية السطر
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n'); // إصلاح أسطر فارغة متعددة
  
  if (!content.endsWith('\n')) {
    content += '\n';
  }
  
  if (content.length !== originalLength) {
    console.log(`🧹 تم تنظيف المسافات`);
    fixed = true;
  }
  
  // حفظ الملف إذا تم إصلاحه
  if (fixed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ تم حفظ ${filePath} بعد الإصلاح`);
  }
  
  return fixed;
}

// الملفات المراد فحصها
const filesToCheck = [
  'src/components/ProtectedRoute.tsx',
  'src/pages/CompanyLogin.tsx',
  'src/App.tsx',
  'src/main.tsx'
];

console.log('🔍 فحص وإصلاح JSX...\n');

let allValid = true;
let totalFixed = 0;

for (const file of filesToCheck) {
  console.log(`\n${'='.repeat(50)}`);
  
  // إصلاح الملف أولاً
  const wasFixed = fixJSXFile(file);
  if (wasFixed) totalFixed++;
  
  // ثم فحصه
  const isValid = validateJSX(file);
  if (!isValid) allValid = false;
}

console.log(`\n${'='.repeat(50)}`);
console.log('📊 النتيجة النهائية:');
console.log(`🔧 ملفات تم إصلاحها: ${totalFixed}`);
console.log(`${allValid ? '✅' : '❌'} حالة JSX: ${allValid ? 'صحيح' : 'يحتاج إصلاح'}`);

if (allValid) {
  console.log('\n🎉 جميع ملفات JSX صحيحة!');
  console.log('🚀 يمكنك الآن تشغيل: npm run dev');
} else {
  console.log('\n⚠️ هناك مشاكل في JSX تحتاج إصلاح يدوي');
  console.log('💡 راجع الأخطاء أعلاه وأصلحها');
}
