// Quick Store API Test
const http = require('http');

const API_BASE = 'localhost';
const API_PORT = 3002;
const COMPANY_ID = 'c677b32f-fe1c-4c64-8362-a1c03406608d';

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: API_BASE,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            success: false,
            data: responseData,
            error: 'Invalid JSON'
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        success: false,
        error: error.message
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runQuickTest() {
  console.log('🚀 Quick Store API Test\n');

  const tests = [
    {
      name: 'Root API',
      path: '/'
    },
    {
      name: 'Store Info',
      path: `/api/companies/${COMPANY_ID}/store`
    },
    {
      name: 'Products List',
      path: `/api/companies/${COMPANY_ID}/products`
    },
    {
      name: 'Categories',
      path: '/api/categories'
    },
    {
      name: 'Orders',
      path: `/api/companies/${COMPANY_ID}/orders`
    },
    {
      name: 'Coupons',
      path: `/api/companies/${COMPANY_ID}/coupons`
    }
  ];

  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);
    const result = await testEndpoint(test.path);
    
    if (result.success) {
      console.log(`✅ ${test.name}: ${result.status} - OK`);
    } else {
      console.log(`❌ ${test.name}: ${result.status} - ${result.error || 'Failed'}`);
    }
    
    if (result.data && typeof result.data === 'object') {
      console.log(`   Data: ${JSON.stringify(result.data).substring(0, 100)}...`);
    }
    console.log('');
  }

  console.log('✅ Quick test completed!');
}

runQuickTest().catch(console.error);
