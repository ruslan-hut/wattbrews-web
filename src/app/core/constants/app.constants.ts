export const APP_CONSTANTS = {
  APP_NAME: 'WattBrews',
  VERSION: '1.0.0',
  SUPPORTED_LANGUAGES: ['en', 'es'] as string[],
  DEFAULT_LANGUAGE: 'es',
  SUPPORTED_CURRENCIES: ['EUR', 'USD'],
  DEFAULT_CURRENCY: 'EUR',
  API: {
    BASE_URL: 'https://wattbrews.me/api/v1',
    WS_URL: 'wss://wattbrews.me/ws',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
  MAP: {
    DEFAULT_ZOOM: 13,
    DEFAULT_CENTER: {
      lat: 40.4168,
      lng: -3.7038, // Madrid, Spain
    },
    MAX_ZOOM: 18,
    MIN_ZOOM: 5,
  },
  SESSION: {
    REFRESH_INTERVAL: 30000, // 30 seconds
    MAX_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  NOTIFICATIONS: {
    DURATION: 5000, // 5 seconds
    MAX_VISIBLE: 5,
  },
  WEBSOCKET: {
    PING_INTERVAL: 30000, // 30 seconds
    RECONNECT_INITIAL_DELAY: 1000, // 1 second
    RECONNECT_MAX_DELAY: 30000, // 30 seconds
    MESSAGE_HISTORY_LIMIT: 100, // For test page
  },
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 8,
    PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    OPERATOR: 'operator',
  },
  PERMISSIONS: {
    MANAGE_STATIONS: 'manage_stations',
    MANAGE_USERS: 'manage_users',
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_SESSIONS: 'manage_sessions',
  },
} as const;

export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  DASHBOARD: '/dashboard',
  STATIONS: {
    LIST: '/stations',
    DETAIL: '/stations/:id',
    MAP: '/stations/map',
  },
  SESSIONS: {
    ACTIVE: '/sessions/active',
    HISTORY: '/sessions/history',
    DETAIL: '/sessions/:id',
  },
  PROFILE: {
    MAIN: '/profile',
    SETTINGS: '/profile/settings',
    PAYMENT: '/profile/payment',
    NOTIFICATIONS: '/profile/notifications',
  },
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    DELETE_ACCOUNT: '/users/delete-account',
    INFO: '/users/info',
  },
  STATIONS: {
    LIST: '/stations',
    DETAIL: '/stations/:id',
    SEARCH: '/stations/search',
    NEARBY: '/stations/nearby',
    FAVORITES: '/stations/favorites',
    ADD_FAVORITE: '/stations/:id/favorite',
    REMOVE_FAVORITE: '/stations/:id/favorite',
  },
  SESSIONS: {
    LIST: '/sessions',
    DETAIL: '/sessions/:id',
    START: '/sessions/start',
    STOP: '/sessions/:id/stop',
    ACTIVE: '/sessions/active',
    HISTORY: '/sessions/history',
  },
  CHARGE_POINTS: {
    LIST: '/chp',
    DETAIL: '/chp/:id',
    POINT_DETAIL: '/point/:id',
    STATUS: '/chp/:id/status',
    ENABLE: '/chp/:id/enable',
    DISABLE: '/chp/:id/disable',
  },
  PAYMENTS: {
    METHODS: '/payments/methods',
    ADD_METHOD: '/payments/methods',
    DELETE_METHOD: '/payments/methods/:id',
    SET_DEFAULT: '/payments/methods/:id/default',
  },
} as const;
