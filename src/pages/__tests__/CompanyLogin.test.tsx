/**
 * 🧪 اختبارات صفحة تسجيل الدخول
 * يختبر النموذج والتفاعل والمصادقة
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CompanyLogin from '../CompanyLogin';

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

jest.mock('@/lib/mysql-company-api', () => ({
  CompanyServiceMySQL: {
    login: jest.fn()
  }
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CompanyLogin', () => {
  const mockLogin = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      loading: false
    });

    global.fetch = jest.fn();
  });

  test('🎨 يعرض نموذج تسجيل الدخول بشكل صحيح', () => {
    renderWithRouter(<CompanyLogin />);

    expect(screen.getByText('تسجيل دخول الشركة')).toBeInTheDocument();
    expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/كلمة المرور/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).toBeInTheDocument();
  });

  test('✍️ يتيح إدخال البيانات في النموذج', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CompanyLogin />);

    const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  test('🔐 يرسل بيانات تسجيل الدخول عند الإرسال', async () => {
    const user = userEvent.setup();
    
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
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

    renderWithRouter(<CompanyLogin />);

    const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/companies/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );
    });
  });

  test('❌ يعرض رسالة خطأ عند فشل تسجيل الدخول', async () => {
    const user = userEvent.setup();
    
    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: 'بيانات تسجيل الدخول غير صحيحة'
      })
    });

    renderWithRouter(<CompanyLogin />);

    const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/بيانات تسجيل الدخول غير صحيحة/i)).toBeInTheDocument();
    });
  });

  test('🔄 يعرض حالة التحميل أثناء الإرسال', async () => {
    const user = userEvent.setup();
    
    // Mock delayed API response
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, data: {} })
      }), 100))
    );

    renderWithRouter(<CompanyLogin />);

    const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByText(/جاري تسجيل الدخول/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('👁️ يتيح إظهار/إخفاء كلمة المرور', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CompanyLogin />);

    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    const toggleButton = screen.getByRole('button', { name: /إظهار كلمة المرور/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('📋 يعرض بيانات الاختبار', () => {
    renderWithRouter(<CompanyLogin />);

    expect(screen.getByText(/بيانات اختبار/i)).toBeInTheDocument();
    expect(screen.getByText(/test-auth-.*@example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/123456/)).toBeInTheDocument();
  });
});
