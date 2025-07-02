/**
 * تشغيل migration لإضافة company_id إلى جدول facebook_settings
 * تاريخ الإنشاء: 24 يونيو 2025
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// إعدادات Supabase
const SUPABASE_URL = 'https://ixqjqfkpqhqjqfkpqhqj.supabase.co'; // استبدل بـ URL الخاص بك
const SUPABASE_SERVICE_KEY = 'your-service-key'; // استبدل بـ Service Key الخاص بك

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  try {
    console.log('🚀 بدء تشغيل Migration...');

    // قراءة ملف SQL
    const migrationPath = path.join(process.cwd(), 'database', 'add-company-id-to-facebook-settings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 تم قراءة ملف Migration');

    // تشغيل SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ خطأ في تشغيل Migration:', error);
      return;
    }

    console.log('✅ تم تشغيل Migration بنجاح!');
    console.log('📊 النتيجة:', data);

    // التحقق من إضافة العمود
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'facebook_settings')
      .eq('column_name', 'company_id');

    if (checkError) {
      console.error('❌ خطأ في التحقق من العمود:', checkError);
      return;
    }

    if (columns && columns.length > 0) {
      console.log('✅ تم إضافة عمود company_id بنجاح!');
    } else {
      console.log('⚠️ لم يتم العثور على عمود company_id');
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل Migration إذا تم استدعاء الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration };
