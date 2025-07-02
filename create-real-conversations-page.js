/**
 * 🔧 إنشاء صفحة محادثات حقيقية مع API
 * تتصل بقاعدة البيانات MySQL الحقيقية
 */

import fs from 'fs';

class RealConversationsPageCreator {
  constructor() {
    this.fixes = [];
    this.errors = [];
  }

  log(level, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ar-EG');
    const emoji = {
      'info': 'ℹ️',
      'fix': '🔧',
      'success': '✅',
      'fail': '❌',
      'warn': '⚠️'
    }[level] || '📝';

    console.log(`${emoji} [${timestamp}] ${message}`);
    if (details) {
      console.log(`   📋 التفاصيل: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async createRealConversationsPage() {
    console.log('🔧 بدء إنشاء صفحة محادثات حقيقية مع API...\n');
    this.log('info', 'إنشاء صفحة محادثات حقيقية');

    // 1. إنشاء صفحة محادثات حقيقية
    await this.createRealConversationsComponent();

    // 2. إنشاء hook محادثات حقيقي
    await this.createRealConversationsHook();

    // 3. إنشاء hook رسائل حقيقي
    await this.createRealMessagesHook();

    // 4. تحديث useCurrentCompany للعمل مع MySQL
    await this.updateCurrentCompanyHook();

    this.generateReport();
  }

  async createRealConversationsComponent() {
    this.log('fix', 'إنشاء مكون محادثات حقيقي...');

    const realPageContent = `/**
 * 💬 صفحة المحادثات الحقيقية
 * تتصل بقاعدة البيانات MySQL
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, MessageSquare, User, Clock, Send, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useRealConversations } from "@/hooks/useRealConversations";
import { useRealMessages } from "@/hooks/useRealMessages";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { toast } from "sonner";

const RealConversations = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const { company, loading: companyLoading } = useCurrentCompany();
  const {
    conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
    refetch: refetchConversations
  } = useRealConversations(company?.id);

  const {
    messages,
    isLoading: messagesLoading,
    sendMessage,
    refetch: refetchMessages
  } = useRealMessages(selectedConversation, company?.id);

  // فلترة المحادثات حسب البحث
  const filteredConversations = conversations.filter(conv =>
    conv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConvData = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !company?.id) {
      toast.error('يرجى كتابة رسالة صحيحة');
      return;
    }

    try {
      await sendMessage.mutateAsync({
        conversation_id: selectedConversation,
        company_id: company.id,
        message_text: newMessage.trim(),
        message_type: 'text'
      });

      setNewMessage("");
      // تحديث قائمة المحادثات لإظهار آخر رسالة
      refetchConversations();
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      toast.error('فشل في إرسال الرسالة');
    }
  };

  // عرض حالة التحميل
  if (companyLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>جاري تحميل بيانات الشركة...</p>
        </div>
      </div>
    );
  }

  // عرض خطأ عدم وجود شركة
  if (!company) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">خطأ في تحميل بيانات الشركة</h3>
          <p className="text-gray-600 mb-4">يرجى تسجيل الدخول مرة أخرى</p>
          <Button onClick={() => window.location.href = '/company-login'}>
            تسجيل الدخول
          </Button>
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
            </div>
            <Button
              variant="outline"
              onClick={() => {
                refetchConversations();
                if (selectedConversation) refetchMessages();
              }}
              disabled={conversationsLoading}
            >
              <RefreshCw className={\`h-4 w-4 ml-2 \${conversationsLoading ? 'animate-spin' : ''}\`} />
              تحديث
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* قائمة المحادثات */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  المحادثات ({filteredConversations.length})
                </CardTitle>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث في المحادثات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
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
                    <MessageSquare className="h-8 w-8 mb-2" />
                    <p>لا توجد محادثات</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={\`p-4 rounded-lg border cursor-pointer transition-colors \${
                          selectedConversation === conversation.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white hover:bg-gray-50'
                        }\`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {conversation.customer_name || 'مستخدم غير معروف'}
                            </span>
                            {conversation.is_online && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {conversation.last_message || 'لا توجد رسائل'}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{conversation.page_name || 'صفحة فيسبوك'}</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {conversation.last_message_at ?
                                new Date(conversation.last_message_at).toLocaleTimeString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'غير محدد'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* نافذة الدردشة */}
          <div className="lg:col-span-2">
            {selectedConversation && selectedConvData ? (
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-8 w-8 text-gray-500" />
                      <div>
                        <h3 className="font-semibold">
                          {selectedConvData.customer_name || 'مستخدم غير معروف'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {selectedConvData.page_name || 'صفحة فيسبوك'}
                        </p>
                      </div>
                    </div>
                    {selectedConvData.is_online && (
                      <Badge variant="outline" className="text-green-600">
                        متصل الآن
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="mr-2">جاري تحميل الرسائل...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>لا توجد رسائل في هذه المحادثة</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={\`flex \${
                              message.sender_type === 'customer' ? 'justify-start' : 'justify-end'
                            }\`}
                          >
                            <div
                              className={\`max-w-xs lg:max-w-md px-4 py-2 rounded-lg \${
                                message.sender_type === 'customer'
                                  ? 'bg-gray-100 text-gray-900'
                                  : 'bg-blue-500 text-white'
                              }\`}
                            >
                              <p className="text-sm">{message.message_text}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {new Date(message.created_at).toLocaleTimeString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>

                <div className="flex-shrink-0 border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="اكتب رسالتك..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                      rows={1}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                      className="self-end"
                    >
                      {sendMessage.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    اضغط Enter للإرسال، Shift+Enter لسطر جديد
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">اختر محادثة</h3>
                  <p>اختر محادثة من القائمة لبدء الرد على الرسائل</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealConversations;`;

    try {
      // إنشاء نسخة احتياطية
      if (fs.existsSync('src/pages/Conversations.tsx')) {
        fs.copyFileSync('src/pages/Conversations.tsx', 'src/pages/Conversations.tsx.simple-backup');
      }

      fs.writeFileSync('src/pages/Conversations.tsx', realPageContent);
      this.fixes.push('تم إنشاء صفحة محادثات حقيقية');
      this.log('success', 'تم إنشاء صفحة محادثات حقيقية');
    } catch (error) {
      this.errors.push(`فشل إنشاء الصفحة الحقيقية: ${error.message}`);
      this.log('fail', 'فشل إنشاء الصفحة الحقيقية', { error: error.message });
    }
  }

  async createRealConversationsHook() {
    this.log('fix', 'إنشاء hook محادثات حقيقي...');

    const realHookContent = `/**
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

      if (!response.success) {
        throw new Error(response.error || 'فشل في جلب المحادثات');
      }

      console.log('✅ تم جلب المحادثات:', response.data?.length || 0);
      return response.data || [];
    },
    enabled: !!companyId,
    refetchInterval: 30000, // تحديث كل 30 ثانية
    staleTime: 10000, // البيانات صالحة لمدة 10 ثوان
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    conversations,
    isLoading,
    error,
    refetch
  };
};`;

    try {
      fs.writeFileSync('src/hooks/useRealConversations.ts', realHookContent);
      this.fixes.push('تم إنشاء hook محادثات حقيقي');
      this.log('success', 'تم إنشاء hook محادثات حقيقي');
    } catch (error) {
      this.errors.push(`فشل إنشاء hook المحادثات: ${error.message}`);
      this.log('fail', 'فشل إنشاء hook المحادثات', { error: error.message });
    }
  }

  async createRealMessagesHook() {
    this.log('fix', 'إنشاء hook رسائل حقيقي...');

    const realMessagesHookContent = `/**
 * 📨 Hook رسائل حقيقي
 * يتصل بـ API الحقيقي لجلب وإرسال الرسائل
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesApi } from "@/lib/mysql-api";
import { toast } from "sonner";

export interface RealMessage {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'page' | 'system';
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'sticker' | 'audio';
  facebook_message_id?: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  attachments?: any[];
}

export const useRealMessages = (conversationId?: string, companyId?: string) => {
  const queryClient = useQueryClient();

  // جلب الرسائل
  const {
    data: messages = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['real-messages', conversationId, companyId],
    queryFn: async () => {
      if (!conversationId || !companyId) {
        return [];
      }

      console.log('🔍 جلب الرسائل للمحادثة:', conversationId);

      const response = await messagesApi.getMessages(conversationId, companyId);

      if (!response.success) {
        throw new Error(response.error || 'فشل في جلب الرسائل');
      }

      console.log('✅ تم جلب الرسائل:', response.data?.length || 0);
      return response.data || [];
    },
    enabled: !!conversationId && !!companyId,
    refetchInterval: 5000, // تحديث كل 5 ثوان
    staleTime: 2000, // البيانات صالحة لمدة ثانيتين
  });

  // إرسال رسالة
  const sendMessage = useMutation({
    mutationFn: async (messageData: {
      conversation_id: string;
      company_id: string;
      message_text: string;
      message_type?: string;
    }) => {
      console.log('📤 إرسال رسالة:', messageData);

      const response = await messagesApi.sendMessage(messageData);

      if (!response.success) {
        throw new Error(response.error || 'فشل في إرسال الرسالة');
      }

      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log('✅ تم إرسال الرسالة بنجاح');

      // تحديث قائمة الرسائل
      queryClient.invalidateQueries({
        queryKey: ['real-messages', variables.conversation_id]
      });

      // تحديث قائمة المحادثات لإظهار آخر رسالة
      queryClient.invalidateQueries({
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
};`;

    try {
      fs.writeFileSync('src/hooks/useRealMessages.ts', realMessagesHookContent);
      this.fixes.push('تم إنشاء hook رسائل حقيقي');
      this.log('success', 'تم إنشاء hook رسائل حقيقي');
    } catch (error) {
      this.errors.push(`فشل إنشاء hook الرسائل: ${error.message}`);
      this.log('fail', 'فشل إنشاء hook الرسائل', { error: error.message });
    }
  }

  async updateCurrentCompanyHook() {
    this.log('fix', 'تحديث hook الشركة الحالية...');

    try {
      const currentHookPath = 'src/hooks/useCurrentCompany.ts';
      let content = fs.readFileSync(currentHookPath, 'utf8');

      // إضافة console.log للتشخيص
      if (!content.includes('console.log')) {
        content = content.replace(
          'const loadCompany = async () => {',
          `const loadCompany = async () => {
        console.log('🔍 useCurrentCompany: بدء تحميل بيانات الشركة...');`
        );

        content = content.replace(
          'setCompany(companyData);',
          `setCompany(companyData);
        console.log('✅ useCurrentCompany: تم تحميل بيانات الشركة:', companyData?.name);`
        );

        fs.writeFileSync(currentHookPath, content);
        this.fixes.push('تم تحديث hook الشركة الحالية');
        this.log('success', 'تم تحديث hook الشركة الحالية');
      }

    } catch (error) {
      this.errors.push(`فشل تحديث hook الشركة: ${error.message}`);
      this.log('fail', 'فشل تحديث hook الشركة', { error: error.message });
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 تقرير إنشاء صفحة محادثات حقيقية');
    console.log('='.repeat(80));

    console.log(`\n📊 النتائج:`);
    console.log(`  ✅ الإصلاحات المطبقة: ${this.fixes.length}`);
    console.log(`  ❌ الأخطاء: ${this.errors.length}`);

    if (this.fixes.length > 0) {
      console.log(`\n✅ الإصلاحات المطبقة:`);
      this.fixes.forEach(fix => {
        console.log(`  • ${fix}`);
      });
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ الأخطاء:`);
      this.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }

    console.log(`\n🎯 النتيجة:`);
    if (this.errors.length === 0) {
      console.log('  🎉 تم إنشاء صفحة محادثات حقيقية بنجاح!');
      console.log('  🔗 الصفحة الآن تتصل بقاعدة البيانات MySQL');
      console.log('  📡 تستخدم API حقيقي لجلب وإرسال الرسائل');
    } else {
      console.log('  ⚠️ تحتاج المزيد من الإصلاحات');
    }

    console.log(`\n💡 التوصيات:`);
    console.log('  • تأكد من تشغيل خادم API: npm run server');
    console.log('  • تأكد من اتصال قاعدة البيانات MySQL');
    console.log('  • إعادة تشغيل الخادم: npm run dev');
    console.log('  • زيارة الصفحة: http://localhost:8080/facebook-conversations');

    console.log(`\n🔧 إنشاء صفحة محادثات حقيقية اكتمل!`);
  }
}

// تشغيل إنشاء الصفحة الحقيقية
const creator = new RealConversationsPageCreator();
creator.createRealConversationsPage().catch(error => {
  console.error('💥 خطأ في إنشاء الصفحة الحقيقية:', error);
  process.exit(1);
});