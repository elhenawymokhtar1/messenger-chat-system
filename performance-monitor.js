/**
 * ⚡ مراقب الأداء
 * تم إنشاؤه تلقائياً بواسطة Tools Tester
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
  }
  
  startMonitoring() {
    console.log('⚡ بدء مراقبة الأداء...');
    
    setInterval(() => {
      const usage = process.memoryUsage();
      const metric = {
        timestamp: new Date().toISOString(),
        memory: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
        uptime: Math.round(process.uptime()) + 's'
      };
      
      this.metrics.push(metric);
      console.log(`📊 الذاكرة: ${metric.memory}, وقت التشغيل: ${metric.uptime}`);
      
      // الاحتفاظ بآخر 10 قياسات فقط
      if (this.metrics.length > 10) {
        this.metrics.shift();
      }
    }, 5000);
  }
}

const monitor = new PerformanceMonitor();
monitor.startMonitoring();