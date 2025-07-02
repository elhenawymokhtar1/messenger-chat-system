// نظام إصلاح تلقائي لربط المحادثات بالشركات
// يجب تشغيله عند إضافة شركة جديدة أو عند اكتشاف محادثات غير مرتبطة

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

class ConversationAutoFixer {
  
  async fixAllOrphanConversations() {
    console.log('🔧 إصلاح تلقائي للمحادثات غير المرتبطة...');
    console.log('التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('=' .repeat(50));
    
    try {
      // 1. جلب جميع الشركات وصفحاتها
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
      
      console.log(`📊 إجمالي الشركات: ${companies.length}`);
      
      // 2. إنشاء خريطة Page ID -> Company ID
      const pageToCompanyMap = {};
      let totalPages = 0;
      
      companies.forEach(company => {
        if (company.facebook_settings) {
          company.facebook_settings.forEach(page => {
            pageToCompanyMap[page.page_id] = company.id;
            totalPages++;
          });
        }
      });
      
      console.log(`📄 إجمالي الصفحات: ${totalPages}`);
      
      // 3. البحث عن المحادثات غير المرتبطة
      const { data: orphanConversations, error: orphanError } = await supabase
        .from('conversations')
        .select('*')
        .is('company_id', null);
      
      if (orphanError) {
        console.error('❌ خطأ في البحث عن المحادثات:', orphanError);
        return;
      }
      
      console.log(`🔍 محادثات غير مرتبطة: ${orphanConversations?.length || 0}`);
      
      if (!orphanConversations || orphanConversations.length === 0) {
        console.log('✅ جميع المحادثات مرتبطة بشركات');
        return { fixed: 0, total: 0 };
      }
      
      // 4. إصلاح المحادثات
      let fixedCount = 0;
      let unfixableCount = 0;
      
      for (const conversation of orphanConversations) {
        const companyId = pageToCompanyMap[conversation.page_id];
        
        if (companyId) {
          console.log(`🔗 ربط المحادثة: ${conversation.customer_name || 'غير محدد'} -> ${this.getCompanyName(companies, companyId)}`);
          
          const { error: updateError } = await supabase
            .from('conversations')
            .update({ 
              company_id: companyId,
              updated_at: new Date().toISOString()
            })
            .eq('id', conversation.id);
          
          if (updateError) {
            console.error(`❌ خطأ في تحديث المحادثة ${conversation.id}:`, updateError);
          } else {
            fixedCount++;
          }
        } else {
          console.log(`⚠️ لم يتم العثور على شركة للصفحة: ${conversation.page_id}`);
          unfixableCount++;
        }
      }
      
      // 5. تقرير النتائج
      console.log('\n' + '=' .repeat(50));
      console.log('📊 نتائج الإصلاح:');
      console.log(`✅ تم إصلاح: ${fixedCount} محادثة`);
      console.log(`⚠️ لم يتم إصلاح: ${unfixableCount} محادثة`);
      
      if (unfixableCount > 0) {
        console.log('\n⚠️ المحادثات التي لم يتم إصلاحها تحتاج مراجعة يدوية');
      }
      
      return { 
        fixed: fixedCount, 
        unfixable: unfixableCount, 
        total: orphanConversations.length 
      };
      
    } catch (error) {
      console.error('❌ خطأ في الإصلاح التلقائي:', error.message);
      return { fixed: 0, unfixable: 0, total: 0 };
    }
  }
  
  getCompanyName(companies, companyId) {
    const company = companies.find(c => c.id === companyId);
    return company?.name || 'غير محدد';
  }
  
  // إصلاح محادثات شركة معينة
  async fixCompanyConversations(companyId) {
    console.log(`🔧 إصلاح محادثات شركة معينة: ${companyId}`);
    
    try {
      // جلب صفحات الشركة
      const { data: pages, error: pagesError } = await supabase
        .from('facebook_settings')
        .select('page_id')
        .eq('company_id', companyId);
      
      if (pagesError || !pages || pages.length === 0) {
        console.log('❌ لم يتم العثور على صفحات للشركة');
        return;
      }
      
      const pageIds = pages.map(p => p.page_id);
      
      // البحث عن محادثات غير مرتبطة من صفحات الشركة
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('page_id', pageIds)
        .is('company_id', null);
      
      if (convError) {
        console.error('❌ خطأ في البحث عن المحادثات:', convError);
        return;
      }
      
      console.log(`🔍 محادثات تحتاج إصلاح: ${conversations?.length || 0}`);
      
      if (!conversations || conversations.length === 0) {
        console.log('✅ جميع محادثات الشركة مرتبطة بشكل صحيح');
        return;
      }
      
      // إصلاح المحادثات
      let fixedCount = 0;
      
      for (const conv of conversations) {
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ 
            company_id: companyId,
            updated_at: new Date().toISOString()
          })
          .eq('id', conv.id);
        
        if (updateError) {
          console.error(`❌ خطأ في تحديث المحادثة ${conv.id}:`, updateError);
        } else {
          fixedCount++;
        }
      }
      
      console.log(`✅ تم إصلاح ${fixedCount} محادثة للشركة`);
      
    } catch (error) {
      console.error('❌ خطأ في إصلاح محادثات الشركة:', error.message);
    }
  }
  
  // فحص دوري وإصلاح تلقائي
  async scheduleAutoFix(intervalMinutes = 30) {
    console.log(`🔄 بدء الإصلاح التلقائي كل ${intervalMinutes} دقيقة...`);
    
    // إصلاح فوري
    await this.fixAllOrphanConversations();
    
    // إصلاح دوري
    setInterval(async () => {
      console.log('\n🔄 إصلاح دوري مجدول...');
      await this.fixAllOrphanConversations();
    }, intervalMinutes * 60 * 1000);
  }
}

// تشغيل الإصلاح التلقائي
const autoFixer = new ConversationAutoFixer();
autoFixer.fixAllOrphanConversations();

export default ConversationAutoFixer;
