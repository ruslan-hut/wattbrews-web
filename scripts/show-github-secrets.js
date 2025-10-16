#!/usr/bin/env node

/**
 * GitHub Secrets Helper Script
 * 
 * This script reads your local .env file and displays the values
 * that need to be added as GitHub Secrets and Variables.
 * 
 * Usage:
 *   node scripts/show-github-secrets.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║  GitHub Actions Configuration Helper                               ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// Load .env file
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: .env file not found!');
  console.error('   Please create a .env file first: cp env.example .env\n');
  process.exit(1);
}

// Parse .env file
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

console.log('📋 Copy these values to your GitHub repository:\n');
console.log('   Go to: Settings → Secrets and variables → Actions\n');

// Secrets
console.log('═══════════════════════════════════════════════════════════════════');
console.log('SECRETS (Settings → Secrets and variables → Actions → Secrets tab)');
console.log('═══════════════════════════════════════════════════════════════════\n');

const secrets = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
  'RECAPTCHA_SITE_KEY'
];

let hasWarnings = false;

secrets.forEach(key => {
  const value = envVars[key] || '';
  const isPlaceholder = value.includes('your-') || value.includes('-here') || value === '';
  const required = key === 'FIREBASE_API_KEY' || key === 'RECAPTCHA_SITE_KEY';
  
  if (isPlaceholder && required) {
    console.log(`⚠️  ${key}`);
    console.log(`    Value: [NOT SET - REQUIRED]`);
    console.log();
    hasWarnings = true;
  } else if (isPlaceholder) {
    console.log(`⚠️  ${key}`);
    console.log(`    Value: [NOT SET - using placeholder]`);
    console.log();
    hasWarnings = true;
  } else {
    // Mask the value for security (show first 10 chars)
    const maskedValue = value.length > 10 ? value.substring(0, 10) + '...' : value;
    console.log(`✅ ${key}`);
    console.log(`    Value: ${value}`);
    console.log(`    Preview: ${maskedValue}`);
    console.log();
  }
});

// Variables
console.log('═══════════════════════════════════════════════════════════════════');
console.log('VARIABLES (Settings → Secrets and variables → Actions → Variables tab)');
console.log('═══════════════════════════════════════════════════════════════════\n');

const variables = [
  { key: 'API_BASE_URL', default: 'https://wattbrews.me/api/v1' },
  { key: 'WS_BASE_URL', default: 'wss://wattbrews.me/ws' },
  { key: 'DEPLOY_PATH', default: '/var/www/html/app.wattbrews.me' }
];

variables.forEach(({ key, default: defaultValue }) => {
  const value = envVars[key] || defaultValue;
  console.log(`📌 ${key}`);
  console.log(`    Value: ${value}`);
  console.log();
});

// Server deployment secrets
console.log('═══════════════════════════════════════════════════════════════════');
console.log('SERVER DEPLOYMENT SECRETS (if not already configured)');
console.log('═══════════════════════════════════════════════════════════════════\n');

console.log('These need to be configured separately (not in .env file):\n');
console.log('📌 SSH_PRIVATE_KEY');
console.log('    Value: [Your SSH private key for server access]');
console.log('    See: DEPLOYMENT.md for instructions\n');

console.log('📌 SSH_USER');
console.log('    Value: [Your server username, e.g., deploy, ubuntu, root]\n');

console.log('📌 SSH_HOST');
console.log('    Value: [Your server IP or domain, e.g., 123.456.789.0]\n');

// Summary
console.log('═══════════════════════════════════════════════════════════════════\n');

if (hasWarnings) {
  console.log('⚠️  WARNING: Some required values are not set or are placeholders.');
  console.log('    Please update your .env file with real values before deploying.\n');
  console.log('📚 For more details, see: DEPLOYMENT.md\n');
} else {
  console.log('✅ All environment variables are configured!\n');
  console.log('📝 Next steps:');
  console.log('   1. Copy the values above to your GitHub repository');
  console.log('   2. Configure server deployment secrets (SSH_PRIVATE_KEY, etc.)');
  console.log('   3. Push your code to trigger deployment\n');
  console.log('📚 For detailed instructions, see: DEPLOYMENT.md\n');
}

