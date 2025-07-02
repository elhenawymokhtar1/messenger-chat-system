/**
 * 🧪 اختبارات مكون ProtectedRoute
 * يختبر حماية المسارات والمصادقة
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

const MockedComponent = () => <div>محتوى محمي</div>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('🔍 يعرض شاشة التحميل أثناء التحقق من المصادقة', () => {
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: true
    });

    renderWithRouter(
      <ProtectedRoute>
        <MockedComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('جاري التحقق من تسجيل الدخول')).toBeInTheDocument();
    expect(screen.getByText('يرجى الانتظار...')).toBeInTheDocument();
  });

  test('🔐 يعيد التوجيه لصفحة تسجيل الدخول عند عدم المصادقة', async () => {
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false
    });

    renderWithRouter(
      <ProtectedRoute>
        <MockedComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });

  test('✅ يعرض المحتوى المحمي عند المصادقة الناجحة', () => {
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, name: 'شركة اختبار', email: 'test@example.com' },
      loading: false
    });

    renderWithRouter(
      <ProtectedRoute>
        <MockedComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('محتوى محمي')).toBeInTheDocument();
  });

  test('🔄 يتحقق من localStorage للمصادقة', () => {
    const mockCompanyData = {
      id: 1,
      name: 'شركة اختبار',
      email: 'test@example.com'
    };

    localStorage.setItem('company', JSON.stringify(mockCompanyData));

    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: mockCompanyData,
      loading: false
    });

    renderWithRouter(
      <ProtectedRoute>
        <MockedComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('محتوى محمي')).toBeInTheDocument();
  });

  test('❌ يتعامل مع بيانات localStorage التالفة', () => {
    localStorage.setItem('company', 'invalid-json');

    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      loading: false
    });

    renderWithRouter(
      <ProtectedRoute>
        <MockedComponent />
      </ProtectedRoute>
    );

    expect(localStorage.removeItem).toHaveBeenCalledWith('company');
  });
});
