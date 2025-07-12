import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// إعدادات API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Company ID ثابت للاختبار
const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

// أنواع البيانات
export interface CheckoutData {
  customer_info: {
    name: string;
    email?: string;
    phone: string;
  };
  shipping_address: {
    street: string;
    city: string;
    postal_code?: string;
    country?: string;
  };
  payment_method?: string;
  notes?: string;
  session_id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    product_sku?: string;
    quantity: number;
    unit_price: number;
    sale_price?: number;
    total_price: number;
  }>;
  summary: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
}

export interface Order {
  id: string;
  order_number: string;
  company_id: string;
  session_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    postal_code?: string;
    country?: string;
    phone: string;
  };
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    product_sku?: string;
    quantity: number;
    unit_price: number;
    sale_price?: number;
    total_price: number;
  }>;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useCheckout = () => {
  const { toast } = useToast();

  // إتمام عملية الشراء
  const checkoutMutation = useMutation({
    mutationFn: async (checkoutData: CheckoutData) => {
      console.log('💳 [CHECKOUT] إرسال طلب إتمام الشراء:', checkoutData);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'فشل في إتمام الطلب');
      }

      console.log('✅ [CHECKOUT] تم إتمام الطلب بنجاح:', result.data);
      return result.data as Order;
    },
    onSuccess: (order) => {
      toast({
        title: "تم إتمام الطلب",
        description: `رقم الطلب: ${order.order_number}`,
      });
    },
    onError: (error) => {
      console.error('❌ [CHECKOUT] خطأ في إتمام الطلب:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في إتمام الطلب",
        variant: "destructive"
      });
    }
  });

  // جلب تفاصيل طلب محدد
  const getOrderDetails = async (orderId: string): Promise<Order> => {
    console.log('📋 [CHECKOUT] جلب تفاصيل الطلب:', orderId);

    const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'فشل في جلب تفاصيل الطلب');
    }

    console.log('✅ [CHECKOUT] تم جلب تفاصيل الطلب بنجاح:', result.data);
    return result.data as Order;
  };

  // استعلام لجلب تفاصيل طلب محدد
  const useOrderDetails = (orderId: string) => {
    return useQuery({
      queryKey: ['order-details', orderId],
      queryFn: () => getOrderDetails(orderId),
      enabled: !!orderId,
      staleTime: 5 * 60 * 1000, // 5 دقائق
    });
  };

  return {
    // العمليات
    checkout: checkoutMutation.mutate,
    checkoutAsync: checkoutMutation.mutateAsync,
    getOrderDetails,
    useOrderDetails,
    
    // حالات التحميل
    isCheckingOut: checkoutMutation.isPending,
    
    // البيانات
    checkoutError: checkoutMutation.error,
    lastOrder: checkoutMutation.data,
  };
};
