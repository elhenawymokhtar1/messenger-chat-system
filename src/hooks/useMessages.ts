
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { messagesApi } from "@/lib/mysql-api";
import { FacebookApiService } from "@/services/facebookApi";
import { frontendLogger } from "@/utils/frontendLogger";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: 'customer' | 'admin' | 'bot';
  facebook_message_id: string | null;
  is_read: boolean;
  is_auto_reply: boolean;
  is_ai_generated?: boolean;
  image_url?: string | null;
  message_status?: 'pending' | 'answered' | 'unanswered' | 'spam' | 'archived';
  page_id: string;
  created_at: string;
}

export const useMessages = (conversationId: string | null) => {
  const queryClient = useQueryClient();
  const { company } = useCurrentCompany();

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) {
        return [];
      }

      // استخدام MySQL API لجلب الرسائل
      const result = await messagesApi.getByConversation(conversationId, 100);

      if (result.error) {
        throw new Error(result.error);
      }

      // ترتيب الرسائل حسب التاريخ (الأقدم أولاً)
      const messages = (result.data || []).sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      return messages as Message[];
    },
    enabled: !!conversationId,
    retry: 2,
    staleTime: 5000, // البيانات تبقى fresh لمدة 5 ثواني
    gcTime: 30000,   // الاحتفاظ بالـ cache لمدة 30 ثانية
    refetchOnWindowFocus: false, // لا تعيد التحميل عند التركيز على النافذة
    refetchOnMount: false, // لا تعيد التحميل عند mount إذا كانت البيانات fresh
  });

  // إرسال رسالة جديدة
  const sendMessage = useMutation({
    mutationFn: async ({ content, senderType, imageFile }: { content: string; senderType: 'admin' | 'bot'; imageFile?: File }) => {
      const requestId = Math.random().toString(36).substr(2, 9);

      frontendLogger.info(`Starting message send process`, {
        requestId,
        conversationId,
        contentLength: content?.length || 0,
        senderType,
        hasImageFile: !!imageFile
      }, 'MESSAGE_SEND');

      if (!conversationId) {
        frontendLogger.error(`No conversation selected`, { requestId }, 'MESSAGE_SEND');
        throw new Error('No conversation selected');
      }

      const finalContent = content;
      let imageUrl = null;

      // رفع الصورة إذا كانت موجودة
      if (imageFile) {
        console.log(`📸 [${requestId}] رفع صورة...`);

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('conversation_id', conversationId);

        // الحصول على معلومات المحادثة أولاً للحصول على access_token
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select(`
            *,
            facebook_settings!inner(access_token, page_id)
          `)
          .eq('id', conversationId)
          .single();

        if (convError || !conversation) {
          frontendLogger.error(`Failed to get conversation for image upload`, { requestId, error: convError }, 'MESSAGE_SEND');
          throw new Error('Failed to get conversation details');
        }

        formData.append('access_token', conversation.facebook_settings.access_token);
        formData.append('recipient_id', conversation.customer_facebook_id);

        const uploadResponse = await fetch('http://localhost:3002/api/facebook/upload-and-send-image', {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.text();
          console.error(`❌ [${requestId}] خطأ في رفع الصورة:`, errorData);
          throw new Error(`Failed to upload image: ${errorData}`);
        }

        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.image_url;

        console.log(`✅ [${requestId}] تم رفع وإرسال الصورة بنجاح:`, imageUrl);

        // إذا تم إرسال صورة فقط بدون نص، نعتبر العملية مكتملة
        if (!finalContent.trim()) {
          frontendLogger.info(`Image sent successfully without text`, { requestId, imageUrl }, 'MESSAGE_SEND');
          return { success: true, imageUrl };
        }
      }

      // الحصول على معلومات المحادثة
      console.log(`🔍 [${requestId}] جلب معلومات المحادثة...`);
      const { data: conversation, error: convError } = await supabase
        // TODO: Replace with MySQL API
        // TODO: Replace with MySQL API
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error(`❌ [${requestId}] خطأ في جلب المحادثة:`, convError);
        throw new Error('Conversation fetch error: ' + convError.message);
      }

      if (!conversation) {
        console.error(`❌ [${requestId}] المحادثة غير موجودة`);
        throw new Error('Conversation not found');
      }

      console.log(`✅ [${requestId}] تم جلب معلومات المحادثة:`, {
        customer_id: conversation.customer_facebook_id,
        page_id: conversation.facebook_page_id,
        customer_name: conversation.customer_name
      });

      // إرسال الرسالة إلى Facebook إذا كانت من الأدمن
      if (senderType === 'admin') {
        console.log(`📱 [${requestId}] بدء إرسال الرسالة إلى Facebook عبر خادم API...`);
        try {
          const pageId = conversation.facebook_page_id || '240244019177739';
          console.log(`🔍 [${requestId}] معرف الصفحة: ${pageId}`);

          // جلب إعدادات الفيسبوك من خلال API
          const pageSettingsResponse = await fetch(`http://localhost:3002/api/facebook/page-settings/${pageId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!pageSettingsResponse.ok) {
            console.error(`❌ [${requestId}] خطأ في جلب إعدادات الصفحة: ${pageSettingsResponse.status}`);
            throw new Error(`Failed to get page settings: ${pageSettingsResponse.status}`);
          }
          
          const facebookSettings = await pageSettingsResponse.json();

          if (!facebookSettings || !facebookSettings.access_token) {
            console.error(`❌ [${requestId}] إعدادات Facebook غير موجودة للصفحة: ${pageId}`);
            throw new Error('Facebook settings not found for page: ' + pageId);
          }

          console.log(`✅ [${requestId}] تم جلب إعدادات Facebook للصفحة`);

          // إرسال النص إذا كان موجود (الصورة تم إرسالها بالفعل إذا كانت موجودة)
          if (finalContent.trim()) {
            console.log(`📝 [${requestId}] إرسال نص إلى Facebook...`);

            const sendTextResponse = await fetch('http://localhost:3002/api/facebook/send-message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: facebookSettings.access_token,
                recipient_id: conversation.customer_facebook_id,
                message: finalContent
              })
            });

            if (!sendTextResponse.ok) {
              const errorData = await sendTextResponse.text();
              console.error(`❌ [${requestId}] خطأ في إرسال النص:`, errorData);
              throw new Error(`Failed to send text message: ${errorData}`);
            }

            console.log(`✅ [${requestId}] تم إرسال النص بنجاح`);
          }

          console.log(`🎉 [${requestId}] تم إرسال الرسالة إلى Facebook بنجاح!`);
        } catch (facebookError) {
          console.error(`❌ [${requestId}] خطأ في إرسال الرسالة إلى Facebook:`, facebookError);
          throw new Error('Failed to send message to Facebook: ' + (facebookError instanceof Error ? facebookError.message : 'Unknown error'));
        }
      }

      // حفظ الرسالة عبر الـ API Server
      frontendLogger.apiCall('POST', `/api/conversations/${conversationId}/messages`, {
        requestId,
        contentLength: finalContent?.length || 0,
        hasImage: !!imageUrl
      });

      // الحصول على company_id
      const companyId = company?.id || '2d9b8887-0cca-430b-b61b-ca16cccfec63';

      frontendLogger.info(`Sending message with company_id`, {
        requestId,
        companyId,
        hasCompany: !!company
      }, 'MESSAGE_SEND');

      const response = await fetch(`http://localhost:3002/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: finalContent,
          sender_type: senderType,
          image_url: imageUrl,
          company_id: companyId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        frontendLogger.apiError('POST', `/api/conversations/${conversationId}/messages`, {
          requestId,
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.details || errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      frontendLogger.info(`Message sent successfully via API Server`, {
        requestId,
        messageId: data.id,
        duration: data.duration
      }, 'MESSAGE_SEND');

      return data;
    },
    onSuccess: () => {
      // تأخير التحديث لتجنب التداخل مع real-time subscription
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }, 1000); // انتظار ثانية واحدة
    }
  });

  // استمع للرسائل الجديدة والتحديثات مع تحسين لتجنب التكرار
  useEffect(() => {
    if (!conversationId) return;

    // تسجيل الاستماع لبدء عملية الاشتراك
    console.log('🔄 Setting up message subscription for conversation:', conversationId);

    let debounceTimeout: NodeJS.Timeout;
    let lastMessageId: string | null = null;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('📥 New message received via real-time:', payload);

          // تجنب معالجة نفس الرسالة مرتين
          const messageId = payload.new?.id;
          if (messageId === lastMessageId) {
            console.log('⚠️ Duplicate real-time message detected, skipping...');
            return;
          }
          lastMessageId = messageId;

          // تحديث فوري للرسائل الجديدة
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          }, 200); // تحديث سريع
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('🔄 Message updated via real-time:', payload);

          // تجنب التحديث المضاعف باستخدام debounce
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          }, 500); // انتظار 500ms قبل التحديث
        }
      )
      .subscribe((status) => {
        console.log('📢 Subscription status:', status);
      });

    return () => {
      clearTimeout(debounceTimeout);
      // TODO: Replace with MySQL API
    };
  }, [conversationId]); // إزالة queryClient من dependencies

  // تحديث حالة الرسالة مع تجنب التحديث المضاعف
  const updateMessageStatus = useMutation({
    mutationFn: async ({ messageId, status }: { messageId: string; status: string }) => {
      const { error } = await supabase
        // TODO: Replace with MySQL API
        // TODO: Replace with MySQL API
        .eq('id', messageId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // تأخير التحديث لتجنب التداخل مع real-time
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }, 800);
    }
  });

  // تحديث حالة عدة رسائل مع تجنب التحديث المضاعف
  const updateMultipleMessagesStatus = useMutation({
    mutationFn: async ({ messageIds, status }: { messageIds: string[]; status: string }) => {
      const { error } = await supabase
        // TODO: Replace with MySQL API
        // TODO: Replace with MySQL API
        .in('id', messageIds);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // تأخير التحديث لتجنب التداخل مع real-time
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }, 800);
    }
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    updateMessageStatus,
    updateMultipleMessagesStatus
  };
};
