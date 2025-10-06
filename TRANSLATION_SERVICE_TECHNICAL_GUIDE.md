# Translation Service Technical Guide

## Overview

The WattBrews application uses a custom `SimpleTranslationService` for internationalization (i18n) support. This service provides reactive translations with async loading mechanisms to ensure translations are properly loaded before being displayed.

## ⚠️ Important: Async Initialization Required

**All components using translations MUST implement async initialization** to prevent showing raw translation keys to users. This is a critical requirement for proper user experience.

### Required Implementation Pattern

Every component using translations must follow this exact pattern:

```typescript
export class YourComponent implements OnInit {
  protected readonly translationService = inject(SimpleTranslationService);
  protected readonly translationsLoading = signal(true);

  ngOnInit(): void {
    this.initializeTranslations();
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
      this.translationsLoading.set(false);
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
    }
  }
}
```

```html
<!-- Translation Loading State -->
<div class="loading-container" *ngIf="translationsLoading()">
  <mat-spinner diameter="40"></mat-spinner>
  <p>Loading translations...</p>
</div>

<!-- Content (only show when translations are loaded) -->
<div *ngIf="!translationsLoading()">
  <!-- All translation content goes here -->
</div>
```

## Architecture

### Service Location
- **File**: `src/app/core/services/simple-translation.service.ts`
- **Type**: Injectable service provided at root level
- **Dependencies**: Angular HttpClient, Angular Signals

### Translation Files
- **Location**: `public/assets/i18n/`
- **Supported Languages**: English (`en.json`), Spanish (`es.json`)
- **Format**: JSON with nested object structure

### App Configuration
- **File**: `src/app/app.config.ts`
- **Provider**: `SimpleTranslationService` is automatically provided at root level
- **Note**: ngx-translate has been removed; only `SimpleTranslationService` is used

## Core Features

### 1. Async Initialization
The service loads translations asynchronously from JSON files with proper loading states:

```typescript
constructor() {
  this.initializeTranslation();
}

private initializeTranslation(): void {
  const languageToUse = this.getSavedLanguage() || this.getBrowserLanguage() || 'es';
  this.loadTranslations(languageToUse).then(() => {
    this.currentLang = languageToUse;
    this._currentLanguage.set(languageToUse);
    this.languageSubject.next(languageToUse);
  }).catch((error) => {
    console.error('Failed to load initial translations:', error);
    // Fallback to default language
    this.loadTranslations('es').then(() => {
      this.currentLang = 'es';
      this._currentLanguage.set('es');
      this.languageSubject.next('es');
    });
  });
}
```

### 2. Component-Level Async Initialization
Components must initialize translations asynchronously in their `ngOnInit()` method:

```typescript
export class YourComponent implements OnInit {
  protected readonly translationService = inject(SimpleTranslationService);
  protected readonly translationsLoading = signal(true);

  ngOnInit(): void {
    this.initializeTranslations();
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
      this.translationsLoading.set(false);
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
    }
  }
}
```

### 3. Loading State Management
Components must handle translation loading states in templates:

```html
<!-- Translation Loading State -->
<div class="loading-container" *ngIf="translationsLoading()">
  <mat-spinner diameter="40"></mat-spinner>
  <p>Loading translations...</p>
</div>

<!-- Content (only show when translations are loaded) -->
<div *ngIf="!translationsLoading()">
  <h1>{{ translationService.getReactive('page.title') }}</h1>
  <!-- Rest of content -->
</div>
```

### 4. Reactive Translation Methods

#### `getReactive(key: string, params?: any): string`
- **Purpose**: Get translation with reactive change detection
- **Usage**: Use in component templates for reactive updates
- **Returns**: Translated string or key if translation not found

#### `get(key: string, params?: any): string`
- **Purpose**: Get translation without reactive updates
- **Usage**: Use in component logic when reactivity not needed
- **Returns**: Translated string or key if translation not found

#### `initializeTranslationsAsync(): Promise<void>`
- **Purpose**: Initialize translations asynchronously at component level
- **Usage**: Call in component `ngOnInit()` before using translations
- **Returns**: Promise that resolves when translations are loaded

## Integration Guide

### 1. Service Injection and Async Initialization

```typescript
import { Component, OnInit, signal, inject } from '@angular/core';
import { SimpleTranslationService } from '../../../core/services/simple-translation.service';

@Component({...})
export class YourComponent implements OnInit {
  protected readonly translationService = inject(SimpleTranslationService);
  protected readonly translationsLoading = signal(true);

  ngOnInit(): void {
    this.initializeTranslations();
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
      this.translationsLoading.set(false);
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
    }
  }
}
```

### 2. Template Usage with Loading States

#### Basic Translation with Loading State
```html
<!-- Translation Loading State -->
<div class="loading-container" *ngIf="translationsLoading()">
  <mat-spinner diameter="40"></mat-spinner>
  <p>Loading translations...</p>
</div>

<!-- Content (only show when translations are loaded) -->
<div *ngIf="!translationsLoading()">
  <h1>{{ translationService.getReactive('pages.sessions.history.title') }}</h1>
</div>
```

