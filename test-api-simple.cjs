// اختبار بسيط جداً
const http = require('http');

console.log('🧪 اختبار API بسيط...');

const req = http.get('http://localhost:3002/api/subscriptions/admin/companies', (res) => {
  console.log('📊 Status:', res.statusCode);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Success:', result.success);
      console.log('📋 Companies:', result.data ? result.data.length : 0);
      if (result.data && result.data.length > 0) {
        console.log('🏢 First company:', result.data[0].name);
      }
    } catch (e) {
      console.log('❌ JSON Error:', e.message);
      console.log('📄 Raw:', data.substring(0, 200));
    }
  });
});

req.on('error', err => {
  console.log('❌ Request Error:', err.message);
});

req.setTimeout(5000, () => {
  console.log('⏰ Timeout');
  req.destroy();
});
