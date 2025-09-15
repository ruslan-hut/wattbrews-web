export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  
  // User preferences
  LANGUAGE: 'language',
  THEME: 'theme',
  CURRENCY: 'currency',
  
  // App state
  LAST_LOCATION: 'last_location',
  FAVORITE_STATIONS: 'favorite_stations',
  RECENT_SEARCHES: 'recent_searches',
  
  // Settings
  NOTIFICATION_SETTINGS: 'notification_settings',
  MAP_SETTINGS: 'map_settings',
  
  // Cache
  STATIONS_CACHE: 'stations_cache',
  SESSIONS_CACHE: 'sessions_cache',
  USER_PROFILE_CACHE: 'user_profile_cache',
  
  // PWA
  INSTALL_PROMPT_DISMISSED: 'install_prompt_dismissed',
  OFFLINE_DATA: 'offline_data',
} as const;

export const CACHE_DURATION = {
  STATIONS: 5 * 60 * 1000, // 5 minutes
  SESSIONS: 30 * 1000, // 30 seconds
  USER_PROFILE: 10 * 60 * 1000, // 10 minutes
  STATION_DETAILS: 2 * 60 * 1000, // 2 minutes
} as const;

export const STORAGE_TYPES = {
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage',
  INDEXED_DB: 'indexedDB',
} as const;
