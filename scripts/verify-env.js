#!/usr/bin/env node

/**
 * Environment Setup Verification Script
 * 
 * Checks if local development environment is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying environment setup...\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: .env file exists
console.log('1️⃣  Checking for .env file...');
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.log('   ❌ FAIL: .env file not found');
  console.log('   → Solution: cp env.example .env');
  console.log('   → Then edit .env and add your Firebase API key\n');
  hasErrors = true;
} else {
  console.log('   ✅ PASS: .env file exists\n');
  
  // Check 2: .env has Firebase API key
  console.log('2️⃣  Checking Firebase API key in .env...');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const apiKeyMatch = envContent.match(/FIREBASE_API_KEY=(.+)/);
  
  if (!apiKeyMatch || !apiKeyMatch[1] || apiKeyMatch[1].trim() === '' || apiKeyMatch[1].includes('your-firebase-api-key-here')) {
    console.log('   ❌ FAIL: FIREBASE_API_KEY not set or is placeholder');
    console.log('   → Solution: Edit .env and set FIREBASE_API_KEY to your real Firebase API key');
    console.log('   → Get it from: https://console.firebase.google.com/\n');
    hasErrors = true;
  } else {
    const keyPreview = apiKeyMatch[1].substring(0, 10) + '...';
    console.log(`   ✅ PASS: FIREBASE_API_KEY is set (${keyPreview})\n`);
  }
}

// Check 3: Environment files exist
console.log('3️⃣  Checking generated environment files...');
const envFiles = [
  'src/environments/environment.ts',
  'src/environments/environment.development.ts'
];

let allFilesExist = true;
envFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️  MISSING: ${file}`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('   ⚠️  WARN: Some environment files are missing');
  console.log('   → Solution: npm run config:dev\n');
  hasWarnings = true;
} else {
  console.log('   ✅ PASS: Environment files exist\n');
  
  // Check 4: Environment files don't have placeholders
  console.log('4️⃣  Checking for placeholder values...');
  let hasPlaceholders = false;
  
  envFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (content.includes('PLACEHOLDER_WILL_BE_REPLACED_BY_BUILD_SCRIPT')) {
      console.log(`   ❌ FAIL: ${file} contains PLACEHOLDER`);
      hasPlaceholders = true;
    }
  });
  
  if (hasPlaceholders) {
    console.log('   → Solution: npm run config:dev\n');
    hasErrors = true;
  } else {
    console.log('   ✅ PASS: No placeholders found\n');
  }
}

// Check 5: .gitignore is protecting sensitive files
console.log('5️⃣  Checking .gitignore protection...');
const gitignorePath = path.join(__dirname, '../.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  const protectedFiles = ['.env', 'environment.ts', 'environment.development.ts'];
  const missing = [];
  
  protectedFiles.forEach(file => {
    if (!gitignoreContent.includes(file)) {
      missing.push(file);
    }
  });
  
  if (missing.length > 0) {
    console.log(`   ⚠️  WARN: Some files not in .gitignore: ${missing.join(', ')}`);
    console.log('   → This could lead to accidentally committing secrets!\n');
    hasWarnings = true;
  } else {
    console.log('   ✅ PASS: All sensitive files are gitignored\n');
  }
}

// Check 6: Git status - are we about to commit secrets?
console.log('6️⃣  Checking git status...');
try {
  const { execSync } = require('child_process');
  const gitStatus = execSync('git status --short', { encoding: 'utf-8' });
  
  const dangerousFiles = gitStatus.split('\n').filter(line => {
    return line.includes('.env') && !line.includes('.env.example') && !line.includes('.gitignore') ||
           line.includes('environment.ts') && !line.includes('.template');
  });
  
  if (dangerousFiles.length > 0) {
    console.log('   ⚠️  WARN: Dangerous files in git status:');
    dangerousFiles.forEach(file => console.log(`       ${file}`));
    console.log('   → These files should NOT be committed!');
    console.log('   → Run: git reset HEAD <file> to unstage\n');
    hasWarnings = true;
  } else {
    console.log('   ✅ PASS: No sensitive files staged for commit\n');
  }
} catch (error) {
  console.log('   ℹ️  INFO: Could not check git status (not a git repo or git not available)\n');
}

// Summary
console.log('═══════════════════════════════════════════════════════\n');

if (hasErrors) {
  console.log('❌ SETUP INCOMPLETE - Please fix the errors above\n');
  console.log('Quick fix:');
  console.log('  1. cp env.example .env');
  console.log('  2. Edit .env and add your Firebase API key');
  console.log('  3. npm run config:dev');
  console.log('  4. npm start\n');
  console.log('For detailed instructions, see: SETUP_LOCAL_DEV.md\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  SETUP COMPLETE WITH WARNINGS\n');
  console.log('Your environment should work, but please review the warnings above.\n');
  process.exit(0);
} else {
  console.log('✅ ALL CHECKS PASSED!\n');
  console.log('Your environment is properly configured.');
  console.log('You can now run: npm start\n');
  process.exit(0);
}

