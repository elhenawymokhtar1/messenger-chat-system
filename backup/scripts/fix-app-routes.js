#!/usr/bin/env node

/**
 * 🔧 إصلاح routes في App.tsx
 */

import fs from 'fs';
import path from 'path';

const APP_FILE = 'src/App.tsx';

function fixAppRoutes() {
  console.log('🔧 إصلاح routes في App.tsx...\n');
  
  try {
    // قراءة الملف
    const content = fs.readFileSync(APP_FILE, 'utf8');
    
    // إصلاح جميع PrivateRoute إلى ProtectedRoute
    let fixedContent = content.replace(/PrivateRoute/g, 'ProtectedRoute');
    
    // إزالة جميع PublicRoute (الصفحات العامة لا تحتاج wrapper)
    fixedContent = fixedContent.replace(/<PublicRoute>/g, '');
    fixedContent = fixedContent.replace(/<\/PublicRoute>/g, '');
    
    // إزالة import PublicRoute و PrivateRoute
    fixedContent = fixedContent.replace(
      /import ProtectedRoute, { PublicRoute, PrivateRoute } from/g,
      'import ProtectedRoute from'
    );
    
    // كتابة الملف المُصلح
    fs.writeFileSync(APP_FILE, fixedContent);
    
    console.log('✅ تم إصلاح App.tsx بنجاح!');
    
    // عرض الإحصائيات
    const protectedRoutes = (fixedContent.match(/ProtectedRoute/g) || []).length;
    const totalRoutes = (fixedContent.match(/<Route path=/g) || []).length;
    
    console.log(`📊 الإحصائيات:`);
    console.log(`   📍 إجمالي الـ Routes: ${totalRoutes}`);
    console.log(`   🔒 الـ Routes المحمية: ${protectedRoutes}`);
    console.log(`   🌐 الـ Routes العامة: ${totalRoutes - protectedRoutes}`);
    
    console.log('\n🎯 الإصلاحات المطبقة:');
    console.log('   1. ✅ تحويل جميع PrivateRoute إلى ProtectedRoute');
    console.log('   2. ✅ إزالة جميع PublicRoute wrappers');
    console.log('   3. ✅ تنظيف imports');
    
    console.log('\n🚀 الآن يمكنك:');
    console.log('   1. تشغيل npm run dev');
    console.log('   2. فتح http://localhost:8081/company-login');
    console.log('   3. اختبار تسجيل الدخول');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح الملف:', error.message);
    
    console.log('\n🔧 تحقق من:');
    console.log('   1. وجود ملف src/App.tsx');
    console.log('   2. صلاحيات الكتابة');
    console.log('   3. أن الملف غير مفتوح في محرر آخر');
  }
}

// تشغيل الإصلاح
fixAppRoutes();
