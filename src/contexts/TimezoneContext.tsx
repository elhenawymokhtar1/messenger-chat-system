/**
 * 🌍 Context للمنطقة الزمنية
 * يوفر المنطقة الزمنية المحددة في الإعدادات لجميع المكونات
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

interface TimezoneContextType {
  timezone: string;
  updateTimezone: (newTimezone: string) => void;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};

interface TimezoneProviderProps {
  children: React.ReactNode;
}

export const TimezoneProvider: React.FC<TimezoneProviderProps> = ({ children }) => {
  const [timezone, setTimezone] = useState('Africa/Cairo');

  // تحميل المنطقة الزمنية من الإعدادات
  useEffect(() => {
    const loadTimezone = () => {
      try {
        const savedSettings = localStorage.getItem('systemSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.timezone) {
            setTimezone(settings.timezone);
          }
        }
      } catch (error) {
        console.warn('خطأ في تحميل المنطقة الزمنية:', error);
      }
    };

    loadTimezone();

    // مراقبة تغييرات localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'systemSettings') {
        loadTimezone();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateTimezone = (newTimezone: string) => {
    setTimezone(newTimezone);
    
    // تحديث الإعدادات في localStorage
    try {
      const savedSettings = localStorage.getItem('systemSettings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      settings.timezone = newTimezone;
      localStorage.setItem('systemSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('خطأ في حفظ المنطقة الزمنية:', error);
    }
  };

  return (
    <TimezoneContext.Provider value={{ timezone, updateTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
};
