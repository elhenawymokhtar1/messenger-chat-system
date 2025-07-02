# 🔧 دليل إعداد Facebook Messenger

## المشكلة الحالية:
- ✅ الصفحة مربوطة بالنظام
- ✅ رمز الوصول صحيح
- ❌ **Webhook غير مفعل** (السبب الرئيسي)
- ⚠️ رمز الوصول يحتاج صلاحيات إضافية

---

## 🔧 الحل الكامل:

### 1. **الحصول على رمز وصول بالصلاحيات الكاملة**

اذهب إلى: https://developers.facebook.com/tools/explorer/

**الصلاحيات المطلوبة:**
```
pages_manage_metadata
pages_read_engagement
pages_messaging
pages_show_list
```

### 2. **إعداد Facebook App (إذا لم يكن موجود)**

1. اذهب إلى: https://developers.facebook.com/apps/
2. اضغط "Create App"
3. اختر "Business" → "Continue"
4. املأ البيانات:
   - App Name: `Your App Name`
   - Contact Email: `your-email@example.com`

### 3. **إضافة منتج Messenger**

1. في لوحة التطبيق، اذهب إلى "Products"
2. اضغط "Add Product" بجانب "Messenger"
3. اضغط "Set Up"

### 4. **إعداد Webhooks**

1. في إعدادات Messenger، اذهب إلى "Webhooks"
2. اضغط "Add Callback URL"
3. املأ البيانات:
   ```
   Callback URL: https://your-domain.com/webhook/facebook
   Verify Token: your-secret-verify-token
   ```
4. اختر الأحداث:
   - ✅ messages
   - ✅ messaging_postbacks
   - ✅ messaging_optins
   - ✅ messaging_deliveries
   - ✅ messaging_reads

### 5. **ربط الصفحة بالتطبيق**

1. في إعدادات Messenger، اذهب إلى "Access Tokens"
2. اختر صفحتك "Simple A42"
3. اضغط "Generate Token"
4. انسخ الرمز الجديد

### 6. **تحديث رمز الوصول في النظام**

1. اذهب إلى صفحة Facebook Settings
2. احذف الصفحة الحالية
3. أضف الصفحة مرة أخرى بالرمز الجديد

---

## 🧪 **اختبار النظام:**

### 1. **اختبار Webhook:**
```bash
curl -X POST "https://graph.facebook.com/v21.0/me/subscribed_apps" \
  -d "access_token=YOUR_PAGE_ACCESS_TOKEN"
```

### 2. **إرسال رسالة تجريبية:**
- اذهب إلى صفحة Facebook
- أرسل رسالة من حساب شخصي
- تحقق من وصول الرسالة في النظام

---

## 🔍 **استكشاف الأخطاء:**

### إذا لم تصل الرسائل:
1. ✅ تأكد من أن Webhook URL صحيح ومتاح
2. ✅ تأكد من أن Verify Token صحيح
3. ✅ تأكد من أن الصفحة مشتركة في التطبيق
4. ✅ تأكد من أن رمز الوصول لديه الصلاحيات المطلوبة

### فحص سجلات Facebook:
1. اذهب إلى Developer Console
2. اختر تطبيقك
3. اذهب إلى "Webhooks" → "Test Events"
4. تحقق من الأحداث الواردة

---

## 📞 **الخطوات السريعة:**

1. **احصل على رمز وصول جديد** بالصلاحيات الكاملة
2. **أعد إضافة الصفحة** في النظام
3. **أعد إعداد Webhook** في Facebook Developer Console
4. **اختبر إرسال رسالة** للصفحة

---

## ⚠️ **ملاحظات مهمة:**

- **Webhook URL** يجب أن يكون HTTPS
- **Verify Token** يجب أن يطابق ما في الكود
- **Page Access Token** أفضل من User Access Token للرسائل
- **التطبيق** يجب أن يكون في وضع "Live" للاستخدام العام
