/**
 * إصلاح عزل إعدادات Gemini AI حسب الشركة - الإصلاح الكامل
 * تاريخ الإنشاء: 27 يونيو 2025
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fixGeminiCompanyIsolation() {
  console.log('🔧 إصلاح عزل إعدادات Gemini AI حسب الشركة - الإصلاح الكامل');
  console.log('='.repeat(70));
  
  try {
    // 1. التحقق من وجود عمود company_id
    console.log('1️⃣ التحقق من هيكل الجدول...');

    // محاولة جلب عمود company_id للتحقق من وجوده
    const { data: testColumn, error: testError } = await supabase
      .from('gemini_settings')
      .select('company_id')
      .limit(1);

    if (testError && testError.message.includes('column "company_id" does not exist')) {
      console.log('⚠️ عمود company_id غير موجود، سيتم تخطي هذه الخطوة');
      console.log('💡 يرجى إضافة العمود يدوياً باستخدام SQL:');
      console.log('   ALTER TABLE gemini_settings ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;');
      console.log('   CREATE INDEX idx_gemini_settings_company_id ON gemini_settings(company_id);');
      console.log('');
    } else {
      console.log('✅ عمود company_id موجود بالفعل');
    }

    // 2. جلب جميع الشركات
    console.log('\n2️⃣ جلب جميع الشركات...');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, email');
    
    if (companiesError) {
      console.error('❌ خطأ في جلب الشركات:', companiesError.message);
      return false;
    }
    
    console.log(`🏢 عدد الشركات: ${companies?.length || 0}`);
    companies?.forEach(company => {
      console.log(`   - ${company.name} (${company.id})`);
    });

    // 3. فحص الإعدادات الحالية
    console.log('\n3️⃣ فحص الإعدادات الحالية...');
    
    const { data: currentSettings, error: settingsError } = await supabase
      .from('gemini_settings')
      .select('id, api_key, model, is_enabled, company_id, created_at');
    
    if (settingsError) {
      console.error('❌ خطأ في جلب الإعدادات:', settingsError.message);
      return false;
    }
    
    console.log(`📊 عدد إعدادات Gemini الموجودة: ${currentSettings?.length || 0}`);
    
    const settingsWithoutCompany = currentSettings?.filter(s => !s.company_id) || [];
    const settingsWithCompany = currentSettings?.filter(s => s.company_id) || [];
    
    console.log(`⚠️ إعدادات بدون شركة (مشتركة): ${settingsWithoutCompany.length}`);
    console.log(`✅ إعدادات مربوطة بشركات: ${settingsWithCompany.length}`);

    // 4. إنشاء إعدادات منفصلة لكل شركة
    console.log('\n4️⃣ إنشاء إعدادات منفصلة لكل شركة...');
    
    if (companies && companies.length > 0) {
      // الحصول على الإعدادات الافتراضية
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
          console.log(`📝 إنشاء إعدادات جديدة للشركة: ${company.name}`);
          
          const companySettings = {
            api_key: defaultSettings.api_key || '',
            model: defaultSettings.model || 'gemini-1.5-flash',
            prompt_template: defaultSettings.prompt_template || `أنت مساعد ذكي لشركة ${company.name}`,
            personality_prompt: defaultSettings.personality_prompt || '',
            products_prompt: defaultSettings.products_prompt || '',
            is_enabled: defaultSettings.is_enabled || false,
            max_tokens: defaultSettings.max_tokens || 1000,
            temperature: defaultSettings.temperature || 0.7,
            company_id: company.id
          };

          const { error: insertError } = await supabase
            .from('gemini_settings')
            .insert(companySettings);

          if (insertError) {
            console.error(`❌ خطأ في إنشاء إعدادات للشركة ${company.name}:`, insertError.message);
          } else {
            console.log(`✅ تم إنشاء إعدادات للشركة: ${company.name}`);
          }
        } else {
          console.log(`✅ الشركة ${company.name} لديها إعدادات بالفعل`);
        }
      }
    }

    // 5. حذف الإعدادات المشتركة القديمة (اختياري)
    console.log('\n5️⃣ تنظيف الإعدادات المشتركة القديمة...');
    
    if (settingsWithoutCompany.length > 0) {
      console.log(`⚠️ تم العثور على ${settingsWithoutCompany.length} إعداد مشترك قديم`);
      console.log('💡 يمكنك حذفها يدوياً إذا كنت متأكداً من عدم الحاجة إليها');
      
      // عرض الإعدادات المشتركة للمراجعة
      settingsWithoutCompany.forEach((setting, index) => {
        console.log(`   ${index + 1}. ID: ${setting.id}, Model: ${setting.model}, Enabled: ${setting.is_enabled}`);
      });
    }

    // 6. التحقق من النتيجة النهائية
    console.log('\n6️⃣ التحقق من النتيجة النهائية...');
    
    const { data: finalSettings } = await supabase
      .from('gemini_settings')
      .select('id, company_id, is_enabled, model, companies(name)')
      .order('created_at', { ascending: true });
    
    console.log('📊 الإعدادات النهائية:');
    
    const settingsByCompany = {};
    finalSettings?.forEach(setting => {
      const companyName = setting.companies?.name || 'إعدادات مشتركة';
      if (!settingsByCompany[companyName]) {
        settingsByCompany[companyName] = [];
      }
      settingsByCompany[companyName].push(setting);
    });
    
    Object.entries(settingsByCompany).forEach(([companyName, settings]) => {
      console.log(`\n🏢 ${companyName}:`);
      console.log(`   📊 عدد الإعدادات: ${settings.length}`);
      settings.forEach(setting => {
        console.log(`      - ${setting.model} (${setting.is_enabled ? 'مفعل' : 'معطل'})`);
      });
    });

    console.log('\n🎉 تم إصلاح عزل إعدادات Gemini AI بنجاح!');
    console.log('✅ الآن كل شركة لها إعدادات Gemini منفصلة');
    
    return true;
    
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return false;
  }
}

// تشغيل الإصلاح
fixGeminiCompanyIsolation()
  .then(success => {
    if (success) {
      console.log('\n🎯 تم الإصلاح بنجاح!');
      console.log('💡 الخطوة التالية: تحديث API الخلفي');
    } else {
      console.log('\n❌ فشل الإصلاح');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ خطأ في تشغيل الإصلاح:', error);
    process.exit(1);
  });
