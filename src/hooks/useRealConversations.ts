/**
 * 💬 Hook محادثات حقيقي
 * يتصل بـ API الحقيقي وقاعدة البيانات MySQL
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { conversationsApi } from "@/lib/mysql-api";

export interface RealConversation {
  id: string;
  facebook_page_id: string;
  customer_name: string;
  customer_facebook_id: string;
  last_message: string | null;
  last_message_at: string;
  is_online: boolean;
  unread_count: number;
  conversation_status?: 'active' | 'pending' | 'resolved' | 'spam' | 'archived';
  page_id: string;
  created_at: string;
  updated_at: string;
  page_name?: string;
  page_picture_url?: string;
  company_id: string;
}

export const useRealConversations = (companyId?: string) => {
  const queryClient = useQueryClient();

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['real-conversations', companyId],
    queryFn: async () => {
      if (!companyId) {
        throw new Error('معرف الشركة مطلوب');
      }

      console.log('🔍 جلب المحادثات للشركة:', companyId);

      const response = await conversationsApi.getConversations(companyId);

      console.log('📊 [DEBUG] API Response:', response);
      console.log('📊 [DEBUG] Response type:', typeof response);
      console.log('📊 [DEBUG] Response keys:', Object.keys(response || {}));

      // التحقق من وجود خطأ
      if (response.error) {
        console.error('❌ [DEBUG] API Error:', response.error);
        throw new Error(response.error);
      }

      // التحقق من وجود البيانات
      if (!response.data) {
        console.warn('⚠️ [DEBUG] No data in response');
        return [];
      }

      console.log('✅ تم جلب المحادثات:', response.data?.length || 0);
      console.log('📋 [DEBUG] Conversations data:', response.data);
      console.log('📋 [DEBUG] First conversation:', response.data?.[0]);

      return response.data || [];
    },
    enabled: !!companyId,
    refetchInterval: 3000, // تحديث كل 3 ثوان للمحادثات (أسرع)
    staleTime: 1000, // البيانات صالحة لمدة ثانية واحدة
    refetchOnWindowFocus: true, // تحديث عند التركيز على النافذة
    refetchOnMount: true, // تحديث عند تحميل المكون
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    conversations,
    isLoading,
    error,
    refetch
  };
};