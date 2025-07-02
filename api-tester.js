/**
 * 🧪 أداة اختبار API شاملة
 * تختبر جميع endpoints مع تقارير مفصلة
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

class APITester {
  constructor() {
    this.baseURL = 'http://localhost:3002';
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      endpoints: [],
      performance: {
        fastest: { endpoint: '', time: Infinity },
        slowest: { endpoint: '', time: 0 },
        average: 0
      }
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 بدء اختبار جميع API endpoints...\n');

    // 1. Create a new company to get a valid ID
    const companyName = `Test Company ${Date.now()}`;
    const companyEmail = `test-${Date.now()}@example.com`;
    let companyId;

    try {
      const response = await fetch(`${this.baseURL}/api/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName, email: companyEmail })
      });
      const data = await response.json();
      if (!data.success) throw new Error('Failed to create company for testing');
      companyId = data.data.id;
      console.log(`✅ تم إنشاء شركة اختبارية بالـ ID: ${companyId}`);
    } catch (error) {
      console.error('💥 فشل حاسم: لا يمكن إنشاء شركة للاختبار. إنهاء الاختبارات.', error);
      return;
    }

    // قائمة endpoints للاختبار
    const endpoints = [
      // Store Management Lifecycle Test
      { method: 'POST', path: `/api/companies/${companyId}/store`, name: 'إنشاء متجر جديد', 
        body: { name: 'متجر الاختبار', slug: `test-store-${companyId}`, owner_email: `test-${companyId}@lifecycle.com` }, expectedStatus: 201 },
      { method: 'GET', path: `/api/companies/${companyId}/store`, name: 'جلب المتجر للتحقق', expectedStatus: 200, delay: 200 },
      { method: 'DELETE', path: `/api/companies/${companyId}/store`, name: 'حذف المتجر', expectedStatus: 200 },
      { method: 'GET', path: `/api/companies/${companyId}/store`, name: 'التحقق من حذف المتجر', expectedStatus: 404, delay: 500, retries: 2 },
    ];

    // تشغيل الاختبارات
    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }

    // إنشاء التقرير
    this.generateReport();
  }

  async testEndpoint(endpoint) {
    if (endpoint.delay) {
      await this.delay(endpoint.delay);
    }

    for (let i = 0; i <= (endpoint.retries || 0); i++) {
      const startTime = Date.now();
      let result = {
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        status: 'unknown',
        responseTime: 0,
        statusCode: 0,
        error: null,
        responseSize: 0,
        headers: {},
        attempt: i + 1
      };

      try {
        console.log(`🔍 اختبار (محاولة ${i + 1}): ${endpoint.method} ${endpoint.path} - ${endpoint.name}`);

        const options = {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'API-Tester/1.0'
          }
        };

        if (endpoint.body) {
          options.body = JSON.stringify(endpoint.body);
        }

        const response = await fetch(`${this.baseURL}${endpoint.path}`, options);
        const endTime = Date.now();
        
        result.responseTime = endTime - startTime;
        result.statusCode = response.status;
        result.headers = Object.fromEntries(response.headers.entries());
        
        const text = await response.text();
        result.responseSize = text.length;

        const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
          ? endpoint.expectedStatus 
          : [endpoint.expectedStatus];

        if (expectedStatuses.includes(response.status)) {
          result.status = 'passed';
          this.results.passed++;
          console.log(`  ✅ نجح - ${response.status} (${result.responseTime}ms)`);
          this.results.endpoints.push(result);
          return;
        } else {
          if (i < (endpoint.retries || 0)) {
            console.log(`  🟡 فشل مؤقت - ${response.status} (متوقع: ${expectedStatuses.join('/')})... إعادة المحاولة`);
            await this.delay(500); // تأخير قبل إعادة المحاولة
            continue;
          }
          result.status = 'failed';
          result.error = `حالة غير متوقعة: ${response.status}`;
          this.results.failed++;
          console.log(`  ❌ فشل - ${response.status} (متوقع: ${expectedStatuses.join('/')}) (${result.responseTime}ms)`);
        }

      } catch (error) {
        const endTime = Date.now();
        result.responseTime = endTime - startTime;
        result.status = 'error';
        result.error = error.message;
        this.results.failed++;
        console.log(`  💥 خطأ - ${error.message} (${result.responseTime}ms)`);
      }

      this.results.total++;
      this.results.endpoints.push(result);
    }
  }

  updatePerformanceStats(endpoint, time) {
    if (time < this.results.performance.fastest.time) {
      this.results.performance.fastest = { endpoint, time };
    }
    if (time > this.results.performance.slowest.time) {
      this.results.performance.slowest = { endpoint, time };
    }
  }

  generateReport() {
    const endTime = Date.now();
    const totalTime = Math.round((endTime - this.startTime) / 1000);
    
    // حساب متوسط وقت الاستجابة
    const totalResponseTime = this.results.endpoints.reduce((sum, ep) => sum + ep.responseTime, 0);
    this.results.performance.average = Math.round(totalResponseTime / this.results.total);

    console.log('\n' + '='.repeat(80));
    console.log('📊 تقرير اختبار API');
    console.log('='.repeat(80));

    // ملخص النتائج
    console.log('\n🎯 ملخص النتائج:');
    console.log(`📊 إجمالي الاختبارات: ${this.results.total}`);
    console.log(`✅ نجح: ${this.results.passed}`);
    console.log(`❌ فشل: ${this.results.failed}`);
    console.log(`📈 نسبة النجاح: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
    console.log(`⏱️ وقت الاختبار: ${totalTime} ثانية`);

    // إحصائيات الأداء
    console.log('\n⚡ إحصائيات الأداء:');
    console.log(`📊 متوسط وقت الاستجابة: ${this.results.performance.average}ms`);
    console.log(`🚀 أسرع endpoint: ${this.results.performance.fastest.endpoint} (${this.results.performance.fastest.time}ms)`);
    console.log(`🐌 أبطأ endpoint: ${this.results.performance.slowest.endpoint} (${this.results.performance.slowest.time}ms)`);

    // تفاصيل الاختبارات الفاشلة
    const failedTests = this.results.endpoints.filter(ep => ep.status !== 'passed');
    if (failedTests.length > 0) {
      console.log('\n❌ الاختبارات الفاشلة:');
      failedTests.forEach(test => {
        console.log(`  • ${test.method} ${test.path} - ${test.name}`);
        console.log(`    الخطأ: ${test.error || `حالة غير متوقعة: ${test.statusCode}`}`);
      });
    }

    // تحليل الحالات
    this.analyzeStatusCodes();

    // التوصيات
    this.generateRecommendations();

    // حفظ التقرير
    this.saveReport();
  }

  analyzeStatusCodes() {
    console.log('\n📋 تحليل حالات الاستجابة:');
    
    const statusCounts = {};
    this.results.endpoints.forEach(ep => {
      const status = ep.statusCode;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = Math.round((count / this.results.total) * 100);
      const icon = this.getStatusIcon(status);
      console.log(`  ${icon} ${status}: ${count} (${percentage}%)`);
    });
  }

  getStatusIcon(status) {
    if (status >= 200 && status < 300) return '✅';
    if (status >= 300 && status < 400) return '🔄';
    if (status >= 400 && status < 500) return '⚠️';
    if (status >= 500) return '❌';
    return '❓';
  }

  generateRecommendations() {
    console.log('\n💡 التوصيات:');

    const avgTime = this.results.performance.average;
    if (avgTime > 1000) {
      console.log('  • تحسين أداء API - وقت الاستجابة بطيء جداً');
    } else if (avgTime > 500) {
      console.log('  • مراجعة أداء API - وقت الاستجابة يمكن تحسينه');
    }

    const failureRate = (this.results.failed / this.results.total) * 100;
    if (failureRate > 20) {
      console.log('  • إصلاح endpoints الفاشلة - نسبة فشل عالية');
    }

    const errorTests = this.results.endpoints.filter(ep => ep.status === 'error');
    if (errorTests.length > 0) {
      console.log('  • فحص اتصال الخادم - بعض endpoints غير متاحة');
    }

    const slowTests = this.results.endpoints.filter(ep => ep.responseTime > 2000);
    if (slowTests.length > 0) {
      console.log('  • تحسين endpoints البطيئة:');
      slowTests.forEach(test => {
        console.log(`    - ${test.path} (${test.responseTime}ms)`);
      });
    }
  }

  saveReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: Math.round((this.results.passed / this.results.total) * 100)
      },
      performance: this.results.performance,
      endpoints: this.results.endpoints,
      duration: Math.round((Date.now() - this.startTime) / 1000)
    };

    const reportPath = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const reportFile = path.join(reportPath, `api-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));

    console.log(`\n💾 تم حفظ التقرير في: ${reportFile}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// تشغيل اختبار API
const tester = new APITester();
tester.runAllTests().catch(error => {
  console.error('💥 خطأ في اختبار API:', error);
  process.exit(1);
});
