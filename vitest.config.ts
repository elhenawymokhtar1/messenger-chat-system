/**
 * 🧪 إعداد Vitest للاختبارات (البديل الحديث لـ Jest)
 * يدعم Vite + React + TypeScript بشكل أفضل
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // بيئة الاختبار
    environment: 'jsdom',
    
    // إعداد ملفات الاختبار
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/**/__tests__/**/*.{js,jsx,ts,tsx}'
    ],
    
    // إعداد globals
    globals: true,
    
    // إعداد ملف الإعداد
    setupFiles: ['./src/setupTests.ts'],
    
    // إعداد التغطية
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.d.ts',
        'dist/',
        'build/'
      ]
    },
    
    // timeout للاختبارات
    testTimeout: 10000,
    
    // إعداد mock
    mockReset: true,
    clearMocks: true,
    restoreMocks: true
  },
  
  // إعداد المسارات
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
