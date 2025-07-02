/**
 * 📊 بيانات تجريبية للمحادثات
 * تستخدم لعرض الصفحة بشكل صحيح
 */

export const mockConversationsData = {
  conversations: [
    {
      id: "conv-1",
      customer_name: "أحمد محمد علي",
      customer_facebook_id: "fb-123456",
      last_message: "مرحباً، أريد الاستفسار عن المنتجات المتاحة",
      last_message_at: new Date().toISOString(),
      unread_count: 3,
      is_online: true,
      page_name: "صفحة الشركة الرئيسية",
      conversation_status: "active"
    },
    {
      id: "conv-2", 
      customer_name: "سارة أحمد حسن",
      customer_facebook_id: "fb-789012",
      last_message: "شكراً لكم على الخدمة الممتازة والسريعة",
      last_message_at: new Date(Date.now() - 1800000).toISOString(),
      unread_count: 0,
      is_online: false,
      page_name: "صفحة الشركة الرئيسية",
      conversation_status: "resolved"
    },
    {
      id: "conv-3",
      customer_name: "محمد علي يوسف", 
      customer_facebook_id: "fb-345678",
      last_message: "متى سيتم توصيل الطلب؟ أنتظر منذ أسبوع",
      last_message_at: new Date(Date.now() - 3600000).toISOString(),
      unread_count: 1,
      is_online: true,
      page_name: "صفحة الشركة الرئيسية",
      conversation_status: "pending"
    }
  ],
  
  messages: {
    "conv-1": [
      {
        id: "msg-1",
        conversation_id: "conv-1",
        sender_type: "customer",
        message_text: "مرحباً",
        created_at: new Date(Date.now() - 600000).toISOString(),
        is_read: true
      },
      {
        id: "msg-2",
        conversation_id: "conv-1", 
        sender_type: "page",
        message_text: "مرحباً بك! كيف يمكنني مساعدتك؟",
        created_at: new Date(Date.now() - 300000).toISOString(),
        is_read: true
      },
      {
        id: "msg-3",
        conversation_id: "conv-1",
        sender_type: "customer",
        message_text: "أريد الاستفسار عن المنتجات المتاحة",
        created_at: new Date().toISOString(),
        is_read: false
      }
    ]
  }
};

export default mockConversationsData;