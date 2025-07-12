/**
 * 🏢 Hook لإدارة حالة الشركة باستخدام React Query بدلاً من localStorage
 * يوفر إدارة مركزية لبيانات الشركة مع تحديث تلقائي
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  status: 'active' | 'inactive' | 'suspended';
  is_verified: boolean;
  created_at: string;
  last_login_at?: string;
}

// State management للشركة الحالية (بدلاً من localStorage)
let currentCompanyState: Company | null = null;
const companyStateListeners: ((company: Company | null) => void)[] = [];

const setCurrentCompanyState = (company: Company | null) => {
  currentCompanyState = company;
  console.log('🏢 تم تحديث حالة الشركة:', company?.name || 'لا توجد شركة');
  companyStateListeners.forEach(listener => listener(company));
};

const addCompanyStateListener = (listener: (company: Company | null) => void) => {
  companyStateListeners.push(listener);
  return () => {
    const index = companyStateListeners.indexOf(listener);
    if (index > -1) {
      companyStateListeners.splice(index, 1);
    }
  };
};

// API functions
const companyApi = {
  getCompany: async (companyId: string): Promise<Company> => {
    console.log('🔍 جلب بيانات الشركة من API:', companyId);
    
    const response = await fetch(`http://localhost:3002/api/companies/${companyId}`);
    if (!response.ok) {
      throw new Error('فشل في جلب بيانات الشركة');
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'فشل في جلب بيانات الشركة');
    }
    
    console.log('✅ تم جلب بيانات الشركة:', result.data.name);
    return result.data;
  },

  updateCompany: async (company: Company): Promise<Company> => {
    console.log('🔄 تحديث بيانات الشركة:', company.name);
    
    const response = await fetch(`http://localhost:3002/api/companies/${company.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(company),
    });
    
    if (!response.ok) {
      throw new Error('فشل في تحديث بيانات الشركة');
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'فشل في تحديث بيانات الشركة');
    }
    
    console.log('✅ تم تحديث بيانات الشركة بنجاح');
    return result.data;
  },
};

export const useCompanyState = () => {
  const [company, setLocalCompany] = useState<Company | null>(currentCompanyState);
  const queryClient = useQueryClient();

  // مراقبة تغييرات state الشركة
  useEffect(() => {
    const unsubscribe = addCompanyStateListener(setLocalCompany);
    return unsubscribe;
  }, []);

  // جلب بيانات الشركة من API
  const { 
    data: companyData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['company-state', company?.id],
    queryFn: () => companyApi.getCompany(company!.id),
    enabled: !!company?.id,
    staleTime: 1000 * 60 * 5, // البيانات صالحة لمدة 5 دقائق
    cacheTime: 1000 * 60 * 10, // الاحتفاظ بالبيانات لمدة 10 دقائق
    onSuccess: (data) => {
      // تحديث الحالة المحلية عند جلب البيانات
      setCurrentCompanyState(data);
    },
  });

  // تحديث بيانات الشركة
  const updateCompanyMutation = useMutation({
    mutationFn: companyApi.updateCompany,
    onSuccess: (data) => {
      setCurrentCompanyState(data);
      queryClient.setQueryData(['company-state', data.id], data);
      toast.success('تم تحديث بيانات الشركة بنجاح');
    },
    onError: (error: Error) => {
      console.error('❌ خطأ في تحديث بيانات الشركة:', error);
      toast.error('فشل في تحديث بيانات الشركة: ' + error.message);
    },
  });

  // تعيين شركة جديدة بالمعرف
  const setCompanyById = async (companyId: string) => {
    try {
      console.log('🔄 تعيين الشركة بالمعرف:', companyId);
      
      const companyData = await companyApi.getCompany(companyId);
      setCurrentCompanyState(companyData);
      
      // تحديث cache
      queryClient.setQueryData(['company-state', companyId], companyData);
      
      toast.success(`تم تسجيل الدخول كـ ${companyData.name}`);
      
      return companyData;
    } catch (error) {
      console.error('❌ خطأ في تعيين الشركة:', error);
      toast.error('فشل في تسجيل الدخول: ' + (error as Error).message);
      throw error;
    }
  };

  // تعيين شركة مباشرة
  const setCompanyDirect = (newCompany: Company) => {
    setCurrentCompanyState(newCompany);
    queryClient.setQueryData(['company-state', newCompany.id], newCompany);
  };

  // تحديث بيانات الشركة
  const updateCompany = (updatedCompany: Company) => {
    updateCompanyMutation.mutate(updatedCompany);
  };

  // مسح بيانات الشركة الحالية
  const clearCompany = () => {
    console.log('🧹 مسح بيانات الشركة الحالية');
    setCurrentCompanyState(null);
    queryClient.removeQueries({ queryKey: ['company-state'] });
    toast.info('تم تسجيل الخروج');
  };

  // التحقق من كون الشركة جديدة
  const isNewCompany = (createdAt?: string): boolean => {
    if (!createdAt) return false;
    
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return diffInDays <= 7;
  };

  return {
    // البيانات
    company: companyData || company,
    loading: isLoading,
    error,
    
    // الحالات
    isUpdating: updateCompanyMutation.isPending,
    isNewCompany: company ? isNewCompany(company.created_at) : false,
    
    // الوظائف
    setCompanyById,
    setCompany: setCompanyDirect,
    updateCompany,
    clearCompany,
    refetch,
  };
};

// Hook مبسط للحصول على الشركة الحالية فقط
export const useCurrentCompanySimple = () => {
  const [company, setSimpleCompany] = useState<Company | null>(currentCompanyState);

  useEffect(() => {
    const unsubscribe = addCompanyStateListener(setSimpleCompany);
    return unsubscribe;
  }, []);

  return company;
};

// دالة مساعدة للحصول على معرف الشركة الحالية
export const getCurrentCompanyId = (): string | null => {
  return currentCompanyState?.id || null;
};

// دالة مساعدة للحصول على الشركة الحالية
export const getCurrentCompany = (): Company | null => {
  return currentCompanyState;
};
