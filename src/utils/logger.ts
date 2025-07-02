/**
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
      console.log(`${emoji} [${level.toUpperCase()}] ${message}`, data || '');
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
export default logger;