/**
 * 📨 Hook رسائل حقيقي
 * يتصل بـ API الحقيقي لجلب وإرسال الرسائل
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesApi } from "@/lib/mysql-api";
import { toast } from "sonner";

export interface RealMessage {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'admin' | 'page' | 'system' | 'agent';  // إضافة 'admin'
  sender_name?: string;
  message_text?: string;  // للتوافق مع Frontend
  content?: string;       // للتوافق مع API
  message_type: 'text' | 'image' | 'file' | 'sticker' | 'audio';
  facebook_message_id?: string;
  created_at?: string;
  timestamp?: string;     // للتوافق مع API
  image_url?: string;     // رابط الصورة
  updated_at?: string;
  is_read?: boolean;
  status?: string;
  attachments?: any[];
  is_from_page?: number;  // إضافة is_from_page
}

export const useRealMessages = (conversationId?: string, companyId?: string, recentOnly = true) => {
  const queryClient = useQueryClient();

  console.log('🔧 [DEBUG] useRealMessages called with:', {
    conversationId,
    companyId,
    recentOnly,
    conversationIdType: typeof conversationId,
    companyIdType: typeof companyId
  });

  // جلب الرسائل
  const {
    data: messages = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['real-messages', conversationId, companyId, recentOnly],
    queryFn: async () => {
      console.log('🚀 [DEBUG] Messages queryFn called with:', {
        conversationId,
        companyId,
        recentOnly
      });

      if (!conversationId || !companyId) {
        console.warn('⚠️ [DEBUG] Missing conversationId or companyId:', {
          conversationId,
          companyId
        });
        return [];
      }

      console.log('🔍 جلب الرسائل للمحادثة:', conversationId, 'حديثة فقط:', recentOnly);

      const response = await messagesApi.getMessages(conversationId, companyId, 50, recentOnly);

      console.log('📊 [DEBUG] Messages API Response:', response);
      console.log('📊 [DEBUG] Response type:', typeof response);
      console.log('📊 [DEBUG] Response keys:', Object.keys(response || {}));

      // التحقق من وجود خطأ
      if (response.error) {
        console.error('❌ [DEBUG] Messages API Error:', response.error);
        throw new Error(response.error);
      }

      // التحقق من وجود البيانات - apiRequest يرجع { data: responseData }
      // لذلك نحتاج للوصول إلى response.data.data
      const messagesData = response.data?.data || response.data || [];

      console.log('📊 [DEBUG] Extracted messages data:', messagesData);
      console.log('✅ تم جلب الرسائل:', messagesData?.length || 0);

      // تحويل البيانات للتوافق مع Frontend
      const transformedMessages = (messagesData || []).map((msg: any) => {
        const transformed = {
          ...msg,
          message_text: msg.content || msg.message_text,  // تحويل content إلى message_text
          created_at: msg.timestamp || msg.created_at,    // تحويل timestamp إلى created_at
          // تحديد sender_type بناءً على sender_id أولاً، ثم is_from_page
          sender_type: (msg.sender_id === 'admin' || msg.sender_id === '250528358137901' || msg.is_from_page === 1) ? 'admin' : 'customer',
          is_from_page: msg.is_from_page,  // الحفاظ على is_from_page الأصلي
          image_url: msg.image_url,        // تمرير image_url
          content: msg.content || msg.message_text  // تمرير content للتوافق مع ChatWindow
        };

        // إضافة سجل للصور
        if (msg.message_type === 'image' || msg.image_url) {
          console.log('🖼️ [DEBUG] رسالة صورة:', {
            id: msg.id,
            message_type: msg.message_type,
            image_url: msg.image_url,
            sender_type: transformed.sender_type,
            is_from_page: msg.is_from_page
          });
        }

        return transformed;
      });

      console.log('🔄 [DEBUG] Transformed messages:', transformedMessages.length, 'messages');

      return transformedMessages;
    },
    enabled: !!conversationId && !!companyId,
    refetchInterval: 2000, // تحديث كل ثانيتين للرسائل الفورية
    staleTime: 500, // البيانات صالحة لمدة نصف ثانية فقط
    refetchOnWindowFocus: true, // تحديث عند التركيز على النافذة
    refetchOnMount: true, // تحديث عند تحميل المكون
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // إرسال رسالة
  const sendMessage = useMutation({
    mutationFn: async (messageData: {
      conversation_id: string;
      company_id: string;
      message_text: string;
      message_type?: string;
      image_data?: string;      // بيانات الصورة base64
      image_name?: string;      // اسم الصورة
    }) => {
      console.log('📤 إرسال رسالة:', messageData);

      const response = await messagesApi.sendMessage(messageData);

      console.log('📊 [DEBUG] Send Message Response:', response);

      if (response.error) {
        console.log('❌ [DEBUG] Send Message Error:', response.error);
        throw new Error(response.error || 'فشل في إرسال الرسالة');
      }

      console.log('✅ [DEBUG] Send Message Success:', response.data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log('✅ تم إرسال الرسالة بنجاح');

      // تحديث فوري للرسائل
      queryClient.invalidateQueries({
        queryKey: ['real-messages', variables.conversation_id]
      });

      // إجبار إعادة جلب الرسائل فوراً
      queryClient.refetchQueries({
        queryKey: ['real-messages', variables.conversation_id]
      });

      // تحديث قائمة المحادثات لإظهار آخر رسالة
      queryClient.invalidateQueries({
        queryKey: ['real-conversations', variables.company_id]
      });

      // إجبار إعادة جلب المحادثات فوراً
      queryClient.refetchQueries({
        queryKey: ['real-conversations', variables.company_id]
      });

      toast.success('تم إرسال الرسالة بنجاح');
    },
    onError: (error: any) => {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      toast.error(error.message || 'فشل في إرسال الرسالة');
    },
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    refetch
  };
};