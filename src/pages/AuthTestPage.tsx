/**
 * 🧪 صفحة اختبار نظام المصادقة الصحيح
 * تعرض حالة المصادقة وتتيح اختبار النظام
 */

import React, { useState, useEffect } from 'react';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Database, 
  Key, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  LogOut,
  MessageSquare
} from 'lucide-react';

const AuthTestPage = () => {
  const { company, loading, clearCompany } = useCurrentCompany();
  const user = company;
  const isAuthenticated = !!company;
  const logout = clearCompany;
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [apiData, setApiData] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  // جلب بيانات localStorage
  useEffect(() => {
    const updateLocalStorageData = () => {
      setLocalStorageData({
        auth_token: localStorage.getItem('auth_token'),
        company_id: localStorage.getItem('company_id'),
        // إزالة البيانات القديمة الخاطئة إن وجدت
        old_company_data: localStorage.getItem('company')
      });
    };

    updateLocalStorageData();
    
    // تحديث البيانات كل ثانية
    const interval = setInterval(updateLocalStorageData, 1000);
    return () => clearInterval(interval);
  }, []);

  // جلب بيانات الشركة من API
  const fetchCompanyFromAPI = async () => {
    if (!localStorageData.company_id) return;
    
    setApiLoading(true);
    try {
      const response = await fetch(`http://localhost:3002/api/companies/${localStorageData.company_id}`);
      const data = await response.json();
      setApiData(data);
    } catch (error) {
      console.error('خطأ في جلب بيانات API:', error);
      setApiData({ error: error.message });
    } finally {
      setApiLoading(false);
    }
  };

  const clearOldData = () => {
    localStorage.removeItem('company');
    window.location.reload();
  };

  const goToConversations = () => {
    window.location.href = '/conversations-proper';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8" dir="rtl">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 اختبار نظام المصادقة الصحيح
          </h1>
          <p className="text-lg text-gray-600">
            فحص شامل لنظام المصادقة الجديد
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* حالة المصادقة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                حالة المصادقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>حالة التحميل:</span>
                  <Badge variant={loading ? "secondary" : "outline"}>
                    {loading ? "جاري التحميل..." : "مكتمل"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>حالة المصادقة:</span>
                  <Badge variant={isAuthenticated ? "default" : "destructive"}>
                    {isAuthenticated ? (
                      <><CheckCircle className="h-4 w-4 ml-1" /> مصادق عليه</>
                    ) : (
                      <><XCircle className="h-4 w-4 ml-1" /> غير مصادق</>
                    )}
                  </Badge>
                </div>

                {user && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">بيانات المستخدم:</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>الاسم:</strong> {user.name}</div>
                      <div><strong>البريد:</strong> {user.email}</div>
                      <div><strong>المعرف:</strong> {user.id}</div>
                      <div><strong>الحالة:</strong> {user.status}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* localStorage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                localStorage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Token:</span>
                  <Badge variant={localStorageData.auth_token ? "default" : "destructive"}>
                    {localStorageData.auth_token ? "موجود" : "غير موجود"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Company ID:</span>
                  <Badge variant={localStorageData.company_id ? "default" : "destructive"}>
                    {localStorageData.company_id ? "موجود" : "غير موجود"}
                  </Badge>
                </div>

                {localStorageData.old_company_data && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      يوجد بيانات شركة قديمة في localStorage (خطأ!)
                      <Button 
                        onClick={clearOldData} 
                        variant="destructive" 
                        size="sm" 
                        className="mt-2 w-full"
                      >
                        مسح البيانات القديمة
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {localStorageData.auth_token && (
                  <div className="bg-gray-50 p-3 rounded text-xs font-mono break-all">
                    <div><strong>Token:</strong> {localStorageData.auth_token.substring(0, 20)}...</div>
                    <div><strong>Company ID:</strong> {localStorageData.company_id}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* اختبار API */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              اختبار API قاعدة البيانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={fetchCompanyFromAPI} 
                disabled={!localStorageData.company_id || apiLoading}
                className="w-full"
              >
                {apiLoading ? (
                  <><RefreshCw className="h-4 w-4 ml-2 animate-spin" /> جاري الجلب...</>
                ) : (
                  <><Eye className="h-4 w-4 ml-2" /> جلب بيانات الشركة من API</>
                )}
              </Button>

              {apiData && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">نتيجة API:</h4>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(apiData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* أزرار التحكم */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={goToConversations}
            disabled={!isAuthenticated}
            className="w-full"
          >
            <MessageSquare className="h-4 w-4 ml-2" />
            الذهاب للمحادثات
          </Button>

          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة تحميل الصفحة
          </Button>

          <Button 
            onClick={logout}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>

        {/* تعليمات */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>تعليمات الاختبار</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>تأكد من أن حالة المصادقة "مصادق عليه"</li>
              <li>تأكد من وجود Token و Company ID في localStorage</li>
              <li>اضغط "جلب بيانات الشركة من API" للتأكد من عمل قاعدة البيانات</li>
              <li>اضغط "الذهاب للمحادثات" للانتقال للصفحة المحمية</li>
              <li>اضغط "إعادة تحميل الصفحة" للتأكد من عدم فقدان المصادقة</li>
              <li>إذا ظهرت بيانات قديمة، اضغط "مسح البيانات القديمة"</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthTestPage;
