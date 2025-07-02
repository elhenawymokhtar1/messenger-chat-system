// 🔧 إصلاح اسم الصفحة إذا كان خطأ
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ddwszecfsfkjnahesymm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fixPageName(pageId, newName) {
  console.log(`🔧 تعديل اسم الصفحة ${pageId} إلى: ${newName}`);
  
  try {
    const { data, error } = await supabase
      .from('facebook_settings')
      .update({ 
        page_name: newName,
        updated_at: new Date().toISOString()
      })
      .eq('page_id', pageId)
      .select();
    
    if (error) {
      console.error('❌ خطأ في التعديل:', error.message);
      return false;
    }
    
    console.log('✅ تم تعديل الاسم بنجاح:', data);
    return true;
    
  } catch (error) {
    console.error('💥 خطأ عام:', error);
    return false;
  }
}

// مثال للاستخدام
if (process.argv.length >= 4) {
  const pageId = process.argv[2];
  const newName = process.argv[3];
  
  fixPageName(pageId, newName)
    .then(success => {
      if (success) {
        console.log('🎯 تم التعديل بنجاح!');
      } else {
        console.log('❌ فشل التعديل');
      }
      process.exit(0);
    });
} else {
  console.log('📋 استخدام الأداة:');
  console.log('');
  console.log('node fix-page-name.js [PAGE_ID] [NEW_NAME]');
  console.log('');
  console.log('مثال:');
  console.log('node fix-page-name.js 260345600493273 "الاسم الصحيح للصفحة"');
}
