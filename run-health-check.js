import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function healthCheck() {
  console.log('🏥 فحص صحة النظام الشامل...');
  console.log('=' .repeat(50));
  
  try {
    // 1. فحص جميع Facebook Tokens
    console.log('🔍 فحص جميع Facebook Tokens...');
    
    const { data: pages, error } = await supabase
      .from('facebook_settings')
      .select(`
        *,
        companies(name, email)
      `);
    
    if (error) {
      console.error('❌ خطأ في جلب الصفحات:', error);
      return;
    }
    
    console.log(`📊 إجمالي الصفحات: ${pages.length}`);
    
    let validTokens = 0;
    let invalidTokens = 0;
    
    for (const page of pages) {
      console.log(`\n🔍 فحص صفحة: ${page.page_name}`);
      console.log(`   الشركة: ${page.companies?.name || 'غير محدد'}`);
      
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${page.access_token}`);
        const data = await response.json();
        
        if (data.error) {
          console.log(`❌ Token منتهي الصلاحية: ${data.error.message}`);
          invalidTokens++;
        } else {
          console.log(`✅ Token صحيح`);
          validTokens++;
        }
      } catch (error) {
        console.log(`❌ خطأ في الاتصال: ${error.message}`);
        invalidTokens++;
      }
    }
    
    console.log(`\n📊 نتائج فحص Tokens:`);
    console.log(`✅ Tokens صحيحة: ${validTokens}`);
    console.log(`❌ Tokens تحتاج تجديد: ${invalidTokens}`);
    
    // 2. فحص ربط المحادثات بالشركات
    console.log('\n🔗 فحص ربط المحادثات بالشركات...');
    
    const { data: orphanConversations } = await supabase
      .from('conversations')
      .select('id, page_id, customer_name')
      .is('company_id', null);
    
    console.log(`📊 محادثات بدون شركة: ${orphanConversations?.length || 0}`);
    
    // 3. إحصائيات عامة
    console.log('\n📊 إحصائيات النظام:');
    
    const { data: companies } = await supabase.from('companies').select('id');
    const { data: conversations } = await supabase.from('conversations').select('id');
    const { data: messages } = await supabase.from('messages').select('id');
    
    console.log(`  - الشركات: ${companies?.length || 0}`);
    console.log(`  - صفحات Facebook: ${pages?.length || 0}`);
    console.log(`  - المحادثات: ${conversations?.length || 0}`);
    console.log(`  - الرسائل: ${messages?.length || 0}`);
    
    // 4. فحص المحادثات لكل شركة
    console.log('\n🏢 محادثات كل شركة:');
    
    for (const company of companies || []) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('name, email')
        .eq('id', company.id)
        .single();
      
      const { data: companyConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('company_id', company.id);
      
      console.log(`  - ${companyData?.name || 'غير محدد'}: ${companyConversations?.length || 0} محادثة`);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ انتهى الفحص الشامل');
    
    // تقييم الحالة العامة
    if (invalidTokens === 0 && (orphanConversations?.length || 0) === 0) {
      console.log('🎉 النظام يعمل بشكل مثالي!');
    } else {
      console.log('⚠️ يحتاج النظام لبعض الإصلاحات:');
      if (invalidTokens > 0) {
        console.log(`  - تجديد ${invalidTokens} Facebook Token`);
      }
      if ((orphanConversations?.length || 0) > 0) {
        console.log(`  - ربط ${orphanConversations.length} محادثة بالشركات`);
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في الفحص:', error.message);
  }
}

healthCheck();
