#!/usr/bin/env node

/**
 * Translation Integration Script
 * 
 * This script helps integrate AI-generated translations into your Angular app.
 * It can merge translation files, validate JSON syntax, and provide integration guidance.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TRANSLATION_DIR = path.join(__dirname, '..', 'src', 'assets', 'i18n');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'translations');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function createBackup() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `translations-${timestamp}`);
    
    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
    }
    
    // Copy current translation files
    const files = ['en.json', 'es.json'];
    files.forEach(file => {
        const sourcePath = path.join(TRANSLATION_DIR, file);
        const destPath = path.join(backupPath, file);
        
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            log(`✅ Backed up ${file}`, 'green');
        }
    });
    
    return backupPath;
}

function validateJson(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content);
        return { valid: true, error: null };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

function validateTranslations() {
    log('\n🔍 Validating translation files...', 'cyan');
    
    const files = ['en.json', 'es.json'];
    let allValid = true;
    
    files.forEach(file => {
        const filePath = path.join(TRANSLATION_DIR, file);
        
        if (!fs.existsSync(filePath)) {
            log(`❌ File not found: ${file}`, 'red');
            allValid = false;
            return;
        }
        
        const validation = validateJson(filePath);
        if (validation.valid) {
            log(`✅ ${file} is valid JSON`, 'green');
        } else {
            log(`❌ ${file} has JSON errors: ${validation.error}`, 'red');
            allValid = false;
        }
    });
    
    return allValid;
}

function mergeTranslations(originalFile, newTranslations) {
    function deepMerge(target, source) {
        const result = JSON.parse(JSON.stringify(target));
        
        function mergeRecursive(obj, src) {
            for (const key in src) {
                if (src.hasOwnProperty(key)) {
                    if (typeof src[key] === 'object' && src[key] !== null && !Array.isArray(src[key])) {
                        if (!obj[key] || typeof obj[key] !== 'object' || Array.isArray(obj[key])) {
                            obj[key] = {};
                        }
                        mergeRecursive(obj[key], src[key]);
                    } else {
                        obj[key] = src[key];
                    }
                }
            }
        }
        
        mergeRecursive(result, source);
        return result;
    }
    
    return deepMerge(originalFile, newTranslations);
}

function countKeys(obj) {
    let count = 0;
    function countRecursive(obj) {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    countRecursive(obj[key]);
                } else {
                    count++;
                }
            }
        }
    }
    countRecursive(obj);
    return count;
}

function integrateTranslation(language, newTranslationsPath) {
    const originalPath = path.join(TRANSLATION_DIR, `${language}.json`);
    const newTranslationsPathFull = path.resolve(newTranslationsPath);
    
    if (!fs.existsSync(originalPath)) {
        log(`❌ Original translation file not found: ${originalPath}`, 'red');
        return false;
    }
    
    if (!fs.existsSync(newTranslationsPathFull)) {
        log(`❌ New translations file not found: ${newTranslationsPathFull}`, 'red');
        return false;
    }
    
    try {
        // Load files
        const original = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
        const newTranslations = JSON.parse(fs.readFileSync(newTranslationsPathFull, 'utf8'));
        
        // Merge translations
        const merged = mergeTranslations(original, newTranslations);
        
        // Show statistics
        const originalKeys = countKeys(original);
        const newKeys = countKeys(newTranslations);
        const mergedKeys = countKeys(merged);
        const addedKeys = mergedKeys - originalKeys;
        
        log(`\n📊 Integration Statistics for ${language.toUpperCase()}:`, 'cyan');
        log(`   Original keys: ${originalKeys}`, 'blue');
        log(`   New translation keys: ${newKeys}`, 'blue');
        log(`   Total keys after merge: ${mergedKeys}`, 'blue');
        log(`   New keys added: ${addedKeys}`, 'green');
        
        // Write merged file
        fs.writeFileSync(originalPath, JSON.stringify(merged, null, 2));
        log(`✅ Successfully integrated translations for ${language}`, 'green');
        
        return true;
    } catch (error) {
        log(`❌ Error integrating ${language}: ${error.message}`, 'red');
        return false;
    }
}

function showUsage() {
    log('\n📖 Translation Integration Script', 'bright');
    log('Usage:', 'cyan');
    log('  node scripts/integrate-translations.js [command] [options]', 'blue');
    log('\nCommands:', 'cyan');
    log('  validate                    - Validate existing translation files', 'blue');
    log('  backup                      - Create backup of current translations', 'blue');
    log('  integrate <lang> <file>     - Integrate new translations for language', 'blue');
    log('  help                        - Show this help message', 'blue');
    log('\nExamples:', 'cyan');
    log('  node scripts/integrate-translations.js validate', 'blue');
    log('  node scripts/integrate-translations.js backup', 'blue');
    log('  node scripts/integrate-translations.js integrate es ./ai-translations-es.json', 'blue');
    log('  node scripts/integrate-translations.js integrate en ./ai-translations-en.json', 'blue');
}

function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (!command || command === 'help') {
        showUsage();
        return;
    }
    
    switch (command) {
        case 'validate':
            const isValid = validateTranslations();
            if (isValid) {
                log('\n🎉 All translation files are valid!', 'green');
            } else {
                log('\n❌ Some translation files have errors. Please fix them before proceeding.', 'red');
                process.exit(1);
            }
            break;
            
        case 'backup':
            const backupPath = createBackup();
            log(`\n💾 Backup created at: ${backupPath}`, 'green');
            break;
            
        case 'integrate':
            if (args.length < 3) {
                log('❌ Please specify language and file path', 'red');
                log('Usage: node scripts/integrate-translations.js integrate <lang> <file>', 'blue');
                process.exit(1);
            }
            
            const language = args[1];
            const filePath = args[2];
            
            if (!['en', 'es'].includes(language)) {
                log('❌ Language must be "en" or "es"', 'red');
                process.exit(1);
            }
            
            // Create backup first
            createBackup();
            
            // Integrate translations
            const success = integrateTranslation(language, filePath);
            if (success) {
                log(`\n🎉 Successfully integrated ${language} translations!`, 'green');
                log('Next steps:', 'cyan');
                log('1. Test your app: ng serve', 'blue');
                log('2. Check for any missing translations', 'blue');
                log('3. Commit your changes to version control', 'blue');
            } else {
                log(`\n❌ Failed to integrate ${language} translations`, 'red');
                process.exit(1);
            }
            break;
            
        default:
            log(`❌ Unknown command: ${command}`, 'red');
            showUsage();
            process.exit(1);
    }
}

// Run the script
main();

