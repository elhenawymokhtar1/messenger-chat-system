// نظام مراقبة Facebook Tokens
// يجب تشغيله يومياً للتحقق من صحة جميع الـ Tokens

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

class TokenMonitor {
  
  async checkAllTokens() {
    console.log('🔍 مراقبة Facebook Tokens...');
    console.log('التاريخ:', new Date().toLocaleString('ar-EG'));
    console.log('=' .repeat(50));
    
    const { data: pages, error } = await supabase
      .from('facebook_settings')
      .select(`
        id,
        page_id,
        page_name,
        access_token,
        is_active,
        companies(name, email)
      `);
    
    if (error) {
      console.error('❌ خطأ في جلب الصفحات:', error);
      return;
    }
    
    const report = {
      total: pages.length,
      valid: 0,
      invalid: 0,
      expired_tokens: []
    };
    
    for (const page of pages) {
      const result = await this.checkSingleToken(page);
      
      if (result.valid) {
        report.valid++;
        console.log(`✅ ${page.page_name} (${page.companies?.name})`);
      } else {
        report.invalid++;
        report.expired_tokens.push({
          page_name: page.page_name,
          company_name: page.companies?.name,
          company_email: page.companies?.email,
          error: result.error
        });
        console.log(`❌ ${page.page_name} (${page.companies?.name})`);
        console.log(`   خطأ: ${result.error?.message}`);
        
        // تحديث حالة الصفحة في قاعدة البيانات
        await this.markTokenAsExpired(page.id);
      }
    }
    
    // تقرير نهائي
    console.log('\n' + '=' .repeat(50));
    console.log('📊 تقرير المراقبة:');
    console.log(`✅ Tokens صحيحة: ${report.valid}/${report.total}`);
    console.log(`❌ Tokens منتهية: ${report.invalid}/${report.total}`);
    
    if (report.invalid > 0) {
      console.log('\n⚠️ الشركات التي تحتاج تجديد Token:');
      report.expired_tokens.forEach((token, index) => {
        console.log(`${index + 1}. ${token.company_name} - ${token.page_name}`);
        console.log(`   البريد: ${token.company_email}`);
      });
      
      console.log('\n📧 يُنصح بإرسال تنبيه للشركات المتأثرة');
    }
    
    return report;
  }
  
  async checkSingleToken(page) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${page.access_token}`);
      const data = await response.json();
      
      if (data.error) {
        return { valid: false, error: data.error };
      }
      
      return { valid: true, data };
      
    } catch (error) {
      return { valid: false, error: { message: error.message } };
    }
  }
  
  async markTokenAsExpired(pageId) {
    try {
      await supabase
        .from('facebook_settings')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', pageId);
    } catch (error) {
      console.error('خطأ في تحديث حالة الصفحة:', error);
    }
  }
  
  // إنشاء تقرير يومي
  async generateDailyReport() {
    const report = await this.checkAllTokens();
    
    // حفظ التقرير في قاعدة البيانات (اختياري)
    try {
      await supabase
        .from('system_reports')
        .insert({
          report_type: 'token_monitor',
          report_date: new Date().toISOString().split('T')[0],
          report_data: report,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      // إذا لم يكن جدول التقارير موجود، لا مشكلة
      console.log('ملاحظة: لم يتم حفظ التقرير في قاعدة البيانات');
    }
    
    return report;
  }
}

// تشغيل المراقبة
const monitor = new TokenMonitor();
monitor.generateDailyReport();

export default TokenMonitor;
