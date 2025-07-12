# 🔄 دليل الهجرة الشامل - توحيد جداول Facebook

## 📋 نظرة عامة

هذا الدليل يوضح خطوات هجرة جداول Facebook من النظام القديم (جدولين منفصلين) إلى النظام الجديد (جدول موحد).

**تاريخ الإنشاء:** 11 يوليو 2025  
**الإصدار:** 1.0  
**مستوى الصعوبة:** متوسط  
**الوقت المتوقع:** 2-4 ساعات

## 🎯 الأهداف

- ✅ توحيد جداول `facebook_settings` و `facebook_pages`
- ✅ تحسين الأداء وتبسيط الاستعلامات
- ✅ إضافة ميزات جديدة (Soft Delete, تتبع المصدر)
- ✅ الحفاظ على سلامة البيانات
- ✅ ضمان عدم فقدان أي بيانات

## 📊 مقارنة النظامين

### النظام القديم
```
facebook_settings (جدول 1)
├── id, company_id, page_id, page_name
├── access_token, webhook_enabled
└── auto_reply_enabled, welcome_message

facebook_pages (جدول 2)  
├── id, company_id, page_id, page_name
├── access_token, webhook_verified
└── is_active, created_at
```

### النظام الجديد
```
facebook_pages_unified (جدول موحد)
├── جميع حقول الجدولين القديمين
├── حقول جديدة (page_username, status, page_category)
├── تتبع المصدر (source_table, migrated_from)
└── ميزات محسنة (soft delete, فهارس أفضل)
```

## 🚀 خطوات الهجرة

### المرحلة 1: التحضير والتخطيط

#### 1.1 تحليل البيانات الحالية
```bash
# تشغيل سكريبت تحليل البيانات
node analyze-current-data.cjs
```

#### 1.2 إنشاء نسخة احتياطية
```bash
# إنشاء نسخة احتياطية كاملة
node backup/create-backup.cjs
```

#### 1.3 التحقق من النسخة الاحتياطية
```bash
# التحقق من سلامة النسخة الاحتياطية
ls -la backup/backups/facebook_tables_backup_*/
```

### المرحلة 2: إنشاء البنية الجديدة

#### 2.1 إنشاء View موحد (اختياري)
```bash
# إنشاء View للاختبار والمقارنة
node execute-view-creation.cjs
```

#### 2.2 إنشاء الجدول الموحد
```bash
# إنشاء الجدول الموحد الجديد
node create-unified-table.cjs
```

#### 2.3 التحقق من البنية
```sql
-- فحص بنية الجدول الجديد
DESCRIBE facebook_pages_unified;
SHOW INDEX FROM facebook_pages_unified;
```

### المرحلة 3: نقل البيانات

#### 3.1 نقل البيانات للجدول الموحد
```bash
# نقل جميع البيانات من الجداول القديمة
node migrate-data-to-unified.cjs
```

#### 3.2 التحقق من نقل البيانات
```bash
# مقارنة البيانات بين القديم والجديد
node test-unified-table.cjs
```

### المرحلة 4: تحديث التطبيق

#### 4.1 تحديث الخدمات (Services)
```typescript
// في src/services/database.ts
export class FacebookService {
  // تحديث الوظائف لاستخدام الجدول الموحد
  static async getByCompanyId(companyId: string) {
    return await executeQuery<FacebookSettings>(
      'SELECT * FROM facebook_pages_unified WHERE company_id = ? AND is_active = TRUE',
      [companyId]
    );
  }
}
```

#### 4.2 تحديث APIs
```typescript
// في src/api/server-mysql.ts
app.get('/api/facebook/settings', async (req, res) => {
  const settings = await FacebookService.getByCompanyId(company_id);
  res.json(settings);
});
```

### المرحلة 5: الاختبار والمراقبة

#### 5.1 اختبار العمليات CRUD
```bash
# تشغيل اختبارات شاملة
node testing/crud-test-suite.cjs
```

#### 5.2 اختبار الأداء
```bash
# اختبار الأداء تحت الضغط
node testing/performance-stress-test.cjs
```

#### 5.3 بدء المراقبة المقارنة
```bash
# مراقبة مستمرة للمقارنة بين النظامين
node monitoring/comparison-monitor.cjs
```

### المرحلة 6: التحقق والتأكيد

#### 6.1 فترة المراقبة (أسبوع واحد)
- مراقبة السجلات يومياً
- التحقق من عدم وجود أخطاء
- مقارنة الأداء مع النظام القديم
- اختبار جميع الوظائف

#### 6.2 اختبار المستخدمين
- اختبار واجهة المستخدم
- التحقق من جميع العمليات
- جمع ملاحظات المستخدمين

### المرحلة 7: الحذف والتنظيف

