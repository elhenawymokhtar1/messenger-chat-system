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

  test('🔄 يتحقق من React state للمصادقة (localStorage معطل)', () => {
    const mockCompanyData = {
      id: '2d9b8887-0cca-430b-b61b-ca16cccfec63',
      name: 'kok',
      email: 'kok@kok.com'
    };

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

  test('❌ يتعامل مع عدم وجود بيانات مصادقة', () => {
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

    expect(screen.queryByText('محتوى محمي')).not.toBeInTheDocument();
  });
});
