// 🔧 إصلاح ربط الصفحات بالشركات الجديدة
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fixCompanyPages() {
  console.log('🔧 بدء إصلاح ربط الصفحات بالشركات...\n');
  
  try {
    // 1. جلب جميع الشركات
    console.log('1️⃣ جلب جميع الشركات...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, email');
    
    if (companiesError) {
      console.error('❌ خطأ في جلب الشركات:', companiesError.message);
      return false;
    }
    
    console.log(`📊 عدد الشركات: ${companies?.length || 0}`);
    companies?.forEach(company => {
      console.log(`   - ${company.name} (${company.id})`);
    });
    
    // 2. جلب الصفحات غير المربوطة بشركات
    console.log('\n2️⃣ جلب الصفحات غير المربوطة...');
    const { data: unlinkedPages, error: pagesError } = await supabase
      .from('facebook_settings')
      .select('id, page_id, page_name, company_id')
      .is('company_id', null);
    
    if (pagesError) {
      console.error('❌ خطأ في جلب الصفحات:', pagesError.message);
      return false;
    }
    
    console.log(`📄 عدد الصفحات غير المربوطة: ${unlinkedPages?.length || 0}`);
    
    if (!unlinkedPages || unlinkedPages.length === 0) {
      console.log('✅ جميع الصفحات مربوطة بالفعل!');
      return true;
    }
    
    // 3. ربط الصفحات غير المربوطة بشركة افتراضية (أول شركة)
    if (companies && companies.length > 0) {
      const defaultCompany = companies[0];
      console.log(`\n3️⃣ ربط الصفحات غير المربوطة بالشركة الافتراضية: ${defaultCompany.name}`);
      
      const pageIds = unlinkedPages.map(page => page.id);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('facebook_settings')
        .update({ company_id: defaultCompany.id })
        .in('id', pageIds)
        .select();
      
      if (updateError) {
        console.error('❌ خطأ في تحديث الصفحات:', updateError.message);
        return false;
      }
      
      console.log(`✅ تم ربط ${updateResult?.length || 0} صفحة بالشركة ${defaultCompany.name}`);
    }
    
    // 4. التحقق من النتيجة
    console.log('\n4️⃣ التحقق من النتيجة...');
    const { data: finalCheck, error: checkError } = await supabase
      .from('facebook_settings')
      .select('page_name, company_id')
      .is('company_id', null);
    
    if (checkError) {
      console.error('❌ خطأ في التحقق:', checkError.message);
    } else {
      console.log(`📊 عدد الصفحات غير المربوطة المتبقية: ${finalCheck?.length || 0}`);
    }
    
    // 5. عرض ملخص الشركات والصفحات
    console.log('\n5️⃣ ملخص الشركات والصفحات:');
    for (const company of companies || []) {
      const { data: companyPages } = await supabase
        .from('facebook_settings')
        .select('page_name, page_id')
        .eq('company_id', company.id);
      
      console.log(`\n🏢 ${company.name}:`);
      console.log(`   📧 البريد: ${company.email}`);
      console.log(`   📄 عدد الصفحات: ${companyPages?.length || 0}`);
      
      if (companyPages && companyPages.length > 0) {
        companyPages.forEach(page => {
          console.log(`      - ${page.page_name} (${page.page_id})`);
        });
      } else {
        console.log('      - لا توجد صفحات مربوطة');
      }
    }
    
    console.log('\n🎉 تم إصلاح ربط الصفحات بالشركات بنجاح!');
    return true;
    
  } catch (error) {
    console.error('💥 خطأ عام في الإصلاح:', error);
    return false;
  }
}

// دالة لإنشاء شركة جديدة وربط صفحات بها
async function createCompanyWithPages(companyName, companyEmail, pageIds = []) {
  console.log(`\n🏗️ إنشاء شركة جديدة: ${companyName}`);
  
  try {
    // إنشاء الشركة
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        email: companyEmail,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (companyError) {
      console.error('❌ خطأ في إنشاء الشركة:', companyError.message);
      return false;
    }
    
    console.log('✅ تم إنشاء الشركة بنجاح:', newCompany.id);
    
    // ربط الصفحات بالشركة الجديدة
    if (pageIds.length > 0) {
      const { data: updateResult, error: updateError } = await supabase
        .from('facebook_settings')
        .update({ company_id: newCompany.id })
        .in('page_id', pageIds)
        .select();
      
      if (updateError) {
        console.error('❌ خطأ في ربط الصفحات:', updateError.message);
      } else {
        console.log(`✅ تم ربط ${updateResult?.length || 0} صفحة بالشركة الجديدة`);
      }
    }
    
    return newCompany;
    
  } catch (error) {
    console.error('💥 خطأ في إنشاء الشركة:', error);
    return false;
  }
}

// تشغيل الإصلاح
if (process.argv.includes('--fix')) {
  fixCompanyPages()
    .then(success => {
      if (success) {
        console.log('\n🎯 تم الإصلاح بنجاح!');
      } else {
        console.log('\n❌ فشل الإصلاح');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 خطأ في تشغيل الإصلاح:', error);
      process.exit(1);
    });
} else {
  console.log('📋 استخدام الأداة:');
  console.log('');
  console.log('لإصلاح ربط الصفحات الموجودة:');
  console.log('  node fix-company-pages.js --fix');
  console.log('');
  console.log('💡 هذه الأداة ستربط جميع الصفحات غير المربوطة بالشركة الأولى في النظام');
}
