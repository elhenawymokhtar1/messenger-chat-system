// تم فحص الأداة - console.log مقبول في أدوات التشخيص
/**
 * 🧪 مجموعات اختبار API شاملة
 * تحتوي على جميع السيناريوهات والاختبارات
 */

import AdvancedAPITester from './advanced-api-tester.js';

async function runAllAPITests() {
  const tester = new AdvancedAPITester();

  // 1️⃣ مجموعة اختبارات الأساسية
  const basicCollection = tester.createCollection(
    'الاختبارات الأساسية',
    'اختبار endpoints الأساسية للتأكد من عمل الخادم'
  );

  tester.addRequest(basicCollection, {
    name: 'فحص صحة الخادم',
    method: 'GET',
    url: '{{baseURL}}/api/health',
    expectedStatus: 200,
    tests: [
      {
        name: 'الاستجابة سريعة',
        script: `
          pm.test("وقت الاستجابة أقل من 1000ms", function() {
            expect.toBeLessThan(response.time, 1000);
          });
        `
      },
      {
        name: 'الحالة صحيحة',
        script: `
          pm.test("حالة الاستجابة 200", function() {
            expect.toBe(response.status, 200);
          });
        `
      }
    ]
  });

  // 2️⃣ مجموعة اختبارات المصادقة
  const authCollection = tester.createCollection(
    'اختبارات المصادقة',
    'اختبار تسجيل الدخول والتسجيل والأمان'
  );

  tester.addRequest(authCollection, {
    name: 'تسجيل دخول صحيح',
    method: 'POST',
    url: '{{baseURL}}/api/companies/login',
    body: {
      email: '{{testEmail}}',
      password: '{{testPassword}}'
    },
    expectedStatus: [200, 401],
    tests: [
      {
        name: 'استجابة JSON صحيحة',
        script: `
          pm.test("الاستجابة JSON", function() {
            expect.toBe(typeof response.body, 'object');
          });
        `
      }
    ]
  });

  tester.addRequest(authCollection, {
    name: 'تسجيل دخول ببيانات خاطئة',
    method: 'POST',
    url: '{{baseURL}}/api/companies/login',
    body: {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    },
    expectedStatus: 401,
    tests: [
      {
        name: 'رفض البيانات الخاطئة',
        script: `
          pm.test("رفض تسجيل الدخول", function() {
            expect.toBe(response.status, 401);
          });
        `
      }
    ]
  });

  // 3️⃣ مجموعة اختبارات الشركات
  const companiesCollection = tester.createCollection(
    'اختبارات الشركات',
    'اختبار إدارة بيانات الشركات'
  );

  tester.addRequest(companiesCollection, {
    name: 'قائمة الشركات',
    method: 'GET',
    url: '{{baseURL}}/api/companies',
    expectedStatus: 200,
    tests: [
      {
        name: 'قائمة صحيحة',
        script: `
          pm.test("الاستجابة مصفوفة", function() {
            expect.toBe(Array.isArray(response.body), true);
          });
        `
      }
    ]
  });

  tester.addRequest(companiesCollection, {
    name: 'تسجيل شركة جديدة',
    method: 'POST',
    url: '{{baseURL}}/api/companies/register',
    body: {
      name: 'شركة اختبار API',
      email: 'api-test@example.com',
      password: 'testpassword123'
    },
    expectedStatus: [201, 409],
    tests: [
      {
        name: 'استجابة التسجيل',
        script: `
          pm.test("استجابة صحيحة للتسجيل", function() {
            if (response.status === 201) {
              expect.toBe(typeof response.body.id, 'number');
            }
          });
        `
      }
    ]
  });

  // 4️⃣ مجموعة اختبارات الرسائل
  const messagesCollection = tester.createCollection(
    'اختبارات الرسائل',
    'اختبار إرسال واستقبال الرسائل'
  );

  tester.addRequest(messagesCollection, {
    name: 'قائمة الرسائل',
    method: 'GET',
    url: '{{baseURL}}/api/messages',
    expectedStatus: 200,
    tests: [
      {
        name: 'بيانات الرسائل',
        script: `
          pm.test("بيانات الرسائل صحيحة", function() {
            expect.toBe(typeof response.body, 'object');
          });
        `
      }
    ]
  });

  // 5️⃣ مجموعة اختبارات الأداء
  const performanceCollection = tester.createCollection(
    'اختبارات الأداء',
    'اختبار سرعة الاستجابة والأداء'
  );

  // إضافة عدة طلبات متتالية لاختبار الأداء
  for (let i = 1; i <= 5; i++) {
    tester.addRequest(performanceCollection, {
      name: `اختبار أداء ${i}`,
      method: 'GET',
      url: '{{baseURL}}/api/health',
      expectedStatus: 200,
      tests: [
        {
          name: `الأداء ${i}`,
          script: `
            pm.test("وقت الاستجابة معقول", function() {
              expect.toBeLessThan(response.time, 2000);
            });
          `
        }
      ]
    });
  }

  // 6️⃣ مجموعة اختبارات الأمان
  const securityCollection = tester.createCollection(
    'اختبارات الأمان',
    'اختبار الثغرات الأمنية والحماية'
  );

  tester.addRequest(securityCollection, {
    name: 'اختبار SQL Injection',
    method: 'POST',
    url: '{{baseURL}}/api/companies/login',
    body: {
      email: "admin'; DROP TABLE companies; --",
      password: 'test'
    },
    expectedStatus: [400, 401],
    tests: [
      {
        name: 'حماية من SQL Injection',
        script: `
          pm.test("رفض SQL injection", function() {
            expect.toBe(response.status !== 200, true);
          });
        `
      }
    ]
  });

  tester.addRequest(securityCollection, {
    name: 'اختبار XSS',
    method: 'POST',
    url: '{{baseURL}}/api/companies/register',
    body: {
      name: '<script>alert("xss")</script>',
      email: 'xss@test.com',
      password: 'test123'
    },
    expectedStatus: [400, 401, 409],
    tests: [
      {
        name: 'حماية من XSS',
        script: `
          pm.test("رفض XSS", function() {
            if (response.body && response.body.name) {
              expect.toBe(response.body.name.includes('<script>'), false);
            }
          });
        `
      }
    ]
  });

  // تشغيل جميع المجموعات
  console.log('🚀 بدء تشغيل جميع مجموعات اختبار API...\n');

  try {
    await tester.runCollection(basicCollection);
    await tester.runCollection(authCollection);
    await tester.runCollection(companiesCollection);
    await tester.runCollection(messagesCollection);
    await tester.runCollection(performanceCollection);
    await tester.runCollection(securityCollection);

    // إنشاء التقرير النهائي
    console.log('\n📊 إنشاء التقرير النهائي...');
    tester.generateHTMLReport();

    // ملخص النتائج
    const totalCollections = tester.results.length;
    const totalRequests = tester.results.reduce((sum, col) => sum + col.summary.total, 0);
    const totalPassed = tester.results.reduce((sum, col) => sum + col.summary.passed, 0);
    const totalFailed = tester.results.reduce((sum, col) => sum + col.summary.failed, 0);
    const successRate = Math.round((totalPassed / totalRequests) * 100);

    console.log('\n' + '='.repeat(80));
    console.log('🎯 ملخص نهائي لجميع اختبارات API');
    console.log('='.repeat(80));
    console.log(`📁 المجموعات: ${totalCollections}`);
    console.log(`📊 إجمالي الطلبات: ${totalRequests}`);
    console.log(`✅ نجح: ${totalPassed}`);
    console.log(`❌ فشل: ${totalFailed}`);
    console.log(`📈 نسبة النجاح: ${successRate}%`);

    // تقييم الجودة
    let grade = 'ممتاز';
    if (successRate < 70) grade = 'يحتاج تحسين';
    else if (successRate < 85) grade = 'جيد';
    else if (successRate < 95) grade = 'جيد جداً';

    console.log(`🏆 التقييم: ${grade}`);

    // التوصيات
    console.log('\n💡 التوصيات:');
    if (totalFailed > 0) {
      console.log(`  • إصلاح ${totalFailed} endpoint فاشل`);
    }
    if (successRate < 90) {
      console.log('  • تحسين استقرار API');
    }
    console.log('  • مراجعة التقرير HTML للتفاصيل الكاملة');

  } catch (error) {
    console.error('💥 خطأ في تشغيل الاختبارات:', error);
  }
}

// تشغيل الاختبارات
runAllAPITests();
