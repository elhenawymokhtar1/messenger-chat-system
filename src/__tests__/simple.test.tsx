/**
 * 🧪 اختبار بسيط للتأكد من عمل النظام
 * يختبر الوظائف الأساسية
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// مكون بسيط للاختبار
const SimpleComponent: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div data-testid="simple-component">
      <h1>اختبار بسيط</h1>
      <p>{message}</p>
    </div>
  );
};

describe('Simple Tests', () => {
  test('🎯 يعرض المكون البسيط بشكل صحيح', () => {
    render(<SimpleComponent message="مرحباً بالعالم!" />);
    
    expect(screen.getByTestId('simple-component')).toBeInTheDocument();
    expect(screen.getByText('اختبار بسيط')).toBeInTheDocument();
    expect(screen.getByText('مرحباً بالعالم!')).toBeInTheDocument();
  });

  test('🔢 يختبر العمليات الحسابية', () => {
    const add = (a: number, b: number) => a + b;
    const multiply = (a: number, b: number) => a * b;
    
    expect(add(2, 3)).toBe(5);
    expect(multiply(4, 5)).toBe(20);
  });

  test('📝 يختبر التعامل مع النصوص', () => {
    const formatName = (firstName: string, lastName: string) => {
      return `${firstName} ${lastName}`;
    };
    
    expect(formatName('أحمد', 'محمد')).toBe('أحمد محمد');
  });

  test('🔍 يختبر localStorage mock', () => {
    const testData = { id: 1, name: 'اختبار' };
    
    localStorage.setItem('test', JSON.stringify(testData));
    const retrieved = localStorage.getItem('test');
    
    expect(retrieved).toBeTruthy();
    expect(JSON.parse(retrieved!)).toEqual(testData);
  });

  test('🌐 يختبر fetch mock', async () => {
    const mockResponse = { success: true, data: 'test' };
    
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);
    
    const response = await fetch('/api/test');
    const data = await response.json();
    
    expect(data).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith('/api/test');
  });

  test('⏰ يختبر التوقيتات', (done) => {
    const callback = jest.fn();
    
    setTimeout(() => {
      callback();
      expect(callback).toHaveBeenCalled();
      done();
    }, 100);
  });

  test('🎭 يختبر Promise', async () => {
    const asyncFunction = async (value: string) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`معالج: ${value}`), 50);
      });
    };
    
    const result = await asyncFunction('اختبار');
    expect(result).toBe('معالج: اختبار');
  });

  test('❌ يختبر معالجة الأخطاء', () => {
    const errorFunction = () => {
      throw new Error('خطأ اختبار');
    };
    
    expect(errorFunction).toThrow('خطأ اختبار');
  });
});
