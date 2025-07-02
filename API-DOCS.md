# 🔌 توثيق APIs - Facebook Messenger Management System

## 📋 نظرة عامة

توثيق شامل لجميع APIs المستخدمة في النظام مع أمثلة عملية.

## 🏢 Companies API

### الحصول على جميع الشركات
```http
GET /api/companies
```

**الاستجابة:**
```json
{
  "success": true,
  "data": [
    {
      "id": "c677b32f-fe1c-4c64-8362-a1c03406608d",
      "name": "شركة الأحذية النسائية",
      "email": "info@shoes.com",
      "phone": "+966501234567"
    }
  ]
}
```

## 💬 Conversations API

### الحصول على محادثات الشركة
```http
GET /api/companies/{companyId}/conversations?limit=50&recent_only=true
```

**المعاملات:**
- `companyId` (مطلوب): معرف الشركة
- `limit` (اختياري): عدد المحادثات (افتراضي: 50)
- `recent_only` (اختياري): المحادثات الحديثة فقط

**الاستجابة:**
```json
{
  "success": true,
  "data": [
    {
      "id": "0a6962e4-a5d6-4663-ab0e-25f7ffa175db",
      "customer_name": "Mokhtar Elenawy",
      "customer_facebook_id": "1234567890",
      "last_message": "مرحبا",
      "last_message_type": "text",
      "last_message_at": "2024-12-02T10:30:00Z",
      "unread_count": 2,
      "recent_messages_count": 5
    }
  ],
  "count": 1
}
```

## 📨 Messages API

### الحصول على رسائل المحادثة
```http
GET /api/conversations/{conversationId}/messages?company_id={companyId}&limit=50
```

**الاستجابة:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-123",
      "conversation_id": "0a6962e4-a5d6-4663-ab0e-25f7ffa175db",
      "message_text": "مرحبا كيف حالك؟",
      "message_type": "text",
      "direction": "incoming",
      "image_url": null,
      "created_at": "2024-12-02T10:30:00Z",
      "is_read": false
    }
  ]
}
```

### إرسال رسالة نصية
```http
POST /api/conversations/{conversationId}/messages
Content-Type: application/json

{
  "company_id": "c677b32f-fe1c-4c64-8362-a1c03406608d",
  "message_text": "مرحبا! كيف يمكنني مساعدتك؟",
  "message_type": "text"
}
```

### إرسال صورة
```http
POST /api/conversations/{conversationId}/messages
Content-Type: application/json

{
  "company_id": "c677b32f-fe1c-4c64-8362-a1c03406608d",
  "message_text": "هذه صورة المنتج",
  "message_type": "image",
  "image_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "image_name": "product.png"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "message_id": "eaae8251-8451-41e7-9982-f8fccb8dbfa4",
    "image_url": "https://91dc-154-180-108-228.ngrok-free.app/uploads/images/1751421253255_ya8ebetbe.png"
  },
  "message": "Message sent successfully"
}
```

## 📘 Facebook Settings API

### الحصول على إعدادات Facebook
```http
GET /api/companies/{companyId}/facebook-settings
```

### إضافة صفحة Facebook
```http
POST /api/companies/{companyId}/facebook-pages
Content-Type: application/json

{
  "page_id": "123456789",
  "page_name": "صفحة الأحذية",
  "access_token": "EAABwzLixnjYBO..."
}
```

## 🤖 Gemini AI API

### الحصول على إعدادات AI
```http
GET /api/companies/{companyId}/gemini-settings
```

### تحديث إعدادات AI
```http
PUT /api/companies/{companyId}/gemini-settings
Content-Type: application/json

{
  "api_key": "AIzaSyC...",
  "is_enabled": true,
  "auto_reply": true,
  "system_prompt": "أنت مساعد ذكي لمتجر أحذية نسائية...",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

## 🔗 Webhook API

### Facebook Webhook
```http
POST /webhook
Content-Type: application/json

{
  "object": "page",
  "entry": [
    {
      "messaging": [
        {
          "sender": {"id": "1234567890"},
          "recipient": {"id": "PAGE_ID"},
          "timestamp": 1234567890,
          "message": {
            "mid": "msg_id",
            "text": "مرحبا"
          }
        }
      ]
    }
  ]
}
```

### Webhook Verification
```http
GET /webhook?hub.mode=subscribe&hub.challenge=CHALLENGE&hub.verify_token=VERIFY_TOKEN
```

## 📁 File Upload API

### رفع صورة
```http
POST /api/facebook/upload-and-send-image
Content-Type: multipart/form-data

{
  "image": [FILE],
  "conversation_id": "0a6962e4-a5d6-4663-ab0e-25f7ffa175db",
  "recipient_id": "1234567890",
  "access_token": "EAABwzLixnjYBO..."
}
```

## 🔍 Debug APIs

### فحص المحادثات
```http
GET /api/debug/conversations/{companyId}?limit=10
```

### فحص الرسائل
```http
GET /api/debug/messages/{conversationId}?limit=20
```

## ⚠️ رموز الأخطاء

### أخطاء شائعة:
- `400` - بيانات مطلوبة مفقودة
- `401` - غير مصرح
- `404` - غير موجود
- `500` - خطأ في الخادم

### أخطاء Facebook:
- `#100` - معاملات غير صحيحة
- `#200` - صلاحيات غير كافية
- `#2018047` - فشل تحميل المرفق

## 🛠️ أمثلة عملية

### إرسال رسالة بـ JavaScript:
```javascript
const response = await fetch('/api/conversations/CONV_ID/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    company_id: 'COMPANY_ID',
    message_text: 'مرحبا!',
    message_type: 'text'
  })
});

const result = await response.json();
console.log(result);
```

### رفع صورة بـ JavaScript:
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('conversation_id', 'CONV_ID');

const response = await fetch('/api/facebook/upload-and-send-image', {
  method: 'POST',
  body: formData
});
```

## 🔐 المصادقة

### Headers مطلوبة:
```http
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (إذا كان مطلوب)
```

### معاملات مطلوبة:
- `company_id`: في معظم الطلبات
- `conversation_id`: للرسائل
- `access_token`: لـ Facebook APIs

## 📊 حدود الاستخدام

### حدود البيانات:
- المحادثات: 200 كحد أقصى
- الرسائل: 500 كحد أقصى
- الصور: 10MB كحد أقصى

### حدود Facebook:
- 600 طلب/دقيقة لكل صفحة
- 200 رسالة/ساعة لكل مستخدم

---
*آخر تحديث: ديسمبر 2024*
*جميع APIs مجربة ومختبرة* ✅
