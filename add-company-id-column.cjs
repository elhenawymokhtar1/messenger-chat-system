/**
 * إضافة عمود company_id إلى جدول facebook_settings
 * تاريخ الإنشاء: 24 يونيو 2025
 */

const { createClient } = require('@supabase/supabase-js');

// إعدادات Supabase - يجب تحديثها بالقيم الصحيحة
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addCompanyIdColumn() {
  try {
    console.log('🚀 بدء إضافة عمود company_id...');

    // التحقق من وجود العمود أولاً
    console.log('🔍 التحقق من وجود العمود...');
    
    // محاولة إضافة العمود (سيتم تجاهلها إذا كان موجوداً)
    const alterTableSQL = `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'facebook_settings' 
          AND column_name = 'company_id'
        ) THEN
          ALTER TABLE facebook_settings 
          ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
          
          CREATE INDEX IF NOT EXISTS idx_facebook_settings_company_id 
          ON facebook_settings(company_id);
          
          RAISE NOTICE 'تم إضافة عمود company_id بنجاح';
        ELSE
          RAISE NOTICE 'عمود company_id موجود بالفعل';
        END IF;
      END $$;
    `;

    // تشغيل SQL باستخدام RPC (إذا كان متاحاً)
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: alterTableSQL
      });

      if (error) {
        console.log('⚠️ RPC غير متاح، محاولة طريقة أخرى...');
        throw error;
      }

      console.log('✅ تم تشغيل SQL بنجاح عبر RPC');
      console.log('📊 النتيجة:', data);

    } catch (rpcError) {
      console.log('⚠️ RPC غير متاح، سيتم إضافة العمود يدوياً في قاعدة البيانات');
      console.log('📝 يرجى تشغيل هذا SQL في Supabase Dashboard:');
      console.log('');
      console.log('-- إضافة عمود company_id');
      console.log('ALTER TABLE facebook_settings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;');
      console.log('');
      console.log('-- إنشاء فهرس');
      console.log('CREATE INDEX IF NOT EXISTS idx_facebook_settings_company_id ON facebook_settings(company_id);');
      console.log('');
    }

    // التحقق من الجداول الموجودة
    console.log('📋 التحقق من الجداول الموجودة...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['companies', 'facebook_settings']);

    if (tablesError) {
      console.error('❌ خطأ في جلب الجداول:', tablesError);
    } else {
      console.log('📊 الجداول الموجودة:', tables?.map(t => t.table_name));
    }

    console.log('');
    console.log('✅ انتهت العملية!');
    console.log('💡 ملاحظة: إذا لم يتم إضافة العمود تلقائياً، يرجى تشغيل SQL المذكور أعلاه في Supabase Dashboard');

  } catch (error) {
    console.error('❌ خطأ عام:', error);
    console.log('');
    console.log('🔧 حل بديل:');
    console.log('1. اذهب إلى Supabase Dashboard');
    console.log('2. افتح SQL Editor');
    console.log('3. شغل هذا الكود:');
    console.log('');
    console.log('ALTER TABLE facebook_settings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;');
    console.log('CREATE INDEX IF NOT EXISTS idx_facebook_settings_company_id ON facebook_settings(company_id);');
  }
}

// تشغيل الدالة
addCompanyIdColumn();
