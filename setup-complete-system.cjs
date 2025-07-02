/**
 * إعداد النظام الكامل - إنشاء جدول companies وربط الصفحات
 * تاريخ الإنشاء: 24 يونيو 2025
 */

const { createClient } = require('@supabase/supabase-js');

// إعدادات Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupCompleteSystem() {
  try {
    console.log('🚀 بدء إعداد النظام الكامل...');
    
    // 1. إنشاء جدول companies
    console.log('🏢 إنشاء جدول companies...');
    
    const companiesData = [
      {
        id: 'company-1',
        name: 'Swan Shop',
        email: 'info@swanshop.com',
        phone: '+201234567890',
        website: 'https://swanshop.com',
        address: 'القاهرة، مصر',
        city: 'القاهرة',
        country: 'Egypt',
        status: 'active',
        is_verified: true,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'company-2',
        name: 'سولا 127',
        email: 'info@sola127.com',
        phone: '+201234567891',
        website: 'https://sola127.com',
        address: 'الإسكندرية، مصر',
        city: 'الإسكندرية',
        country: 'Egypt',
        status: 'active',
        is_verified: true,
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'company-new',
        name: 'شركة جديدة للاختبار',
        email: 'info@newcompany.com',
        phone: '+201234567892',
        website: 'https://newcompany.com',
        address: 'الجيزة، مصر',
        city: 'الجيزة',
        country: 'Egypt',
        status: 'active',
        is_verified: true,
        created_at: new Date().toISOString()
      }
    ];
    
    // محاولة إدراج الشركات
    for (const company of companiesData) {
      try {
        const { data, error } = await supabase
          .from('companies')
          .upsert(company, { onConflict: 'id' })
          .select()
          .single();
        
        if (error) {
          console.log(`⚠️ خطأ في إدراج شركة ${company.name}:`, error.message);
        } else {
          console.log(`✅ تم إدراج/تحديث شركة: ${company.name}`);
        }
      } catch (companyError) {
        console.log(`⚠️ خطأ في معالجة شركة ${company.name}:`, companyError.message);
      }
    }
    
    // 2. التحقق من الشركات
    console.log('🔍 التحقق من الشركات...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, created_at');
    
    if (companiesError) {
      console.log('⚠️ لا يمكن جلب الشركات:', companiesError.message);
      console.log('💡 يبدو أن جدول companies غير موجود');
      console.log('📝 يرجى تشغيل SQL التالي في Supabase Dashboard:');
      console.log('');
      console.log(`-- إنشاء جدول companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Egypt',
    status VARCHAR(20) DEFAULT 'active',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);`);
      return;
    }
    
    console.log(`✅ تم العثور على ${companies?.length || 0} شركة`);
    companies?.forEach(company => {
      console.log(`   - ${company.name} (${company.id})`);
    });
    
    // 3. ربط الصفحات بالشركات
    console.log('🔗 ربط الصفحات بالشركات...');
    
    const pageCompanyMapping = [
      { page_id: '260345600493273', company_id: 'company-1', page_name: 'Swan shop' },
      { page_id: '240244019177739', company_id: 'company-2', page_name: 'سولا 127' }
    ];
    
    for (const mapping of pageCompanyMapping) {
      try {
        const { data, error } = await supabase
          .from('facebook_settings')
          .update({ company_id: mapping.company_id })
          .eq('page_id', mapping.page_id)
          .select();
        
        if (error) {
          console.log(`⚠️ خطأ في ربط صفحة ${mapping.page_name}:`, error.message);
        } else if (data && data.length > 0) {
          console.log(`✅ تم ربط صفحة ${mapping.page_name} بالشركة ${mapping.company_id}`);
        } else {
          console.log(`⚠️ لم يتم العثور على صفحة ${mapping.page_name} (${mapping.page_id})`);
        }
      } catch (linkError) {
        console.log(`⚠️ خطأ في ربط صفحة ${mapping.page_name}:`, linkError.message);
      }
    }
    
    // 4. عرض النتيجة النهائية
    console.log('📊 النتيجة النهائية:');
    
    const { data: finalPages, error: finalError } = await supabase
      .from('facebook_settings')
      .select(`
        page_id,
        page_name,
        company_id,
        companies!inner(name)
      `);
    
    if (finalError) {
      console.log('⚠️ لا يمكن جلب النتيجة النهائية:', finalError.message);
    } else {
      console.table(finalPages?.map(page => ({
        page_id: page.page_id,
        page_name: page.page_name,
        company_id: page.company_id,
        company_name: page.companies?.name || 'غير محدد'
      })));
    }
    
    console.log('');
    console.log('🎉 تم إعداد النظام بنجاح!');
    console.log('💡 الآن كل شركة لها صفحاتها الخاصة');
    console.log('🧪 يمكنك اختبار النظام باستخدام: http://localhost:8081/test-company-pages.html');
    
  } catch (error) {
    console.error('❌ خطأ عام في إعداد النظام:', error);
    console.log('');
    console.log('🔧 حل بديل:');
    console.log('1. اذهب إلى Supabase Dashboard');
    console.log('2. افتح SQL Editor');
    console.log('3. شغل محتوى ملف create-companies-table.sql');
  }
}

// تشغيل الإعداد
setupCompleteSystem();
