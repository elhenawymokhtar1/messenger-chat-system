/**
 * 🪝 Hook محسن لإدارة صفحات Facebook بدون Local Storage
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFacebookStore } from '@/stores/facebookStore';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

interface FacebookPage {
  id: string;
  company_id: string;
  page_id: string;
  page_name: string;
  access_token: string;
  is_active: boolean;
  webhook_verify_token?: string;
  auto_reply_enabled?: boolean;
  welcome_message?: string;
  created_at: string;
  updated_at: string;
}

export const useFacebookPages = (companyId?: string) => {
  const queryClient = useQueryClient();
  const { setConnectedPages, setLoading, setError } = useFacebookStore();

  // جلب الصفحات من قاعدة البيانات
  const {
    data: pages = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['facebook-pages', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      console.log('🔍 جلب صفحات Facebook للشركة:', companyId);
      
      const response = await fetch(`${API_BASE_URL}/api/facebook/settings?company_id=${companyId}`);
      
      if (!response.ok) {
        throw new Error('فشل في جلب صفحات Facebook');
      }

      const data = await response.json();
      console.log('✅ تم جلب', data.length, 'صفحة Facebook');
      
      // تحديث Store
      setConnectedPages(data);
      
      return data as FacebookPage[];
    },
    enabled: !!companyId,
    staleTime: 30000, // البيانات صالحة لمدة 30 ثانية
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // إضافة صفحة جديدة
  const addPage = useMutation({
    mutationFn: async (pageData: {
      company_id: string;
      page_id: string;
      page_name: string;
      access_token: string;
    }) => {
      console.log('📤 إضافة صفحة Facebook جديدة:', pageData.page_name);

      const response = await fetch(`${API_BASE_URL}/api/facebook/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إضافة الصفحة');
      }

      return response.json();
    },
    onSuccess: () => {
      // إعادة جلب البيانات من قاعدة البيانات
      queryClient.invalidateQueries({ queryKey: ['facebook-pages', companyId] });
      
      toast.success('تم إضافة الصفحة بنجاح');
    },
    onError: (error: any) => {
      console.error('❌ خطأ في إضافة الصفحة:', error);
      toast.error(error.message || 'فشل في إضافة الصفحة');
    },
  });

  // حذف صفحة
  const deletePage = useMutation({
    mutationFn: async (pageId: string) => {
      console.log('🗑️ حذف صفحة Facebook:', pageId);

      const response = await fetch(`${API_BASE_URL}/api/facebook/settings/${pageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('فشل في حذف الصفحة');
      }

      return response.json();
    },
    onSuccess: () => {
      // إعادة جلب البيانات من قاعدة البيانات
      queryClient.invalidateQueries({ queryKey: ['facebook-pages', companyId] });
      
      toast.success('تم حذف الصفحة بنجاح');
    },
    onError: (error: any) => {
      console.error('❌ خطأ في حذف الصفحة:', error);
      toast.error(error.message || 'فشل في حذف الصفحة');
    },
  });

  // اختبار Access Token
  const testToken = useMutation({
    mutationFn: async (accessToken: string) => {
      console.log('🔍 اختبار Access Token...');

      const response = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`);
      
      if (!response.ok) {
        throw new Error('فشل في الاتصال بـ Facebook');
      }

      const userData = await response.json();

      if (userData.error) {
        throw new Error(userData.error.message || 'رمز الوصول غير صحيح');
      }

      // جلب الصفحات المتاحة
      const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesResponse.json();

      return {
        user: userData,
        pages: pagesData.data || []
      };
    },
    onSuccess: (data) => {
      console.log('✅ تم اختبار Token بنجاح');
      toast.success(`تم الاتصال بنجاح - تم العثور على ${data.pages.length} صفحة`);
    },
    onError: (error: any) => {
      console.error('❌ خطأ في اختبار Token:', error);
      toast.error(error.message || 'فشل في اختبار رمز الوصول');
    },
  });

  return {
    // البيانات
    pages,
    isLoading,
    error,
    
    // العمليات
    addPage,
    deletePage,
    testToken,
    refetch,
    
    // حالة العمليات
    isAddingPage: addPage.isPending,
    isDeletingPage: deletePage.isPending,
    isTestingToken: testToken.isPending,
  };
};
