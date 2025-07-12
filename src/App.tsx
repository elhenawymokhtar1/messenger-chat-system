import React, { useEffect, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import ProperProtectedRoute from "./components/ProperProtectedRoute";
import AuthenticatedLayout from "./components/AuthenticatedLayout";

// Auth Provider - استخدام النظام البسيط
// import { AuthProvider } from "./hooks/useAuth";
import HomePage from "./pages/HomePage";
import CompanyLogin from "./pages/CompanyLogin";
import CompanyRegister from "./pages/CompanyRegister";
import CompanySwitcher from "./pages/CompanySwitcher";
import FacebookSettingsMySQL from "./pages/FacebookSettingsMySQL";
import Conversations from "./pages/Conversations";
import WhatsAppConversations from "./pages/WhatsAppConversations";
import WhatsAppConnection from "./pages/WhatsAppConnection";
import WhatsAppAdvanced from "./pages/WhatsAppAdvanced";
import WhatsAppBaileys from "./pages/WhatsAppBaileys";
import { GeminiAISettings } from "./pages/GeminiAISettings";
import { FacebookAISettings } from "./pages/FacebookAISettings";
import UserManagement from "./pages/UserManagement";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import UpgradePlan from "./pages/UpgradePlan";
import StoreDashboard from "./pages/StoreDashboard";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import NotFound from "./pages/NotFound";
import TestSimple from "./pages/TestSimple";
import SimpleLogin from "./pages/SimpleLogin";
import SimpleHome from "./pages/SimpleHome";
import SimpleCompanyLogin from "./pages/SimpleCompanyLogin";
import AuthTestPage from "./pages/AuthTestPage";

import NewStoreManagement from "./pages/NewStoreManagement";
import NewEcommerceProducts from "./pages/NewEcommerceProducts";
import SimpleProducts from "./pages/SimpleProducts";
import NewCategories from "./pages/NewCategories";
import TestCategories from "./pages/TestCategories";
import SimpleCategoriesTest from "./pages/SimpleCategoriesTest";
import SimpleCartTest from "./pages/SimpleCartTest";
import FullCartTest from "./pages/FullCartTest";
import NewShop from "./pages/NewShop";
import NewCart from "./pages/NewCart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import NewOrders from "./pages/NewOrders";
import NewCoupons from "./pages/NewCoupons";
import NewShipping from "./pages/NewShipping";
import NewReports from "./pages/NewReports";
import NewStoreSetup from "./pages/NewStoreSetup";
import ThankYou from "./pages/ThankYou";
import NewProductVariants from "./pages/NewProductVariants";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import ImageTestPage from "./pages/ImageTestPage";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminCompanyDetails from "./pages/SuperAdminCompanyDetails";
import CompaniesManagement from "./pages/CompaniesManagement";
import AuthDebug from "./pages/AuthDebug";
import TestMessages from "./pages/TestMessages";
import APITest from "./pages/APITest";
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
        <Toaster />
        <Sonner />
        <BrowserRouter>
            <Routes>
              {/* الصفحات العامة */}
              <Route path="/test" element={<TestSimple />} />
              <Route path="/test-messages" element={<TestMessages />} />
              <Route path="/test-api" element={<APITest />} />
              <Route path="/debug-api" element={<APITest />} />
              <Route path="/simple-login" element={<SimpleLogin />} />
              <Route path="/company-register" element={<CompanyRegister />} />
              <Route path="/company-login" element={<CompanyLogin />} />
              <Route path="/simple-company-login" element={<SimpleCompanyLogin />} />
              <Route path="/auth-test" element={<AuthTestPage />} />

              {/* صفحات Super Admin */}
              <Route path="/super-admin-login" element={<SuperAdminLogin />} />
              <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />
              <Route path="/super-admin-company/:companyId" element={<SuperAdminCompanyDetails />} />
              <Route path="/companies-management" element={<CompaniesManagement />} />

              {/* صفحة تشخيص المصادقة */}
              <Route path="/auth-debug" element={<AuthDebug />} />

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

              <Route path="/ecommerce-analytics" element={
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
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <HomePage />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
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

              <Route path="/whatsapp-conversations" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <WhatsAppConversations />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/whatsapp" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <WhatsAppConnection />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/whatsapp-gemini-settings" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <GeminiAISettings />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/whatsapp-advanced" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <WhatsAppAdvanced />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/whatsapp-basic" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <WhatsAppBaileys />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/facebook-ai-settings" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <FacebookAISettings />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/user-management" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <UserManagement />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/subscription-plans" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SubscriptionPlans />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/upgrade-plan" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <UpgradePlan />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/store-dashboard" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <StoreDashboard />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/subscription-management" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SubscriptionManagement />
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

              <Route path="/simple-products" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <SimpleProducts />
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

              <Route path="/checkout" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <Checkout />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/order-confirmation/:orderId" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <OrderConfirmation />
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

              <Route path="/orders" element={
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

              <Route path="/coupons" element={
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

              <Route path="/shipping" element={
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

              <Route path="/reports" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <NewReports />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/thank-you" element={<ThankYou />} />

              <Route path="/new-store-setup" element={
                <ProtectedRoute>
                  <AuthenticatedLayout>
                    <NewStoreSetup />
                  </AuthenticatedLayout>
                </ProtectedRoute>
              } />

              <Route path="/store-setup" element={
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

              <Route path="/product-variants" element={
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
      </TooltipProvider>
    </QueryClientProvider>
  );
};
export default App;
