import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SimpleTranslationService {
  private readonly http = inject(HttpClient);
  private translations: { [key: string]: any } = {};
  private currentLang = 'es';
  
  // Signals for reactive state management
  private readonly _currentLanguage = signal<string>(this.currentLang);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _availableLanguages = signal<string[]>(['en', 'es']);
  
  // Public readonly signals
  readonly currentLanguage = this._currentLanguage.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly availableLanguages = this._availableLanguages.asReadonly();
  
  // BehaviorSubjects for compatibility
  private languageSubject = new BehaviorSubject<string>(this.currentLang);
  public language$ = this.languageSubject.asObservable();
  
  constructor() {
    // Initialize with async JSON file loading
    this.initializeTranslation();
  }
  

  /**
   * Initialize translation service
   */
  private initializeTranslation(): void {
    // Try to get language from storage or browser
    const savedLanguage = this.getSavedLanguage();
    const browserLanguage = this.getBrowserLanguage();
    const languageToUse = savedLanguage || browserLanguage || 'es';
    
    // Load translations from JSON files
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
      }).catch((fallbackError) => {
        console.error('Failed to load fallback translations:', fallbackError);
      });
    });
  }

  /**
   * Initialize translations asynchronously - call this after user authentication
   */
  async initializeTranslationsAsync(): Promise<void> {
    const savedLanguage = this.getSavedLanguage();
    const browserLanguage = this.getBrowserLanguage();
    const languageToUse = savedLanguage || browserLanguage || 'es';
    
    try {
      await this.loadTranslations(languageToUse);
      this.currentLang = languageToUse;
      this._currentLanguage.set(languageToUse);
      this.languageSubject.next(languageToUse);
      
      // Verify translations are loaded
      if (!this.areTranslationsLoaded(languageToUse)) {
        throw new Error(`Translations not properly loaded for ${languageToUse}`);
      }
    } catch (error) {
      console.error('Failed to load initial translations:', error);
      // Fallback to default language
      try {
        await this.loadTranslations('es');
        this.currentLang = 'es';
        this._currentLanguage.set('es');
        this.languageSubject.next('es');
        
        // Verify fallback translations are loaded
        if (!this.areTranslationsLoaded('es')) {
          throw new Error('Fallback translations not properly loaded');
        }
      } catch (fallbackError) {
        console.error('Failed to load fallback translations:', fallbackError);
        throw fallbackError;
      }
    }
  }
  
  /**
   * Check if translations are loaded for a specific language
   */
  areTranslationsLoaded(language?: string): boolean {
    const lang = language || this.currentLang;
    return !!this.translations[lang] && Object.keys(this.translations[lang]).length > 0;
  }
  
  
  /**
   * Set current language
   */
  async setLanguage(language: string): Promise<void> {
    if (!this._availableLanguages().includes(language)) {
      console.warn(`Language ${language} is not supported`);
      return;
    }
    
    try {
      this._isLoading.set(true);
      
      // Load translations from JSON files
      await this.loadTranslations(language);
      
      this.currentLang = language;
      this._currentLanguage.set(language);
      this.languageSubject.next(language);
      
      // Save to storage
      this.saveLanguage(language);
      
    } catch (error) {
      console.error('Error setting language:', error);
      throw error; // Re-throw to let the caller handle the error
    } finally {
      this._isLoading.set(false);
    }
  }
  
  /**
   * Load translations for a language
   */
  private async loadTranslations(language: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get(`/assets/i18n/${language}.json`).pipe(
          catchError(error => {
            console.error(`Error loading translations for ${language}:`, error);
            throw error; // Re-throw to trigger fallback
          })
        )
      );
      this.translations[language] = response;
    } catch (error) {
      console.error(`Error loading translations for ${language}:`, error);
      throw error; // Re-throw to trigger fallback
    }
  }
  
  /**
   * Get translation for key
   */
  get(key: string, params?: any): string {
    // Check if translations are loaded
    if (!this.areTranslationsLoaded(this.currentLang)) {
      console.warn(`Translations not loaded for ${this.currentLang}, returning key: ${key}`);
      return key;
    }
    
    const translation = this.getNestedTranslation(this.translations[this.currentLang], key);
    if (!translation) {
      // Debug logging for missing translations
      this.logMissingTranslation(key);
      return key;
    }
    
    // Simple parameter replacement
    if (params && typeof translation === 'string') {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }
    
    return translation;
  }

  /**
   * Get reactive translation for key (triggers change detection)
   */
  getReactive(key: string, params?: any): string {
    // Access the current language signal to make this reactive
    const currentLang = this._currentLanguage();
    
    // Check if translations are loaded
    if (!this.areTranslationsLoaded(currentLang)) {
      console.warn(`Translations not loaded for ${currentLang}, returning key: ${key}`);
      return key;
    }
    
    // Handle nested keys like 'app.title' -> translations.app.title
    const translation = this.getNestedTranslation(this.translations[currentLang], key);
    
    if (!translation) {
      // Debug logging for missing translations
      this.logMissingTranslation(key);
      return key;
    }
    
    // Simple parameter replacement
    if (params && typeof translation === 'string') {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }
    
    return translation;
  }

  /**
   * Get nested translation value from object using dot notation
   */
  private getNestedTranslation(obj: any, key: string): string | undefined {
    if (!obj || !key) return undefined;
    
    const keys = key.split('.');
    let current = obj;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined;
      }
    }
    
    return typeof current === 'string' ? current : undefined;
  }
  
  /**
   * Log missing translation key for debugging
   */
  private logMissingTranslation(key: string): void {
    console.warn(`🌐 Missing translation: "${key}" in ${this.currentLang}`);
  }

  /**
   * Scan for all translation keys used in the application
   */
  scanForTranslationKeys(): string[] {
    const keys = new Set<string>();
    
    // Scan DOM for translation service calls
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      // Look for text content that might contain translation keys
      const textContent = element.textContent || '';
      
      // Look for patterns like translationService.get('key') or translationService.getReactive('key')
      const translationPattern = /translationService\.(get|getReactive)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
      let match;
      while ((match = translationPattern.exec(textContent)) !== null) {
        keys.add(match[2]);
      }
    });
    
    // Also scan the HTML source for translation patterns
    const htmlContent = document.documentElement.outerHTML;
    const htmlPattern = /translationService\.(get|getReactive)\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    let htmlMatch;
    while ((htmlMatch = htmlPattern.exec(htmlContent)) !== null) {
      keys.add(htmlMatch[2]);
    }
    
    return Array.from(keys);
  }

  /**
   * Check for missing translations by comparing used keys with available translations
   */
  checkForMissingTranslations(): any[] {
    const usedKeys = this.scanForTranslationKeys();
    const currentLang = this._currentLanguage();
    const availableTranslations = this.translations[currentLang] || {};
    const missing: any[] = [];
    
    usedKeys.forEach(key => {
      const translation = this.getNestedTranslation(availableTranslations, key);
      if (!translation) {
        missing.push({
          key,
          language: currentLang,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          type: 'missing'
        });
      }
    });
    
    return missing;
  }
  
  /**
   * Get translation as observable
   */
  get$(key: string, params?: any): Observable<string> {
    return this.language$.pipe(
      map(() => this.get(key, params))
    );
  }
  
  /**
   * Get current language from browser
   */
  private getBrowserLanguage(): string | null {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (!browserLang) return null;
    
    // Extract language code (e.g., 'en-US' -> 'en')
    const languageCode = browserLang.split('-')[0];
    
    return this._availableLanguages().includes(languageCode) ? languageCode : null;
  }
  
  /**
   * Get saved language from storage
   */
  private getSavedLanguage(): string | null {
    try {
      return localStorage.getItem('language');
    } catch (error) {
      console.error('Error getting saved language:', error);
      return null;
    }
  }
  
  /**
   * Save language to storage
   */
  private saveLanguage(language: string): void {
    try {
      localStorage.setItem('language', language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }
  
  /**
   * Get language display name
   */
  getLanguageDisplayName(languageCode: string): string {
    const languageNames: { [key: string]: string } = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ar': 'العربية',
      'he': 'עברית',
      'fa': 'فارسی',
      'ur': 'اردو'
    };
    
    return languageNames[languageCode] || languageCode.toUpperCase();
  }
  
  /**
   * Get current language display name
   */
  getCurrentLanguageDisplayName(): string {
    return this.getLanguageDisplayName(this._currentLanguage());
  }
  
  /**
   * Get available languages with display names
   */
  getAvailableLanguagesWithNames(): Array<{ code: string; name: string }> {
    return this._availableLanguages().map(code => ({
      code,
      name: this.getLanguageDisplayName(code)
    }));
  }
}
