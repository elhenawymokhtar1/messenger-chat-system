/**
 * 🧪 تعريفات TypeScript للاختبارات
 * يحل مشاكل types في Jest
 */

import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveStyle(style: string | object): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveValue(value: string | number): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string): R;
    }
  }

  // Jest globals
  var jest: {
    fn: () => jest.MockedFunction<any>;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
    restoreAllMocks: () => void;
    spyOn: (object: any, method: string) => jest.SpyInstance;
  };

  function describe(name: string, fn: () => void): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function expect(actual: any): jest.Matchers<any>;
  function beforeAll(fn: () => void | Promise<void>): void;
  function afterAll(fn: () => void | Promise<void>): void;
  function beforeEach(fn: () => void | Promise<void>): void;
  function afterEach(fn: () => void | Promise<void>): void;

  // Mock types
  interface MockedFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>;
    mockReturnValue(value: ReturnType<T>): this;
    mockResolvedValue(value: ReturnType<T>): this;
    mockRejectedValue(value: any): this;
    mockImplementation(fn: T): this;
    mockClear(): this;
    mockReset(): this;
    mockRestore(): this;
  }

  // Storage mocks
  interface StorageMock {
    getItem: jest.MockedFunction<(key: string) => string | null>;
    setItem: jest.MockedFunction<(key: string, value: string) => void>;
    removeItem: jest.MockedFunction<(key: string) => void>;
    clear: jest.MockedFunction<() => void>;
  }

  // Window location mock
  interface LocationMock {
    assign: jest.MockedFunction<(url: string) => void>;
    replace: jest.MockedFunction<(url: string) => void>;
    reload: jest.MockedFunction<() => void>;
    href: string;
    pathname: string;
    search: string;
    hash: string;
  }
}

export {};
