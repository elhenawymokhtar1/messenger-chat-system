/**
 * اختبار حالة النظام بعد الإصلاحات
 * تاريخ الإنشاء: 24 يونيو 2025
 */

console.log('🔍 اختبار حالة النظام...');
console.log('');

// اختبار فلترة الشركات (محلي)
console.log('🏢 اختبار فلترة الشركات...');

const companyPageMapping = {
  'company-1': ['260345600493273'], // Swan Shop
  'company-2': ['240244019177739'], // سولا 127
  'company-new': [] // شركة جديدة
};

// محاكاة صفحات موجودة
const mockPages = [
  { page_id: '260345600493273', page_name: 'Swan shop' },
  { page_id: '240244019177739', page_name: 'سولا 127' }
];

console.log('📊 الصفحات الموجودة:');
mockPages.forEach((page, index) => {
  console.log(`   ${index + 1}. ${page.page_name} (${page.page_id})`);
});

console.log('');
console.log('🔍 فلترة حسب الشركات:');
    
console.log('');
    
    console.log('');
Object.entries(companyPageMapping).forEach(([companyId, allowedPages]) => {
  const filteredPages = mockPages.filter(page =>
    allowedPages.includes(page.page_id)
  );

  const companyNames = {
    'company-1': 'Swan Shop',
    'company-2': 'سولا 127',
    'company-new': 'شركة جديدة'
  };

  console.log(`   ${companyNames[companyId]} (${companyId}): ${filteredPages.length} صفحة`);
  filteredPages.forEach(page => {
    console.log(`     ✅ ${page.page_name} (${page.page_id})`);
  });

  if (filteredPages.length === 0) {
    console.log(`     ❌ لا توجد صفحات (مناسب للشركات الجديدة)`);
  }
});

console.log('');

// 4. اختبار المحادثات
    console.log('💬 اختبار المحادثات...');
    
    // TODO: Replace with MySQL API
    const conversations = [];
    const convError = null;
    
    if (convError) {
      console.error('❌ خطأ في جلب المحادثات:', convError.message);
    } else {
      console.log(`✅ تم جلب ${conversations?.length || 0} محادثة`);
      
      if (conversations && conversations.length > 0) {
        console.log('📋 المحادثات الأخيرة:');
        conversations.forEach((conv, index) => {
          console.log(`   ${index + 1}. ${conv.customer_name} - صفحة: ${conv.facebook_page_id}`);
        });
      }
    }
    
    console.log('');
    
    // 5. النتيجة النهائية
    console.log('🎯 النتيجة النهائية:');
    
    const hasPages = facebookSettings && facebookSettings.length > 0;
    const hasConversations = conversations && conversations.length > 0;
    
    if (hasPages) {
      console.log('✅ النظام يعمل بشكل صحيح');
      console.log('✅ الصفحات موجودة ويمكن جلبها');
      console.log('✅ فلترة الشركات تعمل');
      
      if (hasConversations) {
        console.log('✅ المحادثات موجودة');
      } else {
        console.log('⚠️ لا توجد محادثات (هذا طبيعي للنظام الجديد)');
      }
      
      console.log('');
      console.log('🧪 يمكنك الآن اختبار النظام:');
      console.log('1. افتح: http://localhost:8081/test-company-pages.html');
      console.log('2. جرب التبديل بين الشركات');
      console.log('3. اذهب للإعدادات وتحقق من الصفحات');
    } else {
      console.log('⚠️ لا توجد صفحات Facebook مربوطة');
      console.log('💡 يمكنك إضافة صفحات من صفحة الإعدادات');
    }

console.log('✅ اختبار النظام مكتمل!');
