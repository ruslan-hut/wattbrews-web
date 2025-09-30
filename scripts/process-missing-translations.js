#!/usr/bin/env node

/**
 * Script to process exported missing translations JSON
 * Usage: node scripts/process-missing-translations.js missing-translations-2024-09-30.json
 */

const fs = require('fs');
const path = require('path');

// Function to create nested object from dot notation keys
function createNestedStructure(keys) {
  const result = {};
  
  keys.forEach(key => {
    const parts = key.split('.');
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    const lastPart = parts[parts.length - 1];
    current[lastPart] = key; // Use key as placeholder
  });
  
  return result;
}

// Function to merge with existing translations
function mergeTranslations(existing, newKeys, language) {
  const template = createNestedStructure(newKeys);
  
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
  
  return mergeDeep(existing, template);
}

// Function to generate translation suggestions
function generateSuggestions(keys, language) {
  const suggestions = {};
  
  keys.forEach(key => {
    const parts = key.split('.');
    let current = suggestions;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    const lastPart = parts[parts.length - 1];
    current[lastPart] = generateTranslationSuggestion(key, language);
  });
  
  return suggestions;
}

// Function to generate translation suggestions based on key patterns
function generateTranslationSuggestion(key, language) {
  const keyLower = key.toLowerCase();
  const lastPart = key.split('.').pop().toLowerCase();
  
  // Common patterns and their translations
  const patterns = {
    en: {
      'welcome': 'Welcome',
      'title': 'Title',
      'description': 'Description',
      'placeholder': 'Enter text...',
      'button': 'Button',
      'save': 'Save',
      'cancel': 'Cancel',
      'delete': 'Delete',
      'edit': 'Edit',
      'add': 'Add',
      'remove': 'Remove',
      'search': 'Search',
      'filter': 'Filter',
      'sort': 'Sort',
      'loading': 'Loading...',
      'error': 'Error',
      'success': 'Success',
      'warning': 'Warning',
      'info': 'Information',
      'confirm': 'Confirm',
      'close': 'Close',
      'open': 'Open',
      'view': 'View',
      'details': 'Details',
      'settings': 'Settings',
      'profile': 'Profile',
      'dashboard': 'Dashboard',
      'home': 'Home',
      'about': 'About',
      'contact': 'Contact',
      'help': 'Help',
      'support': 'Support',
      'privacy': 'Privacy',
      'terms': 'Terms',
      'login': 'Login',
      'logout': 'Logout',
      'register': 'Register',
      'signin': 'Sign In',
      'signout': 'Sign Out',
      'signup': 'Sign Up',
      'email': 'Email',
      'password': 'Password',
      'username': 'Username',
      'name': 'Name',
      'address': 'Address',
      'phone': 'Phone',
      'date': 'Date',
      'time': 'Time',
      'status': 'Status',
      'active': 'Active',
      'inactive': 'Inactive',
      'enabled': 'Enabled',
      'disabled': 'Disabled',
      'public': 'Public',
      'private': 'Private',
      'draft': 'Draft',
      'published': 'Published',
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'failed': 'Failed',
      'successful': 'Successful'
    },
    es: {
      'welcome': 'Bienvenido',
      'title': 'Título',
      'description': 'Descripción',
      'placeholder': 'Ingrese texto...',
      'button': 'Botón',
      'save': 'Guardar',
      'cancel': 'Cancelar',
      'delete': 'Eliminar',
      'edit': 'Editar',
      'add': 'Agregar',
      'remove': 'Quitar',
      'search': 'Buscar',
      'filter': 'Filtrar',
      'sort': 'Ordenar',
      'loading': 'Cargando...',
      'error': 'Error',
      'success': 'Éxito',
      'warning': 'Advertencia',
      'info': 'Información',
      'confirm': 'Confirmar',
      'close': 'Cerrar',
      'open': 'Abrir',
      'view': 'Ver',
      'details': 'Detalles',
      'settings': 'Configuración',
      'profile': 'Perfil',
      'dashboard': 'Panel',
      'home': 'Inicio',
      'about': 'Acerca de',
      'contact': 'Contacto',
      'help': 'Ayuda',
      'support': 'Soporte',
      'privacy': 'Privacidad',
      'terms': 'Términos',
      'login': 'Iniciar Sesión',
      'logout': 'Cerrar Sesión',
      'register': 'Registrarse',
      'signin': 'Entrar',
      'signout': 'Salir',
      'signup': 'Registrarse',
      'email': 'Correo',
      'password': 'Contraseña',
      'username': 'Usuario',
      'name': 'Nombre',
      'address': 'Dirección',
      'phone': 'Teléfono',
      'date': 'Fecha',
      'time': 'Hora',
      'status': 'Estado',
      'active': 'Activo',
      'inactive': 'Inactivo',
      'enabled': 'Habilitado',
      'disabled': 'Deshabilitado',
      'public': 'Público',
      'private': 'Privado',
      'draft': 'Borrador',
      'published': 'Publicado',
      'pending': 'Pendiente',
      'approved': 'Aprobado',
      'rejected': 'Rechazado',
      'completed': 'Completado',
      'cancelled': 'Cancelado',
      'failed': 'Fallido',
      'successful': 'Exitoso'
    }
  };
  
  // Try to find a pattern match
  for (const [pattern, translation] of Object.entries(patterns[language] || patterns.en)) {
    if (lastPart.includes(pattern)) {
      return translation;
    }
  }
  
  // Fallback: return the key as placeholder
  return key;
}

