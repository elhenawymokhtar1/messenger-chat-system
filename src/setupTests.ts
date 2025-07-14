/**
 * 🧪 إعداد الاختبارات المحسن - localStorage معطل
 */

import '@testing-library/jest-dom';

// Mock localStorage (معطل - للاختبارات فقط)
const localStorageMock = (() => {
  console.log('🧪 [TEST] localStorage mock معطل - يستخدم React state فقط');
  return {
    getItem: jest.fn(() => null), // دائماً يرجع null
    setItem: jest.fn(() => console.log('🧪 [TEST] localStorage.setItem معطل')),
    removeItem: jest.fn(() => console.log('🧪 [TEST] localStorage.removeItem معطل')),
    clear: jest.fn(() => console.log('🧪 [TEST] localStorage.clear معطل')),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage (معطل)
const sessionStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(() => console.log('🧪 [TEST] sessionStorage معطل')),
  removeItem: jest.fn(() => console.log('🧪 [TEST] sessionStorage معطل')),
  clear: jest.fn(() => console.log('🧪 [TEST] sessionStorage معطل')),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock fetch
global.fetch = jest.fn();

// Mock window.location بطريقة آمنة
if (!window.location.assign) {
  Object.defineProperty(window, 'location', {
    value: {
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      href: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000'
    },
    writable: true,
    configurable: true
  });
}

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
  takeRecords() { return []; }
};

// Mock ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

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

// Mock HTMLFormElement.requestSubmit
Object.defineProperty(HTMLFormElement.prototype, 'requestSubmit', {
  value: jest.fn(),
  writable: true
});

// تنظيف بعد كل اختبار
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});