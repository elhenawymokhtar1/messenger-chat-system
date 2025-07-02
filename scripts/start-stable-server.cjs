#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🎯 [MANAGER] مدير الخادم المحسن والمستقر');
console.log('🎯 [MANAGER] سيتم إعادة تشغيل الخادم تلقائياً عند توقفه');
console.log('🎯 [MANAGER] معالجة محسنة للذاكرة والأخطاء');
console.log('🎯 [MANAGER] اضغط Ctrl+C للإيقاف النهائي');
console.log('==================================================');

let restartCount = 0;
let isShuttingDown = false;
let currentProcess = null;

// إعدادات إعادة التشغيل
const MAX_RESTARTS = 10;
const RESTART_DELAY = 5000; // 5 ثواني
const MEMORY_LIMIT = 200; // 200MB

function startServer() {
  if (isShuttingDown) return;
  
  restartCount++;
  console.log(`🚀 [MANAGER] بدء الخادم... (المحاولة ${restartCount})`);
  
  // تشغيل الخادم مع إعدادات محسنة للذاكرة
  const isWindows = process.platform === 'win32';
  currentProcess = spawn(isWindows ? 'npm.cmd' : 'npm', [
    'run',
    'api:stable'
  ], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      UV_THREADPOOL_SIZE: '4'    // تحديد عدد threads
    }
  });
  
  console.log(`✅ [MANAGER] تم بدء الخادم بـ PID: ${currentProcess.pid}`);
  
  // مراقبة استهلاك الذاكرة
  const memoryMonitor = setInterval(() => {
    if (!currentProcess || currentProcess.killed) {
      clearInterval(memoryMonitor);
      return;
    }
    
    try {
      const memUsage = process.memoryUsage();
      const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      if (heapUsed > MEMORY_LIMIT) {
        console.log(`🚨 [MANAGER] استهلاك ذاكرة عالي: ${heapUsed}MB - إعادة تشغيل الخادم`);
        restartServer('memory_limit');
      }
    } catch (error) {
      // تجاهل أخطاء مراقبة الذاكرة
    }
  }, 30000); // فحص كل 30 ثانية
  
  currentProcess.on('exit', (code, signal) => {
    clearInterval(memoryMonitor);
    
    if (isShuttingDown) {
      console.log('👋 [MANAGER] تم إيقاف الخادم بنجاح');
      return;
    }
    
    console.log(`💥 [MANAGER] الخادم توقف - Code: ${code}, Signal: ${signal}`);
    
    if (restartCount >= MAX_RESTARTS) {
      console.log(`❌ [MANAGER] تم الوصول للحد الأقصى من إعادة التشغيل (${MAX_RESTARTS})`);
      process.exit(1);
    }
    
    console.log(`⏳ [MANAGER] إعادة تشغيل الخادم خلال ${RESTART_DELAY/1000} ثواني...`);
    setTimeout(startServer, RESTART_DELAY);
  });
  
  currentProcess.on('error', (error) => {
    console.error('❌ [MANAGER] خطأ في تشغيل الخادم:', error);
    if (!isShuttingDown) {
      setTimeout(startServer, RESTART_DELAY);
    }
  });
}

function restartServer(reason = 'manual') {
  console.log(`🔄 [MANAGER] إعادة تشغيل الخادم - السبب: ${reason}`);
  
  if (currentProcess && !currentProcess.killed) {
    currentProcess.kill('SIGTERM');
    
    // إجبار الإغلاق بعد 10 ثواني
    setTimeout(() => {
      if (currentProcess && !currentProcess.killed) {
        console.log('🔨 [MANAGER] إجبار إغلاق الخادم');
        currentProcess.kill('SIGKILL');
      }
    }, 10000);
  }
}

function shutdown() {
  console.log('🛑 [MANAGER] بدء إيقاف الخادم...');
  isShuttingDown = true;
  
  if (currentProcess && !currentProcess.killed) {
    currentProcess.kill('SIGTERM');
    
    setTimeout(() => {
      if (currentProcess && !currentProcess.killed) {
        currentProcess.kill('SIGKILL');
      }
      process.exit(0);
    }, 5000);
  } else {
    process.exit(0);
  }
}

// معالجة إشارات الإيقاف
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// معالجة الأخطاء غير المتوقعة
process.on('uncaughtException', (error) => {
  console.error('❌ [MANAGER] خطأ غير متوقع:', error);
  restartServer('uncaught_exception');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [MANAGER] Promise مرفوض:', reason);
  // لا نعيد التشغيل للـ unhandled rejections
});

// بدء الخادم
startServer();

// إعادة تعيين عداد إعادة التشغيل كل ساعة
setInterval(() => {
  if (restartCount > 0) {
    console.log('🔄 [MANAGER] إعادة تعيين عداد إعادة التشغيل');
    restartCount = 0;
  }
}, 3600000); // كل ساعة
