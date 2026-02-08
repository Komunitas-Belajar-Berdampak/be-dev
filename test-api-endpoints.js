/**
 * Test actual API endpoints performance
 * Make sure your server is running first: npm run dev
 * Then run: node test-api-endpoints.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// You'll need to add your auth token here
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Get this from login

async function testEndpoints() {
  console.log('='.repeat(80));
  console.log('TESTING ACTUAL API ENDPOINTS'.padStart(52));
  console.log('='.repeat(80));
  console.log();

  const config = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };

  const tests = [
    {
      name: 'List Users',
      url: `${API_BASE}/users`,
      method: 'GET'
    },
    {
      name: 'List Users with Filters (status)',
      url: `${API_BASE}/users?status=aktif`,
      method: 'GET'
    },
    {
      name: 'List Courses',
      url: `${API_BASE}/courses`,
      method: 'GET'
    },
    {
      name: 'List Courses with Filters',
      url: `${API_BASE}/courses?status=aktif`,
      method: 'GET'
    },
    {
      name: 'List Assignments',
      url: `${API_BASE}/courses/COURSE_ID/assignments`,
      method: 'GET',
      skip: true // Need actual course ID
    }
  ];

  console.log('📊 Testing API Response Times...\n');

  for (const test of tests) {
    if (test.skip) {
      console.log(`⏭️  ${test.name}: Skipped (needs real ID)`);
      continue;
    }

    try {
      const start = Date.now();
      const response = await axios({
        method: test.method,
        url: test.url,
        headers: config.headers,
        timeout: 10000
      });
      const duration = Date.now() - start;

      const status = duration < 100 ? '⚡ EXCELLENT' :
                     duration < 300 ? '✓ GOOD' :
                     duration < 1000 ? '⚠️ OK' : '❌ SLOW';

      console.log(`${status} | ${test.name}`);
      console.log(`   Time: ${duration}ms`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data count: ${response.data.data?.length || 'N/A'}`);
      console.log();

    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`🔒 ${test.name}: UNAUTHORIZED`);
        console.log(`   ⚠️  Please update AUTH_TOKEN in the script`);
        console.log(`   To get token: Login via Postman/API and copy the token\n`);
        break;
      } else if (error.response?.status === 403) {
        console.log(`🔒 ${test.name}: FORBIDDEN (need admin role)\n`);
      } else {
        console.log(`❌ ${test.name}: ${error.message}\n`);
      }
    }
  }

  console.log('='.repeat(80));
  console.log('💡 TIP: Update AUTH_TOKEN variable in script to test authenticated endpoints');
  console.log('='.repeat(80));
}

testEndpoints();
