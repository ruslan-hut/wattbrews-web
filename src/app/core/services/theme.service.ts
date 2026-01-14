import { Injectable, signal, effect, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from './storage.service';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageService = inject(StorageService);

  // Signals for reactive state
  private readonly _themeMode = signal<ThemeMode>('system');
  private readonly _systemPrefersDark = signal<boolean>(false);

  // Public readonly signals
  readonly themeMode = this._themeMode.asReadonly();
  readonly systemPrefersDark = this._systemPrefersDark.asReadonly();

  // Computed effective theme (resolves 'system' to actual light/dark)
  readonly effectiveTheme = computed(() => {
    const mode = this._themeMode();
    if (mode === 'system') {
      return this._systemPrefersDark() ? 'dark' : 'light';
    }
    return mode;
  });

  readonly isDarkMode = computed(() => this.effectiveTheme() === 'dark');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();
      this.setupMediaQueryListener();

      // Effect to apply theme changes to DOM
      effect(() => {
        this.applyTheme(this.effectiveTheme());
      });
    }
  }

  private initializeTheme(): void {
    // Load saved preference from localStorage
    const savedTheme = this.storageService.getTheme() as ThemeMode | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      this._themeMode.set(savedTheme);
    }

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this._systemPrefersDark.set(prefersDark);
  }

  private setupMediaQueryListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      this._systemPrefersDark.set(e.matches);
    });
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Update color-scheme for native elements (scrollbars, form controls, etc.)
    root.style.colorScheme = theme;

    // Update meta theme-color for mobile browsers
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute(
      'content',
      theme === 'dark' ? '#18181b' : '#8b5cf6'
    );
  }

  /**
   * Set theme mode (light, dark, or system)
   */
  setTheme(mode: ThemeMode): void {
    this._themeMode.set(mode);
    this.storageService.setTheme(mode);
  }

  /**
   * Toggle between light and dark modes
   * (ignores system preference when toggling)
   */
  toggleTheme(): void {
    const current = this.effectiveTheme();
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  }

  /**
   * Cycle through all theme modes: light -> dark -> system -> light
   */
  cycleTheme(): void {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(this._themeMode());
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setTheme(modes[nextIndex]);
  }

  /**
   * Get icon name for current theme mode
   */
  getThemeIcon(): string {
    const mode = this._themeMode();
    switch (mode) {
      case 'light':
        return 'light_mode';
      case 'dark':
        return 'dark_mode';
      case 'system':
        return 'settings_brightness';
    }
  }

  /**
   * Get display label for current theme mode
   */
  getThemeLabel(): string {
    const mode = this._themeMode();
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  }
}
