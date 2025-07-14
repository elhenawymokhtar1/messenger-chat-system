/**
 * 🚨 نظام معالجة الأخطاء الموحد
 * 
 * يوفر معالجة موحدة للأخطاء مع تسجيل مفصل ورسائل واضحة
 */

export interface ErrorDetails {
  code?: string;
  component?: string;
  operation?: string;
  userId?: string;
  companyId?: string;
  additionalInfo?: any;
}

export interface StandardError {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  component?: string;
}

export class ErrorHandler {
  
  /**
   * معالجة أخطاء قاعدة البيانات
   */
  static handleDatabaseError(error: any, details?: ErrorDetails): StandardError {
    console.error('❌ [DATABASE ERROR]', {
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      component: details?.component,
      operation: details?.operation,
      companyId: details?.companyId,
      timestamp: new Date().toISOString()
    });

    let userMessage = 'حدث خطأ في قاعدة البيانات';
    
    // رسائل مخصصة حسب نوع الخطأ
    if (error.code === 'ER_DUP_ENTRY') {
      userMessage = 'البيانات موجودة مسبقاً';
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      userMessage = 'البيانات المرجعية غير موجودة';
    } else if (error.code === 'ECONNREFUSED') {
      userMessage = 'فشل في الاتصال بقاعدة البيانات';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      userMessage = 'رفض الوصول لقاعدة البيانات';
    }

    return {
      success: false,
      error: userMessage,
      code: error.code || 'DB_ERROR',
      details: {
        sqlState: error.sqlState,
        errno: error.errno
      },
      timestamp: new Date().toISOString(),
      component: details?.component || 'Database'
    };
  }

  /**
   * معالجة أخطاء Facebook API
   */
  static handleFacebookError(error: any, details?: ErrorDetails): StandardError {
    console.error('❌ [FACEBOOK API ERROR]', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      component: details?.component,
      operation: details?.operation,
      companyId: details?.companyId,
      timestamp: new Date().toISOString()
    });

    let userMessage = 'حدث خطأ في Facebook API';
    let errorCode = 'FB_ERROR';

    if (error.response?.status === 400) {
      userMessage = 'طلب غير صالح لـ Facebook API';
      errorCode = 'FB_BAD_REQUEST';
    } else if (error.response?.status === 401) {
      userMessage = 'Access Token غير صالح أو منتهي الصلاحية';
      errorCode = 'FB_UNAUTHORIZED';
    } else if (error.response?.status === 403) {
      userMessage = 'ليس لديك صلاحية للوصول لهذه البيانات';
      errorCode = 'FB_FORBIDDEN';
    } else if (error.response?.status === 429) {
      userMessage = 'تم تجاوز حد الطلبات المسموح';
      errorCode = 'FB_RATE_LIMIT';
    }

    return {
      success: false,
      error: userMessage,
      code: errorCode,
      details: {
        status: error.response?.status,
        fbError: error.response?.data?.error
      },
      timestamp: new Date().toISOString(),
      component: details?.component || 'Facebook API'
    };
  }

  /**
   * معالجة أخطاء التحقق من البيانات
   */
  static handleValidationError(message: string, details?: ErrorDetails): StandardError {
    console.error('❌ [VALIDATION ERROR]', {
      message,
      component: details?.component,
      operation: details?.operation,
      additionalInfo: details?.additionalInfo,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: message,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
      component: details?.component || 'Validation'
    };
  }

  /**
   * معالجة الأخطاء العامة
   */
  static handleGenericError(error: any, details?: ErrorDetails): StandardError {
    console.error('❌ [GENERIC ERROR]', {
      error: error.message || error,
      stack: error.stack,
      component: details?.component,
      operation: details?.operation,
      companyId: details?.companyId,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: error.message || 'حدث خطأ غير متوقع',
      code: 'GENERIC_ERROR',
      details: {
        originalError: error.name || 'Unknown'
      },
      timestamp: new Date().toISOString(),
      component: details?.component || 'System'
    };
  }

  /**
   * تسجيل العمليات الناجحة
   */
  static logSuccess(operation: string, details?: ErrorDetails): void {
    console.log('✅ [SUCCESS]', {
      operation,
      component: details?.component,
      companyId: details?.companyId,
      userId: details?.userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * تسجيل التحذيرات
   */
  static logWarning(message: string, details?: ErrorDetails): void {
    console.warn('⚠️ [WARNING]', {
      message,
      component: details?.component,
      operation: details?.operation,
      companyId: details?.companyId,
      additionalInfo: details?.additionalInfo,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * تسجيل المعلومات
   */
  static logInfo(message: string, details?: ErrorDetails): void {
    console.log('ℹ️ [INFO]', {
      message,
      component: details?.component,
      operation: details?.operation,
      companyId: details?.companyId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * إنشاء استجابة نجاح موحدة
   */
  static createSuccessResponse(data: any, message?: string): any {
    return {
      success: true,
      data,
      message: message || 'تمت العملية بنجاح',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * التحقق من صحة المعاملات المطلوبة
   */
  static validateRequiredParams(params: any, requiredFields: string[]): StandardError | null {
    const missingFields = requiredFields.filter(field => 
      params[field] === undefined || params[field] === null || params[field] === ''
    );

    if (missingFields.length > 0) {
      return this.handleValidationError(
        `المعاملات المطلوبة مفقودة: ${missingFields.join(', ')}`,
        { additionalInfo: { missingFields, providedParams: Object.keys(params) } }
      );
    }

    return null;
  }

  /**
   * معالجة أخطاء Express middleware
   */
  static expressErrorHandler(error: any, req: any, res: any, next: any): void {
    const errorResponse = this.handleGenericError(error, {
      component: 'Express Middleware',
      operation: `${req.method} ${req.path}`,
      additionalInfo: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body
      }
    });

    res.status(500).json(errorResponse);
  }
}

// تصدير مرجع سريع للدوال الأكثر استخداماً
export const {
  handleDatabaseError,
  handleFacebookError,
  handleValidationError,
  handleGenericError,
  logSuccess,
  logWarning,
  logInfo,
  createSuccessResponse,
  validateRequiredParams
} = ErrorHandler;
