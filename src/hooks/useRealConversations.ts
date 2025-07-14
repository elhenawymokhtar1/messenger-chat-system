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

  console.log('🔧 [DEBUG] useRealConversations called with companyId:', companyId);
  console.log('🔧 [DEBUG] companyId type:', typeof companyId);
  console.log('🔧 [DEBUG] companyId length:', companyId?.length);

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

      try {
        console.log('🚀 [DEBUG] Starting API call...');
        console.log('🔍 [DEBUG] conversationsApi object:', conversationsApi);
        console.log('🔍 [DEBUG] getConversations function:', conversationsApi.getConversations);

        console.log('⏳ [DEBUG] About to call getConversations...');

        let response;
        try {
          response = await conversationsApi.getConversations(companyId);
          console.log('✅ [DEBUG] getConversations returned:', response);
        } catch (apiError) {
          console.error('❌ [DEBUG] getConversations threw error:', apiError);
          console.error('❌ [DEBUG] Error type:', typeof apiError);
          console.error('❌ [DEBUG] Error message:', apiError instanceof Error ? apiError.message : apiError);
          throw apiError;
        }
        console.log('🎯 [DEBUG] Raw API response:', response);
        console.log('🎯 [DEBUG] Response type:', typeof response);
        console.log('🎯 [DEBUG] Response keys:', response ? Object.keys(response) : 'null');

        // التحقق من بنية الاستجابة
        // التنسيق الجديد: {data: {success: true, data: [...]}, error: null}
        if (response && response.data && response.data.success && Array.isArray(response.data.data)) {
          console.log('✅ تم جلب المحادثات من response.data.data:', response.data.data.length);
          console.log('✅ First conversation:', response.data.data[0]);
          return response.data.data;
        }
        // التنسيق القديم: {data: [...], error: null}
        else if (response && response.data && Array.isArray(response.data)) {
          console.log('✅ تم جلب المحادثات من response.data:', response.data.length);
          console.log('✅ First conversation:', response.data[0]);
          return response.data;
        }
        // التنسيق المباشر: {success: true, data: [...]}
        else if (response && response.success && Array.isArray(response.data)) {
          console.log('✅ تم جلب المحادثات من response.data (success):', response.data.length);
          console.log('✅ First conversation:', response.data[0]);
          return response.data;
        }
        // مصفوفة مباشرة
        else if (Array.isArray(response)) {
          console.log('✅ تم جلب المحادثات (مصفوفة مباشرة):', response.length);
          console.log('✅ First conversation:', response[0]);
          return response;
        } else {
          console.warn('⚠️ [DEBUG] Unexpected response format:', response);
          console.warn('⚠️ [DEBUG] Response structure:', JSON.stringify(response, null, 2));
          return [];
        }
      } catch (error) {
        console.error('❌ [DEBUG] API call failed:', error);
        console.error('❌ [DEBUG] Error details:', error instanceof Error ? error.message : error);
        throw error;
      }
    },
    enabled: !!companyId,
    onSuccess: (data) => {
      console.log('✅ [DEBUG] Query success, data:', data);
    },
    onError: (error) => {
      console.error('❌ [DEBUG] Query error:', error);
    },
    refetchInterval: 3000, // تحديث كل 3 ثوان للمحادثات (أسرع)
    staleTime: 1000, // البيانات صالحة لمدة ثانية واحدة
    refetchOnWindowFocus: true, // تحديث عند التركيز على النافذة
    refetchOnMount: true, // تحديث عند تحميل المكون
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  console.log('🔄 [DEBUG] useRealConversations returning:', {
    conversations: conversations,
    conversationsLength: conversations?.length || 0,
    isLoading,
    error: error?.message || null,
    hasData: !!conversations
  });

  return {
    conversations,
    isLoading,
    error,
    refetch
  };
};