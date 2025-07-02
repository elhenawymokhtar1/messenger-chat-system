#!/usr/bin/env node

/**
 * 🔧 إصلاح شامل للواجهة الأمامية
 */

import fs from 'fs';
import path from 'path';

const FILES_TO_CHECK = [
  'src/App.tsx',
  'src/main.tsx',
  'src/components/ProtectedRoute.tsx',
  'src/pages/CompanyLogin.tsx',
  'src/pages/CompanyRegister.tsx'
];

function fixFrontendComplete() {
  console.log('🔧 إصلاح شامل للواجهة الأمامية...\n');
  
  let totalIssues = 0;
  let fixedIssues = 0;
  
  try {
    // 1. فحص وإصلاح الملفات الأساسية
    console.log('1️⃣ فحص الملفات الأساسية...');
    
    for (const filePath of FILES_TO_CHECK) {
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${filePath}: موجود`);
        
        // قراءة الملف
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        // إصلاح مشاكل شائعة
        
        // إزالة مسافات زائدة
        content = content.replace(/\s+$/gm, '');
        
        // إصلاح أسطر فارغة متعددة
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        // التأكد من وجود سطر فارغ في النهاية
        if (!content.endsWith('\n')) {
          content += '\n';
        }
        
        // إصلاح imports مكررة
        const lines = content.split('\n');
        const importLines = [];
        const nonImportLines = [];
        const seenImports = new Set();
        
        for (const line of lines) {
          if (line.trim().startsWith('import ')) {
            if (!seenImports.has(line.trim())) {
              importLines.push(line);
              seenImports.add(line.trim());
            } else {
              console.log(`🔧 إزالة import مكرر: ${line.trim()}`);
              totalIssues++;
              fixedIssues++;
            }
          } else {
            nonImportLines.push(line);
          }
        }
        
        if (importLines.length > 0) {
          content = [...importLines, '', ...nonImportLines].join('\n');
        }
        
        // حفظ الملف إذا تم تعديله
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content);
          console.log(`🔧 تم إصلاح ${filePath}`);
          fixedIssues++;
        }
        
      } else {
        console.log(`❌ ${filePath}: مفقود`);
        totalIssues++;
      }
    }
    
    // 2. فحص package.json
    console.log('\n2️⃣ فحص package.json...');
    
    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // التحقق من dependencies المطلوبة
      const requiredDeps = [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'vite'
      ];
      
      const missingDeps = [];
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
          missingDeps.push(dep);
        }
      }
      
      if (missingDeps.length > 0) {
        console.log(`⚠️ Dependencies مفقودة: ${missingDeps.join(', ')}`);
        totalIssues += missingDeps.length;
      } else {
        console.log('✅ جميع Dependencies موجودة');
      }
      
    } else {
      console.log('❌ package.json مفقود');
      totalIssues++;
    }
    
    // 3. فحص vite.config.ts
    console.log('\n3️⃣ فحص vite.config.ts...');
    
    if (fs.existsSync('vite.config.ts')) {
      console.log('✅ vite.config.ts موجود');
    } else {
      console.log('❌ vite.config.ts مفقود');
      totalIssues++;
    }
    
    // 4. فحص index.html
    console.log('\n4️⃣ فحص index.html...');
    
    if (fs.existsSync('index.html')) {
      const indexContent = fs.readFileSync('index.html', 'utf8');
      if (indexContent.includes('<div id="root">')) {
        console.log('✅ index.html صحيح');
      } else {
        console.log('⚠️ index.html قد يحتاج إصلاح');
        totalIssues++;
      }
    } else {
      console.log('❌ index.html مفقود');
      totalIssues++;
    }
    
    // 5. إنشاء ملف إصلاح سريع لـ App.tsx
    console.log('\n5️⃣ إنشاء نسخة احتياطية وإصلاح App.tsx...');
    
    if (fs.existsSync('src/App.tsx')) {
      // إنشاء نسخة احتياطية
      fs.copyFileSync('src/App.tsx', 'src/App.tsx.backup');
      console.log('✅ تم إنشاء نسخة احتياطية: src/App.tsx.backup');
      
      // قراءة وإصلاح App.tsx
      let appContent = fs.readFileSync('src/App.tsx', 'utf8');
      
      // التأكد من أن جميع الأقواس متوازنة
      const openBraces = (appContent.match(/\{/g) || []).length;
      const closeBraces = (appContent.match(/\}/g) || []).length;
      
      if (openBraces !== closeBraces) {
        console.log(`⚠️ عدم توازن في الأقواس: ${openBraces} مفتوحة، ${closeBraces} مغلقة`);
        totalIssues++;
      } else {
        console.log('✅ الأقواس متوازنة في App.tsx');
      }
      
      // التأكد من أن JSX tags متوازنة
      const jsxTags = appContent.match(/<[^>]+>/g) || [];
      const openingTags = jsxTags.filter(tag => !tag.endsWith('/>') && !tag.startsWith('</')).length;
      const closingTags = jsxTags.filter(tag => tag.startsWith('</')).length;
      const selfClosingTags = jsxTags.filter(tag => tag.endsWith('/>')).length;
      
      console.log(`📊 JSX Tags: ${openingTags} مفتوحة، ${closingTags} مغلقة، ${selfClosingTags} ذاتية الإغلاق`);
      
      if (openingTags !== closingTags) {
        console.log(`⚠️ عدم توازن في JSX tags`);
        totalIssues++;
      } else {
        console.log('✅ JSX tags متوازنة');
      }
    }
    
    // النتيجة النهائية
    console.log('\n📊 النتيجة النهائية:');
    console.log('=' .repeat(50));
    
    if (totalIssues === 0) {
      console.log('🎉 لا توجد مشاكل في الواجهة الأمامية!');
    } else {
      console.log(`📋 إجمالي المشاكل: ${totalIssues}`);
      console.log(`🔧 المشاكل المُصلحة: ${fixedIssues}`);
      console.log(`⚠️ المشاكل المتبقية: ${totalIssues - fixedIssues}`);
    }
    
    console.log('\n🚀 خطوات التالية:');
    console.log('1. أعد تشغيل npm run dev');
    console.log('2. افتح المتصفح: http://localhost:8081');
    console.log('3. تحقق من Console للأخطاء');
    console.log('4. إذا استمرت المشاكل، تحقق من Terminal للأخطاء التفصيلية');
    
    console.log('\n💡 إذا لم تعمل:');
    console.log('1. جرب: npm install');
    console.log('2. جرب: npm run build');
    console.log('3. تحقق من أن جميع الملفات محفوظة');
    console.log('4. أعد تشغيل VS Code');
    
  } catch (error) {
    console.error('💥 خطأ في إصلاح الواجهة الأمامية:', error.message);
    
    console.log('\n🔧 تحقق من:');
    console.log('   1. صلاحيات القراءة والكتابة');
    console.log('   2. أن الملفات غير مفتوحة في محرر آخر');
    console.log('   3. مساحة القرص الصلب');
  }
}

// تشغيل الإصلاح
fixFrontendComplete();
