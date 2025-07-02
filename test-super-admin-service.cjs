const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 اختبار دالة getAllCompaniesForSuperAdmin مباشرة...');
console.log('═══════════════════════════════════════════════════════════════');

async function testGetAllCompanies() {
  try {
    console.log('\n1️⃣ جلب قائمة الشركات...');
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        email,
        phone,
        status,
        created_at,
        last_login_at,
        company_subscriptions (
          id,
          plan_name,
          status,
          expires_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ خطأ في الاستعلام:', error);
      return;
    }

    console.log(`✅ تم جلب ${companies.length} شركة`);
    
    if (companies.length > 0) {
      console.log('\n📋 أول 3 شركات:');
      companies.slice(0, 3).forEach((company, index) => {
        console.log(`\n${index + 1}. ${company.name}`);
        console.log(`   📧 ${company.email}`);
        console.log(`   📊 ${company.status}`);
        console.log(`   📅 ${company.created_at}`);
        console.log(`   💳 اشتراكات: ${company.company_subscriptions?.length || 0}`);
      });
    }

    return { success: true, data: companies };
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
    return { success: false, error: error.message };
  }
}

// تشغيل الاختبار
testGetAllCompanies().then((result) => {
  if (result && result.success) {
    console.log('\n🎉 نجح الاختبار!');
    console.log(`📊 عدد الشركات: ${result.data.length}`);
  } else {
    console.log('\n❌ فشل الاختبار');
  }
});
