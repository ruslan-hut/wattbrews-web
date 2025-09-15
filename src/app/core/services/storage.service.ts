import { Injectable, signal } from '@angular/core';
import { STORAGE_KEYS, CACHE_DURATION, STORAGE_TYPES } from '../constants/storage.constants';

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  // Signal for storage state
  private readonly _cache = signal<Map<string, CacheItem>>(new Map());
  readonly cache = this._cache.asReadonly();

  /**
   * Set item in localStorage
   */
  setLocalItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Error setting localStorage item:', error);
    }
  }

  /**
   * Get item from localStorage
   */
  getLocalItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting localStorage item:', error);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   */
  removeLocalItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing localStorage item:', error);
    }
  }

  /**
   * Set item in sessionStorage
   */
  setSessionItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Error setting sessionStorage item:', error);
    }
  }

  /**
   * Get item from sessionStorage
   */
  getSessionItem<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting sessionStorage item:', error);
      return null;
    }
  }

  /**
   * Remove item from sessionStorage
   */
  removeSessionItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing sessionStorage item:', error);
    }
  }

  /**
   * Set cached item with expiration
   */
  setCacheItem<T>(key: string, data: T, duration?: number): void {
    const now = Date.now();
    const expiresAt = now + (duration || CACHE_DURATION.STATIONS);
    
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt
    };

    this._cache.update(cache => {
      const newCache = new Map(cache);
      newCache.set(key, cacheItem);
      return newCache;
    });
  }

  /**
   * Get cached item if not expired
   */
  getCacheItem<T>(key: string): T | null {
    const cache = this._cache();
    const item = cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (now > item.expiresAt) {
      // Item expired, remove it
      this.removeCacheItem(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Remove cached item
   */
  removeCacheItem(key: string): void {
    this._cache.update(cache => {
      const newCache = new Map(cache);
      newCache.delete(key);
      return newCache;
    });
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this._cache.set(new Map());
  }

  /**
   * Clear expired cache items
   */
  clearExpiredCache(): void {
    const now = Date.now();
    this._cache.update(cache => {
      const newCache = new Map();
      cache.forEach((item, key) => {
        if (now <= item.expiresAt) {
          newCache.set(key, item);
        }
      });
      return newCache;
    });
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this._cache().size;
  }

  /**
   * Check if cache item exists and is valid
   */
  hasValidCacheItem(key: string): boolean {
    const item = this._cache().get(key);
    if (!item) return false;
    
    const now = Date.now();
    return now <= item.expiresAt;
  }

  /**
   * Set user preferences
   */
  setUserPreferences(preferences: any): void {
    this.setLocalItem(STORAGE_KEYS.USER_DATA, preferences);
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): any {
    return this.getLocalItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Set language preference
   */
  setLanguage(language: string): void {
    this.setLocalItem(STORAGE_KEYS.LANGUAGE, language);
  }

  /**
   * Get language preference
   */
  getLanguage(): string | null {
    return this.getLocalItem(STORAGE_KEYS.LANGUAGE);
  }

  /**
   * Set theme preference
   */
  setTheme(theme: string): void {
    this.setLocalItem(STORAGE_KEYS.THEME, theme);
  }

  /**
   * Get theme preference
   */
  getTheme(): string | null {
    return this.getLocalItem(STORAGE_KEYS.THEME);
  }

  /**
   * Set favorite stations
   */
  setFavoriteStations(stationIds: string[]): void {
    this.setLocalItem(STORAGE_KEYS.FAVORITE_STATIONS, stationIds);
  }

  /**
   * Get favorite stations
   */
  getFavoriteStations(): string[] {
    return this.getLocalItem(STORAGE_KEYS.FAVORITE_STATIONS) || [];
  }

  /**
   * Add station to favorites
   */
  addFavoriteStation(stationId: string): void {
    const favorites = this.getFavoriteStations();
    if (!favorites.includes(stationId)) {
      this.setFavoriteStations([...favorites, stationId]);
    }
  }

  /**
   * Remove station from favorites
   */
  removeFavoriteStation(stationId: string): void {
    const favorites = this.getFavoriteStations();
    this.setFavoriteStations(favorites.filter(id => id !== stationId));
  }

  /**
   * Check if station is favorite
   */
  isFavoriteStation(stationId: string): boolean {
    const favorites = this.getFavoriteStations();
    return favorites.includes(stationId);
  }

  /**
   * Set recent searches
   */
  setRecentSearches(searches: string[]): void {
    this.setLocalItem(STORAGE_KEYS.RECENT_SEARCHES, searches);
  }

  /**
   * Get recent searches
   */
  getRecentSearches(): string[] {
    return this.getLocalItem(STORAGE_KEYS.RECENT_SEARCHES) || [];
  }

  /**
   * Add search to recent searches
   */
  addRecentSearch(search: string): void {
    const recent = this.getRecentSearches();
    const filtered = recent.filter(s => s !== search);
    const updated = [search, ...filtered].slice(0, 10); // Keep only last 10
    this.setRecentSearches(updated);
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches(): void {
    this.removeLocalItem(STORAGE_KEYS.RECENT_SEARCHES);
  }

  /**
   * Set last location
   */
  setLastLocation(location: { lat: number; lng: number }): void {
    this.setLocalItem(STORAGE_KEYS.LAST_LOCATION, location);
  }

  /**
   * Get last location
   */
  getLastLocation(): { lat: number; lng: number } | null {
    return this.getLocalItem(STORAGE_KEYS.LAST_LOCATION);
  }

  /**
   * Set notification settings
   */
  setNotificationSettings(settings: any): void {
    this.setLocalItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, settings);
  }

  /**
   * Get notification settings
   */
  getNotificationSettings(): any {
    return this.getLocalItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
  }

  /**
   * Set map settings
   */
  setMapSettings(settings: any): void {
    this.setLocalItem(STORAGE_KEYS.MAP_SETTINGS, settings);
  }

  /**
   * Get map settings
   */
  getMapSettings(): any {
    return this.getLocalItem(STORAGE_KEYS.MAP_SETTINGS);
  }

  /**
   * Clear all storage
   */
  clearAllStorage(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
      this.clearCache();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): {
    localStorage: number;
    sessionStorage: number;
    cache: number;
  } {
    let localStorageSize = 0;
    let sessionStorageSize = 0;

    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageSize += localStorage[key].length;
        }
      }
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
    }

    try {
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          sessionStorageSize += sessionStorage[key].length;
        }
      }
    } catch (error) {
      console.error('Error calculating sessionStorage size:', error);
    }

    return {
      localStorage: localStorageSize,
      sessionStorage: sessionStorageSize,
      cache: this.getCacheSize()
    };
  }
}
