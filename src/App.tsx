import React, { useEffect, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { CartProvider } from "./contexts/CartContext";
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
import CompanyDashboard from "./pages/CompanyDashboard";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // ✅ البيانات صالحة لمدة 2 دقيقة
      cacheTime: 1000 * 60 * 10, // ✅ الاحتفاظ بالبيانات في cache لمدة 10 دقائق
      refetchOnMount: false, // ✅ لا تعيد الجلب إلا إذا كانت البيانات قديمة
      refetchOnWindowFocus: false, // ✅ عدم إعادة الجلب عند focus
      retry: 3, // ✅ إعادة المحاولة 3 مرات
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // ✅ تأخير متزايد
    },
  },
});

const App: React.FC = () => {
  useEffect(() => {
    console.log('🚀 تطبيق الرد الآلي بدأ التشغيل');
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
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
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <FacebookSettingsMySQL />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/facebook-conversations" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <Conversations />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/whatsapp-conversations" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <WhatsAppConversations />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/whatsapp" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <WhatsAppConnection />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/whatsapp-gemini-settings" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <GeminiAISettings />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/whatsapp-advanced" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <WhatsAppAdvanced />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/whatsapp-basic" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <WhatsAppBaileys />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/facebook-ai-settings" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <FacebookAISettings />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/user-management" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <UserManagement />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/subscription-plans" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <SubscriptionPlans />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/upgrade-plan" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <UpgradePlan />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/store-dashboard" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <StoreDashboard />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/subscription-management" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <SubscriptionManagement />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/new-store-management" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <NewStoreManagement />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/new-ecommerce-products" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <NewEcommerceProducts />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/simple-products" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <SimpleProducts />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              {/* إعادة توجيه /products إلى /simple-products */}
              <Route path="/products" element={<Navigate to="/simple-products" replace />} />

              <Route path="/new-categories" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <NewCategories />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/test-categories" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <TestCategories />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/simple-categories" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <SimpleCategoriesTest />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />



              {/* إعادة توجيه الصفحة القديمة للجديدة */}
              <Route path="/shop" element={<Navigate to="/new-shop" replace />} />

              <Route path="/new-shop" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <NewShop />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/new-cart" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <NewCart />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/checkout" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <Checkout />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/order-confirmation/:orderId" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <OrderConfirmation />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/orders" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <NewOrders />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/coupons" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <NewCoupons />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/shipping" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <NewShipping />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/reports" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <NewReports />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/thank-you" element={<ThankYou />} />

              <Route path="/store-setup" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <NewStoreSetup />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/product-variants" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <NewProductVariants />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              <Route path="/dashboard" element={
                <ProperProtectedRoute>
                  <AuthenticatedLayout>
                    <CompanyDashboard />
                  </AuthenticatedLayout>
                </ProperProtectedRoute>
              } />

              {/* صفحة 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
};
export default App;
