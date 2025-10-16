const fs = require('fs');
const path = require('path');

// Load .env file if it exists
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) return;
    
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      // Only set if not already in environment (env vars take precedence)
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  console.log('✓ Loaded environment variables from .env file');
} else {
  console.log('ℹ No .env file found, using system environment variables');
}

// Read environment variables
const firebaseApiKey = process.env.FIREBASE_API_KEY || '';
const firebaseAuthDomain = process.env.FIREBASE_AUTH_DOMAIN || 'evcharge-68bc8.firebaseapp.com';
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'evcharge-68bc8';
const firebaseStorageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'evcharge-68bc8.firebasestorage.app';
const firebaseMessagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID || '547191660448';
const firebaseAppId = process.env.FIREBASE_APP_ID || '1:547191660448:web:fb16383e8249ddfc360ec5';
const firebaseMeasurementId = process.env.FIREBASE_MEASUREMENT_ID || 'G-Z2M3DF6LCY';
const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY || '';
const apiBaseUrl = process.env.API_BASE_URL || 'https://wattbrews.me/api/v1';
const wsBaseUrl = process.env.WS_BASE_URL || 'wss://wattbrews.me/ws';

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

// Validate required environment variables
if (!firebaseApiKey) {
  console.error('ERROR: FIREBASE_API_KEY environment variable is required!');
  console.error('Please set it in your .env file or environment variables.');
  process.exit(1);
}

if (isProduction && !recaptchaSiteKey) {
  console.warn('WARNING: RECAPTCHA_SITE_KEY is not set. Firebase App Check will not work properly.');
}

// Create environment file content
const envContent = `export const environment = {
    production: ${isProduction},
    apiBaseUrl: '${apiBaseUrl}',
    wsBaseUrl: '${wsBaseUrl}',
    apiTimeout: 30000, // 30 seconds
    apiRetryAttempts: 3,
    firebase: {
      apiKey: "${firebaseApiKey}",
      authDomain: "${firebaseAuthDomain}",
      projectId: "${firebaseProjectId}",
      storageBucket: "${firebaseStorageBucket}",
      messagingSenderId: "${firebaseMessagingSenderId}",
      appId: "${firebaseAppId}",
      measurementId: "${firebaseMeasurementId}"
    },
    recaptchaSiteKey: "${recaptchaSiteKey}",
    defaultLang: 'es',
    supportedLangs: ['es', 'en'],
  };
`;

// Determine target files - update both to ensure consistency
const prodFile = path.join(__dirname, '../src/environments/environment.ts');
const devFile = path.join(__dirname, '../src/environments/environment.development.ts');

// Write the files - update both to ensure they're in sync
try {
  // Always update both files to prevent placeholder issues
  fs.writeFileSync(prodFile, envContent);
  fs.writeFileSync(devFile, envContent);
  
  console.log(`✓ Environment files generated successfully`);
  console.log(`  - environment.ts (production)`);
  console.log(`  - environment.development.ts (development)`);
  console.log(`  - Production mode: ${isProduction}`);
  console.log(`  - Firebase Project: ${firebaseProjectId}`);
  console.log(`  - API URL: ${apiBaseUrl}`);
} catch (error) {
  console.error('ERROR: Failed to write environment files:', error);
  process.exit(1);
}

