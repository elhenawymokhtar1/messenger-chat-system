
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { conversationsApi, messagesApi } from "@/lib/mysql-api";
import { useCurrentCompany } from "./useCurrentCompany";

export interface Conversation {
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
}

// دالة للتحقق من كون الشركة جديدة (أقل من 7 أيام)
const isCompanyNew = (createdAt?: string): boolean => {
  if (!createdAt) return false;

  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

  return diffInDays <= 7; // شركة جديدة إذا كانت أقل من 7 أيام
};

export const useConversations = () => {
  const queryClient = useQueryClient();
  const { company } = useCurrentCompany();

  const { data: conversations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['conversations', company?.id],
    queryFn: async () => {
      // التأكد من وجود معلومات الشركة
      if (!company?.id) {
        console.log('❌ لا توجد معلومات شركة');
        return [];
      }

      console.log(`🔍 جلب المحادثات للشركة: ${company.name} (${company.id})`);

      // تعطيل فلترة الشركات الجديدة مؤقتاً لعرض البيانات التجريبية
      // if (isCompanyNew(company.created_at)) {
      //   console.log('🆕 شركة جديدة - لا توجد محادثات بعد');
      //   return [];
      // }

      // استخدام MySQL API لجلب المحادثات
      try {
        console.log('🔍 بدء جلب المحادثات من MySQL...', {
          companyId: company.id,
          companyName: company.name
        });

        const result = await conversationsApi.getByCompany(company.id, 50);

        console.log('📡 استجابة MySQL API:', result);

        if (result.error) {
          console.error('❌ خطأ في جلب المحادثات من MySQL:', result.error);
          throw new Error(result.error);
        }

        const conversations = result.data || [];
        console.log(`✅ تم جلب ${conversations.length} محادثة للشركة ${company.name} من MySQL`);

        if (conversations.length > 0) {
          console.log('📋 أول محادثة:', conversations[0]);
        } else {
          console.warn('⚠️ لا توجد محادثات للشركة');
        }

        return conversations;
      } catch (error) {
        console.error('💥 خطأ في جلب المحادثات من MySQL API:', error);
        throw error;
      }
    },
    staleTime: 60000, // البيانات تبقى fresh لمدة دقيقة
    cacheTime: 600000, // البيانات تبقى في الكاش لمدة 10 دقائق
    refetchOnWindowFocus: false, // لا تعيد التحميل عند التركيز على النافذة
    refetchOnMount: false, // لا تعيد التحميل عند mount إذا كانت البيانات fresh
    retry: 1, // إعادة المحاولة مرة واحدة فقط
    refetchInterval: false, // إيقاف التحديث التلقائي
  });

  // تحديث دوري للمحادثات (بدلاً من real-time)
  useEffect(() => {
    // تحديث دوري كل 30 ثانية بدلاً من real-time
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }, 30000); // كل 30 ثانية

    return () => {
      clearInterval(intervalId);
    };
  }, [queryClient]);

  // تحديث حالة المحادثة
  const updateConversationStatus = useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: string; status: string }) => {
      const { error } = await supabase
        // TODO: Replace with MySQL API
        // TODO: Replace with MySQL API
        .eq('id', conversationId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  return {
    conversations,
    isLoading,
    error,
    refetch,
    updateConversationStatus
  };
};
