/**
 * 💬 صفحة المحادثات الحقيقية
 * تتصل بقاعدة البيانات MySQL
 */

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageSquare, User, Clock, Send, Loader2, AlertCircle, RefreshCw, Phone, Video, MoreHorizontal, Plus, Smile, Check, CheckCheck, Reply, Users, Mail } from "lucide-react";
import { useRealConversations } from "@/hooks/useRealConversations";
import { useRealMessages } from "@/hooks/useRealMessages";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { useSSE } from "@/hooks/useSSE";
import { toast } from "sonner";
import { formatTime, formatRelativeTime } from "@/utils/timeUtils";

const RealConversations = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState("");
  const [showRecentOnly, setShowRecentOnly] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(() => {
    // استرجاع التبويب المحفوظ من localStorage أو استخدام 'needs-reply' كافتراضي
    return localStorage.getItem('conversations-active-tab') || 'needs-reply';
  });

  // متغيرات دعم الصور
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // مراجع
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // دالة التمرير للأسفل
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { company, loading: companyLoading } = useCurrentCompany();

  // تفعيل التحديث الفوري عبر SSE
  const { isConnected: sseConnected } = useSSE(company?.id);

  const {
    conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations
  } = useRealConversations(company?.id);

  // تشخيص البيانات
  console.log('🔍 [DEBUG] Conversations data:', {
    conversations,
    conversationsLength: conversations?.length,
    conversationsLoading,
    conversationsError,
    companyId: company?.id
  });

  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    refetch: refetchMessages
  } = useRealMessages(selectedConversation, company?.id, showRecentOnly);

  // التمرير التلقائي عند تغيير الرسائل
  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // تشخيص الرسائل
  console.log('🔍 [DEBUG] Messages data:', {
    messages,
    messagesLength: messages?.length,
    messagesLoading,
    selectedConversation,
    companyId: company?.id
  });

  // دالة لتحديد إذا كانت المحادثة تحتاج رد
  const needsReply = (conv: any) => {
    // المحادثة تحتاج رد إذا:
    // 1. لديها رسائل غير مقروءة (رسائل من العميل)
    // 2. أو لديها رسائل حديثة وآخر رسالة في وقت قريب (خلال آخر ساعة مثلاً)
    const hasUnreadMessages = conv.unread_count > 0 || conv.unread_messages > 0;
    const hasRecentActivity = conv.recent_messages_count > 0;

    // إذا كان لديها رسائل غير مقروءة، فهي تحتاج رد بالتأكيد
    if (hasUnreadMessages) return true;

    // إذا لم تكن لديها رسائل غير مقروءة ولكن لديها نشاط حديث
    // نتحقق من وقت آخر رسالة
    if (hasRecentActivity && conv.last_message_at) {
      const lastMessageTime = new Date(conv.last_message_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

      // إذا كانت آخر رسالة خلال آخر 6 ساعات ولديها نشاط حديث
      // ولكن لا توجد رسائل غير مقروءة، فربما تحتاج متابعة
      return hoursDiff <= 6;
    }

    return false;
  };

  // دالة لتحديد إذا كانت المحادثة من الرسائل الجماعية
  const isBulkMessage = (conv: any) => {
    // المحادثة تعتبر من الرسائل الجماعية إذا:
    // 1. لديها رسائل حديثة
    // 2. ولكن لا توجد رسائل غير مقروءة (يعني آخر رسالة كانت منا)
    // 3. وآخر رسالة كانت خلال فترة قريبة (يعني من برنامج الإرسال الجماعي)
    const hasRecentMessages = conv.recent_messages_count > 0;
    const hasNoUnreadMessages = (conv.unread_count === 0 || conv.unread_count === '0') &&
                               (conv.unread_messages === 0 || conv.unread_messages === '0');

    if (!hasRecentMessages || !hasNoUnreadMessages) return false;

    // تحقق من وقت آخر رسالة - إذا كانت حديثة فهي على الأرجح من برنامج الإرسال
    if (conv.last_message_at) {
      const lastMessageTime = new Date(conv.last_message_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60);

      // إذا كانت آخر رسالة خلال آخر 24 ساعة
      return hoursDiff <= 24;
    }

    return hasRecentMessages && hasNoUnreadMessages;
  };

  // فلترة المحادثات حسب التبويب النشط
  const getFilteredConversations = () => {
    let filtered = conversations.filter(conv => {
      // فلترة البحث الأساسية
      const matchesSearch = !searchTerm ||
        (conv.customer_name && conv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (conv.last_message && conv.last_message.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (conv.customer_facebook_id && conv.customer_facebook_id.includes(searchTerm));

      const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || conv.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // فلترة حسب التبويب
    switch (activeTab) {
      case 'needs-reply':
        return filtered.filter(needsReply);
      case 'bulk-messages':
        return filtered.filter(isBulkMessage);
      case 'all':
      default:
        return filtered;
    }
  };

  const filteredConversations = getFilteredConversations();

  // حساب إحصائيات التبويبات
  const needsReplyCount = conversations.filter(needsReply).length;
  const bulkMessagesCount = conversations.filter(isBulkMessage).length;
  const allConversationsCount = conversations.length;

  // دالة لتغيير التبويب وحفظه
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    localStorage.setItem('conversations-active-tab', newTab);
  };

  // دوال معالجة الصور
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // تحقق من نوع الملف
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('نوع الملف غير مدعوم. يرجى اختيار صورة (JPG, PNG, GIF)');
        return;
      }

      // تحقق من حجم الملف (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('حجم الصورة كبير جداً. الحد الأقصى 10MB');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('تم اختيار الصورة بنجاح');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  console.log('🔍 [DEBUG] Filtered conversations:', {
    originalCount: conversations?.length,
    filteredCount: filteredConversations?.length,
    searchTerm,
    firstConversation: conversations?.[0]
  });

  const selectedConvData = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !selectedConversation || !company?.id) {
      toast.error('يرجى كتابة رسالة أو اختيار صورة');
      return;
    }

    try {
      if (selectedImage) {
        // استخدام الطريقة القديمة الناجحة - FormData مع endpoint منفصل
        setIsUploadingImage(true);
        toast.loading('جاري رفع الصورة...');

        try {
          console.log('📤 إرسال صورة باستخدام الطريقة القديمة الناجحة (base64)...');

          // تحويل الصورة إلى base64
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const base64Data = e.target?.result as string;
              console.log('📷 تم تحويل الصورة إلى base64:', base64Data.substring(0, 50) + '...');

              // إرسال الصورة باستخدام endpoint الرسائل العادي مع نوع صورة
              await sendMessage.mutateAsync({
                conversation_id: selectedConversation,
                company_id: company.id,
                message_text: newMessage.trim() || '',
                message_type: 'image',
                image_data: base64Data,
                image_name: selectedImage.name
              });

              console.log('✅ تم إرسال الصورة بنجاح باستخدام الطريقة القديمة');
              toast.success('تم إرسال الصورة بنجاح');
              setIsUploadingImage(false);
            } catch (error) {
              console.error('❌ فشل في إرسال الصورة:', error);

              // حل بديل: إرسال رسالة نصية فقط
              if (newMessage.trim()) {
                try {
                  await sendMessage.mutateAsync({
                    conversation_id: selectedConversation,
                    company_id: company.id,
                    message_text: newMessage.trim() + ' 📷 [صورة - فشل في الرفع]',
                    message_type: 'text'
                  });
                  toast.warning('تم إرسال النص، لكن فشل في رفع الصورة');
                } catch (textError) {
                  console.error('❌ فشل في إرسال النص أيضاً:', textError);
                  toast.error('فشل في إرسال الرسالة');
                }
              } else {
                toast.error('فشل في إرسال الصورة');
              }
              setIsUploadingImage(false);
            }
          };

          reader.onerror = () => {
            console.error('❌ فشل في قراءة الصورة');
            toast.error('فشل في قراءة الصورة');
            setIsUploadingImage(false);
          };

          reader.readAsDataURL(selectedImage);
        } catch (error) {
          console.error('خطأ في معالجة الصورة:', error);
          toast.error('فشل في معالجة الصورة');
          setIsUploadingImage(false);
        }
      } else {
        // إرسال رسالة نصية
        await sendMessage.mutateAsync({
          conversation_id: selectedConversation,
          company_id: company.id,
          message_text: newMessage.trim(),
          message_type: 'text'
        });
      }

      setNewMessage("");
      handleRemoveImage();
      setIsUploadingImage(false);
      // تحديث قائمة المحادثات لإظهار آخر رسالة
      refetchConversations();

      // تحديث إضافي بعد ثانية واحدة للتأكد
      setTimeout(() => {
        refetchConversations();
      }, 1000);
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      setIsUploadingImage(false);

      // رسائل خطأ مفصلة
      if (error.message.includes('network')) {
        toast.error('مشكلة في الاتصال بالإنترنت');
      } else if (error.message.includes('token')) {
        toast.error('مشكلة في صلاحيات Facebook');
      } else if (error.message.includes('upload')) {
        toast.error('فشل في رفع الصورة - تحقق من حجم ونوع الملف');
      } else {
        toast.error('فشل في إرسال الرسالة - حاول مرة أخرى');
      }
    }
  };

  // عرض حالة التحميل
  if (companyLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">تحميل بيانات الشركة...</h2>
          <p className="text-gray-600">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  // عرض خطأ عدم وجود شركة
  if (!company) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">خطأ في تحميل بيانات الشركة</h2>
          <p className="text-gray-600 mb-4">لم يتم العثور على بيانات الشركة أو حدث خطأ في الاتصال</p>
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة المحاولة
            </Button>
            <Button onClick={() => window.location.href = '/company-login'}>
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      <div className="container mx-auto px-6 py-8 h-full flex flex-col overflow-hidden">
        <div className="mb-8 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                محادثات فيسبوك
              </h1>
              <p className="text-gray-600">
                إدارة المحادثات والرد على رسائل الفيسبوك - {company.name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-500">
                  {sseConnected ? 'متصل - التحديث الفوري مفعل' : 'غير متصل - التحديث اليدوي فقط'}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                refetchConversations();
                if (selectedConversation) refetchMessages();
              }}
              disabled={conversationsLoading}
            >
              <RefreshCw className={`h-4 w-4 ml-2 ${conversationsLoading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* قائمة المحادثات */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    المحادثات ({filteredConversations.length})
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {activeTab === 'needs-reply' && needsReplyCount > 0 && (
                      <Badge variant="destructive" className="animate-pulse">
                        {needsReplyCount} يحتاج رد
                      </Badge>
                    )}
                    {activeTab === 'bulk-messages' && bulkMessagesCount > 0 && (
                      <Badge variant="secondary">
                        {bulkMessagesCount} رسالة جماعية
                      </Badge>
                    )}
                  </div>
                </CardTitle>

                {/* التبويبات */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
                    <TabsTrigger value="needs-reply" className="flex items-center gap-1 text-sm px-3 py-1.5">
                      <Reply className="h-4 w-4" />
                      يحتاج رد
                      {needsReplyCount > 0 && (
                        <Badge variant="destructive" className="ml-1 text-xs">
                          {needsReplyCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="bulk-messages" className="flex items-center gap-1 text-sm px-3 py-1.5">
                      <Mail className="h-4 w-4" />
                      رسائل جماعية
                      {bulkMessagesCount > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {bulkMessagesCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="all" className="flex items-center gap-1 text-sm px-3 py-1.5">
                      <Users className="h-4 w-4" />
                      الكل ({allConversationsCount})
                    </TabsTrigger>
                  </TabsList>

                  {/* محتوى التبويبات */}
                  <TabsContent value="needs-reply" className="mt-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="البحث في المحادثات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">جميع الحالات</option>
                        <option value="active">نشط</option>
                        <option value="pending">معلق</option>
                        <option value="resolved">محلول</option>
                        <option value="archived">مؤرشف</option>
                      </select>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">جميع الأولويات</option>
                        <option value="urgent">عاجل</option>
                        <option value="high">عالي</option>
                        <option value="normal">عادي</option>
                        <option value="low">منخفض</option>
                      </select>
                    </div>
                  </TabsContent>

                  <TabsContent value="bulk-messages" className="mt-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="البحث في المحادثات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">جميع الحالات</option>
                        <option value="active">نشط</option>
                        <option value="pending">معلق</option>
                        <option value="resolved">محلول</option>
                        <option value="archived">مؤرشف</option>
                      </select>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">جميع الأولويات</option>
                        <option value="urgent">عاجل</option>
                        <option value="high">عالي</option>
                        <option value="normal">عادي</option>
                        <option value="low">منخفض</option>
                      </select>
                    </div>
                  </TabsContent>

                  <TabsContent value="all" className="mt-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="البحث في المحادثات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">جميع الحالات</option>
                        <option value="active">نشط</option>
                        <option value="pending">معلق</option>
                        <option value="resolved">محلول</option>
                        <option value="archived">مؤرشف</option>
                      </select>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">جميع الأولويات</option>
                        <option value="urgent">عاجل</option>
                        <option value="high">عالي</option>
                        <option value="normal">عادي</option>
                        <option value="low">منخفض</option>
                      </select>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="mr-2">جاري تحميل المحادثات...</span>
                  </div>
                ) : conversationsError ? (
                  <div className="flex flex-col items-center justify-center h-32 text-red-500">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>خطأ في تحميل المحادثات</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refetchConversations}
                      className="mt-2"
                    >
                      إعادة المحاولة
                    </Button>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    {activeTab === 'needs-reply' ? (
                      <>
                        <Reply className="h-8 w-8 mb-2" />
                        <p className="text-center">
                          لا توجد محادثات تحتاج رد<br />
                          <span className="text-xs">جميع المحادثات تم الرد عليها! 🎉</span>
                        </p>
                      </>
                    ) : activeTab === 'bulk-messages' ? (
                      <>
                        <Mail className="h-8 w-8 mb-2" />
                        <p className="text-center">
                          لا توجد رسائل جماعية<br />
                          <span className="text-xs">لم يتم إرسال رسائل جماعية حديثة</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-8 w-8 mb-2" />
                        <p>لا توجد محادثات</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          setSelectedConversation(conversation.id);
                          // تحديث المحادثات عند اختيار محادثة جديدة
                          setTimeout(() => refetchConversations(), 500);
                        }}
                        className={`p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-sm ${
                          selectedConversation === conversation.id
                            ? 'bg-blue-100 border border-blue-200'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* صورة المستخدم */}
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {conversation.customer_name ?
                                conversation.customer_name.charAt(0).toUpperCase() :
                                conversation.customer_facebook_id?.slice(-2) || 'U'
                              }
                            </div>
                            {/* نقطة الاتصال */}
                            {conversation.is_online && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>

                          {/* محتوى المحادثة */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {conversation.customer_name || conversation.user_name || `مستخدم ${conversation.customer_facebook_id?.slice(-4)}`}
                                </h3>
                                {/* مؤشرات نوع المحادثة */}
                                {needsReply(conversation) && (
                                  <Badge variant="destructive" className="text-xs">
                                    <Reply className="h-3 w-3 mr-1" />
                                    يحتاج رد
                                  </Badge>
                                )}
                                {isBulkMessage(conversation) && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Mail className="h-3 w-3 mr-1" />
                                    جماعية
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {conversation.last_message_at ? formatTime(conversation.last_message_at) : ''}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600 truncate flex-1">
                                {conversation.last_message && conversation.last_message.trim() !== ''
                                  ? conversation.last_message
                                  : (conversation.last_message_type === 'image' ? '📷 صورة' : 'لا توجد رسائل')}
                              </p>

                              <div className="flex items-center gap-2">
                                {/* عداد الرسائل الحديثة */}
                                {conversation.recent_messages_count > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {conversation.recent_messages_count} حديثة
                                  </Badge>
                                )}

                                {/* عداد الرسائل غير المقروءة */}
                                {conversation.unread_messages > 0 && (
                                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-white font-semibold">
                                      {conversation.unread_messages > 9 ? '9+' : conversation.unread_messages}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* حالة المحادثة */}
                            <div className="flex items-center gap-2 mt-2">
                              {conversation.status === 'active' && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-xs text-green-600">نشط</span>
                                </div>
                              )}
                              {conversation.priority === 'urgent' && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="text-xs text-red-600">عاجل</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* نافذة الدردشة - تصميم Messenger */}
          <div className="lg:col-span-2">
            {selectedConversation && selectedConvData ? (
              <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border">
                {/* Header المحادثة */}
                <div className="flex-shrink-0 px-4 py-3 border-b bg-white rounded-t-lg">
                  <div className="flex items-center gap-3">
                    {/* صورة المستخدم */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedConvData.customer_name ?
                        selectedConvData.customer_name.charAt(0).toUpperCase() :
                        selectedConvData.customer_facebook_id?.slice(-2) || 'U'
                      }
                    </div>
                    {/* معلومات المستخدم */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {selectedConvData.customer_name || `مستخدم ${selectedConvData.customer_facebook_id?.slice(-4)}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedConvData.status === 'active' ? 'نشط' : 'غير متصل'}
                      </p>
                    </div>
                    {/* أيقونات الإجراءات */}
                    <div className="flex items-center gap-2">
                      {/* زر التبديل بين الرسائل الحديثة وجميع الرسائل */}
                      <Button
                        variant={showRecentOnly ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowRecentOnly(!showRecentOnly)}
                        className="text-xs px-2 py-1 h-7"
                      >
                        {showRecentOnly ? "حديثة فقط" : "جميع الرسائل"}
                      </Button>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <Phone className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <Video className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <MoreHorizontal className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* مؤشر نوع الرسائل المعروضة */}
                {messages.length > 0 && (
                  <div className="px-4 py-2 bg-gray-50 border-b text-center">
                    <span className="text-xs text-gray-600">
                      {showRecentOnly
                        ? `عرض ${messages.length} رسالة حديثة (آخر 24 ساعة)`
                        : `عرض ${messages.length} رسالة من جميع الرسائل`
                      }
                    </span>
                  </div>
                )}

                {/* منطقة الرسائل - تصميم Messenger */}
                <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white scroll-smooth" style={{scrollBehavior: 'smooth'}}>
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span>جاري تحميل الرسائل...</span>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">لا توجد رسائل في هذه المحادثة</p>
                      <p className="text-sm text-gray-400 mt-1">ابدأ محادثة جديدة!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message, index) => {
                        const isOutgoing = message.direction === 'outgoing';
                        const showAvatar = !isOutgoing && (index === 0 || messages[index - 1]?.direction !== 'outgoing');

                        return (
                          <div
                            key={message.id}
                            className={`flex items-end gap-2 ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                          >
                            {/* صورة المرسل */}
                            {!isOutgoing && (
                              <div className={`w-6 h-6 rounded-full flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                                <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                  {selectedConvData?.customer_name ?
                                    selectedConvData.customer_name.charAt(0).toUpperCase() :
                                    'U'
                                  }
                                </div>
                              </div>
                            )}

                            {/* فقاعة الرسالة */}
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative transition-all duration-200 hover:shadow-md ${
                                isOutgoing
                                  ? 'bg-blue-600 text-white rounded-br-md hover:bg-blue-700'
                                  : 'bg-gray-200 text-gray-900 rounded-bl-md hover:bg-gray-300'
                              }`}
                            >
                              {/* محتوى الرسالة */}
                              <div className="space-y-2">
                                {/* عرض الصورة إذا كانت موجودة */}
                                {message.image_url && (
                                  <div className="max-w-xs">
                                    <img
                                      src={message.image_url}
                                      alt="صورة مرسلة"
                                      className="rounded-lg max-w-full h-auto shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                      onClick={() => window.open(message.image_url, '_blank')}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}

                                {/* النص إذا كان موجود */}
                                {message.message_text && message.message_text !== '[صورة]' && (
                                  <p className="text-sm leading-relaxed">{message.message_text}</p>
                                )}

                                {/* إذا كانت صورة فقط بدون نص */}
                                {message.image_url && (!message.message_text || message.message_text.trim() === '') && (
                                  <p className="text-xs text-gray-500 italic">📷 صورة</p>
                                )}
                              </div>

                              {/* وقت الرسالة */}
                              <div className={`flex items-center gap-1 mt-2 ${
                                isOutgoing ? 'justify-end' : 'justify-start'
                              }`}>
                                <span className={`text-xs ${
                                  isOutgoing ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {formatTime(message.sent_at || message.created_at)}
                                </span>

                                {/* حالة الرسالة للرسائل الصادرة */}
                                {isOutgoing && (
                                  <div className="flex">
                                    {message.status === 'delivered' ? (
                                      <Check className="h-3 w-3 text-blue-100" />
                                    ) : message.status === 'read' ? (
                                      <CheckCheck className="h-3 w-3 text-blue-100" />
                                    ) : (
                                      <Clock className="h-3 w-3 text-blue-100" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* مؤشر الكتابة عندما يكتب المستخدم */}
                      {newMessage && (
                        <div className="flex items-end gap-2 justify-end mt-3">
                          <div className="bg-blue-100 rounded-2xl rounded-br-md px-4 py-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* عنصر مرجعي للتمرير التلقائي */}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* معاينة الصورة المحددة */}
                {imagePreview && (
                  <div className="flex-shrink-0 p-4 bg-blue-50 border-t border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">صورة جاهزة للإرسال</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="إزالة الصورة"
                      >
                        ✕
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <img
                        src={imagePreview}
                        alt="معاينة الصورة"
                        className="max-w-40 max-h-40 rounded-lg border border-blue-300 object-cover shadow-sm"
                      />
                    </div>
                  </div>
                )}

                {/* منطقة إرسال الرسائل - تصميم Messenger */}
                <div className="flex-shrink-0 p-4 bg-white border-t">
                  <div className="flex items-end gap-3">
                    {/* زر رفع الصور */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-8 h-8 p-0 transition-colors ${
                        selectedImage
                          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                          : 'text-gray-500 hover:text-blue-600'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                      title="رفع صورة (PNG, JPG, GIF - حد أقصى 10MB)"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>

                    {/* حقل النص */}
                    <div className="flex-1 relative">
                      <Input
                        placeholder="اكتب رسالة..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className="pr-12 py-2 rounded-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        disabled={sendMessage.isPending}
                      />

                      {/* أيقونة الإيموجي */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0 text-gray-500 hover:text-blue-600"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* زر الإرسال */}
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!newMessage.trim() && !selectedImage) || sendMessage.isPending || isUploadingImage}
                      className={`w-8 h-8 p-0 rounded-full transition-all duration-200 ${
                        (newMessage.trim() || selectedImage)
                          ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg'
                          : 'bg-gray-300'
                      }`}
                    >
                      {(sendMessage.isPending || isUploadingImage) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-white rounded-lg border">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">مرحباً بك في المحادثات</h3>
                  <p className="text-gray-500">اختر محادثة من القائمة لبدء المراسلة</p>
                  <p className="text-sm text-gray-400 mt-1">ستظهر الرسائل هنا فور اختيار المحادثة</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input مخفي لرفع الصور */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default RealConversations;