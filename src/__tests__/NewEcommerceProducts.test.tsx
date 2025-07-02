import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import NewEcommerceProducts from '../pages/NewEcommerceProducts';

// Mock fetch
global.fetch = jest.fn();

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Wrapper component for routing
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('NewEcommerceProducts', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // اختبار 1: تحميل الصفحة
  test('should render page title and loading state', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    render(
      <TestWrapper>
        <NewEcommerceProducts />
      </TestWrapper>
    );

    // التحقق من وجود العنوان
    expect(screen.getByText('إدارة المنتجات الجديدة')).toBeInTheDocument();
    
    // التحقق من وجود زر الإضافة
    expect(screen.getByText('إضافة منتج جديد')).toBeInTheDocument();
  });

  // اختبار 2: عرض المنتجات
  test('should display products when loaded', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'منتج تجريبي',
        description: 'وصف المنتج',
        sku: 'TEST001',
        price: 100,
        stock_quantity: 50,
        is_active: true,
        category_name: 'فئة تجريبية'
      }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockProducts })
    });

    render(
      <TestWrapper>
        <NewEcommerceProducts />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('منتج تجريبي')).toBeInTheDocument();
      expect(screen.getByText('TEST001')).toBeInTheDocument();
      expect(screen.getByText('100 ر.س')).toBeInTheDocument();
    });
  });

  // اختبار 3: فتح نموذج الإضافة
  test('should open add product form when button clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    render(
      <TestWrapper>
        <NewEcommerceProducts />
      </TestWrapper>
    );

    // النقر على زر الإضافة
    const addButton = screen.getByText('إضافة منتج جديد');
    fireEvent.click(addButton);

    // التحقق من ظهور النموذج
    await waitFor(() => {
      expect(screen.getByText('إضافة منتج جديد')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('اسم المنتج')).toBeInTheDocument();
    });
  });

  // اختبار 4: التحقق من صحة البيانات
  test('should validate required fields', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    render(
      <TestWrapper>
        <NewEcommerceProducts />
      </TestWrapper>
    );

    // فتح النموذج
    const addButton = screen.getByText('إضافة منتج جديد');
    fireEvent.click(addButton);

    await waitFor(() => {
      // محاولة الحفظ بدون ملء البيانات
      const saveButton = screen.getByText('إضافة المنتج');
      fireEvent.click(saveButton);
    });

    // التحقق من عدم إرسال الطلب
    expect(fetch).toHaveBeenCalledTimes(1); // فقط طلب جلب البيانات الأولي
  });

  // اختبار 5: البحث
  test('should filter products when searching', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'منتج أول',
        description: 'وصف المنتج الأول',
        sku: 'TEST001',
        price: 100,
        stock_quantity: 50,
        is_active: true
      },
      {
        id: '2',
        name: 'منتج ثاني',
        description: 'وصف المنتج الثاني',
        sku: 'TEST002',
        price: 200,
        stock_quantity: 30,
        is_active: true
      }
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockProducts })
    });

    render(
      <TestWrapper>
        <NewEcommerceProducts />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('منتج أول')).toBeInTheDocument();
      expect(screen.getByText('منتج ثاني')).toBeInTheDocument();
    });

    // البحث عن "أول"
    const searchInput = screen.getByPlaceholderText('البحث في المنتجات...');
    fireEvent.change(searchInput, { target: { value: 'أول' } });

    // التحقق من النتائج
    await waitFor(() => {
      expect(screen.getByText('منتج أول')).toBeInTheDocument();
      expect(screen.queryByText('منتج ثاني')).not.toBeInTheDocument();
    });
  });

  // اختبار 6: إضافة منتج جديد
  test('should create new product successfully', async () => {
    // Mock للحصول على البيانات الأولية
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })
      // Mock لإنشاء المنتج
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: '1',
            name: 'منتج جديد',
            sku: 'NEW001',
            price: 150
          }
        })
      });

    render(
      <TestWrapper>
        <NewEcommerceProducts />
      </TestWrapper>
    );

    // فتح النموذج
    const addButton = screen.getByText('إضافة منتج جديد');
    fireEvent.click(addButton);

    await waitFor(() => {
      // ملء البيانات
      fireEvent.change(screen.getByPlaceholderText('اسم المنتج'), {
        target: { value: 'منتج جديد' }
      });
      fireEvent.change(screen.getByPlaceholderText('PROD001'), {
        target: { value: 'NEW001' }
      });
      fireEvent.change(screen.getByPlaceholderText('100.00'), {
        target: { value: '150' }
      });
      fireEvent.change(screen.getByPlaceholderText('50'), {
        target: { value: '25' }
      });

      // الحفظ
      const saveButton = screen.getByText('إضافة المنتج');
      fireEvent.click(saveButton);
    });

    // التحقق من إرسال الطلب
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  // اختبار 7: معالجة الأخطاء
  test('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <TestWrapper>
        <NewEcommerceProducts />
      </TestWrapper>
    );

    // التحقق من معالجة الخطأ
    await waitFor(() => {
      expect(screen.getByText('فشل في تحميل المنتجات')).toBeInTheDocument();
    });
  });

  // اختبار 8: حذف منتج
  test('should delete product when delete button clicked', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'منتج للحذف',
        sku: 'DEL001',
        price: 100,
        stock_quantity: 10,
        is_active: true
      }
    ];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockProducts })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

    render(
      <TestWrapper>
        <NewEcommerceProducts />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('منتج للحذف')).toBeInTheDocument();
    });

    // النقر على زر الحذف
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => 
      btn.querySelector('svg') && btn.className.includes('text-red')
    );
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    // التحقق من إرسال طلب الحذف
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
