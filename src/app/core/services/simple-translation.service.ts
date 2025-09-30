import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
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
    this.initializeTranslation();
  }
  
  /**
   * Initialize translation service
   */
  private async initializeTranslation(): Promise<void> {
    // Try to get language from storage or browser
    const savedLanguage = this.getSavedLanguage();
    const browserLanguage = this.getBrowserLanguage();
    const languageToUse = savedLanguage || browserLanguage || 'es';
    
    await this.setLanguage(languageToUse);
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
      
      // Load translations for the language
      await this.loadTranslations(language);
      
      this.currentLang = language;
      this._currentLanguage.set(language);
      this.languageSubject.next(language);
      
      // Save to storage
      this.saveLanguage(language);
      
    } catch (error) {
      console.error('Error setting language:', error);
    } finally {
      this._isLoading.set(false);
    }
  }
  
  /**
   * Load translations for a language
   */
  private async loadTranslations(language: string): Promise<void> {
    try {
      const response = await this.http.get(`./assets/i18n/${language}.json`).toPromise();
      this.translations[language] = response;
    } catch (error) {
      console.error(`Error loading translations for ${language}:`, error);
      // Fallback to empty object
      this.translations[language] = {};
    }
  }
  
  /**
   * Get translation for key
   */
  get(key: string, params?: any): string {
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
    const missingKey = {
      key,
      language: this.currentLang,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    // Store in localStorage for collection
    try {
      const existingMissing = JSON.parse(localStorage.getItem('missingTranslations') || '[]');
      const isAlreadyLogged = existingMissing.some((item: any) => 
        item.key === key && item.language === this.currentLang
      );
      
      if (!isAlreadyLogged) {
        existingMissing.push(missingKey);
        localStorage.setItem('missingTranslations', JSON.stringify(existingMissing));
        console.warn(`🌐 Missing translation: "${key}" in ${this.currentLang}`, missingKey);
      }
    } catch (error) {
      console.error('Error logging missing translation:', error);
    }
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
   * Get all missing translation keys (for debugging)
   */
  getMissingTranslations(): any[] {
    try {
      return JSON.parse(localStorage.getItem('missingTranslations') || '[]');
    } catch (error) {
      console.error('Error getting missing translations:', error);
      return [];
    }
  }
  
  /**
   * Clear missing translations log (for debugging)
   */
  clearMissingTranslations(): void {
    localStorage.removeItem('missingTranslations');
    console.log('🌐 Missing translations log cleared');
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
