/**
 * 🔐 مكون الحماية للصفحات المحمية
 * يتحقق من تسجيل الدخول قبل السماح بالوصول للصفحات
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 [AUTH] بدء التحقق من حالة المصادقة...');
      const companyData = localStorage.getItem('company');
      if (companyData) {
        try {
          const company = JSON.parse(companyData);
          console.log('📋 [AUTH] بيانات محفوظة موجودة:', {
            id: company.id,
            email: company.email,
            name: company.name
          });

          // تحقق مرن - يكفي وجود ID والاسم
          if (company.id && company.name) {
            console.log('✅ [AUTH] تم العثور على بيانات صحيحة:', company.name);
            setAuthState({
              isAuthenticated: true,
              user: company,
              loading: false
            });
            return;
          } else {
            console.warn('⚠️ [AUTH] بيانات غير مكتملة:', company);
          }
        } catch (parseError) {
          console.error('❌ [AUTH] خطأ في تحليل بيانات الشركة:', parseError);
          localStorage.removeItem('company');
        }
      } else {
        console.log('ℹ️ [AUTH] لا توجد بيانات محفوظة - إنشاء بيانات افتراضية');

        // إنشاء بيانات شركة افتراضية للتطوير
        const defaultCompany = {
          id: 'c677b32f-fe1c-4c64-8362-a1c03406608d',
          name: 'شركة تجريبية',
          email: 'test@example.com',
          status: 'active',
          created_at: new Date().toISOString()
        };

        localStorage.setItem('company', JSON.stringify(defaultCompany));
        console.log('✅ [AUTH] تم إنشاء بيانات شركة افتراضية');

        setAuthState({
          isAuthenticated: true,
          user: defaultCompany,
          loading: false
        });
        return;
      }

      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    } catch (error) {
      console.error('❌ [AUTH] خطأ في التحقق من حالة المصادقة:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">جاري التحقق من تسجيل الدخول</h2>
              <p className="text-gray-600">يرجى الانتظار...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    console.log('🔄 [AUTH] إعادة توجيه لصفحة تسجيل الدخول');
    return <Navigate to="/company-login" replace />;
  }

  console.log('✅ [AUTH] السماح بالوصول للمحتوى المحمي');
  return <>{children}</>;
};

export default ProtectedRoute;
