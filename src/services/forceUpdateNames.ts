// وظيفة لتحديث قسري لجميع أسماء المستخدمين
import { FacebookApiService } from './facebookApi';
import { needsNameReplacement } from '@/utils/nameUtils';

// كاش للأسماء التي تم استرجاعها بنجاح من Facebook
const userNameCache = new Map<string, string>();

// معدل النجاح وتعقب الأخطاء
const stats = {
  totalAttempted: 0,
  successfulUpdates: 0,
  apiErrors: 0,
  dbErrors: 0,
  notFound: 0
};

// سجل الخطأ وتعقب الإحصائيات
function logError(message: string, error: any) {
  console.error(`❌ ${message}`, error);
  return error;
}

/**
 * جلب أسماء المستخدمين من صفحة فيسبوك باستخدام Graph API
 * @param page بيانات الصفحة (معرف الصفحة ورمز الوصول)
 * @returns خريطة من معرفات المستخدمين وأسمائهم
 */
async function fetchUserNamesFromPage(page: any): Promise<Map<string, string>> {
  console.log(`🔍 جلب أسماء المستخدمين من فيسبوك للصفحة ${page.page_id}...`);
  const userNames = new Map<string, string>();
  
  // التحقق من رمز الوصول
  if (!page.access_token) {
    console.error(`❌ لا يوجد رمز وصول للصفحة ${page.page_id}`);
    stats.apiErrors++;
    return userNames;
  }
  
  try {
    // استخدام دالة الـ API مباشرة للحصول على المحادثات
    let nextUrl = `https://graph.facebook.com/v18.0/me/conversations?fields=participants&access_token=${page.access_token}&limit=100`;
    let pageCount = 0;
    const MAX_PAGES = 5; // حد أقصى لعدد صفحات النتائج لتجنب التعليق
    
    // نستخدم حلقة لجلب المزيد من المحادثات
    while (nextUrl && pageCount < MAX_PAGES) {
      pageCount++;
      console.log(`🔎 جلب صفحة المحادثات ${pageCount}...`);
      
      // محاولة الاستعلام مع التعامل مع الأخطاء
      try {
        const response = await fetch(nextUrl);
        
        if (!response.ok) {
          stats.apiErrors++;
          console.error(`❌ خطأ في Facebook API: ${response.status} - ${response.statusText}`);
          break;
        }
        
        const fbData = await response.json();
        
        if (fbData.error) {
          stats.apiErrors++;
          console.error('❌ خطأ في Facebook API:', fbData.error.message);
          break;
        }
        
        // استخراج معلومات المستخدمين
        if (fbData.data) {
          for (const fbConversation of fbData.data) {
            if (fbConversation.participants && fbConversation.participants.data) {
              for (const participant of fbConversation.participants.data) {
                // تجاهل الصفحة نفسها
                if (participant.id !== page.page_id && participant.name) {
                  userNames.set(participant.id, participant.name);
                }
              }
            }
          }
        }
        
        // الانتقال للصفحة التالية
        nextUrl = fbData.paging?.next || null;
      } catch (err) {
        stats.apiErrors++;
        console.error('❌ خطأ في استدعاء Facebook API:', err);
        break;
      }
      
      // انتظار قصير لتجنب rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`📋 تم العثور على ${userNames.size} اسم مستخدم من صفحة ${page.page_name}`);
  } catch (error) {
    stats.apiErrors++;
    console.error('❌ خطأ في استدعاء Facebook API:', error);
  }
  
  return userNames;
}

/**
 * تحديث قسري لجميع أسماء المستخدمين في قاعدة البيانات
 * هذه الوظيفة تقوم بتحديث جميع المستخدمين حتى لو كانت أسماؤهم غير مبدوءة بـ User
 * @param onlyMissingNames تحديث الأسماء المفقودة فقط (التي تبدأ بـ User أو فارغة)
 * @returns معلومات عن نتيجة التحديث
 */
export async function forceUpdateAllUserNames(onlyMissingNames: boolean = false) {
  console.log(`🚀 بدء التحديث القسري لأسماء المستخدمين... ${onlyMissingNames ? 'الأسماء المفقودة فقط' : 'جميع الأسماء'}`);

  // إعادة تعيين الإحصائيات
  stats.totalAttempted = 0;
  stats.successfulUpdates = 0;
  stats.apiErrors = 0;
  stats.dbErrors = 0;
  stats.notFound = 0;

  try {
    // الحصول على إعدادات الصفحات
    const { data: pages, error: pagesError } = await supabase
      // TODO: Replace with MySQL API
      // TODO: Replace with MySQL API;

    if (pagesError) {
      throw logError('خطأ في جلب إعدادات الصفحات', pagesError);
    }

    if (!pages || pages.length === 0) {
      throw new Error('لا توجد صفحات مربوطة');
    }

    let totalUpdated = 0;
    let totalProcessed = 0;

    // جمع بيانات من جميع الصفحات
    for (const page of pages) {
      console.log(`📄 معالجة الصفحة: ${page.page_name} (${page.page_id})`);
      
      try {
        // 1. جمع أسماء المستخدمين من محادثات الصفحة
        const userNames = await fetchUserNamesFromPage(page);
        
        if (userNames.size === 0) {
          console.log(`⚠️ لم يتم العثور على أسماء مستخدمين للصفحة ${page.page_name}`);
          continue;
        }
        
        // إضافة الأسماء المسترجعة إلى الكاش
        userNames.forEach((name, id) => {
          userNameCache.set(id, name);
        });
        
        console.log(`✅ تم جمع ${userNames.size} اسم مستخدم للصفحة ${page.page_name}`);

        // 2. جلب المحادثات من قاعدة البيانات لهذه الصفحة
        const { data: conversations, error: conversationsError } = await supabase
          // TODO: Replace with MySQL API
          // TODO: Replace with MySQL API
          .eq('facebook_page_id', page.page_id);
        
        if (conversationsError) {
          stats.dbErrors++;
          throw logError(`خطأ في جلب محادثات الصفحة ${page.page_name}`, conversationsError);
        }
        
        if (!conversations || conversations.length === 0) {
          console.log(`📊 عدد المحادثات المراد معالجتها: ${conversations.length}`);
        }
        totalProcessed += conversations.length;

        // معالجة كل محادثة
        let pageUpdated = 0;
        let pageSkipped = 0;
        
        for (const conversation of conversations) {
          stats.totalAttempted++;
          const { id, customer_facebook_id, customer_name } = conversation;
          
          // التحقق مما إذا كان الاسم بحاجة إلى تحديث
          if (onlyMissingNames && !needsNameReplacement(customer_name)) {
            pageSkipped++;
            continue;
          }
          
          // محاولة العثور على الاسم من الكاش أولاً
          let realName = userNameCache.get(customer_facebook_id);
          
          // إذا لم يكن موجوداً في الكاش، نبحث عنه في الأسماء التي تم جلبها من الصفحة
          if (!realName) {
            realName = userNames.get(customer_facebook_id);
          }
          
          // إذا تم العثور على الاسم، قم بتحديثه في قاعدة البيانات
          if (realName) {
            // تخطي التحديث إذا كان الاسم نفس الاسم الحالي
            if (realName === customer_name) {
              continue;
            }
            
            try {
              const { error: updateError } = await supabase
                // TODO: Replace with MySQL API
                // TODO: Replace with MySQL API.toISOString()
                })
                .eq('id', id);

              if (updateError) {
                stats.dbErrors++;
                console.error(`❌ خطأ في تحديث المحادثة ${id}:`, updateError);
              } else {
                stats.successfulUpdates++;
                console.log(`✅ تم تحديث: ${customer_name || 'غير معروف'} → ${realName}`);
                pageUpdated++;
                
                // إضافة الاسم إلى الكاش
                if (!userNameCache.has(customer_facebook_id)) {
                  userNameCache.set(customer_facebook_id, realName);
                }
              }
            } catch (error) {
              stats.dbErrors++;
              console.error(`❌ خطأ في تحديث المستخدم ${customer_facebook_id}:`, error);
            }
          } else {
            // محاولة الحصول على الاسم مباشرة من Facebook API
            try {
              console.log(`🔎 محاولة الحصول على اسم المستخدم مباشرة: ${customer_facebook_id}`);
              
              // التحقق من الكاش مرة أخرى لتجنب الطلبات المتكررة
              if (userNameCache.has(customer_facebook_id)) {
                realName = userNameCache.get(customer_facebook_id);
                console.log(`✅ تم العثور على الاسم في الكاش: ${realName}`);
              } else {
                // استخدام API مباشرة للحصول على معلومات المستخدم
                const userInfoUrl = `https://graph.facebook.com/v18.0/${customer_facebook_id}?fields=name&access_token=${page.access_token}`;
                const userInfoResponse = await fetch(userInfoUrl);
                
                if (!userInfoResponse.ok) {
                  stats.apiErrors++;
                  console.error(`❌ خطأ في الحصول على معلومات المستخدم: ${userInfoResponse.status}`);
                  continue;
                }
                
                const userInfo = await userInfoResponse.json();
                
                if (userInfo.error) {
                  stats.apiErrors++;
                  console.error(`❌ خطأ في Facebook API:`, userInfo.error.message);
                  continue;
                }
                
                if (userInfo && userInfo.name) {
                  realName = userInfo.name;
                  console.log(`✅ تم الحصول على اسم مستخدم مباشرة: ${realName}`);
                  
                  // إضافة الاسم إلى الكاش
                  userNameCache.set(customer_facebook_id, realName);
                } else {
                  stats.notFound++;
                  console.log(`⚠️ لم يتم العثور على اسم للمستخدم ${customer_facebook_id}`);
                  continue;
                }
              }
              
              // تحديث قاعدة البيانات بالاسم الجديد
              if (realName) {
                // تخطي التحديث إذا كان الاسم نفس الاسم الحالي
                if (realName === customer_name) {
                  continue;
                }
                
                const { error: directUpdateError } = await supabase
                  // TODO: Replace with MySQL API
                  // TODO: Replace with MySQL API.toISOString()
                  })
                  .eq('id', id);
                
                if (directUpdateError) {
                  stats.dbErrors++;
                  console.error(`❌ خطأ في التحديث المباشر للمحادثة ${id}:`, directUpdateError);
                } else {
                  stats.successfulUpdates++;
                  console.log(`✅ تم التحديث المباشر: ${customer_name || 'غير معروف'} → ${realName}`);
                  pageUpdated++;
                }
              }
            } catch (getUserError) {
              stats.apiErrors++;
              console.error(`❌ خطأ في الحصول على معلومات المستخدم ${customer_facebook_id}:`, getUserError);
            }
          }
        }

        totalUpdated += pageUpdated;
        console.log(`📊 الصفحة ${page.page_name}: تم تحديث ${pageUpdated} محادثة من أصل ${conversations.length} (تم تخطي ${pageSkipped})`);
        
      } catch (error) {
        stats.dbErrors++;
        console.error(`❌ خطأ في معالجة الصفحة ${page.page_name}:`, error);
      }
    }

    // طباعة ملخص للنتائج
    console.log('✔️ ملخص التحديث القسري للأسماء:');
    console.log(`📈 إجمالي المحادثات المعالجة: ${totalProcessed}`);
    console.log(`📉 إجمالي محاولات التحديث: ${stats.totalAttempted}`);
    console.log(`✅ إجمالي التحديثات الناجحة: ${stats.successfulUpdates}`);
    console.log(`❌ أخطاء API: ${stats.apiErrors}`);
    console.log(`⛔ أخطاء قاعدة البيانات: ${stats.dbErrors}`);
    console.log(`⚠️ غير موجودة: ${stats.notFound}`);
    console.log(`🏁 إجمالي المحادثات المحدثة: ${totalUpdated}`);

    return {
      totalProcessed,
      totalUpdated,
      successRate: stats.totalAttempted > 0 ? (stats.successfulUpdates / stats.totalAttempted) * 100 : 0,
      stats
    };

  } catch (error) {
    console.error('❌ خطأ عام في التحديث القسري للأسماء:', error);
    return {
      totalProcessed: 0,
      totalUpdated: 0,
      successRate: 0,
      stats,
      error: error.message || 'Unknown error'
    };
  }
}
