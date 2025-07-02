/**
 * محاكاة شركة جديدة للاختبار
 * تاريخ الإنشاء: 24 يونيو 2025
 */

// محاكاة بيانات شركة جديدة
const newCompany = {
  id: 'new-company-123',
  name: 'شركة تجريبية جديدة',
  email: 'test@newcompany.com',
  phone: '+201234567890',
  website: 'https://newcompany.com',
  address: 'القاهرة، مصر',
  city: 'القاهرة',
  country: 'Egypt',
  status: 'active',
  is_verified: true,
  created_at: new Date().toISOString(), // تاريخ اليوم (شركة جديدة)
  last_login_at: new Date().toISOString()
};

// محاكاة بيانات شركة قديمة
const oldCompany = {
  id: 'old-company-456',
  name: 'شركة قديمة',
  email: 'test@oldcompany.com',
  phone: '+201234567890',
  website: 'https://oldcompany.com',
  address: 'الإسكندرية، مصر',
  city: 'الإسكندرية',
  country: 'Egypt',
  status: 'active',
  is_verified: true,
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // قبل 30 يوم
  last_login_at: new Date().toISOString()
};

function simulateNewCompany() {
  console.log('🎭 محاكاة شركة جديدة...');
  
  // حفظ بيانات الشركة الجديدة في localStorage
  localStorage.setItem('company', JSON.stringify(newCompany));
  
  console.log('✅ تم حفظ بيانات الشركة الجديدة:');
  console.log('📊 اسم الشركة:', newCompany.name);
  console.log('📅 تاريخ الإنشاء:', newCompany.created_at);
  console.log('🆕 شركة جديدة: نعم');
  
  console.log('');
  console.log('🔄 يرجى تحديث الصفحة لرؤية التغييرات');
}

function simulateOldCompany() {
  console.log('🎭 محاكاة شركة قديمة...');
  
  // حفظ بيانات الشركة القديمة في localStorage
  localStorage.setItem('company', JSON.stringify(oldCompany));
  
  console.log('✅ تم حفظ بيانات الشركة القديمة:');
  console.log('📊 اسم الشركة:', oldCompany.name);
  console.log('📅 تاريخ الإنشاء:', oldCompany.created_at);
  console.log('🆕 شركة جديدة: لا');
  
  console.log('');
  console.log('🔄 يرجى تحديث الصفحة لرؤية التغييرات');
}

function clearCompany() {
  console.log('🧹 مسح بيانات الشركة...');
  
  localStorage.removeItem('company');
  localStorage.removeItem('userToken');
  
  console.log('✅ تم مسح بيانات الشركة');
  console.log('🔄 يرجى تحديث الصفحة لرؤية التغييرات');
}

// عرض الخيارات
console.log('🎭 محاكي الشركات للاختبار');
console.log('');
console.log('الخيارات المتاحة:');
console.log('1. simulateNewCompany() - محاكاة شركة جديدة');
console.log('2. simulateOldCompany() - محاكاة شركة قديمة');
console.log('3. clearCompany() - مسح بيانات الشركة');
console.log('');
console.log('مثال: simulateNewCompany()');

// تصدير الدوال للاستخدام في المتصفح
if (typeof window !== 'undefined') {
  window.simulateNewCompany = simulateNewCompany;
  window.simulateOldCompany = simulateOldCompany;
  window.clearCompany = clearCompany;
}

module.exports = {
  simulateNewCompany,
  simulateOldCompany,
  clearCompany,
  newCompany,
  oldCompany
};
