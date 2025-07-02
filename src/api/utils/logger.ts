/**
 * 📝 Logger للخادم
 * يوفر نظام تسجيل موحد للخادم
 */

export interface LogLevel {
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  message: string;
  data?: any;
  timestamp?: string;
}

class Logger {
  private getTimestamp(): string {
    return new Date().toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = this.getTimestamp();
    const emoji = {
      'info': 'ℹ️',
      'warn': '⚠️',
      'error': '❌',
      'debug': '🔍',
      'success': '✅'
    }[level] || '📝';

    let logMessage = `${emoji} [${timestamp}] ${message}`;
    
    if (data) {
      logMessage += `\n   📋 البيانات: ${JSON.stringify(data, null, 2)}`;
    }
    
    return logMessage;
  }

  info(message: string, data?: any): void {
    console.log(this.formatMessage('info', message, data));
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage('warn', message, data));
  }

  error(message: string, data?: any): void {
    console.error(this.formatMessage('error', message, data));
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  success(message: string, data?: any): void {
    console.log(this.formatMessage('success', message, data));
  }

  // دالة للتسجيل مع مستوى مخصص
  log(level: LogLevel['level'], message: string, data?: any): void {
    switch (level) {
      case 'info':
        this.info(message, data);
        break;
      case 'warn':
        this.warn(message, data);
        break;
      case 'error':
        this.error(message, data);
        break;
      case 'debug':
        this.debug(message, data);
        break;
      case 'success':
        this.success(message, data);
        break;
      default:
        this.info(message, data);
    }
  }
}

// إنشاء instance واحد للاستخدام في كامل التطبيق
export const logger = new Logger();

// تصدير الكلاس أيضاً للاستخدام المتقدم
export default Logger;
