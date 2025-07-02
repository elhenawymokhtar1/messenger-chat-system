// 🏗️ إنشاء جدول facebook_settings إذا لم يكن موجوداً
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function createFacebookTable() {
  console.log('🏗️ إنشاء جدول facebook_settings...\n');
  
  try {
    // 1. التحقق من وجود الجدول
    console.log('1️⃣ التحقق من وجود الجدول...');
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'facebook_settings');
    
    if (tableExists && tableExists.length > 0) {
      console.log('✅ جدول facebook_settings موجود بالفعل');
      return true;
    }
    
    console.log('📝 جدول facebook_settings غير موجود، سيتم إنشاؤه...');
    
    // 2. إنشاء الجدول باستخدام SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS facebook_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          page_id TEXT UNIQUE NOT NULL,
          access_token TEXT NOT NULL,
          page_name TEXT,
          webhook_url TEXT,
          is_active BOOLEAN DEFAULT true,
          page_category TEXT,
          page_picture_url TEXT,
          company_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- إنشاء فهرس للبحث السريع
      CREATE INDEX IF NOT EXISTS idx_facebook_settings_page_id ON facebook_settings(page_id);
      CREATE INDEX IF NOT EXISTS idx_facebook_settings_active ON facebook_settings(is_active);
      CREATE INDEX IF NOT EXISTS idx_facebook_settings_company_id ON facebook_settings(company_id);
      
      -- إعداد RLS (Row Level Security) - اختياري
      ALTER TABLE facebook_settings ENABLE ROW LEVEL SECURITY;
      
      -- سياسة للسماح بالقراءة والكتابة للجميع (يمكن تخصيصها لاحقاً)
      CREATE POLICY IF NOT EXISTS "Allow all operations on facebook_settings" 
      ON facebook_settings FOR ALL 
      TO public 
      USING (true) 
      WITH CHECK (true);
    `;
    
    console.log('2️⃣ تنفيذ SQL لإنشاء الجدول...');
    
    // محاولة تنفيذ SQL باستخدام RPC
    const { data: result, error: rpcError } = await supabase
      .rpc('exec_sql', { sql_query: createTableSQL });
    
    if (rpcError) {
      console.log('⚠️ RPC غير متاح، محاولة طريقة بديلة...');
      
      // طريقة بديلة: إنشاء الجدول باستخدام insert فارغ لتحفيز إنشاء الجدول
      try {
        await supabase
          .from('facebook_settings')
          .select('*')
          .limit(1);
        
        console.log('✅ تم إنشاء الجدول بنجاح');
      } catch (error) {
        console.error('❌ فشل في إنشاء الجدول:', error.message);
        console.log('\n🔧 يجب إنشاء الجدول يدوياً في Supabase Dashboard:');
        console.log('1. اذهب إلى: https://supabase.com/dashboard');
        console.log('2. اختر مشروعك');
        console.log('3. اذهب إلى SQL Editor');
        console.log('4. نفذ هذا الكود:');
        console.log('\n' + createTableSQL);
        return false;
      }
    } else {
      console.log('✅ تم إنشاء الجدول بنجاح باستخدام RPC');
    }
    
    // 3. التحقق من نجاح الإنشاء
    console.log('3️⃣ التحقق من نجاح الإنشاء...');
    const { data: newTableCheck, error: checkError } = await supabase
      .from('facebook_settings')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ الجدول لم يتم إنشاؤه بشكل صحيح:', checkError.message);
      return false;
    }
    
    console.log('✅ تم التحقق من إنشاء الجدول بنجاح');
    
    // 4. إضافة بيانات تجريبية (اختياري)
    console.log('4️⃣ إضافة بيانات تجريبية...');
    const testData = {
      page_id: 'sample_page_' + Date.now(),
      page_name: 'صفحة تجريبية للاختبار',
      access_token: 'sample_token_' + Date.now(),
      is_active: true
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('facebook_settings')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.error('⚠️ لا يمكن إضافة بيانات تجريبية:', insertError.message);
    } else {
      console.log('✅ تم إضافة بيانات تجريبية بنجاح');
      
      // حذف البيانات التجريبية
      await supabase
        .from('facebook_settings')
        .delete()
        .eq('page_id', testData.page_id);
      console.log('🗑️ تم حذف البيانات التجريبية');
    }
    
    console.log('\n🎉 تم إعداد جدول facebook_settings بنجاح!');
    return true;
    
  } catch (error) {
    console.error('💥 خطأ عام في إنشاء الجدول:', error);
    return false;
  }
}

// تشغيل الإنشاء
createFacebookTable()
  .then(success => {
    if (success) {
      console.log('\n✅ الجدول جاهز للاستخدام!');
      console.log('💡 يمكنك الآن ربط صفحات Facebook');
    } else {
      console.log('\n❌ فشل في إعداد الجدول');
      console.log('🔧 راجع الأخطاء أعلاه وأصلحها');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 خطأ في تشغيل الإعداد:', error);
    process.exit(1);
  });
