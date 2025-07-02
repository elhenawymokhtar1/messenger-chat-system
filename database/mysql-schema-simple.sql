-- 🗄️ مخطط قاعدة البيانات المبسط - MySQL/MariaDB
-- نظام إدارة المحادثات والمتجر الإلكتروني

-- إعدادات قاعدة البيانات
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ===================================
-- 🏢 جدول الشركات
-- ===================================
CREATE TABLE companies (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL COMMENT 'اسم الشركة',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'إيميل الشركة',
    phone VARCHAR(50) COMMENT 'رقم الهاتف',
    website VARCHAR(255) COMMENT 'الموقع الإلكتروني',
    address TEXT COMMENT 'العنوان',
    city VARCHAR(100) COMMENT 'المدينة',
    country VARCHAR(100) DEFAULT 'Egypt' COMMENT 'الدولة',
    password_hash VARCHAR(255) NOT NULL COMMENT 'كلمة المرور مشفرة',
    is_verified BOOLEAN DEFAULT FALSE COMMENT 'تم التحقق من الإيميل',
    verification_token VARCHAR(255) COMMENT 'رمز التحقق',
    status VARCHAR(50) DEFAULT 'active' COMMENT 'active, suspended, cancelled',
    subscription_status VARCHAR(50) DEFAULT 'trial' COMMENT 'trial, active, expired, cancelled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    INDEX idx_companies_email (email),
    INDEX idx_companies_status (status),
    INDEX idx_companies_subscription (subscription_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول الشركات';

-- ===================================
-- 👥 جدول مستخدمي الشركات
-- ===================================
CREATE TABLE company_users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL COMMENT 'اسم المستخدم',
    email VARCHAR(255) NOT NULL COMMENT 'الإيميل',
    password_hash VARCHAR(255) NOT NULL COMMENT 'كلمة المرور مشفرة',
    role VARCHAR(50) DEFAULT 'user' COMMENT 'admin, manager, user',
    permissions JSON COMMENT 'الصلاحيات التفصيلية',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_company_email (company_id, email),
    INDEX idx_company_users_company (company_id),
    INDEX idx_company_users_email (email),
    INDEX idx_company_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='مستخدمو الشركات';

-- ===================================
-- 📱 جدول إعدادات فيسبوك
-- ===================================
CREATE TABLE facebook_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    page_id VARCHAR(255) NOT NULL COMMENT 'معرف صفحة فيسبوك',
    page_name VARCHAR(255) NOT NULL COMMENT 'اسم الصفحة',
    access_token TEXT NOT NULL COMMENT 'رمز الوصول',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    webhook_verified BOOLEAN DEFAULT FALSE COMMENT 'تم التحقق من الـ webhook',
    total_messages INT DEFAULT 0 COMMENT 'إجمالي الرسائل',
    last_message_at TIMESTAMP NULL COMMENT 'آخر رسالة',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_id (page_id),
    INDEX idx_facebook_company (company_id),
    INDEX idx_facebook_page (page_id),
    INDEX idx_facebook_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='إعدادات صفحات فيسبوك';

-- ===================================
-- 💬 جدول المحادثات
-- ===================================
CREATE TABLE conversations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    facebook_page_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL COMMENT 'معرف المستخدم في فيسبوك',
    user_name VARCHAR(255) COMMENT 'اسم المستخدم',
    status VARCHAR(50) DEFAULT 'active' COMMENT 'active, closed, archived',
    priority VARCHAR(20) DEFAULT 'normal' COMMENT 'low, normal, high, urgent',
    total_messages INT DEFAULT 0 COMMENT 'إجمالي الرسائل',
    unread_messages INT DEFAULT 0 COMMENT 'الرسائل غير المقروءة',
    last_message_at TIMESTAMP NULL COMMENT 'آخر رسالة',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (facebook_page_id) REFERENCES facebook_settings(page_id) ON DELETE CASCADE,
    UNIQUE KEY unique_conversation (facebook_page_id, user_id),
    INDEX idx_conversations_company (company_id),
    INDEX idx_conversations_page (facebook_page_id),
    INDEX idx_conversations_user (user_id),
    INDEX idx_conversations_status (status),
    INDEX idx_conversations_last_message (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='المحادثات';

-- ===================================
-- 💌 جدول الرسائل
-- ===================================
CREATE TABLE messages (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id CHAR(36) NOT NULL,
    company_id CHAR(36) NOT NULL,
    facebook_message_id VARCHAR(255) UNIQUE COMMENT 'معرف الرسالة في فيسبوك',
    sender_id VARCHAR(255) NOT NULL COMMENT 'معرف المرسل',
    recipient_id VARCHAR(255) NOT NULL COMMENT 'معرف المستقبل',
    message_text TEXT COMMENT 'نص الرسالة',
    message_type VARCHAR(50) DEFAULT 'text' COMMENT 'text, image, file, sticker, etc',
    attachments JSON COMMENT 'المرفقات',
    direction VARCHAR(20) NOT NULL COMMENT 'incoming, outgoing',
    status VARCHAR(50) DEFAULT 'sent' COMMENT 'sent, delivered, read, failed',
    is_read BOOLEAN DEFAULT FALSE COMMENT 'تم قراءتها',
    ai_processed BOOLEAN DEFAULT FALSE COMMENT 'تم معالجتها بالذكي الاصطناعي',
    ai_response TEXT COMMENT 'رد الذكي الاصطناعي',
    sent_at TIMESTAMP NULL COMMENT 'وقت الإرسال',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_messages_conversation (conversation_id),
    INDEX idx_messages_company (company_id),
    INDEX idx_messages_facebook_id (facebook_message_id),
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_direction (direction),
    INDEX idx_messages_status (status),
    INDEX idx_messages_sent_at (sent_at),
    INDEX idx_messages_ai_processed (ai_processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='الرسائل';

-- ===================================
-- 🤖 جدول إعدادات الذكي الاصطناعي
-- ===================================
CREATE TABLE gemini_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    api_key TEXT COMMENT 'مفتاح API للذكي الاصطناعي',
    model VARCHAR(100) DEFAULT 'gemini-1.5-flash' COMMENT 'نموذج الذكي الاصطناعي',
    is_enabled BOOLEAN DEFAULT FALSE COMMENT 'مفعل أم لا',
    auto_reply BOOLEAN DEFAULT TRUE COMMENT 'الرد التلقائي',
    response_delay INT DEFAULT 2 COMMENT 'تأخير الرد بالثواني',
    system_prompt TEXT COMMENT 'التعليمات الأساسية للذكي الاصطناعي',
    temperature DECIMAL(3,2) DEFAULT 0.7 COMMENT 'درجة الإبداع',
    max_tokens INT DEFAULT 1000 COMMENT 'أقصى عدد كلمات',
    total_requests INT DEFAULT 0 COMMENT 'إجمالي الطلبات',
    successful_requests INT DEFAULT 0 COMMENT 'الطلبات الناجحة',
    failed_requests INT DEFAULT 0 COMMENT 'الطلبات الفاشلة',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_company_gemini (company_id),
    INDEX idx_gemini_company (company_id),
    INDEX idx_gemini_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='إعدادات الذكي الاصطناعي';
