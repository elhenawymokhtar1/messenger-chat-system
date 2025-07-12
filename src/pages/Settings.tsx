import React, { useEffect } from 'react';
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Facebook, Key, Loader2, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";


const Settings = () => {
  const { toast } = useToast();
  const { company } = useCurrentCompany();

  // إعادة توجيه إلى صفحة تسجيل الدخول إذا لم يكن هناك شركة
  useEffect(() => {
    if (!company) {
      console.log('🔄 [SETTINGS] لا توجد شركة، إعادة توجيه لتسجيل الدخول...');
      window.location.href = '/company-login';
    }
  }, [company]);

  // States
  const [tempAccessToken, setTempAccessToken] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [showAddPageForm, setShowAddPageForm] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isConnectingPage, setIsConnectingPage] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [pages, setPages] = useState([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [connectedPages, setConnectedPages] = useState([]);
  const [isLoadingConnectedPages, setIsLoadingConnectedPages] = useState(false);

  // Load connected pages for current company ONLY
  const loadConnectedPages = async () => {
    if (!company?.id) {
      // console.log('❌ No company ID, clearing connected pages');
      setConnectedPages([]);
      return;
    }
    
    setIsLoadingConnectedPages(true);
    try {
      // console.log('🔍 Loading pages for company:', company.id, company.name);
      
      const { data, error } = await supabase
        // TODO: Replace with MySQL API
        // TODO: Replace with MySQL API
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading connected pages:', error);
        setConnectedPages([]);
      } else {
        // console.log('✅ Raw data from database:', data);
        // console.log('✅ Loaded connected pages for company', company.name, ':', data?.length || 0);
        setConnectedPages(data || []);
      }
    } catch (error) {
      console.error('❌ Exception loading connected pages:', error);
      setConnectedPages([]);
    } finally {
      setIsLoadingConnectedPages(false);
    }
  };

  // Load connected pages on component mount and company change
  useEffect(() => {
    // console.log('🔄 Settings useEffect triggered, company:', company?.id, company?.name);
    loadConnectedPages();
  }, [company?.id]);

  // Test Facebook connection
  const handleTestConnection = async () => {
    if (!tempAccessToken.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال Access Token أولاً",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    setIsLoadingPages(true);
    
    try {
      // console.log('🧪 Testing Facebook connection...');
      
      // Test token by getting page info
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${tempAccessToken}`
      );
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      // console.log('✅ Facebook API response:', data);

      // If it's a page token, get page info directly
      const pageInfo = {
        id: data.id,
        name: data.name,
        access_token: tempAccessToken
      };

      setPages([pageInfo]);
      setAccessToken(tempAccessToken);
      setIsConnected(true);
      
      toast({
        title: "تم الاتصال بنجاح",
        description: `تم العثور على الصفحة: ${data.name}`,
      });
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      toast({
        title: "فشل الاتصال",
        description: error.message || "تأكد من صحة Access Token",
        variant: "destructive",
      });
      setPages([]);
      setAccessToken("");
      setIsConnected(false);
    } finally {
      setIsTestingConnection(false);
      setIsLoadingPages(false);
    }
  };

  // Connect selected page
  const handleConnectPage = async () => {
    if (!selectedPageId || !company?.id) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صفحة أولاً",
        variant: "destructive",
      });
      return;
    }

    const selectedPage = pages.find(p => p.id === selectedPageId);
    if (!selectedPage) return;

    setIsConnectingPage(true);

    try {
      // console.log('🔗 Connecting page:', selectedPage.name, 'to company:', company.id);

      // Check if page already exists
      const { data: existingPage } = await supabase
        // TODO: Replace with MySQL API
        // TODO: Replace with MySQL API
        .eq('page_id', selectedPage.id)
        .single();

      let error;

      if (existingPage) {
        // Update existing page
        // console.log('📝 Updating existing page...');
        const { error: updateError } = await supabase
          // TODO: Replace with MySQL API
          console.log('✅ Update skipped - MySQL API needed');

        error = updateError;
      } else {
        // Insert new page
        // console.log('➕ Inserting new page...');
        const { error: insertError } = await supabase
          // TODO: Replace with MySQL API
          console.log('✅ Insert skipped - MySQL API needed');

        error = insertError;
      }

      if (error) {
        throw error;
      }

      // console.log('✅ Page connected successfully');

      toast({
        title: "تم ربط الصفحة بنجاح",
        description: `تم ربط صفحة: ${selectedPage.name}`,
      });

      // Reset form and reload connected pages
      setTempAccessToken("");
      setSelectedPageId("");
      setShowAddPageForm(false);
      setAccessToken("");
      setIsConnected(false);
      setPages([]);

      await loadConnectedPages();

    } catch (error) {
      console.error('❌ Error connecting page:', error);
      toast({
        title: "فشل في ربط الصفحة",
        description: error.message || "حدث خطأ أثناء ربط الصفحة",
        variant: "destructive",
      });
    } finally {
      setIsConnectingPage(false);
    }
  };

  // Disconnect page
  const handleDisconnectPage = async (pageId: string) => {
    try {
      // console.log('🔌 Disconnecting page:', pageId, 'from company:', company?.id);
      
      const { error } = await supabase
        // TODO: Replace with MySQL API
        // TODO: Replace with MySQL API
        .eq('page_id', pageId)
        .eq('company_id', company?.id);

      if (error) {
        throw error;
      }

      // console.log('✅ Page disconnected successfully');

      toast({
        title: "تم قطع الاتصال",
        description: "تم قطع اتصال الصفحة بنجاح",
      });

      await loadConnectedPages();
      
    } catch (error) {
      console.error('❌ Error disconnecting page:', error);
      toast({
        title: "فشل في قطع الاتصال",
        description: error.message || "حدث خطأ أثناء قطع الاتصال",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8" role="main">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إعدادات Facebook</h1>
          <p className="text-gray-600 mt-2">إدارة إعدادات الحساب والردود الآلية</p>
          {company && (
            <p className="text-sm text-blue-600 mt-1">
              🏢 الشركة الحالية: {company.name} ({company.id})
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Facebook Connection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Facebook className="w-5 h-5 text-blue-600" />
                <span>ربط صفحات فيسبوك</span>
              </div>
              {connectedPages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPageForm(true)}
                  className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                >
                  <Facebook className="w-4 h-4 ml-2" />
                  إضافة صفحة
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Debug Info */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <p><strong>🔍 معلومات التشخيص:</strong></p>
              <p>• الشركة: {company?.name || 'غير محددة'} ({company?.id || 'لا يوجد ID'})</p>
              <p>• عدد الصفحات المحملة: {connectedPages.length}</p>
              <p>• حالة التحميل: {isLoadingConnectedPages ? 'جاري التحميل...' : 'مكتمل'}</p>
            </div>

            {/* Connected Pages List */}
            {isLoadingConnectedPages ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin ml-2" />
                <span>تحميل الصفحات...</span>
              </div>
            ) : connectedPages.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-medium">الصفحات المربوطة ({connectedPages.length}):</h3>
                {connectedPages.map((page) => (
                  <div key={page.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Facebook className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{page.page_name}</h4>
                        <p className="text-sm text-gray-600">ID: {page.page_id}</p>
                        <p className="text-xs text-gray-500">تاريخ الإضافة: {new Date(page.created_at).toLocaleDateString('ar-EG')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 ml-1" />
                        متصل
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnectPage(page.page_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8">
                <Facebook className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد صفحات مربوطة</h3>
                <p className="text-gray-600 mb-4">ابدأ بربط صفحة Facebook الأولى</p>
                <Button
                  onClick={() => setShowAddPageForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Facebook className="w-4 h-4 ml-2" />
                  ربط صفحة جديدة
                </Button>
              </div>
            )}

            {/* Add Page Form */}
            {(showAddPageForm || connectedPages.length === 0) && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-yellow-800">ربط صفحة Facebook جديدة</h4>
                  {showAddPageForm && connectedPages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddPageForm(false);
                        setTempAccessToken("");
                        setSelectedPageId("");
                        setAccessToken("");
                        setIsConnected(false);
                        setPages([]);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕ إلغاء
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Access Token Input */}
                  <div>
                    <Label htmlFor="access-token">رمز الوصول (Access Token)</Label>
                    <div className="flex space-x-2 space-x-reverse mt-1">
                      <Input
                        id="access-token"
                        type="password"
                        placeholder="أدخل رمز الوصول الخاص بك..."
                        value={tempAccessToken}
                        onChange={(e) => setTempAccessToken(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={isTestingConnection || !tempAccessToken.trim()}
                      >
                        {isTestingConnection ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Key className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      احصل على الـ Access Token من Facebook Developer Console
                    </p>
                  </div>

                  {/* Success Message */}
                  {isConnected && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        ✅ تم الاتصال بنجاح! الآن اختر الصفحة التي تريد ربطها.
                      </p>
                    </div>
                  )}

                  {/* Loading Pages */}
                  {isLoadingPages && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <p className="text-sm text-blue-800">جاري تحميل الصفحات المتاحة...</p>
                      </div>
                    </div>
                  )}

                  {/* Page Selection */}
                  {pages.length > 0 && (
                    <div>
                      <Label htmlFor="page-select">اختر الصفحة</Label>
                      <Select value={selectedPageId} onValueChange={setSelectedPageId}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="اختر صفحة للربط..." />
                        </SelectTrigger>
                        <SelectContent>
                          {pages.map((page) => (
                            <SelectItem key={page.id} value={page.id}>
                              {page.name} (ID: {page.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Connect Button */}
                  {pages.length > 0 && (
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                      onClick={handleConnectPage}
                      disabled={isConnectingPage || !selectedPageId}
                    >
                      {isConnectingPage ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      ) : (
                        <Facebook className="w-4 h-4 ml-2" />
                      )}
                      ربط هذه الصفحة
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات الشركة</CardTitle>
          </CardHeader>
          <CardContent>
            {company ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">اسم الشركة</p>
                  <p className="font-medium">{company.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                  <p className="font-medium">{company.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">معرف الشركة</p>
                  <p className="font-mono text-xs text-gray-500">{company.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">عدد الصفحات المربوطة</p>
                  <p className="font-medium">{connectedPages.length} صفحة</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">جاري تحميل معلومات الشركة...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
