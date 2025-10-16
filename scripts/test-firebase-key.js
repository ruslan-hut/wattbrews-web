const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const apiKey = process.env.FIREBASE_API_KEY;
const projectId = process.env.FIREBASE_PROJECT_ID || 'evcharge-68bc8';

console.log('🔍 Testing Firebase API Key...');
console.log('API Key:', apiKey ? apiKey.substring(0, 20) + '...' : 'NOT FOUND');
console.log('Project:', projectId);
console.log('');

if (!apiKey) {
  console.error('❌ ERROR: FIREBASE_API_KEY not found in .env file');
  process.exit(1);
}

// Test the API key with a simple Firebase request
const testUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;

const postData = JSON.stringify({
  idToken: 'test-invalid-token'
});

const options = {
  hostname: 'identitytoolkit.googleapis.com',
  port: 443,
  path: `/v1/accounts:lookup?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('');
    
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 400 && response.error) {
        if (response.error.message.includes('API key not valid')) {
          console.log('❌ API KEY IS INVALID');
          console.log('');
          console.log('Possible reasons:');
          console.log('1. Identity Toolkit API is not enabled in Google Cloud Console');
          console.log('2. API key has restrictions blocking this request');
          console.log('3. Wrong API key (should be Web API Key from Firebase)');
          console.log('4. Key was just created and needs 2-5 min to propagate');
          console.log('');
          console.log('To fix:');
          console.log('• Go to https://console.cloud.google.com/');
          console.log('• Navigate to APIs & Services → Library');
          console.log('• Search for "Identity Toolkit API"');
          console.log('• Click ENABLE');
        } else if (response.error.message.includes('INVALID_ID_TOKEN')) {
          console.log('✅ API KEY IS VALID!');
          console.log('');
          console.log('The key works correctly. The error is expected because we sent');
          console.log('a test token. Your Firebase app should work now.');
        } else {
          console.log('⚠️  Unexpected error:', response.error.message);
        }
      } else if (res.statusCode === 403) {
        console.log('❌ API KEY HAS RESTRICTIONS');
        console.log('');
        console.log('The API key has HTTP referrer restrictions that are blocking this test.');
        console.log('For local development, make sure to add:');
        console.log('  http://localhost:4200/*');
        console.log('  http://localhost:*/*');
      } else {
        console.log('Response:', response);
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();

