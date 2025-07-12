/**
 * اختبار الأداء تحت الضغط للجدول الموحد
 * تاريخ الإنشاء: 11 يوليو 2025
 */

const mysql = require('mysql2/promise');
const colors = require('colors');

// تثبيت axios إذا لم يكن موجوداً
try {
  require('axios');
} catch (error) {
  console.log('📦 تثبيت axios...'.yellow);
  require('child_process').execSync('npm install axios', { stdio: 'inherit' });
}

const axios = require('axios');

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// إعدادات اختبار الأداء
const STRESS_TEST_CONFIG = {
  apiBaseUrl: 'http://localhost:3002',
  concurrentRequests: 50,
  totalRequests: 500,
  testDuration: 60000, // 60 ثانية
  requestTimeout: 5000, // 5 ثواني
  testCompanyId: 'stress-test-company'
};

class PerformanceStressTest {
  constructor() {
    this.connection = null;
    this.results = {
      requests: [],
      summary: {
        total: 0,
        successful: 0,
        failed: 0,
        timeouts: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        requestsPerSecond: 0
      }
    };
    this.startTime = null;
    this.endTime = null;
  }

  async init() {
    try {
      console.log('🔌 الاتصال بقاعدة البيانات...'.cyan);
      this.connection = await mysql.createConnection(dbConfig);
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'.green);
      return true;
    } catch (error) {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:'.red, error.message);
      return false;
    }
  }

