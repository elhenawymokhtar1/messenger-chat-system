/**
 * 🔧 Hook لإدارة إعدادات النظام - localStorage معطل
 * يستخدم React state فقط مع الإعدادات الافتراضية
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface SystemSettings {
  // إعدادات المنطقة الزمنية
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  
  // إعدادات اللغة والمنطقة
  language: string;
  country: string;
  currency: string;
  
  // إعدادات المظهر
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  
  // إعدادات الإشعارات
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  
  // إعدادات النظام
  autoSave: boolean;
  debugMode: boolean;
  analyticsEnabled: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  timezone: 'Africa/Cairo',
  dateFormat: 'dd/mm/yyyy',
  timeFormat: '24h',
  language: 'ar',
  country: 'EG',
  currency: 'EGP',
  theme: 'light',
  primaryColor: '#3B82F6',
  fontSize: 'medium',
  emailNotifications: true,
  pushNotifications: true,
  soundEnabled: true,
  autoSave: true,
  debugMode: false,
  analyticsEnabled: true
};

export const useSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // تحميل الإعدادات عند بدء التطبيق
  useEffect(() => {
    loadSettings();
  }, []);

  // تحميل الإعدادات من الخادم
  const loadSettings = async () => {
    setIsLoading(true);

    try {
      // استخدام الإعدادات الافتراضية
      setSettings(DEFAULT_SETTINGS);

      // TODO: تحميل من الخادم في المستقبل
      // const serverSettings = await fetchSettingsFromServer();
      // if (serverSettings) {
      //   setSettings({ ...DEFAULT_SETTINGS, ...serverSettings });
      // }

    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
      toast.error('فشل في تحميل الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  // حفظ الإعدادات
  const saveSettings = async (newSettings?: Partial<SystemSettings>) => {
    setIsSaving(true);
    
    try {
      const settingsToSave = newSettings ? { ...settings, ...newSettings } : settings;
      
      // localStorage معطل - استخدام React state فقط
      console.log('🔧 [SETTINGS] حفظ الإعدادات في React state (localStorage معطل)');
      
      // TODO: إرسال للخادم في المستقبل
      // await saveSettingsToServer(settingsToSave);
      
      if (newSettings) {
        setSettings(settingsToSave);
      }
      
      setHasChanges(false);
      toast.success('تم حفظ الإعدادات بنجاح');
      
      // تطبيق الإعدادات فوراً
      applySettings(settingsToSave);
      
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  // تحديث إعداد واحد
  const updateSetting = <K extends keyof SystemSettings>(
    key: K, 
    value: SystemSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // الحفظ التلقائي إذا كان مفعلاً
    if (settings.autoSave) {
      setTimeout(() => {
        saveSettings({ [key]: value } as Partial<SystemSettings>);
      }, 1000);
    }
  };

  // تطبيق الإعدادات على النظام
  const applySettings = (settingsToApply: SystemSettings) => {
    // تطبيق المظهر
    if (settingsToApply.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settingsToApply.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // system theme
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // تطبيق اللون الأساسي
    document.documentElement.style.setProperty('--primary-color', settingsToApply.primaryColor);

    // تطبيق حجم الخط
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    document.documentElement.style.setProperty('--base-font-size', fontSizes[settingsToApply.fontSize]);

    // تطبيق اتجاه النص حسب اللغة
    if (settingsToApply.language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = settingsToApply.language;
    }
  };

  // إعادة تعيين الإعدادات للافتراضية
  const resetSettings = async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      console.log('🔧 [SETTINGS] إعادة تعيين الإعدادات (localStorage معطل)');
      applySettings(DEFAULT_SETTINGS);
      setHasChanges(false);
      toast.success('تم إعادة تعيين الإعدادات');
    } catch (error) {
      toast.error('فشل في إعادة تعيين الإعدادات');
    }
  };

  // تصدير الإعدادات
  const exportSettings = () => {
    try {
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('تم تصدير الإعدادات');
    } catch (error) {
      toast.error('فشل في تصدير الإعدادات');
    }
  };

  // استيراد الإعدادات
  const importSettings = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        const validatedSettings = { ...DEFAULT_SETTINGS, ...importedSettings };
        setSettings(validatedSettings);
        saveSettings(validatedSettings);
        toast.success('تم استيراد الإعدادات بنجاح');
      } catch (error) {
        toast.error('ملف الإعدادات غير صحيح');
      }
    };
    reader.readAsText(file);
  };

  // تطبيق الإعدادات عند التحميل
  useEffect(() => {
    if (!isLoading) {
      applySettings(settings);
    }
  }, [settings, isLoading]);

  return {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    updateSetting,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings,
    loadSettings
  };
};
