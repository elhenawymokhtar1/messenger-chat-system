/**
 * 📡 Hook للتحديث الفوري باستخدام Server-Sent Events (SSE)
 * يستقبل التحديثات الفورية من الخادم عند وصول رسائل جديدة
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SSEMessage {
  type: 'connected' | 'new_message' | 'message_updated' | 'conversation_updated';
  message?: string;
  conversation_id?: string;
  messageData?: {
    id: string;
    content: string;
    sender_type: 'customer' | 'admin';
    timestamp: string;
  };
}

export const useSSE = (companyId?: string) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const handleSSEMessage = useCallback((event: MessageEvent) => {
    try {
      const data: SSEMessage = JSON.parse(event.data);
      console.log('📡 [SSE] تم استلام تحديث:', data);

      switch (data.type) {
        case 'connected':
          console.log('✅ [SSE] متصل بنجاح');
          reconnectAttempts.current = 0;
          break;

        case 'new_message':
          console.log('💬 [SSE] رسالة جديدة:', data);
          
          // تحديث فوري للرسائل
          if (data.conversation_id) {
            queryClient.invalidateQueries({
              queryKey: ['real-messages', data.conversation_id]
            });
            
            // إجبار إعادة جلب الرسائل فوراً
            queryClient.refetchQueries({
              queryKey: ['real-messages', data.conversation_id]
            });
          }

          // تحديث قائمة المحادثات
          queryClient.invalidateQueries({
            queryKey: ['real-conversations', companyId]
          });
          
          // إجبار إعادة جلب المحادثات فوراً
          queryClient.refetchQueries({
            queryKey: ['real-conversations', companyId]
          });

          // إظهار إشعار للرسائل الواردة من العملاء
          if (data.messageData?.sender_type === 'customer') {
            toast.success('رسالة جديدة من العميل', {
              description: data.messageData.content.substring(0, 50) + '...',
              duration: 3000
            });
          }
          break;

        case 'message_updated':
          console.log('🔄 [SSE] تحديث رسالة:', data);
          
          if (data.conversation_id) {
            queryClient.invalidateQueries({
              queryKey: ['real-messages', data.conversation_id]
            });
          }
          break;

        case 'conversation_updated':
          console.log('🔄 [SSE] تحديث محادثة:', data);
          
          queryClient.invalidateQueries({
            queryKey: ['real-conversations', companyId]
          });
          break;

        default:
          console.log('❓ [SSE] نوع تحديث غير معروف:', data.type);
      }
    } catch (error) {
      console.error('❌ [SSE] خطأ في معالجة الرسالة:', error);
    }
  }, [queryClient, companyId]);

  const connect = useCallback(() => {
    if (!companyId) {
      console.log('⚠️ [SSE] لا يوجد معرف شركة، تخطي الاتصال');
      return;
    }

    if (eventSourceRef.current) {
      console.log('⚠️ [SSE] اتصال موجود بالفعل، إغلاق الاتصال القديم');
      eventSourceRef.current.close();
    }

    console.log(`📡 [SSE] محاولة الاتصال للشركة: ${companyId}`);
    
    try {
      const eventSource = new EventSource(`http://localhost:3002/api/sse/${companyId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ [SSE] تم فتح الاتصال');
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = handleSSEMessage;

      eventSource.onerror = (error) => {
        console.error('❌ [SSE] خطأ في الاتصال:', error);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('🔄 [SSE] الاتصال مغلق، محاولة إعادة الاتصال...');
          
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            
            console.log(`🔄 [SSE] إعادة المحاولة ${reconnectAttempts.current}/${maxReconnectAttempts} خلال ${delay}ms`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error('❌ [SSE] فشل في إعادة الاتصال بعد عدة محاولات');
            toast.error('فقدان الاتصال مع الخادم', {
              description: 'قد لا تظهر الرسائل الجديدة فوراً'
            });
          }
        }
      };

    } catch (error) {
      console.error('❌ [SSE] خطأ في إنشاء الاتصال:', error);
    }
  }, [companyId, handleSSEMessage]);

  const disconnect = useCallback(() => {
    console.log('🔌 [SSE] قطع الاتصال');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    reconnectAttempts.current = 0;
  }, []);

  useEffect(() => {
    if (companyId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [companyId, connect, disconnect]);

  // تنظيف عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    reconnect: connect,
    disconnect
  };
};
