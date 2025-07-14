/**
 * وظائف مساعدة لإدارة أسماء المستخدمين
 */

/**
 * قائمة أسماء عربية شائعة للاستخدام كبديل للأسماء غير المعروفة
 */
export const ARABIC_NAMES = [
  'محمد علي', 'أحمد محمود', 'خالد إبراهيم', 'مصطفى حسين', 'علي يوسف',
  'عمر فاروق', 'يوسف أحمد', 'إبراهيم محمد', 'عبدالله سعيد', 'سعيد محمود',
  'سارة محمد', 'فاطمة أحمد', 'نور حسين', 'مريم خالد', 'رنا سمير',
  'أمل علي', 'ليلى يوسف', 'هدى محمود', 'سلمى إبراهيم', 'رشا عبدالله'
];

/**
 * تحقق مما إذا كان الاسم بحاجة إلى استبدال (مثل أسماء تبدأ بـ User)
 * @param name اسم المستخدم للتحقق
 */
export function needsNameReplacement(name: string | null | undefined): boolean {
  if (!name) return true;
  if (name.startsWith('User ')) return true;
  return false;
}

/**
 * توليد اسم بديل بناءً على معرف المحادثة
 * @param conversationId معرف المحادثة
 * @param fallbackPageName اسم الصفحة كبديل احتياطي
 * @param customerId معرف العميل على فيسبوك
 */
export function generateAlternativeName(
  conversationId: string | undefined,
  fallbackPageName?: string,
  customerId?: string | null
): string {
  // إذا كان لدينا معرف المستخدم، نستخدم آخر 4 أرقام فقط
  if (customerId && customerId.length > 4) {
    return `عميل ${customerId.slice(-4)}`;
  }

  // التعامل مع الحالات الخاصة
  if (conversationId === undefined || conversationId === null || conversationId === '') {
    return 'عميل غير معروف';
  }

  // استخدام آخر 4 أرقام من معرف المحادثة
  return `عميل ${conversationId.slice(-4)}`;
}

/**
 * الحصول على اسم العرض المناسب بناءً على بيانات المحادثة
 * @param customerName اسم العميل من قاعدة البيانات
 * @param customerId معرف العميل على فيسبوك
 * @param conversationId معرف المحادثة
 * @param pageName اسم الصفحة
 */
export function getDisplayName(
  customerName: string | null | undefined,
  customerId: string | null | undefined,
  conversationId: string | undefined,
  pageName?: string | null
): string {
  // حالات خاصة معينة
  if (customerName === 'Mokhtar Elsnayy') return 'Mokhtar Elsnayy';
  if (customerName === 'Mokhtar Elenawy') return 'Mokhtar Elenawy';
  if (customerId === '351400718067673') return 'Simple A42';

  // إذا كان لدينا اسم حقيقي وصالح، استخدمه
  if (customerName &&
      customerName.trim() !== '' &&
      !needsNameReplacement(customerName)) {
    return customerName;
  }

  // إذا لم يكن لدينا اسم صالح، استخدم معرف مختصر
  return generateAlternativeName(conversationId, pageName || undefined, customerId);
}
