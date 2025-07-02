#!/usr/bin/env node

/**
 * 🚀 تشغيل الواجهة الأمامية بشكل نظيف
 */

import { spawn } from 'child_process';
import fs from 'fs';

function startFrontendClean() {
  console.log('🚀 تشغيل الواجهة الأمامية بشكل نظيف...\n');
  
  try {
    // 1. التحقق من الملفات المطلوبة
    console.log('1️⃣ التحقق من الملفات المطلوبة...');
    
    const requiredFiles = [
      'package.json',
      'vite.config.ts',
      'index.html',
      'src/main.tsx',
      'src/App.tsx'
    ];
    
    let allFilesExist = true;
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}: موجود`);
      } else {
        console.log(`❌ ${file}: مفقود`);
        allFilesExist = false;
      }
    }
    
    if (!allFilesExist) {
      console.log('\n❌ بعض الملفات المطلوبة مفقودة!');
      return;
    }
    
    // 2. تنظيف cache
    console.log('\n2️⃣ تنظيف cache...');
    
    const cacheDirs = ['node_modules/.vite', 'dist', '.vite'];
    for (const dir of cacheDirs) {
      if (fs.existsSync(dir)) {
        console.log(`🧹 حذف ${dir}...`);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
    
    console.log('✅ تم تنظيف cache');
    
    // 3. إعادة تثبيت dependencies
    console.log('\n3️⃣ إعادة تثبيت dependencies...');
    console.log('💡 تشغيل: npm install');
    
    const npmInstall = spawn('npm', ['install'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });
    
    npmInstall.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ تم تثبيت dependencies بنجاح');
        
        // 4. تشغيل الواجهة الأمامية
        console.log('\n4️⃣ تشغيل الواجهة الأمامية...');
        console.log('💡 تشغيل: npm run dev');
        console.log('🌐 ستفتح على: http://localhost:8081 أو http://localhost:5173');
        
        const npmDev = spawn('npm', ['run', 'dev'], {
          stdio: 'inherit',
          shell: true,
          cwd: process.cwd()
        });
        
        npmDev.on('close', (devCode) => {
          if (devCode === 0) {
            console.log('\n✅ تم تشغيل الواجهة الأمامية بنجاح');
          } else {
            console.log('\n❌ خطأ في تشغيل الواجهة الأمامية');
            console.log('🔧 تحقق من الأخطاء أعلاه');
          }
        });
        
        npmDev.on('error', (error) => {
          console.error('\n💥 خطأ في تشغيل npm run dev:', error.message);
        });
        
      } else {
        console.log('\n❌ خطأ في تثبيت dependencies');
        console.log('🔧 تحقق من الأخطاء أعلاه');
      }
    });
    
    npmInstall.on('error', (error) => {
      console.error('\n💥 خطأ في تشغيل npm install:', error.message);
      
      console.log('\n🔧 جرب يدوياً:');
      console.log('1. npm install');
      console.log('2. npm run dev');
    });
    
  } catch (error) {
    console.error('💥 خطأ في تشغيل الواجهة الأمامية:', error.message);
    
    console.log('\n🔧 تحقق من:');
    console.log('   1. تثبيت Node.js و npm');
    console.log('   2. صلاحيات الكتابة في المجلد');
    console.log('   3. اتصال الإنترنت');
    console.log('   4. مساحة القرص الصلب');
    
    console.log('\n💡 جرب يدوياً:');
    console.log('   npm install');
    console.log('   npm run dev');
  }
}

// تشغيل الإصلاح
startFrontendClean();
