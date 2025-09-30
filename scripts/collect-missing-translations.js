#!/usr/bin/env node

/**
 * Script to collect and analyze missing translations from localStorage
 * Run this in the browser console or use as a Node.js script
 */

const fs = require('fs');
const path = require('path');

// Function to collect missing translations from localStorage
function collectMissingTranslations() {
  try {
    const missing = JSON.parse(localStorage.getItem('missingTranslations') || '[]');
    console.log(`Found ${missing.length} missing translation keys`);
    
    // Group by language
    const byLanguage = missing.reduce((acc, item) => {
      if (!acc[item.language]) {
        acc[item.language] = [];
      }
      acc[item.language].push(item.key);
      return acc;
    }, {});
    
    console.log('Missing translations by language:', byLanguage);
    
    // Get unique keys
    const uniqueKeys = [...new Set(missing.map(item => item.key))];
    console.log('Unique missing keys:', uniqueKeys);
    
    return { missing, byLanguage, uniqueKeys };
  } catch (error) {
    console.error('Error collecting missing translations:', error);
    return null;
  }
}

// Function to generate translation template
function generateTranslationTemplate(missingKeys, language = 'en') {
  const template = {};
  
  missingKeys.forEach(key => {
    // Create nested structure from dot notation
    const parts = key.split('.');
    let current = template;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    // Set the final value
    const lastPart = parts[parts.length - 1];
    current[lastPart] = key; // Use key as placeholder
  });
  
  return template;
}

// Function to update translation files
function updateTranslationFiles(missingKeys, language = 'en') {
  const translationFile = path.join(__dirname, '..', 'src', 'assets', 'i18n', `${language}.json`);
  
  try {
    // Read existing translations
    let existing = {};
    if (fs.existsSync(translationFile)) {
      existing = JSON.parse(fs.readFileSync(translationFile, 'utf8'));
    }
    
    // Generate template for missing keys
    const template = generateTranslationTemplate(missingKeys, language);
    
    // Merge with existing translations
    const merged = mergeDeep(existing, template);
    
    // Write back to file
    fs.writeFileSync(translationFile, JSON.stringify(merged, null, 2));
    console.log(`Updated ${translationFile} with missing translations`);
    
    return merged;
  } catch (error) {
    console.error(`Error updating translation file for ${language}:`, error);
    return null;
  }
}

// Deep merge function
function mergeDeep(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// Main function
function main() {
  console.log('🌐 Translation Collection Script');
  console.log('================================');
  
  // This would be run in browser context
  if (typeof window !== 'undefined' && window.localStorage) {
    const data = collectMissingTranslations();
    if (data) {
      console.log('\n📊 Analysis Results:');
      console.log(`Total missing keys: ${data.missing.length}`);
      console.log(`Unique keys: ${data.uniqueKeys.length}`);
      
      console.log('\n🔍 Missing keys by language:');
      Object.entries(data.byLanguage).forEach(([lang, keys]) => {
        console.log(`  ${lang}: ${keys.length} keys`);
        console.log(`    ${keys.join(', ')}`);
      });
      
      console.log('\n📝 To add these translations:');
      console.log('1. Copy the missing keys above');
      console.log('2. Add them to the appropriate translation files');
      console.log('3. Clear the missing translations log');
    }
  } else {
    console.log('This script should be run in the browser console');
    console.log('Copy and paste the following code into your browser console:');
    console.log(`
      // Collect missing translations
      const missing = JSON.parse(localStorage.getItem('missingTranslations') || '[]');
      console.log('Missing translations:', missing);
      
      // Group by language
      const byLanguage = missing.reduce((acc, item) => {
        if (!acc[item.language]) acc[item.language] = [];
        acc[item.language].push(item.key);
        return acc;
      }, {});
      
      console.log('By language:', byLanguage);
      
      // Get unique keys
      const uniqueKeys = [...new Set(missing.map(item => item.key))];
      console.log('Unique keys:', uniqueKeys);
    `);
  }
}

// Export functions for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    collectMissingTranslations,
    generateTranslationTemplate,
    updateTranslationFiles,
    mergeDeep
  };
} else {
  main();
}


