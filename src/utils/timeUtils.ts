/**
 * 🕐 أدوات التوقيت - تحويل وتنسيق الأوقات
 * يحل مشكلة اختلاف التوقيت بين قاعدة البيانات والواجهة الأمامية
 */

// المنطقة الزمنية الافتراضية (مصر)
const DEFAULT_TIMEZONE = 'Africa/Cairo';

/**
 * الحصول على المنطقة الزمنية من الإعدادات
 */
function getUserTimezone(): string {
  try {
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.timezone || DEFAULT_TIMEZONE;
    }
  } catch (error) {
    console.warn('خطأ في قراءة إعدادات المنطقة الزمنية:', error);
  }
  return DEFAULT_TIMEZONE;
}

/**
 * تحويل التوقيت من UTC إلى التوقيت المحلي
 */
export function convertToLocalTime(utcTimeString: string, timezone?: string): Date {
  const userTimezone = timezone || getUserTimezone();
  if (!utcTimeString) return new Date();
  
  try {
    // إنشاء كائن Date من النص
    const utcDate = new Date(utcTimeString);
    
    // التأكد من صحة التاريخ
    if (isNaN(utcDate.getTime())) {
      console.warn('تاريخ غير صحيح:', utcTimeString);
      return new Date();
    }
    
    return utcDate;
  } catch (error) {
    console.error('خطأ في تحويل التوقيت:', error);
    return new Date();
  }
}

/**
 * تنسيق الوقت للعرض (ساعة:دقيقة)
 */
export function formatTime(timeString: string, timezone?: string): string {
  const userTimezone = timezone || getUserTimezone();
  if (!timeString) return '';
  
  try {
    const date = convertToLocalTime(timeString, userTimezone);
    return date.toLocaleTimeString('ar-EG', {
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('خطأ في تنسيق الوقت:', error);
    return timeString;
  }
}

/**
 * تنسيق التاريخ للعرض
 */
export function formatDate(timeString: string, timezone?: string): string {
  const userTimezone = timezone || getUserTimezone();
  if (!timeString) return '';
  
  try {
    const date = convertToLocalTime(timeString, userTimezone);
    return date.toLocaleDateString('ar-EG', {
      timeZone: userTimezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return timeString;
  }
}

/**
 * تنسيق التاريخ والوقت معاً
 */
export function formatDateTime(timeString: string, timezone?: string): string {
  const userTimezone = timezone || getUserTimezone();
  if (!timeString) return '';
  
  try {
    const date = convertToLocalTime(timeString, userTimezone);
    return date.toLocaleString('ar-EG', {
      timeZone: userTimezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ والوقت:', error);
    return timeString;
  }
}

/**
 * حساب الوقت النسبي (منذ كم دقيقة/ساعة/يوم)
 */
export function formatRelativeTime(timeString: string, timezone?: string): string {
  const userTimezone = timezone || getUserTimezone();
  if (!timeString) return '';
  
  try {
    const date = convertToLocalTime(timeString, userTimezone);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;

    // إذا كان أكثر من أسبوع، اعرض التاريخ
    return formatDate(timeString, userTimezone);
  } catch (error) {
    console.error('خطأ في حساب الوقت النسبي:', error);
    return timeString;
  }
}

/**
 * تحديد ما إذا كان التاريخ اليوم أم لا
 */
export function isToday(timeString: string, timezone?: string): boolean {
  const userTimezone = timezone || getUserTimezone();
  if (!timeString) return false;
  
  try {
    const date = convertToLocalTime(timeString, userTimezone);
    const today = new Date();

    return date.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
}

/**
 * تحديد ما إذا كان التاريخ أمس أم لا
 */
export function isYesterday(timeString: string, timezone?: string): boolean {
  const userTimezone = timezone || getUserTimezone();
  if (!timeString) return false;

  try {
    const date = convertToLocalTime(timeString, userTimezone);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return date.toDateString() === yesterday.toDateString();
  } catch (error) {
    return false;
  }
}

/**
 * تنسيق ذكي للوقت (اليوم: الوقت، أمس: أمس، غير ذلك: التاريخ)
 */
export function formatSmartTime(timeString: string, timezone?: string): string {
  const userTimezone = timezone || getUserTimezone();
  if (!timeString) return '';

  try {
    if (isToday(timeString, userTimezone)) {
      return formatTime(timeString, userTimezone);
    } else if (isYesterday(timeString, userTimezone)) {
      return 'أمس';
    } else {
      const date = convertToLocalTime(timeString, userTimezone);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

      if (diffDays < 7) {
        return `منذ ${diffDays} يوم`;
      } else {
        return date.toLocaleDateString('ar-EG', {
          timeZone: userTimezone,
          month: 'short',
          day: 'numeric'
        });
      }
    }
  } catch (error) {
    console.error('خطأ في التنسيق الذكي:', error);
    return timeString;
  }
}

/**
 * الحصول على التوقيت الحالي بالمنطقة الزمنية المحددة
 */
export function getCurrentTime(timezone?: string): string {
  const userTimezone = timezone || getUserTimezone();
  return new Date().toLocaleString('ar-EG', {
    timeZone: userTimezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * تحويل التوقيت إلى UTC للإرسال لقاعدة البيانات
 */
export function convertToUTC(localTimeString: string): string {
  try {
    const date = new Date(localTimeString);
    return date.toISOString();
  } catch (error) {
    console.error('خطأ في تحويل إلى UTC:', error);
    return new Date().toISOString();
  }
}
