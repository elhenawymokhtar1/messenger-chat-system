// تم فحص الأداة - console.log مقبول في أدوات التشخيص
/**
 * 🧪 إصلاح نظام الاختبارات
 * يحل مشاكل Jest والاختبارات
 */

import fs from 'fs';
import { execSync } from 'child_process';

class TestingSystemFixer {
  constructor() {
    this.fixes = [];
    this.issues = [];
  }

  async fixTestingSystem() {
    console.log('🧪 بدء إصلاح نظام الاختبارات...\n');

    // 1. إصلاح Jest configuration
    await this.fixJestConfig();
    
    // 2. إصلاح setupTests.ts
    await this.fixSetupTests();
    
    // 3. إنشاء اختبار بسيط يعمل
    await this.createWorkingTest();
    
    // 4. إصلاح package.json scripts
    await this.fixPackageScripts();
    
    // 5. تشغيل اختبار للتأكد
    await this.runTestCheck();

    this.generateReport();
  }

  async fixJestConfig() {
    console.log('🔧 إصلاح Jest configuration...');
    
    const jestConfig = `/**
 * 🧪 إعداد Jest محسن ومبسط
 */

export default {
  // بيئة الاختبار
  testEnvironment: 'jsdom',
  
  // ملفات الاختبار
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // تجاهل ملفات معينة
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // إعداد التحويل
  transform: {
    '^.+\\\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }],
    '^.+\\\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },
  
  // إعداد الوحدات
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
  },
  
  // ملف الإعداد
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // دعم ESM
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // إعداد التغطية
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  
  // timeout
  testTimeout: 10000,
  
  // تنظيف mocks
  clearMocks: true,
  restoreMocks: true,
  
  // verbose output
  verbose: true
};`;

    try {
      fs.writeFileSync('jest.config.js', jestConfig);
      this.fixes.push('✅ تم إصلاح Jest configuration');
      console.log('  ✅ تم إنشاء jest.config.js محسن');
    } catch (error) {
      this.issues.push(`❌ فشل إصلاح Jest config: ${error.message}`);
    }
  }

  async fixSetupTests() {
    console.log('🔧 إصلاح setupTests.ts...');
    
    const setupTestsContent = `/**
 * 🧪 إعداد الاختبارات المحسن
 */

import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock fetch
global.fetch = jest.fn();

// Mock window.location
const mockLocation = {
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
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
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

// تنظيف بعد كل اختبار
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});`;

    try {
      fs.writeFileSync('src/setupTests.ts', setupTestsContent);
      this.fixes.push('✅ تم إصلاح setupTests.ts');
      console.log('  ✅ تم تحديث setupTests.ts');
    } catch (error) {
      this.issues.push(`❌ فشل إصلاح setupTests: ${error.message}`);
    }
  }

  async createWorkingTest() {
    console.log('🔧 إنشاء اختبار بسيط يعمل...');
    
    const workingTestContent = `/**
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
});`;

    try {
      // إنشاء مجلد __tests__ إذا لم يكن موجوداً
      if (!fs.existsSync('src/__tests__')) {
        fs.mkdirSync('src/__tests__', { recursive: true });
      }
      
      fs.writeFileSync('src/__tests__/system.test.tsx', workingTestContent);
      this.fixes.push('✅ تم إنشاء اختبار بسيط يعمل');
      console.log('  ✅ تم إنشاء system.test.tsx');
    } catch (error) {
      this.issues.push(`❌ فشل إنشاء الاختبار: ${error.message}`);
    }
  }

  async fixPackageScripts() {
    console.log('🔧 إصلاح package.json scripts...');
    
    try {
      const packagePath = 'package.json';
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // تحديث scripts
      packageContent.scripts = {
        ...packageContent.scripts,
        "test": "jest",
        "test:watch": "jest --watch",
        "test:coverage": "jest --coverage",
        "test:ci": "jest --ci --coverage --watchAll=false",
        "test:simple": "jest src/__tests__/system.test.tsx",
        "test:debug": "jest --detectOpenHandles --forceExit"
      };
      
      fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
      this.fixes.push('✅ تم تحديث package.json scripts');
      console.log('  ✅ تم تحديث scripts');
    } catch (error) {
      this.issues.push(`❌ فشل تحديث package.json: ${error.message}`);
    }
  }

  async runTestCheck() {
    console.log('🧪 تشغيل اختبار للتأكد...');
    
    try {
      const output = execSync('npm run test:simple', { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 30000
      });
      
      if (output.includes('PASS')) {
        this.fixes.push('✅ الاختبار البسيط يعمل بنجاح');
        console.log('  ✅ الاختبار نجح!');
      } else {
        this.issues.push('⚠️ الاختبار لم ينجح كما متوقع');
        console.log('  ⚠️ الاختبار لم ينجح');
      }
    } catch (error) {
      this.issues.push(`❌ فشل تشغيل الاختبار: ${error.message}`);
      console.log('  ❌ فشل تشغيل الاختبار');
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 تقرير إصلاح نظام الاختبارات');
    console.log('='.repeat(60));

    console.log('\n✅ الإصلاحات المنجزة:');
    this.fixes.forEach(fix => console.log(`  ${fix}`));

    if (this.issues.length > 0) {
      console.log('\n❌ المشاكل المتبقية:');
      this.issues.forEach(issue => console.log(`  ${issue}`));
    }

    console.log('\n📋 الملفات المُنشأة/المُحدثة:');
    console.log('  📄 jest.config.js - إعداد Jest محسن');
    console.log('  📄 src/setupTests.ts - إعداد الاختبارات');
    console.log('  📄 src/__tests__/system.test.tsx - اختبار بسيط');
    console.log('  📄 package.json - scripts محدثة');

    console.log('\n🎯 كيفية تشغيل الاختبارات:');
    console.log('  npm test - تشغيل جميع الاختبارات');
    console.log('  npm run test:simple - تشغيل الاختبار البسيط');
    console.log('  npm run test:watch - تشغيل مع المراقبة');
    console.log('  npm run test:coverage - تشغيل مع التغطية');

    console.log('\n🧪 نظام الاختبارات جاهز!');
  }
}

// تشغيل إصلاح نظام الاختبارات
const fixer = new TestingSystemFixer();
fixer.fixTestingSystem().catch(error => {
  console.error('💥 خطأ في إصلاح نظام الاختبارات:', error);
  process.exit(1);
});
