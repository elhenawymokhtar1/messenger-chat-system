/**
 * 🔧 صفحة تشخيص المصادقة
 * للتحقق من حالة localStorage وبيانات المصادقة
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const AuthDebug: React.FC = () => {
  const [localStorageData, setLocalStorageData] = useState<any>(null);
  const [rawData, setRawData] = useState<string>('');
  const { isAuthenticated, user, login, logout } = useAuth();

  const refreshData = () => {
    const companyData = localStorage.getItem('company');
    setRawData(companyData || 'لا توجد بيانات');
    
    if (companyData) {
      try {
        const parsed = JSON.parse(companyData);
        setLocalStorageData(parsed);
      } catch (error) {
        setLocalStorageData({ error: 'خطأ في تحليل البيانات' });
      }
    } else {
      setLocalStorageData(null);
    }
  };

  const testLogin = () => {
    const testCompany = {
      id: 'company-2',
      name: 'شركة تجريبية',
      email: 'test@company.com',
      phone: '+201111111111',
      status: 'active'
    };
    login(testCompany);
    setTimeout(refreshData, 100);
  };

  const clearStorage = () => {
    localStorage.removeItem('company');
    logout();
    setTimeout(refreshData, 100);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔧 تشخيص المصادقة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={refreshData} variant="outline">
                🔄 تحديث البيانات
              </Button>
              <Button onClick={testLogin} variant="default">
                🧪 اختبار تسجيل الدخول
              </Button>
              <Button onClick={clearStorage} variant="destructive">
                🗑️ مسح البيانات
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📊 حالة useAuth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>مصادق:</span>
                  <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                    {isAuthenticated ? '✅ نعم' : '❌ لا'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>المستخدم:</span>
                  <span>{user ? user.name || 'غير محدد' : 'لا يوجد'}</span>
                </div>
                <div className="flex justify-between">
                  <span>الإيميل:</span>
                  <span>{user ? user.email || 'غير محدد' : 'لا يوجد'}</span>
                </div>
                <div className="flex justify-between">
                  <span>المعرف:</span>
                  <span>{user ? user.id || 'غير محدد' : 'لا يوجد'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>💾 localStorage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">البيانات المحللة:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                    {localStorageData ? JSON.stringify(localStorageData, null, 2) : 'لا توجد بيانات'}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">البيانات الخام:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-20">
                    {rawData}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🧪 اختبارات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>localStorage متاح:</span>
                <span className="text-green-600">✅ نعم</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>JSON.parse يعمل:</span>
                <span className={localStorageData && !localStorageData.error ? 'text-green-600' : 'text-red-600'}>
                  {localStorageData && !localStorageData.error ? '✅ نعم' : '❌ لا'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>البيانات مكتملة:</span>
                <span className={localStorageData && localStorageData.id && localStorageData.name ? 'text-green-600' : 'text-red-600'}>
                  {localStorageData && localStorageData.id && localStorageData.name ? '✅ نعم' : '❌ لا'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthDebug;
