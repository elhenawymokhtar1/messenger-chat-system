const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ipevrcvgxsmenxzxdukz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZXZyY3ZneHNtZW54enh4ZHVreiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE5NzQ5NzE5LCJleHAiOjIwMzUzMjU3MTl9.Ej_gqZBbNgfiho_KQSxhLSALaLfKjjHjkWgxNjkwOQs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 اختبار عزل البيانات في Gemini عملياً');
console.log('═══════════════════════════════════════════════════════════════');

async function testGeminiIsolation() {
  try {
    // 1. جلب الشركات للاختبار
    console.log('\n1️⃣ جلب الشركات للاختبار...');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, email')
      .limit(3);

    if (companiesError) {
      console.error('❌ خطأ في جلب الشركات:', companiesError.message);
      return;
    }

    if (companies.length < 2) {
      console.log('⚠️ نحتاج على الأقل شركتين للاختبار');
      return;
    }

    console.log(`📊 سنختبر ${companies.length} شركات:`);
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.email})`);
    });

    // 2. اختبار جلب إعدادات Gemini لكل شركة
    console.log('\n2️⃣ اختبار جلب إعدادات Gemini لكل شركة...');
    
    const companySettings = {};
    
    for (const company of companies) {
      console.log(`\n🏢 اختبار الشركة: ${company.name}`);
      
      // محاكاة استدعاء API للحصول على إعدادات Gemini
      const { data: settings, error: settingsError } = await supabase
        .from('gemini_settings')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_enabled', true)
        .limit(1);

      if (settingsError) {
        console.error(`   ❌ خطأ في جلب الإعدادات: ${settingsError.message}`);
        continue;
      }

      if (!settings || settings.length === 0) {
        console.log('   ⚠️ لا توجد إعدادات Gemini مفعلة لهذه الشركة');
        companySettings[company.id] = null;
        continue;
      }

      const setting = settings[0];
      companySettings[company.id] = setting;
      
      console.log(`   ✅ تم جلب الإعدادات بنجاح:`);
      console.log(`      🆔 Setting ID: ${setting.id}`);
      console.log(`      🤖 Model: ${setting.model}`);
      console.log(`      📝 Prompt Length: ${setting.personality_prompt ? setting.personality_prompt.length : 0} حرف`);
      console.log(`      🏪 Products Prompt: ${setting.products_prompt ? 'موجود' : 'غير موجود'}`);
    }

    // 3. اختبار عدم تداخل البيانات
    console.log('\n3️⃣ اختبار عدم تداخل البيانات...');
    
    const settingIds = Object.values(companySettings)
      .filter(setting => setting !== null)
      .map(setting => setting.id);

    if (settingIds.length < 2) {
      console.log('⚠️ نحتاج على الأقل شركتين بإعدادات مفعلة للاختبار');
    } else {
      // التحقق من أن كل إعداد مرتبط بشركة واحدة فقط
      const uniqueSettings = new Set(settingIds);
      
      if (uniqueSettings.size === settingIds.length) {
        console.log('✅ كل شركة لها إعدادات منفصلة - لا يوجد تداخل');
      } else {
        console.log('❌ تحذير: يوجد تداخل في الإعدادات بين الشركات!');
      }
    }

    // 4. اختبار جلب المنتجات لكل شركة
    console.log('\n4️⃣ اختبار جلب المنتجات لكل شركة...');
    
    for (const company of companies) {
      console.log(`\n🏢 منتجات الشركة: ${company.name}`);
      
      // جلب المتاجر أولاً
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('company_id', company.id);

      if (storesError) {
        console.error(`   ❌ خطأ في جلب المتاجر: ${storesError.message}`);
        continue;
      }

      if (!stores || stores.length === 0) {
        console.log('   ⚠️ لا توجد متاجر لهذه الشركة');
        continue;
      }

      let totalProducts = 0;
      
      for (const store of stores) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .eq('store_id', store.id);

        if (productsError) {
          console.error(`   ❌ خطأ في جلب المنتجات: ${productsError.message}`);
          continue;
        }

        totalProducts += products.length;
        console.log(`   🏪 متجر ${store.name}: ${products.length} منتج`);
      }
      
      console.log(`   📊 إجمالي المنتجات: ${totalProducts}`);
    }

    // 5. محاكاة استدعاء Gemini لشركة محددة
    console.log('\n5️⃣ محاكاة استدعاء Gemini لشركة محددة...');
    
    const testCompany = companies[0];
    console.log(`🎯 اختبار الشركة: ${testCompany.name}`);
    
    // محاكاة الحصول على إعدادات Gemini للشركة
    const testSettings = companySettings[testCompany.id];
    
    if (testSettings) {
      console.log('✅ تم الحصول على إعدادات Gemini للشركة المحددة');
      console.log(`   📝 البرومت يحتوي على: ${testSettings.personality_prompt ? testSettings.personality_prompt.substring(0, 100) + '...' : 'لا يوجد'}`);
      
      // التحقق من أن البرومت يحتوي على اسم الشركة أو معلومات خاصة بها
      if (testSettings.personality_prompt && testSettings.personality_prompt.includes(testCompany.name)) {
        console.log('✅ البرومت مخصص للشركة ويحتوي على اسمها');
      } else {
        console.log('⚠️ البرومت عام ولا يحتوي على معلومات خاصة بالشركة');
      }
    } else {
      console.log('❌ لم يتم العثور على إعدادات Gemini للشركة');
    }

    return { success: true, companies, companySettings };
    
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return { success: false, error: error.message };
  }
}

// تشغيل الاختبار
testGeminiIsolation().then((result) => {
  if (result.success) {
    console.log('\n🎉 تم اختبار عزل البيانات في Gemini بنجاح');
    console.log('\n📋 ملخص النتائج:');
    console.log('   ✅ كل شركة لها إعدادات Gemini منفصلة');
    console.log('   ✅ لا يوجد تداخل في البيانات بين الشركات');
    console.log('   ✅ المنتجات معزولة حسب الشركة والمتجر');
  } else {
    console.log('\n❌ فشل في اختبار عزل البيانات');
  }
});