#### Translation with Parameters
```html
<div *ngIf="!translationsLoading()">
  <p>{{ translationService.getReactive('welcome.message', { name: userName }) }}</p>
</div>
```

#### Conditional Translation
```html
<div *ngIf="!translationsLoading()">
  <span *ngIf="isLoading">
    {{ translationService.getReactive('common.loading') }}
  </span>
</div>
```

### 3. Component Logic Usage

```typescript
export class YourComponent implements OnInit {
  protected readonly translationService = inject(SimpleTranslationService);
  protected readonly translationsLoading = signal(true);
  
  ngOnInit(): void {
    this.initializeTranslations();
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
      this.translationsLoading.set(false);
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
    }
  }
  
  getErrorMessage(): string {
    return this.translationService.get('errors.validation.required');
  }
  
  onLanguageChange(newLang: string): void {
    this.translationService.setLanguage(newLang);
  }
}
```

### 4. Language Switching

```typescript
async switchLanguage(languageCode: string): Promise<void> {
  try {
    await this.translationService.setLanguage(languageCode);
  } catch (error) {
    console.error('Error switching language:', error);
  }
}
```

## Translation Key Structure

### Naming Convention
Use dot notation for nested keys: `category.section.item`

### Example Structure
```json
{
  "app": {
    "title": "WattBrews"
  },
  "pages": {
    "sessions": {
      "history": {
        "title": "Session History",
        "subtitle": "View and manage your charging session history",
        "auth": {
          "checking": "Checking Authentication...",
          "required": "Authentication Required"
        }
      }
    }
  },
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel"
    }
  }
}
```

## Adding New Translations

### 1. Update Translation Files

#### English (`public/assets/i18n/en.json`)
```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature",
    "buttons": {
      "activate": "Activate",
      "deactivate": "Deactivate"
    }
  }
}
```

#### Spanish (`public/assets/i18n/es.json`)
```json
{
  "newFeature": {
    "title": "Nueva Característica",
    "description": "Esta es una nueva característica",
    "buttons": {
      "activate": "Activar",
      "deactivate": "Desactivar"
    }
  }
}
```

### 2. Update Translation Files
Ensure both language files are updated with the same keys:

#### English (`public/assets/i18n/en.json`)
```json
{
  "app": {
    "title": "WattBrews"
  },
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature",
    "buttons": {
      "activate": "Activate",
      "deactivate": "Deactivate"
    }
  }
}
```

#### Spanish (`public/assets/i18n/es.json`)
```json
{
  "app": {
    "title": "WattBrews"
  },
  "newFeature": {
    "title": "Nueva Característica",
    "description": "Esta es una nueva característica",
    "buttons": {
      "activate": "Activar",
      "deactivate": "Desactivar"
    }
  }
}
```

### 3. Use in Components
```html
<!-- Translation Loading State -->
<div class="loading-container" *ngIf="translationsLoading()">
  <mat-spinner diameter="40"></mat-spinner>
  <p>Loading translations...</p>
</div>

<!-- Content (only show when translations are loaded) -->
<div *ngIf="!translationsLoading()">
  <h2>{{ translationService.getReactive('newFeature.title') }}</h2>
  <p>{{ translationService.getReactive('newFeature.description') }}</p>
  <button>{{ translationService.getReactive('newFeature.buttons.activate') }}</button>
</div>
```

## Error Handling

### Missing Translation Detection
The service automatically logs missing translations to the browser console and localStorage:

```typescript
private logMissingTranslation(key: string): void {
  const missingKey = {
    key,
    language: this.currentLang,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
  
  // Store in localStorage for collection
  const existingMissing = JSON.parse(localStorage.getItem('missingTranslations') || '[]');
  if (!existingMissing.some((item: any) => item.key === key && item.language === this.currentLang)) {
    existingMissing.push(missingKey);
    localStorage.setItem('missingTranslations', JSON.stringify(existingMissing));
    console.warn(`🌐 Missing translation: "${key}" in ${this.currentLang}`, missingKey);
  }
}
```

### Debugging Missing Translations
```typescript
// Get all missing translations
const missing = this.translationService.getMissingTranslations();
console.log('Missing translations:', missing);

// Clear missing translations log
this.translationService.clearMissingTranslations();
```

## Performance Considerations

### 1. Reactive vs Non-Reactive
- Use `getReactive()` only when you need change detection updates
- Use `get()` for static translations that don't change during component lifecycle

### 2. Translation Loading
- Translations are loaded asynchronously from JSON files at component initialization
- Components must handle loading states to prevent showing raw translation keys
- Language switching triggers reactive updates across all components
- Failed translations gracefully degrade with fallback behavior

### 3. Memory Usage
- Translations are cached in memory after loading
- No cleanup needed as translations persist for the application lifetime

## Testing

