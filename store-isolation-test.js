// 🔒 اختبار شامل لعزل البيانات في المتجر الإلكتروني
// Store Data Isolation Comprehensive Test

import axios from 'axios';

const API_BASE = 'http://localhost:3002';

// معرفات الشركات للاختبار
const COMPANIES = {
  ALWANSH: 'ca902954-da5a-4a5c-8dc0-24f734171acb',
  ALPHA: '4157650d-157b-4145-8f06-ad59fc5b0280',
  ALMOKTAR: '2b3dad4c-d01e-483b-862c-ae7ea97366ad',
  ALFANAR: '00b72563-8ff4-4831-8719-56ffded3b3d4'
};

class StoreIsolationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 اختبار: ${testName}`);
    try {
      const result = await testFunction();
      if (result.success) {
        console.log(`✅ نجح: ${testName}`);
        this.results.passed++;
        this.results.tests.push({ name: testName, status: 'PASSED', details: result.details });
      } else {
        console.log(`❌ فشل: ${testName} - ${result.error}`);
        this.results.failed++;
        this.results.tests.push({ name: testName, status: 'FAILED', error: result.error });
      }
    } catch (error) {
      console.log(`💥 خطأ: ${testName} - ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ name: testName, status: 'ERROR', error: error.message });
    }
  }

  async testStoreIsolation() {
    console.log('🏪 اختبار عزل المتاجر...');
    
    const stores = {};
    
    // جلب متاجر كل شركة
    for (const [name, companyId] of Object.entries(COMPANIES)) {
      try {
        const response = await axios.get(`${API_BASE}/api/companies/${companyId}/store`);
        stores[name] = response.data.data;
      } catch (error) {
        console.log(`⚠️ لا يوجد متجر للشركة ${name}`);
        stores[name] = null;
      }
    }

    // التحقق من أن كل متجر مرتبط بالشركة الصحيحة
    let isolationValid = true;
    const details = [];

    for (const [name, companyId] of Object.entries(COMPANIES)) {
      if (stores[name] && stores[name].company_id !== companyId) {
        isolationValid = false;
        details.push(`❌ متجر ${name} مرتبط بشركة خاطئة`);
      } else if (stores[name]) {
        details.push(`✅ متجر ${name} مرتبط بالشركة الصحيحة`);
      }
    }

    return {
      success: isolationValid,
      details: details.join('\n'),
      error: isolationValid ? null : 'عزل المتاجر غير صحيح'
    };
  }

  async testProductIsolation() {
    console.log('📦 اختبار عزل المنتجات...');
    
    const products = {};
    
    // جلب منتجات كل شركة
    for (const [name, companyId] of Object.entries(COMPANIES)) {
      try {
        const response = await axios.get(`${API_BASE}/api/companies/${companyId}/products`);
        products[name] = response.data.data || [];
      } catch (error) {
        products[name] = [];
      }
    }

    // التحقق من أن كل منتج مرتبط بالشركة الصحيحة
    let isolationValid = true;
    const details = [];

    for (const [name, companyId] of Object.entries(COMPANIES)) {
      const companyProducts = products[name];
      details.push(`🏢 ${name}: ${companyProducts.length} منتج`);
      
      for (const product of companyProducts) {
        if (product.company_id !== companyId) {
          isolationValid = false;
          details.push(`❌ منتج ${product.name} مرتبط بشركة خاطئة`);
        }
      }
    }

    // التحقق من عدم وجود منتجات مشتركة بين الشركات
    const allProductIds = [];
    for (const companyProducts of Object.values(products)) {
      for (const product of companyProducts) {
        if (allProductIds.includes(product.id)) {
          isolationValid = false;
          details.push(`❌ منتج مكرر بين الشركات: ${product.id}`);
        }
        allProductIds.push(product.id);
      }
    }

    return {
      success: isolationValid,
      details: details.join('\n'),
      error: isolationValid ? null : 'عزل المنتجات غير صحيح'
    };
  }

  async testCrossCompanyAccess() {
    console.log('🚫 اختبار منع الوصول المتقاطع...');
    
    const details = [];
    let accessBlocked = true;

    // محاولة الوصول لمنتجات شركة من خلال معرف شركة أخرى
    try {
      const response1 = await axios.get(`${API_BASE}/api/companies/${COMPANIES.ALWANSH}/products`);
      const response2 = await axios.get(`${API_BASE}/api/companies/${COMPANIES.ALPHA}/products`);
      
      const alwanshProducts = response1.data.data || [];
      const alphaProducts = response2.data.data || [];
      
      // التحقق من عدم وجود منتجات مشتركة
      for (const product1 of alwanshProducts) {
        for (const product2 of alphaProducts) {
          if (product1.id === product2.id) {
            accessBlocked = false;
            details.push(`❌ منتج مشترك بين الشركات: ${product1.id}`);
          }
        }
      }
      
      if (accessBlocked) {
        details.push('✅ لا يوجد منتجات مشتركة بين الشركات');
        details.push(`✅ شركة الونش: ${alwanshProducts.length} منتج`);
        details.push(`✅ شركة الفا: ${alphaProducts.length} منتج`);
      }
      
    } catch (error) {
      details.push(`⚠️ خطأ في الاختبار: ${error.message}`);
    }

    return {
      success: accessBlocked,
      details: details.join('\n'),
      error: accessBlocked ? null : 'يوجد تسرب في البيانات بين الشركات'
    };
  }

  async testUniqueIdentifiers() {
    console.log('🆔 اختبار المعرفات الفريدة...');
    
    const details = [];
    let uniqueValid = true;

    // جلب جميع المنتجات من جميع الشركات
    const allProducts = [];
    for (const [name, companyId] of Object.entries(COMPANIES)) {
      try {
        const response = await axios.get(`${API_BASE}/api/companies/${companyId}/products`);
        const products = response.data.data || [];
        allProducts.push(...products);
        details.push(`📦 ${name}: ${products.length} منتج`);
      } catch (error) {
        details.push(`⚠️ ${name}: خطأ في جلب المنتجات`);
      }
    }

    // التحقق من فرادة المعرفات
    const productIds = allProducts.map(p => p.id);
    const uniqueIds = [...new Set(productIds)];
    
    if (productIds.length !== uniqueIds.length) {
      uniqueValid = false;
      details.push(`❌ يوجد معرفات مكررة: ${productIds.length} منتج، ${uniqueIds.length} معرف فريد`);
    } else {
      details.push(`✅ جميع المعرفات فريدة: ${uniqueIds.length} منتج`);
    }

    // التحقق من فرادة SKU
    const skus = allProducts.map(p => p.sku).filter(sku => sku);
    const uniqueSkus = [...new Set(skus)];
    
    if (skus.length !== uniqueSkus.length) {
      uniqueValid = false;
      details.push(`❌ يوجد SKU مكررة: ${skus.length} SKU، ${uniqueSkus.length} SKU فريدة`);
    } else {
      details.push(`✅ جميع SKU فريدة: ${uniqueSkus.length} SKU`);
    }

    return {
      success: uniqueValid,
      details: details.join('\n'),
      error: uniqueValid ? null : 'يوجد معرفات مكررة'
    };
  }

  async runAllTests() {
    console.log('🚀 بدء اختبارات عزل البيانات الشاملة...\n');
    
    await this.runTest('عزل المتاجر', () => this.testStoreIsolation());
    await this.runTest('عزل المنتجات', () => this.testProductIsolation());
    await this.runTest('منع الوصول المتقاطع', () => this.testCrossCompanyAccess());
    await this.runTest('المعرفات الفريدة', () => this.testUniqueIdentifiers());
    
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 نتائج اختبارات عزل البيانات');
    console.log('='.repeat(60));
    
    console.log(`✅ اختبارات نجحت: ${this.results.passed}`);
    console.log(`❌ اختبارات فشلت: ${this.results.failed}`);
    console.log(`📈 معدل النجاح: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 جميع الاختبارات نجحت! العزل يعمل بشكل مثالي.');
    } else {
      console.log('\n⚠️ يوجد مشاكل في العزل تحتاج إلى إصلاح.');
    }
    
    console.log('\n📋 تفاصيل الاختبارات:');
    this.results.tests.forEach((test, index) => {
      const status = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '💥';
      console.log(`${index + 1}. ${status} ${test.name}`);
      if (test.details) {
        console.log(`   ${test.details.replace(/\n/g, '\n   ')}`);
      }
      if (test.error) {
        console.log(`   خطأ: ${test.error}`);
      }
    });
  }
}

// تشغيل الاختبارات
const tester = new StoreIsolationTester();
tester.runAllTests().catch(console.error);

export default StoreIsolationTester;
