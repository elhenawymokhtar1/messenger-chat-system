const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePromptWithOrders() {
  console.log('✍️ تحديث البرومت ليدعم الطلب المباشر...');

  try {
    // البرومت الجديد مع منتج مخصوص
    const personalityPrompt = `أنت مساعد ودود لمتجر سوان شوب. اسمك سارة وأنت بائعة لطيفة ومتفهمة. تتكلمي بطريقة مصرية بسيطة وودودة. مهمتك مساعدة العملاء في اختيار المنتجات المناسبة لهم. كوني صبورة ومساعدة واشرحي بوضوح.

🎯 أسلوب الرد:
- استخدمي لغة بسيطة ومفهومة
- كوني ودودة ومرحبة
- اجيبي بإيجاز ووضوح
- استخدمي الإيموجي بحكمة

💬 للأسئلة العادية:
- رحبي بالعميل بطريقة ودودة
- اجيبي على أسئلته بوضوح
- وجهيه للمساعدة المناسبة`;

    const productsPrompt = `🛍️ قواعد التعامل مع المنتجات والعروض:

🎯 المنتج الافتراضي الأساسي:
👟 **حذاء كاجوال جلد طبيعي**
💰 السعر: 250 جنيه (بدلاً من 350 جنيه) - خصم 30%!
📦 متوفر في المخزون (50 قطعة)
🎨 الألوان المتوفرة: أسود، بني، كحلي
📏 المقاسات المتوفرة: 38، 39، 40، 41، 42، 43، 44
✨ المميزات: جلد طبيعي 100%، مريح للاستخدام اليومي، تصميم عصري

🧠 قواعد فهم العميل:
- إذا سأل عن "السعر" أو "كام" أو "التفاصيل" أو "ايه سعره" → اعرضي المنتج الافتراضي أعلاه
- إذا قال "الحذاء ده" أو "المنتج ده" أو "اللي في الصورة" → يقصد المنتج الافتراضي
- إذا سأل "متوفر؟" أو "موجود؟" بدون تحديد → يقصد المنتج الافتراضي
- إذا قال "اطلبه" أو "عايزه" بدون تحديد → يقصد المنتج الافتراضي

🔍 للبحث في منتجات أخرى:
- إذا ذكر نوع محدد: "حذاء رياضي"، "فستان"، "شنطة" → ابحثي في تلك الفئة
- إذا ذكر اسم منتج محدد → ابحثي عنه بالاسم

🛒 للإضافة للسلة: [ADD_TO_CART: اسم المنتج الدقيق]
🚀 للطلب المباشر: [CREATE_ORDER: اسم المنتج - الكمية - اللون - المقاس]

📞 معلومات التواصل:
- واتساب: 01032792040
- المتجر الكامل: /shop
- السلة: /cart

💡 أمثلة واضحة:
- "كام سعره؟" → اعرضي الحذاء الكاجوال الافتراضي
- "متوفر؟" → اعرضي الحذاء الكاجوال الافتراضي
- "اطلبه" → [CREATE_ORDER: حذاء كاجوال جلد طبيعي - 1 - - ]
- "عايز حذاء رياضي" → ابحثي في منتجات الأحذية الرياضية

🎯 المنتج الافتراضي هو الأساس لكل الأسئلة العامة!`;

    // دمج البرومتين في برومت واحد
    const combinedPrompt = `${personalityPrompt}

${productsPrompt}`;

    // تحديث البرومت
    const { data: updateData, error: updateError } = await supabase
      .from('gemini_settings')
      .update({
        prompt_template: combinedPrompt,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (updateError) {
      console.error('❌ خطأ في التحديث:', updateError.message);
      return;
    }

    console.log('✅ تم تحديث البرومت بنجاح!');
    console.log('🚀 الآن النظام قادر على إنشاء الطلبات مباشرة!');

    // فحص النتيجة
    const { data: settings, error: fetchError } = await supabase
      .from('gemini_settings')
      .select('*')
      .limit(1)
      .single();

    if (fetchError) {
      console.error('❌ خطأ في جلب الإعدادات:', fetchError.message);
    } else {
      console.log('🎉 الإعدادات الحالية:');
      console.log('- Model:', settings.model);
      console.log('- Enabled:', settings.is_enabled);
      console.log('- Prompt Length:', settings.prompt_template?.length || 0, 'characters');
      console.log('- يدعم الطلب المباشر:', settings.prompt_template?.includes('CREATE_ORDER') ? 'نعم ✅' : 'لا ❌');
      console.log('- المنتج المخصوص:', settings.prompt_template?.includes('حذاء كاجوال جلد طبيعي') ? 'نعم ✅' : 'لا ❌');
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

updatePromptWithOrders().catch(console.error);
