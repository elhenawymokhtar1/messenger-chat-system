/**
 * 🏪 Hook إدارة متجر الشركة
 * يتصل بـ MySQL API لإدارة متجر الشركة الواحد
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { directStoreApi } from "@/lib/mysql-api";
import { toast } from "sonner";

export interface CompanyStore {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export const useStoreManagement = (companyId?: string) => {
  const queryClient = useQueryClient();

  // جلب متجر الشركة
  const {
    data: store,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['company-store', companyId],
    queryFn: async () => {
      if (!companyId) {
        console.error('❌ معرف الشركة غير محدد');
        throw new Error('معرف الشركة مطلوب');
      }

      console.log('🔍 جلب متجر الشركة:', companyId);

      const response = await directStoreApi.getByCompany(companyId);

      console.log('📊 [DEBUG] Store API Response:', response);

      // التحقق من وجود خطأ
      if (response.error) {
        console.error('❌ [DEBUG] Store API Error:', response.error);
        throw new Error(response.error);
      }

      console.log('✅ تم جلب متجر الشركة:', response.data);
      return response.data;
    },
    enabled: !!companyId,
    staleTime: 0, // البيانات تعتبر قديمة فوراً
    cacheTime: 1000 * 60 * 5, // الاحتفاظ بالبيانات في cache لمدة 5 دقائق
    refetchOnMount: true, // إعادة جلب البيانات عند mount
    refetchOnWindowFocus: false, // عدم إعادة الجلب عند focus
    retry: 3, // إعادة المحاولة 3 مرات
    retryDelay: 1000, // انتظار ثانية بين المحاولات
  });

  // إنشاء متجر جديد
  const createStore = useMutation({
    mutationFn: async (storeData: {
      name: string;
      description?: string;
      phone?: string;
      email?: string;
      address?: string;
      website?: string;
      logo_url?: string;
    }) => {
      if (!companyId) {
        throw new Error('معرف الشركة مطلوب');
      }

      console.log('🏪 إنشاء متجر جديد:', { companyId, storeData });

      const response = await directStoreApi.create(companyId, storeData);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ تم إنشاء المتجر بنجاح:', data);
      toast.success('تم إنشاء المتجر بنجاح');

      // تحديث cache فوراً
      queryClient.setQueryData(['company-store', companyId], data);
      queryClient.invalidateQueries({ queryKey: ['company-store', companyId] });
    },
    onError: (error: Error) => {
      console.error('❌ خطأ في إنشاء المتجر:', error);
      toast.error(`فشل في إنشاء المتجر: ${error.message}`);
    }
  });

  // تحديث المتجر
  const updateStore = useMutation({
    mutationFn: async (storeData: {
      name?: string;
      description?: string;
      phone?: string;
      email?: string;
      address?: string;
      website?: string;
      logo_url?: string;
      is_active?: boolean;
    }) => {
      if (!companyId) {
        throw new Error('معرف الشركة مطلوب');
      }

      console.log('📝 تحديث المتجر:', { companyId, storeData });

      const response = await directStoreApi.update(companyId, storeData);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ تم تحديث المتجر بنجاح:', data);
      toast.success('تم تحديث المتجر بنجاح');

      // تحديث cache فوراً
      queryClient.setQueryData(['company-store', companyId], data);
      queryClient.invalidateQueries({ queryKey: ['company-store', companyId] });
    },
    onError: (error: Error) => {
      console.error('❌ خطأ في تحديث المتجر:', error);
      toast.error(`فشل في تحديث المتجر: ${error.message}`);
    }
  });

  // تفعيل/إلغاء تفعيل المتجر
  const toggleStoreStatus = useMutation({
    mutationFn: async (isActive: boolean) => {
      if (!companyId) {
        throw new Error('معرف الشركة مطلوب');
      }

      console.log('🔄 تغيير حالة المتجر:', { companyId, isActive });

      const response = await directStoreApi.toggleStatus(companyId, isActive);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    },
    onSuccess: (data, isActive) => {
      console.log('✅ تم تغيير حالة المتجر بنجاح:', data);
      toast.success(isActive ? 'تم تفعيل المتجر' : 'تم إلغاء تفعيل المتجر');

      // تحديث cache فوراً
      queryClient.setQueryData(['company-store', companyId], data);
      queryClient.invalidateQueries({ queryKey: ['company-store', companyId] });
    },
    onError: (error: Error) => {
      console.error('❌ خطأ في تغيير حالة المتجر:', error);
      toast.error(`فشل في تغيير حالة المتجر: ${error.message}`);
    }
  });

  return {
    store,
    isLoading,
    error,
    refetch,
    createStore,
    updateStore,
    toggleStoreStatus,
    
    // حالات التحميل
    isCreating: createStore.isPending,
    isUpdating: updateStore.isPending,
    isToggling: toggleStoreStatus.isPending,
  };
};

export default useStoreManagement;
