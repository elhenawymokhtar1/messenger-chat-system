// ⚙️ إعدادات الخادم المستقر
export const SERVER_CONFIG = {
  // إعدادات المنفذ
  PORT: process.env.PORT || 3002,
  
  // إعدادات المراقبة
  MONITORING: {
    ENABLED: true,
    INTERVAL_MS: 30000, // 30 ثانية
    MEMORY_WARNING_MB: 300,
    MEMORY_CRITICAL_MB: 500,
    HEAP_WARNING_PERCENT: 80,
    HEAP_CRITICAL_PERCENT: 90
  },

  // إعدادات إعادة التشغيل
  RESTART: {
    MAX_ATTEMPTS: 10,
    DELAY_MS: 5000,
    RESET_INTERVAL_MS: 3600000 // ساعة واحدة
  },

  // إعدادات قاعدة البيانات
  DATABASE: {
    CONNECTION_TIMEOUT_MS: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 2000
  },

  // إعدادات الأمان
  SECURITY: {
    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000, // 15 دقيقة
      MAX_REQUESTS: 100
    },
    CORS: {
      ORIGIN: process.env.NODE_ENV === 'production'
        ? ['http://localhost:8080', 'http://localhost:8082', 'http://192.168.1.3:8080', 'http://192.168.1.3:8082']
        : true,
      CREDENTIALS: true
    }
  },

  // إعدادات التسجيل
  LOGGING: {
    LEVEL: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    ENABLE_REQUEST_LOGGING: true,
    ENABLE_ERROR_STACK: process.env.NODE_ENV !== 'production'
  },

  // إعدادات الأداء
  PERFORMANCE: {
    ENABLE_COMPRESSION: true,
    ENABLE_ETAG: true,
    JSON_LIMIT: '10mb',
    URL_ENCODED_LIMIT: '10mb'
  },

  // إعدادات البيانات
  DATA_LIMITS: {
    DEFAULT_CONVERSATIONS_LIMIT: 100,
    DEFAULT_MESSAGES_LIMIT: 100,
    MAX_CONVERSATIONS_LIMIT: 500,
    MAX_MESSAGES_LIMIT: 1000,
    ALLOW_UNLIMITED: false // إذا كان true، يمكن إرسال limit=-1 للحصول على جميع البيانات
  }
};

// دالة للحصول على إعدادات البيئة
export function getEnvironmentConfig() {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_DEVELOPMENT: process.env.NODE_ENV !== 'production',
    
    // معلومات قاعدة البيانات
    DB_HOST: process.env.DB_HOST || '193.203.168.103',
    DB_USER: process.env.DB_USER || 'u384034873_conversations',
    DB_PASSWORD: process.env.DB_PASSWORD || '0165676135Aa@A',
    DB_NAME: process.env.DB_NAME || 'u384034873_conversations',
    
    // معلومات الخادم
    SERVER_HOST: process.env.SERVER_HOST || 'localhost',
    EXTERNAL_HOST: process.env.EXTERNAL_HOST || '192.168.1.3'
  };
}

// دالة للتحقق من صحة الإعدادات
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const env = getEnvironmentConfig();

  // التحقق من إعدادات قاعدة البيانات
  if (!env.DB_HOST) errors.push('DB_HOST مطلوب');
  if (!env.DB_USER) errors.push('DB_USER مطلوب');
  if (!env.DB_PASSWORD) errors.push('DB_PASSWORD مطلوب');
  if (!env.DB_NAME) errors.push('DB_NAME مطلوب');

  // التحقق من المنفذ
  const port = Number(SERVER_CONFIG.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT يجب أن يكون رقم صحيح بين 1 و 65535');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// دالة لطباعة معلومات الإعدادات
export function printConfigInfo() {
  const env = getEnvironmentConfig();
  const validation = validateConfig();

  console.log('⚙️ [CONFIG] معلومات إعدادات الخادم:');
  console.log(`   🌍 البيئة: ${env.NODE_ENV}`);
  console.log(`   🚪 المنفذ: ${SERVER_CONFIG.PORT}`);
  console.log(`   🏠 المضيف: ${env.SERVER_HOST}`);
  console.log(`   🌐 المضيف الخارجي: ${env.EXTERNAL_HOST}`);
  console.log(`   🗄️  قاعدة البيانات: ${env.DB_HOST}/${env.DB_NAME}`);
  console.log(`   👤 المستخدم: ${env.DB_USER}`);
  console.log(`   🔍 المراقبة: ${SERVER_CONFIG.MONITORING.ENABLED ? 'مفعلة' : 'معطلة'}`);
  
  if (!validation.isValid) {
    console.error('❌ [CONFIG] أخطاء في الإعدادات:');
    validation.errors.forEach(error => {
      console.error(`   - ${error}`);
    });
  } else {
    console.log('✅ [CONFIG] جميع الإعدادات صحيحة');
  }
}
