-- 🗄️ مخطط قاعدة البيانات الكامل - MySQL/MariaDB
-- نظام إدارة المحادثات والمتجر الإلكتروني
-- بسم الله نبدأ

-- إعدادات قاعدة البيانات
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ===================================
-- 🏢 جدول الشركات (Companies)
-- ===================================
CREATE TABLE companies (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- 📋 بيانات الشركة
    name VARCHAR(255) NOT NULL COMMENT 'اسم الشركة',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'إيميل الشركة',
    phone VARCHAR(50) COMMENT 'رقم الهاتف',
    website VARCHAR(255) COMMENT 'الموقع الإلكتروني',
    
    -- 📍 العنوان
    address TEXT COMMENT 'العنوان',
    city VARCHAR(100) COMMENT 'المدينة',
    country VARCHAR(100) DEFAULT 'Egypt' COMMENT 'الدولة',
    
    -- 🔐 بيانات الحساب
    password_hash VARCHAR(255) NOT NULL COMMENT 'كلمة المرور مشفرة',
    is_verified BOOLEAN DEFAULT FALSE COMMENT 'تم التحقق من الإيميل',
    verification_token VARCHAR(255) COMMENT 'رمز التحقق',
    
    -- 📊 حالة الحساب
    status VARCHAR(50) DEFAULT 'active' COMMENT 'active, suspended, cancelled',
    subscription_status VARCHAR(50) DEFAULT 'trial' COMMENT 'trial, active, expired, cancelled',
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    
    -- فهارس
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
    
    -- 👤 بيانات المستخدم
    name VARCHAR(255) NOT NULL COMMENT 'اسم المستخدم',
    email VARCHAR(255) NOT NULL COMMENT 'الإيميل',
    password_hash VARCHAR(255) NOT NULL COMMENT 'كلمة المرور مشفرة',
    
    -- 🔐 الصلاحيات
    role VARCHAR(50) DEFAULT 'user' COMMENT 'admin, manager, user',
    permissions JSON COMMENT 'الصلاحيات التفصيلية',
    
    -- 📊 الحالة
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    last_login_at TIMESTAMP NULL,
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- العلاقات والفهارس
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
    
    -- 📱 بيانات الصفحة
    page_id VARCHAR(255) NOT NULL COMMENT 'معرف صفحة فيسبوك',
    page_name VARCHAR(255) NOT NULL COMMENT 'اسم الصفحة',
    access_token TEXT NOT NULL COMMENT 'رمز الوصول',
    
    -- ⚙️ الإعدادات
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    webhook_verified BOOLEAN DEFAULT FALSE COMMENT 'تم التحقق من الـ webhook',
    
    -- 📊 الإحصائيات
    total_messages INT DEFAULT 0 COMMENT 'إجمالي الرسائل',
    last_message_at TIMESTAMP NULL COMMENT 'آخر رسالة',
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- العلاقات والفهارس
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
    
    -- 👤 بيانات المستخدم
    user_id VARCHAR(255) NOT NULL COMMENT 'معرف المستخدم في فيسبوك',
    user_name VARCHAR(255) COMMENT 'اسم المستخدم',
    
    -- 📊 حالة المحادثة
    status VARCHAR(50) DEFAULT 'active' COMMENT 'active, closed, archived',
    priority VARCHAR(20) DEFAULT 'normal' COMMENT 'low, normal, high, urgent',
    
    -- 📈 الإحصائيات
    total_messages INT DEFAULT 0 COMMENT 'إجمالي الرسائل',
    unread_messages INT DEFAULT 0 COMMENT 'الرسائل غير المقروءة',
    
    -- 📅 التواريخ
    last_message_at TIMESTAMP NULL COMMENT 'آخر رسالة',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- العلاقات والفهارس
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
    
    -- 📱 بيانات فيسبوك
    facebook_message_id VARCHAR(255) UNIQUE COMMENT 'معرف الرسالة في فيسبوك',
    sender_id VARCHAR(255) NOT NULL COMMENT 'معرف المرسل',
    recipient_id VARCHAR(255) NOT NULL COMMENT 'معرف المستقبل',
    
    -- 📝 محتوى الرسالة
    message_text TEXT COMMENT 'نص الرسالة',
    message_type VARCHAR(50) DEFAULT 'text' COMMENT 'text, image, file, sticker, etc',
    attachments JSON COMMENT 'المرفقات',
    
    -- 📊 حالة الرسالة
    direction VARCHAR(20) NOT NULL COMMENT 'incoming, outgoing',
    status VARCHAR(50) DEFAULT 'sent' COMMENT 'sent, delivered, read, failed',
    is_read BOOLEAN DEFAULT FALSE COMMENT 'تم قراءتها',
    
    -- 🤖 الذكي الاصطناعي
    ai_processed BOOLEAN DEFAULT FALSE COMMENT 'تم معالجتها بالذكي الاصطناعي',
    ai_response TEXT COMMENT 'رد الذكي الاصطناعي',
    
    -- 📅 التواريخ
    sent_at TIMESTAMP NULL COMMENT 'وقت الإرسال',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- العلاقات والفهارس
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

    -- 🔑 إعدادات API
    api_key TEXT COMMENT 'مفتاح API للذكي الاصطناعي',
    model VARCHAR(100) DEFAULT 'gemini-1.5-flash' COMMENT 'نموذج الذكي الاصطناعي',

    -- ⚙️ الإعدادات
    is_enabled BOOLEAN DEFAULT FALSE COMMENT 'مفعل أم لا',
    auto_reply BOOLEAN DEFAULT TRUE COMMENT 'الرد التلقائي',
    response_delay INT DEFAULT 2 COMMENT 'تأخير الرد بالثواني',

    -- 📝 الإعدادات المتقدمة
    system_prompt TEXT COMMENT 'التعليمات الأساسية للذكي الاصطناعي',
    temperature DECIMAL(3,2) DEFAULT 0.7 COMMENT 'درجة الإبداع',
    max_tokens INT DEFAULT 1000 COMMENT 'أقصى عدد كلمات',

    -- 📊 الإحصائيات
    total_requests INT DEFAULT 0 COMMENT 'إجمالي الطلبات',
    successful_requests INT DEFAULT 0 COMMENT 'الطلبات الناجحة',
    failed_requests INT DEFAULT 0 COMMENT 'الطلبات الفاشلة',

    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_company_gemini (company_id),
    INDEX idx_gemini_company (company_id),
    INDEX idx_gemini_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='إعدادات الذكي الاصطناعي';

-- ===================================
-- 🏪 جدول المتاجر
-- ===================================
CREATE TABLE stores (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,

    -- 🏪 بيانات المتجر
    name VARCHAR(255) NOT NULL COMMENT 'اسم المتجر',
    slug VARCHAR(255) UNIQUE NOT NULL COMMENT 'الرابط المختصر',
    description TEXT COMMENT 'وصف المتجر',

    -- 🎨 التصميم
    logo_url TEXT COMMENT 'رابط الشعار',
    banner_url TEXT COMMENT 'رابط البانر',
    theme_color VARCHAR(7) DEFAULT '#3B82F6' COMMENT 'لون المتجر',

    -- 📧 الإعدادات
    owner_email VARCHAR(255) NOT NULL COMMENT 'إيميل صاحب المتجر',
    domain VARCHAR(255) COMMENT 'النطاق المخصص',
    currency VARCHAR(3) DEFAULT 'EGP' COMMENT 'العملة',
    timezone VARCHAR(50) DEFAULT 'Africa/Cairo' COMMENT 'المنطقة الزمنية',

    -- 📊 الحالة
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    is_published BOOLEAN DEFAULT FALSE COMMENT 'منشور أم لا',

    -- ⚙️ الإعدادات المتقدمة
    settings JSON COMMENT 'إعدادات إضافية',

    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_stores_company (company_id),
    INDEX idx_stores_slug (slug),
    INDEX idx_stores_active (is_active),
    INDEX idx_stores_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='المتاجر';

-- ===================================
-- 📂 جدول فئات المنتجات
-- ===================================
CREATE TABLE product_categories (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    store_id CHAR(36) NOT NULL,

    -- 📂 بيانات الفئة
    name VARCHAR(255) NOT NULL COMMENT 'اسم الفئة',
    slug VARCHAR(255) NOT NULL COMMENT 'الرابط المختصر',
    description TEXT COMMENT 'وصف الفئة',

    -- 🎨 التصميم
    icon VARCHAR(50) COMMENT 'أيقونة الفئة',
    color VARCHAR(7) COMMENT 'لون الفئة',
    image_url TEXT COMMENT 'صورة الفئة',

    -- 📊 الترتيب والحالة
    sort_order INT DEFAULT 0 COMMENT 'ترتيب العرض',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',

    -- 📈 الإحصائيات
    products_count INT DEFAULT 0 COMMENT 'عدد المنتجات',

    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    UNIQUE KEY unique_store_category_slug (store_id, slug),
    INDEX idx_categories_store (store_id),
    INDEX idx_categories_active (is_active),
    INDEX idx_categories_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='فئات المنتجات';

-- ===================================
-- 📦 جدول المنتجات
-- ===================================
CREATE TABLE products (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    store_id CHAR(36) NOT NULL,
    category_id CHAR(36),

    -- 📦 بيانات المنتج
    name VARCHAR(255) NOT NULL COMMENT 'اسم المنتج',
    slug VARCHAR(255) NOT NULL COMMENT 'الرابط المختصر',
    description TEXT COMMENT 'وصف المنتج',
    short_description TEXT COMMENT 'وصف مختصر',

    -- 💰 الأسعار
    price DECIMAL(10,2) NOT NULL COMMENT 'السعر الأساسي',
    sale_price DECIMAL(10,2) COMMENT 'سعر التخفيض',
    cost_price DECIMAL(10,2) COMMENT 'سعر التكلفة',

    -- 📊 المخزون
    sku VARCHAR(100) COMMENT 'رمز المنتج',
    stock_quantity INT DEFAULT 0 COMMENT 'الكمية المتاحة',
    manage_stock BOOLEAN DEFAULT TRUE COMMENT 'إدارة المخزون',
    stock_status VARCHAR(20) DEFAULT 'in_stock' COMMENT 'in_stock, out_of_stock, on_backorder',

    -- 📏 المواصفات
    weight DECIMAL(8,2) COMMENT 'الوزن',
    dimensions JSON COMMENT 'الأبعاد {length, width, height}',

    -- 🎨 الصور
    featured_image TEXT COMMENT 'الصورة الرئيسية',
    gallery_images JSON COMMENT 'معرض الصور',

    -- 📊 الحالة والترتيب
    status VARCHAR(20) DEFAULT 'active' COMMENT 'active, inactive, draft',
    type VARCHAR(20) DEFAULT 'simple' COMMENT 'simple, variable',
    featured BOOLEAN DEFAULT FALSE COMMENT 'منتج مميز',
    sort_order INT DEFAULT 0 COMMENT 'ترتيب العرض',

    -- 📈 الإحصائيات
    views_count INT DEFAULT 0 COMMENT 'عدد المشاهدات',
    sales_count INT DEFAULT 0 COMMENT 'عدد المبيعات',
    rating DECIMAL(3,2) DEFAULT 0 COMMENT 'التقييم',
    reviews_count INT DEFAULT 0 COMMENT 'عدد التقييمات',

    -- 🏷️ العلامات
    tags JSON COMMENT 'العلامات',

    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    UNIQUE KEY unique_store_product_slug (store_id, slug),
    INDEX idx_products_store (store_id),
    INDEX idx_products_category (category_id),
    INDEX idx_products_sku (sku),
    INDEX idx_products_status (status),
    INDEX idx_products_featured (featured),
    INDEX idx_products_price (price),
    INDEX idx_products_stock (stock_status),
    INDEX idx_products_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='المنتجات';

-- ===================================
-- 🛒 جدول الطلبات
-- ===================================
CREATE TABLE orders (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    store_id CHAR(36) NOT NULL,

    -- 📋 رقم الطلب
    order_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'رقم الطلب',

    -- 👤 بيانات العميل
    customer_name VARCHAR(255) NOT NULL COMMENT 'اسم العميل',
    customer_email VARCHAR(255) COMMENT 'إيميل العميل',
    customer_phone VARCHAR(50) NOT NULL COMMENT 'هاتف العميل',

    -- 📍 عنوان التوصيل
    shipping_address TEXT NOT NULL COMMENT 'عنوان التوصيل',
    shipping_city VARCHAR(100) NOT NULL COMMENT 'المدينة',
    shipping_notes TEXT COMMENT 'ملاحظات التوصيل',

    -- 💰 المبالغ
    subtotal DECIMAL(10,2) NOT NULL COMMENT 'المجموع الفرعي',
    shipping_cost DECIMAL(10,2) DEFAULT 0 COMMENT 'تكلفة الشحن',
    discount_amount DECIMAL(10,2) DEFAULT 0 COMMENT 'مبلغ الخصم',
    total_amount DECIMAL(10,2) NOT NULL COMMENT 'المبلغ الإجمالي',

    -- 📊 حالة الطلب
    status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, confirmed, processing, shipped, delivered, cancelled',
    payment_status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, paid, failed, refunded',
    payment_method VARCHAR(50) COMMENT 'cash_on_delivery, bank_transfer, etc',

    -- 🚚 الشحن
    shipping_method VARCHAR(100) COMMENT 'طريقة الشحن',
    tracking_number VARCHAR(100) COMMENT 'رقم التتبع',

    -- 📝 ملاحظات
    notes TEXT COMMENT 'ملاحظات الطلب',
    admin_notes TEXT COMMENT 'ملاحظات الإدارة',

    -- 📅 التواريخ
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الطلب',
    confirmed_at TIMESTAMP NULL COMMENT 'تاريخ التأكيد',
    shipped_at TIMESTAMP NULL COMMENT 'تاريخ الشحن',
    delivered_at TIMESTAMP NULL COMMENT 'تاريخ التسليم',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    INDEX idx_orders_store (store_id),
    INDEX idx_orders_number (order_number),
    INDEX idx_orders_customer_phone (customer_phone),
    INDEX idx_orders_status (status),
    INDEX idx_orders_payment_status (payment_status),
    INDEX idx_orders_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='الطلبات';

-- ===================================
-- 📦 جدول تفاصيل الطلبات
-- ===================================
CREATE TABLE order_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,

    -- 📦 بيانات المنتج وقت الطلب
    product_name VARCHAR(255) NOT NULL COMMENT 'اسم المنتج',
    product_sku VARCHAR(100) COMMENT 'رمز المنتج',
    product_image TEXT COMMENT 'صورة المنتج',

    -- 💰 الأسعار والكميات
    unit_price DECIMAL(10,2) NOT NULL COMMENT 'سعر الوحدة',
    quantity INT NOT NULL COMMENT 'الكمية',
    total_price DECIMAL(10,2) NOT NULL COMMENT 'السعر الإجمالي',

    -- 📝 المواصفات
    product_options JSON COMMENT 'خيارات المنتج (لون، مقاس، إلخ)',

    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='تفاصيل الطلبات';

-- ===================================
-- 🚚 جدول طرق الشحن
-- ===================================
CREATE TABLE shipping_methods (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    store_id CHAR(36) NOT NULL,

    -- 🚚 بيانات طريقة الشحن
    name VARCHAR(255) NOT NULL COMMENT 'اسم طريقة الشحن',
    description TEXT COMMENT 'وصف طريقة الشحن',

    -- 💰 التكلفة
    cost DECIMAL(10,2) NOT NULL COMMENT 'تكلفة الشحن',
    free_shipping_threshold DECIMAL(10,2) COMMENT 'حد الشحن المجاني',

    -- ⏱️ التوقيت
    estimated_days VARCHAR(50) COMMENT 'المدة المتوقعة للتوصيل',

    -- 📊 الحالة
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    sort_order INT DEFAULT 0 COMMENT 'ترتيب العرض',

    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    INDEX idx_shipping_methods_store (store_id),
    INDEX idx_shipping_methods_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='طرق الشحن';

-- ===================================
-- 🎫 جدول كوبونات الخصم
-- ===================================
CREATE TABLE coupons (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    store_id CHAR(36) NOT NULL,

    -- 🎫 بيانات الكوبون
    code VARCHAR(50) NOT NULL COMMENT 'كود الكوبون',
    name VARCHAR(255) NOT NULL COMMENT 'اسم الكوبون',
    description TEXT COMMENT 'وصف الكوبون',

    -- 💰 نوع الخصم
    discount_type VARCHAR(20) NOT NULL COMMENT 'fixed, percentage',
    discount_value DECIMAL(10,2) NOT NULL COMMENT 'قيمة الخصم',

    -- 📊 شروط الاستخدام
    minimum_amount DECIMAL(10,2) COMMENT 'أقل مبلغ للاستخدام',
    maximum_discount DECIMAL(10,2) COMMENT 'أقصى خصم',
    usage_limit INT COMMENT 'حد الاستخدام',
    used_count INT DEFAULT 0 COMMENT 'عدد مرات الاستخدام',

    -- 📅 فترة الصلاحية
    starts_at TIMESTAMP NULL COMMENT 'تاريخ البداية',
    expires_at TIMESTAMP NULL COMMENT 'تاريخ الانتهاء',

    -- 📊 الحالة
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',

    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    UNIQUE KEY unique_store_coupon_code (store_id, code),
    INDEX idx_coupons_store (store_id),
    INDEX idx_coupons_code (code),
    INDEX idx_coupons_active (is_active),
    INDEX idx_coupons_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='كوبونات الخصم';

-- ===================================
-- 📊 جدول سجلات النظام
-- ===================================
CREATE TABLE system_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36),

    -- 📊 بيانات السجل
    level VARCHAR(20) NOT NULL COMMENT 'info, warning, error, debug',
    message TEXT NOT NULL COMMENT 'رسالة السجل',
    context JSON COMMENT 'السياق والبيانات الإضافية',

    -- 🔍 التصنيف
    category VARCHAR(50) COMMENT 'facebook, gemini, orders, system',
    action VARCHAR(100) COMMENT 'الإجراء المنفذ',

    -- 👤 المستخدم
    user_id CHAR(36) COMMENT 'معرف المستخدم',
    ip_address VARCHAR(45) COMMENT 'عنوان IP',
    user_agent TEXT COMMENT 'معلومات المتصفح',

    -- 📅 التاريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_system_logs_company (company_id),
    INDEX idx_system_logs_level (level),
    INDEX idx_system_logs_category (category),
    INDEX idx_system_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجلات النظام';

-- ===================================
-- 🔧 إدراج البيانات الأساسية
-- ===================================

-- إنشاء شركة تجريبية
INSERT INTO companies (
    id, name, email, password_hash,
    phone, city, country, status,
    subscription_status, is_verified
) VALUES (
    'c677b32f-fe1c-4c64-8362-a1c03406608d',
    'شركة تجريبية',
    'test@example.com',
    '$2b$10$example.hash.here',
    '+201234567890',
    'القاهرة',
    'مصر',
    'active',
    'trial',
    TRUE
);

-- إنشاء مستخدم أساسي
INSERT INTO company_users (
    id, company_id, name, email,
    password_hash, role, is_active
) VALUES (
    UUID(),
    'c677b32f-fe1c-4c64-8362-a1c03406608d',
    'المدير العام',
    'admin@example.com',
    '$2b$10$example.hash.here',
    'admin',
    TRUE
);

-- إنشاء متجر تجريبي
INSERT INTO stores (
    id, company_id, name, slug,
    description, owner_email, currency,
    is_active, is_published
) VALUES (
    UUID(),
    'c677b32f-fe1c-4c64-8362-a1c03406608d',
    'متجر تجريبي',
    'test-store',
    'متجر تجريبي لاختبار النظام',
    'store@example.com',
    'EGP',
    TRUE,
    TRUE
);

-- إعدادات الذكي الاصطناعي الافتراضية
INSERT INTO gemini_settings (
    id, company_id, model, is_enabled,
    auto_reply, response_delay, temperature,
    max_tokens, system_prompt
) VALUES (
    UUID(),
    'c677b32f-fe1c-4c64-8362-a1c03406608d',
    'gemini-1.5-flash',
    FALSE,
    TRUE,
    2,
    0.7,
    1000,
    'أنت مساعد ذكي لخدمة العملاء. كن مفيداً ومهذباً واستجب باللغة العربية.'
);

-- ===================================
-- 🔧 إجراءات مخزنة مفيدة
-- ===================================

-- إجراء لتحديث إحصائيات المحادثة
DELIMITER //
CREATE PROCEDURE UpdateConversationStats(IN conv_id CHAR(36))
BEGIN
    UPDATE conversations
    SET
        total_messages = (
            SELECT COUNT(*)
            FROM messages
            WHERE conversation_id = conv_id
        ),
        unread_messages = (
            SELECT COUNT(*)
            FROM messages
            WHERE conversation_id = conv_id
            AND direction = 'incoming'
            AND is_read = FALSE
        ),
        last_message_at = (
            SELECT MAX(sent_at)
            FROM messages
            WHERE conversation_id = conv_id
        )
    WHERE id = conv_id;
END //
DELIMITER ;

-- إجراء لتحديث مخزون المنتج
DELIMITER //
CREATE PROCEDURE UpdateProductStock(IN prod_id CHAR(36), IN quantity_sold INT)
BEGIN
    UPDATE products
    SET
        stock_quantity = GREATEST(0, stock_quantity - quantity_sold),
        sales_count = sales_count + quantity_sold,
        stock_status = CASE
            WHEN (stock_quantity - quantity_sold) <= 0 THEN 'out_of_stock'
            ELSE 'in_stock'
        END
    WHERE id = prod_id;
END //
DELIMITER ;

-- ===================================
-- 🎯 انتهى إنشاء قاعدة البيانات
-- ===================================
