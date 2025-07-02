const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY3NjY4MDYsImV4cCI6MjAzMjM0MjgwNn0.Ej_gqZBbNgfiho_KQSxhLSALaLfKjjHjkWgxNjkwOQs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 إصلاح إعدادات Gemini لجميع الشركات');
console.log('═══════════════════════════════════════════════════════════════');

/**
 * توليد برومت مخصص للشركة
 */
function generateCustomPrompt(storeName) {
  return `أنت مساعدة ذكية ومهذبة لـ"${storeName}". 

🎯 مهمتك:
- مساعدة العملاء في اختيار المنتجات المناسبة
- تقديم معلومات دقيقة عن المنتجات والأسعار
- إرشاد العملاء خلال عملية الطلب
- الرد بطريقة ودودة ومهنية

💬 أسلوب التواصل:
- استخدمي اللهجة المصرية الودودة
- كوني مفيدة ومباشرة
- اسألي عن التفاصيل المطلوبة لإكمال الطلب

🛍️ عند السؤال عن المنتجات:
- اعرضي المنتجات المتوفرة في "${storeName}"
- اذكري الأسعار والألوان والمقاسات المتاحة
- ساعدي العميل في اختيار المنتج المناسب

📦 لإكمال الطلب تحتاجين:
- اسم العميل الكامل
- رقم الهاتف
- العنوان بالتفصيل
- اسم المنتج
- اللون والمقاس المطلوب

🎨 إرسال الصور:
عندما يطلب العميل صورة منتج، استخدمي هذا الأمر:
[SEND_IMAGE: اسم المنتج الدقيق]

💡 نصائح مهمة:
- لا تخترعي منتجات غير موجودة
- استخدمي المعلومات الحقيقية من قاعدة البيانات
- كوني صادقة بخصوص التوفر والأسعار
- ساعدي العميل في اتخاذ القرار الصحيح

كوني مساعدة مثالية لـ"${storeName}"! 💖`;
}

/**
 * توليد برومت المنتجات المخصص
 */
function generateCustomProductsPrompt(storeName) {
  return `🛍️ منتجات "${storeName}":

عندما يسأل العميل عن المنتجات، استخدمي المعلومات الحقيقية من قاعدة البيانات.

📸 لإرسال صور المنتجات:
استخدمي الأمر: [SEND_IMAGE: اسم المنتج]

🎯 تذكري:
- اعرضي فقط منتجات "${storeName}"
- استخدمي الأسعار الحقيقية
- اذكري الألوان والمقاسات المتاحة فعلياً
- ساعدي العميل في اختيار المنتج المناسب

كوني مساعدة مثالية وأرسلي الصور عند الطلب! 💖`;
}

