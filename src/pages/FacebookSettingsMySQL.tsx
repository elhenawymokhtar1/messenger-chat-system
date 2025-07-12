/**
 * 📱 صفحة إعدادات فيسبوك - نسخة MySQL
 * تسمح بربط صفحات فيسبوك وإدارة الإعدادات
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Facebook,
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  ExternalLink,
  Settings,
  MessageCircle,
  Users,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// إعدادات API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

interface FacebookPage {
  id: string;
  company_id: string;
  page_id: string;
  page_name: string;
  access_token: string;
  is_active: boolean;
  webhook_verify_token?: string;
  auto_reply_enabled?: boolean;
  welcome_message?: string;
  created_at: string;
  updated_at: string;
}

interface FacebookPageFromAPI {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

const FacebookSettingsMySQL: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // تسجيل دخول تلقائي للتأكد من عمل الصفحة
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('🔄 [FACEBOOK-SETTINGS] تسجيل دخول تلقائي...');

      const testToken = 'test-token-c677b32f-fe1c-4c64-8362-a1c03406608d';
      const companyId = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

      localStorage.setItem('auth_token', testToken);
      localStorage.setItem('company_id', companyId);
    }
  }, []);

  // States (مبسطة - بدون Local Storage)
  const [accessToken, setAccessToken] = useState('');
  const [availablePages, setAvailablePages] = useState<FacebookPageFromAPI[]>([]);
  const [showAddPageForm, setShowAddPageForm] = useState(false);

  // ===================================
  // 🔄 React Query - جلب الصفحات المربوطة
  // ===================================
  const {
    data: connectedPages = [],
    isLoading: isLoadingConnectedPages,
    error: pagesError,
    refetch: refetchPages
  } = useQuery({
    queryKey: ['facebook-pages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('🔍 جلب صفحات Facebook للشركة:', user.id);

      const response = await fetch(`${API_BASE_URL}/api/facebook/settings?company_id=${user.id}`);

      if (!response.ok) {
        throw new Error(`فشل في جلب الصفحات: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ تم جلب', data.length, 'صفحة Facebook');

      return data as FacebookPage[];
    },
    enabled: !!user?.id,
    staleTime: 30000, // البيانات صالحة لمدة 30 ثانية
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // تحديث كل دقيقة
  });



  // ===================================
  // 🔄 React Query Mutations
  // ===================================

  // اختبار Access Token
  const testTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      console.log('🔍 اختبار Access Token...');

      const response = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${token}`);

      if (!response.ok) {
        throw new Error('فشل في الاتصال بـ Facebook');
      }

      const userData = await response.json();

      if (userData.error) {
        throw new Error(userData.error.message || 'رمز الوصول غير صحيح');
      }

      console.log('✅ تم التحقق من صحة Token:', userData);

      // التحقق من نوع الـ Token
      let pages = [];

      // إذا كان Page Token، استخدم البيانات المباشرة
      if (userData.id && userData.name) {
        // هذا Page Token - إنشاء صفحة واحدة من البيانات المتاحة
        pages = [{
          id: userData.id,
          name: userData.name,
          access_token: token,
          category: userData.category || 'صفحة',
          tasks: ['MANAGE', 'CREATE_CONTENT', 'MESSAGING']
        }];
        console.log('📄 تم اكتشاف Page Token للصفحة:', userData.name);
      } else {
        // محاولة جلب الصفحات كـ User Token
        try {
          const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`);
          const pagesData = await pagesResponse.json();

          if (pagesData.error) {
            console.log('⚠️ لا يمكن جلب الصفحات - قد يكون Page Token');
            pages = [];
          } else {
            pages = pagesData.data || [];
            console.log('📄 تم جلب الصفحات كـ User Token:', pages.length);
          }
        } catch (error) {
          console.log('⚠️ خطأ في جلب الصفحات:', error);
          pages = [];
        }
      }

      return {
        user: userData,
        pages: pages
      };
    },
    onSuccess: (data) => {
      console.log('✅ تم اختبار Token بنجاح');
      setAvailablePages(data.pages);
      setShowAddPageForm(true);

      const tokenType = data.pages.length === 1 && data.pages[0].id === data.user.id ? 'Page Token' : 'User Token';

      toast({
        title: "نجح الاتصال",
        description: `تم التحقق من ${tokenType} - ${data.pages.length} صفحة متاحة`,
      });
    },
    onError: (error: any) => {
      console.error('❌ خطأ في اختبار Token:', error);
      toast({
        title: "خطأ في الاتصال",
        description: error.message || 'فشل في اختبار رمز الوصول',
        variant: "destructive"
      });
    },
  });

  // إضافة صفحة جديدة
  const addPageMutation = useMutation({
    mutationFn: async (pageData: {
      company_id: string;
      page_id: string;
      page_name: string;
      access_token: string;
    }) => {
      console.log('📤 إضافة صفحة Facebook جديدة:', pageData.page_name);

      const response = await fetch(`${API_BASE_URL}/api/facebook/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إضافة الصفحة');
      }

      return response.json();
    },
    onSuccess: () => {
      // إعادة جلب البيانات من قاعدة البيانات
      queryClient.invalidateQueries({ queryKey: ['facebook-pages', user?.id] });

      setShowAddPageForm(false);
      setAccessToken('');
      setAvailablePages([]);

      toast({
        title: "تم بنجاح",
        description: "تم إضافة الصفحة بنجاح",
      });
    },
    onError: (error: any) => {
      console.error('❌ خطأ في إضافة الصفحة:', error);
      toast({
        title: "خطأ",
        description: error.message || 'فشل في إضافة الصفحة',
        variant: "destructive"
      });
    },
  });

  // حذف صفحة
  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      console.log('🗑️ حذف صفحة Facebook:', pageId);

      const response = await fetch(`${API_BASE_URL}/api/facebook/settings/${pageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('فشل في حذف الصفحة');
      }

      return response.json();
    },
    onSuccess: () => {
      // إعادة جلب البيانات من قاعدة البيانات
      queryClient.invalidateQueries({ queryKey: ['facebook-pages', user?.id] });

      toast({
        title: "تم الحذف",
        description: "تم حذف الصفحة بنجاح",
      });
    },
    onError: (error: any) => {
      console.error('❌ خطأ في حذف الصفحة:', error);
      toast({
        title: "خطأ",
        description: error.message || 'فشل في حذف الصفحة',
        variant: "destructive"
      });
    },
  });

  // ===================================
  // 🎯 Helper Functions
  // ===================================

  const testConnection = () => {
    if (!accessToken.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز الوصول",
        variant: "destructive"});
      return;
    }

    testTokenMutation.mutate(accessToken);
  };


  const connectPage = (page: FacebookPageFromAPI) => {
    if (!user?.id) {
      toast({
        title: "خطأ",
        description: "لا يوجد معرف شركة",
        variant: "destructive"});
      return;
    }

    addPageMutation.mutate({
      company_id: user.id,
      page_id: page.id,
      page_name: page.name,
      access_token: page.access_token
    });
  };

  const disconnectPage = (pageId: string, pageName: string) => {
    deletePageMutation.mutate(pageId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between" role="main">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Facebook className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إعدادات فيسبوك</h1>
            <p className="text-gray-600">ربط وإدارة صفحات فيسبوك</p>
          </div>
        </div>

        {/* عرض الأخطاء */}
        {pagesError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">
              ❌ خطأ في جلب الصفحات: {pagesError.message}
            </p>
          </div>
        )}

        {/* زر إعادة التحميل */}
        <Button
          onClick={() => refetchPages()}
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
          disabled={isLoadingConnectedPages}
        >
          {isLoadingConnectedPages ? (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          ) : (
            <RefreshCw className="h-4 w-4 ml-2" />
          )}
          إعادة تحميل
        </Button>
      </div>

      {/* الصفحات المربوطة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>الصفحات المربوطة</span>
            {isLoadingConnectedPages && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectedPages.length === 0 ? (
            <div className="text-center py-8">
              <Facebook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد صفحات مربوطة</p>
              <p className="text-sm text-gray-400">اربط صفحة فيسبوك للبدء</p>
            </div>
          ) : (
            <div className="space-y-4">
              {connectedPages.map((page) => (
                <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Facebook className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">{page.page_name}</h3>
                      <p className="text-sm text-gray-500">معرف الصفحة: {page.page_id}</p>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                        <Badge variant={page.is_active ? "default" : "secondary"}>
                          {page.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                        <Badge variant={page.webhook_verify_token ? "default" : "outline"}>
                          {page.webhook_verify_token ? "Webhook مفعل" : "Webhook غير مفعل"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        <MessageCircle className="h-4 w-4 inline ml-1" />
                        {page.total_messages} رسالة
                      </p>
                      {page.last_message_at && (
                        <p className="text-xs text-gray-400">
                          آخر رسالة: {new Date(page.last_message_at).toLocaleDateString('ar')}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectPage(page.page_id, page.page_name)}
                      disabled={deletePageMutation.isPending}
                    >
                      {deletePageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* إضافة صفحة جديدة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <Plus className="h-5 w-5 text-blue-600" />
            <span>إضافة صفحة جديدة</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* معلومات مفيدة */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <Key className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-2">كيفية الحصول على رمز الوصول:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>اذهب إلى <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Facebook Graph API Explorer</a></li>
                  <li>اختر تطبيقك أو أنشئ تطبيق جديد</li>
                  <li>اطلب الصلاحيات: <code className="bg-blue-100 px-1 rounded">pages_manage_metadata, pages_read_engagement, pages_messaging</code></li>
                  <li>انسخ رمز الوصول وألصقه هنا</li>
                </ol>
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      <strong>✅ يمكن استخدام:</strong> User Access Token أو Page Access Token
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>ملاحظة:</strong> إذا كان رمز الوصول منتهي الصلاحية، ستحتاج للحصول على رمز جديد من Graph API Explorer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="accessToken">رمز الوصول (Access Token)</Label>
            <div className="flex space-x-2 rtl:space-x-reverse mt-1">
              <Input
                id="accessToken"
                type="password"
                placeholder="أدخل رمز الوصول لفيسبوك"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={testConnection}
                disabled={testTokenMutation.isPending || !accessToken.trim()}
              >
                {testTokenMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                اختبار
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              احصل على رمز الوصول من 
              <a 
                href="https://developers.facebook.com/tools/explorer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mx-1"
              >
                Facebook Graph API Explorer
                <ExternalLink className="h-3 w-3 inline ml-1" />
              </a>
            </p>
          </div>

          {/* الصفحات المتاحة */}
          {availablePages.length > 0 && (
            <div>
              <Label>الصفحات المتاحة</Label>
              <div className="space-y-2 mt-2">
                {availablePages.map((page) => (
                  <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Facebook className="h-6 w-6 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{page.name}</h4>
                        <p className="text-sm text-gray-500">معرف: {page.id}</p>
                        {page.category && (
                          <p className="text-xs text-gray-400">فئة: {page.category}</p>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => connectPage(page)}
                      disabled={addPageMutation.isPending}
                      size="sm"
                    >
                      {addPageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      ربط
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* معلومات مفيدة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <Settings className="h-5 w-5 text-gray-600" />
            <span>معلومات مفيدة</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2 rtl:space-x-reverse">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p>تأكد من أن لديك صلاحيات إدارة الصفحة</p>
            </div>
            <div className="flex items-start space-x-2 rtl:space-x-reverse">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p>رمز الوصول يجب أن يحتوي على صلاحيات: pages_read_engagement, pages_manage_metadata</p>
            </div>
            <div className="flex items-start space-x-2 rtl:space-x-reverse">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p>يمكنك ربط عدة صفحات بنفس الحساب</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacebookSettingsMySQL;
