const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ipevrcvgxsmenxzxdukz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZXZyY3ZneHNtZW54enh4ZHVreiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE5NzQ5NzE5LCJleHAiOjIwMzUzMjU3MTl9.Ej_gqZBbNgfiho_KQSxhLSALaLfKjjHjkWgxNjkwOQs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 فحص مشكلة ربط المتجر لشركة 121cx');
console.log('═══════════════════════════════════════════════════════════════');

async function check121cxStoreIssue() {
  try {
    // 1. البحث عن شركة 121cx
    console.log('\n1️⃣ البحث عن شركة 121cx...');
    
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('email', '121@sdfds.com')
      .single();

    if (companyError) {
      console.error('❌ خطأ في جلب الشركة:', companyError.message);
      return;
    }

    if (!company) {
      console.log('❌ لم يتم العثور على شركة 121cx');
      return;
    }

    console.log('✅ تم العثور على الشركة:');
    console.log(`   🏢 الاسم: ${company.name}`);
    console.log(`   📧 الإيميل: ${company.email}`);
    console.log(`   🆔 ID: ${company.id}`);

    // 2. البحث عن المتاجر المرتبطة بالشركة
    console.log('\n2️⃣ البحث عن المتاجر المرتبطة بالشركة...');
    
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .eq('company_id', company.id);

    if (storesError) {
      console.error('❌ خطأ في جلب المتاجر:', storesError.message);
      return;
    }

    console.log(`📊 عدد المتاجر المرتبطة: ${stores.length}`);
    
    if (stores.length === 0) {
      console.log('❌ لا توجد متاجر مرتبطة بهذه الشركة!');
      return;
    }

    stores.forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name} (${store.slug})`);
      console.log(`      🆔 Store ID: ${store.id}`);
      console.log(`      ✅ نشط: ${store.is_active ? 'نعم' : 'لا'}`);
    });

    const correctStore = stores[0]; // المتجر الصحيح للشركة

    // 3. فحص إعدادات Gemini للشركة
    console.log('\n3️⃣ فحص إعدادات Gemini للشركة...');
    
    const { data: geminiSettings, error: geminiError } = await supabase
      .from('gemini_settings')
      .select('*')
      .eq('company_id', company.id)
      .eq('is_enabled', true);

    if (geminiError) {
      console.error('❌ خطأ في جلب إعدادات Gemini:', geminiError.message);
      return;
    }

    if (!geminiSettings || geminiSettings.length === 0) {
      console.log('❌ لا توجد إعدادات Gemini مفعلة للشركة');
      return;
    }

    const setting = geminiSettings[0];
    console.log('✅ إعدادات Gemini موجودة:');
    console.log(`   🆔 Setting ID: ${setting.id}`);
    console.log(`   🤖 Model: ${setting.model}`);

    // 4. فحص البرومت الحالي
    console.log('\n4️⃣ فحص البرومت الحالي...');
    
    if (setting.personality_prompt) {
      console.log('📝 البرومت الحالي:');
      console.log('─'.repeat(50));
      console.log(setting.personality_prompt.substring(0, 500) + '...');
      console.log('─'.repeat(50));
      
      // التحقق من اسم المتجر في البرومت
      const storeNameInPrompt = stores.find(store => 
        setting.personality_prompt.includes(store.name)
      );
      
      if (storeNameInPrompt) {
        if (storeNameInPrompt.id === correctStore.id) {
          console.log(`✅ البرومت يحتوي على اسم المتجر الصحيح: ${storeNameInPrompt.name}`);
        } else {
          console.log(`❌ البرومت يحتوي على اسم متجر خاطئ: ${storeNameInPrompt.name}`);
          console.log(`💡 يجب أن يكون: ${correctStore.name}`);
        }
      } else {
        console.log('⚠️ البرومت لا يحتوي على اسم أي متجر محدد');
      }
      
      // البحث عن أسماء متاجر أخرى في البرومت
      const { data: allStores, error: allStoresError } = await supabase
        .from('stores')
        .select('name, company_id')
        .neq('company_id', company.id);
        
      if (!allStoresError && allStores) {
        const wrongStoreInPrompt = allStores.find(store => 
          setting.personality_prompt.includes(store.name)
        );
        
        if (wrongStoreInPrompt) {
          console.log(`🚨 تحذير: البرومت يحتوي على اسم متجر من شركة أخرى: ${wrongStoreInPrompt.name}`);
        }
      }
    } else {
      console.log('❌ لا يوجد برومت محدد');
    }

    // 5. فحص products_prompt
    console.log('\n5️⃣ فحص products_prompt...');
    
    if (setting.products_prompt) {
      console.log('📦 Products Prompt موجود:');
      console.log('─'.repeat(50));
      console.log(setting.products_prompt.substring(0, 300) + '...');
      console.log('─'.repeat(50));
    } else {
      console.log('❌ لا يوجد products_prompt');
    }

    return { 
      success: true, 
      company, 
      stores, 
      correctStore, 
      geminiSettings: setting 
    };
    
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return { success: false, error: error.message };
  }
}

// تشغيل الفحص
check121cxStoreIssue().then((result) => {
  if (result.success) {
    console.log('\n✅ تم فحص مشكلة ربط المتجر بنجاح');
    console.log('\n📋 ملخص النتائج:');
    console.log(`   🏢 الشركة: ${result.company.name}`);
    console.log(`   🏪 المتجر الصحيح: ${result.correctStore.name}`);
    console.log(`   🤖 إعدادات Gemini: موجودة`);
  } else {
    console.log('\n❌ فشل في فحص مشكلة ربط المتجر');
  }
});
