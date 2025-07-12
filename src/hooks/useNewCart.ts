import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// إعدادات API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Company ID ثابت للاختبار
const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

// أنواع البيانات
export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_sku: string;
  unit_price: number;
  sale_price?: number;
  quantity: number;
  total_price: number;
  stock_available: number;
  session_id?: string;
  added_at?: string;
  updated_at?: string;
}

export interface CartSummary {
  session_id: string;
  items: CartItem[];
  items_count: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
}

export const useNewCart = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // إدارة معرف الجلسة
  const [sessionId, setSessionId] = useState<string>(() => {
    const saved = localStorage.getItem('cart_session_id');
    if (saved) return saved;
    
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cart_session_id', newSessionId);
    return newSessionId;
  });

  // جلب محتويات السلة
  const {
    data: cartData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['cart', sessionId],
    queryFn: async (): Promise<CartSummary> => {
      console.log('🛒 [CART] جلب محتويات السلة للجلسة:', sessionId);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/cart/${sessionId}`, {
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
        throw new Error(result.message || 'فشل في جلب محتويات السلة');
      }

      console.log('✅ [CART] تم جلب محتويات السلة بنجاح:', result.data);
      return result.data as CartSummary;
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 ثانية
  });

  // إضافة منتج للسلة
  const addToCartMutation = useMutation({
    mutationFn: async ({ product_id, quantity = 1 }: { product_id: string; quantity?: number }) => {
      console.log('➕ [CART] إضافة منتج للسلة:', { product_id, quantity, sessionId });

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/cart/${sessionId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_id, quantity })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'فشل في إضافة المنتج للسلة');
      }

      console.log('✅ [CART] تم إضافة المنتج للسلة بنجاح:', result.data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
      toast({
        title: "تم الإضافة",
        description: "تم إضافة المنتج للسلة بنجاح",
      });
    },
    onError: (error) => {
      console.error('❌ [CART] خطأ في إضافة المنتج:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في إضافة المنتج",
        variant: "destructive"
      });
    }
  });

  // تحديث كمية منتج
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      console.log('✏️ [CART] تحديث كمية المنتج:', { itemId, quantity, sessionId });

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/cart/${sessionId}/update/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'فشل في تحديث الكمية');
      }

      console.log('✅ [CART] تم تحديث الكمية بنجاح:', result.data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث كمية المنتج بنجاح",
      });
    },
    onError: (error) => {
      console.error('❌ [CART] خطأ في تحديث الكمية:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في تحديث الكمية",
        variant: "destructive"
      });
    }
  });

  // حذف منتج من السلة
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      console.log('🗑️ [CART] حذف منتج من السلة:', { itemId, sessionId });

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/cart/${sessionId}/remove/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'فشل في حذف المنتج');
      }

      console.log('✅ [CART] تم حذف المنتج بنجاح');
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج من السلة",
      });
    },
    onError: (error) => {
      console.error('❌ [CART] خطأ في حذف المنتج:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حذف المنتج",
        variant: "destructive"
      });
    }
  });

  // تفريغ السلة
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      console.log('🗑️ [CART] تفريغ السلة للجلسة:', sessionId);

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/cart/${sessionId}/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'فشل في تفريغ السلة');
      }

      console.log('✅ [CART] تم تفريغ السلة بنجاح');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
      toast({
        title: "تم تفريغ السلة",
        description: "تم تفريغ السلة بنجاح",
      });
    },
    onError: (error) => {
      console.error('❌ [CART] خطأ في تفريغ السلة:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في تفريغ السلة",
        variant: "destructive"
      });
    }
  });

  // حساب ملخص السلة
  const getCartSummary = () => {
    if (!cartData) {
      return {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        items_count: 0
      };
    }

    return {
      subtotal: cartData.subtotal,
      tax: cartData.tax_amount,
      shipping: cartData.shipping_amount,
      discount: cartData.discount_amount,
      total: cartData.total_amount,
      items_count: cartData.items_count
    };
  };

  return {
    // البيانات
    cartItems: cartData?.items || [],
    cartSummary: cartData,
    sessionId,
    
    // حالات التحميل
    isLoading,
    error,
    isAdding: addToCartMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
    isRemoving: removeFromCartMutation.isPending,
    isClearing: clearCartMutation.isPending,
    
    // العمليات
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    
    // المساعدات
    refetch,
    getCartSummary,
    setSessionId: (newSessionId: string) => {
      setSessionId(newSessionId);
      localStorage.setItem('cart_session_id', newSessionId);
    }
  };
};
