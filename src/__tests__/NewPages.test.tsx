import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Mock fetch
global.fetch = jest.fn();

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Wrapper component for routing
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('New Pages Basic Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // اختبار صفحة إدارة المتجر
  test('NewStoreManagement should render without crashing', async () => {
    const NewStoreManagement = require('../pages/NewStoreManagement').default;

    render(
      <TestWrapper>
        <NewStoreManagement />
      </TestWrapper>
    );

    // التحقق من حالة التحميل أولاً
    expect(screen.getByText('جاري تحميل بيانات المتجر...')).toBeInTheDocument();

    // انتظار تحميل المحتوى
    await waitFor(() => {
      expect(screen.getByText('إدارة المتجر')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // اختبار صفحة إدارة المنتجات
  test('NewEcommerceProducts should render without crashing', async () => {
    const NewEcommerceProducts = require('../pages/NewEcommerceProducts').default;

    render(
      <TestWrapper>
        <NewEcommerceProducts />
      </TestWrapper>
    );

    // التحقق من حالة التحميل أولاً
    expect(screen.getByText('جاري تحميل المنتجات...')).toBeInTheDocument();

    // انتظار تحميل المحتوى
    await waitFor(() => {
      expect(screen.getByText('إدارة المنتجات الجديدة')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // اختبار صفحة إدارة الفئات
  test('NewCategories should render without crashing', async () => {
    const NewCategories = require('../pages/NewCategories').default;
    
    render(
      <TestWrapper>
        <NewCategories />
      </TestWrapper>
    );

    expect(screen.getByText('إدارة الفئات الجديدة')).toBeInTheDocument();
  });

  // اختبار صفحة المتجر
  test('NewShop should render without crashing', async () => {
    const NewShop = require('../pages/NewShop').default;
    
    render(
      <TestWrapper>
        <NewShop />
      </TestWrapper>
    );

    expect(screen.getByText('المتجر الجديد')).toBeInTheDocument();
  });

  // اختبار صفحة السلة
  test('NewCart should render without crashing', async () => {
    const NewCart = require('../pages/NewCart').default;
    
    render(
      <TestWrapper>
        <NewCart />
      </TestWrapper>
    );

    expect(screen.getByText('السلة الجديدة')).toBeInTheDocument();
  });

  // اختبار صفحة الطلبات
  test('NewOrders should render without crashing', async () => {
    const NewOrders = require('../pages/NewOrders').default;
    
    render(
      <TestWrapper>
        <NewOrders />
      </TestWrapper>
    );

    expect(screen.getByText('إدارة الطلبات الجديدة')).toBeInTheDocument();
  });

  // اختبار صفحة الكوبونات
  test('NewCoupons should render without crashing', async () => {
    const NewCoupons = require('../pages/NewCoupons').default;
    
    render(
      <TestWrapper>
        <NewCoupons />
      </TestWrapper>
    );

    expect(screen.getByText('إدارة الكوبونات الجديدة')).toBeInTheDocument();
  });

  // اختبار صفحة الشحن
  test('NewShipping should render without crashing', async () => {
    const NewShipping = require('../pages/NewShipping').default;
    
    render(
      <TestWrapper>
        <NewShipping />
      </TestWrapper>
    );

    expect(screen.getByText('إدارة الشحن الجديدة')).toBeInTheDocument();
  });

  // اختبار صفحة التقارير
  test('NewReports should render without crashing', async () => {
    const NewReports = require('../pages/NewReports').default;
    
    render(
      <TestWrapper>
        <NewReports />
      </TestWrapper>
    );

    expect(screen.getByText('التقارير والإحصائيات الجديدة')).toBeInTheDocument();
  });

  // اختبار صفحة إعداد المتجر
  test('NewStoreSetup should render without crashing', async () => {
    const NewStoreSetup = require('../pages/NewStoreSetup').default;
    
    render(
      <TestWrapper>
        <NewStoreSetup />
      </TestWrapper>
    );

    expect(screen.getByText('إعداد المتجر الجديد')).toBeInTheDocument();
  });

  // اختبار صفحة متغيرات المنتج
  test('NewProductVariants should render without crashing', async () => {
    const NewProductVariants = require('../pages/NewProductVariants').default;
    
    render(
      <TestWrapper>
        <NewProductVariants />
      </TestWrapper>
    );

    expect(screen.getByText('متغيرات المنتج الجديدة')).toBeInTheDocument();
  });
});
