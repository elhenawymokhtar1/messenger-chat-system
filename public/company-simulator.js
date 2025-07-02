/**
 * محاكي الشركات للاختبار
 * يمكن استخدامه في console المتصفح
 * تاريخ الإنشاء: 24 يونيو 2025
 */

// بيانات الشركة الجديدة
const newCompanyData = {
  id: 'new-company-' + Date.now(),
  name: 'شركة جديدة للاختبار',
  email: 'new@testcompany.com',
  phone: '+201234567890',
  website: 'https://newtestcompany.com',
  address: 'القاهرة الجديدة، مصر',
  city: 'القاهرة',
  country: 'Egypt',
  status: 'active',
  is_verified: true,
  created_at: new Date().toISOString(), // اليوم
  last_login_at: new Date().toISOString()
};

// بيانات الشركة القديمة
const oldCompanyData = {
  id: 'old-company-' + Date.now(),
  name: 'شركة قديمة للاختبار',
  email: 'old@testcompany.com',
  phone: '+201234567890',
  website: 'https://oldtestcompany.com',
  address: 'الإسكندرية، مصر',
  city: 'الإسكندرية',
  country: 'Egypt',
  status: 'active',
  is_verified: true,
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // قبل 30 يوم
  last_login_at: new Date().toISOString()
};

/**
 * محاكاة شركة جديدة
 */
function simulateNewCompany() {
  localStorage.setItem('company', JSON.stringify(newCompanyData));
  console.log('✅ تم إنشاء شركة جديدة:');
  console.log('📊 الاسم:', newCompanyData.name);
  console.log('📅 تاريخ الإنشاء:', newCompanyData.created_at);
  console.log('🆕 شركة جديدة: نعم');
  console.log('🔄 يرجى تحديث الصفحة لرؤية التغييرات');
  return newCompanyData;
}

/**
 * محاكاة شركة قديمة
 */
function simulateOldCompany() {
  localStorage.setItem('company', JSON.stringify(oldCompanyData));
  console.log('✅ تم إنشاء شركة قديمة:');
  console.log('📊 الاسم:', oldCompanyData.name);
  console.log('📅 تاريخ الإنشاء:', oldCompanyData.created_at);
  console.log('🆕 شركة جديدة: لا');
  console.log('🔄 يرجى تحديث الصفحة لرؤية التغييرات');
  return oldCompanyData;
}

/**
 * مسح بيانات الشركة
 */
function clearCompanyData() {
  localStorage.removeItem('company');
  localStorage.removeItem('userToken');
  console.log('🧹 تم مسح بيانات الشركة');
  console.log('🔄 يرجى تحديث الصفحة لرؤية التغييرات');
}

/**
 * عرض الشركة الحالية
 */
function getCurrentCompany() {
  const companyData = localStorage.getItem('company');
  if (companyData) {
    try {
      const company = JSON.parse(companyData);
      const createdDate = new Date(company.created_at);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const isNew = diffInDays <= 7;
      
      console.log('📊 الشركة الحالية:');
      console.log('🏢 الاسم:', company.name);
      console.log('📧 الإيميل:', company.email);
      console.log('📅 تاريخ الإنشاء:', createdDate.toLocaleDateString('ar-EG'));
      console.log('⏰ عمر الشركة:', diffInDays, 'يوم');
      console.log('🆕 شركة جديدة:', isNew ? 'نعم' : 'لا');
      
      return company;
    } catch (error) {
      console.error('❌ خطأ في قراءة بيانات الشركة:', error);
      return null;
    }
  } else {
    console.log('❌ لا توجد شركة مسجلة حالياً');
    return null;
  }
}

/**
 * عرض تعليمات الاستخدام
 */
function showHelp() {
  console.log('🎭 محاكي الشركات للاختبار');
  console.log('');
  console.log('الدوال المتاحة:');
  console.log('1. simulateNewCompany() - إنشاء شركة جديدة');
  console.log('2. simulateOldCompany() - إنشاء شركة قديمة');
  console.log('3. getCurrentCompany() - عرض الشركة الحالية');
  console.log('4. clearCompanyData() - مسح بيانات الشركة');
  console.log('5. showHelp() - عرض هذه التعليمات');
  console.log('');
  console.log('مثال: simulateNewCompany()');
}

// تصدير الدوال للاستخدام العام
if (typeof window !== 'undefined') {
  window.simulateNewCompany = simulateNewCompany;
  window.simulateOldCompany = simulateOldCompany;
  window.clearCompanyData = clearCompanyData;
  window.getCurrentCompany = getCurrentCompany;
  window.showHelp = showHelp;
  
  // عرض التعليمات عند تحميل الملف
  console.log('🎭 تم تحميل محاكي الشركات');
  console.log('💡 اكتب showHelp() لعرض التعليمات');
}

// تصدير للـ Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    simulateNewCompany,
    simulateOldCompany,
    clearCompanyData,
    getCurrentCompany,
    showHelp,
    newCompanyData,
    oldCompanyData
  };
}
