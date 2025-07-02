#!/usr/bin/env node

/**
 * 🚀 تشغيل الخادم الكامل مع MySQL
 * يوقف الخادم القديم ويشغل الجديد
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import colors from 'colors';

const execAsync = promisify(exec);

console.log('🚀 بدء تشغيل خادم MySQL الكامل...'.cyan.bold);
console.log('');

async function startCompleteServer() {
  try {
    // 1. إيقاف أي خادم يعمل على المنفذ 3002
    console.log('🔄 إيقاف الخوادم القديمة...'.yellow);
    
    try {
      // في Windows
      if (process.platform === 'win32') {
        await execAsync('taskkill /F /IM node.exe 2>nul || echo "لا توجد عمليات node للإيقاف"');
      } else {
        // في Linux/Mac
        await execAsync('pkill -f "node.*3002" || echo "لا توجد عمليات للإيقاف"');
      }
      console.log('✅ تم إيقاف الخوادم القديمة'.green);
    } catch (error) {
      console.log('⚠️ لم يتم العثور على خوادم للإيقاف'.yellow);
    }
    
    console.log('');
    
    // 2. انتظار قليل للتأكد من إغلاق المنافذ
    console.log('⏳ انتظار إغلاق المنافذ...'.cyan);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. تشغيل الخادم الجديد
    console.log('🚀 تشغيل خادم MySQL الكامل...'.green.bold);
    console.log('📁 الملف: src/api/server-mysql-complete.ts'.gray);
    console.log('');
    
    const serverProcess = spawn('npx', ['tsx', 'src/api/server-mysql-complete.ts'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });
    
    // معالجة الأخطاء
    serverProcess.on('error', (error) => {
      console.error('❌ خطأ في تشغيل الخادم:'.red, error.message);
      process.exit(1);
    });
    
    // معالجة إغلاق الخادم
    serverProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(`❌ الخادم توقف بكود: ${code}`.red);
      } else {
        console.log('✅ تم إيقاف الخادم بنجاح'.green);
      }
      process.exit(code);
    });
    
    // معالجة إشارات النظام لإغلاق نظيف
    process.on('SIGINT', () => {
      console.log('\n🛑 إيقاف الخادم...'.yellow);
      serverProcess.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 إيقاف الخادم...'.yellow);
      serverProcess.kill('SIGTERM');
    });
    
  } catch (error) {
    console.error('💥 خطأ عام:'.red, error.message);
    process.exit(1);
  }
}

// تشغيل الخادم
startCompleteServer();

export { startCompleteServer };
