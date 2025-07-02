import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function autoSendBotMessages() {
  console.log('🤖 نظام الإرسال التلقائي لرسائل البوت...');
  console.log('=' .repeat(50));
  
  try {
    // البحث عن رسائل البوت بدون معرف Facebook
    const { data: unsentMessages, error: unsentError } = await supabase
      .from('messages')
      .select(`
        *,
        conversations(
          customer_name,
          customer_facebook_id,
          page_id,
          facebook_page_id,
          company_id
        )
      `)
      .eq('sender_type', 'bot')
      .is('facebook_message_id', null)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (unsentError) {
      console.error('❌ خطأ في جلب الرسائل غير المرسلة:', unsentError);
      return;
    }
    
    console.log(`📊 رسائل البوت غير المرسلة: ${unsentMessages?.length || 0}`);
    
    if (!unsentMessages || unsentMessages.length === 0) {
      console.log('✅ جميع رسائل البوت تم إرسالها');
      return;
    }
    
    let sentCount = 0;
    
    for (const message of unsentMessages) {
      const conversation = message.conversations;
      
      console.log(`\n📨 معالجة رسالة: ${message.content?.substring(0, 50)}...`);
      console.log(`   العميل: ${conversation?.customer_name}`);
      console.log(`   التاريخ: ${message.created_at}`);
      
      const pageId = conversation?.page_id || conversation?.facebook_page_id;
      const userId = conversation?.customer_facebook_id;
      
      if (!pageId || !userId) {
        console.log('   ⚠️ معلومات الإرسال غير مكتملة');
        continue;
      }
      
      // جلب إعدادات Facebook
      const { data: pageSettings, error: pageError } = await supabase
        .from('facebook_settings')
        .select('access_token, page_name, is_active')
        .eq('page_id', pageId)
        .single();
      
      if (pageError || !pageSettings || !pageSettings.is_active) {
        console.log('   ❌ إعدادات الصفحة غير متاحة');
        continue;
      }
      
      console.log(`   📄 الصفحة: ${pageSettings.page_name}`);
      
      // إرسال الرسالة
      try {
        const messageToSend = {
          recipient: { id: userId },
          message: { text: message.content }
        };
        
        const response = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageSettings.access_token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageToSend)
        });
        
        const result = await response.json();
        
        if (result.error) {
          console.log(`   ❌ فشل الإرسال: ${result.error.message} (كود: ${result.error.code})`);
          
          // تحليل أسباب الفشل
          if (result.error.code === 10) {
            console.log(`   💡 السبب: المستخدم لم يرسل رسالة خلال آخر 24 ساعة`);
          } else if (result.error.code === 190) {
            console.log(`   💡 السبب: Token منتهي الصلاحية`);
          }
        } else {
          console.log(`   ✅ تم الإرسال بنجاح: ${result.message_id}`);
          
          // تحديث الرسالة بمعرف Facebook
          const { error: updateError } = await supabase
            .from('messages')
            .update({ facebook_message_id: result.message_id })
            .eq('id', message.id);
          
          if (updateError) {
            console.log(`   ⚠️ خطأ في تحديث قاعدة البيانات: ${updateError.message}`);
          } else {
            console.log(`   📝 تم تحديث قاعدة البيانات`);
            sentCount++;
          }
        }
        
      } catch (sendError) {
        console.log(`   ❌ خطأ في الإرسال: ${sendError.message}`);
      }
      
      // تأخير قصير بين الرسائل
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 النتائج:`);
    console.log(`✅ تم إرسال ${sentCount} رسالة بنجاح`);
    console.log(`⚠️ لم يتم إرسال ${unsentMessages.length - sentCount} رسالة`);
    
    if (sentCount > 0) {
      console.log('\n🎉 تم إصلاح مشكلة رسائل Gemini AI!');
      console.log('✅ الرسائل المتراكمة تم إرسالها للعملاء');
      console.log('✅ النظام جاهز للاستخدام');
    }
    
  } catch (error) {
    console.error('❌ خطأ في النظام التلقائي:', error.message);
  }
}

// تشغيل النظام
autoSendBotMessages();

// تشغيل النظام كل دقيقة للرسائل الجديدة
setInterval(() => {
  console.log('\n🔄 فحص دوري للرسائل الجديدة...');
  autoSendBotMessages();
}, 60000); // كل دقيقة

console.log('\n🚀 نظام الإرسال التلقائي يعمل الآن...');
console.log('💡 سيتم فحص الرسائل الجديدة كل دقيقة');
console.log('💡 اضغط Ctrl+C لإيقاف النظام');
