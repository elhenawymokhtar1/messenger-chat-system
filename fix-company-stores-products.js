// إصلاح مشكلة عزل المنتجات بين الشركات
// إنشاء متاجر للشركات وتوزيع المنتجات

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddwszecfsfkjnahesymm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkd3N6ZWNmc2ZramFoZXN5bW0iLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzE2NzY3NDY3LCJleHAiOjIwMzIzNDM0Njd9.Nt2dQpivpUBjKseaGjjfHvn5WoFJkpOFPdYBWkNOBgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCompanyStoresProducts() {
  console.log('🔧 بدء إصلاح عزل المنتجات بين الشركات...\n');

  try {
    // 1. جلب جميع الشركات
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, email')
      .order('name');

    if (companiesError) {
      console.error('❌ خطأ في جلب الشركات:', companiesError);
      return;
    }

    console.log(`📊 عدد الشركات: ${companies.length}\n`);

    // 2. جلب المنتجات الموجودة
    const { data: existingProducts, error: productsError } = await supabase
      .from('ecommerce_products')
      .select('*');

    if (productsError) {
      console.error('❌ خطأ في جلب المنتجات:', productsError);
      return;
    }

    console.log(`📦 عدد المنتجات الموجودة: ${existingProducts.length}\n`);

    // 3. إنشاء متاجر للشركات التي ليس لديها متاجر
    for (const company of companies) {
      console.log(`🏢 معالجة الشركة: ${company.name}`);

      // التحقق من وجود متاجر للشركة
      const { data: existingStores, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('company_id', company.id);

      if (storesError) {
        console.error(`   ❌ خطأ في جلب متاجر الشركة: ${storesError.message}`);
        continue;
      }

      if (existingStores.length === 0) {
        // إنشاء متجر جديد للشركة
        const storeName = `متجر ${company.name}`;
        const storeSlug = `store-${company.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;

        console.log(`   🏪 إنشاء متجر جديد: ${storeName}`);

        const { data: newStore, error: createStoreError } = await supabase
          .from('stores')
          .insert({
            company_id: company.id,
            name: storeName,
            slug: storeSlug,
            description: `متجر إلكتروني لشركة ${company.name}`,
            owner_email: company.email,
            currency: 'EGP',
            is_active: true,
            settings: {}
          })
          .select()
          .single();

        if (createStoreError) {
          console.error(`   ❌ خطأ في إنشاء المتجر: ${createStoreError.message}`);
          continue;
        }

        console.log(`   ✅ تم إنشاء المتجر بنجاح: ${newStore.id}`);

        // إنشاء نسخ من المنتجات الموجودة لهذا المتجر
        if (existingProducts.length > 0) {
          console.log(`   📦 إنشاء نسخ من المنتجات (${existingProducts.length} منتج)...`);

          for (const product of existingProducts) {
            const newProductData = {
              store_id: newStore.id,
              name: product.name,
              slug: `${product.slug}-${company.name.replace(/\s+/g, '-').toLowerCase()}`,
              description: product.description,
              short_description: product.short_description,
              sku: `${product.sku}-${company.name.substring(0, 3).toUpperCase()}`,
              price: product.price,
              sale_price: product.sale_price,
              stock_quantity: product.stock_quantity,
              status: product.status,
              featured: product.featured,
              image_url: product.image_url,
              category: product.category,
              brand: product.brand
            };

            const { error: createProductError } = await supabase
              .from('ecommerce_products')
              .insert(newProductData);

            if (createProductError) {
              console.error(`     ❌ خطأ في إنشاء المنتج ${product.name}: ${createProductError.message}`);
            } else {
              console.log(`     ✅ تم إنشاء المنتج: ${product.name}`);
            }
          }
        }
      } else {
        console.log(`   ✅ المتجر موجود بالفعل: ${existingStores[0].name}`);
      }

      console.log(''); // سطر فارغ
    }

    // 4. عرض النتائج النهائية
    console.log('\n📊 النتائج النهائية:');
    
    const { data: finalStores } = await supabase
      .from('stores')
      .select('id, name, company_id');
    
    const { data: finalProducts } = await supabase
      .from('ecommerce_products')
      .select('id, name, store_id');

    console.log(`🏪 إجمالي المتاجر: ${finalStores?.length || 0}`);
    console.log(`📦 إجمالي المنتجات: ${finalProducts?.length || 0}`);

    // إحصائيات لكل شركة
    for (const company of companies) {
      const companyStores = finalStores?.filter(s => s.company_id === company.id) || [];
      const companyProducts = finalProducts?.filter(p => 
        companyStores.some(s => s.id === p.store_id)
      ) || [];

      console.log(`\n🏢 ${company.name}:`);
      console.log(`   🏪 المتاجر: ${companyStores.length}`);
      console.log(`   📦 المنتجات: ${companyProducts.length}`);
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل الإصلاح
fixCompanyStoresProducts().then(() => {
  console.log('\n✅ انتهى الإصلاح بنجاح');
  process.exit(0);
}).catch(error => {
  console.error('❌ خطأ في تشغيل الإصلاح:', error);
  process.exit(1);
});
