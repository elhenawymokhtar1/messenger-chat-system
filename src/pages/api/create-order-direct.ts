import { NextApiRequest, NextApiResponse } from 'next';

// استخدام service key للتجاوز RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 [API] إنشاء أوردر مباشر...');
    
    const orderData = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!orderData.order_number || !orderData.customer_name || !orderData.company_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: order_number, customer_name, company_id' 
      });
    }

    // إنشاء الأوردر في جدول ecommerce_orders
    const { data: ecommerceOrder, error: ecommerceError } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API
      .single();

    if (ecommerceError) {
      console.error('❌ [API] خطأ في إنشاء الأوردر في ecommerce_orders:', ecommerceError);
      
      // محاولة إنشاء الأوردر في جدول orders كـ backup
      const { data: backupOrder, error: backupError } = await supabase
        // TODO: Replace with MySQL API
        // TODO: Replace with MySQL API
        // TODO: Replace with MySQL API
        .single();

      if (backupError) {
        console.error('❌ [API] فشل في إنشاء الأوردر في كلا الجدولين:', backupError);
        return res.status(500).json({ error: 'Failed to create order in both tables' });
      }

      console.log('✅ [API] تم إنشاء الأوردر في جدول orders كـ backup');
      return res.status(200).json({ 
        success: true, 
        order: backupOrder,
        table: 'orders'
      });
    }

    console.log('✅ [API] تم إنشاء الأوردر في ecommerce_orders بنجاح');
    
    // إنشاء نسخة في جدول orders أيضاً للتوافق
    const { error: ordersError } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API;

    if (ordersError) {
      console.log('⚠️ [API] تحذير: فشل في إنشاء نسخة في جدول orders:', ordersError.message);
    } else {
      console.log('✅ [API] تم إنشاء نسخة في جدول orders أيضاً');
    }

    return res.status(200).json({ 
      success: true, 
      order: ecommerceOrder,
      table: 'ecommerce_orders'
    });

  } catch (error) {
    console.error('❌ [API] خطأ عام في إنشاء الأوردر:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
