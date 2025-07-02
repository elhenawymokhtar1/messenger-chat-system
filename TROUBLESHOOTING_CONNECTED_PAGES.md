# 🔧 دليل استكشاف أخطاء الصفحات المربوطة

## 🚨 المشكلة الحالية
**الصفحات لا تظهر في قائمة "الصفحات المربوطة" بعد ربطها من الإعدادات**

---

## 🔍 خطوات التشخيص

### 1. **تحقق من حالة خادم API**
```bash
# تشغيل خادم API
npm run api

# أو تشغيل الخادم والواجهة معاً
npm run start:all
```

**المشكلة المحتملة:** خادم API لا يعمل على المنفذ 8081

### 2. **تحقق من قاعدة البيانات**
افتح المتصفح واذهب إلى:
```
http://localhost:8081/api/facebook/settings
```

**النتيجة المتوقعة:** قائمة JSON بالصفحات المربوطة
**إذا ظهر خطأ:** خادم API لا يعمل أو قاعدة البيانات غير متصلة

### 3. **تحقق من عملية الربط**
افتح Developer Tools في المتصفح (F12) وتابع:
1. اذهب إلى صفحة الإعدادات `/settings`
2. أدخل Access Token
3. اختر صفحة للربط
4. راقب Console للرسائل

**الرسائل المتوقعة:**
```
🔗 بدء ربط الصفحة: {pageId, pageName}
💾 بدء حفظ إعدادات Facebook
✅ تم حفظ الصفحة في قاعدة البيانات بنجاح
```

---

## 🛠️ الحلول المقترحة

### الحل 1: تشغيل خادم API
```bash
# في terminal منفصل
cd C:\Users\mo1\Desktop\facebook-reply2.1
npm run api
```

### الحل 2: تشغيل النظام كاملاً
```bash
# تشغيل الواجهة والخادم معاً
npm run start:all
```

### الحل 3: فحص قاعدة البيانات يدوياً
1. افتح Supabase Dashboard
2. اذهب إلى Table Editor
3. افتح جدول `facebook_settings`
4. تحقق من وجود الصفحات المربوطة

### الحل 4: إعادة ربط الصفحات
1. اذهب إلى `/settings`
2. أدخل Access Token مرة أخرى
3. اختر الصفحة وأعد ربطها
4. راقب Console للتأكد من نجاح العملية

---

## 🔧 إصلاحات تقنية

### إصلاح 1: تحديث Hook
في `src/hooks/useFacebookApi.ts`:
```typescript
// تأكد من أن queryKey صحيح
const { data: allConnectedPages = [], isLoading: isLoadingConnectedPages } = useQuery({
  queryKey: ['connected-pages'],
  queryFn: async () => {
    return await FacebookApiService.getAllConnectedPages();
  },
  refetchOnMount: true, // إضافة هذا السطر
  refetchOnWindowFocus: true, // إضافة هذا السطر
});
```

### إصلاح 2: فرض إعادة التحميل
في صفحة الإعدادات بعد الربط:
```typescript
// إضافة هذا بعد نجاح الربط
queryClient.invalidateQueries({ queryKey: ['connected-pages'] });
window.location.reload(); // حل مؤقت
```

### إصلاح 3: تحقق من فلترة الشركات
في `src/hooks/useFacebookApi.ts` السطر 35-91:
```typescript
// تأكد من أن فلترة الشركات تعمل بشكل صحيح
const connectedPages = React.useMemo(() => {
  console.log('🔍 بدء فلترة الصفحات حسب الشركة...');
  console.log('📊 جميع الصفحات:', allConnectedPages?.length || 0);
  
  // إذا لم تكن هناك صفحات أصلاً، إرجاع مصفوفة فارغة
  if (!allConnectedPages || allConnectedPages.length === 0) {
    console.log('❌ لا توجد صفحات في النظام');
    return [];
  }
  
  // باقي الكود...
}, [allConnectedPages, company?.id, company?.name]);
```

---

## 🧪 اختبار سريع

### اختبار 1: بيانات تجريبية
تم إضافة بيانات تجريبية في صفحة الصفحات المربوطة لاختبار الواجهة.

### اختبار 2: API مباشر
```bash
# اختبار API مباشرة
curl http://localhost:8081/api/facebook/settings
```

### اختبار 3: Console Logs
افتح Developer Tools وراقب الرسائل في Console عند:
- تحميل صفحة الصفحات المربوطة
- ربط صفحة جديدة من الإعدادات

---

## 📞 خطوات المتابعة

1. **شغل خادم API** أولاً
2. **تحقق من قاعدة البيانات** 
3. **أعد ربط صفحة** للاختبار
4. **راقب Console** للرسائل
5. **تحقق من صفحة الصفحات المربوطة**

---

## 💡 ملاحظات مهمة

- **خادم API يجب أن يعمل على المنفذ 8081**
- **Vite Dev Server يعمل على المنفذ 8080**
- **قاعدة البيانات Supabase يجب أن تكون متصلة**
- **Access Token يجب أن يكون صالحاً**

---

## 🎯 النتيجة المتوقعة

بعد تطبيق هذه الحلول، يجب أن:
- ✅ تظهر الصفحات المربوطة في `/connected-pages`
- ✅ تعمل عمليات الإدارة (قطع الاتصال، حذف، إعادة تفعيل)
- ✅ تتحدث البيانات فوراً بعد أي تغيير
- ✅ تعرض الإحصائيات الصحيحة