  async prepareTestData() {
    try {
      console.log('🧹 تنظيف البيانات التجريبية السابقة...'.yellow);
      
      // حذف البيانات التجريبية السابقة
      await this.connection.execute(`
        DELETE FROM facebook_pages_unified 
        WHERE company_id = ? OR page_id LIKE 'stress_test_%'
      `, [STRESS_TEST_CONFIG.testCompanyId]);
      
      console.log('✅ تم تنظيف البيانات التجريبية'.green);
      
      // إنشاء بعض البيانات الأساسية للاختبار
      console.log('📊 إنشاء بيانات أساسية للاختبار...'.blue);
      
      for (let i = 1; i <= 10; i++) {
        await this.connection.execute(`
          INSERT INTO facebook_pages_unified 
          (id, company_id, page_id, page_name, access_token, is_active, source_table, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          `stress_base_${i}`,
          STRESS_TEST_CONFIG.testCompanyId,
          `stress_base_page_${i}`,
          `صفحة اختبار أساسية ${i}`,
          `stress_token_${i}`,
          true,
          'unified'
        ]);
      }
      
      console.log('✅ تم إنشاء 10 صفحات أساسية للاختبار'.green);
      
    } catch (error) {
      console.error('❌ خطأ في تحضير البيانات التجريبية:'.red, error.message);
      throw error;
    }
  }

  async makeRequest(requestType, requestId) {
    const startTime = Date.now();
    let result = {
      id: requestId,
      type: requestType,
      startTime,
      endTime: null,
      duration: null,
      success: false,
      statusCode: null,
      error: null
    };

    try {
      let response;
      
      switch (requestType) {
        case 'GET':
          response = await axios.get(
            `${STRESS_TEST_CONFIG.apiBaseUrl}/api/facebook/settings?company_id=${STRESS_TEST_CONFIG.testCompanyId}`,
            { timeout: STRESS_TEST_CONFIG.requestTimeout }
          );
          break;
          
        case 'POST':
          response = await axios.post(
            `${STRESS_TEST_CONFIG.apiBaseUrl}/api/facebook/settings`,
            {
              company_id: STRESS_TEST_CONFIG.testCompanyId,
              page_id: `stress_test_${requestId}_${Date.now()}`,
              page_name: `صفحة اختبار ضغط ${requestId}`,
              access_token: `stress_token_${requestId}_${Date.now()}`
            },
            { timeout: STRESS_TEST_CONFIG.requestTimeout }
          );
          break;
          
        case 'PUT':
          response = await axios.put(
            `${STRESS_TEST_CONFIG.apiBaseUrl}/api/facebook/settings/stress_base_page_1/company`,
            { company_id: `${STRESS_TEST_CONFIG.testCompanyId}_updated_${requestId}` },
            { timeout: STRESS_TEST_CONFIG.requestTimeout }
          );
          break;
          
        default:
          throw new Error(`نوع طلب غير مدعوم: ${requestType}`);
      }
      
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
      result.success = true;
      result.statusCode = response.status;
      
    } catch (error) {
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
      result.success = false;
      result.error = error.message;
      
      if (error.code === 'ECONNABORTED') {
        result.error = 'Timeout';
      } else if (error.response) {
        result.statusCode = error.response.status;
      }
    }
    
    return result;
  }

  async runConcurrentRequests(requestType, count) {
    console.log(`🚀 تشغيل ${count} طلب ${requestType} متزامن...`.blue);
    
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(this.makeRequest(requestType, i));
    }
    
    const results = await Promise.all(promises);
    this.results.requests.push(...results);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`  ✅ نجح: ${successful}/${count} (${((successful/count)*100).toFixed(1)}%)`.green);
    console.log(`  ❌ فشل: ${failed}/${count} (${((failed/count)*100).toFixed(1)}%)`.red);
    
    return results;
  }

  async runStressTest() {
    console.log('🔥 بدء اختبار الأداء تحت الضغط...'.red.bold);
    console.log(`⚡ الطلبات المتزامنة: ${STRESS_TEST_CONFIG.concurrentRequests}`.cyan);
    console.log(`📊 إجمالي الطلبات: ${STRESS_TEST_CONFIG.totalRequests}`.cyan);
    console.log(`⏱️ مهلة الطلب: ${STRESS_TEST_CONFIG.requestTimeout}ms`.cyan);
    
    this.startTime = Date.now();
    
    try {
      // اختبار طلبات GET
      await this.runConcurrentRequests('GET', STRESS_TEST_CONFIG.concurrentRequests);
      
      // تأخير قصير
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // اختبار طلبات POST
      await this.runConcurrentRequests('POST', Math.floor(STRESS_TEST_CONFIG.concurrentRequests / 2));
      
      // تأخير قصير
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // اختبار طلبات PUT
      await this.runConcurrentRequests('PUT', Math.floor(STRESS_TEST_CONFIG.concurrentRequests / 4));
      
    } catch (error) {
      console.error('❌ خطأ في اختبار الأداء:'.red, error.message);
    }
    
    this.endTime = Date.now();
  }

  calculateSummary() {
    const requests = this.results.requests;
    
    this.results.summary.total = requests.length;
    this.results.summary.successful = requests.filter(r => r.success).length;
    this.results.summary.failed = requests.filter(r => !r.success).length;
    this.results.summary.timeouts = requests.filter(r => r.error === 'Timeout').length;
    
    const successfulRequests = requests.filter(r => r.success && r.duration);
    if (successfulRequests.length > 0) {
      const totalDuration = successfulRequests.reduce((sum, r) => sum + r.duration, 0);
      this.results.summary.averageResponseTime = totalDuration / successfulRequests.length;
      this.results.summary.minResponseTime = Math.min(...successfulRequests.map(r => r.duration));
      this.results.summary.maxResponseTime = Math.max(...successfulRequests.map(r => r.duration));
    }
    
    const testDuration = (this.endTime - this.startTime) / 1000; // بالثواني
    this.results.summary.requestsPerSecond = this.results.summary.total / testDuration;
  }

  generateReport() {
    this.calculateSummary();
    
    console.log('\n📊 تقرير اختبار الأداء تحت الضغط'.green.bold);
    console.log('='.repeat(60).cyan);
    
    const summary = this.results.summary;
    
    console.log(`📈 إجمالي الطلبات: ${summary.total}`.white);
    console.log(`✅ نجح: ${summary.successful} (${((summary.successful/summary.total)*100).toFixed(1)}%)`.green);
    console.log(`❌ فشل: ${summary.failed} (${((summary.failed/summary.total)*100).toFixed(1)}%)`.red);
    console.log(`⏰ انتهت المهلة: ${summary.timeouts} (${((summary.timeouts/summary.total)*100).toFixed(1)}%)`.yellow);
    
    console.log(`\n⚡ الأداء:`.blue.bold);
    console.log(`  📊 متوسط وقت الاستجابة: ${summary.averageResponseTime.toFixed(2)}ms`.white);
    console.log(`  🚀 أسرع استجابة: ${summary.minResponseTime}ms`.green);
    console.log(`  🐌 أبطأ استجابة: ${summary.maxResponseTime}ms`.red);
    console.log(`  📈 طلبات في الثانية: ${summary.requestsPerSecond.toFixed(2)} req/s`.cyan);
    
    // تحليل النتائج
    console.log(`\n🎯 تحليل النتائج:`.blue.bold);
    
    const successRate = (summary.successful / summary.total) * 100;
    if (successRate >= 95) {
      console.log('🎉 أداء ممتاز! النظام يتحمل الضغط بشكل رائع'.green.bold);
    } else if (successRate >= 85) {
      console.log('👍 أداء جيد! النظام يتحمل الضغط بشكل مقبول'.yellow.bold);
    } else if (successRate >= 70) {
      console.log('⚠️ أداء متوسط! يحتاج تحسين'.orange.bold);
    } else {
      console.log('🚨 أداء ضعيف! يحتاج مراجعة فورية'.red.bold);
    }
    
    if (summary.averageResponseTime < 100) {
      console.log('⚡ وقت الاستجابة ممتاز (< 100ms)'.green);
    } else if (summary.averageResponseTime < 500) {
      console.log('👍 وقت الاستجابة جيد (< 500ms)'.yellow);
    } else {
      console.log('🐌 وقت الاستجابة بطيء (> 500ms)'.red);
    }
  }

  async cleanup() {
    try {
      console.log('\n🧹 تنظيف البيانات التجريبية...'.yellow);
      
      await this.connection.execute(`
        DELETE FROM facebook_pages_unified 
        WHERE company_id LIKE '%stress%' OR page_id LIKE 'stress_%'
      `);
      
      console.log('✅ تم تنظيف البيانات التجريبية'.green);
    } catch (error) {
      console.error('❌ خطأ في تنظيف البيانات:'.red, error.message);
    }
  }

  async runFullTest() {
    try {
      await this.prepareTestData();
      await this.runStressTest();
      this.generateReport();
      await this.cleanup();
    } catch (error) {
      console.error('❌ خطأ في تشغيل اختبار الأداء:'.red, error.message);
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('\n🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل اختبار الأداء
async function runStressTest() {
  const stressTest = new PerformanceStressTest();
  
  if (await stressTest.init()) {
    await stressTest.runFullTest();
    await stressTest.close();
  } else {
    console.error('❌ فشل في تهيئة اختبار الأداء'.red);
    process.exit(1);
  }
}

// تشغيل الاختبار إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runStressTest().catch(console.error);
}

module.exports = { PerformanceStressTest };
