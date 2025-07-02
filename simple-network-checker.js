/**
 * 🌐 أداة فحص أخطاء الشبكة البسيطة
 * تتحقق من استجابة الصفحات والـ APIs
 */

import fetch from 'node-fetch';

async function checkNetworkErrors() {
  console.log('🌐 بدء فحص أخطاء الشبكة...\n');
  
  const urls = [
    'http://localhost:8081',
    'http://localhost:8081/company-login',
    'http://localhost:8081/test',
    'http://localhost:8081/simple-login',
    'http://localhost:3002/api/health',
    'http://localhost:3002/api/companies/test'
  ];
  
  const results = [];
  
  for (const url of urls) {
    try {
      console.log(`🔍 فحص: ${url}`);
      const response = await fetch(url, { 
        timeout: 5000,
        headers: {
          'User-Agent': 'Network-Checker/1.0'
        }
      });
      
      const status = response.status;
      const statusText = response.statusText;
      
      if (status >= 200 && status < 400) {
        console.log(`✅ ${url} - ${status} ${statusText}`);
        results.push({ url, status, success: true, error: null });
      } else {
        console.log(`❌ ${url} - ${status} ${statusText}`);
        results.push({ url, status, success: false, error: `HTTP ${status}` });
      }
      
    } catch (error) {
      console.log(`💥 ${url} - خطأ: ${error.message}`);
      results.push({ url, status: 0, success: false, error: error.message });
    }
  }
  
  console.log('\n📊 تقرير فحص الشبكة:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ نجح: ${successful}/${results.length}`);
  console.log(`❌ فشل: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ الأخطاء:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  ${result.url} - ${result.error}`);
    });
  }
  
  return {
    total: results.length,
    successful,
    failed,
    success: failed === 0
  };
}

// تشغيل الفحص
checkNetworkErrors().then(result => {
  console.log('\n🎯 النتيجة النهائية:');
  console.log(`✅ نجح: ${result.success ? 'نعم' : 'لا'}`);
  console.log(`📊 النسبة: ${result.successful}/${result.total}`);
  
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('💥 فشل في تشغيل الفحص:', error);
  process.exit(1);
});
