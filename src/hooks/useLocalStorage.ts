/**
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
      logger.warn(`Error reading localStorage key "${key}"`, error);
      return initialValue;
    }
  });

  // حفظ القيمة في localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      logger.debug(`localStorage updated: ${key}`, valueToStore);
    } catch (error) {
      logger.error(`Error setting localStorage key "${key}"`, error);
    }
  }, [key, storedValue]);

  // حذف القيمة من localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      logger.debug(`localStorage removed: ${key}`);
    } catch (error) {
      logger.error(`Error removing localStorage key "${key}"`, error);
    }
  }, [key, initialValue]);

  // مراقبة تغييرات localStorage من نوافذ أخرى
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          logger.warn(`Error parsing localStorage change for key "${key}"`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;