import fetch from 'node-fetch';

async function setupWebhook() {
  console.log('🔧 إعداد Facebook Webhook...');
  console.log('=' .repeat(60));
  
  const accessToken = 'EAAUpPO0SIEABOz5LAiKQHLRK6ZCRxh5vrdzZAjWCnAD3uMZCg9nWOio7UaPSxbU2Or9Ae3fEL9wa1VIbQG5D99uTQRMcqQLVQu8CqJ0B68wwcQECIAFaNSP4L4Pa29wcYW0GAOM4aB7MUe6vViCc55KLaqlYg5QpBq9xwxZB8OSeWIXJfx1PV0MN8SXC9Bob3oZCtZAQShm6YN8Lo5US8Nuw0LswZDZD';
  const appId = '1452716535717952'; // App ID من Facebook
  
  // URLs للاختبار - استخدم ngrok أو أي tunneling service
  const possibleWebhookUrls = [
    'https://facebook-reply2-1.onrender.com/webhook',
    'https://your-ngrok-url.ngrok.io/webhook', // ضع رابط ngrok هنا
    'http://localhost:3000/webhook' // للاختبار المحلي فقط
  ];
  
  try {
    // 1. اختبار كل URL
    console.log('🌐 1. اختبار Webhook URLs...');
    let workingUrl = null;
    
    for (const url of possibleWebhookUrls) {
      try {
        console.log(`   🔍 اختبار: ${url}`);
        const testResponse = await fetch(url + '?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your_verify_token', {
          method: 'GET',
          timeout: 5000
        });
        
        if (testResponse.ok) {
          const responseText = await testResponse.text();
          console.log(`   ✅ يعمل: ${url} - الرد: ${responseText}`);
          workingUrl = url;
          break;
        } else {
          console.log(`   ❌ لا يعمل: ${url} - الحالة: ${testResponse.status}`);
        }
      } catch (error) {
        console.log(`   ❌ خطأ: ${url} - ${error.message}`);
      }
    }
    
    if (!workingUrl) {
      console.log('\n❌ لم يتم العثور على Webhook URL يعمل!');
      console.log('\n💡 الحلول:');
      console.log('   1. استخدم ngrok: npx ngrok http 3000');
      console.log('   2. أو استخدم خدمة hosting مثل Render/Vercel');
      console.log('   3. أو استخدم localhost tunnel');
      return;
    }
    
    // 2. إعداد الـ Webhook
    console.log(`\n🔧 2. إعداد الـ Webhook باستخدام: ${workingUrl}`);
    
    const webhookSetupUrl = `https://graph.facebook.com/v21.0/${appId}/subscriptions`;
    const webhookData = {
      object: 'page',
      callback_url: workingUrl,
      verify_token: 'your_verify_token',
      fields: 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads'
    };
    
    const setupResponse = await fetch(webhookSetupUrl + `?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });
    
    const setupResult = await setupResponse.json();
    
    if (setupResult.error) {
      console.log('❌ فشل إعداد الـ Webhook:', setupResult.error);
      
      if (setupResult.error.code === 200) {
        console.log('\n💡 المشكلة: نقص صلاحيات');
        console.log('🔧 الحل: اذهب إلى Facebook Developers وأضف الصلاحيات التالية:');
        console.log('   - pages_manage_metadata');
        console.log('   - pages_messaging');
        console.log('   - webhooks');
      }
    } else {
      console.log('✅ تم إعداد الـ Webhook بنجاح!');
      console.log('   📊 النتيجة:', setupResult);
    }
    
    // 3. ربط الصفحة بالـ Webhook
    console.log('\n🔗 3. ربط الصفحة بالـ Webhook...');
    const pageId = '351400718067673';
    
    const subscribeResponse = await fetch(`https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscribed_fields: 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads'
      })
    });
    
    const subscribeResult = await subscribeResponse.json();
    
    if (subscribeResult.error) {
      console.log('❌ فشل ربط الصفحة:', subscribeResult.error);
    } else {
      console.log('✅ تم ربط الصفحة بالـ Webhook بنجاح!');
      console.log('   📊 النتيجة:', subscribeResult);
    }
    
    // 4. اختبار نهائي
    console.log('\n🧪 4. اختبار نهائي...');
    console.log('📨 أرسل رسالة من حساب مختار الآن وراقب الـ logs...');
    
  } catch (error) {
    console.error('❌ خطأ في إعداد الـ Webhook:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 انتهى إعداد الـ Webhook');
}

setupWebhook();
