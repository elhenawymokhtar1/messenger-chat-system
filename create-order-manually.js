import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2Zram5haGVzeW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDc2MDYsImV4cCI6MjA2Mzg4MzYwNn0.5jo4tgLAMqwVnYkhUYBa3WrNxann8xBqkNzba8DaCMg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createOrderManually() {
  console.log('📋 إنشاء أوردر يدوياً لمختار الهناوي...');
  console.log('=' .repeat(50));
  
  try {
    // بيانات العميل من المحادثة
    const orderData = {
      conversation_id: '9c3d005a-efb6-444a-9d1a-f719cb42cdd0',
      customer_name: 'مختار الهناوي',
      customer_phone: '01123087745',
      customer_address: 'عمارة 15 الدور 3 شقة 1 بسموحة، شارع النصر، الإسكندرية',
      product_name: 'حذاء كاجوال جلد طبيعي',
      product_size: '45',
      product_color: 'أسود',
      quantity: 1,
      unit_price: 420,
      shipping_cost: 50,
      total_price: 470,
      status: 'pending',
      notes: 'طلب من خلال Gemini AI - Facebook Messenger',
      company_id: 'a7854ed7-f421-485b-87b4-7829fddf82c3'
    };
    
    // توليد رقم أوردر فريد (أقصر)
    const orderNumber = `ORD-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    orderData.order_number = orderNumber;
    
    console.log('📝 بيانات الأوردر:');
    console.log(`   رقم الأوردر: ${orderNumber}`);
    console.log(`   العميل: ${orderData.customer_name}`);
    console.log(`   الهاتف: ${orderData.customer_phone}`);
    console.log(`   العنوان: ${orderData.customer_address}`);
    console.log(`   المنتج: ${orderData.product_name}`);
    console.log(`   المقاس: ${orderData.product_size}`);
    console.log(`   اللون: ${orderData.product_color}`);
    console.log(`   السعر: ${orderData.unit_price} جنيه`);
    console.log(`   الشحن: ${orderData.shipping_cost} جنيه`);
    console.log(`   الإجمالي: ${orderData.total_price} جنيه`);
    
    // إنشاء الأوردر في قاعدة البيانات
    console.log('\n💾 إنشاء الأوردر في قاعدة البيانات...');
    
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ خطأ في إنشاء الأوردر:', orderError);
      return;
    }
    
    console.log('✅ تم إنشاء الأوردر بنجاح!');
    console.log(`📋 معرف الأوردر: ${newOrder.id}`);
    
    // إرسال رسالة تأكيد للعميل
    console.log('\n📨 إرسال رسالة تأكيد للعميل...');
    
    const confirmationMessage = `🎉 تم إنشاء طلبك بنجاح!

📋 تفاصيل الطلب:
🔢 رقم الطلب: ${orderNumber}
👤 الاسم: ${orderData.customer_name}
📱 الهاتف: ${orderData.customer_phone}
📍 العنوان: ${orderData.customer_address}

👟 المنتج: ${orderData.product_name}
📏 المقاس: ${orderData.product_size}
🎨 اللون: ${orderData.product_color}
💰 السعر: ${orderData.unit_price} جنيه
🚚 الشحن: ${orderData.shipping_cost} جنيه
💳 الإجمالي: ${orderData.total_price} جنيه

✅ سيتم التواصل معك خلال 24 ساعة لتأكيد الطلب وترتيب التوصيل.

شكراً لثقتك بنا! 🙏`;

    // جلب إعدادات Facebook للإرسال
    const { data: pageSettings, error: pageError } = await supabase
      .from('facebook_settings')
      .select('access_token, page_name')
      .eq('page_id', '351400718067673')
      .single();
    
    if (pageError || !pageSettings) {
      console.error('❌ لم يتم العثور على إعدادات Facebook');
      return;
    }
    
    // إرسال رسالة التأكيد
    const messagePayload = {
      recipient: { id: '30517453841172195' },
      message: { text: confirmationMessage }
    };
    
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
    } else {
      console.log(`✅ تم إرسال رسالة التأكيد بنجاح: ${result.message_id}`);
      
      // حفظ رسالة التأكيد في قاعدة البيانات
      await supabase.from('messages').insert({
        conversation_id: orderData.conversation_id,
        content: confirmationMessage,
        sender_type: 'bot',
        is_read: true,
        is_auto_reply: true,
        is_ai_generated: false,
        facebook_message_id: result.message_id
      });
      
      console.log('📝 تم حفظ رسالة التأكيد في قاعدة البيانات');
    }
    
    // تحديث حالة المحادثة
    await supabase
      .from('conversations')
      .update({ 
        customer_phone: orderData.customer_phone,
        last_message: 'تم إنشاء طلب جديد',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderData.conversation_id);
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 تم إنشاء الأوردر وإرسال التأكيد بنجاح!');
    console.log(`📋 رقم الأوردر: ${orderNumber}`);
    console.log(`💰 المبلغ الإجمالي: ${orderData.total_price} جنيه`);
    console.log(`📱 هاتف العميل: ${orderData.customer_phone}`);
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الأوردر:', error.message);
  }
}

createOrderManually();
