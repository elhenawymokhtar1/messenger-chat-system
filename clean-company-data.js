// 🧹 تنظيف بيانات الشركات وإعادة توزيع الصفحات
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function cleanCompanyData() {
  console.log('🧹 بدء تنظيف بيانات الشركات...\n');
  
  try {
    // 1. عرض الوضع الحالي
    console.log('1️⃣ الوضع الحالي:');
    const { data: currentStatus } = await supabase
      .from('companies')
      .select(`
        id, name, email,
        facebook_settings(count)
      `);
    
    console.log('📊 توزيع الصفحات على الشركات:');
    currentStatus?.forEach(company => {
      const pageCount = company.facebook_settings?.[0]?.count || 0;
      console.log(`   ${company.name}: ${pageCount} صفحة`);
    });
    
    // 2. فصل الصفحات التجريبية
    console.log('\n2️⃣ فصل الصفحات التجريبية...');
    const { data: testPages } = await supabase
      .from('facebook_settings')
      .update({ company_id: null })
      .or('page_name.ilike.%تجريبية%,page_name.ilike.%test%,page_id.ilike.test_%')
      .select();
    
    console.log(`✅ تم فصل ${testPages?.length || 0} صفحة تجريبية`);
    
    // 3. ربط الصفحات بالشركات الصحيحة
    console.log('\n3️⃣ ربط الصفحات بالشركات الصحيحة...');
    
    // Swan Shop
    const { data: swanCompany } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', '%swan%')
      .single();
    
    if (swanCompany) {
      await supabase
        .from('facebook_settings')
        .update({ company_id: swanCompany.id })
        .eq('page_name', 'Swan Shop');
      console.log('✅ تم ربط Swan Shop بشركتها الصحيحة');
    }
    
    // سولا 127
    const { data: solaCompany } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', '%سولا%127%')
      .single();
    
    if (solaCompany) {
      await supabase
        .from('facebook_settings')
        .update({ company_id: solaCompany.id })
        .ilike('page_name', '%سولا%127%');
      console.log('✅ تم ربط صفحات سولا 127 بشركتها الصحيحة');
    }
    
    // 4. إنشاء قواعد تلقائية للمستقبل
    console.log('\n4️⃣ إعداد قواعد التنظيف التلقائي...');
    
    // حذف الصفحات التجريبية القديمة
    const { data: deletedPages } = await supabase
      .from('facebook_settings')
      .delete()
      .or('page_id.ilike.test_%,page_name.ilike.%تجريبية%')
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // أقدم من أسبوع
      .select();
    
    console.log(`🗑️ تم حذف ${deletedPages?.length || 0} صفحة تجريبية قديمة`);
    
    // 5. عرض النتيجة النهائية
    console.log('\n5️⃣ النتيجة النهائية:');
    const { data: finalStatus } = await supabase
      .rpc('get_company_pages_count');
    
    if (finalStatus) {
      console.log('📊 التوزيع الجديد:');
      finalStatus.forEach(company => {
        console.log(`   ${company.company_name}: ${company.pages_count} صفحة`);
      });
    }
    
    // 6. إنشاء تقرير مفصل
    console.log('\n6️⃣ تقرير مفصل:');
    const { data: companies } = await supabase
      .from('companies')
      .select(`
        id, name, email, created_at,
        facebook_settings(page_id, page_name, created_at)
      `)
      .order('created_at', { ascending: false });
    
    companies?.forEach(company => {
      console.log(`\n🏢 ${company.name}:`);
      console.log(`   📧 ${company.email}`);
      console.log(`   📅 تاريخ الإنشاء: ${new Date(company.created_at).toLocaleDateString('ar-EG')}`);
      
      const pages = company.facebook_settings || [];
      if (pages.length > 0) {
        console.log(`   📄 الصفحات (${pages.length}):`);
        pages.forEach(page => {
          console.log(`      - ${page.page_name} (${page.page_id})`);
        });
      } else {
        console.log('   📭 لا توجد صفحات مربوطة');
      }
    });
    
    console.log('\n🎉 تم تنظيف البيانات بنجاح!');
    
    // 7. توصيات للمستقبل
    console.log('\n💡 توصيات للمستقبل:');
    console.log('1. كل شركة جديدة يجب أن تبدأ بصفحات فارغة');
    console.log('2. عند ربط صفحة، تأكد من إرسال company_id');
    console.log('3. شغل هذا السكريبت دورياً لتنظيف البيانات التجريبية');
    console.log('4. راقب الصفحات غير المربوطة بشركات');
    
    return true;
    
  } catch (error) {
    console.error('💥 خطأ في التنظيف:', error);
    return false;
  }
}

// دالة لإنشاء RPC function في Supabase
async function createRPCFunction() {
  const rpcSQL = `
    CREATE OR REPLACE FUNCTION get_company_pages_count()
    RETURNS TABLE(company_name TEXT, pages_count BIGINT) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        c.name::TEXT as company_name,
        COUNT(fs.id) as pages_count
      FROM companies c
      LEFT JOIN facebook_settings fs ON c.id = fs.company_id
      GROUP BY c.id, c.name
      ORDER BY pages_count DESC;
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  try {
    await supabase.rpc('exec_sql', { sql_query: rpcSQL });
    console.log('✅ تم إنشاء RPC function بنجاح');
  } catch (error) {
    console.log('⚠️ لم يتم إنشاء RPC function (قد يكون موجود بالفعل)');
  }
}

// تشغيل التنظيف
if (process.argv.includes('--clean')) {
  createRPCFunction()
    .then(() => cleanCompanyData())
    .then(success => {
      if (success) {
        console.log('\n🎯 تم التنظيف بنجاح!');
        console.log('💡 الآن كل شركة ستبدأ بصفحات فارغة');
      } else {
        console.log('\n❌ فشل التنظيف');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 خطأ في تشغيل التنظيف:', error);
      process.exit(1);
    });
} else {
  console.log('📋 استخدام أداة التنظيف:');
  console.log('');
  console.log('لتنظيف بيانات الشركات:');
  console.log('  node clean-company-data.js --clean');
  console.log('');
  console.log('💡 هذه الأداة ستفصل الصفحات التجريبية وتربط كل صفحة بشركتها الصحيحة');
}
