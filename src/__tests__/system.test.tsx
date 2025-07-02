/**
 * 🧪 اختبار بسيط للتأكد من عمل النظام
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// مكون بسيط للاختبار
const TestComponent: React.FC = () => {
  return (
    <div data-testid="test-component">
      <h1>اختبار النظام</h1>
      <p>هذا اختبار بسيط للتأكد من عمل Jest</p>
    </div>
  );
};

describe('System Tests', () => {
  test('🎯 النظام يعمل بشكل صحيح', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('اختبار النظام')).toBeInTheDocument();
    expect(screen.getByText('هذا اختبار بسيط للتأكد من عمل Jest')).toBeInTheDocument();
  });

  test('🔢 العمليات الحسابية تعمل', () => {
    const add = (a: number, b: number) => a + b;
    const multiply = (a: number, b: number) => a * b;
    
    expect(add(2, 3)).toBe(5);
    expect(multiply(4, 5)).toBe(20);
  });

  test('📝 localStorage mock يعمل', () => {
    const testData = { id: 1, name: 'اختبار' };
    
    localStorage.setItem('test', JSON.stringify(testData));
    const retrieved = localStorage.getItem('test');
    
    expect(retrieved).toBeTruthy();
    expect(JSON.parse(retrieved!)).toEqual(testData);
  });

  test('🌐 fetch mock يعمل', async () => {
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

  test('⏰ Promise يعمل', async () => {
    const asyncFunction = async (value: string) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve('معالج: ' + value), 10);
      });
    };
    
    const result = await asyncFunction('اختبار');
    expect(result).toBe('معالج: اختبار');
  });
});