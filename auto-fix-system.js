import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

class AutoFixSystem {
  
  // إصلاح تلقائي للشركات الجديدة
  async setupNewCompany(companyId, companyName) {
    console.log(`🏢 إعداد شركة جديدة: ${companyName}`);
    
    try {
      // 1. إنشاء إعدادات Gemini للشركة الجديدة
      const { data: existingGemini } = await supabase
        .from('gemini_settings')
        .select('id')
        .eq('company_id', companyId)
        .single();

      if (!existingGemini) {
        console.log('   🤖 إنشاء إعدادات Gemini...');
        
        const { error: geminiError } = await supabase
          .from('gemini_settings')
          .insert({
            company_id: companyId,
            api_key: 'AIzaSyBKhJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJJ', // يجب تحديثه
            model: 'gemini-1.5-flash',
            temperature: 0.7,
            max_tokens: 300,
            is_enabled: true,
            personality_prompt: 'أنت مساعد ذكي لمتجر أحذية. ساعد العملاء في اختيار الأحذية المناسبة وتقديم المعلومات عن المنتجات والأسعار.'
          });

        if (geminiError) {
          console.error('   ❌ خطأ في إنشاء إعدادات Gemini:', geminiError);
        } else {
          console.log('   ✅ تم إنشاء إعدادات Gemini بنجاح');
        }
      }

      // 2. التحقق من وجود متجر للشركة
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('company_id', companyId)
        .single();

      if (!existingStore) {
        console.log('   🏪 إنشاء متجر افتراضي...');
        
        const { error: storeError } = await supabase
          .from('stores')
          .insert({
            company_id: companyId,
            name: `متجر ${companyName}`,
            description: 'متجر أحذية عالية الجودة',
            is_active: true
          });

        if (storeError) {
          console.error('   ❌ خطأ في إنشاء المتجر:', storeError);
        } else {
          console.log('   ✅ تم إنشاء المتجر بنجاح');
        }
      }

      console.log(`✅ تم إعداد الشركة ${companyName} بنجاح`);
      return true;

    } catch (error) {
      console.error(`❌ خطأ في إعداد الشركة ${companyName}:`, error);
      return false;
    }
  }

