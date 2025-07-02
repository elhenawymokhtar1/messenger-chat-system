const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ipevrcvgxsmenxzxdukz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZXZyY3ZneHNtZW54enh4ZHVreiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE5NzQ5NzE5LCJleHAiOjIwMzUzMjU3MTl9.Ej_gqZBbNgfiho_KQSxhLSALaLfKjjHjkWgxNjkwOQs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 إصلاح ربط المتجر في البرومت لشركة 121cx');
console.log('═══════════════════════════════════════════════════════════════');

async function fix121cxStorePrompt() {
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

    console.log('✅ تم العثور على الشركة:');
    console.log(`   🏢 الاسم: ${company.name}`);
    console.log(`   🆔 ID: ${company.id}`);

    // 2. البحث عن المتجر المرتبط بالشركة
    console.log('\n2️⃣ البحث عن المتجر المرتبط بالشركة...');
    
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .eq('company_id', company.id);

    if (storesError) {
      console.error('❌ خطأ في جلب المتاجر:', storesError.message);
      return;
    }

    if (!stores || stores.length === 0) {
      console.log('❌ لا توجد متاجر مرتبطة بهذه الشركة!');
      return;
    }

    const correctStore = stores[0];
    console.log('✅ المتجر الصحيح:');
    console.log(`   🏪 الاسم: ${correctStore.name}`);
    console.log(`   🆔 Store ID: ${correctStore.id}`);

    // 3. جلب إعدادات Gemini الحالية
    console.log('\n3️⃣ جلب إعدادات Gemini الحالية...');
    
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
    console.log('✅ إعدادات Gemini موجودة');

    // 4. إنشاء برومت جديد مخصص للمتجر الصحيح
    console.log('\n4️⃣ إنشاء برومت جديد مخصص للمتجر...');
    
    const newPersonalityPrompt = `أنت مساعدة ذكية ومهذبة لمتجر "${correctStore.name}". 

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
- اعرضي المنتجات المتوفرة في متجر "${correctStore.name}"
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

مثال: إذا طلب صورة حذاء رياضي، اكتبي:
[SEND_IMAGE: حذاء رياضي]

💡 نصائح مهمة:
- لا تخترعي منتجات غير موجودة
- استخدمي المعلومات الحقيقية من قاعدة البيانات
- كوني صادقة بخصوص التوفر والأسعار
- ساعدي العميل في اتخاذ القرار الصحيح

كوني مساعدة مثالية لمتجر "${correctStore.name}"! 💖`;

    const newProductsPrompt = `🛍️ منتجات متجر "${correctStore.name}":

عندما يسأل العميل عن المنتجات، استخدمي المعلومات الحقيقية من قاعدة البيانات.

📸 لإرسال صور المنتجات:
استخدمي الأمر: [SEND_IMAGE: اسم المنتج]

أمثلة:
- [SEND_IMAGE: حذاء رياضي]
- [SEND_IMAGE: حذاء كاجوال]
- [SEND_IMAGE: صندل]

🎯 تذكري:
- اعرضي فقط منتجات متجر "${correctStore.name}"
- استخدمي الأسعار الحقيقية
- اذكري الألوان والمقاسات المتاحة فعلياً
- ساعدي العميل في اختيار المنتج المناسب

كوني مساعدة مثالية وأرسلي الصور عند الطلب! 💖`;

    // 5. تحديث إعدادات Gemini
    console.log('\n5️⃣ تحديث إعدادات Gemini...');
    
    const { error: updateError } = await supabase
      .from('gemini_settings')
      .update({
        personality_prompt: newPersonalityPrompt,
        products_prompt: newProductsPrompt,
        updated_at: new Date().toISOString()
      })
      .eq('id', setting.id);

    if (updateError) {
      console.error('❌ خطأ في تحديث الإعدادات:', updateError.message);
      return;
    }

    console.log('✅ تم تحديث إعدادات Gemini بنجاح');

    // 6. التحقق من النتيجة
    console.log('\n6️⃣ التحقق من النتيجة...');
    
    const { data: updatedSettings, error: checkError } = await supabase
      .from('gemini_settings')
      .select('*')
      .eq('id', setting.id)
      .single();

    if (checkError) {
      console.error('❌ خطأ في التحقق:', checkError.message);
      return;
    }

    console.log('✅ تم التحقق من التحديث:');
    console.log(`   📝 طول البرومت الجديد: ${updatedSettings.personality_prompt.length} حرف`);
    console.log(`   🛍️ Products Prompt: ${updatedSettings.products_prompt ? 'موجود' : 'غير موجود'}`);
    
    // التحقق من وجود اسم المتجر الصحيح
    if (updatedSettings.personality_prompt.includes(correctStore.name)) {
      console.log(`✅ البرومت يحتوي على اسم المتجر الصحيح: ${correctStore.name}`);
    } else {
      console.log('❌ البرومت لا يحتوي على اسم المتجر الصحيح');
    }

    return { 
      success: true, 
      company, 
      correctStore, 
      updatedSettings 
    };
    
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return { success: false, error: error.message };
  }
}

// تشغيل الإصلاح
fix121cxStorePrompt().then((result) => {
  if (result && result.success) {
    console.log('\n🎉 تم إصلاح ربط المتجر في البرومت بنجاح!');
    console.log('\n📋 ملخص الإصلاح:');
    console.log(`   🏢 الشركة: ${result.company.name}`);
    console.log(`   🏪 المتجر الصحيح: ${result.correctStore.name}`);
    console.log(`   🤖 البرومت محدث ومخصص للمتجر الصحيح`);
    console.log('\n💡 الآن Gemini سيرد بمعلومات المتجر الصحيح فقط');
  } else {
    console.log('\n❌ فشل في إصلاح ربط المتجر');
  }
});
