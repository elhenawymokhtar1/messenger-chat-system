// اختبار API تفاصيل الشركة
const http = require('http');

// استخدام أول شركة من القائمة
const companyId = '00a2416f-d474-45ae-87af-cdd580a8cec9'; // Dummy Company

console.log('🧪 اختبار API تفاصيل الشركة...');
console.log('🏢 معرف الشركة:', companyId);

const req = http.get(`http://localhost:3002/api/subscriptions/admin/company/${companyId}`, (res) => {
  console.log('📊 Status:', res.statusCode);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Success:', result.success);
      if (result.success && result.data) {
        console.log('🏢 اسم الشركة:', result.data.name);
        console.log('📧 الإيميل:', result.data.email);
        console.log('📊 الحالة:', result.data.status);
        console.log('💳 الاشتراكات:', result.data.company_subscriptions?.length || 0);
        console.log('🏪 المتاجر:', result.data.stores?.length || 0);
      } else {
        console.log('❌ فشل:', result.message);
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