  // إصلاح تلقائي لصفحات Facebook الجديدة
  async setupNewFacebookPage(pageId, pageName, accessToken, companyId) {
    console.log(`📱 إعداد صفحة Facebook جديدة: ${pageName}`);
    
    try {
      // التحقق من صحة Token
      const tokenResponse = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`);
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.log('   ❌ Facebook Token غير صحيح');
        return false;
      }

      // إنشاء إعدادات Facebook
      const { error: fbError } = await supabase
        .from('facebook_settings')
        .insert({
          page_id: pageId,
          page_name: pageName,
          access_token: accessToken,
          company_id: companyId,
          is_active: true,
          webhook_enabled: true
        });

      if (fbError) {
        console.error('   ❌ خطأ في إنشاء إعدادات Facebook:', fbError);
        return false;
      }

      console.log(`✅ تم إعداد صفحة ${pageName} بنجاح`);
      return true;

    } catch (error) {
      console.error(`❌ خطأ في إعداد صفحة ${pageName}:`, error);
      return false;
    }
  }

  // فحص وإصلاح دوري للنظام
  async periodicSystemCheck() {
    console.log('\n🔧 فحص وإصلاح دوري للنظام...');
    
    try {
      // 1. فحص الشركات بدون إعدادات Gemini
      await this.fixCompaniesWithoutGemini();
      
      // 2. فحص الصفحات بدون إعدادات
      await this.fixPagesWithoutSettings();
      
      // 3. فحص وتنظيف الرسائل القديمة غير المرسلة
      await this.cleanupOldUnsentMessages();
      
      // 4. تحديث إحصائيات النظام
      await this.updateSystemStats();

    } catch (error) {
      console.error('❌ خطأ في الفحص الدوري:', error);
    }
  }

  async fixCompaniesWithoutGemini() {
    const { data: companies } = await supabase
      .from('companies')
      .select(`
        id, name,
        gemini_settings(id)
      `);

    if (!companies) return;

    for (const company of companies) {
      if (!company.gemini_settings || company.gemini_settings.length === 0) {
        console.log(`🔧 إصلاح إعدادات Gemini للشركة: ${company.name}`);
        await this.setupNewCompany(company.id, company.name);
      }
    }
  }

  async fixPagesWithoutSettings() {
    // البحث عن محادثات بصفحات ليس لها إعدادات
    const { data: conversations } = await supabase
      .from('conversations')
      .select(`
        page_id,
        facebook_page_id,
        company_id,
        companies(name)
      `)
      .not('page_id', 'is', null);

    if (!conversations) return;

    const uniquePages = new Map();
    
    conversations.forEach(conv => {
      const pageId = conv.page_id || conv.facebook_page_id;
      if (pageId && !uniquePages.has(pageId)) {
        uniquePages.set(pageId, {
          pageId,
          companyId: conv.company_id,
          companyName: conv.companies?.name
        });
      }
    });

    for (const [pageId, info] of uniquePages) {
      const { data: existingSettings } = await supabase
        .from('facebook_settings')
        .select('id')
        .eq('page_id', pageId)
        .single();

      if (!existingSettings) {
        console.log(`⚠️ صفحة بدون إعدادات: ${pageId} - الشركة: ${info.companyName}`);
        console.log('💡 يحتاج إضافة Facebook Token يدوياً');
      }
    }
  }

  async cleanupOldUnsentMessages() {
    // حذف الرسائل غير المرسلة الأقدم من 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: oldMessages, error } = await supabase
      .from('messages')
      .select('id')
      .eq('sender_type', 'bot')
      .is('facebook_message_id', null)
      .lt('created_at', sevenDaysAgo.toISOString());

    if (oldMessages && oldMessages.length > 0) {
      console.log(`🧹 تنظيف ${oldMessages.length} رسالة قديمة غير مرسلة`);
      
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .in('id', oldMessages.map(m => m.id));

      if (!deleteError) {
        console.log('✅ تم تنظيف الرسائل القديمة');
      }
    }
  }

  async updateSystemStats() {
    // تحديث إحصائيات النظام
    const stats = {
      companies: 0,
      activePages: 0,
      unsentMessages: 0,
      lastUpdate: new Date().toISOString()
    };

    // عدد الشركات
    const { data: companiesCount } = await supabase
      .from('companies')
      .select('id', { count: 'exact' });
    stats.companies = companiesCount?.length || 0;

    // عدد الصفحات النشطة
    const { data: pagesCount } = await supabase
      .from('facebook_settings')
      .select('id', { count: 'exact' })
      .eq('is_active', true);
    stats.activePages = pagesCount?.length || 0;

    // عدد الرسائل غير المرسلة
    const { data: unsentCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('sender_type', 'bot')
      .is('facebook_message_id', null);
    stats.unsentMessages = unsentCount?.length || 0;

    console.log('\n📊 إحصائيات النظام:');
    console.log(`   🏢 الشركات: ${stats.companies}`);
    console.log(`   📱 الصفحات النشطة: ${stats.activePages}`);
    console.log(`   📨 رسائل غير مرسلة: ${stats.unsentMessages}`);
  }

  // بدء النظام
  async start() {
    console.log('🔧 نظام الإصلاح التلقائي...');
    console.log('=' .repeat(40));
    
    // فحص أولي
    await this.periodicSystemCheck();
    
    // فحص دوري كل ساعة
    setInterval(() => {
      this.periodicSystemCheck();
    }, 3600000); // كل ساعة

    console.log('✅ نظام الإصلاح التلقائي نشط');
  }
}

// تصدير النظام للاستخدام
const autoFix = new AutoFixSystem();
autoFix.start();

export default AutoFixSystem;
