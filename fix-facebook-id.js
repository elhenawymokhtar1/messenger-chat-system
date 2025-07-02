import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFacebookIds() {
  console.log('🔧 إصلاح معرفات Facebook للمستخدمين...');
  console.log('=' .repeat(50));
  
  try {
    // 1. فحص المحادثات الحالية
    console.log('🔍 فحص المحادثات الحالية...');
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (convError) {
      console.error('❌ خطأ في جلب المحادثات:', convError);
      return;
    }
    
    console.log(`📊 إجمالي المحادثات: ${conversations?.length || 0}`);
    
    if (!conversations || conversations.length === 0) {
      console.log('⚠️ لا توجد محادثات');
      return;
    }
    
    // 2. فحص كل محادثة
    for (const conversation of conversations) {
      console.log(`\n📋 المحادثة: ${conversation.customer_name || 'غير محدد'}`);
      console.log(`   معرف المحادثة: ${conversation.id}`);
      console.log(`   معرف Facebook: ${conversation.customer_facebook_id || 'غير محدد'}`);
      console.log(`   الصفحة: ${conversation.page_id || conversation.facebook_page_id}`);
      
      const userId = conversation.customer_facebook_id;
      const pageId = conversation.page_id || conversation.facebook_page_id;
      
      if (!userId) {
        console.log(`   ⚠️ معرف Facebook مفقود - البحث في الرسائل...`);
        
        // البحث عن معرف المستخدم في الرسائل
        const { data: customerMessages, error: msgError } = await supabase
          .from('messages')
          .select('sender_id, content, created_at')
          .eq('conversation_id', conversation.id)
          .eq('sender_type', 'customer')
          .not('sender_id', 'is', null)
          .order('created_at', { ascending: true })
          .limit(1);
        
        if (customerMessages && customerMessages.length > 0) {
          const foundUserId = customerMessages[0].sender_id;
          console.log(`   ✅ تم العثور على معرف المستخدم: ${foundUserId}`);
          
          // تحديث المحادثة
          const { error: updateError } = await supabase
            .from('conversations')
            .update({ 
              customer_facebook_id: foundUserId,
              updated_at: new Date().toISOString()
            })
            .eq('id', conversation.id);
          
          if (updateError) {
            console.error(`   ❌ خطأ في تحديث المحادثة:`, updateError);
          } else {
            console.log(`   ✅ تم تحديث معرف Facebook بنجاح`);
          }
        } else {
          console.log(`   ❌ لم يتم العثور على معرف المستخدم في الرسائل`);
        }
      } else {
        console.log(`   ✅ معرف Facebook موجود`);
        
        // اختبار إرسال رسالة
        if (pageId) {
          await testSendMessage(pageId, userId, conversation.customer_name);
        }
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ انتهى إصلاح معرفات Facebook');
    
  } catch (error) {
    console.error('❌ خطأ في الإصلاح:', error.message);
  }
}

async function testSendMessage(pageId, userId, customerName) {
  console.log(`   🧪 اختبار إرسال رسالة...`);
  
  try {
    // جلب إعدادات Facebook للصفحة
    const { data: pageSettings, error: pageError } = await supabase
      .from('facebook_settings')
      .select('access_token, page_name')
      .eq('page_id', pageId)
      .single();
    
    if (pageError || !pageSettings) {
      console.log(`   ❌ لم يتم العثور على إعدادات الصفحة`);
      return;
    }
    
    // إرسال رسالة اختبار
    const testMessage = {
      recipient: { id: userId },
      message: { 
        text: `🎉 مرحباً ${customerName}!\n\nتم إصلاح نظام Gemini AI وهو الآن يعمل بشكل طبيعي.\n\nيمكنك الآن إرسال رسائلك وستحصل على ردود فورية! ✨\n\nوقت الاختبار: ${new Date().toLocaleTimeString('ar-EG')}` 
      }
    };
    
    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${pageSettings.access_token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.log(`   ❌ فشل الإرسال: ${data.error.message}`);
      console.log(`   🔑 كود الخطأ: ${data.error.code}`);
      
      if (data.error.code === 10) {
        console.log(`   💡 السبب: المستخدم لم يرسل رسالة خلال آخر 24 ساعة`);
        console.log(`   🔧 الحل: المستخدم يحتاج لإرسال رسالة جديدة أولاً`);
      } else if (data.error.code === 190) {
        console.log(`   💡 السبب: Facebook Token منتهي الصلاحية`);
      }
    } else {
      console.log(`   ✅ تم الإرسال بنجاح! معرف الرسالة: ${data.message_id}`);
      console.log(`   📄 الصفحة: ${pageSettings.page_name}`);
    }
    
  } catch (error) {
    console.log(`   ❌ خطأ في الاختبار: ${error.message}`);
  }
}

fixFacebookIds();
