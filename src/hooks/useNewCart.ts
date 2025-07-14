import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
// تم حذف sessionId - لا نحتاجه!

// إعدادات API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Company ID ثابت للاختبار
const COMPANY_ID = '2d9b8887-0cca-430b-b61b-ca16cccfec63';

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
  added_at?: string;
  updated_at?: string;
}

export interface CartSummary {
  items: CartItem[];
  total: number;
  count: number;
}

export const useNewCart = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('🛒 [CART] تم تبسيط النظام - لا نحتاج sessionId!');

  // جلب محتويات السلة
  const {
    data: cartData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['cart'], // ✅ مبسط - بدون sessionId
    queryFn: async (): Promise<CartSummary> => {
      console.log('🛒 [CART] جلب محتويات السلة المبسطة');

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/cart`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.log('⚠️ [CART] خطأ في جلب السلة، إرجاع سلة فارغة');
        return { items: [], total: 0, count: 0 };
      }

      const result = await response.json();

      if (!result.success) {
        console.log('⚠️ [CART] فشل في جلب السلة، إرجاع سلة فارغة');
        return { items: [], total: 0, count: 0 };
      }

      console.log('✅ [CART] تم جلب محتويات السلة بنجاح:', result);

      // ✅ التأكد من أن البيانات صحيحة
      return {
        items: result.items || [],
        total: result.total || 0,
        count: result.count || 0
      };
    },
    staleTime: 1000 * 30, // ✅ 30 ثانية للسلة
    refetchOnMount: true, // ✅ إعادة الجلب عند التحميل
    refetchOnWindowFocus: true, // ✅ إعادة الجلب عند التركيز
  });

  // إضافة منتج للسلة
  const addToCartMutation = useMutation({
    mutationFn: async ({
      product_id,
      product_name,
      product_sku,
      price,
      quantity = 1,
      image_url
    }: {
      product_id: string;
      product_name: string;
      product_sku?: string;
      price: number;
      quantity?: number;
      image_url?: string;
    }) => {
      console.log('➕ [CART] إضافة منتج للسلة:', { product_id, product_name, quantity });

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id,
          product_name,
          product_sku,
          price,
          quantity,
          image_url
        })
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
    // ✅ Optimistic Update - تحديث فوري قبل الخادم
    onMutate: async ({ product_id, product_name, price, quantity = 1 }) => {
      // إلغاء الاستعلامات الجارية
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      await queryClient.cancelQueries({ queryKey: ['cart-count'] });

      // حفظ البيانات الحالية
      const previousCart = queryClient.getQueryData(['cart']);
      const previousCount = queryClient.getQueryData(['cart-count']);

      // تحديث فوري للسلة
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;

        const existingItem = old.items?.find((item: any) => item.product_id === product_id);

        if (existingItem) {
          // تحديث الكمية
          return {
            ...old,
            items: old.items.map((item: any) =>
              item.product_id === product_id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          };
        } else {
          // إضافة منتج جديد
          return {
            ...old,
            items: [
              ...(old.items || []),
              {
                id: 'temp-' + Date.now(),
                product_id,
                product_name: product_name || 'جاري التحميل...',
                quantity,
                price: price || 0,
                total_price: (price || 0) * quantity
              }
            ]
          };
        }
      });

      // تحديث فوري للعداد
      queryClient.setQueryData(['cart-count'], (old: number = 0) => old + quantity);

      console.log('⚡ [CART] تحديث فوري - إضافة منتج:', { product_id, quantity });
      return { previousCart, previousCount };
    },
    onSuccess: () => {
      // ✅ تحديث جميع الاستعلامات المرتبطة بالسلة
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast({
        title: "تم الإضافة",
        description: "تم إضافة المنتج للسلة بنجاح",
      });
    },
    onError: (error, variables, context) => {
      // ✅ إرجاع البيانات السابقة في حالة الخطأ
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(['cart-count'], context.previousCount);
      }

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
      console.log('✏️ [CART] تحديث كمية المنتج:', { itemId, quantity });

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/cart/update/${itemId}`, {
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
    // ✅ Optimistic Update لتحديث الكمية
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      await queryClient.cancelQueries({ queryKey: ['cart-count'] });

      const previousCart = queryClient.getQueryData(['cart']);
      const previousCount = queryClient.getQueryData(['cart-count']);

      // تحديث فوري للكمية
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;

        let totalCountChange = 0;
        const updatedItems = old.items?.map((item: any) => {
          if (item.id === itemId) {
            totalCountChange = quantity - item.quantity;
            return { ...item, quantity };
          }
          return item;
        });

        return { ...old, items: updatedItems };
      });

      // تحديث العداد
      queryClient.setQueryData(['cart-count'], (old: number = 0) => {
        const currentCart = queryClient.getQueryData(['cart']) as any;
        return currentCart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      });

      console.log('⚡ [CART] تحديث فوري - تحديث كمية:', { itemId, quantity });
      return { previousCart, previousCount };
    },
    onSuccess: () => {
      // ✅ تحديث جميع الاستعلامات المرتبطة بالسلة
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث كمية المنتج بنجاح",
      });
    },
    onError: (error, variables, context) => {
      // ✅ إرجاع البيانات السابقة في حالة الخطأ
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(['cart-count'], context.previousCount);
      }

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
      console.log('🗑️ [CART] حذف منتج من السلة:', { itemId });

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/cart/remove/${itemId}`, {
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
    // ✅ Optimistic Update لحذف المنتج
    onMutate: async (itemId: string) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      await queryClient.cancelQueries({ queryKey: ['cart-count'] });

      const previousCart = queryClient.getQueryData(['cart']);
      const previousCount = queryClient.getQueryData(['cart-count']);

      // حذف فوري للمنتج
      queryClient.setQueryData(['cart'], (old: any) => {
        if (!old) return old;

        const filteredItems = old.items?.filter((item: any) => item.id !== itemId) || [];
        return { ...old, items: filteredItems };
      });

      // تحديث العداد
      queryClient.setQueryData(['cart-count'], (old: number = 0) => {
        const currentCart = queryClient.getQueryData(['cart']) as any;
        return currentCart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      });

      console.log('⚡ [CART] تحديث فوري - حذف منتج:', { itemId });
      return { previousCart, previousCount };
    },
    onSuccess: () => {
      // ✅ تحديث جميع الاستعلامات المرتبطة بالسلة
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج من السلة",
      });
    },
    onError: (error, variables, context) => {
      // ✅ إرجاع البيانات السابقة في حالة الخطأ
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(['cart-count'], context.previousCount);
      }

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
      console.log('🗑️ [CART] تفريغ السلة');

      const response = await fetch(`${API_BASE_URL}/api/companies/${COMPANY_ID}/cart/clear`, {
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
      // ✅ تحديث جميع الاستعلامات المرتبطة بالسلة
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
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
      subtotal: cartData.total || 0,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: cartData.total || 0,
      items_count: cartData.count || 0
    };
  };

  return {
    // البيانات
    cartItems: cartData?.items || [],
    cartSummary: cartData,

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
    getCartSummary
  };
};
