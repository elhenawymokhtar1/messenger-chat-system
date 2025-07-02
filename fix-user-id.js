import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserIds() {
  console.log('🔧 إصلاح معرفات المستخدمين...');
  console.log('=' .repeat(50));
  
  try {
    // 1. البحث عن المحادثات بدون معرف مستخدم
    console.log('🔍 البحث عن المحادثات بدون معرف مستخدم...');
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .or('user_id.is.null,user_id.eq.');
    
    if (convError) {
      console.error('❌ خطأ في جلب المحادثات:', convError);
      return;
    }
    
    console.log(`📊 محادثات بدون معرف مستخدم: ${conversations?.length || 0}`);
    
    if (!conversations || conversations.length === 0) {
      console.log('✅ جميع المحادثات لديها معرف مستخدم');
      return;
    }
    
    // 2. إصلاح كل محادثة
    let fixedCount = 0;
    
    for (const conversation of conversations) {
      console.log(`\n🔧 إصلاح المحادثة: ${conversation.customer_name || 'غير محدد'}`);
      console.log(`   معرف المحادثة: ${conversation.id}`);
      
      // البحث عن رسائل العميل في هذه المحادثة
      const { data: customerMessages, error: msgError } = await supabase
        .from('messages')
        .select('sender_id, content, created_at')
        .eq('conversation_id', conversation.id)
        .eq('sender_type', 'customer')
        .not('sender_id', 'is', null)
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (msgError) {
        console.error(`   ❌ خطأ في جلب رسائل العميل:`, msgError);
        continue;
      }
      
      if (!customerMessages || customerMessages.length === 0) {
        console.log(`   ⚠️ لم يتم العثور على رسائل عميل بمعرف صحيح`);
        
        // البحث في جميع الرسائل
        const { data: allMessages, error: allMsgError } = await supabase
          .from('messages')
          .select('sender_id, sender_type, content')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });
        
        if (allMessages) {
          console.log(`   📋 جميع رسائل المحادثة:`);
          allMessages.forEach((msg, index) => {
            console.log(`     ${index + 1}. ${msg.sender_type}: ${msg.sender_id || 'غير محدد'} - ${msg.content?.substring(0, 30)}...`);
          });
        }
        continue;
      }
      
      const userId = customerMessages[0].sender_id;
      console.log(`   ✅ تم العثور على معرف المستخدم: ${userId}`);
      
      // تحديث المحادثة بمعرف المستخدم
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ 
          user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);
      
      if (updateError) {
        console.error(`   ❌ خطأ في تحديث المحادثة:`, updateError);
      } else {
        console.log(`   ✅ تم تحديث معرف المستخدم بنجاح`);
        fixedCount++;
      }
    }
    
    console.log(`\n📊 النتائج:`);
    console.log(`✅ تم إصلاح ${fixedCount} محادثة`);
    console.log(`⚠️ لم يتم إصلاح ${conversations.length - fixedCount} محادثة`);
    
    // 3. اختبار إرسال رسالة للمحادثات المُصلحة
    if (fixedCount > 0) {
      console.log(`\n🧪 اختبار إرسال رسائل للمحادثات المُصلحة...`);
      
      const { data: fixedConversations, error: fixedError } = await supabase
        .from('conversations')
        .select('*')
        .not('user_id', 'is', null)
        .limit(3);
      
      if (fixedConversations) {
        for (const conv of fixedConversations) {
          await testSendToConversation(conv);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح معرفات المستخدمين:', error.message);
  }
}

async function testSendToConversation(conversation) {
  console.log(`\n🧪 اختبار إرسال لـ: ${conversation.customer_name}`);
  
  try {
    // جلب إعدادات Facebook للصفحة
    const { data: pageSettings, error: pageError } = await supabase
      .from('facebook_settings')
      .select('access_token, page_name')
      .eq('page_id', conversation.page_id)
      .single();
    
    if (pageError || !pageSettings) {
      console.log(`   ❌ لم يتم العثور على إعدادات الصفحة`);
      return;
    }
    
    // إرسال رسالة اختبار
    const testMessage = {
      recipient: { id: conversation.user_id },
      message: { 
        text: `🎉 تم إصلاح النظام! الآن يمكن لـ Gemini AI إرسال الرسائل بشكل طبيعي.\n\nوقت الاختبار: ${new Date().toLocaleTimeString('ar-EG')}` 
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
      console.log(`   ❌ فشل الإرسال: ${data.error.message} (كود: ${data.error.code})`);
    } else {
      console.log(`   ✅ تم الإرسال بنجاح! معرف الرسالة: ${data.message_id}`);
    }
    
  } catch (error) {
    console.log(`   ❌ خطأ في الاختبار: ${error.message}`);
  }
}

fixUserIds();
