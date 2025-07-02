/**
 * 🏢 Hook شركة مبسط
 * يعمل بدون أخطاء مع بيانات تجريبية
 */

import { useState, useEffect } from 'react';

export interface SimpleCompany {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export const useSimpleCurrentCompany = () => {
  const [company, setCompany] = useState<SimpleCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewCompany, setIsNewCompany] = useState(false);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        setLoading(true);
        
        // محاكاة تحميل بيانات الشركة
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockCompany: SimpleCompany = {
          id: "test-company-123",
          name: "شركة تجريبية",
          email: "test@company.com",
          status: "active",
          created_at: new Date().toISOString()
        };
        
        setCompany(mockCompany);
        setIsNewCompany(true);
        
        console.log('✅ تم تحميل بيانات الشركة التجريبية');
      } catch (error) {
        console.error('❌ خطأ في تحميل بيانات الشركة:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, []);

  return {
    company,
    loading,
    isNewCompany
  };
};