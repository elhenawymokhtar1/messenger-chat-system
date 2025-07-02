import React, { useEffect, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import ProperProtectedRoute from "./components/ProperProtectedRoute";
import AuthenticatedLayout from "./components/AuthenticatedLayout";

// Auth Provider
import { AuthProvider } from "./hooks/useSimpleProperAuth";
import HomePage from "./pages/HomePage";
import CompanyLogin from "./pages/CompanyLogin";
import CompanyRegister from "./pages/CompanyRegister";
import FacebookSettingsMySQL from "./pages/FacebookSettingsMySQL";
import Conversations from "./pages/Conversations";
import NotFound from "./pages/NotFound";
import TestSimple from "./pages/TestSimple";
import SimpleLogin from "./pages/SimpleLogin";
import SimpleHome from "./pages/SimpleHome";
import SimpleCompanyLogin from "./pages/SimpleCompanyLogin";
import AuthTestPage from "./pages/AuthTestPage";
import StoreManagement from "./pages/StoreManagement";
import NewStoreManagement from "./pages/NewStoreManagement";
import NewEcommerceProducts from "./pages/NewEcommerceProducts";
import NewCategories from "./pages/NewCategories";
import TestCategories from "./pages/TestCategories";
import SimpleCategoriesTest from "./pages/SimpleCategoriesTest";
import SimpleCartTest from "./pages/SimpleCartTest";
import FullCartTest from "./pages/FullCartTest";
import NewShop from "./pages/NewShop";
import NewCart from "./pages/NewCart";
import NewOrders from "./pages/NewOrders";
import NewCoupons from "./pages/NewCoupons";
import NewShipping from "./pages/NewShipping";
import NewReports from "./pages/NewReports";
import NewStoreSetup from "./pages/NewStoreSetup";
import NewProductVariants from "./pages/NewProductVariants";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import ImageTestPage from "./pages/ImageTestPage";
const CompanyDashboard = React.lazy(() => import("./pages/CompanyDashboard"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // البيانات تعتبر قديمة فوراً
      cacheTime: 1000 * 60 * 5, // الاحتفاظ بالبيانات في cache لمدة 5 دقائق
      refetchOnMount: true, // إعادة جلب البيانات عند mount
      refetchOnWindowFocus: false, // عدم إعادة الجلب عند focus
      retry: 3, // إعادة المحاولة 3 مرات
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // تأخير متزايد
    },
  },
});

const App: React.FC = () => {
  useEffect(() => {
    console.log('🚀 تطبيق الرد الآلي بدأ التشغيل');
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* الصفحات العامة */}
            <Route path="/test" element={<TestSimple />} />
            <Route path="/simple-login" element={<SimpleLogin />} />
            <Route path="/company-register" element={<CompanyRegister />} />
            <Route path="/company-login" element={<CompanyLogin />} />
            <Route path="/simple-company-login" element={<SimpleCompanyLogin />} />
            <Route path="/auth-test" element={<AuthTestPage />} />

            {/* صفحة اختبار الصور */}
            <Route path="/image-test" element={
              <ProperProtectedRoute>
                <AuthenticatedLayout>
                  <ImageTestPage />
                </AuthenticatedLayout>
              </ProperProtectedRoute>
            } />

            {/* صفحة محادثات مباشرة للاختبار */}
            <Route path="/conversations-direct" element={
              <AuthenticatedLayout>
                <Conversations />
              </AuthenticatedLayout>
            } />

            {/* صفحة محادثات بالنظام الصحيح */}
            <Route path="/conversations-proper" element={
              <ProperProtectedRoute>
                <AuthenticatedLayout>
                  <Conversations />
                </AuthenticatedLayout>
              </ProperProtectedRoute>
            } />

            {/* صفحة تحليل الأداء */}
            <Route path="/analytics" element={
              <ProperProtectedRoute>
                <AuthenticatedLayout>
                  <AnalyticsPage />
                </AuthenticatedLayout>
              </ProperProtectedRoute>
            } />

            {/* صفحة الإعدادات */}
            <Route path="/settings" element={
              <ProperProtectedRoute>
                <AuthenticatedLayout>
                  <SettingsPage />
                </AuthenticatedLayout>
              </ProperProtectedRoute>
            } />

            {/* الصفحات المحمية */}
            <Route path="/" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <HomePage />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/facebook-settings" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <FacebookSettingsMySQL />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/facebook-conversations" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Conversations />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/store-management" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <StoreManagement />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/new-store-management" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <NewStoreManagement />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/new-ecommerce-products" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <NewEcommerceProducts />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/new-categories" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <NewCategories />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/test-categories" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <TestCategories />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/simple-categories" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <SimpleCategoriesTest />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/simple-cart" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <SimpleCartTest />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/full-cart" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <FullCartTest />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/new-shop" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <NewShop />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/new-cart" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <NewCart />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/new-orders" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <NewOrders />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/new-coupons" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <NewCoupons />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/new-shipping" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <NewShipping />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/new-reports" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <NewReports />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/new-store-setup" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <NewStoreSetup />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/new-product-variants" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <NewProductVariants />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            <Route path="/company-dashboard" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Suspense fallback={<div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>}>
                    <CompanyDashboard />
                  </Suspense>
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />


            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <CompanyDashboard />
                </AuthenticatedLayout>
              </ProtectedRoute>
            } />

            {/* صفحة 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
export default App;
