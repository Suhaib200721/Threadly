// backend/testAuth.js
// Quick test script to verify the auth API works.
// Usage: node testAuth.js
// Make sure the backend is running first: node server.js

const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => (responseData += chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(responseData) });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => (responseData += chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(responseData) });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('=== THREADLY Auth API Tests ===\n');

  // 1. Register a new user
  console.log('1. Register new user...');
  const reg = await post('/api/auth/register', {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'password123',
  });
  console.log(`   Status: ${reg.status}`);
  console.log(`   Response:`, reg.body);
  const token = reg.body.token;
  console.log('');

  // 2. Duplicate email
  console.log('2. Register duplicate email (should fail)...');
  const dup = await post('/api/auth/register', {
    name: 'Another User',
    email: 'testuser@example.com',
    password: 'password123',
  });
  console.log(`   Status: ${dup.status} (expected 400)`);
  console.log(`   Message: ${dup.body.message}`);
  console.log('');

  // 3. Login with correct credentials
  console.log('3. Login with correct credentials...');
  const login = await post('/api/auth/login', {
    email: 'testuser@example.com',
    password: 'password123',
  });
  console.log(`   Status: ${login.status} (expected 200)`);
  console.log(`   User role: ${login.body.user?.role}`);
  console.log(`   Token received: ${!!login.body.token}`);
  console.log('');

  // 4. Login with wrong password
  console.log('4. Login with wrong password (should fail)...');
  const wrongPw = await post('/api/auth/login', {
    email: 'testuser@example.com',
    password: 'wrongpassword',
  });
  console.log(`   Status: ${wrongPw.status} (expected 401)`);
  console.log(`   Message: ${wrongPw.body.message}`);
  console.log('');

  // 5. Get /me with valid token
  console.log('5. GET /api/auth/me with valid token...');
  const me = await get('/api/auth/me', token);
  console.log(`   Status: ${me.status} (expected 200)`);
  console.log(`   User:`, me.body.user);
  console.log('');

  // 6. Get /me without token
  console.log('6. GET /api/auth/me without token (should fail)...');
  const noToken = await get('/api/auth/me', null);
  console.log(`   Status: ${noToken.status} (expected 401)`);
  console.log(`   Message: ${noToken.body.message}`);
  console.log('');

  // 7. Get /me with invalid token
  console.log('7. GET /api/auth/me with invalid token (should fail)...');
  const badToken = await get('/api/auth/me', 'invalid.token.here');
  console.log(`   Status: ${badToken.status} (expected 401)`);
  console.log(`   Message: ${badToken.body.message}`);
  console.log('');

  console.log('=== Tests complete ===');
}

runTests().catch(console.error);
