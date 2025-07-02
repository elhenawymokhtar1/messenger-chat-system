#!/usr/bin/env node

/**
 * 🔧 إضافة جميع الجداول المفقودة لقاعدة البيانات MySQL
 * يضيف الجداول المطلوبة لإكمال النظام بالكامل
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

// SQL لإنشاء الجداول المفقودة - الجزء الأول
const MISSING_TABLES_SQL_PART1 = `
-- ===================================
-- 🎨 جدول متغيرات المنتجات
-- ===================================
CREATE TABLE IF NOT EXISTS product_variants (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,

    -- 🎨 بيانات المتغير
    name VARCHAR(255) NOT NULL COMMENT 'اسم المتغير (مثل: أحمر - كبير)',
    sku VARCHAR(100) UNIQUE COMMENT 'رمز المتغير',
    
    -- 💰 الأسعار
    price DECIMAL(10,2) NOT NULL COMMENT 'سعر المتغير',
    sale_price DECIMAL(10,2) COMMENT 'سعر التخفيض',
    cost_price DECIMAL(10,2) COMMENT 'سعر التكلفة',

    -- 📊 المخزون
    stock_quantity INT DEFAULT 0 COMMENT 'الكمية المتاحة',
    stock_status VARCHAR(20) DEFAULT 'in_stock' COMMENT 'حالة المخزون',

    -- 🎨 الصور والخصائص
    image_url TEXT COMMENT 'صورة المتغير',
    attributes JSON COMMENT 'الخصائص {color: "أحمر", size: "كبير"}',

    -- 📊 الحالة
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    sort_order INT DEFAULT 0 COMMENT 'ترتيب العرض',

    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_variants_product (product_id),
    INDEX idx_product_variants_sku (sku),
    INDEX idx_product_variants_active (is_active),
    INDEX idx_product_variants_stock (stock_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='متغيرات المنتجات';

-- ===================================
-- 🔧 جدول خيارات متغيرات المنتجات
-- ===================================
CREATE TABLE IF NOT EXISTS product_variant_options (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,

    -- 🔧 بيانات الخيار
    option_name VARCHAR(100) NOT NULL COMMENT 'اسم الخيار (لون، مقاس)',
    option_type VARCHAR(50) DEFAULT 'select' COMMENT 'select, color, size, text',
    
    -- 📋 القيم المتاحة
    option_values JSON NOT NULL COMMENT 'القيم المتاحة ["أحمر", "أزرق", "أخضر"]',
    
    -- 📊 الإعدادات
    is_required BOOLEAN DEFAULT TRUE COMMENT 'مطلوب أم لا',
    sort_order INT DEFAULT 0 COMMENT 'ترتيب العرض',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',

    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_variant_options_product (product_id),
    INDEX idx_variant_options_name (option_name),
    INDEX idx_variant_options_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='خيارات متغيرات المنتجات';

-- ===================================
-- 💳 جدول طرق الدفع
-- ===================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    store_id CHAR(36) NOT NULL,

    -- 💳 بيانات طريقة الدفع
    name VARCHAR(255) NOT NULL COMMENT 'اسم طريقة الدفع',
    type VARCHAR(50) NOT NULL COMMENT 'cash_on_delivery, bank_transfer, credit_card, digital_wallet',
    description TEXT COMMENT 'وصف طريقة الدفع',

    -- ⚙️ الإعدادات
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    sort_order INT DEFAULT 0 COMMENT 'ترتيب العرض',
    
    -- 💰 الرسوم
    fee_type VARCHAR(20) DEFAULT 'none' COMMENT 'none, fixed, percentage',
    fee_amount DECIMAL(10,2) DEFAULT 0 COMMENT 'مبلغ أو نسبة الرسوم',
    
    -- 🔧 إعدادات إضافية
    settings JSON COMMENT 'إعدادات خاصة بطريقة الدفع',
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    INDEX idx_payment_methods_store (store_id),
    INDEX idx_payment_methods_type (type),
    INDEX idx_payment_methods_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='طرق الدفع';

-- ===================================
-- 📋 جدول خطط الاشتراك
-- ===================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- 📋 بيانات الخطة
    name VARCHAR(255) NOT NULL COMMENT 'اسم الخطة',
    slug VARCHAR(255) UNIQUE NOT NULL COMMENT 'الرابط المختصر',
    description TEXT COMMENT 'وصف الخطة',

    -- 💰 التسعير
    price DECIMAL(10,2) NOT NULL COMMENT 'السعر',
    currency VARCHAR(3) DEFAULT 'EGP' COMMENT 'العملة',
    billing_period VARCHAR(20) NOT NULL COMMENT 'monthly, yearly',
    
    -- 📊 الحدود والميزات
    features JSON COMMENT 'الميزات المتاحة',
    limits JSON COMMENT 'الحدود {messages: 1000, users: 5}',
    
    -- 📈 الإعدادات
    is_active BOOLEAN DEFAULT TRUE COMMENT 'نشط أم لا',
    is_popular BOOLEAN DEFAULT FALSE COMMENT 'خطة شائعة',
    sort_order INT DEFAULT 0 COMMENT 'ترتيب العرض',
    
    -- 🎁 فترة تجريبية
    trial_days INT DEFAULT 0 COMMENT 'أيام التجربة المجانية',
    
    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- الفهارس
    INDEX idx_subscription_plans_slug (slug),
    INDEX idx_subscription_plans_active (is_active),
    INDEX idx_subscription_plans_popular (is_popular)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='خطط الاشتراك';

-- ===================================
-- 🏢 جدول اشتراكات الشركات
-- ===================================
CREATE TABLE IF NOT EXISTS company_subscriptions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    company_id CHAR(36) NOT NULL,
    plan_id CHAR(36) NOT NULL,

    -- 📊 حالة الاشتراك
    status VARCHAR(50) DEFAULT 'active' COMMENT 'active, cancelled, expired, suspended',
    
    -- 📅 التواريخ
    starts_at TIMESTAMP NOT NULL COMMENT 'تاريخ البداية',
    ends_at TIMESTAMP NOT NULL COMMENT 'تاريخ الانتهاء',
    cancelled_at TIMESTAMP NULL COMMENT 'تاريخ الإلغاء',
    
    -- 💰 الدفع
    amount_paid DECIMAL(10,2) NOT NULL COMMENT 'المبلغ المدفوع',
    payment_method VARCHAR(100) COMMENT 'طريقة الدفع',
    payment_reference VARCHAR(255) COMMENT 'مرجع الدفع',
    
    -- 📊 الاستخدام
    usage_data JSON COMMENT 'بيانات الاستخدام',
    
    -- 🔄 التجديد
    auto_renew BOOLEAN DEFAULT TRUE COMMENT 'التجديد التلقائي',
    next_billing_date TIMESTAMP NULL COMMENT 'تاريخ الفاتورة التالية',

    -- 📅 التواريخ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- العلاقات والفهارس
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    INDEX idx_company_subscriptions_company (company_id),
    INDEX idx_company_subscriptions_plan (plan_id),
    INDEX idx_company_subscriptions_status (status),
    INDEX idx_company_subscriptions_ends_at (ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='اشتراكات الشركات';
`;

async function addAllMissingTables() {
  let connection;
  
  try {
    console.log('🔧 بدء إضافة جميع الجداول المفقودة...\n');
    
    // الاتصال بقاعدة البيانات
    console.log('📡 الاتصال بقاعدة البيانات...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ تم الاتصال بنجاح!\n');
    
    // إضافة الجزء الأول من الجداول
    console.log('🏗️ إنشاء الجداول - الجزء الأول...');
    await executeSQL(connection, MISSING_TABLES_SQL_PART1, 'الجزء الأول');
    
    console.log('\n🎉 تم الانتهاء من الجزء الأول!');
    
    // إضافة بيانات تجريبية
    await addSampleData(connection);
    
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

async function executeSQL(connection, sql, description) {
  const statements = sql.split(';').filter(stmt => stmt.trim());
  
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
        console.log(`⚠️ تحذير في ${description}: ${error.message}`);
      }
    }
  }
}

async function addSampleData(connection) {
  try {
    console.log('\n📝 إضافة بيانات تجريبية...');
    
    // إضافة خطط اشتراك تجريبية
    await connection.execute(`
      INSERT IGNORE INTO subscription_plans (
        id, name, slug, description, price, billing_period,
        features, limits, is_active, is_popular, trial_days
      ) VALUES 
      (
        UUID(), 'الخطة الأساسية', 'basic', 
        'خطة مناسبة للشركات الصغيرة', 99.00, 'monthly',
        '["رسائل فيسبوك", "رد تلقائي", "دعم فني"]',
        '{"messages": 1000, "users": 2}',
        TRUE, FALSE, 7
      ),
      (
        UUID(), 'الخطة المتقدمة', 'pro', 
        'خطة مناسبة للشركات المتوسطة', 199.00, 'monthly',
        '["رسائل فيسبوك", "واتساب", "متجر إلكتروني", "تقارير"]',
        '{"messages": 5000, "users": 10}',
        TRUE, TRUE, 14
      ),
      (
        UUID(), 'خطة الأعمال', 'business', 
        'خطة شاملة للشركات الكبيرة', 399.00, 'monthly',
        '["جميع الميزات", "دعم أولوية", "تخصيص كامل"]',
        '{"messages": -1, "users": -1}',
        TRUE, FALSE, 30
      )
    `);
    
    console.log('✅ تم إضافة خطط الاشتراك التجريبية');
    
    // إضافة طرق دفع تجريبية
    const [stores] = await connection.execute('SELECT id FROM stores LIMIT 1');
    if (stores.length > 0) {
      const storeId = stores[0].id;
      
      await connection.execute(`
        INSERT IGNORE INTO payment_methods (
          id, store_id, name, type, description, is_active, sort_order
        ) VALUES 
        (UUID(), ?, 'الدفع عند الاستلام', 'cash_on_delivery', 'ادفع عند وصول الطلب', TRUE, 1),
        (UUID(), ?, 'تحويل بنكي', 'bank_transfer', 'تحويل إلى الحساب البنكي', TRUE, 2),
        (UUID(), ?, 'فودافون كاش', 'digital_wallet', 'الدفع عبر فودافون كاش', TRUE, 3),
        (UUID(), ?, 'انستاباي', 'digital_wallet', 'الدفع عبر انستاباي', TRUE, 4)
      `, [storeId, storeId, storeId, storeId]);
      
      console.log('✅ تم إضافة طرق الدفع التجريبية');
    }
    
  } catch (error) {
    console.log(`⚠️ تحذير في إضافة البيانات التجريبية: ${error.message}`);
  }
}

// تشغيل الإضافة
addAllMissingTables()
  .then(() => {
    console.log('\n🏁 انتهت عملية إضافة الجداول - الجزء الأول');
    console.log('🔄 سيتم إنشاء الجزء الثاني في ملف منفصل...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 خطأ عام:', error);
    process.exit(1);
  });

export { addAllMissingTables };
