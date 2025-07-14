# 🗄️ دليل استخدام جداول قاعدة البيانات

## 📊 **الجداول الموحدة (يجب استخدامها)**

### ✅ **facebook_pages_unified**
```sql
-- الجدول الموحد لجميع صفحات Facebook
CREATE TABLE facebook_pages_unified (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL,
  page_id VARCHAR(255) NOT NULL UNIQUE,
  page_name VARCHAR(255),
  access_token TEXT NOT NULL,
  webhook_enabled BOOLEAN DEFAULT FALSE,
  webhook_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**الاستخدام:**
```javascript
// ✅ صحيح - استخدام الجدول الموحد
const [pages] = await pool.execute(
  'SELECT * FROM facebook_pages_unified WHERE company_id = ? AND is_active = 1',
  [companyId]
);

// ❌ خطأ - لا تستخدم الجدول القديم
const [pages] = await pool.execute(
  'SELECT * FROM facebook_settings WHERE company_id = ?',
  [companyId]
);
```

### ✅ **conversations**
```sql
-- الجدول الموحد لجميع المحادثات
CREATE TABLE conversations (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL,
  facebook_page_id VARCHAR(255) NOT NULL,
  participant_id VARCHAR(255) NOT NULL,  -- معرف المشارك في Facebook
  customer_name VARCHAR(255),            -- اسم العميل
  last_message TEXT,
  last_message_time TIMESTAMP,
  last_message_is_from_page TINYINT(1) DEFAULT 0,
  unread_count INT DEFAULT 0,
  is_archived TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**الاستخدام:**
```javascript
// ✅ صحيح - استخدام الحقول الصحيحة
const [conversations] = await pool.execute(`
  SELECT id, participant_id, customer_name, last_message_time
  FROM conversations 
  WHERE company_id = ? AND participant_id = ?
`, [companyId, participantId]);

// ❌ خطأ - استخدام أسماء حقول قديمة
const [conversations] = await pool.execute(`
  SELECT id, user_id, user_name, last_message_at
  FROM conversations 
  WHERE company_id = ? AND user_id = ?
`, [companyId, userId]);
```

---

## ❌ **الجداول القديمة (لا تستخدمها)**

### ❌ **facebook_settings** 
**حالة:** مهجور - استخدم `facebook_pages_unified` بدلاً منه

### ❌ **facebook_pages**
**حالة:** مهجور - استخدم `facebook_pages_unified` بدلاً منه

---

## 🔄 **قواعد الترحيل**

### **للصفحات الجديدة:**
```javascript
// ✅ احفظ في الجدول الموحد فقط
await pool.execute(`
  INSERT INTO facebook_pages_unified (
    page_id, page_name, access_token, company_id, is_active
  ) VALUES (?, ?, ?, ?, ?)
`, [pageId, pageName, accessToken, companyId, true]);
```

### **للمحادثات الجديدة:**
```javascript
// ✅ احفظ في الجدول الموحد مع الحقول الصحيحة
await pool.execute(`
  INSERT INTO conversations (
    id, company_id, facebook_page_id, participant_id, 
    customer_name, unread_count, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
`, [conversationId, companyId, pageId, participantId, customerName, 1]);
```

### **للبحث والاستعلام:**
```javascript
// ✅ ابحث في الجداول الموحدة
const [result] = await pool.execute(`
  SELECT c.*, p.page_name, p.access_token
  FROM conversations c
  JOIN facebook_pages_unified p ON c.facebook_page_id = p.page_id
  WHERE c.company_id = ? AND p.is_active = 1
`, [companyId]);
```

---

## 🛠️ **أدوات المساعدة**

### **فحص الجداول المستخدمة:**
```bash
# البحث عن استخدام الجداول القديمة في الكود
grep -r "facebook_settings" src/
grep -r "user_id.*WHERE" src/
grep -r "user_name" src/

# البحث عن الاستخدام الصحيح
grep -r "facebook_pages_unified" src/
grep -r "participant_id" src/
grep -r "customer_name" src/
```

### **نص SQL للتحقق من البيانات:**
```sql
-- فحص عدد الصفحات في كل جدول
SELECT 'facebook_pages_unified' as table_name, COUNT(*) as count 
FROM facebook_pages_unified WHERE is_active = 1
UNION ALL
SELECT 'facebook_settings' as table_name, COUNT(*) as count 
FROM facebook_settings WHERE is_active = 1;

-- فحص المحادثات بدون أسماء
SELECT COUNT(*) as conversations_without_names
FROM conversations 
WHERE participant_id IS NOT NULL 
AND (customer_name IS NULL OR customer_name = '');
```

---

## 📋 **قائمة مراجعة للمطورين**

### ✅ **عند إضافة كود جديد:**
- [ ] استخدم `facebook_pages_unified` بدلاً من `facebook_settings`
- [ ] استخدم `participant_id` بدلاً من `user_id`
- [ ] استخدم `customer_name` بدلاً من `user_name`
- [ ] استخدم `last_message_time` بدلاً من `last_message_at`
- [ ] تأكد من وجود `company_id` في جميع الاستعلامات

### ✅ **عند تعديل كود موجود:**
- [ ] ابحث عن مراجع الجداول القديمة وحدثها
- [ ] تأكد من أسماء الحقول الصحيحة
- [ ] اختبر الكود مع البيانات الحقيقية
- [ ] شغل فحص صحة النظام بعد التعديل

### ✅ **عند إضافة شركة جديدة:**
- [ ] أضف الصفحات في `facebook_pages_unified` فقط
- [ ] تأكد من ربط `company_id` بشكل صحيح
- [ ] شغل فحص صحة النظام للشركة الجديدة
- [ ] اختبر تحديث أسماء العملاء

---

## 🚨 **تحذيرات مهمة**

### ❌ **لا تفعل:**
```javascript
// ❌ لا تستخدم الجداول القديمة
INSERT INTO facebook_settings ...
SELECT * FROM facebook_pages ...

// ❌ لا تستخدم أسماء الحقول القديمة
WHERE user_id = ?
SET user_name = ?
ORDER BY last_message_at

// ❌ لا تنس company_id
SELECT * FROM conversations WHERE participant_id = ?
```

### ✅ **افعل:**
```javascript
// ✅ استخدم الجداول الموحدة
INSERT INTO facebook_pages_unified ...
SELECT * FROM conversations ...

// ✅ استخدم أسماء الحقول الصحيحة
WHERE participant_id = ?
SET customer_name = ?
ORDER BY last_message_time

// ✅ اربط دائماً بـ company_id
SELECT * FROM conversations 
WHERE participant_id = ? AND company_id = ?
```

---

## 📞 **الدعم**

إذا واجهت مشاكل:
1. شغل فحص صحة النظام أولاً
2. تحقق من استخدام الجداول الصحيحة
3. راجع هذا الدليل
4. اختبر مع بيانات تجريبية أولاً
