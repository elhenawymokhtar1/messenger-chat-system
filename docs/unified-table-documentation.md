# 📊 توثيق الجدول الموحد لصفحات Facebook

## 📋 نظرة عامة

تم إنشاء الجدول الموحد `facebook_pages_unified` لدمج وتوحيد البيانات من الجدولين القديمين:
- `facebook_settings`
- `facebook_pages`

**تاريخ الإنشاء:** 11 يوليو 2025  
**الإصدار:** 1.0  
**الحالة:** نشط ومُختبر

## 🏗️ بنية الجدول

### اسم الجدول
```sql
facebook_pages_unified
```

### المحرك والترميز
- **المحرك:** InnoDB
- **الترميز:** utf8mb4_unicode_ci
- **المنطقة الزمنية:** UTC

## 📝 الحقول التفصيلية

### 🔑 الحقول الأساسية

| الحقل | النوع | الوصف | القيود |
|-------|------|-------|--------|
| `id` | VARCHAR(255) | المعرف الفريد للسجل | PRIMARY KEY |
| `company_id` | VARCHAR(255) | معرف الشركة | NOT NULL, INDEX |
| `page_id` | VARCHAR(255) | معرف صفحة Facebook | NOT NULL, INDEX |
| `page_name` | VARCHAR(255) | اسم الصفحة | NULL |
| `page_username` | VARCHAR(255) | اسم المستخدم للصفحة | NULL |

### 🔐 حقول المصادقة

| الحقل | النوع | الوصف | القيود |
|-------|------|-------|--------|
| `access_token` | TEXT | رمز الوصول لـ Facebook API | NULL |

### 🔗 حقول Webhook

| الحقل | النوع | الوصف | القيود |
|-------|------|-------|--------|
| `webhook_enabled` | BOOLEAN | هل Webhook مفعل | DEFAULT FALSE |
| `webhook_url` | VARCHAR(500) | رابط Webhook | NULL |
| `webhook_verify_token` | VARCHAR(255) | رمز التحقق من Webhook | NULL |
| `webhook_verified` | BOOLEAN | هل تم التحقق من Webhook | DEFAULT FALSE |

### 🤖 حقول الرد التلقائي

| الحقل | النوع | الوصف | القيود |
|-------|------|-------|--------|
| `auto_reply_enabled` | BOOLEAN | هل الرد التلقائي مفعل | DEFAULT FALSE |
| `welcome_message` | TEXT | رسالة الترحيب | NULL |

### 📊 حقول الحالة

| الحقل | النوع | الوصف | القيود |
|-------|------|-------|--------|
| `is_active` | BOOLEAN | هل الصفحة نشطة | DEFAULT TRUE |
| `status` | ENUM | حالة الصفحة | 'active', 'inactive', 'suspended' |

### 📈 معلومات إضافية

| الحقل | النوع | الوصف | القيود |
|-------|------|-------|--------|
| `page_category` | VARCHAR(255) | فئة الصفحة | NULL |
| `page_description` | TEXT | وصف الصفحة | NULL |
| `followers_count` | INT | عدد المتابعين | DEFAULT 0 |

### 🔍 معلومات المصدر

| الحقل | النوع | الوصف | القيود |
|-------|------|-------|--------|
| `source_table` | VARCHAR(50) | الجدول المصدر | DEFAULT 'unified' |
| `migrated_from` | VARCHAR(50) | الجدول الأصلي المهاجر منه | NULL |

### ⏰ حقول التوقيت

| الحقل | النوع | الوصف | القيود |
|-------|------|-------|--------|
| `created_at` | TIMESTAMP | تاريخ الإنشاء | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | تاريخ آخر تحديث | ON UPDATE CURRENT_TIMESTAMP |
| `last_sync_at` | TIMESTAMP | تاريخ آخر مزامنة | NULL |

## 🔑 الفهارس والقيود

### الفهارس
```sql
-- الفهرس الأساسي
PRIMARY KEY (id)

-- فهارس الأداء
INDEX idx_company_id (company_id)
INDEX idx_page_id (page_id)
INDEX idx_active (is_active)
INDEX idx_source (source_table)
```

### القيود
```sql
-- قيد الفرادة
UNIQUE KEY unique_page_per_company (company_id, page_id)
```

## 📊 أمثلة على الاستعلامات

### جلب جميع الصفحات النشطة لشركة
```sql
SELECT * FROM facebook_pages_unified 
WHERE company_id = 'company-2' 
AND is_active = TRUE 
ORDER BY created_at DESC;
```

