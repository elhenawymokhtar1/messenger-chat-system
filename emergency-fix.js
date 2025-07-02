#!/usr/bin/env node

/**
 * 🚨 إصلاح طارئ للأخطاء الحرجة
 */

import fs from 'fs';

function emergencyFix() {
  console.log('🚨 إصلاح طارئ للأخطاء الحرجة...\n');
  
  try {
    // 1. إصلاح ProtectedRoute.tsx
    console.log('1️⃣ إصلاح ProtectedRoute.tsx...');
    
    if (fs.existsSync('src/components/ProtectedRoute.tsx')) {
      let content = fs.readFileSync('src/components/ProtectedRoute.tsx', 'utf8');
      
      // البحث عن النص المشكل وإصلاحه
      content = content.replace(
        /\/\/ إذا لم توجد بيانات صحيحةsetAuthState\(\{/g,
        '// إذا لم توجد بيانات صحيحة\n      setAuthState({'
      );
      
      // إصلاح أي مشاكل أخرى مشابهة
      content = content.replace(
        /} else {}\s*\/\/ إذا لم توجد بيانات صحيحة\s*setAuthState\(\{/g,
        '} else {\n        console.log(\'ℹ️ [AUTH] لا توجد بيانات محفوظة\');\n      }\n      \n      // إذا لم توجد بيانات صحيحة\n      setAuthState({'
      );
      
      fs.writeFileSync('src/components/ProtectedRoute.tsx', content);
      console.log('✅ تم إصلاح ProtectedRoute.tsx');
    }
    
    // 2. إصلاح App.tsx
    console.log('\n2️⃣ إصلاح App.tsx...');
    
    if (fs.existsSync('src/App.tsx')) {
      let content = fs.readFileSync('src/App.tsx', 'utf8');
      
      // إصلاح مشاكل try-catch
      content = content.replace(
        /\/\/ بدء خدمة تحديث الأسماء التلقائيةtry \{/g,
        '// بدء خدمة تحديث الأسماء التلقائية\n    try {'
      );
      
      // إصلاح التعليقات المكسورة
      content = content.replace(
        /\/\/ initializeDatabase\(\);\'\);/g,
        '// initializeDatabase();'
      );
      
      // إصلاح الأقواس المكسورة
      content = content.replace(
        /NameUpdateService\.stopAutoUpdate\(\);} catch \(error\) \{/g,
        'NameUpdateService.stopAutoUpdate();\n      } catch (error) {'
      );
      
      fs.writeFileSync('src/App.tsx', content);
      console.log('✅ تم إصلاح App.tsx');
    }
    
    // 3. إنشاء ملف App.tsx نظيف إذا لزم الأمر
    console.log('\n3️⃣ التحقق من صحة App.tsx...');
    
    if (fs.existsSync('src/App.tsx')) {
      const content = fs.readFileSync('src/App.tsx', 'utf8');
      
      // فحص بسيط للأخطاء
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      
      if (Math.abs(openBraces - closeBraces) > 2) {
        console.log('⚠️ App.tsx يحتوي على أخطاء كبيرة، إنشاء نسخة نظيفة...');
        
        // إنشاء App.tsx بسيط وصحيح
        const cleanApp = `import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthenticatedLayout from "./components/AuthenticatedLayout";
import HomePage from "./pages/HomePage";
import CompanyLogin from "./pages/CompanyLogin";
import CompanyRegister from "./pages/CompanyRegister";
import FacebookSettingsMySQL from "./pages/FacebookSettingsMySQL";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  useEffect(() => {
    console.log('🚀 تطبيق الرد الآلي بدأ التشغيل');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* الصفحات العامة */}
            <Route path="/company-register" element={<CompanyRegister />} />
            <Route path="/company-login" element={<CompanyLogin />} />
            
            {/* الصفحات المحمية */}
            <Route path="/" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <HomePage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/facebook-settings" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <FacebookSettingsMySQL />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />
            
            {/* صفحة 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
`;
        
        fs.writeFileSync('src/App.tsx', cleanApp);
        console.log('✅ تم إنشاء App.tsx نظيف');
      }
    }
    
    console.log('\n📊 النتيجة:');
    console.log('✅ تم إصلاح الأخطاء الطارئة');
    console.log('🔄 الواجهة الأمامية ستعيد التشغيل تلقائياً');
    
  } catch (error) {
    console.error('💥 خطأ في الإصلاح الطارئ:', error.message);
  }
}

// تشغيل الإصلاح
emergencyFix();
