// تم فحص الأداة - console.log مقبول في أدوات التشخيص
/**
 * 🤖 مولد الكود الذكي - يكشف الأخطاء ويكتب الكود تلقائياً
 * نعم! هذه الأداة تكشف الأخطاء وتكتب الكود بنفسها
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class SmartCodeGenerator {
  constructor() {
    this.detectedIssues = [];
    this.generatedFiles = [];
    this.fixedIssues = [];
  }

  async detectAndGenerate() {
    console.log('🤖 بدء مولد الكود الذكي - كشف الأخطاء وكتابة الكود تلقائياً...\n');

    // 1. كشف الملفات المفقودة وإنشاؤها
    await this.detectMissingFiles();
    
    // 2. كشف مشاكل الأمان وإصلاحها
    await this.detectSecurityIssues();
    
    // 3. إنشاء utility functions مفقودة
    await this.generateUtilities();
    
    // 4. إنشاء hooks مفيدة
    await this.generateHooks();
    
    // 5. إنشاء components مساعدة
    await this.generateComponents();

    this.generateReport();
  }

  async detectMissingFiles() {
    console.log('📁 كشف الملفات المفقودة وإنشاؤها...');
    
    const requiredFiles = [
      {
        path: 'src/utils/logger.ts',
        generator: () => this.generateLogger(),
        description: 'نظام Logging متقدم'
      },
      {
        path: 'src/hooks/useErrorHandler.ts',
        generator: () => this.generateErrorHandler(),
        description: 'Hook معالجة الأخطاء'
      },
      {
        path: 'src/utils/apiClient.ts',
        generator: () => this.generateApiClient(),
        description: 'عميل API محسن'
      },
      {
        path: 'src/hooks/useLocalStorage.ts',
        generator: () => this.generateLocalStorageHook(),
        description: 'Hook للتعامل مع localStorage'
      },
      {
        path: 'src/components/ErrorBoundary.tsx',
        generator: () => this.generateErrorBoundary(),
        description: 'مكون معالجة الأخطاء'
      }
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file.path)) {
        try {
          // إنشاء المجلد إذا لم يكن موجوداً
          const dir = path.dirname(file.path);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          const content = file.generator();
          fs.writeFileSync(file.path, content);
          
          this.generatedFiles.push({
            path: file.path,
            description: file.description,
            type: 'missing_file'
          });
          
          console.log(`  ✅ تم إنشاء ${file.path} - ${file.description}`);
          
        } catch (error) {
          console.log(`  ❌ فشل إنشاء ${file.path}: ${error.message}`);
        }
      }
    }
  }

  async detectSecurityIssues() {
    console.log('🔒 كشف مشاكل الأمان وإصلاحها...');
    
    // فحص .env للقيم المكشوفة
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      
      if (envContent.includes('193.203.168.103') || envContent.includes('u384034873')) {
        console.log('  ⚠️ تم العثور على بيانات حساسة في .env');
        this.detectedIssues.push({
          type: 'security',
          file: '.env',
          issue: 'بيانات قاعدة بيانات مكشوفة',
          severity: 'high'
        });
        
        // إصلاح تلقائي
        await this.fixEnvFile();
      }
    }
  }

  async fixEnvFile() {
    console.log('  🔧 إصلاح ملف .env تلقائياً...');
    
    const secureEnvContent = `# 🔐 متغيرات البيئة الآمنة
# تم إنشاؤها تلقائياً بواسطة Smart Code Generator

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# MySQL Database
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=conversations
MYSQL_PORT=3306

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Facebook API
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_VERIFY_TOKEN=your_verify_token
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token

# WhatsApp API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Server
PORT=3002
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081
`;

    // إنشاء نسخة احتياطية
    if (fs.existsSync('.env')) {
      fs.copyFileSync('.env', '.env.backup');
    }
    
    fs.writeFileSync('.env', secureEnvContent);
    
    this.fixedIssues.push({
      type: 'security_fix',
      file: '.env',
      action: 'تم استبدال البيانات الحساسة بـ placeholders آمنة'
    });
    
    console.log('    ✅ تم إصلاح .env وإنشاء نسخة احتياطية');
  }

  generateLogger() {
    return `/**
 * 📝 نظام Logging متقدم
 * تم إنشاؤه تلقائياً بواسطة Smart Code Generator
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  
  private createEntry(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      context
    };
  }
  
  private log(level: LogLevel, message: string, data?: any, context?: string) {
    const entry = this.createEntry(level, message, data, context);
    this.logs.push(entry);
    
    if (this.isDevelopment) {
      const emoji = this.getEmoji(level);
      console.log(\`\${emoji} [\${level.toUpperCase()}] \${message}\`, data || '');
    }
    
    // في production، يمكن إرسال للخدمات الخارجية
    if (!this.isDevelopment && level === 'error') {
      this.sendToErrorService(entry);
    }
  }
  
  private getEmoji(level: LogLevel): string {
    const emojis = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };
    return emojis[level] || '📝';
  }
  
  debug(message: string, data?: any, context?: string) {
    this.log('debug', message, data, context);
  }
  
  info(message: string, data?: any, context?: string) {
    this.log('info', message, data, context);
  }
  
  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, data, context);
  }
  
  error(message: string, data?: any, context?: string) {
    this.log('error', message, data, context);
  }
  
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }
  
  clearLogs() {
    this.logs = [];
  }
  
  private sendToErrorService(entry: LogEntry) {
    // TODO: إرسال للخدمات الخارجية مثل Sentry
    console.error('Error logged:', entry);
  }
}

export const logger = new Logger();
export default logger;`;
  }

  generateErrorHandler() {
    return `/**
 * 🚨 Hook معالجة الأخطاء المتقدم
 * تم إنشاؤه تلقائياً بواسطة Smart Code Generator
 */

