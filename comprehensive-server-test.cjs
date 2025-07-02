// اختبار شامل لجميع الخوادم
const http = require('http');

console.log('🔍 بدء الاختبار الشامل للخوادم...\n');

// قائمة الخوادم للاختبار
const servers = [
  { name: 'Backend API', url: 'http://localhost:3001', endpoints: ['/api/health', '/api/companies'] },
  { name: 'Backend MySQL', url: 'http://localhost:3000', endpoints: ['/api/health'] },
  { name: 'Frontend Vite', url: 'http://localhost:5173', endpoints: ['/'] },
  { name: 'Unified Server', url: 'http://localhost:3002', endpoints: ['/api/health'] }
];

// دالة اختبار endpoint
function testEndpoint(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          data: data.substring(0, 100) + (data.length > 100 ? '...' : '')
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout'
      });
    });
  });
}

// دالة اختبار خادم
async function testServer(server) {
  console.log(`🔧 اختبار ${server.name} (${server.url}):`);
  
  let serverWorking = false;
  
  for (const endpoint of server.endpoints) {
    const fullUrl = server.url + endpoint;
    const result = await testEndpoint(fullUrl);
    
    if (result.success) {
      console.log(`  ✅ ${endpoint} - Status: ${result.status}`);
      serverWorking = true;
    } else {
      console.log(`  ❌ ${endpoint} - Error: ${result.error}`);
    }
  }
  
  if (serverWorking) {
    console.log(`  🎉 ${server.name} يعمل بشكل صحيح!\n`);
  } else {
    console.log(`  💥 ${server.name} لا يعمل!\n`);
  }
  
  return serverWorking;
}

// تشغيل الاختبار
async function runTests() {
  const results = [];
  
  for (const server of servers) {
    const isWorking = await testServer(server);
    results.push({ name: server.name, working: isWorking });
  }
  
  console.log('📊 ملخص النتائج:');
  console.log('================');
  
  let workingCount = 0;
  results.forEach(result => {
    const status = result.working ? '✅ يعمل' : '❌ لا يعمل';
    console.log(`${result.name}: ${status}`);
    if (result.working) workingCount++;
  });
  
  console.log(`\n🎯 النتيجة النهائية: ${workingCount}/${results.length} خوادم تعمل`);
  
  if (workingCount === results.length) {
    console.log('🎉 جميع الخوادم تعمل بكفاءة عالية!');
  } else if (workingCount > 0) {
    console.log('⚠️ بعض الخوادم تعمل، والبعض الآخر يحتاج إصلاح');
  } else {
    console.log('💥 لا توجد خوادم تعمل! يجب إعادة التشغيل');
  }
}

runTests().catch(console.error);
