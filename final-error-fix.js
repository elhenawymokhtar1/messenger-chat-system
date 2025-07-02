#!/usr/bin/env node

/**
 * 🔧 إصلاح نهائي للأخطاء الحقيقية
 */

import fs from 'fs';

function finalErrorFix() {
  console.log('🔧 إصلاح نهائي للأخطاء الحقيقية...\n');
  
  let totalFixed = 0;
  
  try {
    // 1. إصلاح ProtectedRoute.tsx - إزالة useAuth المكرر
    console.log('1️⃣ إصلاح ProtectedRoute.tsx...');
    
    if (fs.existsSync('src/components/ProtectedRoute.tsx')) {
      let content = fs.readFileSync('src/components/ProtectedRoute.tsx', 'utf8');
      
      // إزالة useAuth hook المكرر من نهاية الملف
      const lines = content.split('\n');
      const newLines = [];
      let inUseAuthHook = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // البحث عن بداية useAuth hook المكرر
        if (line.includes('export const useAuth = () => {')) {
          inUseAuthHook = true;
          console.log(`🔧 إزالة useAuth hook مكرر من السطر ${i + 1}`);
          continue;
        }
        
        // إذا كنا داخل useAuth hook المكرر، تجاهل الأسطر
        if (inUseAuthHook) {
          // البحث عن نهاية الـ hook
          if (line.includes('};') && line.trim() === '};') {
            inUseAuthHook = false;
          }
          continue;
        }
        
        newLines.push(line);
      }
      
      const newContent = newLines.join('\n');
      
      if (newContent !== content) {
        fs.writeFileSync('src/components/ProtectedRoute.tsx', newContent);
        console.log('✅ تم إصلاح ProtectedRoute.tsx');
        totalFixed++;
      }
    }
    
    // 2. إضافة import لـ useAuth في ProtectedRoute.tsx
    console.log('\n2️⃣ إضافة import لـ useAuth...');
    
    if (fs.existsSync('src/components/ProtectedRoute.tsx')) {
      let content = fs.readFileSync('src/components/ProtectedRoute.tsx', 'utf8');
      
      // التحقق من وجود import
      if (!content.includes("import { useAuth } from '@/hooks/useAuth';")) {
        // إضافة import بعد imports الموجودة
        const lines = content.split('\n');
        const importIndex = lines.findIndex(line => line.includes("import { Card, CardContent }"));
        
        if (importIndex !== -1) {
          lines.splice(importIndex + 1, 0, "import { useAuth } from '@/hooks/useAuth';");
          
          const newContent = lines.join('\n');
          fs.writeFileSync('src/components/ProtectedRoute.tsx', newContent);
          console.log('✅ تم إضافة import useAuth');
          totalFixed++;
        }
      }
    }
    
    // 3. إصلاح App.tsx - إزالة الكود المكرر
    console.log('\n3️⃣ إصلاح App.tsx...');
    
    if (fs.existsSync('src/App.tsx')) {
      let content = fs.readFileSync('src/App.tsx', 'utf8');
      
      // إزالة الكود المكرر في وسط الملف
      const problematicSection = `          <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">مرحباً بك في نظام الرد الآلي</h1>
                  <p className="text-gray-600">اختر الخدمة التي تريد استخدامها</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">فيسبوك ماسنجر</h3>
                    <ul className="space-y-2 text-blue-800">
                      <li>• رد آلي على الرسائل</li>
                      <li>• إدارة المحادثات</li>
                      <li>• تحليل الأداء</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">واتساب</h3>
                    <ul className="space-y-2 text-green-800">
                      <li>• رد آلي ذكي</li>
                      <li>• إدارة جهات الاتصال</li>
                      <li>• تقارير مفصلة</li>
                    </ul>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">`;
      
      if (content.includes(problematicSection)) {
        content = content.replace(problematicSection, '');
        
        // إزالة الـ closing divs المتبقية
        content = content.replace(/\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/ProtectedRoute>\s*}\s*\/>/g, '');
        
        fs.writeFileSync('src/App.tsx', content);
        console.log('✅ تم إصلاح App.tsx');
        totalFixed++;
      }
    }
    
    // 4. إضافة .env مع VITE_API_URL
    console.log('\n4️⃣ إضافة متغيرات البيئة...');
    
    if (fs.existsSync('.env')) {
      let envContent = fs.readFileSync('.env', 'utf8');
      
      if (!envContent.includes('VITE_API_URL')) {
        envContent += '\n# API Configuration\nVITE_API_URL=http://localhost:3002\n';
        fs.writeFileSync('.env', envContent);
        console.log('✅ تم إضافة VITE_API_URL إلى .env');
        totalFixed++;
      }
    } else {
      const envContent = `# API Configuration
VITE_API_URL=http://localhost:3002

# Database Configuration (for reference)
MYSQL_HOST=193.203.168.103
MYSQL_USER=u384034873_conversations
MYSQL_PASSWORD=0165676135Aa@A
MYSQL_DATABASE=u384034873_conversations
`;
      fs.writeFileSync('.env', envContent);
      console.log('✅ تم إنشاء ملف .env');
      totalFixed++;
    }
    
    // 5. فحص وإصلاح package.json scripts
    console.log('\n5️⃣ فحص package.json...');
    
    if (fs.existsSync('package.json')) {
      const packageContent = fs.readFileSync('package.json', 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      let needsUpdate = false;
      
      // التأكد من وجود scripts مهمة
      if (!packageJson.scripts) {
        packageJson.scripts = {};
        needsUpdate = true;
      }
      
      const requiredScripts = {
        'dev': 'vite',
        'build': 'tsc && vite build',
        'preview': 'vite preview',
        'lint': 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0'
      };
      
      for (const [script, command] of Object.entries(requiredScripts)) {
        if (!packageJson.scripts[script]) {
          packageJson.scripts[script] = command;
          needsUpdate = true;
          console.log(`✅ إضافة script: ${script}`);
        }
      }
      
      if (needsUpdate) {
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✅ تم تحديث package.json');
        totalFixed++;
      }
    }
    
    // النتيجة النهائية
    console.log('\n📊 النتيجة النهائية:');
    console.log('=' .repeat(50));
    console.log(`🔧 إجمالي الإصلاحات: ${totalFixed}`);
    
    if (totalFixed > 0) {
      console.log('\n✅ تم إصلاح المشاكل الأساسية!');
      
      console.log('\n🚀 خطوات التالية:');
      console.log('1. تشغيل: npm install (إذا لزم الأمر)');
      console.log('2. تشغيل: npm run dev');
      console.log('3. فتح المتصفح: http://localhost:8081');
      console.log('4. اختبار تسجيل الدخول');
      
      console.log('\n💡 إذا استمرت المشاكل:');
      console.log('1. تحقق من Console في المتصفح');
      console.log('2. تحقق من Terminal للأخطاء');
      console.log('3. تأكد من تشغيل الخادم الخلفي');
      
    } else {
      console.log('\n✅ لا توجد مشاكل للإصلاح!');
    }
    
  } catch (error) {
    console.error('💥 خطأ في الإصلاح:', error.message);
  }
}

// تشغيل الإصلاح
finalErrorFix();