// Main processing function
function processMissingTranslations(filePath) {
  try {
    // Read the exported JSON file
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log('🌐 Processing Missing Translations');
    console.log('================================');
    console.log(`Total missing translations: ${data.length}`);
    
    // Group by language
    const byLanguage = data.reduce((acc, item) => {
      if (!acc[item.language]) {
        acc[item.language] = [];
      }
      acc[item.language].push(item.key);
      return acc;
    }, {});
    
    console.log('\n📊 Missing translations by language:');
    Object.entries(byLanguage).forEach(([lang, keys]) => {
      console.log(`  ${lang}: ${keys.length} keys`);
    });
    
    // Get unique keys
    const uniqueKeys = [...new Set(data.map(item => item.key))];
    console.log(`\n🔑 Unique missing keys: ${uniqueKeys.length}`);
    
    // Generate templates for each language
    Object.entries(byLanguage).forEach(([language, keys]) => {
      console.log(`\n📝 Generating template for ${language}:`);
      
      // Create nested structure
      const template = createNestedStructure(keys);
      const templateFile = `translation-template-${language}.json`;
      fs.writeFileSync(templateFile, JSON.stringify(template, null, 2));
      console.log(`  ✅ Template saved to: ${templateFile}`);
      
      // Generate suggestions
      const suggestions = generateSuggestions(keys, language);
      const suggestionsFile = `translation-suggestions-${language}.json`;
      fs.writeFileSync(suggestionsFile, JSON.stringify(suggestions, null, 2));
      console.log(`  💡 Suggestions saved to: ${suggestionsFile}`);
      
      // Try to update existing translation files
      const translationFile = path.join(__dirname, '..', 'src', 'assets', 'i18n', `${language}.json`);
      if (fs.existsSync(translationFile)) {
        try {
          const existing = JSON.parse(fs.readFileSync(translationFile, 'utf8'));
          const merged = mergeTranslations(existing, keys, language);
          
          // Create backup
          const backupFile = `${translationFile}.backup.${Date.now()}`;
          fs.writeFileSync(backupFile, JSON.stringify(existing, null, 2));
          console.log(`  💾 Backup created: ${backupFile}`);
          
          // Update the file
          fs.writeFileSync(translationFile, JSON.stringify(merged, null, 2));
          console.log(`  ✅ Updated: ${translationFile}`);
        } catch (error) {
          console.log(`  ⚠️  Could not update ${translationFile}: ${error.message}`);
        }
      } else {
        console.log(`  ⚠️  Translation file not found: ${translationFile}`);
      }
    });
    
    // Generate analysis report
    const report = {
      timestamp: new Date().toISOString(),
      totalMissing: data.length,
      uniqueKeys: uniqueKeys.length,
      byLanguage: byLanguage,
      keys: uniqueKeys,
      urls: [...new Set(data.map(item => item.url))],
      timeRange: {
        earliest: Math.min(...data.map(item => new Date(item.timestamp).getTime())),
        latest: Math.max(...data.map(item => new Date(item.timestamp).getTime()))
      }
    };
    
    const reportFile = `translation-analysis-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📊 Analysis report saved to: ${reportFile}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Review the generated templates and suggestions');
    console.log('2. Update the translation files with proper translations');
    console.log('3. Test the translations in your application');
    console.log('4. Clear the missing translations log');
    
  } catch (error) {
    console.error('Error processing missing translations:', error);
    process.exit(1);
  }
}

// Command line usage
if (require.main === module) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.log('Usage: node scripts/process-missing-translations.js <missing-translations-file.json>');
    console.log('Example: node scripts/process-missing-translations.js missing-translations-2024-09-30.json');
    process.exit(1);
  }
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  processMissingTranslations(filePath);
}

module.exports = {
  processMissingTranslations,
  createNestedStructure,
  generateSuggestions,
  mergeTranslations
};


