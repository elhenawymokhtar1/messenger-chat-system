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

  // تحميل المنطقة الزمنية من الإعدادات - localStorage معطل
  useEffect(() => {
    // استخدام المنطقة الزمنية الافتراضية
    console.log('🌍 [TIMEZONE] استخدام المنطقة الزمنية الافتراضية (localStorage معطل)');
    setTimezone('Asia/Riyadh'); // المنطقة الزمنية الافتراضية للسعودية
  }, []);

  const updateTimezone = (newTimezone: string) => {
    setTimezone(newTimezone);
    console.log('🌍 [TIMEZONE] تم تحديث المنطقة الزمنية:', newTimezone, '(localStorage معطل)');
  };

  return (
    <TimezoneContext.Provider value={{ timezone, updateTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
};
