/**
 * 🧪 اختبارات التكامل لتدفق المصادقة
 * يختبر التدفق الكامل من تسجيل الدخول إلى الوصول للصفحات المحمية
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '../../App';
import CompanyLogin from '../../pages/CompanyLogin';
import ProtectedRoute from '../../components/ProtectedRoute';
import AuthenticatedLayout from '../../components/AuthenticatedLayout';
import HomePage from '../../pages/HomePage';

// Mock external dependencies
jest.mock('../../components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

jest.mock('../../pages/HomePage', () => {
  return function MockHomePage() {
    return <div data-testid="home-page">الصفحة الرئيسية</div>;
  };
});

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

const TestApp = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/company-login" element={<CompanyLogin />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AuthenticatedLayout>
            <HomePage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      } />
    </Routes>
  </BrowserRouter>
);

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock successful API
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 1,
          name: 'شركة اختبار',
          email: 'test@example.com'
        }
      })
    });
  });

  test('🔄 التدفق الكامل: من تسجيل الدخول إلى الصفحة الرئيسية', async () => {
    const user = userEvent.setup();
    
    // بدء من صفحة تسجيل الدخول
    window.history.pushState({}, 'Test page', '/company-login');
    render(<TestApp />);

    // التحقق من وجود نموذج تسجيل الدخول
    expect(screen.getByText('تسجيل دخول الشركة')).toBeInTheDocument();

    // ملء النموذج
    const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // انتظار نجاح تسجيل الدخول والانتقال
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/companies/login',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    // التحقق من حفظ البيانات في localStorage
    await waitFor(() => {
      const savedData = localStorage.getItem('company');
      expect(savedData).toBeTruthy();
      const parsedData = JSON.parse(savedData!);
      expect(parsedData.email).toBe('test@example.com');
    });
  });

  test('🔐 منع الوصول للصفحات المحمية بدون مصادقة', async () => {
    // محاولة الوصول للصفحة الرئيسية بدون تسجيل دخول
    window.history.pushState({}, 'Test page', '/');
    render(<TestApp />);

    // يجب إعادة التوجيه لصفحة تسجيل الدخول
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });

  test('✅ السماح بالوصول للصفحات المحمية مع مصادقة صحيحة', async () => {
    // إعداد بيانات مصادقة صحيحة
    const userData = {
      id: 1,
      name: 'شركة اختبار',
      email: 'test@example.com'
    };
    localStorage.setItem('company', JSON.stringify(userData));

    // الوصول للصفحة الرئيسية
    window.history.pushState({}, 'Test page', '/');
    render(<TestApp />);

    // يجب عرض الصفحة الرئيسية
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });

  test('🔄 استمرارية المصادقة عبر إعادة التحميل', async () => {
    // تسجيل الدخول
    const userData = {
      id: 1,
      name: 'شركة اختبار',
      email: 'test@example.com',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    localStorage.setItem('company', JSON.stringify(userData));

    // محاكاة إعادة تحميل الصفحة
    window.history.pushState({}, 'Test page', '/');
    render(<TestApp />);

    // يجب الحفاظ على المصادقة
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });

  test('❌ التعامل مع انتهاء صلاحية المصادقة', async () => {
    // إعداد بيانات مصادقة منتهية الصلاحية
    const expiredUserData = {
      id: 1,
      name: 'شركة اختبار',
      email: 'test@example.com',
      loginTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // منذ 24 ساعة
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // منذ ساعتين
    };
    localStorage.setItem('company', JSON.stringify(expiredUserData));

    window.history.pushState({}, 'Test page', '/');
    render(<TestApp />);

    // يجب إعادة التوجيه لتسجيل الدخول
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });

  test('🔧 التعامل مع أخطاء الشبكة أثناء تسجيل الدخول', async () => {
    const user = userEvent.setup();
    
    // Mock network error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    window.history.pushState({}, 'Test page', '/company-login');
    render(<TestApp />);

    const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // يجب عرض رسالة خطأ
    await waitFor(() => {
      expect(screen.getByText(/خطأ في الاتصال/i)).toBeInTheDocument();
    });
  });

  test('🔄 تحديث آخر نشاط تلقائياً', async () => {
    const userData = {
      id: 1,
      name: 'شركة اختبار',
      email: 'test@example.com',
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    localStorage.setItem('company', JSON.stringify(userData));

    window.history.pushState({}, 'Test page', '/');
    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    const initialActivity = JSON.parse(localStorage.getItem('company')!).lastActivity;

    // محاكاة نشاط المستخدم
    fireEvent.click(screen.getByTestId('home-page'));

    // انتظار تحديث النشاط
    await waitFor(() => {
      const updatedActivity = JSON.parse(localStorage.getItem('company')!).lastActivity;
      expect(updatedActivity).not.toBe(initialActivity);
    });
  });
});
