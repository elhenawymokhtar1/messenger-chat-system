import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixConversationCompany() {
  try {
    console.log('🔧 إصلاح ربط المحادثات بالشركة...');
    
    // البحث عن شركة 121cx
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('email', '121@sdfds.com')
      .single();
    
    if (companyError || !company) {
      console.log('❌ لم يتم العثور على شركة 121cx');
      return;
    }
    
    console.log('✅ الشركة:', {
      id: company.id,
      name: company.name
    });
    
    // البحث عن صفحات الشركة
    const { data: pages, error: pagesError } = await supabase
      .from('facebook_settings')
      .select('*')
      .eq('company_id', company.id);
    
    if (pagesError) {
      console.error('❌ خطأ في البحث عن الصفحات:', pagesError);
      return;
    }
    
    const pageIds = pages.map(p => p.page_id);
    console.log('📄 صفحات الشركة:', pageIds);
    
    // البحث عن المحادثات التي تنتمي لصفحات الشركة ولكن غير مرتبطة بها
    console.log('\n🔍 البحث عن المحادثات غير المرتبطة...');
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .in('page_id', pageIds)
      .neq('company_id', company.id);
    
    if (convError) {
      console.error('❌ خطأ في البحث عن المحادثات:', convError);
      return;
    }
    
    console.log(`📊 محادثات تحتاج إصلاح: ${conversations.length}`);
    
    if (conversations.length > 0) {
      console.log('📋 المحادثات التي سيتم إصلاحها:');
      conversations.forEach((conv, index) => {
        console.log(`  ${index + 1}. ${conv.customer_name || 'غير محدد'} - ${conv.page_id}`);
        console.log(`     الشركة الحالية: ${conv.company_id}`);
        console.log(`     آخر رسالة: ${conv.last_message || 'غير محدد'}`);
      });
      
      // تحديث المحادثات
      console.log('\n🔧 تحديث المحادثات...');
      
      for (const conv of conversations) {
        console.log(`🔗 تحديث المحادثة ${conv.id}...`);
        
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ 
            company_id: company.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', conv.id);
        
        if (updateError) {
          console.error(`❌ خطأ في تحديث المحادثة ${conv.id}:`, updateError);
        } else {
          console.log(`✅ تم تحديث المحادثة ${conv.id}`);
        }
      }
    }
    
    // التحقق من النتيجة
    console.log('\n🔍 التحقق من النتيجة...');
    const { data: updatedConversations, error: checkError } = await supabase
      .from('conversations')
      .select('*')
      .eq('company_id', company.id)
      .order('updated_at', { ascending: false });
    
    if (checkError) {
      console.error('❌ خطأ في التحقق:', checkError);
      return;
    }
    
    console.log(`✅ إجمالي محادثات الشركة الآن: ${updatedConversations.length}`);
    
    if (updatedConversations.length > 0) {
      console.log('📋 محادثات الشركة:');
      updatedConversations.forEach((conv, index) => {
        console.log(`  ${index + 1}. ${conv.customer_name || 'غير محدد'} - ${conv.page_id}`);
        console.log(`     آخر رسالة: ${conv.last_message || 'غير محدد'}`);
        console.log(`     آخر تحديث: ${conv.updated_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

fixConversationCompany();
