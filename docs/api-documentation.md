# 🌐 دليل APIs للجدول الموحد

## 📋 نظرة عامة

هذا الدليل يوثق جميع APIs المتعلقة بالجدول الموحد `facebook_pages_unified` مع أمثلة عملية شاملة.

**Base URL:** `http://localhost:3002`  
**تاريخ التحديث:** 11 يوليو 2025  
**الإصدار:** 1.0

## 🔗 قائمة APIs

### 1. جلب صفحات Facebook للشركة (الجدول الموحد)
### 2. جلب صفحات Facebook للشركة (الطريقة القديمة)
### 3. إضافة صفحة Facebook جديدة
### 4. تحديث معرف الشركة
### 5. حذف صفحة Facebook (Soft Delete)

---

## 📖 1. جلب صفحات Facebook للشركة (الجدول الموحد)

### المعلومات الأساسية
- **الطريقة:** `GET`
- **المسار:** `/api/facebook/settings`
- **الوصف:** جلب جميع صفحات Facebook النشطة للشركة من الجدول الموحد

### المعاملات
| المعامل | النوع | مطلوب | الوصف |
|---------|------|--------|-------|
| `company_id` | string | ✅ | معرف الشركة |

### مثال على الطلب
```bash
curl -X GET "http://localhost:3002/api/facebook/settings?company_id=company-2" \
     -H "Accept: application/json"
```

### مثال على الاستجابة
```json
[
  {
    "id": "page_1751989866931_340",
    "company_id": "company-2",
    "page_id": "250528358137901",
    "page_name": "سولا 132",
    "page_username": null,
    "access_token": "EAAUpPO0SIEABPGMwCNcO9cUDoy0zsE4WQZCi39RATX9I6zVvTt1whvkZBt0stI4HrsZBMngnd4VFvZCliKyFrZBEqIgwoYkyGcGWlkFzYTFHdaalQOHUjw7Dhw9OVV3ZAXmn2o5FxFvmPlVZAikkvbqHlDbIx3QcRFcElaOhu6ciUZBN9ZAwNUXrbcRZCWcIvkaqGjd9CsBEyAC6Igx6e4Pls3JUks",
    "webhook_enabled": 0,
    "webhook_url": null,
    "webhook_verify_token": null,
    "webhook_verified": 0,
    "auto_reply_enabled": 0,
    "welcome_message": null,
    "is_active": 1,
    "status": "active",
    "page_category": null,
    "page_description": null,
    "followers_count": 0,
    "source_table": "unified",
    "migrated_from": "facebook_pages",
    "created_at": "2025-07-08 15:51:06",
    "updated_at": "2025-07-08 15:51:06",
    "last_sync_at": null
  }
]
```

### رموز الاستجابة
- `200` - نجح الطلب
- `400` - معامل company_id مفقود
- `500` - خطأ في الخادم

---

## 📖 2. جلب صفحات Facebook للشركة (الطريقة القديمة)

### المعلومات الأساسية
- **الطريقة:** `GET`
- **المسار:** `/api/facebook/settings/legacy`
- **الوصف:** جلب صفحات Facebook من الجداول القديمة للمقارنة

### المعاملات
| المعامل | النوع | مطلوب | الوصف |
|---------|------|--------|-------|
| `company_id` | string | ✅ | معرف الشركة |

### مثال على الطلب
```bash
curl -X GET "http://localhost:3002/api/facebook/settings/legacy?company_id=company-2" \
     -H "Accept: application/json"
```

### مثال على الاستجابة
```json
[
  {
    "id": "86566596-5925-11f0-9d70-02d83583ef25",
    "company_id": "company-2",
    "page_id": "123456789",
    "page_name": "صفحة تجريبية",
    "access_token": "test_token_123",
    "webhook_verify_token": "facebook_verify_token_123",
    "is_active": 1,
    "auto_reply_enabled": 0,
    "welcome_message": null,
    "created_at": "2025-07-04 22:23:35",
    "updated_at": "2025-07-10 23:41:23",
    "webhook_url": "http://localhost:3002/api/webhook/facebook",
    "webhook_enabled": 1,
    "source": "facebook_settings"
  }
]
```

---

## 📝 3. إضافة صفحة Facebook جديدة

### المعلومات الأساسية
- **الطريقة:** `POST`
- **المسار:** `/api/facebook/settings`
- **الوصف:** إضافة صفحة Facebook جديدة في الجدول الموحد

### البيانات المطلوبة
```json
{
  "company_id": "string",
  "page_id": "string", 
  "page_name": "string",
  "access_token": "string"
}
```

### مثال على الطلب
```bash
curl -X POST "http://localhost:3002/api/facebook/settings" \
     -H "Content-Type: application/json" \
     -d '{
       "company_id": "company-2",
       "page_id": "test_page_unified_123",
       "page_name": "صفحة اختبار موحدة",
       "access_token": "test_token_unified_123"
     }'
```

### مثال على الاستجابة (نجح)
```json
{
  "success": true,
  "page_id": "page_1752194095631_3335jslls",
  "message": "Facebook page added successfully to unified table"
}
```

### مثال على الاستجابة (فشل - صفحة موجودة)
```json
{
  "error": "Page already exists"
}
```

### رموز الاستجابة
- `200` - تم إنشاء الصفحة بنجاح
- `400` - بيانات مفقودة أو غير صحيحة
- `409` - الصفحة موجودة مسبقاً
- `500` - خطأ في الخادم

---

## ✏️ 4. تحديث معرف الشركة

### المعلومات الأساسية
- **الطريقة:** `PUT`
- **المسار:** `/api/facebook/settings/{pageId}/company`
- **الوصف:** تحديث معرف الشركة لصفحة محددة

