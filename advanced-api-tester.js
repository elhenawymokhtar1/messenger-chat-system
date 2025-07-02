/**
 * 🚀 أداة اختبار API متقدمة (مثل Postman)
 * تدعم Collections, Environment Variables, Tests, وأكثر
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

class AdvancedAPITester {
  constructor() {
    this.baseURL = 'http://localhost:3002';
    this.environment = {
      baseURL: 'http://localhost:3002',
      authToken: '',
      companyId: '',
      testEmail: 'test@example.com',
      testPassword: 'test123'
    };
    this.collections = [];
    this.results = [];
    this.globalVariables = new Map();
  }

  // إنشاء Collection للاختبارات
  createCollection(name, description) {
    const collection = {
      name,
      description,
      requests: [],
      preRequestScript: null,
      postRequestScript: null
    };
    this.collections.push(collection);
    return collection;
  }

  // إضافة طلب للـ Collection
  addRequest(collection, request) {
    const fullRequest = {
      id: Date.now() + Math.random(),
      name: request.name,
      method: request.method,
      url: request.url,
      headers: request.headers || {},
      body: request.body || null,
      tests: request.tests || [],
      preRequestScript: request.preRequestScript || null,
      expectedStatus: request.expectedStatus || 200,
      timeout: request.timeout || 5000
    };
    collection.requests.push(fullRequest);
    return fullRequest;
  }

  // تشغيل Collection كاملة
  async runCollection(collection) {
    console.log(`\n🚀 تشغيل Collection: ${collection.name}`);
    console.log(`📝 الوصف: ${collection.description}\n`);

    const collectionResults = {
      name: collection.name,
      startTime: Date.now(),
      requests: [],
      summary: { total: 0, passed: 0, failed: 0 }
    };

    for (const request of collection.requests) {
      const result = await this.executeRequest(request);
      collectionResults.requests.push(result);
      collectionResults.summary.total++;
      
      if (result.status === 'passed') {
        collectionResults.summary.passed++;
      } else {
        collectionResults.summary.failed++;
      }
    }

    collectionResults.endTime = Date.now();
    collectionResults.duration = collectionResults.endTime - collectionResults.startTime;
    
    this.results.push(collectionResults);
    return collectionResults;
  }

  // تنفيذ طلب واحد
  async executeRequest(request) {
    const startTime = Date.now();
    console.log(`🔍 ${request.method} ${request.name}`);

    const result = {
      id: request.id,
      name: request.name,
      method: request.method,
      url: this.replaceVariables(request.url),
      startTime,
      endTime: 0,
      responseTime: 0,
      status: 'unknown',
      statusCode: 0,
      response: null,
      error: null,
      testResults: []
    };

    try {
      // تنفيذ Pre-request Script
      if (request.preRequestScript) {
        await this.executeScript(request.preRequestScript, 'pre-request');
      }

      // إعداد الطلب
      const options = {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...this.replaceVariablesInObject(request.headers)
        },
        timeout: request.timeout
      };

      if (request.body) {
        options.body = JSON.stringify(this.replaceVariablesInObject(request.body));
      }

      // تنفيذ الطلب
      const response = await fetch(result.url, options);
      result.endTime = Date.now();
      result.responseTime = result.endTime - startTime;
      result.statusCode = response.status;

      // قراءة الاستجابة
      const responseText = await response.text();
      try {
        result.response = JSON.parse(responseText);
      } catch {
        result.response = responseText;
      }

      // تشغيل الاختبارات
      result.testResults = await this.runTests(request.tests, response, result.response);
      
      // تحديد حالة النجاح/الفشل
      const statusMatch = Array.isArray(request.expectedStatus) 
        ? request.expectedStatus.includes(response.status)
        : response.status === request.expectedStatus;
      
      const allTestsPassed = result.testResults.every(test => test.passed);
      
      result.status = statusMatch && allTestsPassed ? 'passed' : 'failed';

      // عرض النتيجة
      const icon = result.status === 'passed' ? '✅' : '❌';
      console.log(`  ${icon} ${response.status} (${result.responseTime}ms)`);
      
      if (result.testResults.length > 0) {
        result.testResults.forEach(test => {
          const testIcon = test.passed ? '✅' : '❌';
          console.log(`    ${testIcon} ${test.name}`);
        });
      }

    } catch (error) {
      result.endTime = Date.now();
      result.responseTime = result.endTime - startTime;
      result.status = 'error';
      result.error = error.message;
      console.log(`  💥 خطأ: ${error.message} (${result.responseTime}ms)`);
    }

    return result;
  }

  // تشغيل الاختبارات
  async runTests(tests, response, responseBody) {
    const testResults = [];

    for (const test of tests) {
      const testResult = {
        name: test.name,
        passed: false,
        error: null
      };

      try {
        // إنشاء context للاختبار
        const testContext = {
          response: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseBody,
            time: response.responseTime
          },
          expect: this.createExpectObject(),
          pm: {
            test: (name, fn) => {
              testResult.name = name;
              fn();
            },
            environment: {
              get: (key) => this.environment[key],
              set: (key, value) => { this.environment[key] = value; }
            },
            globals: {
              get: (key) => this.globalVariables.get(key),
              set: (key, value) => this.globalVariables.set(key, value)
            }
          }
        };

        // تنفيذ الاختبار
        const testFunction = new Function('pm', 'response', 'expect', test.script);
        testFunction(testContext.pm, testContext.response, testContext.expect);
        
        testResult.passed = true;
      } catch (error) {
        testResult.passed = false;
        testResult.error = error.message;
      }

      testResults.push(testResult);
    }

    return testResults;
  }

  // إنشاء كائن expect للاختبارات
  createExpectObject() {
    return {
      toBe: (actual, expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`);
        }
      },
      toEqual: (actual, expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
      },
      toContain: (actual, expected) => {
        if (!actual.includes(expected)) {
          throw new Error(`Expected "${actual}" to contain "${expected}"`);
        }
      },
      toBeGreaterThan: (actual, expected) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toBeLessThan: (actual, expected) => {
        if (actual >= expected) {
          throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
      }
    };
  }

  // استبدال المتغيرات في النص
  replaceVariables(text) {
    if (typeof text !== 'string') return text;
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return this.environment[varName] || this.globalVariables.get(varName) || match;
    });
  }

  // استبدال المتغيرات في الكائن
  replaceVariablesInObject(obj) {
    if (!obj) return obj;
    
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.replaceVariables(value);
      } else if (typeof value === 'object') {
        result[key] = this.replaceVariablesInObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  // تنفيذ script
  async executeScript(script, type) {
    try {
      const scriptFunction = new Function('pm', 'environment', script);
      const pm = {
        environment: {
          get: (key) => this.environment[key],
          set: (key, value) => { this.environment[key] = value; }
        },
        globals: {
          get: (key) => this.globalVariables.get(key),
          set: (key, value) => this.globalVariables.set(key, value)
        }
      };
      
      scriptFunction(pm, this.environment);
    } catch (error) {
      console.log(`⚠️ خطأ في ${type} script: ${error.message}`);
    }
  }

  // إنشاء تقرير HTML
  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير اختبار API</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .collection { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .collection-header { background: #007bff; color: white; padding: 15px; }
        .request { padding: 15px; border-bottom: 1px solid #eee; }
        .request:last-child { border-bottom: none; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; margin-left: 10px; }
        .GET { background: #28a745; }
        .POST { background: #ffc107; color: #000; }
        .PUT { background: #17a2b8; }
        .DELETE { background: #dc3545; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .test-result { margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 تقرير اختبار API</h1>
            <p>تم إنشاؤه في: ${new Date().toLocaleString('ar-EG')}</p>
        </div>
        
        <div class="summary">
            ${this.generateSummaryCards()}
        </div>
        
        <div class="collections">
            ${this.results.map(collection => this.generateCollectionHTML(collection)).join('')}
        </div>
    </div>
</body>
</html>`;

    const reportPath = path.join(process.cwd(), 'test-reports', 'api-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`\n📄 تقرير HTML محفوظ في: ${reportPath}`);
  }

  generateSummaryCards() {
    const totalRequests = this.results.reduce((sum, col) => sum + col.summary.total, 0);
    const totalPassed = this.results.reduce((sum, col) => sum + col.summary.passed, 0);
    const totalFailed = this.results.reduce((sum, col) => sum + col.summary.failed, 0);
    const successRate = totalRequests > 0 ? Math.round((totalPassed / totalRequests) * 100) : 0;

    return `
        <div class="stat-card">
            <div class="stat-number">${totalRequests}</div>
            <div>إجمالي الطلبات</div>
        </div>
        <div class="stat-card">
            <div class="stat-number passed">${totalPassed}</div>
            <div>نجح</div>
        </div>
        <div class="stat-card">
            <div class="stat-number failed">${totalFailed}</div>
            <div>فشل</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${successRate}%</div>
            <div>نسبة النجاح</div>
        </div>
    `;
  }

  generateCollectionHTML(collection) {
    return `
        <div class="collection">
            <div class="collection-header">
                <h3>${collection.name}</h3>
                <p>المدة: ${collection.duration}ms | نجح: ${collection.summary.passed}/${collection.summary.total}</p>
            </div>
            ${collection.requests.map(request => this.generateRequestHTML(request)).join('')}
        </div>
    `;
  }

  generateRequestHTML(request) {
    const statusClass = request.status === 'passed' ? 'status-passed' : 'status-failed';
    const statusIcon = request.status === 'passed' ? '✅' : '❌';
    
    return `
        <div class="request">
            <div>
                <span class="method ${request.method}">${request.method}</span>
                <strong>${request.name}</strong>
                <span class="${statusClass}">${statusIcon} ${request.statusCode} (${request.responseTime}ms)</span>
            </div>
            ${request.testResults.length > 0 ? `
                <div style="margin-top: 10px;">
                    <strong>نتائج الاختبارات:</strong>
                    ${request.testResults.map(test => `
                        <div class="test-result">
                            ${test.passed ? '✅' : '❌'} ${test.name}
                            ${test.error ? `<br><small style="color: #dc3545;">${test.error}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
  }
}

export default AdvancedAPITester;
