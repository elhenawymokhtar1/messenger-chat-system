// 🔧 إصلاح عزل إعدادات Gemini AI للشركات
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fixGeminiCompanyIsolation() {
  console.log('🔧 بدء إصلاح عزل إعدادات Gemini AI للشركات...\n');
  
  try {
    // 1. التحقق من الوضع الحالي
    console.log('1️⃣ فحص الوضع الحالي...');
    
    const { data: currentSettings, error: settingsError } = await supabase
      .from('gemini_settings')
      .select('id, api_key, model, is_enabled, company_id, created_at');
    
    if (settingsError) {
      console.error('❌ خطأ في جلب الإعدادات:', settingsError.message);
      return false;
    }
    
    console.log(`📊 عدد إعدادات Gemini الموجودة: ${currentSettings?.length || 0}`);
    
    if (currentSettings && currentSettings.length > 0) {
      console.log('\n📋 الإعدادات الحالية:');
      currentSettings.forEach((setting, index) => {
        console.log(`   ${index + 1}. ID: ${setting.id}`);
        console.log(`      🏢 Company ID: ${setting.company_id || 'غير محدد (مشترك)'}`);
        console.log(`      🤖 Model: ${setting.model}`);
        console.log(`      ✅ Enabled: ${setting.is_enabled ? 'نعم' : 'لا'}`);
        console.log(`      📅 Created: ${new Date(setting.created_at).toLocaleDateString('ar-EG')}`);
        console.log('');
      });
    }
    
    // 2. جلب جميع الشركات
    console.log('2️⃣ جلب جميع الشركات...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: true });
    
    if (companiesError) {
      console.error('❌ خطأ في جلب الشركات:', companiesError.message);
      return false;
    }
    
    console.log(`🏢 عدد الشركات: ${companies?.length || 0}`);
    
    // 3. تحليل المشكلة
    console.log('\n3️⃣ تحليل المشكلة...');
    
    const settingsWithoutCompany = currentSettings?.filter(s => !s.company_id) || [];
    const settingsWithCompany = currentSettings?.filter(s => s.company_id) || [];
    
    console.log(`⚠️ إعدادات بدون شركة (مشتركة): ${settingsWithoutCompany.length}`);
    console.log(`✅ إعدادات مربوطة بشركات: ${settingsWithCompany.length}`);
    
    // 4. إنشاء إعدادات منفصلة لكل شركة
    console.log('\n4️⃣ إنشاء إعدادات منفصلة لكل شركة...');
    
    if (companies && companies.length > 0) {
      // الحصول على الإعدادات الافتراضية (أول إعداد موجود أو إعدادات افتراضية)
      const defaultSettings = currentSettings && currentSettings.length > 0 
        ? currentSettings[0] 
        : {
            api_key: '',
            model: 'gemini-1.5-flash',
            prompt_template: 'أنت مساعد ذكي لمتجر إلكتروني',
            personality_prompt: '',
            products_prompt: '',
            is_enabled: false,
            max_tokens: 1000,
            temperature: 0.7
          };
      
      for (const company of companies) {
        // التحقق من وجود إعدادات للشركة
        const existingCompanySettings = settingsWithCompany.find(s => s.company_id === company.id);
        
        if (!existingCompanySettings) {
          console.log(`➕ إنشاء إعدادات جديدة للشركة: ${company.name}`);
          
          const newSettings = {
            api_key: defaultSettings.api_key || '',
            model: defaultSettings.model || 'gemini-1.5-flash',
            prompt_template: defaultSettings.prompt_template || 'أنت مساعد ذكي لمتجر إلكتروني',
            personality_prompt: defaultSettings.personality_prompt || '',
            products_prompt: defaultSettings.products_prompt || '',
            is_enabled: false, // بدء بإعدادات معطلة للشركات الجديدة
            max_tokens: defaultSettings.max_tokens || 1000,
            temperature: defaultSettings.temperature || 0.7,
            company_id: company.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { error: insertError } = await supabase
            .from('gemini_settings')
            .insert(newSettings);
          
          if (insertError) {
            console.error(`❌ خطأ في إنشاء إعدادات للشركة ${company.name}:`, insertError.message);
          } else {
            console.log(`✅ تم إنشاء إعدادات للشركة ${company.name}`);
          }
        } else {
          console.log(`✅ الشركة ${company.name} لديها إعدادات بالفعل`);
        }
      }
    }
    
    // 5. التعامل مع الإعدادات المشتركة القديمة
    console.log('\n5️⃣ التعامل مع الإعدادات المشتركة القديمة...');
    
    if (settingsWithoutCompany.length > 0) {
      console.log(`⚠️ يوجد ${settingsWithoutCompany.length} إعداد مشترك`);
      console.log('💡 يمكنك:');
      console.log('   1. حذفها (إذا كانت غير مستخدمة)');
      console.log('   2. ربطها بشركة معينة');
      console.log('   3. الاحتفاظ بها كإعدادات افتراضية');
      
      // ربط الإعدادات المشتركة بأول شركة (اختياري)
      if (companies && companies.length > 0 && process.argv.includes('--assign-to-first')) {
        const firstCompany = companies[0];
        console.log(`🔄 ربط الإعدادات المشتركة بالشركة الأولى: ${firstCompany.name}`);
        
        for (const setting of settingsWithoutCompany) {
          const { error: updateError } = await supabase
            .from('gemini_settings')
            .update({ 
              company_id: firstCompany.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', setting.id);
          
          if (updateError) {
            console.error(`❌ خطأ في ربط الإعداد ${setting.id}:`, updateError.message);
          } else {
            console.log(`✅ تم ربط الإعداد ${setting.id} بالشركة ${firstCompany.name}`);
          }
        }
      }
    }
    
    // 6. التحقق من النتيجة النهائية
    console.log('\n6️⃣ التحقق من النتيجة النهائية...');
    
    const { data: finalSettings } = await supabase
      .from('gemini_settings')
      .select('id, company_id, is_enabled, model')
      .order('created_at', { ascending: true });
    
    console.log('📊 الإعدادات النهائية:');
    
    const settingsByCompany = {};
    finalSettings?.forEach(setting => {
      const companyId = setting.company_id || 'مشترك';
      if (!settingsByCompany[companyId]) {
        settingsByCompany[companyId] = [];
      }
      settingsByCompany[companyId].push(setting);
    });
    
    Object.entries(settingsByCompany).forEach(([companyId, settings]) => {
      const companyName = companyId === 'مشترك' 
        ? 'إعدادات مشتركة' 
        : companies?.find(c => c.id === companyId)?.name || companyId;
      
      console.log(`\n🏢 ${companyName}:`);
      console.log(`   📊 عدد الإعدادات: ${settings.length}`);
      settings.forEach(setting => {
        console.log(`      - ${setting.model} (${setting.is_enabled ? 'مفعل' : 'معطل'})`);
      });
    });
    
    // 7. توصيات
    console.log('\n💡 التوصيات:');
    console.log('1. كل شركة جديدة ستحصل على إعدادات Gemini منفصلة');
    console.log('2. تأكد من تفعيل الإعدادات لكل شركة حسب الحاجة');
    console.log('3. راقب استخدام API keys لتجنب تجاوز الحدود');
    console.log('4. يمكن مشاركة نفس API key بين الشركات إذا لزم الأمر');
    
    console.log('\n🎉 تم إصلاح عزل إعدادات Gemini AI بنجاح!');
    return true;
    
  } catch (error) {
    console.error('💥 خطأ عام في الإصلاح:', error);
    return false;
  }
}

// تشغيل الإصلاح
if (process.argv.includes('--fix')) {
  fixGeminiCompanyIsolation()
    .then(success => {
      if (success) {
        console.log('\n🎯 تم الإصلاح بنجاح!');
        console.log('💡 الآن كل شركة لها إعدادات Gemini منفصلة');
      } else {
        console.log('\n❌ فشل الإصلاح');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 خطأ في تشغيل الإصلاح:', error);
      process.exit(1);
    });
} else {
  console.log('📋 استخدام أداة إصلاح Gemini:');
  console.log('');
  console.log('لإصلاح عزل إعدادات Gemini:');
  console.log('  node fix-gemini-company-isolation.js --fix');
  console.log('');
  console.log('لربط الإعدادات المشتركة بأول شركة:');
  console.log('  node fix-gemini-company-isolation.js --fix --assign-to-first');
  console.log('');
  console.log('💡 هذه الأداة ستضمن أن كل شركة لها إعدادات Gemini منفصلة');
}
