import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import NewStoreManagement from '../pages/NewStoreManagement';

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

describe('NewStoreManagement', () => {
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
      json: async () => ({ success: true, data: null })
    });

    render(
      <TestWrapper>
        <NewStoreManagement />
      </TestWrapper>
    );

    // التحقق من وجود العنوان
    expect(screen.getByText('إدارة المتجر الجديدة')).toBeInTheDocument();
  });

  // اختبار 2: عرض حالة عدم وجود متجر
  test('should show create store form when no store exists', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: null })
    });

    render(
      <TestWrapper>
        <NewStoreManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('إنشاء متجر جديد')).toBeInTheDocument();
      expect(screen.getByText('لا يوجد متجر مرتبط بهذه الشركة. يمكنك إنشاء متجر جديد الآن.')).toBeInTheDocument();
    });
  });

  // اختبار 3: عرض بيانات المتجر الموجود
  test('should display store data when store exists', async () => {
    const mockStore = {
      id: '1',
      name: 'متجر تجريبي',
      description: 'وصف المتجر',
      email: 'test@store.com',
      phone: '+966501234567',
      address: 'الرياض',
      is_active: true
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockStore })
    });

    render(
      <TestWrapper>
        <NewStoreManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('متجر تجريبي')).toBeInTheDocument();
      expect(screen.getByText('test@store.com')).toBeInTheDocument();
      expect(screen.getByText('+966501234567')).toBeInTheDocument();
    });
  });

  // اختبار 4: إنشاء متجر جديد
  test('should create new store successfully', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: '1',
            name: 'متجر جديد',
            email: 'new@store.com'
          }
        })
      });

    render(
      <TestWrapper>
        <NewStoreManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      // النقر على زر إنشاء متجر
      const createButton = screen.getByText('إنشاء متجر جديد');
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      // ملء البيانات
      fireEvent.change(screen.getByPlaceholderText('اسم المتجر'), {
        target: { value: 'متجر جديد' }
      });
      fireEvent.change(screen.getByPlaceholderText('info@store.com'), {
        target: { value: 'new@store.com' }
      });

      // الحفظ
      const saveButton = screen.getByText('إنشاء المتجر');
      fireEvent.click(saveButton);
    });

    // التحقق من إرسال الطلب
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  // اختبار 5: تحرير المتجر
  test('should edit store successfully', async () => {
    const mockStore = {
      id: '1',
      name: 'متجر للتحرير',
      description: 'وصف قديم',
      email: 'old@store.com',
      phone: '+966501234567',
      address: 'الرياض',
      is_active: true
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStore })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockStore, name: 'متجر محدث' }
        })
      });

    render(
      <TestWrapper>
        <NewStoreManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      // النقر على زر التحرير (أيقونة Edit)
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      // تعديل الاسم
      const nameInput = screen.getByDisplayValue('متجر للتحرير');
      fireEvent.change(nameInput, { target: { value: 'متجر محدث' } });

      // الحفظ
      const saveButton = screen.getByText('حفظ التغييرات');
      fireEvent.click(saveButton);
    });

    // التحقق من إرسال الطلب
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  // اختبار 6: تغيير حالة المتجر
  test('should toggle store status', async () => {
    const mockStore = {
      id: '1',
      name: 'متجر نشط',
      is_active: true
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockStore })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockStore, is_active: false }
        })
      });

    render(
      <TestWrapper>
        <NewStoreManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('نشط')).toBeInTheDocument();
    });

    // النقر على زر تغيير الحالة (أيقونة PowerOff)
    const toggleButtons = screen.getAllByRole('button');
    const toggleButton = toggleButtons.find(btn =>
      btn.querySelector('svg') && btn.className.includes('text-red')
    );
    if (toggleButton) {
      fireEvent.click(toggleButton);
    }

    // التحقق من إرسال الطلب
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  // اختبار 7: التحقق من صحة البيانات
  test('should validate required fields', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: null })
    });

    render(
      <TestWrapper>
        <NewStoreManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      // فتح النموذج
      const createButton = screen.getByText('إنشاء متجر جديد');
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      // محاولة الحفظ بدون ملء البيانات
      const saveButton = screen.getByText('إنشاء المتجر');
      fireEvent.click(saveButton);
    });

    // التحقق من عدم إرسال الطلب
    expect(fetch).toHaveBeenCalledTimes(1); // فقط طلب جلب البيانات الأولي
  });

  // اختبار 8: معالجة الأخطاء
  test('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <TestWrapper>
        <NewStoreManagement />
      </TestWrapper>
    );

    // التحقق من معالجة الخطأ
    await waitFor(() => {
      expect(screen.getByText('فشل في تحميل بيانات المتجر')).toBeInTheDocument();
    });
  });

  // اختبار 9: عرض الإحصائيات
  test('should display store statistics', async () => {
    const mockStore = {
      id: '1',
      name: 'متجر إحصائيات',
      is_active: true,
      total_products: 25,
      total_orders: 150,
      total_revenue: 50000
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockStore })
    });

    render(
      <TestWrapper>
        <NewStoreManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // عدد المنتجات
      expect(screen.getByText('150')).toBeInTheDocument(); // عدد الطلبات
    });
  });
});
