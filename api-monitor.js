// تم فحص الأداة - console.log مقبول في أدوات التشخيص
/**
 * 🔍 مراقب API في الوقت الفعلي
 * يراقب صحة وأداء API باستمرار
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

class APIMonitor {
  constructor() {
    this.baseURL = 'http://localhost:3002';
    this.isRunning = false;
    this.interval = 30000; // 30 ثانية
    this.endpoints = [
      { path: '/api/health', name: 'صحة الخادم', critical: true },
      { path: '/api/companies', name: 'الشركات', critical: true },
      { path: '/api/messages', name: 'الرسائل', critical: true },
      { path: '/api/facebook/pages', name: 'Facebook', critical: false },
      { path: '/api/whatsapp/status', name: 'WhatsApp', critical: false }
    ];
    this.history = [];
    this.alerts = [];
    this.stats = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
      uptime: 100
    };
  }

  async start() {
    console.log('🔍 بدء مراقبة API...');
    console.log(`📊 فحص كل ${this.interval / 1000} ثانية`);
    console.log(`🎯 مراقبة ${this.endpoints.length} endpoints\n`);

    this.isRunning = true;
    this.startTime = Date.now();

    // فحص أولي
    await this.performCheck();

    // بدء المراقبة المستمرة
    this.monitorInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.performCheck();
      }
    }, this.interval);

    // حفظ التقرير كل 5 دقائق
    this.reportInterval = setInterval(() => {
      if (this.isRunning) {
        this.saveReport();
      }
    }, 300000); // 5 دقائق

    console.log('✅ المراقبة بدأت. اضغط Ctrl+C للتوقف.\n');
  }

  async stop() {
    console.log('\n🛑 إيقاف المراقبة...');
    this.isRunning = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }

    // حفظ التقرير النهائي
    this.saveReport();
    this.generateSummaryReport();
    
    console.log('✅ تم إيقاف المراقبة وحفظ التقارير.');
  }

  async performCheck() {
    const checkTime = new Date();
    const checkResults = {
      timestamp: checkTime.toISOString(),
      results: [],
      overallStatus: 'healthy',
      averageResponseTime: 0
    };

    console.log(`🔍 فحص في ${checkTime.toLocaleTimeString('ar-EG')}`);

    let totalResponseTime = 0;
    let successCount = 0;

    for (const endpoint of this.endpoints) {
      const result = await this.checkEndpoint(endpoint);
      checkResults.results.push(result);
      
      if (result.status === 'success') {
        successCount++;
        totalResponseTime += result.responseTime;
      }

      // عرض النتيجة
      const icon = result.status === 'success' ? '✅' : '❌';
      const criticalMark = endpoint.critical ? '🔴' : '🟡';
      console.log(`  ${icon} ${criticalMark} ${endpoint.name}: ${result.responseTime}ms`);

      // إنشاء تنبيه إذا فشل endpoint حرج
      if (result.status !== 'success' && endpoint.critical) {
        this.createAlert(endpoint, result);
        checkResults.overallStatus = 'unhealthy';
      }
    }

    // حساب متوسط وقت الاستجابة
    checkResults.averageResponseTime = successCount > 0 
      ? Math.round(totalResponseTime / successCount) 
      : 0;

    // تحديث الإحصائيات
    this.updateStats(checkResults);

    // حفظ في التاريخ
    this.history.push(checkResults);

    // الاحتفاظ بآخر 100 فحص فقط
    if (this.history.length > 100) {
      this.history.shift();
    }

    console.log(`📊 متوسط الاستجابة: ${checkResults.averageResponseTime}ms | الحالة: ${checkResults.overallStatus}\n`);
  }

  async checkEndpoint(endpoint) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint.path}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'API-Monitor/1.0'
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        endpoint: endpoint.path,
        name: endpoint.name,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        responseTime,
        error: response.ok ? null : `HTTP ${response.status}`
      };

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        endpoint: endpoint.path,
        name: endpoint.name,
        status: 'error',
        statusCode: 0,
        responseTime,
        error: error.message
      };
    }
  }

  createAlert(endpoint, result) {
    const alert = {
      timestamp: new Date().toISOString(),
      endpoint: endpoint.path,
      name: endpoint.name,
      error: result.error,
      statusCode: result.statusCode,
      critical: endpoint.critical
    };

    this.alerts.push(alert);
    
    // الاحتفاظ بآخر 50 تنبيه فقط
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }

    console.log(`🚨 تنبيه: ${endpoint.name} فشل - ${result.error}`);
  }

  updateStats(checkResults) {
    this.stats.totalChecks++;
    
    if (checkResults.overallStatus === 'healthy') {
      this.stats.successfulChecks++;
    } else {
      this.stats.failedChecks++;
    }

    // حساب متوسط وقت الاستجابة الإجمالي
    const totalResponseTimes = this.history
      .concat([checkResults])
      .map(check => check.averageResponseTime)
      .filter(time => time > 0);
    
    this.stats.averageResponseTime = totalResponseTimes.length > 0
      ? Math.round(totalResponseTimes.reduce((sum, time) => sum + time, 0) / totalResponseTimes.length)
      : 0;

    // حساب نسبة التشغيل
    this.stats.uptime = this.stats.totalChecks > 0
      ? Math.round((this.stats.successfulChecks / this.stats.totalChecks) * 100)
      : 100;
  }

  saveReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      recentHistory: this.history.slice(-10), // آخر 10 فحوصات
      recentAlerts: this.alerts.slice(-10), // آخر 10 تنبيهات
      endpoints: this.endpoints
    };

    const reportPath = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const reportFile = path.join(reportPath, 'api-monitor-current.json');
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
  }

  generateSummaryReport() {
    const duration = Date.now() - this.startTime;
    const durationMinutes = Math.round(duration / 60000);

    console.log('\n' + '='.repeat(80));
    console.log('📊 تقرير مراقبة API النهائي');
    console.log('='.repeat(80));
    
    console.log(`⏱️ مدة المراقبة: ${durationMinutes} دقيقة`);
    console.log(`📊 إجمالي الفحوصات: ${this.stats.totalChecks}`);
    console.log(`✅ فحوصات ناجحة: ${this.stats.successfulChecks}`);
    console.log(`❌ فحوصات فاشلة: ${this.stats.failedChecks}`);
    console.log(`📈 نسبة التشغيل: ${this.stats.uptime}%`);
    console.log(`⚡ متوسط وقت الاستجابة: ${this.stats.averageResponseTime}ms`);
    console.log(`🚨 إجمالي التنبيهات: ${this.alerts.length}`);

    // تحليل الأداء
    console.log('\n📈 تحليل الأداء:');
    if (this.stats.uptime >= 99) {
      console.log('  🟢 ممتاز - نسبة تشغيل عالية جداً');
    } else if (this.stats.uptime >= 95) {
      console.log('  🟡 جيد - نسبة تشغيل مقبولة');
    } else {
      console.log('  🔴 يحتاج تحسين - نسبة تشغيل منخفضة');
    }

    if (this.stats.averageResponseTime < 100) {
      console.log('  🟢 سرعة استجابة ممتازة');
    } else if (this.stats.averageResponseTime < 500) {
      console.log('  🟡 سرعة استجابة مقبولة');
    } else {
      console.log('  🔴 سرعة استجابة بطيئة');
    }

    // أكثر المشاكل شيوعاً
    if (this.alerts.length > 0) {
      console.log('\n🚨 أكثر المشاكل شيوعاً:');
      const errorCounts = {};
      this.alerts.forEach(alert => {
        const key = `${alert.name}: ${alert.error}`;
        errorCounts[key] = (errorCounts[key] || 0) + 1;
      });

      Object.entries(errorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([error, count]) => {
          console.log(`  • ${error} (${count} مرة)`);
        });
    }

    // حفظ التقرير النهائي
    const finalReport = {
      summary: this.stats,
      duration: durationMinutes,
      fullHistory: this.history,
      allAlerts: this.alerts,
      endpoints: this.endpoints
    };

    const reportFile = path.join(process.cwd(), 'test-reports', `api-monitor-final-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(finalReport, null, 2));
    
    console.log(`\n💾 التقرير النهائي محفوظ في: ${reportFile}`);
  }
}

// إعداد معالج إيقاف البرنامج
const monitor = new APIMonitor();

process.on('SIGINT', async () => {
  await monitor.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await monitor.stop();
  process.exit(0);
});

// بدء المراقبة
monitor.start().catch(error => {
  console.error('💥 خطأ في بدء المراقبة:', error);
  process.exit(1);
});
