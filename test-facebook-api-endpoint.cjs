/**
 * اختبار API endpoint لجلب صفحات Facebook
 * تاريخ الإنشاء: 11 يوليو 2025
 */

const colors = require('colors');

class FacebookApiTester {
  constructor() {
    this.baseUrl = 'http://localhost:3002';
    this.companyId = 'company-2'; // معرف الشركة التجريبية
  }

  async testEndpoint(url, method = 'GET', body = null) {
    try {
      console.log(`🔍 اختبار: ${method} ${url}`.cyan);
      
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json();

      console.log(`📊 الاستجابة (${response.status}):`.yellow);
      console.log(JSON.stringify(data, null, 2));
      
      return { status: response.status, data, ok: response.ok };
    } catch (error) {
      console.error(`❌ خطأ في الطلب:`.red, error.message);
      return { error: error.message };
    }
  }

  async testServerHealth() {
    console.log('\n🏥 فحص صحة السرفر...'.green.bold);
    console.log('='.repeat(40).green);
    
    const result = await this.testEndpoint(`${this.baseUrl}/api/health`);
    
    if (result.ok) {
      console.log('✅ السرفر يعمل بشكل طبيعي'.green);
    } else {
      console.log('❌ السرفر لا يعمل أو يواجه مشاكل'.red);
    }
    
    return result;
  }

  async testDatabaseConnection() {
    console.log('\n🗄️ فحص اتصال قاعدة البيانات...'.green.bold);
    console.log('='.repeat(40).green);
    
    const result = await this.testEndpoint(`${this.baseUrl}/api/db-test`);
    
    if (result.ok) {
      console.log('✅ قاعدة البيانات متصلة'.green);
    } else {
      console.log('❌ مشكلة في اتصال قاعدة البيانات'.red);
    }
    
    return result;
  }

  async testFacebookSettings() {
    console.log('\n📱 اختبار API إعدادات Facebook...'.green.bold);
    console.log('='.repeat(40).green);
    
    // اختبار بدون company_id
    console.log('\n1. جلب جميع إعدادات Facebook:'.yellow);
    const allSettings = await this.testEndpoint(`${this.baseUrl}/api/facebook/settings`);
    
    // اختبار مع company_id
    console.log('\n2. جلب إعدادات Facebook للشركة التجريبية:'.yellow);
    const companySettings = await this.testEndpoint(`${this.baseUrl}/api/facebook/settings?company_id=${this.companyId}`);
    
    return { allSettings, companySettings };
  }

  async testCompanyData() {
    console.log('\n🏢 اختبار بيانات الشركة...'.green.bold);
    console.log('='.repeat(40).green);
    
    // اختبار جلب بيانات الشركة
    const result = await this.testEndpoint(`${this.baseUrl}/api/companies/${this.companyId}`);
    
    return result;
  }

  async testDatabaseFacebookData() {
    console.log('\n📊 فحص بيانات Facebook في قاعدة البيانات...'.green.bold);
    console.log('='.repeat(40).green);
    
    const result = await this.testEndpoint(`${this.baseUrl}/api/db-facebook-data`);
    
    return result;
  }

  async testSpecificCompanyPages() {
    console.log('\n📄 اختبار صفحات الشركة المحددة...'.green.bold);
    console.log('='.repeat(40).green);
    
    const result = await this.testEndpoint(`${this.baseUrl}/api/companies/${this.companyId}/facebook-pages`);
    
    return result;
  }

  async runAllTests() {
    console.log('🧪 بدء اختبار شامل لـ Facebook API...'.cyan.bold);
    console.log('='.repeat(60).cyan);
    
    const results = {};
    
    try {
      // فحص صحة السرفر
      results.health = await this.testServerHealth();
      
      // فحص قاعدة البيانات
      results.database = await this.testDatabaseConnection();
      
      // اختبار بيانات الشركة
      results.company = await this.testCompanyData();
      
      // اختبار إعدادات Facebook
      results.facebookSettings = await this.testFacebookSettings();
      
      // فحص بيانات Facebook في قاعدة البيانات
      results.databaseFacebookData = await this.testDatabaseFacebookData();
      
      // اختبار صفحات الشركة المحددة
      results.companyPages = await this.testSpecificCompanyPages();
      
      // تحليل النتائج
      this.analyzeResults(results);
      
    } catch (error) {
      console.error('💥 خطأ عام في الاختبار:'.red, error);
    }
    
    return results;
  }

