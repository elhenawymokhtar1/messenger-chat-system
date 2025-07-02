/**
 * 🧪 اختبارات useAuth Hook
 * يختبر إدارة المصادقة والحالة
 */

import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('🔍 يبدأ بحالة التحميل', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  test('✅ يتحقق من بيانات localStorage الصحيحة', async () => {
    const mockUser = {
      id: 1,
      name: 'شركة اختبار',
      email: 'test@example.com'
    };

    localStorage.setItem('company', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth());

    // انتظار انتهاء التحقق
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  test('❌ يتعامل مع بيانات localStorage غير الصحيحة', async () => {
    const incompleteUser = {
      id: 1,
      name: 'شركة اختبار'
      // email مفقود
    };

    localStorage.setItem('company', JSON.stringify(incompleteUser));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  test('🔧 يتعامل مع JSON تالف في localStorage', async () => {
    localStorage.setItem('company', 'invalid-json');

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(localStorage.getItem('company')).toBe(null);
  });

  test('🔐 يسجل الدخول بنجاح', () => {
    const { result } = renderHook(() => useAuth());

    const userData = {
      id: 1,
      name: 'شركة اختبار',
      email: 'test@example.com'
    };

    act(() => {
      result.current.login(userData);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(userData);
    expect(result.current.loading).toBe(false);

    // التحقق من حفظ البيانات في localStorage
    const savedData = JSON.parse(localStorage.getItem('company') || '{}');
    expect(savedData.id).toBe(userData.id);
    expect(savedData.name).toBe(userData.name);
    expect(savedData.email).toBe(userData.email);
    expect(savedData.loginTime).toBeDefined();
    expect(savedData.lastActivity).toBeDefined();
  });

  test('❌ يرفض تسجيل الدخول ببيانات ناقصة', () => {
    const { result } = renderHook(() => useAuth());

    const incompleteData = {
      id: 1,
      name: 'شركة اختبار'
      // email مفقود
    };

    act(() => {
      result.current.login(incompleteData);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(localStorage.getItem('company')).toBe(null);
  });

  test('🚪 يسجل الخروج بنجاح', () => {
    const { result } = renderHook(() => useAuth());

    // تسجيل الدخول أولاً
    const userData = {
      id: 1,
      name: 'شركة اختبار',
      email: 'test@example.com'
    };

    act(() => {
      result.current.login(userData);
    });

    expect(result.current.isAuthenticated).toBe(true);

    // تسجيل الخروج
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(localStorage.getItem('company')).toBe(null);
    expect(localStorage.getItem('userToken')).toBe(null);
  });

  test('⏰ يحدث آخر نشاط', () => {
    const { result } = renderHook(() => useAuth());

    const userData = {
      id: 1,
      name: 'شركة اختبار',
      email: 'test@example.com'
    };

    act(() => {
      result.current.login(userData);
    });

    const initialData = JSON.parse(localStorage.getItem('company') || '{}');
    const initialActivity = initialData.lastActivity;

    // انتظار قليل ثم تحديث النشاط
    setTimeout(() => {
      act(() => {
        result.current.updateLastActivity();
      });

      const updatedData = JSON.parse(localStorage.getItem('company') || '{}');
      expect(updatedData.lastActivity).not.toBe(initialActivity);
    }, 10);
  });

  test('🔄 يعيد التحقق من الحالة', async () => {
    const { result } = renderHook(() => useAuth());

    const userData = {
      id: 1,
      name: 'شركة اختبار',
      email: 'test@example.com'
    };

    localStorage.setItem('company', JSON.stringify(userData));

    await act(async () => {
      await result.current.checkAuthStatus();
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(userData);
  });
});