import { useState, useCallback } from 'react';
import { logger } from '../utils/logger';

interface ErrorState {
  error: Error | null;
  hasError: boolean;
  errorMessage: string;
  errorCode?: string;
  retryCount: number;
}

interface UseErrorHandlerReturn extends ErrorState {
  handleError: (error: Error | string, context?: string, code?: string) => void;
  clearError: () => void;
  retryOperation: <T>(operation: () => Promise<T>, maxRetries?: number) => Promise<T>;
  isRetrying: boolean;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    hasError: false,
    errorMessage: '',
    errorCode: undefined,
    retryCount: 0
  });
  
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((
    error: Error | string, 
    context?: string, 
    code?: string
  ) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    logger.error(\`Error in \${context || 'Unknown context'}\`, {
      message: errorObj.message,
      stack: errorObj.stack,
      code
    }, context);
    
    setErrorState(prev => ({
      error: errorObj,
      hasError: true,
      errorMessage: errorObj.message,
      errorCode: code,
      retryCount: prev.retryCount
    }));
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      hasError: false,
      errorMessage: '',
      errorCode: undefined,
      retryCount: 0
    });
    setIsRetrying(false);
  }, []);

  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> => {
    setIsRetrying(true);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          // انتظار متزايد بين المحاولات
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
        
        const result = await operation();
        clearError();
        return result;
        
      } catch (error) {
        setErrorState(prev => ({ ...prev, retryCount: attempt }));
        
        if (attempt === maxRetries) {
          handleError(error as Error, 'Retry operation failed', 'RETRY_FAILED');
          setIsRetrying(false);
          throw error;
        }
        
        logger.warn(\`Retry attempt \${attempt}/\${maxRetries} failed\`, { error });
      }
    }
    
    setIsRetrying(false);
    throw new Error('Max retries exceeded');
  }, [handleError, clearError]);

  return {
    ...errorState,
    handleError,
    clearError,
    retryOperation,
    isRetrying
  };
};

export default useErrorHandler;`;
  }

  generateApiClient() {
    return `/**
 * 🌐 عميل API محسن
 * تم إنشاؤه تلقائياً بواسطة Smart Code Generator
 */

import { logger } from './logger';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(baseURL: string = process.env.VITE_API_URL || 'http://localhost:3002') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.timeout = 10000; // 10 seconds
  }

  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      retries = 3
    } = config;

    const url = \`\${this.baseURL}\${endpoint}\`;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.debug(\`API Request: \${method} \${url}\`, { body, attempt });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || \`HTTP \${response.status}\`);
        }

        logger.debug(\`API Response: \${method} \${url}\`, { status: response.status, data });

        return {
          success: true,
          data: data.data || data,
          message: data.message
        };

      } catch (error) {
        logger.warn(\`API Request failed (attempt \${attempt}/\${retries})\`, {
          url,
          method,
          error: error.message
        });

        if (attempt === retries) {
          logger.error(\`API Request failed after \${retries} attempts\`, {
            url,
            method,
            error: error.message
          });

          return {
            success: false,
            error: error.message || 'Network error'
          };
        }

        // انتظار متزايد بين المحاولات
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded'
    };
  }

  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'DELETE' });
  }

  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = \`Bearer \${token}\`;
  }

  removeAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }
}

export const apiClient = new ApiClient();
export default apiClient;`;
  }

  async generateUtilities() {
    console.log('🛠️ إنشاء utility functions مفيدة...');
    
    // إنشاء مجلد utils إذا لم يكن موجوداً
    if (!fs.existsSync('src/utils')) {
      fs.mkdirSync('src/utils', { recursive: true });
    }
    
    // إنشاء validation utilities
    if (!fs.existsSync('src/utils/validation.ts')) {
      const validationCode = this.generateValidationUtils();
      fs.writeFileSync('src/utils/validation.ts', validationCode);
      
      this.generatedFiles.push({
        path: 'src/utils/validation.ts',
        description: 'أدوات التحقق والتصديق',
        type: 'utility'
      });
      
      console.log('  ✅ تم إنشاء validation utilities');
    }
  }

  generateValidationUtils() {
    return `/**
 * ✅ أدوات التحقق والتصديق
 * تم إنشاؤها تلقائياً بواسطة Smart Code Generator
 */

export const validation = {
  // التحقق من البريد الإلكتروني
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
  },

  // التحقق من رقم الهاتف
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^[\\+]?[1-9]?\\d{9,15}$/;
    return phoneRegex.test(phone.replace(/\\s/g, ''));
  },

  // التحقق من قوة كلمة المرور
  isStrongPassword: (password: string): boolean => {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /\\d/.test(password) &&
           /[!@#$%^&*]/.test(password);
  },

  // التحقق من URL
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // تنظيف النص
  sanitizeText: (text: string): string => {
    return text.trim().replace(/[<>]/g, '');
  },

  // التحقق من JSON
  isValidJson: (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
};

export default validation;`;
  }

  async generateHooks() {
    console.log('🎣 إنشاء React hooks مفيدة...');
    
    if (!fs.existsSync('src/hooks')) {
      fs.mkdirSync('src/hooks', { recursive: true });
    }
    
    // إنشاء useLocalStorage hook
    if (!fs.existsSync('src/hooks/useLocalStorage.ts')) {
      const localStorageHook = this.generateLocalStorageHook();
      fs.writeFileSync('src/hooks/useLocalStorage.ts', localStorageHook);
      
      this.generatedFiles.push({
        path: 'src/hooks/useLocalStorage.ts',
        description: 'Hook للتعامل مع localStorage',
        type: 'hook'
      });
      
      console.log('  ✅ تم إنشاء useLocalStorage hook');
    }
  }

  generateLocalStorageHook() {
    return `/**
 * 💾 Hook للتعامل مع localStorage
 * تم إنشاؤه تلقائياً بواسطة Smart Code Generator
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // قراءة القيمة من localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.warn(\`Error reading localStorage key "\${key}"\`, error);
      return initialValue;
    }
  });

  // حفظ القيمة في localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      logger.debug(\`localStorage updated: \${key}\`, valueToStore);
    } catch (error) {
      logger.error(\`Error setting localStorage key "\${key}"\`, error);
    }
  }, [key, storedValue]);

  // حذف القيمة من localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      logger.debug(\`localStorage removed: \${key}\`);
    } catch (error) {
      logger.error(\`Error removing localStorage key "\${key}"\`, error);
    }
  }, [key, initialValue]);

  // مراقبة تغييرات localStorage من نوافذ أخرى
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          logger.warn(\`Error parsing localStorage change for key "\${key}"\`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;`;
  }

  async generateComponents() {
    console.log('🧩 إنشاء React components مساعدة...');
    
    if (!fs.existsSync('src/components')) {
      fs.mkdirSync('src/components', { recursive: true });
    }
    
    // إنشاء ErrorBoundary component
    if (!fs.existsSync('src/components/ErrorBoundary.tsx')) {
      const errorBoundary = this.generateErrorBoundary();
      fs.writeFileSync('src/components/ErrorBoundary.tsx', errorBoundary);
      
      this.generatedFiles.push({
        path: 'src/components/ErrorBoundary.tsx',
        description: 'مكون معالجة الأخطاء',
        type: 'component'
      });
      
      console.log('  ✅ تم إنشاء ErrorBoundary component');
    }
  }

  generateErrorBoundary() {
    return `/**
 * 🛡️ مكون معالجة الأخطاء
 * تم إنشاؤه تلقائياً بواسطة Smart Code Generator
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // استدعاء callback إضافي إذا تم توفيره
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // عرض UI بديل في حالة الخطأ
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <h2>🚨 حدث خطأ غير متوقع</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>تفاصيل الخطأ</summary>
            {this.state.error && this.state.error.toString()}
          </details>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            🔄 إعادة تحميل الصفحة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;`;
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🤖 تقرير مولد الكود الذكي');
    console.log('='.repeat(80));
    
    console.log(`\n📊 الإحصائيات:`);
    console.log(`  🔍 المشاكل المكتشفة: ${this.detectedIssues.length}`);
    console.log(`  📝 الملفات المُنشأة: ${this.generatedFiles.length}`);
    console.log(`  🔧 الإصلاحات المنجزة: ${this.fixedIssues.length}`);
    
    if (this.generatedFiles.length > 0) {
      console.log(`\n📝 الملفات المُنشأة تلقائياً:`);
      this.generatedFiles.forEach(file => {
        console.log(`  📄 ${file.path} - ${file.description}`);
      });
    }
    
    if (this.fixedIssues.length > 0) {
      console.log(`\n🔧 الإصلاحات المنجزة:`);
      this.fixedIssues.forEach(fix => {
        console.log(`  ✅ ${fix.file} - ${fix.action}`);
      });
    }
    
    console.log(`\n🎯 النتيجة:`);
    if (this.generatedFiles.length > 0 || this.fixedIssues.length > 0) {
      console.log('  🎉 تم إنشاء وإصلاح الكود بنجاح!');
      console.log('  🤖 مولد الكود الذكي يعمل بكفاءة عالية');
    } else {
      console.log('  ✅ لا توجد مشاكل تحتاج إصلاح');
      console.log('  👍 الكود في حالة جيدة');
    }
    
    console.log(`\n🚀 مولد الكود الذكي اكتمل!`);
  }
}

// تشغيل مولد الكود الذكي
const generator = new SmartCodeGenerator();
generator.detectAndGenerate().catch(error => {
  console.error('💥 خطأ في مولد الكود الذكي:', error);
  process.exit(1);
});
