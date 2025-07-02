const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ipevrcvgxsmenxzxdukz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZXZyY3ZneHNtZW54enh4ZHVreiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE5NzQ5NzE5LCJleHAiOjIwMzUzMjU3MTl9.Ej_gqZBbNgfiho_KQSxhLSALaLfKjjHjkWgxNjkwOQs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 فحص عزل البيانات في Gemini AI');
console.log('═══════════════════════════════════════════════════════════════');

async function checkGeminiIsolation() {
  try {
    // 1. فحص الشركات الموجودة
    console.log('\n1️⃣ فحص الشركات الموجودة...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, email')
      .order('created_at', { ascending: true });

    if (companiesError) {
      console.error('❌ خطأ في جلب الشركات:', companiesError.message);
      return;
    }

    console.log(`📊 عدد الشركات: ${companies.length}`);
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.email}) - ID: ${company.id}`);
    });

    // 2. فحص إعدادات Gemini لكل شركة
    console.log('\n2️⃣ فحص إعدادات Gemini لكل شركة...');

    for (const company of companies) {
      console.log(`\n🏢 الشركة: ${company.name}`);

      const { data: geminiSettings, error: geminiError } = await supabase
        .from('gemini_settings')
        .select('*')
        .eq('company_id', company.id);

      if (geminiError) {
        console.error(`   ❌ خطأ في جلب إعدادات Gemini: ${geminiError.message}`);
        continue;
      }

      if (!geminiSettings || geminiSettings.length === 0) {
        console.log('   ⚠️ لا توجد إعدادات Gemini لهذه الشركة');
        continue;
      }

      console.log(`   📊 عدد إعدادات Gemini: ${geminiSettings.length}`);

      geminiSettings.forEach((setting, index) => {
        console.log(`   ${index + 1}. ID: ${setting.id}`);
        console.log(`      🔑 API Key: ${setting.api_key ? setting.api_key.substring(0, 20) + '...' : 'غير محدد'}`);
        console.log(`      🤖 Model: ${setting.model || 'غير محدد'}`);
        console.log(`      ✅ مفعل: ${setting.is_enabled ? 'نعم' : 'لا'}`);
        console.log(`      📝 Prompt Length: ${setting.personality_prompt ? setting.personality_prompt.length : 0} حرف`);
        console.log(`      🏪 Products Prompt: ${setting.products_prompt ? 'موجود' : 'غير موجود'}`);
      });
    }

    // 3. فحص الإعدادات المشتركة (بدون company_id)
    console.log('\n3️⃣ فحص الإعدادات المشتركة (بدون company_id)...');

    const { data: sharedSettings, error: sharedError } = await supabase
      .from('gemini_settings')
      .select('*')
      .is('company_id', null);

    if (sharedError) {
      console.error('❌ خطأ في جلب الإعدادات المشتركة:', sharedError.message);
    } else {
      console.log(`📊 عدد الإعدادات المشتركة: ${sharedSettings.length}`);

      if (sharedSettings.length > 0) {
        console.log('⚠️ تحذير: توجد إعدادات مشتركة قد تؤثر على العزل!');
        sharedSettings.forEach((setting, index) => {
          console.log(`   ${index + 1}. ID: ${setting.id} - مفعل: ${setting.is_enabled ? 'نعم' : 'لا'}`);
        });
      } else {
        console.log('✅ لا توجد إعدادات مشتركة - العزل سليم');
      }
    }

    return { companies, success: true };

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return { success: false, error: error.message };
  }
}

// تشغيل الفحص
checkGeminiIsolation().then((result) => {
  if (result.success) {
    console.log('\n✅ تم فحص عزل البيانات في Gemini بنجاح');
  } else {
    console.log('\n❌ فشل في فحص عزل البيانات');
  }
});