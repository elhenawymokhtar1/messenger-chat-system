#!/usr/bin/env node

// 🔄 سكريبت إعادة تشغيل الخادم التلقائي
// يراقب الخادم ويعيد تشغيله عند توقفه

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ServerManager {
  constructor() {
    this.serverProcess = null;
    this.restartCount = 0;
    this.maxRestarts = 10; // حد أقصى 10 إعادة تشغيل
    this.restartDelay = 5000; // 5 ثوان بين إعادة التشغيل
    this.isShuttingDown = false;
  }

  // بدء الخادم
  startServer() {
    if (this.isShuttingDown) {
      console.log('🛑 [MANAGER] الخادم في وضع الإغلاق، لن يتم إعادة التشغيل');
      return;
    }

    console.log(`🚀 [MANAGER] بدء الخادم... (المحاولة ${this.restartCount + 1})`);
    
    // تشغيل الخادم
    this.serverProcess = spawn('npm', ['run', 'dev:api'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });

    // معالجة إغلاق الخادم
    this.serverProcess.on('close', (code) => {
      console.log(`📊 [MANAGER] الخادم توقف بكود: ${code}`);
      
      if (this.isShuttingDown) {
        console.log('✅ [MANAGER] تم إغلاق الخادم بنجاح');
        return;
      }

      if (code !== 0) {
        console.error(`❌ [MANAGER] الخادم توقف بخطأ! كود الخروج: ${code}`);
        this.handleServerCrash();
      } else {
        console.log('✅ [MANAGER] الخادم توقف بشكل طبيعي');
      }
    });

    // معالجة أخطاء الخادم
    this.serverProcess.on('error', (error) => {
      console.error('❌ [MANAGER] خطأ في تشغيل الخادم:', error.message);
      this.handleServerCrash();
    });

    console.log(`✅ [MANAGER] تم بدء الخادم بـ PID: ${this.serverProcess.pid}`);
  }

  // معالجة توقف الخادم
  handleServerCrash() {
    if (this.isShuttingDown) {
      return;
    }

    this.restartCount++;
    
    if (this.restartCount >= this.maxRestarts) {
      console.error(`🚫 [MANAGER] تم الوصول للحد الأقصى من إعادة التشغيل (${this.maxRestarts})`);
      console.error('🚫 [MANAGER] الخادم لن يتم إعادة تشغيله تلقائياً');
      process.exit(1);
    }

    console.log(`🔄 [MANAGER] إعادة تشغيل الخادم خلال ${this.restartDelay / 1000} ثوان...`);
    console.log(`📊 [MANAGER] عدد إعادة التشغيل: ${this.restartCount}/${this.maxRestarts}`);
    
    setTimeout(() => {
      this.startServer();
    }, this.restartDelay);
  }

  // إيقاف الخادم
  stopServer() {
    this.isShuttingDown = true;
    
    if (this.serverProcess) {
      console.log('🔄 [MANAGER] إيقاف الخادم...');
      this.serverProcess.kill('SIGTERM');
      
      // إجبار الإغلاق بعد 10 ثوان
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          console.log('⚠️ [MANAGER] إجبار إغلاق الخادم...');
          this.serverProcess.kill('SIGKILL');
        }
      }, 10000);
    }
  }

  // إعادة تعيين عداد إعادة التشغيل
  resetRestartCount() {
    this.restartCount = 0;
    console.log('🔄 [MANAGER] تم إعادة تعيين عداد إعادة التشغيل');
  }
}

// إنشاء مدير الخادم
const serverManager = new ServerManager();

// معالجة إشارات النظام
process.on('SIGTERM', () => {
  console.log('🔄 [MANAGER] تم استلام SIGTERM');
  serverManager.stopServer();
});

process.on('SIGINT', () => {
  console.log('🔄 [MANAGER] تم استلام SIGINT (Ctrl+C)');
  serverManager.stopServer();
  setTimeout(() => process.exit(0), 2000);
});

// معالجة الأخطاء غير المعالجة
process.on('uncaughtException', (error) => {
  console.error('❌ [MANAGER] خطأ غير معالج في المدير:', error.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ [MANAGER] رفض غير معالج في المدير:', reason);
});

// بدء الخادم
console.log('🎯 [MANAGER] مدير الخادم المستقر');
console.log('🎯 [MANAGER] سيتم إعادة تشغيل الخادم تلقائياً عند توقفه');
console.log('🎯 [MANAGER] اضغط Ctrl+C للإيقاف النهائي');
console.log('=' .repeat(50));

serverManager.startServer();

// إعادة تعيين عداد إعادة التشغيل كل ساعة
setInterval(() => {
  if (serverManager.restartCount > 0) {
    serverManager.resetRestartCount();
  }
}, 3600000); // كل ساعة
