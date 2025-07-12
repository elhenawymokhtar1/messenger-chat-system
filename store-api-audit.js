// 🔍 Store API Comprehensive Audit Script
const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3002';
const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make API requests
function apiRequest(endpoint, options = {}) {
  return new Promise((resolve) => {
    const url = `${API_BASE}${endpoint}`;
    console.log(`🔍 Testing: ${options.method || 'GET'} ${url}`);

    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            ok: false,
            data: data,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        ok: false,
        error: error.message
      });
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test function
function test(name, result, expected = true) {
  const passed = result === expected;
  testResults.tests.push({
    name,
    passed,
    result,
    expected
  });
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name} - Expected: ${expected}, Got: ${result}`);
  }
}

// Main audit function
async function runStoreAudit() {
  console.log('🚀 Starting Store API Comprehensive Audit...\n');
  
  // 1. Test Store Management APIs
  console.log('📊 1. STORE MANAGEMENT APIS');
  console.log('=' .repeat(50));
  
  // Get store info
  const storeResponse = await apiRequest(`/api/companies/${COMPANY_ID}/store`);
  test('Store API responds', storeResponse.ok);
  test('Store API returns JSON', typeof storeResponse.data === 'object');
  
  if (storeResponse.ok) {
    console.log('📋 Store Data:', JSON.stringify(storeResponse.data, null, 2));
  }
  
  // 2. Test Product Management APIs
  console.log('\n📦 2. PRODUCT MANAGEMENT APIS');
  console.log('=' .repeat(50));
  
  // Get products
  const productsResponse = await apiRequest(`/api/companies/${COMPANY_ID}/products`);
  test('Products API responds', productsResponse.ok);
  
  if (productsResponse.ok) {
    console.log(`📦 Found ${productsResponse.data?.data?.length || 0} products`);
  }
  
  // Test product creation
  const newProduct = {
    name: 'Test Product - Audit',
    description: 'Product created during API audit',
    price: 99.99,
    stock_quantity: 10,
    category: 'test',
    sku: `TEST-${Date.now()}`
  };
  
  const createProductResponse = await apiRequest(`/api/companies/${COMPANY_ID}/products`, {
    method: 'POST',
    body: JSON.stringify(newProduct)
  });
  test('Product creation API responds', createProductResponse.ok);
  
  let createdProductId = null;
  if (createProductResponse.ok && createProductResponse.data?.data?.id) {
    createdProductId = createProductResponse.data.data.id;
    console.log(`✅ Created test product with ID: ${createdProductId}`);
  }
  
  // 3. Test Category Management
  console.log('\n🏷️ 3. CATEGORY MANAGEMENT APIS');
  console.log('=' .repeat(50));
  
  const categoriesResponse = await apiRequest('/api/categories');
  test('Categories API responds', categoriesResponse.ok);
  
  // 4. Test Cart Functionality
  console.log('\n🛒 4. CART FUNCTIONALITY APIS');
  console.log('=' .repeat(50));
  
  const sessionId = `test-session-${Date.now()}`;
  
  // Test adding item to cart
  if (createdProductId) {
    const cartItem = {
      product_id: createdProductId,
      product_name: newProduct.name,
      product_price: newProduct.price,
      quantity: 2
    };
    
    const addToCartResponse = await apiRequest(`/api/companies/${COMPANY_ID}/cart/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify(cartItem)
    });
    test('Add to cart API responds', addToCartResponse.ok);
  }
  
  // Get cart items
  const cartResponse = await apiRequest(`/api/companies/${COMPANY_ID}/cart/${sessionId}`);
  test('Get cart API responds', cartResponse.ok);
  
  // 5. Test Order Processing
  console.log('\n📋 5. ORDER PROCESSING APIS');
  console.log('=' .repeat(50));
  
  // Test order creation
  const orderData = {
    session_id: sessionId,
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    customer_phone: '01234567890',
    items: [{
      product_id: createdProductId || 'test-product',
      product_name: 'Test Product',
      quantity: 1,
      price: 99.99
    }],
    summary: {
      subtotal: 99.99,
      shipping: 10.00,
      total: 109.99
    }
  };
  
  const createOrderResponse = await apiRequest(`/api/companies/${COMPANY_ID}/orders`, {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
  test('Order creation API responds', createOrderResponse.ok);
  
  // Get orders
  const ordersResponse = await apiRequest(`/api/companies/${COMPANY_ID}/orders`);
  test('Get orders API responds', ordersResponse.ok);
  
  // 6. Test Coupon System
  console.log('\n🎫 6. COUPON SYSTEM APIS');
  console.log('=' .repeat(50));
  
  const couponsResponse = await apiRequest(`/api/companies/${COMPANY_ID}/coupons`);
  test('Coupons API responds', couponsResponse.ok);
  
  // 7. Test Shipping Methods
  console.log('\n🚚 7. SHIPPING METHODS APIS');
  console.log('=' .repeat(50));
  
  const shippingResponse = await apiRequest(`/api/companies/${COMPANY_ID}/shipping-methods`);
  test('Shipping methods API responds', shippingResponse.ok);
  
  // 8. Test Product Variants
  console.log('\n🎨 8. PRODUCT VARIANTS APIS');
  console.log('=' .repeat(50));
  
  if (createdProductId) {
    const variantsResponse = await apiRequest(`/api/companies/${COMPANY_ID}/products/${createdProductId}/variants`);
    test('Product variants API responds', variantsResponse.ok);
  }
  
  // 9. Test Search and Filtering
  console.log('\n🔍 9. SEARCH AND FILTERING APIS');
  console.log('=' .repeat(50));
  
  const searchResponse = await apiRequest(`/api/companies/${COMPANY_ID}/products?search=test`);
  test('Product search API responds', searchResponse.ok);
  
  // 10. Test Analytics and Reports
  console.log('\n📊 10. ANALYTICS AND REPORTS APIS');
  console.log('=' .repeat(50));
  
  const analyticsResponse = await apiRequest(`/api/companies/${COMPANY_ID}/analytics`);
  test('Analytics API responds', analyticsResponse.ok);
  
  // Cleanup - Delete test product
  if (createdProductId) {
    console.log('\n🧹 CLEANUP');
    console.log('=' .repeat(50));
    
    const deleteResponse = await apiRequest(`/api/companies/${COMPANY_ID}/products/${createdProductId}`, {
      method: 'DELETE'
    });
    test('Product deletion API responds', deleteResponse.ok);
  }
  
  // Print final results
  console.log('\n📊 AUDIT RESULTS');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.tests.length}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`   - ${t.name}`));
  }
  
  return testResults;
}

// Run the audit
runStoreAudit().catch(console.error);