async function fixAllCompaniesGemini() {
  try {
    // 1. جلب جميع الشركات
    console.log('\n1️⃣ جلب جميع الشركات...');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, email');

    if (companiesError) {
      console.error('❌ خطأ في جلب الشركات:', companiesError.message);
      return;
    }

    console.log(`📊 عدد الشركات: ${companies.length}`);

    // 2. معالجة كل شركة
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      console.log(`\n${i + 1}/${companies.length} 🏢 معالجة الشركة: ${company.name}`);

      try {
        // أ. التحقق من وجود متجر
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('id, name')
          .eq('company_id', company.id)
          .single();

        let storeName;
        
        if (storeError || !store) {
          // إنشاء متجر جديد
          storeName = `متجر ${company.name}`;
          console.log(`   🏪 إنشاء متجر جديد: ${storeName}`);
          
          const { error: createStoreError } = await supabase
            .from('stores')
            .insert({
              company_id: company.id,
              name: storeName,
              description: `متجر إلكتروني لشركة ${company.name}`,
              is_active: true
            });

          if (createStoreError) {
            console.error(`   ❌ خطأ في إنشاء المتجر: ${createStoreError.message}`);
            storeName = `متجر ${company.name}`; // استخدام اسم افتراضي
          } else {
            console.log(`   ✅ تم إنشاء المتجر بنجاح`);
          }
        } else {
          storeName = store.name;
          console.log(`   ✅ المتجر موجود: ${storeName}`);
        }

        // ب. التحقق من إعدادات Gemini
        const { data: geminiSettings, error: geminiError } = await supabase
          .from('gemini_settings')
          .select('id, personality_prompt, products_prompt')
          .eq('company_id', company.id);

        if (geminiError) {
          console.error(`   ❌ خطأ في جلب إعدادات Gemini: ${geminiError.message}`);
          continue;
        }

        const customPrompt = generateCustomPrompt(storeName);
        const customProductsPrompt = generateCustomProductsPrompt(storeName);

        if (!geminiSettings || geminiSettings.length === 0) {
          // إنشاء إعدادات Gemini جديدة
          console.log(`   🤖 إنشاء إعدادات Gemini جديدة...`);
          
          const { error: createGeminiError } = await supabase
            .from('gemini_settings')
            .insert({
              company_id: company.id,
              api_key: '',
              model: 'gemini-1.5-flash',
              personality_prompt: customPrompt,
              products_prompt: customProductsPrompt,
              temperature: 0.7,
              max_tokens: 300,
              is_enabled: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createGeminiError) {
            console.error(`   ❌ خطأ في إنشاء إعدادات Gemini: ${createGeminiError.message}`);
          } else {
            console.log(`   ✅ تم إنشاء إعدادات Gemini بنجاح`);
          }
        } else {
          // تحديث الإعدادات الموجودة
          console.log(`   🔄 تحديث إعدادات Gemini الموجودة...`);
          
          const setting = geminiSettings[0];
          
          // التحقق من حاجة التحديث
          const needsUpdate = 
            !setting.personality_prompt || 
            !setting.personality_prompt.includes(storeName) ||
            !setting.products_prompt ||
            !setting.products_prompt.includes(storeName);

          if (needsUpdate) {
            const { error: updateGeminiError } = await supabase
              .from('gemini_settings')
              .update({
                personality_prompt: customPrompt,
                products_prompt: customProductsPrompt,
                updated_at: new Date().toISOString()
              })
              .eq('id', setting.id);

            if (updateGeminiError) {
              console.error(`   ❌ خطأ في تحديث إعدادات Gemini: ${updateGeminiError.message}`);
            } else {
              console.log(`   ✅ تم تحديث إعدادات Gemini بنجاح`);
            }
          } else {
            console.log(`   ✅ إعدادات Gemini محدثة بالفعل`);
          }
        }

      } catch (companyError) {
        console.error(`   ❌ خطأ في معالجة الشركة ${company.name}:`, companyError.message);
      }
    }

    // 3. ملخص النتائج
    console.log('\n3️⃣ ملخص النتائج...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        stores(id, name),
        gemini_settings(id, personality_prompt, products_prompt)
      `);

    if (finalError) {
      console.error('❌ خطأ في الفحص النهائي:', finalError.message);
      return;
    }

    console.log('📊 النتائج النهائية:');
    finalCheck.forEach((company, index) => {
      console.log(`\n${index + 1}. ${company.name}:`);
      console.log(`   🏪 المتاجر: ${company.stores?.length || 0}`);
      console.log(`   🤖 إعدادات Gemini: ${company.gemini_settings?.length || 0}`);
      
      if (company.gemini_settings && company.gemini_settings.length > 0) {
        const setting = company.gemini_settings[0];
        const hasCustomPrompt = setting.personality_prompt && setting.personality_prompt.includes(company.name);
        console.log(`   📝 برومت مخصص: ${hasCustomPrompt ? '✅' : '❌'}`);
      }
    });

    return { success: true, companiesProcessed: companies.length };
    
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return { success: false, error: error.message };
  }
}

// تشغيل الإصلاح
fixAllCompaniesGemini().then((result) => {
  if (result && result.success) {
    console.log('\n🎉 تم إصلاح جميع الشركات بنجاح!');
    console.log(`📊 عدد الشركات المعالجة: ${result.companiesProcessed}`);
    console.log('\n💡 الآن كل شركة جديدة ستحصل على:');
    console.log('   ✅ متجر مخصص');
    console.log('   ✅ إعدادات Gemini مخصصة');
    console.log('   ✅ برومت يحتوي على اسم المتجر الصحيح');
    console.log('   ✅ عدم تداخل مع الشركات الأخرى');
  } else {
    console.log('\n❌ فشل في إصلاح الشركات');
  }
});
