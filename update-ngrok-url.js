#!/usr/bin/env node

/**
 * 🔧 أداة تحديث ngrok URL تلقائياً
 * 
 * الاستخدام:
 * 1. تشغيل ngrok: ngrok http 3002
 * 2. تشغيل هذا الملف: node update-ngrok-url.js
 * 3. سيحدث ملف .env تلقائياً
 */

import fs from 'fs';
import path from 'path';

async function updateNgrokUrl() {
  try {
    console.log('🔍 البحث عن ngrok URL الجديد...');
    
    // محاولة الحصول على URL من ngrok API
    const response = await fetch('http://127.0.0.1:4040/api/tunnels');
    
    if (!response.ok) {
      console.error('❌ لا يمكن الوصول لـ ngrok API. تأكد من تشغيل ngrok أولاً:');
      console.error('   ngrok http 3002');
      return;
    }
    
    const data = await response.json();
    const httpsTunnel = data.tunnels.find(tunnel => 
      tunnel.proto === 'https' && tunnel.config.addr === 'http://localhost:3002'
    );
    
    if (!httpsTunnel) {
      console.error('❌ لم يتم العثور على tunnel لـ localhost:3002');
      return;
    }
    
    const newUrl = httpsTunnel.public_url;
    console.log('✅ تم العثور على URL الجديد:', newUrl);
    
    // قراءة ملف .env
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // تحديث أو إضافة PUBLIC_URL
    const publicUrlRegex = /^PUBLIC_URL=.*$/m;
    const newLine = `PUBLIC_URL=${newUrl}`;
    
    if (publicUrlRegex.test(envContent)) {
      // تحديث السطر الموجود
      envContent = envContent.replace(publicUrlRegex, newLine);
      console.log('🔄 تم تحديث PUBLIC_URL في ملف .env');
    } else {
      // إضافة سطر جديد
      envContent += `\n${newLine}\n`;
      console.log('➕ تم إضافة PUBLIC_URL إلى ملف .env');
    }
    
    // حفظ الملف
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ تم تحديث ملف .env بنجاح!');
    console.log('🔄 يرجى إعادة تشغيل الخادم لتطبيق التغييرات:');
    console.log('   Ctrl+C ثم node --import tsx/esm src/api/server-mysql.ts');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث ngrok URL:', error.message);
    console.error('\n💡 تحديث يدوي:');
    console.error('1. انسخ ngrok URL من Terminal');
    console.error('2. حدث PUBLIC_URL في ملف .env');
    console.error('3. أعد تشغيل الخادم');
  }
}

// تشغيل الدالة
updateNgrokUrl();
