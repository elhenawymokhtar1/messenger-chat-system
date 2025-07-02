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

describe('Add Product Test', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockToast.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('🛍️ اختبار إضافة منتج جديد - العملية الكاملة', async () => {
    console.log('🚀 بدء اختبار إضافة منتج جديد...');

    // Mock للحصول على البيانات الأولية (منتجات فارغة)
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: [],
          total: 0
        })
      })
      // Mock للحصول على الفئات
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: [
            { id: '1', name: 'إلكترونيات', description: 'أجهزة إلكترونية' },
            { id: '2', name: 'ملابس', description: 'ملابس رجالية ونسائية' }
          ]
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
            description: 'وصف تفصيلي للمنتج الجديد',
            short_description: 'وصف مختصر',
            sku: 'TEST-001',
            price: 299.99,
            sale_price: 249.99,
            stock_quantity: 100,
            category_id: '1',
            category_name: 'إلكترونيات',
            brand: 'علامة تجارية',
            image_url: 'https://example.com/image.jpg',
            weight: 1.5,
            is_featured: true,
            is_active: true,
            created_at: new Date().toISOString()
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

    // التحقق من وجود زر إضافة منتج
    const addButtons = screen.getAllByText('إضافة منتج جديد');
    const addButton = addButtons.find(btn => btn.tagName === 'BUTTON');
    expect(addButton).toBeInTheDocument();
    console.log('✅ زر إضافة منتج موجود');

    // النقر على زر إضافة منتج
    console.log('🖱️ النقر على زر إضافة منتج...');
    await act(async () => {
      fireEvent.click(addButton!);
    });

    // انتظار ظهور النموذج
    await waitFor(() => {
      const dialogTitle = screen.getAllByText('إضافة منتج جديد').find(el => el.tagName === 'H3');
      expect(dialogTitle).toBeInTheDocument();
    }, { timeout: 3000 });

    console.log('✅ تم فتح نموذج إضافة المنتج');

    // ملء بيانات المنتج
    console.log('📝 ملء بيانات المنتج...');

    // اسم المنتج
    const nameInput = screen.getByPlaceholderText('اسم المنتج');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'منتج اختبار جديد' } });
    });
    console.log('✅ تم إدخال اسم المنتج');

    // الوصف
    const descriptionInput = screen.getByPlaceholderText('وصف المنتج');
    await act(async () => {
      fireEvent.change(descriptionInput, { target: { value: 'وصف تفصيلي للمنتج الجديد' } });
    });
    console.log('✅ تم إدخال وصف المنتج');

    // الوصف المختصر
    const shortDescInput = screen.getByPlaceholderText('وصف مختصر');
    await act(async () => {
      fireEvent.change(shortDescInput, { target: { value: 'وصف مختصر' } });
    });
    console.log('✅ تم إدخال الوصف المختصر');

    // SKU
    const skuInput = screen.getByPlaceholderText('PROD001');
    await act(async () => {
      fireEvent.change(skuInput, { target: { value: 'TEST-001' } });
    });
    console.log('✅ تم إدخال SKU');

    // السعر
    const priceInput = screen.getByPlaceholderText('100.00');
    await act(async () => {
      fireEvent.change(priceInput, { target: { value: '299.99' } });
    });
    console.log('✅ تم إدخال السعر');

    // سعر التخفيض
    const salePriceInput = screen.getByPlaceholderText('80.00');
    await act(async () => {
      fireEvent.change(salePriceInput, { target: { value: '249.99' } });
    });
    console.log('✅ تم إدخال سعر التخفيض');

    // كمية المخزون
    const stockInput = screen.getByPlaceholderText('50');
    await act(async () => {
      fireEvent.change(stockInput, { target: { value: '100' } });
    });
    console.log('✅ تم إدخال كمية المخزون');

    // العلامة التجارية
    const brandInput = screen.getByPlaceholderText('العلامة التجارية');
    await act(async () => {
      fireEvent.change(brandInput, { target: { value: 'علامة تجارية' } });
    });
    console.log('✅ تم إدخال العلامة التجارية');

    // رابط الصورة
    const imageInput = screen.getByPlaceholderText('https://example.com/image.jpg');
    await act(async () => {
      fireEvent.change(imageInput, { target: { value: 'https://example.com/image.jpg' } });
    });
    console.log('✅ تم إدخال رابط الصورة');

    // الوزن
    const weightInput = screen.getByPlaceholderText('1.0');
    await act(async () => {
      fireEvent.change(weightInput, { target: { value: '1.5' } });
    });
    console.log('✅ تم إدخال الوزن');

    // تفعيل المنتج المميز
    const featuredCheckbox = screen.getByRole('checkbox', { name: /منتج مميز/i });
    await act(async () => {
      fireEvent.click(featuredCheckbox);
    });
    console.log('✅ تم تفعيل المنتج المميز');

    // حفظ المنتج
    console.log('💾 حفظ المنتج...');
    const saveButton = screen.getByText('إضافة المنتج');
    
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // انتظار إرسال الطلب
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3); // جلب المنتجات + جلب الفئات + إضافة المنتج
    }, { timeout: 5000 });

    console.log('✅ تم إرسال طلب إضافة المنتج');

    // التحقق من استدعاء API بالبيانات الصحيحة
    const createProductCall = (fetch as jest.Mock).mock.calls[2];
    expect(createProductCall[0]).toContain('/api/products');
    expect(createProductCall[1].method).toBe('POST');
    
    const requestBody = JSON.parse(createProductCall[1].body);
    expect(requestBody.name).toBe('منتج اختبار جديد');
    expect(requestBody.sku).toBe('TEST-001');
    expect(requestBody.price).toBe(299.99);
    expect(requestBody.stock_quantity).toBe(100);

    console.log('✅ تم التحقق من بيانات الطلب');

    // التحقق من ظهور رسالة النجاح
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "نجح",
        description: "تم إضافة المنتج بنجاح",
        variant: "default"
      });
    }, { timeout: 3000 });

    console.log('✅ تم عرض رسالة النجاح');

    console.log('🎉 اكتمل اختبار إضافة المنتج بنجاح!');
  });

  test('❌ اختبار التحقق من صحة البيانات', async () => {
    console.log('🚀 بدء اختبار التحقق من صحة البيانات...');

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
    const addButtons = screen.getAllByText('إضافة منتج جديد');
    const addButton = addButtons.find(btn => btn.tagName === 'BUTTON');
    await act(async () => {
      fireEvent.click(addButton!);
    });

    await waitFor(() => {
      const dialogTitle = screen.getAllByText('إضافة منتج جديد').find(el => el.tagName === 'H3');
      expect(dialogTitle).toBeInTheDocument();
    });

    // محاولة الحفظ بدون ملء البيانات المطلوبة
    const saveButton = screen.getByText('إضافة المنتج');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // التحقق من عدم إرسال الطلب
    expect(fetch).toHaveBeenCalledTimes(1); // فقط طلب جلب البيانات الأولي

    console.log('✅ تم منع إرسال الطلب مع بيانات ناقصة');
  });

  test('🔄 اختبار معالجة أخطاء API', async () => {
    console.log('🚀 بدء اختبار معالجة أخطاء API...');

    // Mock للحصول على البيانات الأولية
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })
      // Mock لخطأ في إنشاء المنتج
      .mockRejectedValueOnce(new Error('Network error'));

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

    // فتح النموذج وملء البيانات الأساسية
    const addButton = screen.getByText('إضافة منتج جديد');
    await act(async () => {
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('إضافة منتج جديد')).toBeInTheDocument();
    });

    // ملء البيانات الأساسية
    const nameInput = screen.getByPlaceholderText('اسم المنتج');
    const skuInput = screen.getByPlaceholderText('PROD001');
    const priceInput = screen.getByPlaceholderText('100.00');
    const stockInput = screen.getByPlaceholderText('50');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'منتج اختبار' } });
      fireEvent.change(skuInput, { target: { value: 'TEST-ERROR' } });
      fireEvent.change(priceInput, { target: { value: '100' } });
      fireEvent.change(stockInput, { target: { value: '10' } });
    });

    // محاولة الحفظ
    const saveButton = screen.getByText('إضافة المنتج');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // انتظار معالجة الخطأ
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "خطأ",
        description: "فشل في إضافة المنتج",
        variant: "destructive"
      });
    }, { timeout: 3000 });

    console.log('✅ تم التعامل مع خطأ API بشكل صحيح');
  });
});
