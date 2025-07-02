import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('Pages Load Tests', () => {
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

  // اختبار تحميل الصفحات بدون أخطاء
  test('All new pages should load without errors', async () => {
    const pages = [
      { name: 'NewStoreManagement', path: '../pages/NewStoreManagement' },
      { name: 'NewEcommerceProducts', path: '../pages/NewEcommerceProducts' },
      { name: 'NewCategories', path: '../pages/NewCategories' },
      { name: 'NewShop', path: '../pages/NewShop' },
      { name: 'NewCart', path: '../pages/NewCart' },
      { name: 'NewOrders', path: '../pages/NewOrders' },
      { name: 'NewCoupons', path: '../pages/NewCoupons' },
      { name: 'NewShipping', path: '../pages/NewShipping' },
      { name: 'NewReports', path: '../pages/NewReports' },
      { name: 'NewStoreSetup', path: '../pages/NewStoreSetup' },
      { name: 'NewProductVariants', path: '../pages/NewProductVariants' }
    ];

    for (const page of pages) {
      try {
        const PageComponent = require(page.path).default;
        
        const { unmount } = render(
          <TestWrapper>
            <PageComponent />
          </TestWrapper>
        );

        // التحقق من أن الصفحة تحتوي على محتوى
        expect(document.body).toHaveTextContent(/جاري تحميل|تحميل|loading/i);
        
        // تنظيف
        unmount();
        
        console.log(`✅ ${page.name} loaded successfully`);
      } catch (error) {
        console.error(`❌ ${page.name} failed to load:`, error);
        throw error;
      }
    }
  });

  // اختبار أن الصفحات تحتوي على العناصر الأساسية
  test('Pages should contain basic UI elements', async () => {
    const NewStoreManagement = require('../pages/NewStoreManagement').default;
    
    render(
      <TestWrapper>
        <NewStoreManagement />
      </TestWrapper>
    );

    // التحقق من وجود عناصر أساسية
    expect(document.querySelector('div')).toBeInTheDocument();
    expect(document.body).toHaveTextContent(/./); // أي محتوى نصي
  });

  // اختبار أن fetch يتم استدعاؤه
  test('Pages should make API calls', async () => {
    const NewEcommerceProducts = require('../pages/NewEcommerceProducts').default;
    
    render(
      <TestWrapper>
        <NewEcommerceProducts />
      </TestWrapper>
    );

    // انتظار قصير للسماح للـ useEffect بالتشغيل
    await new Promise(resolve => setTimeout(resolve, 100));

    // التحقق من استدعاء fetch
    expect(fetch).toHaveBeenCalled();
  });

  // اختبار معالجة الأخطاء
  test('Pages should handle API errors gracefully', async () => {
    // محاكاة خطأ في API
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const NewCategories = require('../pages/NewCategories').default;
    
    // يجب ألا يرمي خطأ حتى لو فشل API
    expect(() => {
      render(
        <TestWrapper>
          <NewCategories />
        </TestWrapper>
      );
    }).not.toThrow();
  });

  // اختبار أن الصفحات تحتوي على الاتجاه الصحيح (RTL)
  test('Pages should have RTL direction', async () => {
    const NewShop = require('../pages/NewShop').default;
    
    render(
      <TestWrapper>
        <NewShop />
      </TestWrapper>
    );

    // التحقق من وجود dir="rtl"
    const rtlElement = document.querySelector('[dir="rtl"]');
    expect(rtlElement).toBeInTheDocument();
  });

  // اختبار أن الصفحات تحتوي على أيقونات
  test('Pages should contain icons', async () => {
    const NewCart = require('../pages/NewCart').default;
    
    render(
      <TestWrapper>
        <NewCart />
      </TestWrapper>
    );

    // التحقق من وجود SVG (أيقونات)
    const svgElement = document.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  // اختبار أن الصفحات تحتوي على أزرار
  test('Pages should contain interactive elements', async () => {
    const NewOrders = require('../pages/NewOrders').default;
    
    render(
      <TestWrapper>
        <NewOrders />
      </TestWrapper>
    );

    // التحقق من وجود عناصر تفاعلية
    const interactiveElements = document.querySelectorAll('button, input, select, textarea');
    expect(interactiveElements.length).toBeGreaterThan(0);
  });
});
