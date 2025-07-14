
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, User, Clock, MessageSquare, Loader2, Trash2, CheckCircle, AlertCircle, Archive, UserCheck } from "lucide-react";
import { useState } from "react";
import { useRealConversations } from "@/hooks/useRealConversations";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { conversationsApi } from "@/lib/mysql-api";
import { toast } from "sonner";
import { getDisplayName } from "@/utils/nameUtils";
import { formatRelativeTime } from "@/utils/timeUtils";

interface ConversationsListProps {
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
}

const ConversationsList = ({ selectedConversation, onSelectConversation }: ConversationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread'>('all');
  const [updatingNames, setUpdatingNames] = useState(false);
  const { company, isNewCompany } = useCurrentCompany();

  // مؤقتاً: استخدام companyId ثابت للاختبار
  const testCompanyId = '2d9b8887-0cca-430b-b61b-ca16cccfec63';
  const { conversations, isLoading, error, refetch } = useRealConversations(testCompanyId);

  console.log('🔧 [DEBUG] ConversationsList - company:', company);
  console.log('🔧 [DEBUG] ConversationsList - conversations:', conversations);
  console.log('🔧 [DEBUG] ConversationsList - conversations type:', typeof conversations);
  console.log('🔧 [DEBUG] ConversationsList - conversations array?:', Array.isArray(conversations));
  console.log('🔧 [DEBUG] ConversationsList - conversations length:', conversations?.length);
  console.log('🔧 [DEBUG] ConversationsList - isLoading:', isLoading);
  console.log('🔧 [DEBUG] ConversationsList - error:', error);

  // تفاصيل أكثر عن المحادثات
  if (conversations && conversations.length > 0) {
    console.log('🔧 [DEBUG] First conversation sample:', conversations[0]);
    console.log('🔧 [DEBUG] Conversations structure:', conversations.map(c => ({
      id: c.id,
      customer_name: c.customer_name,
      last_message: c.last_message,
      unread_count: c.unread_count,
      hasRequiredFields: !!(c.id && c.customer_name !== undefined && c.last_message !== undefined)
    })));
  }

  // حذف المحادثة باستخدام MySQL API
  const deleteConversation = async (conversationId: string) => {
    try {
      setDeletingConversation(conversationId);

      // ملاحظة: في MySQL، الحذف المتتالي (CASCADE) سيحذف الرسائل تلقائياً
      // لذلك نحتاج فقط لحذف المحادثة

      // TODO: إضافة API endpoint لحذف المحادثة
      // const result = await conversationsApi// TODO: Replace with MySQL API;

      // حل مؤقت: استخدام fetch مباشرة
      const response = await fetch(`http://localhost:3002/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || 'فشل في حذف المحادثة');
      }

      toast.success('تم حذف المحادثة بنجاح');

      // إذا كانت المحادثة المحذوفة هي المحددة، قم بإلغاء التحديد
      if (selectedConversation === conversationId) {
        onSelectConversation('');
      }

      // إعادة تحميل المحادثات
      refetch();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('فشل في حذف المحادثة');
    } finally {
      setDeletingConversation(null);
    }
  };

  // تحديث أسماء العملاء
  const updateCustomerNames = async () => {
    if (!company?.id) return;

    try {
      setUpdatingNames(true);

      const response = await fetch(`http://localhost:3002/api/companies/${company.id}/update-customer-names`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || 'فشل في تحديث أسماء العملاء');
      }

      const result = await response.json();

      if (result.success) {
        toast.success(`تم تحديث ${result.data.updated} اسم بنجاح`);
        refetch(); // إعادة تحميل المحادثات
      } else {
        throw new Error(result.message || 'فشل في تحديث الأسماء');
      }
    } catch (error) {
      console.error('خطأ في تحديث أسماء العملاء:', error);
      toast.error(error instanceof Error ? error.message : 'فشل في تحديث أسماء العملاء');
    } finally {
      setUpdatingNames(false);
    }
  };

  // تبسيط منطق الفلترة - مؤقتاً بدون فلترة للتشخيص
  const filteredConversations = conversations.filter(conv => {
    if (!conv) {
      console.log('❌ Conversation is null/undefined');
      return false;
    }

    if (!conv.id) {
      console.log('❌ Conversation missing ID:', conv);
      return false;
    }

    console.log('✅ Valid conversation:', {
      id: conv.id,
      customer_name: conv.customer_name,
      last_message: conv.last_message,
      unread_count: conv.unread_count
    });

    return true; // مؤقتاً: قبول جميع المحادثات الصالحة
  });

  console.log('📊 FILTER RESULTS:');
  console.log('Total conversations:', conversations.length);
  console.log('Filtered conversations:', filteredConversations.length);
  console.log('Search term:', searchTerm);
  console.log('Status filter:', statusFilter);

  // استخدام دالة التوقيت المحسنة
  const formatTimestamp = (timestamp: string) => {
    return formatRelativeTime(timestamp);
  };

  if (error) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-500">
            <p>خطأ في تحميل المحادثات</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg">المحادثات</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={updateCustomerNames}
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={updatingNames}
            >
              {updatingNames ? (
                <Loader2 className="w-3 h-3 animate-spin ml-1" />
              ) : (
                <UserCheck className="w-3 h-3 ml-1" />
              )}
              {updatingNames ? 'جاري التحديث...' : 'تحديث الأسماء'}
            </Button>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              🔄 تحديث
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="البحث في المحادثات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* فلاتر الرسائل البسيطة */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="text-xs"
          >
            <MessageSquare className="w-3 h-3 ml-1" />
            الكل ({conversations.length})
          </Button>

          <Button
            variant={statusFilter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('unread')}
            className="text-xs"
          >
            <AlertCircle className="w-3 h-3 ml-1 text-red-600" />
            غير مقروء ({conversations.filter(c => c.unread_count > 0).length})
          </Button>

        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-scroll p-0" style={{maxHeight: 'calc(100vh - 300px)'}}>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="mr-2">تحميل المحادثات...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <div className="text-center max-w-sm">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              {/* Debug info */}
              <div className="text-xs text-red-500 mb-4 p-2 bg-red-50 rounded">
                <div>Total: {conversations.length}</div>
                <div>Filtered: {filteredConversations.length}</div>
                <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                <div>Error: {error ? 'Yes' : 'No'}</div>
              </div>

              {/* رسالة مختلفة للشركات الجديدة */}
              {isNewCompany ? (
                <>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">مرحباً بك في نظامك الجديد! 🎉</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    لا توجد محادثات بعد، وهذا طبيعي تماماً للشركات الجديدة. ستظهر المحادثات هنا تلقائياً عندما يرسل العملاء رسائل عبر Facebook Messenger.
                  </p>
                  <div className="bg-green-50 p-4 rounded-lg text-right border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">🚀 خطوات البدء السريع:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• اذهب إلى الإعدادات وأضف مفاتيح Facebook API</li>
                      <li>• جرب النظام في صفحة الاختبار أولاً</li>
                      <li>• اطلب من أصدقائك إرسال رسالة لصفحتك</li>
                      <li>• راقب الردود الذكية تعمل تلقائياً!</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">لا توجد محادثات</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchTerm ?
                      `لا توجد محادثات تطابق البحث "${searchTerm}"` :
                      'لا توجد محادثات في الوقت الحالي'
                    }
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg text-right">
                    <h4 className="font-medium text-blue-800 mb-2">💡 نصائح:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• تحقق من إعدادات Facebook API</li>
                      <li>• تأكد من تفعيل الصفحات في الإعدادات</li>
                      <li>• جرب إرسال رسالة تجريبية</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {/* Debug: عرض معلومات المحادثات */}
            {console.log('🎨 [RENDER] About to render conversations:', filteredConversations.length)}
            {/* عرض المحادثات الحقيقية */}
            {filteredConversations.map((conversation) => {
              console.log('🎨 [RENDER] Rendering conversation:', conversation.id);
              return (
              <div
                key={conversation.id}
                className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                  selectedConversation === conversation.id
                    ? 'bg-blue-50 border-blue-200'
                    : conversation.unread_count > 0
                    ? 'bg-blue-25 hover:bg-blue-50 border-blue-100'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="flex items-center space-x-3 space-x-reverse flex-1 cursor-pointer"
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      {conversation.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-gray-900 ${
                        conversation.unread_count > 0
                          ? 'font-bold'
                          : 'font-medium'
                      }`}>
                        {getDisplayName(
                          conversation.customer_name,
                          conversation.participant_id,
                          conversation.id,
                          conversation.page_name
                        )}
                      </h4>
                      <div className="flex items-center space-x-1 space-x-reverse text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(conversation.last_message_time || conversation.last_message_at)}</span>
                      </div>
                      <div className="text-xs mt-1 flex items-center gap-2 flex-wrap">
                        <span className="bg-blue-100 px-2 py-1 rounded-full text-blue-600">
                          📄 {conversation.page_name ||
                              (conversation.facebook_page_id === '351400718067673' ? 'Simple A42' :
                               conversation.facebook_page_id === '240244019177739' ? 'سولا 127' :
                               'صفحة غير معروفة')}
                        </span>

                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    {/* عداد الرسائل غير المقروءة */}
                    {conversation.unread_count > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}

                    {/* زر الحذف */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingConversation === conversation.id}
                        >
                          {deletingConversation === conversation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف المحادثة</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف محادثة "{getDisplayName(conversation.customer_name, conversation.customer_facebook_id, conversation.id, conversation.page_name)}"?
                            <br />
                            سيتم حذف جميع الرسائل والطلبات المرتبطة بهذه المحادثة نهائياً.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteConversation(conversation.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div
                  className="cursor-pointer"
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <p className={`text-sm truncate ${
                    conversation.unread_count > 0
                      ? 'text-gray-900 font-semibold'
                      : 'text-gray-600'
                  }`}>
                    {(() => {
                      // إذا لم توجد رسالة
                      if (!conversation.last_message || conversation.last_message.trim() === '' || conversation.last_message === 'لا توجد رسائل') {
                        return 'لا توجد رسائل';
                      }

                      // إضافة بادئة حسب المرسل
                      const prefix = conversation.last_message_is_from_page ? 'أنت: ' : '';
                      return prefix + conversation.last_message;
                    })()}
                  </p>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversationsList;
