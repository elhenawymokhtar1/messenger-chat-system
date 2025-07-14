# 🏢 دليل إعداد شركة جديدة

## 📋 **قائمة المراجعة السريعة**

### ✅ **1. إعداد قاعدة البيانات**

```sql
-- التأكد من وجود الجداول المطلوبة
SHOW TABLES LIKE 'conversations';
SHOW TABLES LIKE 'facebook_pages_unified';
SHOW TABLES LIKE 'messages';

-- التأكد من هيكل جدول المحادثات
DESCRIBE conversations;
-- يجب أن يحتوي على:
-- - id, company_id, facebook_page_id
-- - participant_id (معرف المشارك)
-- - customer_name (اسم العميل)
-- - last_message_time (وقت آخر رسالة)

-- التأكد من هيكل جدول صفحات Facebook
DESCRIBE facebook_pages_unified;
-- يجب أن يحتوي على:
-- - page_id, company_id, access_token
-- - page_name, is_active
```

### ✅ **2. إعداد Facebook**

```javascript
// إضافة صفحة Facebook جديدة
const facebookPage = {
  company_id: "company-uuid-here",
  page_id: "facebook-page-id",
  page_name: "اسم الصفحة",
  access_token: "page-access-token",
  app_id: "facebook-app-id",
  app_secret: "facebook-app-secret",
  is_active: 1
};

// إدراج في قاعدة البيانات
INSERT INTO facebook_pages_unified (
  company_id, page_id, page_name, access_token, 
  app_id, app_secret, is_active, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, NOW());
```

### ✅ **3. اختبار النظام**

```bash
# فحص صحة النظام
curl "http://localhost:3002/api/companies/COMPANY_ID/health-check"

# اختبار تحديث الأسماء
curl -X POST "http://localhost:3002/api/companies/COMPANY_ID/update-customer-names"

# اختبار جلب المحادثات
curl "http://localhost:3002/api/companies/COMPANY_ID/conversations"
```

## 🔧 **المشاكل الشائعة والحلول**

### ❌ **مشكلة: "Column 'participant_id' doesn't exist"**

**السبب:** الجدول يستخدم أسماء حقول قديمة

**الحل:**
```sql
-- تحديث هيكل الجدول
ALTER TABLE conversations 
CHANGE COLUMN user_id participant_id VARCHAR(255);

ALTER TABLE conversations 
CHANGE COLUMN user_name customer_name VARCHAR(255);

ALTER TABLE conversations 
CHANGE COLUMN last_message_at last_message_time TIMESTAMP;
```

### ❌ **مشكلة: "Table 'facebook_settings' doesn't exist"**

**السبب:** الكود يبحث عن جدول قديم

**الحل:**
```sql
-- إنشاء الجدول الموحد إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS facebook_pages_unified (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL,
  page_id VARCHAR(255) NOT NULL,
  page_name VARCHAR(255),
  access_token TEXT NOT NULL,
  app_id VARCHAR(255),
  app_secret VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_company_page (company_id, page_id)
);
```

### ❌ **مشكلة: "Access token expired"**

**السبب:** رمز الوصول منتهي الصلاحية

**الحل:**
```javascript
// تحديث رمز الوصول
UPDATE facebook_pages_unified 
SET access_token = 'new-access-token', updated_at = NOW()
WHERE company_id = 'COMPANY_ID' AND page_id = 'PAGE_ID';
```

### ❌ **مشكلة: "No conversations found"**

**السبب:** عدم وجود محادثات أو مشكلة في المزامنة

**الحل:**
```bash
# تشغيل المزامنة اليدوية
curl -X POST "http://localhost:3002/api/sync/company/COMPANY_ID"

# فحص logs الخادم
tail -f server.log | grep SYNC
```

## 🚀 **خطوات الإعداد التفصيلية**

### **الخطوة 1: إنشاء الشركة**

```sql
INSERT INTO companies (id, name, created_at) 
VALUES ('new-company-uuid', 'اسم الشركة', NOW());
```

### **الخطوة 2: إضافة صفحة Facebook**

```sql
INSERT INTO facebook_pages_unified (
  company_id, page_id, page_name, access_token, is_active
) VALUES (
  'new-company-uuid',
  'facebook-page-id', 
  'اسم الصفحة',
  'page-access-token',
  1
);
```

### **الخطوة 3: اختبار الاتصال**

```bash
# اختبار Facebook API
curl "https://graph.facebook.com/PAGE_ID?access_token=ACCESS_TOKEN"

# اختبار النظام
curl "http://localhost:3002/api/companies/COMPANY_ID/health-check"
```

### **الخطوة 4: تشغيل المزامنة الأولى**

```bash
# مزامنة المحادثات
curl -X POST "http://localhost:3002/api/sync/company/COMPANY_ID"

# تحديث الأسماء
curl -X POST "http://localhost:3002/api/companies/COMPANY_ID/update-customer-names"
```

## 📊 **مراقبة النظام**

### **فحص دوري للصحة:**

```bash
#!/bin/bash
# health-check.sh

COMPANY_ID="your-company-id"
HEALTH_URL="http://localhost:3002/api/companies/$COMPANY_ID/health-check"

echo "🏥 فحص صحة النظام..."
curl -s "$HEALTH_URL" | jq '.status'

# إرسال تنبيه إذا كان هناك خطأ
if [ $? -ne 0 ]; then
  echo "❌ النظام غير صحي - إرسال تنبيه"
  # إضافة كود إرسال التنبيه هنا
fi
```

### **مراقبة logs:**

```bash
# مراقبة أخطاء تحديث الأسماء
tail -f server.log | grep "NAME_UPDATE.*ERROR"

# مراقبة مشاكل Facebook API
tail -f server.log | grep "Facebook.*error"

# مراقبة مشاكل قاعدة البيانات
tail -f server.log | grep "Database.*error"
```

## 🔄 **الصيانة الدورية**

### **يومياً:**
- فحص صحة النظام
- مراجعة logs الأخطاء
- تحديث الأسماء المفقودة

### **أسبوعياً:**
- فحص صلاحية Access Tokens
- تنظيف البيانات القديمة
- نسخ احتياطي من قاعدة البيانات

### **شهرياً:**
- مراجعة أداء النظام
- تحديث التبعيات
- فحص الأمان

## 📞 **الدعم الفني**

إذا واجهت مشاكل:

1. **تشغيل فحص الصحة أولاً:**
   ```bash
   curl "http://localhost:3002/api/companies/COMPANY_ID/health-check"
   ```

2. **مراجعة logs الخادم:**
   ```bash
   tail -100 server.log | grep ERROR
   ```

3. **التحقق من إعدادات Facebook:**
   ```bash
   curl "https://graph.facebook.com/me?access_token=YOUR_TOKEN"
   ```

4. **اختبار قاعدة البيانات:**
   ```sql
   SELECT COUNT(*) FROM conversations WHERE company_id = 'COMPANY_ID';
   ```
