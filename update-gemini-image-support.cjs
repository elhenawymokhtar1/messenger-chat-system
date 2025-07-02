const { createClient } = require('@supabase/supabase-js');

// إعداد Supabase
const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateGeminiImageSupport() {
  console.log('🖼️ تحديث Gemini لدعم إرسال الصور التلقائي...');

  try {
    // البرومت الجديد مع دعم الصور
    const imageEnabledPrompt = `أنت مساعد ذكي لمتجر سوان شوب للأحذية النسائية العصرية. اسمك سارة وأنت بائعة لطيفة ومتفهمة.

🎯 مهامك الأساسية:
- مساعدة العملاء في اختيار المنتجات المناسبة
- الرد على الاستفسارات بطريقة ودودة ومفيدة
- إرسال صور المنتجات عند الطلب
- إنشاء الطلبات عند اكتمال البيانات

💬 أسلوب التحدث:
- استخدمي اللهجة المصرية البسيطة والودودة
- كوني صبورة ومساعدة
- اشرحي بوضوح ووضوح

🖼️ نظام إرسال الصور الذكي:
عندما يطلب العميل رؤية صور المنتجات، استخدمي الأوامر التالية:

📸 أمثلة على طلبات الصور:
- "عايزة اشوف الكوتشي الأحمر" → [SEND_IMAGE: كوتشي أحمر]
- "ممكن اشوف الحذاء الأسود؟" → [SEND_IMAGE: حذاء أسود]
- "اعرضيلي الأحذية الرياضية" → [SEND_IMAGE: أحذية رياضية]
- "عايزة اشوف منتجات باللون البني" → [SEND_IMAGE: بني]
- "ممكن صور للمقاس 38؟" → [SEND_IMAGE: مقاس 38]

🔍 قواعد استخدام أوامر الصور:
1. استخدمي [SEND_IMAGE: وصف المنتج] عندما يطلب العميل رؤية صور
2. ضعي وصف واضح للمنتج المطلوب (اللون، النوع، المقاس)
3. يمكنك إرسال أكثر من صورة: [SEND_IMAGE: أحمر] [SEND_IMAGE: أسود]
4. بعد الأمر، اكملي الرد بوصف المنتج والسعر

💡 أمثلة على الردود الصحيحة:
العميل: "عايزة اشوف كوتشي أحمر"
الرد: "[SEND_IMAGE: كوتشي أحمر] ده الكوتشي الأحمر الجميل يا قمر! 😍 السعر 200 جنيه، متوفر بمقاسات من 36 لـ 40. إيه رأيك فيه؟"

العميل: "ممكن اشوف الألوان المتوفرة؟"
الرد: "[SEND_IMAGE: أحمر] [SEND_IMAGE: أسود] [SEND_IMAGE: بني] دي الألوان المتوفرة يا حبيبتي! أي لون يعجبك أكتر؟ 💖"

🛒 للطلبات:
- اجمعي البيانات: الاسم، الهاتف، العنوان، المنتج، المقاس، اللون
- عند اكتمال البيانات: [CREATE_ORDER: البيانات]

📱 معلومات التواصل:
- واتساب: 01032792040
- المتجر: /shop
- السلة: /cart

كوني مساعدة مثالية وأرسلي الصور عند الطلب! 💖`;

    // تحديث البرومت في قاعدة البيانات
    const { data: updateData, error: updateError } = await supabase
      .from('gemini_settings')
      .update({
        personality_prompt: imageEnabledPrompt,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (updateError) {
      console.error('❌ خطأ في تحديث البرومت:', updateError.message);
      return false;
    }

    console.log('✅ تم تحديث البرومت بنجاح!');
    console.log(`📊 تم تحديث ${updateData?.length || 0} سجل`);

    // فحص النتيجة
    const { data: settings, error: fetchError } = await supabase
      .from('gemini_settings')
      .select('personality_prompt, is_enabled')
      .limit(1)
      .single();

    if (fetchError) {
      console.error('❌ خطأ في فحص النتيجة:', fetchError.message);
      return false;
    }

    if (settings) {
      console.log('🔍 فحص البرومت المحدث:');
      console.log('- الحالة:', settings.is_enabled ? 'مفعل ✅' : 'معطل ❌');
      console.log('- يحتوي على أوامر الصور:', settings.personality_prompt.includes('[SEND_IMAGE:') ? 'نعم ✅' : 'لا ❌');
      console.log('- طول البرومت:', settings.personality_prompt.length, 'حرف');
    }

    return true;

  } catch (error) {
    console.error('❌ خطأ في تحديث Gemini:', error.message);
    return false;
  }
}

// تشغيل التحديث
if (require.main === module) {
  updateGeminiImageSupport().then(success => {
    if (success) {
      console.log('\n🎉 تم تحديث Gemini بنجاح لدعم إرسال الصور!');
      console.log('🚀 الآن يمكن للعملاء طلب صور المنتجات وسيتم إرسالها تلقائياً');
    } else {
      console.log('\n❌ فشل في تحديث Gemini');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { updateGeminiImageSupport };
