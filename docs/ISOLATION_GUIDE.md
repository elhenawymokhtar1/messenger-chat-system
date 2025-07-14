# 🔒 دليل العزل للمطورين
## Developer's Isolation Guide

> **هام جداً**: يجب قراءة هذا الدليل قبل إضافة أي ميزة جديدة للنظام

## 📋 **قواعد العزل الأساسية**

### **1. كل شركة معزولة تماماً**
- ✅ كل شركة ترى بياناتها فقط
- ❌ لا يجب أن ترى شركة بيانات شركة أخرى
- 🔒 استخدم `company_id` أو `store_id` في جميع الاستعلامات

### **2. الجداول التي تحتاج عزل**
```typescript
const TABLES_REQUIRING_ISOLATION = [
  'products',      // المنتجات
  'categories',    // الفئات  
  'orders',        // الطلبات
  'coupons',       // الكوبونات
  'shipping_methods', // طرق الشحن
  'payment_methods',  // طرق الدفع
  'stores',        // المتاجر
  'customers'      // العملاء
];
```

### **3. أعمدة العزل المقبولة**
- `company_id` - الأفضل
- `store_id` - بديل مقبول

## 🚫 **الأخطاء الشائعة**

### **❌ خطأ: استعلام بدون عزل**
```sql
-- خطأ - يجلب بيانات جميع الشركات
SELECT * FROM products WHERE status = 'active';
```

### **✅ صحيح: استعلام معزول**
```sql
-- صحيح - يجلب بيانات شركة واحدة فقط
SELECT * FROM products WHERE company_id = ? AND status = 'active';
```

### **❌ خطأ: إدراج بدون عزل**
```sql
-- خطأ - لا يحدد الشركة
INSERT INTO categories (name, description) VALUES (?, ?);
```

### **✅ صحيح: إدراج معزول**
```sql
-- صحيح - يحدد الشركة
INSERT INTO categories (company_id, name, description) VALUES (?, ?, ?);
```

## 🛠️ **أدوات العزل**

### **1. استخدام IsolatedQueryBuilder**
```typescript
import { IsolatedQueryBuilder } from '../utils/isolation-guard';

// إنشاء منشئ الاستعلامات
const builder = new IsolatedQueryBuilder(companyId, storeId);

// جلب البيانات
const { query, values } = builder.buildSelectQuery(
  'products',           // اسم الجدول
  '*',                 // الأعمدة
  'status = ?',        // شروط إضافية
  'created_at DESC',   // ترتيب
  20,                  // حد
  0                    // إزاحة
);

const [results] = await pool.execute(query, [...values, 'active']);
```

### **2. استخدام Middleware للحماية**
```typescript
import { isolationGuardMiddleware } from '../utils/isolation-guard';

// تطبيق الحماية على جميع مسارات الشركة
app.use('/api/companies/:companyId/*', isolationGuardMiddleware);
```

### **3. التحقق من الاستعلامات**
```typescript
import { validateIsolationInQuery } from '../utils/isolation-guard';

const query = 'SELECT * FROM products WHERE status = ?';
const validation = validateIsolationInQuery(query, companyId);

if (!validation.isValid) {
  console.warn('⚠️ تحذيرات:', validation.warnings);
  console.log('💡 اقتراحات:', validation.suggestions);
}
```

## 📝 **قائمة مراجعة للمطور**

### **عند إضافة مسار API جديد:**
- [ ] هل يحتوي المسار على `companyId`؟
- [ ] هل تم تطبيق `isolationGuardMiddleware`؟
- [ ] هل جميع الاستعلامات تحتوي على شرط العزل؟
- [ ] هل تم اختبار العزل مع شركتين مختلفتين؟

### **عند إضافة جدول جديد:**
- [ ] هل يحتاج الجدول للعزل؟
- [ ] هل تم إضافة عمود `company_id` أو `store_id`؟
- [ ] هل تم إضافة الجدول لقائمة `TABLES_REQUIRING_ISOLATION`؟
- [ ] هل تم إنشاء اختبارات العزل للجدول الجديد؟

### **عند تعديل استعلام موجود:**
- [ ] هل لا يزال الاستعلام معزولاً؟
- [ ] هل تم اختبار التعديل مع شركات متعددة؟
- [ ] هل تم تحديث الاختبارات إذا لزم الأمر؟

## 🧪 **اختبار العزل**

### **اختبار يدوي سريع:**
```bash
# جلب بيانات الشركة A
curl "http://localhost:3002/api/companies/COMPANY_A_ID/categories"

# جلب بيانات الشركة B  
curl "http://localhost:3002/api/companies/COMPANY_B_ID/categories"

# يجب أن تكون النتائج مختلفة!
```

### **تشغيل الاختبارات التلقائية:**
```bash
npm test -- isolation.test.ts
```

## 🚨 **علامات الخطر**

### **كود يحتاج مراجعة فورية:**
- استعلامات بدون `WHERE`
- استخدام `SELECT *` بدون عزل
- استعلامات `JOIN` بدون شروط عزل
- استخدام `localStorage` في كود جديد
- مسارات API بدون `companyId`

### **رسائل تحذيرية في الخادم:**
```
⚠️ [API] جدول categories لا يحتوي على company_id
⚠️ [ISOLATION-GUARD] طلب API بدون companyId
⚠️ استعلام بدون عزل يستخدم الجداول: products
```

## 🔧 **إصلاح المشاكل**

### **إذا ظهرت بيانات شركة في شركة أخرى:**
1. تحقق من وجود شرط العزل في الاستعلام
2. تأكد من صحة قيمة `companyId`
3. فحص الجدول للتأكد من وجود عمود العزل
4. راجع الاختبارات للتأكد من تغطية الحالة

### **إذا فشل إنشاء بيانات جديدة:**
1. تأكد من إضافة `company_id` أو `store_id`
2. تحقق من وجود متجر للشركة
3. راجع قيود قاعدة البيانات
4. تأكد من صحة معرف الشركة

## 📊 **مراقبة العزل**

### **فحص دوري لحالة العزل:**
```typescript
import { checkIsolationHealth } from '../utils/isolation-guard';

const health = await checkIsolationHealth(pool);
console.log('حالة العزل:', health.status);
if (health.issues.length > 0) {
  console.warn('مشاكل العزل:', health.issues);
  console.log('التوصيات:', health.recommendations);
}
```

## 🎯 **أهداف العزل**

### **الهدف الأساسي:**
> ضمان أن كل شركة ترى بياناتها فقط، ولا تستطيع الوصول لبيانات الشركات الأخرى

### **الفوائد:**
- 🔒 **الأمان**: حماية بيانات العملاء
- ⚡ **الأداء**: استعلامات أسرع مع بيانات أقل
- 🧹 **النظافة**: واجهة مستخدم أكثر وضوحاً
- 📊 **الدقة**: إحصائيات صحيحة لكل شركة

---

## ⚠️ **تذكير مهم**

**قبل نشر أي كود جديد، تأكد من:**
1. ✅ تطبيق العزل في جميع الاستعلامات
2. ✅ اختبار العزل مع شركات متعددة  
3. ✅ عدم استخدام localStorage
4. ✅ توحيد معرفات الشركة

**العزل ليس اختيارياً - إنه ضرورة أمنية!** 🔒