### المعاملات
| المعامل | النوع | مطلوب | الوصف |
|---------|------|--------|-------|
| `pageId` | string | ✅ | معرف الصفحة (في المسار) |

### البيانات المطلوبة
```json
{
  "company_id": "string"
}
```

### مثال على الطلب
```bash
curl -X PUT "http://localhost:3002/api/facebook/settings/test_page_unified_123/company" \
     -H "Content-Type: application/json" \
     -d '{
       "company_id": "company-3"
     }'
```

### مثال على الاستجابة (نجح)
```json
{
  "success": true,
  "message": "Company ID updated successfully in unified table"
}
```

### مثال على الاستجابة (فشل)
```json
{
  "error": "Page not found"
}
```

### رموز الاستجابة
- `200` - تم التحديث بنجاح
- `400` - company_id مفقود
- `404` - الصفحة غير موجودة
- `500` - خطأ في الخادم

---

## 🗑️ 5. حذف صفحة Facebook (Soft Delete)

### المعلومات الأساسية
- **الطريقة:** `DELETE`
- **المسار:** `/api/facebook/settings/{pageId}`
- **الوصف:** إلغاء تفعيل صفحة Facebook (soft delete)

### المعاملات
| المعامل | النوع | مطلوب | الوصف |
|---------|------|--------|-------|
| `pageId` | string | ✅ | معرف الصفحة (في المسار) |

### مثال على الطلب
```bash
curl -X DELETE "http://localhost:3002/api/facebook/settings/test_page_unified_123" \
     -H "Accept: application/json"
```

### مثال على الاستجابة (نجح)
```json
{
  "success": true,
  "message": "Facebook page deactivated successfully (soft delete)"
}
```

### مثال على الاستجابة (فشل)
```json
{
  "error": "Page not found"
}
```

### رموز الاستجابة
- `200` - تم إلغاء التفعيل بنجاح
- `400` - pageId مفقود
- `404` - الصفحة غير موجودة
- `500` - خطأ في الخادم

---

## 🔧 أمثلة متقدمة

### JavaScript/Node.js
```javascript
const axios = require('axios');

// جلب صفحات الشركة
async function getCompanyPages(companyId) {
  try {
    const response = await axios.get(`http://localhost:3002/api/facebook/settings`, {
      params: { company_id: companyId }
    });
    return response.data;
  } catch (error) {
    console.error('خطأ في جلب الصفحات:', error.response?.data || error.message);
    throw error;
  }
}

// إضافة صفحة جديدة
async function addPage(pageData) {
  try {
    const response = await axios.post('http://localhost:3002/api/facebook/settings', pageData);
    return response.data;
  } catch (error) {
    console.error('خطأ في إضافة الصفحة:', error.response?.data || error.message);
    throw error;
  }
}

// استخدام الوظائف
(async () => {
  try {
    // جلب الصفحات
    const pages = await getCompanyPages('company-2');
    console.log('الصفحات:', pages);
    
    // إضافة صفحة جديدة
    const newPage = await addPage({
      company_id: 'company-2',
      page_id: 'new_page_123',
      page_name: 'صفحة جديدة',
      access_token: 'token_123'
    });
    console.log('الصفحة الجديدة:', newPage);
    
  } catch (error) {
    console.error('خطأ:', error);
  }
})();
```

### Python
```python
import requests
import json

BASE_URL = 'http://localhost:3002'

def get_company_pages(company_id):
    """جلب صفحات الشركة"""
    response = requests.get(f'{BASE_URL}/api/facebook/settings', 
                          params={'company_id': company_id})
    response.raise_for_status()
    return response.json()

def add_page(page_data):
    """إضافة صفحة جديدة"""
    response = requests.post(f'{BASE_URL}/api/facebook/settings', 
                           json=page_data)
    response.raise_for_status()
    return response.json()

# استخدام الوظائف
try:
    # جلب الصفحات
    pages = get_company_pages('company-2')
    print('الصفحات:', json.dumps(pages, indent=2, ensure_ascii=False))
    
    # إضافة صفحة جديدة
    new_page = add_page({
        'company_id': 'company-2',
        'page_id': 'python_page_123',
        'page_name': 'صفحة من Python',
        'access_token': 'python_token_123'
    })
    print('الصفحة الجديدة:', json.dumps(new_page, indent=2, ensure_ascii=False))
    
except requests.exceptions.RequestException as e:
    print(f'خطأ في الطلب: {e}')
```

## 🚨 معالجة الأخطاء

### أخطاء شائعة وحلولها

#### 1. خطأ 400 - Bad Request
```json
{
  "error": "company_id is required"
}
```
**الحل:** تأكد من إرسال جميع المعاملات المطلوبة

#### 2. خطأ 409 - Conflict
```json
{
  "error": "Page already exists"
}
```
**الحل:** استخدم page_id مختلف أو حدث الصفحة الموجودة

#### 3. خطأ 404 - Not Found
```json
{
  "error": "Page not found"
}
```
**الحل:** تحقق من صحة page_id

#### 4. خطأ 500 - Internal Server Error
```json
{
  "error": "Database connection failed"
}
```
**الحل:** تحقق من حالة الخادم وقاعدة البيانات

## 📊 مراقبة الأداء

### مقاييس مهمة
- **وقت الاستجابة:** يجب أن يكون أقل من 500ms
- **معدل النجاح:** يجب أن يكون أكثر من 99%
- **الطلبات في الثانية:** يدعم حتى 100 req/s

### سجلات النظام
```bash
# مراقبة السجلات
tail -f logs/api.log | grep "facebook/settings"

# فلترة الأخطاء فقط
tail -f logs/api.log | grep "ERROR.*facebook/settings"
```

---

**آخر تحديث:** 11 يوليو 2025  
**المطور:** فريق تطوير Facebook Reply System
