/**
 * 🔍 أداة كشف أخطاء وقت التشغيل المتقدمة
 * تتحقق من الأخطاء في Console والشبكة
 */

import puppeteer from 'puppeteer';

async function detectRuntimeErrors() {
  console.log('🔍 بدء فحص أخطاء وقت التشغيل...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // تجميع الأخطاء
    const errors = [];
    const warnings = [];
    const networkErrors = [];
    
    // الاستماع لأخطاء Console
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        errors.push(`❌ Console Error: ${text}`);
      } else if (type === 'warning') {
        warnings.push(`⚠️ Console Warning: ${text}`);
      }
    });
    
    // الاستماع لأخطاء الشبكة
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`🌐 Network Error: ${response.status()} - ${response.url()}`);
      }
    });
    
    // الاستماع لأخطاء JavaScript
    page.on('pageerror', error => {
      errors.push(`💥 JavaScript Error: ${error.message}`);
    });
    
    console.log('📱 اختبار الصفحة الرئيسية...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle2', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    console.log('🔐 اختبار صفحة تسجيل الدخول...');
    await page.goto('http://localhost:8081/company-login', { waitUntil: 'networkidle2', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    console.log('🧪 اختبار الصفحة البسيطة...');
    await page.goto('http://localhost:8081/test', { waitUntil: 'networkidle2', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // تقرير النتائج
    console.log('\n📊 تقرير أخطاء وقت التشغيل:');
    console.log('='.repeat(50));
    
    if (errors.length === 0 && warnings.length === 0 && networkErrors.length === 0) {
      console.log('✅ لا توجد أخطاء في وقت التشغيل!');
    } else {
      if (errors.length > 0) {
        console.log(`\n❌ الأخطاء (${errors.length}):`);
        errors.forEach(error => console.log(`  ${error}`));
      }
      
      if (networkErrors.length > 0) {
        console.log(`\n🌐 أخطاء الشبكة (${networkErrors.length}):`);
        networkErrors.forEach(error => console.log(`  ${error}`));
      }
      
      if (warnings.length > 0) {
        console.log(`\n⚠️ التحذيرات (${warnings.length}):`);
        warnings.slice(0, 5).forEach(warning => console.log(`  ${warning}`));
        if (warnings.length > 5) {
          console.log(`  ... و ${warnings.length - 5} تحذيرات أخرى`);
        }
      }
    }
    
    return {
      errors: errors.length,
      warnings: warnings.length,
      networkErrors: networkErrors.length,
      success: errors.length === 0 && networkErrors.length === 0
    };
    
  } catch (error) {
    console.error('❌ خطأ في فحص وقت التشغيل:', error.message);
    return { errors: 1, warnings: 0, networkErrors: 0, success: false };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// تشغيل الفحص
detectRuntimeErrors().then(result => {
  console.log('\n🎯 النتيجة النهائية:');
  console.log(`✅ نجح: ${result.success ? 'نعم' : 'لا'}`);
  console.log(`❌ أخطاء: ${result.errors}`);
  console.log(`🌐 أخطاء شبكة: ${result.networkErrors}`);
  console.log(`⚠️ تحذيرات: ${result.warnings}`);
  
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('💥 فشل في تشغيل الفحص:', error);
  process.exit(1);
});
