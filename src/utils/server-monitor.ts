// 🔍 مراقب الخادم - لمراقبة الأداء ومنع التوقف
import os from 'os';

export class ServerMonitor {
  private static instance: ServerMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  static getInstance(): ServerMonitor {
    if (!ServerMonitor.instance) {
      ServerMonitor.instance = new ServerMonitor();
    }
    return ServerMonitor.instance;
  }

  // بدء مراقبة الخادم
  startMonitoring(intervalMs: number = 30000) { // كل 30 ثانية
    if (this.isMonitoring) {
      console.log('🔍 [MONITOR] المراقبة تعمل بالفعل');
      return;
    }

    console.log('🔍 [MONITOR] بدء مراقبة الخادم...');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(() => {
      this.checkSystemHealth();
    }, intervalMs);

    // مراقبة فورية
    this.checkSystemHealth();
  }

  // إيقاف المراقبة
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      console.log('🔍 [MONITOR] تم إيقاف المراقبة');
    }
  }

  // فحص صحة النظام
  private checkSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();
    
    // تحويل البايتات إلى ميجابايت
    const rss = Math.round(memoryUsage.rss / 1024 / 1024);
    const heapUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const external = Math.round(memoryUsage.external / 1024 / 1024);

    // معلومات النظام
    const totalMemory = Math.round(os.totalmem() / 1024 / 1024);
    const freeMemory = Math.round(os.freemem() / 1024 / 1024);
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);

    console.log('📊 [MONITOR] تقرير صحة الخادم:');
    console.log(`   ⏱️  وقت التشغيل: ${Math.round(uptime / 60)} دقيقة`);
    console.log(`   🧠 ذاكرة العملية: ${rss}MB (Heap: ${heapUsed}/${heapTotal}MB)`);
    console.log(`   💾 ذاكرة النظام: ${usedMemory}/${totalMemory}MB (${memoryUsagePercent}%)`);
    console.log(`   🔗 ذاكرة خارجية: ${external}MB`);

    // تحذيرات
    if (rss > 500) { // أكثر من 500MB
      console.warn(`⚠️ [MONITOR] استهلاك ذاكرة عالي: ${rss}MB`);
    }

    if (memoryUsagePercent > 90) {
      console.warn(`⚠️ [MONITOR] ذاكرة النظام ممتلئة: ${memoryUsagePercent}%`);
    }

    if (heapUsed > heapTotal * 0.9) {
      console.warn(`⚠️ [MONITOR] Heap ممتلئ: ${heapUsed}/${heapTotal}MB`);
    }

    // تنظيف الذاكرة إذا لزم الأمر
    if (rss > 300) { // أكثر من 300MB
      console.log('🧹 [MONITOR] تنظيف الذاكرة...');
      if (global.gc) {
        global.gc();
        console.log('✅ [MONITOR] تم تنظيف الذاكرة');
      } else {
        console.log('⚠️ [MONITOR] تنظيف الذاكرة غير متاح (استخدم --expose-gc)');
      }
    }
  }

  // فحص اتصال قاعدة البيانات
  async checkDatabaseConnection(): Promise<boolean> {
    try {
      // هنا يمكن إضافة فحص اتصال قاعدة البيانات
      return true;
    } catch (error) {
      console.error('❌ [MONITOR] خطأ في اتصال قاعدة البيانات:', error);
      return false;
    }
  }

  // إحصائيات سريعة
  getQuickStats() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      uptime: Math.round(uptime / 60), // بالدقائق
      memoryMB: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      isHealthy: memoryUsage.rss < 500 * 1024 * 1024 // أقل من 500MB
    };
  }
}

// تصدير المراقب
export const serverMonitor = ServerMonitor.getInstance();

// معالجة إشارات النظام
process.on('SIGTERM', () => {
  console.log('🔄 [MONITOR] إيقاف المراقبة قبل الإغلاق...');
  serverMonitor.stopMonitoring();
});

process.on('SIGINT', () => {
  console.log('🔄 [MONITOR] إيقاف المراقبة قبل الإغلاق...');
  serverMonitor.stopMonitoring();
});
