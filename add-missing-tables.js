#!/usr/bin/env node

/**
 * 🔧 إضافة الجداول المفقودة لقاعدة البيانات MySQL
 * يضيف فقط الجداول التي لا توجد بالفعل
 */

import mysql from 'mysql2/promise';

// إعدادات قاعدة البيانات
const DB_CONFIG = {
  host: '193.203.168.103',
  user: 'u384034873_conversations',
  password: '0165676135Aa@A',
  database: 'u384034873_conversations',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// SQL لإنشاء الجداول المفقودة
const MISSING_TABLES_SQL = `
-- ===================================
-- 🏪 جدول المتاجر
-- ===================================
CREATE TABLE IF NOT EXISTS stores (
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
CREATE TABLE IF NOT EXISTS product_categories (
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
CREATE TABLE IF NOT EXISTS products (
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
CREATE TABLE IF NOT EXISTS orders (
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
CREATE TABLE IF NOT EXISTS order_items (
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
CREATE TABLE IF NOT EXISTS shipping_methods (
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
CREATE TABLE IF NOT EXISTS coupons (
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
CREATE TABLE IF NOT EXISTS system_logs (
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
`;

async function addMissingTables() {
  let connection;
  
  try {
    console.log('🔧 بدء إضافة الجداول المفقودة...\n');
    
    // الاتصال بقاعدة البيانات
    console.log('📡 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بنجاح!\n');
    
    // تنفيذ SQL لإنشاء الجداول
    console.log('🏗️ إنشاء الجداول المفقودة...');
    
    const statements = MISSING_TABLES_SQL.split(';').filter(stmt => stmt.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await connection.execute(statement);
          
          // استخراج اسم الجدول من SQL
          const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
          if (tableMatch) {
            console.log(`✅ تم إنشاء جدول: ${tableMatch[1]}`);
          }
        } catch (error) {
          console.log(`⚠️ تحذير: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 تم الانتهاء من إنشاء الجداول الأساسية!');
    
  } catch (error) {
    console.error('❌ خطأ في إضافة الجداول:', error.message);
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📡 تم إغلاق الاتصال');
    }
  }
}

// تشغيل الإضافة
addMissingTables()
  .then(() => {
    console.log('\n🏁 انتهت عملية إضافة الجداول');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 خطأ عام:', error);
    process.exit(1);
  });

export { addMissingTables };
