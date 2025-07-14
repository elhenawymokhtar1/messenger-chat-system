import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
// تم حذف sessionId - لا نحتاجه!

// نوع البيانات للسلة
interface CartContextType {
  cartCount: number;
  isLoadingCount: boolean;
  refreshCartCount: () => void;
  setCartCount: (count: number) => void;
}

// إنشاء Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider للسلة
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [manualCartCount, setManualCartCount] = React.useState<number | null>(null);

  console.log('🛒 [CART CONTEXT] تم تبسيط النظام - لا نحتاج sessionId!');

  // Company ID ثابت للاختبار
  const COMPANY_ID = '2d9b8887-0cca-430b-b61b-ca16cccfec63';

  // ✅ استخدام React Query لجلب عدد عناصر السلة
  const {
    data: cartCount = 0,
    isLoading: isLoadingCount,
    refetch: refreshCartCount
  } = useQuery({
    queryKey: ['cart-count'], // ✅ مبسط - بدون sessionId
    queryFn: async (): Promise<number> => {
      console.log('🔄 [CART CONTEXT] جلب عدد عناصر السلة من الخادم...');

      const response = await fetch(`http://localhost:3002/api/companies/${COMPANY_ID}/cart`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const count = data.data?.length || 0;

      console.log('✅ [CART CONTEXT] تم جلب عدد العناصر:', count);
      return count;
    },
    enabled: true, // ✅ تفعيل الاستعلام دائماً - لا نحتاج company
    staleTime: 1000 * 30, // ✅ 30 ثانية
    refetchOnMount: false,
  });

  // ✅ دالة لتحديث عدد العناصر يدوياً
  const setCartCount = (count: number) => {
    setManualCartCount(count);
    // تحديث الـ query cache أيضاً
    queryClient.setQueryData(['cart-count'], count);
  };

  // استخدام العدد اليدوي إذا كان متوفراً، وإلا استخدام العدد من الـ query
  const finalCartCount = manualCartCount !== null ? manualCartCount : cartCount;

  const value: CartContextType = {
    cartCount: finalCartCount,
    isLoadingCount,
    refreshCartCount,
    setCartCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook لاستخدام Context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
