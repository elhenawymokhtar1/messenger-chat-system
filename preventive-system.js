import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

class PreventiveSystem {
  
  // 1. فحص صحة Facebook Tokens لجميع الشركات
  async checkAllTokens() {
    console.log('🔍 فحص جميع Facebook Tokens...');
    
    try {
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
      
      const results = [];
      
      for (const page of pages) {
        console.log(`\n🔍 فحص صفحة: ${page.page_name} (${page.companies?.name})`);
        
        const tokenStatus = await this.checkSingleToken(page.access_token, page.page_id);
        
        results.push({
          page_id: page.page_id,
          page_name: page.page_name,
          company_name: page.companies?.name,
          company_email: page.companies?.email,
          token_valid: tokenStatus.valid,
          error: tokenStatus.error,
          needs_renewal: !tokenStatus.valid
        });
        
        if (!tokenStatus.valid) {
          console.log(`❌ Token منتهي الصلاحية للصفحة: ${page.page_name}`);
          console.log(`   الشركة: ${page.companies?.name}`);
          console.log(`   الخطأ: ${tokenStatus.error?.message}`);
        } else {
          console.log(`✅ Token صحيح للصفحة: ${page.page_name}`);
        }
      }
      
      // تقرير شامل
      console.log('\n📊 تقرير شامل:');
      const validTokens = results.filter(r => r.token_valid).length;
      const invalidTokens = results.filter(r => !r.token_valid).length;
      
      console.log(`✅ Tokens صحيحة: ${validTokens}`);
      console.log(`❌ Tokens تحتاج تجديد: ${invalidTokens}`);
      
      if (invalidTokens > 0) {
        console.log('\n⚠️ الشركات التي تحتاج تجديد Token:');
        results.filter(r => !r.token_valid).forEach(r => {
          console.log(`  - ${r.company_name} (${r.page_name})`);
        });
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ خطأ في فحص Tokens:', error.message);
    }
  }
  
  // فحص token واحد
  async checkSingleToken(token, pageId) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${token}`);
      const data = await response.json();
      
      if (data.error) {
        return { valid: false, error: data.error };
      }
      
      return { valid: true, data };
      
    } catch (error) {
      return { valid: false, error: { message: error.message } };
    }
  }
  
  // 2. إصلاح ربط المحادثات بالشركات
  async fixConversationCompanyLinks() {
    console.log('\n🔧 إصلاح ربط المحادثات بالشركات...');
    
    try {
      // جلب جميع الشركات وصفحاتها
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          email,
          facebook_settings(page_id, page_name)
        `);
      
      if (companiesError) {
        console.error('❌ خطأ في جلب الشركات:', companiesError);
        return;
      }
      
      let fixedCount = 0;
      
      for (const company of companies) {
        if (!company.facebook_settings || company.facebook_settings.length === 0) {
          continue;
        }
        
        const pageIds = company.facebook_settings.map(p => p.page_id);
        
        // البحث عن محادثات غير مرتبطة بالشركة
        const { data: orphanConversations, error: orphanError } = await supabase
          .from('conversations')
          .select('*')
          .in('page_id', pageIds)
          .neq('company_id', company.id);
        
        if (orphanError) {
          console.error(`❌ خطأ في البحث عن محادثات ${company.name}:`, orphanError);
          continue;
        }
        
        if (orphanConversations.length > 0) {
          console.log(`🔗 إصلاح ${orphanConversations.length} محادثة للشركة: ${company.name}`);
          
          for (const conv of orphanConversations) {
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
              fixedCount++;
            }
          }
        }
      }
      
      console.log(`✅ تم إصلاح ${fixedCount} محادثة`);
      
    } catch (error) {
      console.error('❌ خطأ في إصلاح ربط المحادثات:', error.message);
    }
  }
  
  // 3. فحص شامل للنظام
  async systemHealthCheck() {
    console.log('🏥 فحص صحة النظام الشامل...');
    console.log('=' .repeat(50));
    
    // فحص Tokens
    const tokenResults = await this.checkAllTokens();
    
    // إصلاح ربط المحادثات
    await this.fixConversationCompanyLinks();
    
    // فحص قاعدة البيانات
    await this.checkDatabaseHealth();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ انتهى الفحص الشامل');
  }
  
  // 4. فحص صحة قاعدة البيانات
  async checkDatabaseHealth() {
    console.log('\n🗄️ فحص صحة قاعدة البيانات...');
    
    try {
      // إحصائيات عامة
      const { data: companies } = await supabase.from('companies').select('id');
      const { data: pages } = await supabase.from('facebook_settings').select('id');
      const { data: conversations } = await supabase.from('conversations').select('id');
      const { data: messages } = await supabase.from('messages').select('id');
      
      console.log('📊 إحصائيات النظام:');
      console.log(`  - الشركات: ${companies?.length || 0}`);
      console.log(`  - صفحات Facebook: ${pages?.length || 0}`);
      console.log(`  - المحادثات: ${conversations?.length || 0}`);
      console.log(`  - الرسائل: ${messages?.length || 0}`);
      
      // فحص المحادثات بدون company_id
      const { data: orphanConversations } = await supabase
        .from('conversations')
        .select('id')
        .is('company_id', null);
      
      if (orphanConversations && orphanConversations.length > 0) {
        console.log(`⚠️ محادثات بدون شركة: ${orphanConversations.length}`);
      } else {
        console.log('✅ جميع المحادثات مرتبطة بشركات');
      }
      
    } catch (error) {
      console.error('❌ خطأ في فحص قاعدة البيانات:', error.message);
    }
  }
  
  // 5. تشغيل الفحص الدوري
  startPeriodicCheck(intervalMinutes = 60) {
    console.log(`🔄 بدء الفحص الدوري كل ${intervalMinutes} دقيقة...`);
    
    // فحص فوري
    this.systemHealthCheck();
    
    // فحص دوري
    setInterval(() => {
      console.log('\n🔄 فحص دوري مجدول...');
      this.systemHealthCheck();
    }, intervalMinutes * 60 * 1000);
  }
}

// تشغيل النظام
const preventiveSystem = new PreventiveSystem();

// إذا تم تشغيل الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 تشغيل النظام الوقائي...');
  
  // فحص شامل فوري
  preventiveSystem.systemHealthCheck();
  
  // بدء الفحص الدوري (كل ساعة)
  // preventiveSystem.startPeriodicCheck(60);
}

export default PreventiveSystem;
