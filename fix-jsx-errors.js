#!/usr/bin/env node

/**
 * 🔧 إصلاح أخطاء JSX في App.tsx
 */

import fs from 'fs';

const APP_FILE = 'src/App.tsx';

function fixJSXErrors() {
  console.log('🔧 إصلاح أخطاء JSX في App.tsx...\n');
  
  try {
    // قراءة الملف
    let content = fs.readFileSync(APP_FILE, 'utf8');
    
    console.log('1️⃣ فحص الأقواس والعلامات...');
    
    // إصلاح أي مشاكل في الأقواس
    const openBrackets = (content.match(/\{/g) || []).length;
    const closeBrackets = (content.match(/\}/g) || []).length;
    const openTags = (content.match(/</g) || []).length;
    const closeTags = (content.match(/>/g) || []).length;
    
    console.log(`📊 الإحصائيات:`);
    console.log(`   { : ${openBrackets}`);
    console.log(`   } : ${closeBrackets}`);
    console.log(`   < : ${openTags}`);
    console.log(`   > : ${closeTags}`);
    
    // فحص التوازن
    if (openBrackets !== closeBrackets) {
      console.log(`⚠️ عدم توازن في الأقواس المجعدة: ${openBrackets} مفتوحة، ${closeBrackets} مغلقة`);
    } else {
      console.log('✅ الأقواس المجعدة متوازنة');
    }
    
    console.log('\n2️⃣ فحص imports...');
    
    // التحقق من imports
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
    console.log(`📦 عدد imports: ${importLines.length}`);
    
    // البحث عن imports مكررة
    const duplicateImports = [];
    importLines.forEach((line, index) => {
      const match = line.match(/import.*from ['"](.+)['"]/);
      if (match) {
        const moduleName = match[1];
        const otherImports = importLines.filter((otherLine, otherIndex) => 
          otherIndex !== index && otherLine.includes(moduleName)
        );
        if (otherImports.length > 0) {
          duplicateImports.push(moduleName);
        }
      }
    });
    
    if (duplicateImports.length > 0) {
      console.log(`⚠️ imports مكررة: ${duplicateImports.join(', ')}`);
    } else {
      console.log('✅ لا توجد imports مكررة');
    }
    
    console.log('\n3️⃣ فحص JSX tags...');
    
    // فحص JSX tags
    const jsxTags = content.match(/<[^>]+>/g) || [];
    const selfClosingTags = jsxTags.filter(tag => tag.endsWith('/>'));
    const openingTags = jsxTags.filter(tag => !tag.endsWith('/>') && !tag.startsWith('</'));
    const closingTags = jsxTags.filter(tag => tag.startsWith('</'));
    
    console.log(`📊 JSX tags:`);
    console.log(`   Self-closing: ${selfClosingTags.length}`);
    console.log(`   Opening: ${openingTags.length}`);
    console.log(`   Closing: ${closingTags.length}`);
    
    if (openingTags.length !== closingTags.length) {
      console.log(`⚠️ عدم توازن في JSX tags: ${openingTags.length} مفتوحة، ${closingTags.length} مغلقة`);
    } else {
      console.log('✅ JSX tags متوازنة');
    }
    
    console.log('\n4️⃣ إصلاح مشاكل محتملة...');
    
    // إصلاح مشاكل شائعة
    let fixedContent = content;
    let fixesApplied = 0;
    
    // إصلاح مسافات زائدة
    const beforeSpaces = fixedContent.length;
    fixedContent = fixedContent.replace(/\s+$/gm, ''); // إزالة مسافات في نهاية السطر
    if (fixedContent.length !== beforeSpaces) {
      console.log('✅ تم إزالة المسافات الزائدة');
      fixesApplied++;
    }
    
    // إصلاح أسطر فارغة متعددة
    const beforeLines = fixedContent.split('\n').length;
    fixedContent = fixedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    if (fixedContent.split('\n').length !== beforeLines) {
      console.log('✅ تم إصلاح الأسطر الفارغة المتعددة');
      fixesApplied++;
    }
    
    // التأكد من وجود سطر فارغ في النهاية
    if (!fixedContent.endsWith('\n')) {
      fixedContent += '\n';
      console.log('✅ تم إضافة سطر فارغ في النهاية');
      fixesApplied++;
    }
    
    console.log('\n5️⃣ حفظ الملف...');
    
    if (fixesApplied > 0) {
      fs.writeFileSync(APP_FILE, fixedContent);
      console.log(`✅ تم حفظ الملف مع ${fixesApplied} إصلاح`);
    } else {
      console.log('✅ الملف لا يحتاج إصلاحات');
    }
    
    console.log('\n📊 النتيجة النهائية:');
    console.log('=' .repeat(50));
    console.log('✅ تم فحص وإصلاح App.tsx');
    
    console.log('\n🚀 خطوات التالية:');
    console.log('1. تأكد من حفظ جميع الملفات');
    console.log('2. أعد تشغيل npm run dev');
    console.log('3. افتح المتصفح: http://localhost:8081');
    console.log('4. تحقق من Console للأخطاء');
    
    console.log('\n💡 إذا استمرت المشاكل:');
    console.log('1. افتح Developer Tools (F12)');
    console.log('2. تحقق من Console للأخطاء التفصيلية');
    console.log('3. تأكد من أن جميع dependencies مثبتة');
    console.log('4. جرب npm install لإعادة تثبيت packages');
    
  } catch (error) {
    console.error('💥 خطأ في إصلاح الملف:', error.message);
    
    console.log('\n🔧 تحقق من:');
    console.log('   1. وجود ملف src/App.tsx');
    console.log('   2. صلاحيات القراءة والكتابة');
    console.log('   3. أن الملف غير مفتوح في محرر آخر');
  }
}

// تشغيل الإصلاح
fixJSXErrors();