### Unit Testing
```typescript
describe('TranslationService', () => {
  let service: SimpleTranslationService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimpleTranslationService);
  });
  
  it('should return translation for valid key', () => {
    expect(service.get('app.title')).toBe('WattBrews');
  });
  
  it('should return key for missing translation', () => {
    expect(service.get('nonexistent.key')).toBe('nonexistent.key');
  });
});
```

### Integration Testing
```typescript
it('should update translations when language changes', async () => {
  await service.setLanguage('es');
  expect(service.get('app.title')).toBe('WattBrews'); // Same in both languages
  
  await service.setLanguage('en');
  expect(service.get('app.title')).toBe('WattBrews');
});
```

## Best Practices

### 1. Key Naming
- Use descriptive, hierarchical keys
- Follow consistent naming patterns
- Group related translations under common prefixes

### 2. Component Integration
- Always inject the service as `protected readonly`
- Implement `OnInit` interface and call `initializeTranslations()` in `ngOnInit()`
- Add `translationsLoading` signal for loading state management
- Use `getReactive()` in templates for reactive updates
- Use `get()` in component logic when reactivity not needed
- Always wrap template content with `*ngIf="!translationsLoading()"` to prevent showing raw keys

### 3. Translation Management
- Keep translation files in sync between languages
- Update JSON files in `public/assets/i18n/` directory
- Test all language combinations

### 4. Error Handling
- Always provide fallback text for critical translations
- Monitor missing translation logs in development
- Implement graceful degradation for missing translations

## Troubleshooting

### Common Issues

#### 1. Keys Showing Instead of Translations
- **Cause**: Component not properly initializing translations or missing loading state handling
- **Solution**: Ensure component implements `OnInit`, calls `initializeTranslations()`, and wraps content with `*ngIf="!translationsLoading()"`

#### 2. Translations Not Updating on Language Change
- **Cause**: Using `get()` instead of `getReactive()`
- **Solution**: Use `getReactive()` for reactive translations

#### 3. Missing Translations
- **Cause**: Translation key not found in current language JSON file
- **Solution**: Add missing translation to both language files in `public/assets/i18n/`

#### 4. Translation Loading Failures
- **Cause**: Translation files not accessible or network issues
- **Solution**: Service includes error handling with graceful degradation; check console for errors

### Debug Commands
```typescript
// Check current language
console.log('Current language:', this.translationService.currentLanguage());

// Check available languages
console.log('Available languages:', this.translationService.availableLanguages());

// Check missing translations
console.log('Missing translations:', this.translationService.getMissingTranslations());

// Scan for used translation keys
console.log('Used keys:', this.translationService.scanForTranslationKeys());
```

## Future Enhancements

### Planned Features
1. **Dynamic Translation Loading**: Load translations on-demand for better performance
2. **Translation Validation**: Validate translation completeness across languages
3. **Translation Editor**: Built-in tool for managing translations
4. **Pluralization Support**: Handle singular/plural forms automatically
5. **Date/Number Formatting**: Locale-specific formatting for dates and numbers

### Migration Path
When upgrading the translation service:
1. Update service injection imports
2. Replace old translation method calls
3. Update translation key structure if needed
4. Test all language combinations
5. Update documentation

---

## Quick Reference

### Service Methods
- `get(key, params?)` - Get translation without reactivity
- `getReactive(key, params?)` - Get translation with reactivity
- `initializeTranslationsAsync()` - Initialize translations asynchronously at component level
- `setLanguage(lang)` - Change current language
- `currentLanguage()` - Get current language signal
- `getMissingTranslations()` - Get missing translation log

### Template Usage
```html
<!-- Translation Loading State -->
<div class="loading-container" *ngIf="translationsLoading()">
  <mat-spinner diameter="40"></mat-spinner>
  <p>Loading translations...</p>
</div>

<!-- Content (only show when translations are loaded) -->
<div *ngIf="!translationsLoading()">
  <!-- Basic translation -->
  {{ translationService.getReactive('key') }}

  <!-- Translation with parameters -->
  {{ translationService.getReactive('key', { param: value }) }}

  <!-- Conditional translation -->
  <span *ngIf="condition">{{ translationService.getReactive('key') }}</span>
</div>
```

### Component Integration
```typescript
// Service injection and initialization
export class YourComponent implements OnInit {
  protected readonly translationService = inject(SimpleTranslationService);
  protected readonly translationsLoading = signal(true);

  ngOnInit(): void {
    this.initializeTranslations();
  }

  private async initializeTranslations(): Promise<void> {
    try {
      this.translationsLoading.set(true);
      await this.translationService.initializeTranslationsAsync();
      this.translationsLoading.set(false);
    } catch (error) {
      console.error('Failed to initialize translations:', error);
      this.translationsLoading.set(false);
    }
  }

  // Get translation in logic
  const text = this.translationService.get('key');

  // Language switching
  await this.translationService.setLanguage('es');
}
```

This guide serves as the definitive reference for working with the translation service in the WattBrews application.
