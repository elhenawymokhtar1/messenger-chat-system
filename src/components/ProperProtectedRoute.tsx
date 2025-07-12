/**
 * 🔐 مكون الحماية الصحيح
 * يستخدم نظام المصادقة الصحيح مع قاعدة البيانات
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { Card, CardContent } from '@/components/ui/card';

interface ProperProtectedRouteProps {
  children: React.ReactNode;
}

const ProperProtectedRoute: React.FC<ProperProtectedRouteProps> = ({ children }) => {
  const { company, loading } = useCurrentCompany();

  // عرض شاشة التحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                جاري التحقق من تسجيل الدخول
              </h2>
              <p className="text-gray-600">يرجى الانتظار...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // إعادة توجيه لتسجيل الدخول إذا لم توجد شركة
  if (!company) {
    console.log('🔄 [ProperProtectedRoute] إعادة توجيه لصفحة تسجيل الدخول - لا توجد شركة');
    return <Navigate to="/company-login" replace />;
  }

  console.log('✅ [ProperProtectedRoute] السماح بالوصول للمحتوى المحمي للشركة:', company.name);
  return <>{children}</>;
};

export default ProperProtectedRoute;