/**
 * ✅ أدوات التحقق والتصديق
 * تم إنشاؤها تلقائياً بواسطة Smart Code Generator
 */

export const validation = {
  // التحقق من البريد الإلكتروني
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // التحقق من رقم الهاتف
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9]?\d{9,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // التحقق من قوة كلمة المرور
  isStrongPassword: (password: string): boolean => {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /\d/.test(password) &&
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

export default validation;