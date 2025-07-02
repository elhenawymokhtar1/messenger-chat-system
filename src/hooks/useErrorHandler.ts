/**
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
    
    logger.error(`Error in ${context || 'Unknown context'}`, {
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
        
        logger.warn(`Retry attempt ${attempt}/${maxRetries} failed`, { error });
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

export default useErrorHandler;