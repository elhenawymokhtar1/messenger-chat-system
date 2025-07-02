import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { 
    ignores: [
      'dist', 
      'node_modules', 
      'test-reports', 
      '**/*.test.ts', 
      '**/*.test.tsx',
      'src/types/jest.d.ts',
      'src/setupTests.ts',
      'src/__tests__/**/*'
    ] 
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      
      // تخفيف قواعد TypeScript
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      
      // تخفيف قواعد React
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'warn',
      
      // تخفيف قواعد JavaScript العامة
      'no-var': 'off',
      'prefer-const': 'off',
      'no-empty': 'off',
      'no-useless-escape': 'off',
      'no-case-declarations': 'off',
      'no-prototype-builtins': 'off',
      'no-misleading-character-class': 'off',
      
      // إيقاف القواعد المزعجة
      'no-console': 'off',
      'no-debugger': 'off',
      'no-alert': 'off'
    },
  },
)