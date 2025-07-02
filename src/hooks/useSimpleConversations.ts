/**
 * 💬 Hook محادثات مبسط
 * يعمل بدون أخطاء مع بيانات تجريبية
 */

import { useState, useEffect } from 'react';

export interface SimpleConversation {
  id: string;
  customer_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_online: boolean;
  page_name: string;
}

export const useSimpleConversations = () => {
  const [conversations, setConversations] = useState<SimpleConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // محاكاة تحميل البيانات
    const loadConversations = async () => {
      try {
        setIsLoading(true);
        
        // محاكاة تأخير API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData: SimpleConversation[] = [
          {
            id: "1",
            customer_name: "أحمد محمد",
            last_message: "مرحباً، أريد الاستفسار عن المنتج",
            last_message_at: new Date().toISOString(),
            unread_count: 2,
            is_online: true,
            page_name: "صفحة الشركة"
          },
          {
            id: "2",
            customer_name: "سارة أحمد", 
            last_message: "شكراً لكم على الخدمة الممتازة",
            last_message_at: new Date(Date.now() - 3600000).toISOString(),
            unread_count: 0,
            is_online: false,
            page_name: "صفحة الشركة"
          }
        ];
        
        setConversations(mockData);
        setError(null);
      } catch (err) {
        setError('فشل في تحميل المحادثات');
        console.error('خطأ في تحميل المحادثات:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  return {
    conversations,
    isLoading,
    error,
    refetch: () => {
      // إعادة تحميل البيانات
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };
};