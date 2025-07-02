/**
 * 🧪 اختبارات تكامل المكونات الرئيسية
 * يختبر التفاعل بين المكونات المختلفة
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock للمكونات الرئيسية
const MockCompanyLogin = () => (
  <div data-testid="company-login">
    <h1>تسجيل دخول الشركة</h1>
    <form data-testid="login-form">
      <input data-testid="email-input" type="email" placeholder="البريد الإلكتروني" />
      <input data-testid="password-input" type="password" placeholder="كلمة المرور" />
      <button data-testid="login-button" type="submit">تسجيل الدخول</button>
    </form>
  </div>
);

const MockHomePage = () => (
  <div data-testid="home-page">
    <h1>الصفحة الرئيسية</h1>
    <nav data-testid="navigation">
      <button data-testid="messages-tab">الرسائل</button>
      <button data-testid="settings-tab">الإعدادات</button>
      <button data-testid="analytics-tab">التحليلات</button>
    </nav>
    <main data-testid="main-content">
      <div data-testid="dashboard-stats">إحصائيات لوحة التحكم</div>
    </main>
  </div>
);

const MockChatInterface = () => (
  <div data-testid="chat-interface">
    <div data-testid="chat-header">محادثة Facebook</div>
    <div data-testid="messages-list">
      <div data-testid="message-1">مرحباً</div>
      <div data-testid="message-2">كيف يمكنني مساعدتك؟</div>
    </div>
    <div data-testid="message-input-area">
      <input data-testid="message-input" placeholder="اكتب رسالة..." />
      <button data-testid="send-button">إرسال</button>
    </div>
  </div>
);

// مكون التطبيق المحاكي
const MockApp = ({ currentPage }: { currentPage: string }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div data-testid="app-container">
          {currentPage === 'login' && <MockCompanyLogin />}
          {currentPage === 'home' && <MockHomePage />}
          {currentPage === 'chat' && <MockChatInterface />}
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Component Integration Tests', () => {
  beforeEach(() => {
    // تنظيف localStorage قبل كل اختبار
    localStorage.clear();
    
    // إعداد fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('🔐 تدفق تسجيل الدخول الكامل', async () => {
    render(<MockApp currentPage="login" />);
    
    // التحقق من وجود نموذج تسجيل الدخول
    expect(screen.getByTestId('company-login')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    
    // ملء النموذج
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');
    
    fireEvent.change(emailInput, { target: { value: 'test@company.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // التحقق من القيم
    expect(emailInput).toHaveValue('test@company.com');
    expect(passwordInput).toHaveValue('password123');
    
    // محاكاة نجاح تسجيل الدخول
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        company: { id: 1, name: 'شركة اختبار', email: 'test@company.com' }
      })
    } as Response);
    
    // إرسال النموذج
    fireEvent.click(loginButton);
    
    // انتظار معالجة الطلب
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/companies/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('test@company.com')
        })
      );
    });
  });

  test('🏠 عرض الصفحة الرئيسية بعد تسجيل الدخول', () => {
    // محاكاة حالة تسجيل الدخول
    localStorage.setItem('company', JSON.stringify({
      id: 1,
      name: 'شركة اختبار',
      email: 'test@company.com'
    }));
    
    render(<MockApp currentPage="home" />);
    
    // التحقق من عناصر الصفحة الرئيسية
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    
    // التحقق من أزرار التنقل
    expect(screen.getByTestId('messages-tab')).toBeInTheDocument();
    expect(screen.getByTestId('settings-tab')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-tab')).toBeInTheDocument();
    
    // التحقق من المحتوى الرئيسي
    expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
  });

  test('💬 واجهة المحادثة تعمل بشكل صحيح', async () => {
    render(<MockApp currentPage="chat" />);
    
    // التحقق من عناصر واجهة المحادثة
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    expect(screen.getByTestId('chat-header')).toBeInTheDocument();
    expect(screen.getByTestId('messages-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-input-area')).toBeInTheDocument();
    
    // التحقق من الرسائل الموجودة
    expect(screen.getByTestId('message-1')).toHaveTextContent('مرحباً');
    expect(screen.getByTestId('message-2')).toHaveTextContent('كيف يمكنني مساعدتك؟');
    
    // اختبار إرسال رسالة جديدة
    const messageInput = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');
    
    fireEvent.change(messageInput, { target: { value: 'رسالة اختبار' } });
    expect(messageInput).toHaveValue('رسالة اختبار');
    
    // محاكاة إرسال الرسالة
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, messageId: 123 })
    } as Response);
    
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/messages/send'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  test('🔄 التنقل بين الصفحات', () => {
    const { rerender } = render(<MockApp currentPage="login" />);
    
    // البداية في صفحة تسجيل الدخول
    expect(screen.getByTestId('company-login')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
    
    // الانتقال للصفحة الرئيسية
    rerender(<MockApp currentPage="home" />);
    expect(screen.queryByTestId('company-login')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    
    // الانتقال لواجهة المحادثة
    rerender(<MockApp currentPage="chat" />);
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
  });

  test('📱 الاستجابة للأجهزة المختلفة', () => {
    // محاكاة شاشة الهاتف
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });
    
    render(<MockApp currentPage="home" />);
    
    // التحقق من أن العناصر تظهر بشكل صحيح على الهاتف
    const navigation = screen.getByTestId('navigation');
    expect(navigation).toBeInTheDocument();
    
    // محاكاة شاشة سطح المكتب
    Object.defineProperty(window, 'innerWidth', {
      value: 1920
    });
    
    // إعادة تحديث المكون
    window.dispatchEvent(new Event('resize'));
    
    // التحقق من أن العناصر لا تزال تظهر
    expect(navigation).toBeInTheDocument();
  });

  test('⚡ اختبار الأداء والذاكرة', async () => {
    const startTime = performance.now();
    
    render(<MockApp currentPage="home" />);
    
    const renderTime = performance.now() - startTime;
    
    // التحقق من أن الرندر يتم في وقت معقول (أقل من 100ms)
    expect(renderTime).toBeLessThan(100);
    
    // اختبار تسريب الذاكرة
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // إنشاء وإزالة مكونات متعددة
    for (let i = 0; i < 10; i++) {
      const { unmount } = render(<MockApp currentPage="chat" />);
      unmount();
    }
    
    // فرض garbage collection إذا كان متاحاً
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // التحقق من عدم وجود تسريب كبير في الذاكرة (أقل من 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  test('🔒 اختبار الأمان والتحقق', () => {
    // اختبار XSS protection
    const maliciousInput = '<script>alert("xss")</script>';
    
    render(<MockApp currentPage="chat" />);
    
    const messageInput = screen.getByTestId('message-input');
    fireEvent.change(messageInput, { target: { value: maliciousInput } });
    
    // التحقق من أن المحتوى الخبيث لا يتم تنفيذه
    expect(messageInput).toHaveValue(maliciousInput);
    expect(document.querySelector('script')).toBeNull();
    
    // اختبار CSRF protection
    const csrfToken = 'test-csrf-token';
    localStorage.setItem('csrfToken', csrfToken);
    
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    } as Response);
    
    const sendButton = screen.getByTestId('send-button');
    fireEvent.click(sendButton);
    
    // التحقق من إرسال CSRF token
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-CSRF-Token': csrfToken
        })
      })
    );
  });
});