  analyzeResults(results) {
    console.log('\n📋 تحليل النتائج:'.blue.bold);
    console.log('='.repeat(30).blue);
    
    let issues = [];
    let successes = [];
    
    // تحليل صحة السرفر
    if (results.health?.ok) {
      successes.push('✅ السرفر يعمل بشكل طبيعي');
    } else {
      issues.push('❌ السرفر لا يعمل');
    }
    
    // تحليل قاعدة البيانات
    if (results.database?.ok) {
      successes.push('✅ قاعدة البيانات متصلة');
    } else {
      issues.push('❌ مشكلة في قاعدة البيانات');
    }
    
    // تحليل بيانات الشركة
    if (results.company?.ok) {
      successes.push('✅ بيانات الشركة متاحة');
    } else {
      issues.push('❌ مشكلة في جلب بيانات الشركة');
    }
    
    // تحليل إعدادات Facebook
    if (results.facebookSettings?.companySettings?.ok) {
      const data = results.facebookSettings.companySettings.data;
      if (Array.isArray(data) && data.length > 0) {
        successes.push(`✅ تم العثور على ${data.length} صفحة Facebook للشركة`);
      } else {
        issues.push('⚠️ لا توجد صفحات Facebook مرتبطة بالشركة');
      }
    } else {
      issues.push('❌ فشل في جلب إعدادات Facebook');
    }
    
    // عرض النتائج
    if (successes.length > 0) {
      console.log('\n✅ النجاحات:'.green);
      successes.forEach(success => console.log(`   ${success}`.white));
    }
    
    if (issues.length > 0) {
      console.log('\n❌ المشاكل:'.red);
      issues.forEach(issue => console.log(`   ${issue}`.white));
    }
    
    // التوصيات
    console.log('\n💡 التوصيات:'.yellow.bold);
    if (issues.some(issue => issue.includes('السرفر'))) {
      console.log('   1. تأكد من تشغيل السرفر على المنفذ 3002'.white);
    }
    if (issues.some(issue => issue.includes('قاعدة البيانات'))) {
      console.log('   2. تحقق من إعدادات قاعدة البيانات'.white);
    }
    if (issues.some(issue => issue.includes('صفحات Facebook'))) {
      console.log('   3. تحقق من ربط الصفحات بالشركة في قاعدة البيانات'.white);
      console.log('   4. تأكد من صحة company_id في الطلبات'.white);
    }
  }

  async debugSpecificIssue() {
    console.log('\n🔍 تشخيص مفصل للمشكلة...'.yellow.bold);
    console.log('='.repeat(40).yellow);
    
    // فحص معرف الشركة
    console.log(`🏢 معرف الشركة المستخدم: ${this.companyId}`.cyan);
    
    // فحص URL المستخدم
    const url = `${this.baseUrl}/api/facebook/settings?company_id=${this.companyId}`;
    console.log(`🌐 URL المستخدم: ${url}`.cyan);
    
    // اختبار مباشر
    console.log('\n📡 إرسال طلب مباشر...'.yellow);
    const result = await this.testEndpoint(url);
    
    if (result.data) {
      console.log('\n📊 تحليل الاستجابة:'.cyan);
      console.log(`   نوع البيانات: ${Array.isArray(result.data) ? 'Array' : typeof result.data}`.white);
      console.log(`   عدد العناصر: ${Array.isArray(result.data) ? result.data.length : 'غير محدد'}`.white);
      
      if (Array.isArray(result.data) && result.data.length > 0) {
        console.log('\n📄 أول صفحة:'.cyan);
        const firstPage = result.data[0];
        console.log(`   معرف الصفحة: ${firstPage.page_id}`.white);
        console.log(`   اسم الصفحة: ${firstPage.page_name}`.white);
        console.log(`   معرف الشركة: ${firstPage.company_id}`.white);
        console.log(`   نشطة: ${firstPage.is_active}`.white);
      }
    }
    
    return result;
  }
}

// تشغيل الاختبار
async function main() {
  const tester = new FacebookApiTester();
  
  try {
    // تشغيل جميع الاختبارات
    await tester.runAllTests();
    
    // تشخيص مفصل
    await tester.debugSpecificIssue();
    
  } catch (error) {
    console.error('💥 خطأ عام:'.red, error);
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main().catch(console.error);
}

module.exports = FacebookApiTester;
