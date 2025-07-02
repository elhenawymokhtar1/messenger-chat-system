import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function sendOrderConfirmation() {
  console.log('📨 إرسال رسالة تأكيد الأوردر...');
  console.log('=' .repeat(50));
  
  try {
    const confirmationMessage = `🎉 تم إنشاء طلبك بنجاح!

📋 تفاصيل الطلب:
🔢 رقم الطلب: ORD-53KA1ZFL
👤 الاسم: مختار الهناوي
📱 الهاتف: 01123087745
📍 العنوان: عمارة 15 الدور 3 شقة 1 بسموحة، شارع النصر، الإسكندرية

👟 المنتج: حذاء كاجوال جلد طبيعي
📏 المقاس: 45
🎨 اللون: أسود
💰 السعر: 420 جنيه
🚚 الشحن: 50 جنيه
💳 الإجمالي: 470 جنيه

✅ سيتم التواصل معك خلال 24 ساعة لتأكيد الطلب وترتيب التوصيل.

شكراً لثقتك بنا! 🙏`;

    console.log('📝 محتوى الرسالة:');
    console.log(confirmationMessage);
    
    // جلب إعدادات Facebook للإرسال
    const { data: pageSettings, error: pageError } = await supabase
      .from('facebook_settings')
      .select('access_token, page_name')
      .eq('page_id', '351400718067673')
      .single();
    
    if (pageError || !pageSettings) {
      console.error('❌ لم يتم العثور على إعدادات Facebook:', pageError);
      return;
    }
    
    console.log(`📄 الصفحة: ${pageSettings.page_name}`);
    
    // إرسال رسالة التأكيد
    const messagePayload = {
      recipient: { id: '30517453841172195' },
      message: { text: confirmationMessage }
    };
    
    console.log('\n📤 إرسال الرسالة...');
    
    const response = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageSettings.access_token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.log(`❌ فشل إرسال رسالة التأكيد: ${result.error.message}`);
      console.log(`🔑 كود الخطأ: ${result.error.code}`);
    } else {
      console.log(`✅ تم إرسال رسالة التأكيد بنجاح!`);
      console.log(`📨 معرف الرسالة: ${result.message_id}`);
      
      // حفظ رسالة التأكيد في قاعدة البيانات
      const { error: saveError } = await supabase.from('messages').insert({
        conversation_id: '9c3d005a-efb6-444a-9d1a-f719cb42cdd0',
        content: confirmationMessage,
        sender_type: 'bot',
        is_read: true,
        is_auto_reply: true,
        is_ai_generated: false,
        facebook_message_id: result.message_id
      });
      
      if (saveError) {
        console.log('⚠️ خطأ في حفظ الرسالة:', saveError.message);
      } else {
        console.log('📝 تم حفظ رسالة التأكيد في قاعدة البيانات');
      }
    }
    
    // تحديث حالة المحادثة
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ 
        customer_phone: '01123087745',
        last_message: 'تم إنشاء طلب جديد - ORD-53KA1ZFL',
        updated_at: new Date().toISOString()
      })
      .eq('id', '9c3d005a-efb6-444a-9d1a-f719cb42cdd0');
    
    if (updateError) {
      console.log('⚠️ خطأ في تحديث المحادثة:', updateError.message);
    } else {
      console.log('✅ تم تحديث حالة المحادثة');
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 تم إنشاء الأوردر وإرسال التأكيد بنجاح!');
    console.log('📋 رقم الأوردر: ORD-53KA1ZFL');
    console.log('💰 المبلغ الإجمالي: 470 جنيه');
    console.log('📱 هاتف العميل: 01123087745');
    console.log('✅ العميل سيحصل على رسالة التأكيد الآن');
    
  } catch (error) {
    console.error('❌ خطأ في إرسال التأكيد:', error.message);
  }
}

sendOrderConfirmation();
