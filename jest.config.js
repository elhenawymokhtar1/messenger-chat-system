/**
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
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },
  
  // إعداد الوحدات
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub'
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
};