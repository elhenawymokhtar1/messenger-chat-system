const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY3NjY4MDYsImV4cCI6MjAzMjM0MjgwNn0.Ej_gqZBbNgfiho_KQSxhLSALaLfKjjHjkWgxNjkwOQs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 اختبار إصلاح Gemini لشركة 121cx');
console.log('═══════════════════════════════════════════════════════════════');

async function test121cxFix() {
  try {
    // 1. التحقق من البرومت الجديد
    console.log('\n1️⃣ التحقق من البرومت الجديد...');
    
    const { data: settings, error: settingsError } = await supabase
      .from('gemini_settings')
      .select('*')
      .eq('company_id', 'a7854ed7-f421-485b-87b4-7829fddf82c3')
      .eq('is_enabled', true)
      .limit(1);

    if (settingsError) {
      console.error('❌ خطأ في جلب الإعدادات:', settingsError.message);
      return;
    }

    if (!settings || settings.length === 0) {
      console.log('❌ لا توجد إعدادات مفعلة');
      return;
    }

    const setting = settings[0];
    console.log('✅ إعدادات Gemini موجودة:');
    console.log(`   🆔 Setting ID: ${setting.id}`);
    console.log(`   🤖 Model: ${setting.model}`);
    
    // فحص البرومت
    if (setting.personality_prompt) {
      console.log('\n📝 البرومت الجديد:');
      console.log('─'.repeat(50));
      console.log(setting.personality_prompt.substring(0, 200) + '...');
      console.log('─'.repeat(50));
      
      // التحقق من وجود اسم المتجر الصحيح
      if (setting.personality_prompt.includes('متجر 121cx')) {
        console.log('✅ البرومت يحتوي على اسم المتجر الصحيح: متجر 121cx');
      } else {
        console.log('❌ البرومت لا يحتوي على اسم المتجر الصحيح');
      }
      
      // التحقق من عدم وجود أسماء متاجر أخرى
      if (setting.personality_prompt.includes('سوان شوب')) {
        console.log('❌ تحذير: البرومت ما زال يحتوي على "سوان شوب"');
      } else {
        console.log('✅ البرومت لا يحتوي على أسماء متاجر أخرى');
      }
    } else {
      console.log('❌ البرومت فارغ');
    }

    // فحص products_prompt
    if (setting.products_prompt) {
      console.log('\n📦 Products Prompt:');
      console.log('─'.repeat(50));
      console.log(setting.products_prompt.substring(0, 150) + '...');
      console.log('─'.repeat(50));
      
      if (setting.products_prompt.includes('متجر 121cx')) {
        console.log('✅ Products Prompt يحتوي على اسم المتجر الصحيح');
      } else {
        console.log('❌ Products Prompt لا يحتوي على اسم المتجر الصحيح');
      }
    } else {
      console.log('❌ Products Prompt فارغ');
    }

    // 2. التحقق من المنتجات المتوفرة
    console.log('\n2️⃣ التحقق من المنتجات المتوفرة...');
    
    const { data: products, error: productsError } = await supabase
      .from('ecommerce_products')
      .select(`
        *,
        stores!inner(
          id,
          company_id,
          name
        )
      `)
      .eq('stores.company_id', 'a7854ed7-f421-485b-87b4-7829fddf82c3')
      .eq('status', 'active');

    if (productsError) {
      console.error('❌ خطأ في جلب المنتجات:', productsError.message);
    } else {
      console.log(`📊 عدد المنتجات المتوفرة: ${products.length}`);
      
      if (products.length > 0) {
        console.log('🛍️ المنتجات:');
        products.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name} - ${product.price} جنيه`);
        });
      } else {
        console.log('⚠️ لا توجد منتجات متوفرة');
      }
    }

    // 3. محاكاة اختبار Gemini
    console.log('\n3️⃣ محاكاة اختبار Gemini...');
    
    console.log('🎯 الآن عندما يسأل العميل "ايه المنتجات المتوفرة؟" يجب أن يرد Gemini بـ:');
    console.log('   ✅ اسم المتجر الصحيح: متجر 121cx');
    console.log('   ✅ المنتجات الحقيقية من قاعدة البيانات');
    console.log('   ✅ الأسعار الصحيحة');
    console.log('   ❌ لا يذكر "سوان شوب" أو "حذاء كاجوال جلد طبيعي"');

    // 4. التحقق من المحادثة النشطة
    console.log('\n4️⃣ التحقق من المحادثة النشطة...');
    
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', '9c3d005a-efb6-444a-9d1a-f719cb42cdd0')
      .single();

    if (convError) {
      console.error('❌ خطأ في جلب المحادثة:', convError.message);
    } else {
      console.log('✅ المحادثة النشطة:');
      console.log(`   👤 العميل: ${conversation.customer_name}`);
      console.log(`   🏢 الشركة: ${conversation.company_id}`);
      console.log(`   📄 الصفحة: ${conversation.page_id}`);
      
      if (conversation.company_id === 'a7854ed7-f421-485b-87b4-7829fddf82c3') {
        console.log('✅ المحادثة مربوطة بالشركة الصحيحة');
      } else {
        console.log('❌ المحادثة غير مربوطة بالشركة الصحيحة');
      }
    }

    return { 
      success: true, 
      hasCorrectPrompt: setting.personality_prompt.includes('متجر 121cx'),
      productsCount: products.length,
      conversationLinked: conversation?.company_id === 'a7854ed7-f421-485b-87b4-7829fddf82c3'
    };
    
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return { success: false, error: error.message };
  }
}

// تشغيل الاختبار
test121cxFix().then((result) => {
  if (result && result.success) {
    console.log('\n🎉 نتائج الاختبار:');
    console.log(`   📝 البرومت صحيح: ${result.hasCorrectPrompt ? '✅' : '❌'}`);
    console.log(`   📦 عدد المنتجات: ${result.productsCount}`);
    console.log(`   🔗 المحادثة مربوطة: ${result.conversationLinked ? '✅' : '❌'}`);
    
    if (result.hasCorrectPrompt && result.conversationLinked) {
      console.log('\n🎯 الإصلاح نجح! الآن Gemini سيرد بمعلومات متجر 121cx الصحيحة');
      console.log('\n💡 اختبر الآن بإرسال رسالة "ايه المنتجات المتوفرة؟" على Facebook');
    } else {
      console.log('\n⚠️ هناك مشاكل تحتاج إصلاح إضافي');
    }
  } else {
    console.log('\n❌ فشل الاختبار');
  }
});
