import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

let lastCheckedTime = new Date().toISOString();

async function instantBotSender() {
  console.log('⚡ نظام الإرسال الفوري لرسائل Gemini AI...');
  console.log('=' .repeat(50));
  
  try {
    // البحث عن رسائل البوت الجديدة فقط (بعد آخر فحص)
    const { data: newMessages, error: newError } = await supabase
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
      .gte('created_at', lastCheckedTime)
      .order('created_at', { ascending: true });
    
    if (newError) {
      console.error('❌ خطأ في جلب الرسائل الجديدة:', newError);
      return;
    }
    
    if (!newMessages || newMessages.length === 0) {
      // لا توجد رسائل جديدة - فحص صامت
      return;
    }
    
    console.log(`⚡ رسائل جديدة للإرسال: ${newMessages.length}`);
    
    let sentCount = 0;
    
    for (const message of newMessages) {
      const conversation = message.conversations;
      
      console.log(`\n📨 إرسال فوري: ${message.content?.substring(0, 50)}...`);
      console.log(`   العميل: ${conversation?.customer_name}`);
      console.log(`   الوقت: ${message.created_at}`);
      
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
      
      // إرسال الرسالة فوراً
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
        } else {
          console.log(`   ⚡ تم الإرسال فوراً: ${result.message_id}`);
          
          // تحديث الرسالة بمعرف Facebook
          const { error: updateError } = await supabase
            .from('messages')
            .update({ facebook_message_id: result.message_id })
            .eq('id', message.id);
          
          if (updateError) {
            console.log(`   ⚠️ خطأ في تحديث قاعدة البيانات: ${updateError.message}`);
          } else {
            console.log(`   ✅ تم تحديث قاعدة البيانات`);
            sentCount++;
          }
        }
        
      } catch (sendError) {
        console.log(`   ❌ خطأ في الإرسال: ${sendError.message}`);
      }
    }
    
    // تحديث وقت آخر فحص
    lastCheckedTime = new Date().toISOString();
    
    if (sentCount > 0) {
      console.log(`\n⚡ تم إرسال ${sentCount} رسالة فوراً!`);
    }
    
  } catch (error) {
    console.error('❌ خطأ في النظام الفوري:', error.message);
  }
}

// إرسال الرسائل المتراكمة أولاً
async function sendBacklogMessages() {
  console.log('🔄 إرسال الرسائل المتراكمة أولاً...');
  
  const { data: backlogMessages, error: backlogError } = await supabase
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
    .order('created_at', { ascending: true })
    .limit(5); // آخر 5 رسائل فقط
  
  if (backlogMessages && backlogMessages.length > 0) {
    console.log(`📊 رسائل متراكمة: ${backlogMessages.length}`);
    
    for (const message of backlogMessages) {
      const conversation = message.conversations;
      const pageId = conversation?.page_id || conversation?.facebook_page_id;
      const userId = conversation?.customer_facebook_id;
      
      if (!pageId || !userId) continue;
      
      const { data: pageSettings } = await supabase
        .from('facebook_settings')
        .select('access_token, page_name, is_active')
        .eq('page_id', pageId)
        .single();
      
      if (!pageSettings || !pageSettings.is_active) continue;
      
      try {
        const messageToSend = {
          recipient: { id: userId },
          message: { text: message.content }
        };
        
        const response = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageSettings.access_token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageToSend)
        });
        
        const result = await response.json();
        
        if (!result.error) {
          await supabase
            .from('messages')
            .update({ facebook_message_id: result.message_id })
            .eq('id', message.id);
          
          console.log(`✅ تم إرسال رسالة متراكمة: ${message.content?.substring(0, 30)}...`);
        }
        
      } catch (error) {
        // تجاهل الأخطاء للرسائل المتراكمة
      }
      
      // تأخير قصير بين الرسائل المتراكمة
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('✅ انتهى إرسال الرسائل المتراكمة');
}

// بدء النظام
async function startInstantSystem() {
  console.log('🚀 بدء نظام الإرسال الفوري...');
  
  // إرسال الرسائل المتراكمة أولاً
  await sendBacklogMessages();
  
  console.log('\n⚡ النظام الفوري نشط الآن - فحص كل 3 ثوان');
  console.log('💡 الرسائل الجديدة ستُرسل خلال 3 ثوان من إنشائها');
  console.log('💡 اضغط Ctrl+C لإيقاف النظام\n');
  
  // فحص كل 3 ثوان للرسائل الجديدة
  setInterval(instantBotSender, 3000);
}

startInstantSystem();