### إنشاء صفحة جديدة
```sql
INSERT INTO facebook_pages_unified (
    id, company_id, page_id, page_name, access_token,
    webhook_enabled, is_active, source_table,
    created_at, updated_at
) VALUES (
    'page_1234567890_abc123',
    'company-2',
    'facebook_page_123',
    'صفحة تجريبية',
    'access_token_123',
    FALSE,
    TRUE,
    'unified',
    NOW(),
    NOW()
);
```

### تحديث حالة الصفحة
```sql
UPDATE facebook_pages_unified 
SET is_active = FALSE, updated_at = NOW() 
WHERE page_id = 'facebook_page_123';
```

### البحث بالاسم
```sql
SELECT * FROM facebook_pages_unified 
WHERE page_name LIKE '%تجريبية%' 
AND is_active = TRUE;
```

## 🔄 الهجرة من الجداول القديمة

### من facebook_settings
```sql
INSERT INTO facebook_pages_unified (
    id, company_id, page_id, page_name, access_token,
    webhook_enabled, webhook_url, webhook_verify_token,
    auto_reply_enabled, welcome_message, is_active,
    source_table, migrated_from, created_at, updated_at
) 
SELECT 
    id, company_id, page_id, page_name, access_token,
    webhook_enabled, webhook_url, webhook_verify_token,
    auto_reply_enabled, welcome_message, is_active,
    'unified', 'facebook_settings', created_at, updated_at
FROM facebook_settings;
```

### من facebook_pages
```sql
INSERT INTO facebook_pages_unified (
    id, company_id, page_id, page_name, access_token,
    webhook_enabled, webhook_verified, is_active,
    source_table, migrated_from, created_at, updated_at
) 
SELECT 
    id, company_id, page_id, page_name, access_token,
    FALSE, webhook_verified, is_active,
    'unified', 'facebook_pages', created_at, updated_at
FROM facebook_pages;
```

## 🎯 الفوائد والمميزات

### ✅ المميزات الجديدة
1. **توحيد البيانات:** جدول واحد بدلاً من جدولين منفصلين
2. **أداء محسن:** استعلامات أسرع وأبسط
3. **Soft Delete:** إمكانية استرداد البيانات المحذوفة
4. **تتبع المصدر:** معرفة مصدر كل سجل
5. **حقول إضافية:** معلومات أكثر تفصيلاً
6. **فهارس محسنة:** أداء أفضل للاستعلامات

### 📈 تحسينات الأداء
- **استعلام واحد** بدلاً من دمج جدولين
- **فهارس محسنة** للبحث السريع
- **قيود الفرادة** لمنع التكرار
- **تحسين الذاكرة** بتقليل عدد الجداول

## 🔧 الصيانة والمراقبة

### مراقبة الأداء
```sql
-- فحص حجم الجدول
SELECT 
    table_name,
    round(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_name = 'facebook_pages_unified';

-- فحص عدد السجلات
SELECT COUNT(*) as total_records FROM facebook_pages_unified;

-- فحص السجلات النشطة
SELECT COUNT(*) as active_records FROM facebook_pages_unified WHERE is_active = TRUE;
```

### تنظيف البيانات
```sql
-- حذف السجلات القديمة المعطلة (أكثر من 6 أشهر)
DELETE FROM facebook_pages_unified 
WHERE is_active = FALSE 
AND updated_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

## 🚨 اعتبارات مهمة

### ⚠️ تحذيرات
1. **لا تحذف الجداول القديمة** قبل التأكد من عمل النظام الجديد
2. **انشئ نسخة احتياطية** قبل أي تعديلات
3. **اختبر جميع الوظائف** قبل الانتقال الكامل
4. **راقب الأداء** لفترة كافية

### 🔒 الأمان
- **تشفير access_token** في التطبيق
- **تحديد صلاحيات المستخدمين** للوصول للجدول
- **مراقبة العمليات** غير المعتادة
- **نسخ احتياطية دورية**

## 📞 الدعم والمساعدة

في حالة وجود مشاكل أو أسئلة:
1. راجع سجلات النظام
2. تحقق من الفهارس والقيود
3. استخدم سكريبت المراقبة المقارن
4. في الطوارئ: استخدم سكريبت الاسترداد الطارئ

---

**آخر تحديث:** 11 يوليو 2025  
**المطور:** فريق تطوير Facebook Reply System
