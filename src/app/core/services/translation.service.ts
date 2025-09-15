import { Injectable, signal, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { APP_CONSTANTS } from '../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly translate = inject(TranslateService);

  // Signals for reactive state management
  private readonly _currentLanguage = signal<string>(APP_CONSTANTS.DEFAULT_LANGUAGE);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _availableLanguages = signal<string[]>(APP_CONSTANTS.SUPPORTED_LANGUAGES);

  // Public readonly signals
  readonly currentLanguage = this._currentLanguage.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly availableLanguages = this._availableLanguages.asReadonly();

  // Computed signals
  readonly isRTL = computed(() => this.isRightToLeft(this._currentLanguage()));

  // BehaviorSubjects for compatibility
  private languageSubject = new BehaviorSubject<string>(APP_CONSTANTS.DEFAULT_LANGUAGE);
  public language$ = this.languageSubject.asObservable();

  constructor() {
    this.initializeTranslation();
  }

  /**
   * Initialize translation service
   */
  private initializeTranslation(): void {
    this.translate.addLangs(APP_CONSTANTS.SUPPORTED_LANGUAGES);
    this.translate.setDefaultLang(APP_CONSTANTS.DEFAULT_LANGUAGE);
    
    // Try to get language from storage or browser
    const savedLanguage = this.getSavedLanguage();
    const browserLanguage = this.getBrowserLanguage();
    const languageToUse = savedLanguage || browserLanguage || APP_CONSTANTS.DEFAULT_LANGUAGE;
    
    this.setLanguage(languageToUse);
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
      await this.translate.use(language).toPromise();
      this._currentLanguage.set(language);
      this.languageSubject.next(language);
      
      // Save to storage
      this.saveLanguage(language);
      
      // Update document direction
      this.updateDocumentDirection(language);
      
    } catch (error) {
      console.error('Error setting language:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Get translation for key
   */
  get(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }

  /**
   * Get translation as observable
   */
  get$(key: string, params?: any): Observable<string> {
    return this.translate.get(key, params);
  }

  /**
   * Get translation stream for multiple keys
   */
  getMultiple$(keys: string[]): Observable<{ [key: string]: string }> {
    return this.translate.get(keys);
  }

  /**
   * Check if key exists
   */
  hasKey(key: string): boolean {
    return this.translate.instant(key) !== key;
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
   * Check if language is right-to-left
   */
  private isRightToLeft(language: string): boolean {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(language);
  }

  /**
   * Update document direction
   */
  private updateDocumentDirection(language: string): void {
    const isRTL = this.isRightToLeft(language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
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

  /**
   * Reload translations
   */
  async reloadTranslations(): Promise<void> {
    try {
      this._isLoading.set(true);
      await this.translate.reloadLang(this._currentLanguage()).toPromise();
    } catch (error) {
      console.error('Error reloading translations:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Get translation with fallback
   */
  getWithFallback(key: string, fallback: string, params?: any): string {
    const translation = this.get(key, params);
    return translation !== key ? translation : fallback;
  }

  /**
   * Get plural translation
   */
  getPlural(key: string, count: number, params?: any): string {
    return this.translate.instant(key, { ...params, count });
  }

  /**
   * Get translation with interpolation
   */
  interpolate(key: string, params: { [key: string]: any }): string {
    return this.translate.instant(key, params);
  }

  /**
   * Check if translations are loaded
   */
  isTranslationsLoaded(): boolean {
    return this.translate.currentLang === this._currentLanguage();
  }

  /**
   * Get translation loading state
   */
  getTranslationLoadingState(): Observable<boolean> {
    return this.translate.onLangChange.pipe(
      map(() => false),
      startWith(true)
    );
  }

  /**
   * Set language without persistence
   */
  setLanguageTemporary(language: string): void {
    if (this._availableLanguages().includes(language)) {
      this._currentLanguage.set(language);
      this.languageSubject.next(language);
      this.updateDocumentDirection(language);
    }
  }

  /**
   * Reset to default language
   */
  async resetToDefault(): Promise<void> {
    await this.setLanguage(APP_CONSTANTS.DEFAULT_LANGUAGE);
  }
}