#### 7.1 حذف الجداول القديمة (بعد التأكد)
```sql
-- حذف الجداول القديمة (بحذر شديد!)
DROP TABLE IF EXISTS facebook_settings_old;
DROP TABLE IF EXISTS facebook_pages_old;
```

#### 7.2 تنظيف الكود
```bash
# إزالة الوظائف القديمة من الكود
# إزالة APIs القديمة
# تحديث الوثائق
```

## 🛠️ الأدوات والسكريبتات

### سكريبتات الهجرة
| السكريبت | الوصف | الاستخدام |
|----------|-------|----------|
| `analyze-current-data.cjs` | تحليل البيانات الحالية | `node analyze-current-data.cjs` |
| `create-unified-table.cjs` | إنشاء الجدول الموحد | `node create-unified-table.cjs` |
| `migrate-data-to-unified.cjs` | نقل البيانات | `node migrate-data-to-unified.cjs` |

### سكريبتات الاختبار
| السكريبت | الوصف | الاستخدام |
|----------|-------|----------|
| `crud-test-suite.cjs` | اختبار العمليات CRUD | `node testing/crud-test-suite.cjs` |
| `performance-stress-test.cjs` | اختبار الأداء | `node testing/performance-stress-test.cjs` |
| `comparison-monitor.cjs` | مراقبة مقارنة | `node monitoring/comparison-monitor.cjs` |

### سكريبتات النسخ الاحتياطي
| السكريبت | الوصف | الاستخدام |
|----------|-------|----------|
| `create-backup.cjs` | إنشاء نسخة احتياطية | `node backup/create-backup.cjs` |
| `emergency-restore.cjs` | استرداد طارئ | `node backup/emergency-restore.cjs` |

## ⚠️ تحذيرات مهمة

### 🚨 قبل البدء
1. **انشئ نسخة احتياطية كاملة** من قاعدة البيانات
2. **اختبر على بيئة تطوير** أولاً
3. **أعلم الفريق** بموعد الهجرة
4. **حضر خطة طوارئ** للتراجع

### 🔒 أثناء الهجرة
1. **لا تحذف الجداول القديمة** حتى التأكد التام
2. **راقب السجلات** باستمرار
3. **اختبر كل خطوة** قبل المتابعة
4. **احتفظ بالنسخ الاحتياطية** في مكان آمن

### ✅ بعد الهجرة
1. **راقب النظام** لمدة أسبوع على الأقل
2. **اختبر جميع الوظائف** بانتظام
3. **جمع ملاحظات المستخدمين**
4. **وثق أي مشاكل** وحلولها

## 🔧 استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. خطأ في نقل البيانات
```bash
# التحقق من البيانات المفقودة
SELECT COUNT(*) FROM facebook_settings;
SELECT COUNT(*) FROM facebook_pages;
SELECT COUNT(*) FROM facebook_pages_unified;
```

#### 2. مشاكل في الأداء
```sql
-- فحص الفهارس
SHOW INDEX FROM facebook_pages_unified;

-- إضافة فهارس إضافية إذا لزم الأمر
CREATE INDEX idx_custom ON facebook_pages_unified (column_name);
```

#### 3. أخطاء في APIs
```bash
# فحص سجلات الخادم
tail -f logs/api.log | grep "facebook/settings"

# اختبار APIs يدوياً
curl -X GET "http://localhost:3002/api/facebook/settings?company_id=test"
```

## 📊 مقاييس النجاح

### مؤشرات الأداء
- **تحسن سرعة الاستعلامات:** 30-50%
- **تقليل تعقيد الكود:** 40%
- **زيادة موثوقية النظام:** 99.9%
- **سهولة الصيانة:** تحسن كبير

### معايير القبول
- ✅ جميع البيانات منقولة بنجاح
- ✅ جميع الوظائف تعمل كما هو متوقع
- ✅ الأداء محسن أو على الأقل مماثل
- ✅ لا توجد أخطاء في السجلات
- ✅ المستخدمون راضون عن النظام

## 📞 الدعم والمساعدة

### في حالة المشاكل
1. **راجع السجلات** أولاً
2. **استخدم سكريبت المراقبة** للمقارنة
3. **تحقق من النسخ الاحتياطية**
4. **في الطوارئ:** استخدم `emergency-restore.cjs`

### جهات الاتصال
- **فريق التطوير:** للمشاكل التقنية
- **مدير قاعدة البيانات:** لمشاكل البيانات
- **مدير النظام:** لمشاكل الخادم

## 📚 مراجع إضافية

- [توثيق الجدول الموحد](unified-table-documentation.md)
- [دليل APIs](api-documentation.md)
- [دليل استكشاف الأخطاء](troubleshooting-guide.md)

---

**آخر تحديث:** 11 يوليو 2025  
**المطور:** فريق تطوير Facebook Reply System  
**حالة الدليل:** مُختبر ومُطبق بنجاح
