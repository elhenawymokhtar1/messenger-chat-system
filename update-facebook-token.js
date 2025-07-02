import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateFacebookToken() {
  console.log('🔑 تحديث Facebook Access Token...');
  console.log('=' .repeat(50));
  
  // ضع الـ Access Token الجديد هنا
  const newAccessToken = 'ضع_الـ_Access_Token_الجديد_هنا';
  
  if (newAccessToken === 'ضع_الـ_Access_Token_الجديد_هنا') {
    console.log('❌ يرجى وضع Access Token الجديد في المتغير newAccessToken');
    console.log('🌐 احصل على Token جديد من: https://developers.facebook.com/tools/explorer/');
    return;
  }
  
  try {
    // تحديث الـ Access Token
    const { data, error } = await supabase
      .from('facebook_settings')
      .update({
        access_token: newAccessToken,
        updated_at: new Date().toISOString()
      })
      .eq('page_id', '351400718067673')
      .select();
    
    if (error) {
      console.error('❌ خطأ في تحديث Access Token:', error);
      return;
    }
    
    console.log('✅ تم تحديث Access Token بنجاح!');
    console.log('📄 الصفحة:', data[0].page_name);
    console.log('🆔 معرف الصفحة:', data[0].page_id);
    console.log('⏰ وقت التحديث:', new Date(data[0].updated_at).toLocaleString('ar-EG'));
    
    // اختبار الـ Token الجديد
    console.log('\n🧪 اختبار Access Token الجديد...');
    
    const testResponse = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${newAccessToken}`);
    const testResult = await testResponse.json();
    
    if (testResult.error) {
      console.log('❌ الـ Token غير صحيح:', testResult.error.message);
    } else {
      console.log('✅ الـ Token يعمل بشكل صحيح!');
      console.log('📄 اسم الصفحة:', testResult.name);
      console.log('🆔 معرف الصفحة:', testResult.id);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 تم تحديث Facebook Access Token بنجاح!');
    console.log('📨 الآن يمكن إرسال الرسائل بشكل طبيعي');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث Access Token:', error.message);
  }
}

updateFacebookToken();
