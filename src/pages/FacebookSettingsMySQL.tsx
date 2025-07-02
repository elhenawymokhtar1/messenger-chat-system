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
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FacebookPage {
  id: string;
  company_id: string;
  page_id: string;
  page_name: string;
  access_token: string;
  is_active: boolean;
  webhook_verified: boolean;
  total_messages: number;
  last_message_at?: string;
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
  
  // States
  const [accessToken, setAccessToken] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isConnectingPage, setIsConnectingPage] = useState(false);
  const [availablePages, setAvailablePages] = useState<FacebookPageFromAPI[]>([]);
  const [connectedPages, setConnectedPages] = useState<FacebookPage[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isLoadingConnectedPages, setIsLoadingConnectedPages] = useState(false);
  const [showAddPageForm, setShowAddPageForm] = useState(false);

  // تحميل الصفحات المربوطة
  const loadConnectedPages = async () => {
    if (!user?.id) {
      // console.log('❌ لا يوجد معرف شركة');
      setConnectedPages([]);
      return;
    }
    
    setIsLoadingConnectedPages(true);
    try {
      // console.log('🔍 تحميل الصفحات للشركة:', user.id, user.name);
      
      const response = await fetch(`http://localhost:3002/api/facebook/settings?company_id=${user.id}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📄 Facebook Settings Response:', data);

      // API يعيد البيانات مباشرة كـ array
      if (Array.isArray(data)) {
        setConnectedPages(data);
        console.log(`✅ تم تحميل ${data.length} صفحة`);
      } else if (data.success) {
        setConnectedPages(data.data || []);
        console.log(`✅ تم تحميل ${data.data?.length || 0} صفحة`);
      } else {
        console.error('❌ خطأ في تحميل الصفحات:', data.error);
        setConnectedPages([]);
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل الصفحات:', error);
      setConnectedPages([]);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الصفحات المربوطة",
        variant: "destructive"});
    } finally {
      setIsLoadingConnectedPages(false);
    }
  };

  // اختبار الاتصال وجلب الصفحات
  const testConnection = async () => {
    if (!accessToken.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز الوصول",
        variant: "destructive"});
      return;
    }

    setIsTestingConnection(true);
    setAvailablePages([]);
    
    try {
      // console.log('🔍 اختبار الاتصال مع فيسبوك...');
      
      // اختبار صحة الرمز
      console.log('🔍 اختبار رمز الوصول...');
      const userResponse = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`);

      if (!userResponse.ok) {
        throw new Error(`HTTP ${userResponse.status}: فشل في الاتصال بـ Facebook`);
      }

      const userData = await userResponse.json();

      if (userData.error) {
        console.error('❌ Facebook User API Error:', userData.error);
        throw new Error(userData.error.message || 'رمز الوصول غير صحيح');
      }

      console.log('✅ رمز الوصول صحيح للمستخدم:', userData.name || userData.id);
      
      // جلب الصفحات
      console.log('🔍 جلب صفحات Facebook...');
      const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);

      let pagesData;

      if (!pagesResponse.ok) {
        const errorText = await pagesResponse.text();
        console.error('❌ Facebook Pages API Error:', {
          status: pagesResponse.status,
          statusText: pagesResponse.statusText,
          response: errorText
        });

        // محاولة تحليل الخطأ كـ JSON
        try {
          pagesData = JSON.parse(errorText);
        } catch {
          throw new Error(`HTTP ${pagesResponse.status}: فشل في جلب الصفحات - ${pagesResponse.statusText}`);
        }
      } else {
        pagesData = await pagesResponse.json();
      }

      if (pagesData.error) {
        console.error('❌ Facebook Pages API Error:', pagesData.error);
        console.log('🔍 تحليل نوع الخطأ:', {
          code: pagesData.error.code,
          message: pagesData.error.message,
          includesAccounts: pagesData.error.message?.includes('accounts'),
          includesPage: pagesData.error.message?.includes('Page')
        });

        // معالجة أخطاء محددة
        if (pagesData.error.code === 190) {
          throw new Error('رمز الوصول منتهي الصلاحية أو غير صحيح. يرجى الحصول على رمز جديد.');
        } else if (pagesData.error.code === 200) {
          throw new Error('رمز الوصول لا يملك الصلاحيات المطلوبة لجلب الصفحات.');
        } else if (pagesData.error.code === 100 && (
          pagesData.error.message.includes('accounts') ||
          pagesData.error.message.includes('nonexisting field')
        )) {
          // هذا Page Token وليس User Token - نحاول الحصول على معلومات الصفحة مباشرة
          console.log('🔄 رمز الوصول من نوع Page Token، محاولة الحصول على معلومات الصفحة مباشرة...');

          const pageInfo = {
            id: userData.id,
            name: userData.name,
            access_token: accessToken
          };

          setAvailablePages([pageInfo]);

          toast({
            title: "نجح الاتصال! ✅",
            description: `تم العثور على صفحة: ${pageInfo.name} (Page Token)`,
            variant: "default"
          });

          console.log(`✅ تم جلب معلومات الصفحة: ${pageInfo.name}`);
          return; // الخروج من الدالة
        } else {
          throw new Error(pagesData.error.message || 'فشل في جلب الصفحات');
        }
      }

      // التحقق من وجود البيانات
      const pages = pagesData.data || [];
      console.log('📄 Facebook Pages Response:', {
        total: pages.length,
        pages: pages.map(p => ({ id: p.id, name: p.name }))
      });

      setAvailablePages(pages);

      if (pages.length === 0) {
        toast({
          title: "نجح الاتصال! ✅",
          description: "لم يتم العثور على صفحات Facebook. تأكد من أن لديك صفحات أو أن رمز الوصول يملك الصلاحيات المطلوبة.",
          variant: "default"
        });
      } else {
        toast({
          title: "نجح الاتصال! 🎉",
          description: `تم العثور على ${pages.length} صفحة`
        });
      }

      console.log(`✅ تم جلب ${pages.length} صفحة`);
      
    } catch (error) {
      console.error('❌ خطأ في الاتصال:', error);
      toast({
        title: "فشل الاتصال",
        description: error.message || "تحقق من رمز الوصول",
        variant: "destructive"});
    } finally {
      setIsTestingConnection(false);
    }
  };

  // ربط صفحة
  const connectPage = async (page: FacebookPageFromAPI) => {
    if (!user?.id) {
      toast({
        title: "خطأ",
        description: "لا يوجد معرف شركة",
        variant: "destructive"});
      return;
    }

    setIsConnectingPage(true);
    
    try {
      // console.log('🔗 ربط الصفحة:', page.name);
      
      const response = await fetch('http://localhost:3002/api/facebook/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'},
        body: JSON.stringify({
          company_id: user.id,
          page_id: page.id,
          page_name: page.name,
          access_token: page.access_token})});
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "تم ربط الصفحة! 🎉",
          description: `تم ربط صفحة ${page.name} بنجاح`});
        
        // إعادة تحميل الصفحات المربوطة
        await loadConnectedPages();
        
        // إزالة الصفحة من القائمة المتاحة
        setAvailablePages(prev => prev.filter(p => p.id !== page.id));
        
        // console.log('✅ تم ربط الصفحة بنجاح');
      } else {
        throw new Error(data.error || 'فشل في ربط الصفحة');
      }
      
    } catch (error) {
      console.error('❌ خطأ في ربط الصفحة:', error);
      toast({
        title: "فشل ربط الصفحة",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"});
    } finally {
      setIsConnectingPage(false);
    }
  };

  // إلغاء ربط صفحة
  const disconnectPage = async (pageId: string, pageName: string) => {
    try {
      // console.log('🔌 إلغاء ربط الصفحة:', pageName);
      
      const response = await fetch(`http://localhost:3002/api/facebook/settings/${pageId}`, {
        method: 'DELETE'});
      
      if (response.ok) {
        toast({
          title: "تم إلغاء الربط",
          description: `تم إلغاء ربط صفحة ${pageName}`});
        
        // إعادة تحميل الصفحات المربوطة
        await loadConnectedPages();
        
        // console.log('✅ تم إلغاء ربط الصفحة');
      } else {
        throw new Error('فشل في إلغاء ربط الصفحة');
      }
      
    } catch (error) {
      console.error('❌ خطأ في إلغاء ربط الصفحة:', error);
      toast({
        title: "فشل إلغاء الربط",
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive"});
    }
  };

  // تحميل الصفحات المربوطة عند تحميل المكون
  useEffect(() => {
    loadConnectedPages();
  }, [user?.id]);

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center space-x-3 rtl:space-x-reverse" role="main">
        <Facebook className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إعدادات فيسبوك</h1>
          <p className="text-gray-600">ربط وإدارة صفحات فيسبوك</p>
        </div>
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
                        <Badge variant={page.webhook_verified ? "default" : "outline"}>
                          {page.webhook_verified ? "Webhook مفعل" : "Webhook غير مفعل"}
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
                    >
                      <Trash2 className="h-4 w-4" />
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
                disabled={isTestingConnection || !accessToken.trim()}
              >
                {isTestingConnection ? (
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
                      disabled={isConnectingPage}
                      size="sm"
                    >
                      {isConnectingPage ? (
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
