import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import NewEcommerceProducts from '../pages/NewEcommerceProducts';

// Mock fetch
global.fetch = jest.fn();

// Mock toast
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
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

describe('Simple Add Product Test', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockToast.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('🛍️ اختبار إضافة منتج جديد - مبسط', async () => {
    console.log('🚀 بدء اختبار إضافة منتج جديد مبسط...');

    // Mock للحصول على البيانات الأولية
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: []
        })
      })
      // Mock لإنشاء المنتج الجديد
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'new-product-123',
            name: 'منتج اختبار جديد',
            sku: 'TEST-001',
            price: 299.99,
            stock_quantity: 100
          }
        })
      });

    console.log('📱 عرض صفحة إدارة المنتجات...');

    await act(async () => {
      render(
        <TestWrapper>
          <NewEcommerceProducts />
        </TestWrapper>
      );
    });

    // انتظار تحميل الصفحة
    await waitFor(() => {
      expect(screen.getByText('إدارة المنتجات الجديدة')).toBeInTheDocument();
    }, { timeout: 5000 });

    console.log('✅ تم تحميل الصفحة بنجاح');

    // البحث عن زر إضافة منتج
    const addButton = screen.getByRole('button', { name: /إضافة منتج جديد/i });
    expect(addButton).toBeInTheDocument();
    console.log('✅ زر إضافة منتج موجود');

    // النقر على زر إضافة منتج
    console.log('🖱️ النقر على زر إضافة منتج...');
    await act(async () => {
      fireEvent.click(addButton);
    });

    // انتظار ظهور النموذج
    await waitFor(() => {
      expect(screen.getByPlaceholderText('اسم المنتج')).toBeInTheDocument();
    }, { timeout: 3000 });

    console.log('✅ تم فتح نموذج إضافة المنتج');

    // ملء البيانات الأساسية فقط
    console.log('📝 ملء البيانات الأساسية...');

    const nameInput = screen.getByPlaceholderText('اسم المنتج');
    const skuInput = screen.getByPlaceholderText('PROD001');
    const priceInput = screen.getByPlaceholderText('100.00');
    const stockInput = screen.getByPlaceholderText('50');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'منتج اختبار جديد' } });
      fireEvent.change(skuInput, { target: { value: 'TEST-001' } });
      fireEvent.change(priceInput, { target: { value: '299.99' } });
      fireEvent.change(stockInput, { target: { value: '100' } });
    });

    console.log('✅ تم ملء البيانات الأساسية');

    // حفظ المنتج
    console.log('💾 حفظ المنتج...');
    const saveButton = screen.getByText('إضافة المنتج');
    
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // انتظار إرسال الطلب
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2); // جلب المنتجات + إضافة المنتج
    }, { timeout: 5000 });

    console.log('✅ تم إرسال طلب إضافة المنتج');

    // التحقق من استدعاء API بالبيانات الصحيحة
    const createProductCall = (fetch as jest.Mock).mock.calls[1];
    expect(createProductCall[0]).toContain('/api/products');
    expect(createProductCall[1].method).toBe('POST');
    
    const requestBody = JSON.parse(createProductCall[1].body);
    expect(requestBody.name).toBe('منتج اختبار جديد');
    expect(requestBody.sku).toBe('TEST-001');
    expect(requestBody.price).toBe(299.99);
    expect(requestBody.stock_quantity).toBe(100);

    console.log('✅ تم التحقق من بيانات الطلب');

    console.log('🎉 اكتمل اختبار إضافة المنتج بنجاح!');
  });

  test('📋 اختبار فتح نموذج الإضافة', async () => {
    console.log('🚀 بدء اختبار فتح نموذج الإضافة...');

    // Mock للحصول على البيانات الأولية
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    await act(async () => {
      render(
        <TestWrapper>
          <NewEcommerceProducts />
        </TestWrapper>
      );
    });

    // انتظار تحميل الصفحة
    await waitFor(() => {
      expect(screen.getByText('إدارة المنتجات الجديدة')).toBeInTheDocument();
    });

    // النقر على زر إضافة منتج
    const addButton = screen.getByRole('button', { name: /إضافة منتج جديد/i });
    await act(async () => {
      fireEvent.click(addButton);
    });

    // التحقق من ظهور حقول النموذج
    await waitFor(() => {
      expect(screen.getByPlaceholderText('اسم المنتج')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('PROD001')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('100.00')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('50')).toBeInTheDocument();
    });

    console.log('✅ تم فتح النموذج وعرض جميع الحقول');
  });

  test('🔍 اختبار التحقق من الحقول المطلوبة', async () => {
    console.log('🚀 بدء اختبار التحقق من الحقول المطلوبة...');

    // Mock للحصول على البيانات الأولية
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    await act(async () => {
      render(
        <TestWrapper>
          <NewEcommerceProducts />
        </TestWrapper>
      );
    });

    // انتظار تحميل الصفحة
    await waitFor(() => {
      expect(screen.getByText('إدارة المنتجات الجديدة')).toBeInTheDocument();
    });

    // فتح النموذج
    const addButton = screen.getByRole('button', { name: /إضافة منتج جديد/i });
    await act(async () => {
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('اسم المنتج')).toBeInTheDocument();
    });

    // محاولة الحفظ بدون ملء البيانات
    const saveButton = screen.getByText('إضافة المنتج');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // التحقق من عدم إرسال الطلب
    expect(fetch).toHaveBeenCalledTimes(1); // فقط طلب جلب البيانات الأولي

    console.log('✅ تم منع إرسال الطلب مع بيانات ناقصة');
  });

  test('📊 اختبار عرض الإحصائيات', async () => {
    console.log('🚀 بدء اختبار عرض الإحصائيات...');

    // Mock للحصول على منتجات موجودة
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: [
          { id: '1', name: 'منتج 1', price: 100, stock_quantity: 50, is_featured: true },
          { id: '2', name: 'منتج 2', price: 200, stock_quantity: 30, is_featured: false }
        ]
      })
    });

    await act(async () => {
      render(
        <TestWrapper>
          <NewEcommerceProducts />
        </TestWrapper>
      );
    });

    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(screen.getByText('إدارة المنتجات الجديدة')).toBeInTheDocument();
    });

    // التحقق من عرض الإحصائيات
    await waitFor(() => {
      expect(screen.getByText('إجمالي المنتجات')).toBeInTheDocument();
      expect(screen.getByText('المنتجات المميزة')).toBeInTheDocument();
      expect(screen.getByText('المنتجات النشطة')).toBeInTheDocument();
      expect(screen.getByText('إجمالي القيمة')).toBeInTheDocument();
    });

    console.log('✅ تم عرض الإحصائيات بنجاح');
  });
});
