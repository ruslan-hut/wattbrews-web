# Translation Debug Guide

This guide explains how to use the translation debug system to collect missing translation keys and add them to your translation files.

## 🌐 Debug Logging System

The application now includes comprehensive debug logging for missing translation keys. When a translation key is not found, it will be automatically logged to the browser's localStorage and console.

### Features

- **Automatic Logging**: Missing translation keys are automatically logged when encountered
- **Duplicate Prevention**: Each missing key is only logged once per language
- **Context Information**: Includes timestamp, URL, and language information
- **Development Tools**: Debug component for viewing and managing missing translations
- **Export Functionality**: Export missing translations as JSON for analysis

## 🚀 How to Use

### 1. Enable Debug Mode

The debug logging is automatically enabled in development mode. The debug component will appear as a floating button in the bottom-right corner of the screen.

### 2. Collect Missing Translations

1. **Navigate through your app** - Visit different pages and interact with components
2. **Check the browser console** - Missing translations will be logged with a 🌐 emoji
3. **Use the debug component** - Click the bug icon to view collected missing translations

### 3. View Missing Translations

#### Option A: Debug Component (Recommended)
1. Click the floating bug icon (🐛) in the bottom-right corner
2. View the list of missing translation keys
3. Use the export button to download a JSON file

#### Option B: Browser Console
```javascript
// Get all missing translations
const missing = JSON.parse(localStorage.getItem('missingTranslations') || '[]');
console.log('Missing translations:', missing);

// Get statistics
const byLanguage = missing.reduce((acc, item) => {
  if (!acc[item.language]) acc[item.language] = [];
  acc[item.language].push(item.key);
  return acc;
}, {});
const uniqueKeys = [...new Set(missing.map(item => item.key))];
console.log('Statistics:', { total: missing.length, unique: uniqueKeys.length, byLanguage });
```

#### Option C: Debug Helper Page
1. Open `http://localhost:4201/tools/translation-debug.html` in your browser
2. The page will automatically load missing translations from localStorage
3. Use the tools to analyze and export data

### 4. Add Missing Translations

#### Step 1: Identify Missing Keys
Use any of the methods above to get a list of missing translation keys.

#### Step 2: Add to Translation Files
Add the missing keys to the appropriate translation files:

**English (`src/assets/i18n/en.json`):**
```json
{
  "dashboard": {
    "welcome": "Welcome to the Dashboard",
    "overview": "Overview"
  },
  "stations": {
    "search": {
      "placeholder": "Search for stations..."
    }
  }
}
```

**Spanish (`src/assets/i18n/es.json`):**
```json
{
  "dashboard": {
    "welcome": "Bienvenido al Panel",
    "overview": "Resumen"
  },
  "stations": {
    "search": {
      "placeholder": "Buscar estaciones..."
    }
  }
}
```

#### Step 3: Clear Debug Log
After adding translations, clear the debug log:

```javascript
// Clear the missing translations log
localStorage.removeItem('missingTranslations');
console.log('Missing translations log cleared');
```

Or use the debug component's "Clear Log" button.

## 🛠️ Debug Component Features

The debug component provides several useful features:

### View Missing Translations
- List all missing translation keys
- Show language, timestamp, and URL context
- Real-time updates as you navigate

### Export Data
- Export missing translations as JSON
- Download for offline analysis
- Timestamped filenames

### Clear Log
- Remove all logged missing translations
- Start fresh after adding translations

### Statistics
- Total missing keys count
- Unique keys count
- Languages affected

## 📊 Translation Template Generator

The debug helper page includes a template generator that creates properly nested JSON structures for missing keys.

### Usage
1. Open `translation-debug.html`
2. Click "Generate Templates"
3. Copy the generated JSON structures
4. Add your translations to the templates
5. Merge with existing translation files

## 🔧 Advanced Usage

### Programmatic Access

```javascript
// Get missing translations
const missing = JSON.parse(localStorage.getItem('missingTranslations') || '[]');

// Filter by language
const spanishMissing = missing.filter(item => item.language === 'es');

// Get unique keys only
const uniqueKeys = [...new Set(missing.map(item => item.key))];

// Group by component/page
const byUrl = missing.reduce((acc, item) => {
  const url = new URL(item.url).pathname;
  if (!acc[url]) acc[url] = [];
  acc[url].push(item.key);
  return acc;
}, {});
```

### Custom Logging

You can also manually log missing translations:

```javascript
// In your component
this.translationService.logMissingTranslation('custom.key');
```

## 🚨 Troubleshooting

### Debug Component Not Showing
- Ensure you're in development mode (`ng serve`)
- Check browser console for errors
- Verify the component is imported in the layout

### Missing Translations Not Logged
- Check browser console for errors
- Verify localStorage is available
- Ensure translation service is being used correctly

### Export Not Working
- Check browser's download permissions
- Ensure there are missing translations to export
- Try using the browser console method instead

## 📝 Best Practices

1. **Regular Collection**: Collect missing translations regularly during development
2. **Organize by Feature**: Group translation keys by feature or component
3. **Use Nested Structure**: Organize keys hierarchically for better maintainability
4. **Clear After Adding**: Clear the debug log after adding translations
5. **Test Both Languages**: Ensure translations work in both English and Spanish

## 🎯 Example Workflow

1. **Start Development**: Begin working on new features
2. **Navigate App**: Go through all pages and components
3. **Check Debug Log**: Review missing translations in debug component
4. **Export Data**: Download missing translations JSON
5. **Add Translations**: Add missing keys to translation files
6. **Test Changes**: Verify translations work correctly
7. **Clear Log**: Clear the debug log
8. **Repeat**: Continue development and repeat as needed

This system will help you maintain complete translation coverage and catch missing keys early in development!
