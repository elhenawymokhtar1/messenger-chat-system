const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ipevrcvgxsmenxzxdukz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZXZyY3ZneHNtZW54enh4ZHVreiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE5NzQ5NzE5LCJleHAiOjIwMzUzMjU3MTl9.Ej_gqZBbNgfiho_KQSxhLSALaLfKjjHjkWgxNjkwOQs';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🏪 فحص عزل المتجر والمنتجات');
console.log('═══════════════════════════════════════════════════════════════');

async function checkStoreIsolation() {
  try {
    // 1. فحص الشركات والمتاجر
    console.log('\n1️⃣ فحص الشركات والمتاجر...');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id, 
        name, 
        email,
        stores (
          id,
          name,
          slug,
          is_active
        )
      `)
      .order('created_at', { ascending: true });

    if (companiesError) {
      console.error('❌ خطأ في جلب الشركات:', companiesError.message);
      return;
    }

    console.log(`📊 عدد الشركات: ${companies.length}`);
    
    for (const company of companies) {
      console.log(`\n🏢 الشركة: ${company.name} (${company.email})`);
      console.log(`   🆔 ID: ${company.id}`);
      
      if (company.stores && company.stores.length > 0) {
        console.log(`   🏪 المتاجر (${company.stores.length}):`);
        company.stores.forEach((store, index) => {
          console.log(`      ${index + 1}. ${store.name} (${store.slug}) - ${store.is_active ? 'نشط' : 'غير نشط'}`);
          console.log(`         🆔 Store ID: ${store.id}`);
        });
      } else {
        console.log('   ⚠️ لا توجد متاجر لهذه الشركة');
      }
    }

    // 2. فحص المنتجات لكل شركة
    console.log('\n2️⃣ فحص المنتجات لكل شركة...');
    
    for (const company of companies) {
      console.log(`\n🏢 منتجات الشركة: ${company.name}`);
      
      // جلب المنتجات عبر المتاجر
      if (company.stores && company.stores.length > 0) {
        for (const store of company.stores) {
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name, price, is_active')
            .eq('store_id', store.id);

          if (productsError) {
            console.error(`   ❌ خطأ في جلب منتجات المتجر ${store.name}:`, productsError.message);
            continue;
          }

          console.log(`   🏪 متجر ${store.name}: ${products.length} منتج`);
          
          if (products.length > 0) {
            products.slice(0, 3).forEach((product, index) => {
              console.log(`      ${index + 1}. ${product.name} - ${product.price} جنيه - ${product.is_active ? 'نشط' : 'غير نشط'}`);
            });
            if (products.length > 3) {
              console.log(`      ... و ${products.length - 3} منتج آخر`);
            }
          }
        }
      }
    }

    // 3. فحص الفئات لكل شركة
    console.log('\n3️⃣ فحص الفئات لكل شركة...');
    
    for (const company of companies) {
      console.log(`\n🏢 فئات الشركة: ${company.name}`);
      
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, is_active')
        .eq('company_id', company.id);

      if (categoriesError) {
        console.error(`   ❌ خطأ في جلب الفئات:`, categoriesError.message);
        continue;
      }

      console.log(`   📂 عدد الفئات: ${categories.length}`);
      
      if (categories.length > 0) {
        categories.forEach((category, index) => {
          console.log(`      ${index + 1}. ${category.name} - ${category.is_active ? 'نشط' : 'غير نشط'}`);
        });
      }
    }

    // 4. فحص الكوبونات لكل شركة
    console.log('\n4️⃣ فحص الكوبونات لكل شركة...');
    
    for (const company of companies) {
      console.log(`\n🏢 كوبونات الشركة: ${company.name}`);
      
      const { data: coupons, error: couponsError } = await supabase
        .from('coupons')
        .select('id, code, discount_value, is_active')
        .eq('company_id', company.id);

      if (couponsError) {
        console.error(`   ❌ خطأ في جلب الكوبونات:`, couponsError.message);
        continue;
      }

      console.log(`   🎫 عدد الكوبونات: ${coupons.length}`);
      
      if (coupons.length > 0) {
        coupons.forEach((coupon, index) => {
          console.log(`      ${index + 1}. ${coupon.code} - خصم ${coupon.discount_value}% - ${coupon.is_active ? 'نشط' : 'غير نشط'}`);
        });
      }
    }

    return { companies, success: true };
    
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
    return { success: false, error: error.message };
  }
}

// تشغيل الفحص
checkStoreIsolation().then((result) => {
  if (result.success) {
    console.log('\n✅ تم فحص عزل المتجر والمنتجات بنجاح');
  } else {
    console.log('\n❌ فشل في فحص عزل المتجر والمنتجات');
  }
});
