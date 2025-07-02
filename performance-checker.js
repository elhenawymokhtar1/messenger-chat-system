/**
 * ⚡ أداة فحص الأداء
 * تقيس سرعة تحميل الصفحات وحجم الملفات
 */

import fetch from 'node-fetch';

async function checkPerformance() {
  console.log('⚡ بدء فحص الأداء...\n');
  
  const pages = [
    { name: 'الصفحة الرئيسية', url: 'http://localhost:8081' },
    { name: 'تسجيل الدخول', url: 'http://localhost:8081/company-login' },
    { name: 'الصفحة البسيطة', url: 'http://localhost:8081/test' }
  ];
  
  const results = [];
  
  for (const page of pages) {
    try {
      console.log(`🔍 فحص أداء: ${page.name}`);
      
      const startTime = Date.now();
      const response = await fetch(page.url, { timeout: 10000 });
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      const contentLength = response.headers.get('content-length') || 0;
      const status = response.status;
      
      const result = {
        name: page.name,
        url: page.url,
        responseTime,
        contentLength: parseInt(contentLength),
        status,
        success: status >= 200 && status < 400
      };
      
      results.push(result);
      
      console.log(`  ⏱️ وقت الاستجابة: ${responseTime}ms`);
      console.log(`  📦 حجم المحتوى: ${Math.round(contentLength / 1024)}KB`);
      console.log(`  📊 الحالة: ${status}\n`);
      
    } catch (error) {
      console.log(`❌ خطأ في ${page.name}: ${error.message}\n`);
      results.push({
        name: page.name,
        url: page.url,
        responseTime: -1,
        contentLength: 0,
        status: 0,
        success: false,
        error: error.message
      });
    }
  }
  
  console.log('📊 تقرير الأداء:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const avgResponseTime = successful.length > 0 
    ? Math.round(successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length)
    : 0;
  
  console.log(`✅ الصفحات الناجحة: ${successful.length}/${results.length}`);
  console.log(`⏱️ متوسط وقت الاستجابة: ${avgResponseTime}ms`);
  
  // تقييم الأداء
  let performanceGrade = 'ممتاز';
  if (avgResponseTime > 1000) performanceGrade = 'بطيء';
  else if (avgResponseTime > 500) performanceGrade = 'متوسط';
  else if (avgResponseTime > 200) performanceGrade = 'جيد';
  
  console.log(`🎯 تقييم الأداء: ${performanceGrade}`);
  
  if (successful.length > 0) {
    console.log('\n📋 تفاصيل الصفحات:');
    successful.forEach(result => {
      console.log(`  ${result.name}: ${result.responseTime}ms, ${Math.round(result.contentLength / 1024)}KB`);
    });
  }
  
  return {
    totalPages: results.length,
    successfulPages: successful.length,
    avgResponseTime,
    performanceGrade,
    success: successful.length === results.length && avgResponseTime < 1000
  };
}

// تشغيل الفحص
checkPerformance().then(result => {
  console.log('\n🎯 النتيجة النهائية:');
  console.log(`✅ نجح: ${result.success ? 'نعم' : 'لا'}`);
  console.log(`📊 الصفحات: ${result.successfulPages}/${result.totalPages}`);
  console.log(`⚡ الأداء: ${result.performanceGrade}`);
  
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('💥 فشل في تشغيل فحص الأداء:', error);
  process.exit(1);
});
