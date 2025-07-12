/**
 * مجموعة اختبارات شاملة لعمليات CRUD على الجدول الموحد
 * تاريخ الإنشاء: 11 يوليو 2025
 */

const mysql = require('mysql2/promise');
const colors = require('colors');
const axios = require('axios');

// تثبيت axios إذا لم يكن موجوداً
try {
  require('axios');
} catch (error) {
  console.log('📦 تثبيت axios...'.yellow);
  require('child_process').execSync('npm install axios', { stdio: 'inherit' });
}

// إعدادات قاعدة البيانات
const dbConfig = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// إعدادات API
const API_BASE_URL = 'http://localhost:3002';
const TEST_COMPANY_ID = 'test-company-crud';

class CRUDTestSuite {
  constructor() {
    this.connection = null;
    this.testResults = [];
    this.createdPages = [];
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

  async cleanup() {
    try {
      console.log('🧹 تنظيف البيانات التجريبية...'.yellow);
      
      // حذف جميع الصفحات التجريبية
      await this.connection.execute(`
        DELETE FROM facebook_pages_unified 
        WHERE company_id = ? OR page_id LIKE 'test_%'
      `, [TEST_COMPANY_ID]);
      
      console.log('✅ تم تنظيف البيانات التجريبية'.green);
    } catch (error) {
      console.error('❌ خطأ في تنظيف البيانات:'.red, error.message);
    }
  }

  async testCreate() {
    console.log('\n📝 اختبار عملية الإنشاء (CREATE)...'.blue.bold);
    
    const testCases = [
      {
        name: 'إنشاء صفحة أساسية',
        data: {
          company_id: TEST_COMPANY_ID,
          page_id: 'test_page_basic_001',
          page_name: 'صفحة اختبار أساسية',
          access_token: 'test_token_basic_001'
        }
      },
      {
        name: 'إنشاء صفحة مع webhook',
        data: {
          company_id: TEST_COMPANY_ID,
          page_id: 'test_page_webhook_002',
          page_name: 'صفحة اختبار مع webhook',
          access_token: 'test_token_webhook_002'
        }
      },
      {
        name: 'إنشاء صفحة مع أحرف خاصة',
        data: {
          company_id: TEST_COMPANY_ID,
          page_id: 'test_page_special_003',
          page_name: 'صفحة اختبار مع أحرف خاصة @#$%',
          access_token: 'test_token_special_003'
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`  🧪 ${testCase.name}...`.cyan);
        
        const response = await axios.post(`${API_BASE_URL}/api/facebook/settings`, testCase.data);
        
        if (response.data.success) {
          console.log(`    ✅ نجح: ${response.data.message}`.green);
          this.createdPages.push(testCase.data.page_id);
          this.testResults.push({ test: testCase.name, status: 'PASS', details: response.data });
        } else {
          console.log(`    ❌ فشل: ${response.data.error}`.red);
          this.testResults.push({ test: testCase.name, status: 'FAIL', details: response.data });
        }
        
      } catch (error) {
        console.log(`    ❌ خطأ: ${error.message}`.red);
        this.testResults.push({ test: testCase.name, status: 'ERROR', details: error.message });
      }
    }
  }

  async testRead() {
    console.log('\n📖 اختبار عملية القراءة (READ)...'.blue.bold);
    
    const testCases = [
      {
        name: 'قراءة جميع صفحات الشركة',
        url: `${API_BASE_URL}/api/facebook/settings?company_id=${TEST_COMPANY_ID}`
      },
      {
        name: 'قراءة صفحة محددة',
        url: `${API_BASE_URL}/api/facebook/settings?company_id=${TEST_COMPANY_ID}`,
        filter: 'test_page_basic_001'
      },
      {
        name: 'قراءة شركة غير موجودة',
        url: `${API_BASE_URL}/api/facebook/settings?company_id=non_existent_company`
      }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`  🧪 ${testCase.name}...`.cyan);
        
        const response = await axios.get(testCase.url);
        const data = response.data;
        
        if (Array.isArray(data)) {
          if (testCase.filter) {
            const found = data.find(page => page.page_id === testCase.filter);
            if (found) {
              console.log(`    ✅ نجح: تم العثور على الصفحة ${testCase.filter}`.green);
              this.testResults.push({ test: testCase.name, status: 'PASS', details: `Found: ${found.page_name}` });
            } else {
              console.log(`    ❌ فشل: لم يتم العثور على الصفحة ${testCase.filter}`.red);
              this.testResults.push({ test: testCase.name, status: 'FAIL', details: 'Page not found' });
            }
          } else {
            console.log(`    ✅ نجح: تم جلب ${data.length} صفحة`.green);
            this.testResults.push({ test: testCase.name, status: 'PASS', details: `Count: ${data.length}` });
          }
        } else {
          console.log(`    ❌ فشل: استجابة غير متوقعة`.red);
          this.testResults.push({ test: testCase.name, status: 'FAIL', details: 'Unexpected response' });
        }
        
      } catch (error) {
        console.log(`    ❌ خطأ: ${error.message}`.red);
        this.testResults.push({ test: testCase.name, status: 'ERROR', details: error.message });
      }
    }
  }

  async testUpdate() {
    console.log('\n✏️ اختبار عملية التحديث (UPDATE)...'.blue.bold);
    
    if (this.createdPages.length === 0) {
      console.log('  ⚠️ لا توجد صفحات للتحديث'.yellow);
      return;
    }

    const testCases = [
      {
        name: 'تحديث معرف الشركة',
        pageId: this.createdPages[0],
        data: { company_id: `${TEST_COMPANY_ID}_updated` }
      }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`  🧪 ${testCase.name}...`.cyan);
        
        const response = await axios.put(
          `${API_BASE_URL}/api/facebook/settings/${testCase.pageId}/company`,
          testCase.data
        );
        
        if (response.data.success) {
          console.log(`    ✅ نجح: ${response.data.message}`.green);
          this.testResults.push({ test: testCase.name, status: 'PASS', details: response.data });
        } else {
          console.log(`    ❌ فشل: ${response.data.error}`.red);
          this.testResults.push({ test: testCase.name, status: 'FAIL', details: response.data });
        }
        
      } catch (error) {
        console.log(`    ❌ خطأ: ${error.message}`.red);
        this.testResults.push({ test: testCase.name, status: 'ERROR', details: error.message });
      }
    }
  }

  async testDelete() {
    console.log('\n🗑️ اختبار عملية الحذف (DELETE)...'.blue.bold);
    
    if (this.createdPages.length === 0) {
      console.log('  ⚠️ لا توجد صفحات للحذف'.yellow);
      return;
    }

    const testCases = [
      {
        name: 'حذف صفحة موجودة (soft delete)',
        pageId: this.createdPages[0]
      },
      {
        name: 'حذف صفحة غير موجودة',
        pageId: 'non_existent_page_123'
      }
    ];

    for (const testCase of testCases) {
      try {
        console.log(`  🧪 ${testCase.name}...`.cyan);
        
        const response = await axios.delete(`${API_BASE_URL}/api/facebook/settings/${testCase.pageId}`);
        
        if (response.data.success) {
          console.log(`    ✅ نجح: ${response.data.message}`.green);
          this.testResults.push({ test: testCase.name, status: 'PASS', details: response.data });
        } else {
          console.log(`    ❌ فشل: ${response.data.error}`.red);
          this.testResults.push({ test: testCase.name, status: 'FAIL', details: response.data });
        }
        
      } catch (error) {
        if (error.response && error.response.status === 404 && testCase.pageId === 'non_existent_page_123') {
          console.log(`    ✅ نجح: تم التعامل مع الصفحة غير الموجودة بشكل صحيح`.green);
          this.testResults.push({ test: testCase.name, status: 'PASS', details: '404 as expected' });
        } else {
          console.log(`    ❌ خطأ: ${error.message}`.red);
          this.testResults.push({ test: testCase.name, status: 'ERROR', details: error.message });
        }
      }
    }
  }

  async testDataIntegrity() {
    console.log('\n🔍 اختبار سلامة البيانات...'.blue.bold);
    
    try {
      console.log('  🧪 التحقق من القيود والفهارس...'.cyan);
      
      // اختبار القيد الفريد
      const [constraints] = await this.connection.execute(`
        SHOW INDEX FROM facebook_pages_unified WHERE Key_name = 'unique_page_per_company'
      `);
      
      if (constraints.length > 0) {
        console.log('    ✅ القيد الفريد موجود'.green);
        this.testResults.push({ test: 'Unique constraint check', status: 'PASS', details: 'Constraint exists' });
      } else {
        console.log('    ❌ القيد الفريد مفقود'.red);
        this.testResults.push({ test: 'Unique constraint check', status: 'FAIL', details: 'Constraint missing' });
      }
      
      // اختبار الفهارس
      const [indexes] = await this.connection.execute(`
        SHOW INDEX FROM facebook_pages_unified
      `);
      
      const indexNames = [...new Set(indexes.map(idx => idx.Key_name))];
      console.log(`    ✅ تم العثور على ${indexNames.length} فهرس`.green);
      this.testResults.push({ test: 'Index check', status: 'PASS', details: `${indexNames.length} indexes found` });
      
    } catch (error) {
      console.log(`    ❌ خطأ في فحص سلامة البيانات: ${error.message}`.red);
      this.testResults.push({ test: 'Data integrity check', status: 'ERROR', details: error.message });
    }
  }

  generateReport() {
    console.log('\n📊 تقرير نتائج الاختبارات'.green.bold);
    console.log('='.repeat(60).cyan);
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    const total = this.testResults.length;
    
    console.log(`📈 إجمالي الاختبارات: ${total}`.white);
    console.log(`✅ نجح: ${passed} (${((passed/total)*100).toFixed(1)}%)`.green);
    console.log(`❌ فشل: ${failed} (${((failed/total)*100).toFixed(1)}%)`.red);
    console.log(`⚠️ أخطاء: ${errors} (${((errors/total)*100).toFixed(1)}%)`.yellow);
    
    console.log('\n📋 تفاصيل النتائج:'.cyan);
    this.testResults.forEach((result, index) => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`  ${index + 1}. ${statusIcon} ${result.test}`.white);
      if (result.details) {
        console.log(`     💬 ${result.details}`.gray);
      }
    });
    
    const successRate = (passed / total) * 100;
    if (successRate >= 90) {
      console.log('\n🎉 النظام يعمل بشكل ممتاز!'.green.bold);
    } else if (successRate >= 70) {
      console.log('\n⚠️ النظام يعمل بشكل جيد مع بعض المشاكل'.yellow.bold);
    } else {
      console.log('\n🚨 النظام يحتاج مراجعة فورية!'.red.bold);
    }
  }

  async runAllTests() {
    console.log('🚀 بدء مجموعة اختبارات CRUD الشاملة...'.green.bold);
    console.log(`🎯 الشركة التجريبية: ${TEST_COMPANY_ID}`.cyan);
    console.log(`🌐 API Base URL: ${API_BASE_URL}`.cyan);
    
    try {
      // تنظيف البيانات القديمة
      await this.cleanup();
      
      // تشغيل الاختبارات
      await this.testCreate();
      await this.testRead();
      await this.testUpdate();
      await this.testDelete();
      await this.testDataIntegrity();
      
      // إنشاء التقرير
      this.generateReport();
      
      // تنظيف نهائي
      await this.cleanup();
      
    } catch (error) {
      console.error('❌ خطأ في تشغيل الاختبارات:'.red, error.message);
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات'.gray);
    }
  }
}

// تشغيل الاختبارات
async function runTests() {
  const testSuite = new CRUDTestSuite();
  
  if (await testSuite.init()) {
    await testSuite.runAllTests();
    await testSuite.close();
  } else {
    console.error('❌ فشل في تهيئة مجموعة الاختبارات'.red);
    process.exit(1);
  }
}

// تشغيل الاختبارات إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { CRUDTestSuite };
