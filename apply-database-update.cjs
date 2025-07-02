/**
 * تطبيق تحديث قاعدة البيانات لإضافة company_id
 * تاريخ الإنشاء: 24 يونيو 2025
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// إعدادات Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyDatabaseUpdate() {
  try {
    console.log('🚀 بدء تطبيق تحديث قاعدة البيانات...');
    
    // 1. التحقق من وجود جدول companies
    console.log('🔍 التحقق من جدول companies...');
    const { data: companiesTable, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (companiesError) {
      console.error('❌ جدول companies غير موجود:', companiesError.message);
      console.log('💡 يجب إنشاء جدول companies أولاً');
      return;
    }
    
    console.log('✅ جدول companies موجود');
    
    // 2. التحقق من وجود عمود company_id
    console.log('🔍 التحقق من عمود company_id...');
    
    try {
      // محاولة إضافة العمود (سيتم تجاهلها إذا كان موجوداً)
      const alterSQL = `
        DO $$ 
        BEGIN
          -- إضافة عمود company_id إذا لم يكن موجوداً
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'facebook_settings' 
            AND column_name = 'company_id'
          ) THEN
            ALTER TABLE facebook_settings 
            ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'تم إضافة عمود company_id';
          ELSE
            RAISE NOTICE 'عمود company_id موجود بالفعل';
          END IF;
          
          -- إنشاء فهرس إذا لم يكن موجوداً
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_facebook_settings_company_id'
          ) THEN
            CREATE INDEX idx_facebook_settings_company_id ON facebook_settings(company_id);
            RAISE NOTICE 'تم إنشاء فهرس company_id';
          ELSE
            RAISE NOTICE 'فهرس company_id موجود بالفعل';
          END IF;
        END $$;
      `;
      
      // تشغيل SQL (إذا كان RPC متاحاً)
      const { data, error } = await supabase.rpc('exec_sql', { sql: alterSQL });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ تم تطبيق التحديث بنجاح');
      
    } catch (rpcError) {
      console.log('⚠️ RPC غير متاح، يرجى تطبيق التحديث يدوياً');
      console.log('📝 SQL المطلوب:');
      console.log('');
      console.log('-- إضافة عمود company_id');
      console.log('ALTER TABLE facebook_settings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;');
      console.log('');
      console.log('-- إنشاء فهرس');
      console.log('CREATE INDEX IF NOT EXISTS idx_facebook_settings_company_id ON facebook_settings(company_id);');
      console.log('');
    }
    
    // 3. التحقق من النتيجة
    console.log('🔍 التحقق من النتيجة...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'facebook_settings')
      .eq('column_name', 'company_id');
    
    if (columnsError) {
      console.log('⚠️ لا يمكن التحقق من العمود:', columnsError.message);
    } else if (columns && columns.length > 0) {
      console.log('✅ عمود company_id موجود:', columns[0]);
    } else {
      console.log('❌ عمود company_id غير موجود');
    }
    
    // 4. عرض الصفحات الحالية
    console.log('📊 الصفحات الحالية:');
    const { data: pages, error: pagesError } = await supabase
      .from('facebook_settings')
      .select('id, page_id, page_name, company_id');
    
    if (pagesError) {
      console.error('❌ خطأ في جلب الصفحات:', pagesError.message);
    } else {
      console.table(pages);
      
      const pagesWithoutCompany = pages?.filter(p => !p.company_id) || [];
      if (pagesWithoutCompany.length > 0) {
        console.log(`⚠️ يوجد ${pagesWithoutCompany.length} صفحة بدون company_id`);
        console.log('💡 يمكنك ربطها بشركات محددة لاحقاً');
      }
    }
    
    console.log('');
    console.log('🎉 انتهى تطبيق التحديث!');
    
  } catch (error) {
    console.error('❌ خطأ عام:', error);
    console.log('');
    console.log('🔧 حل بديل:');
    console.log('1. اذهب إلى Supabase Dashboard');
    console.log('2. افتح SQL Editor');
    console.log('3. شغل محتوى ملف update-database-schema.sql');
  }
}

// تشغيل التحديث
applyDatabaseUpdate();
