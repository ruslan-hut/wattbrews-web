import { HttpErrorResponse } from '@angular/common/http';

/**
 * Error type classification for consistent error handling
 */
export enum ErrorType {
  /** Form/input validation errors */
  VALIDATION = 'validation',
  /** Authentication failures (login required) */
  AUTHENTICATION = 'authentication',
  /** Authorization failures (permission denied) */
  AUTHORIZATION = 'authorization',
  /** Network/connection errors */
  NETWORK = 'network',
  /** Server-side errors (5xx) */
  SERVER = 'server',
  /** Resource not found (404) */
  NOT_FOUND = 'not_found',
  /** Request timeout */
  TIMEOUT = 'timeout',
  /** Unclassified errors */
  UNKNOWN = 'unknown'
}

/**
 * Standardized error interface for the application.
 * All errors should be converted to this format for consistent handling.
 */
export interface AppError {
  /** Error classification */
  type: ErrorType;
  /** Technical error code (e.g., 'auth/user-not-found', 'HTTP_401') */
  code: string;
  /** Technical error message (for logging) */
  message: string;
  /** User-friendly message (for display) */
  userMessage: string;
  /** HTTP status code (if applicable) */
  status?: number;
  /** Field name (for validation errors) */
  field?: string;
  /** Additional error details */
  details?: unknown;
  /** When the error occurred */
  timestamp: Date;
  /** Whether the operation can be retried */
  retryable: boolean;
}

/**
 * HTTP status code to user-friendly message mapping
 */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Authentication required. Please log in and try again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  408: 'Request timed out. Please try again.',
  409: 'This action conflicts with existing data.',
  422: 'The provided data is invalid.',
  429: 'Too many requests. Please wait and try again.',
  500: 'A server error occurred. Please try again later.',
  502: 'Server is temporarily unavailable. Please try again later.',
  503: 'Service is currently unavailable. Please try again later.',
  504: 'Request timed out. Please try again.'
};

/**
 * Firebase error code to user-friendly message mapping
 */
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak. Please use a stronger password.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/expired-action-code': 'This link has expired. Please request a new one.',
  'auth/invalid-action-code': 'Invalid verification link.',
  'auth/requires-recent-login': 'Please log in again to complete this action.'
};

/**
 * Factory class for creating standardized AppError objects
 */
export class AppErrorFactory {
  /**
   * Create an AppError from an HttpErrorResponse
   */
  static fromHttpError(error: HttpErrorResponse): AppError {
    const status = error.status;
    const type = this.getErrorTypeFromStatus(status);
    const code = `HTTP_${status}`;

    // Try to extract message from response body
    let message = error.message;
    if (error.error) {
      if (typeof error.error === 'string') {
        message = error.error;
      } else if (error.error.message) {
        message = error.error.message;
      } else if (error.error.error) {
        message = error.error.error;
      }
    }

    const userMessage = HTTP_ERROR_MESSAGES[status]
      || 'An unexpected error occurred. Please try again.';

    return {
      type,
      code,
      message,
      userMessage,
      status,
      details: error.error,
      timestamp: new Date(),
      retryable: this.isRetryable(status)
    };
  }

  /**
   * Create an AppError from a Firebase error
   */
  static fromFirebaseError(error: any): AppError {
    const code = error.code || 'unknown';
    const message = error.message || 'Firebase error occurred';

    const userMessage = FIREBASE_ERROR_MESSAGES[code]
      || 'An authentication error occurred. Please try again.';

    const type = code.startsWith('auth/')
      ? ErrorType.AUTHENTICATION
      : ErrorType.UNKNOWN;

    return {
      type,
      code,
      message,
      userMessage,
      details: error,
      timestamp: new Date(),
      retryable: code === 'auth/network-request-failed' || code === 'auth/too-many-requests'
    };
  }

  /**
   * Create a validation error
   */
  static validation(field: string, message: string): AppError {
    return {
      type: ErrorType.VALIDATION,
      code: 'VALIDATION_ERROR',
      message: `Validation failed for field: ${field}`,
      userMessage: message,
      field,
      timestamp: new Date(),
      retryable: false
    };
  }

  /**
   * Create a network error
   */
  static network(message?: string): AppError {
    return {
      type: ErrorType.NETWORK,
      code: 'NETWORK_ERROR',
      message: message || 'Network connection failed',
      userMessage: 'Unable to connect. Please check your internet connection.',
      timestamp: new Date(),
      retryable: true
    };
  }

  /**
   * Create an error from an unknown source
   */
  static fromUnknown(error: unknown): AppError {
    if (error instanceof HttpErrorResponse) {
      return this.fromHttpError(error);
    }

    if (error instanceof Error) {
      // Check if it's a Firebase error (has code property)
      if ('code' in error && typeof (error as any).code === 'string') {
        return this.fromFirebaseError(error);
      }

      return {
        type: ErrorType.UNKNOWN,
        code: 'UNKNOWN_ERROR',
        message: error.message,
        userMessage: 'An unexpected error occurred. Please try again.',
        details: error,
        timestamp: new Date(),
        retryable: false
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      code: 'UNKNOWN_ERROR',
      message: String(error),
      userMessage: 'An unexpected error occurred. Please try again.',
      details: error,
      timestamp: new Date(),
      retryable: false
    };
  }

  /**
   * Map HTTP status to ErrorType
   */
  private static getErrorTypeFromStatus(status: number): ErrorType {
    if (status === 0) return ErrorType.NETWORK;
    if (status === 401) return ErrorType.AUTHENTICATION;
    if (status === 403) return ErrorType.AUTHORIZATION;
    if (status === 404) return ErrorType.NOT_FOUND;
    if (status === 408 || status === 504) return ErrorType.TIMEOUT;
    if (status >= 400 && status < 500) return ErrorType.VALIDATION;
    if (status >= 500) return ErrorType.SERVER;
    return ErrorType.UNKNOWN;
  }

  /**
   * Determine if an error is retryable based on status
   */
  private static isRetryable(status: number): boolean {
    // Network errors, timeouts, and server errors are typically retryable
    return status === 0 || status === 408 || status === 429 ||
           status === 500 || status === 502 || status === 503 || status === 504;
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'code' in error &&
    'message' in error &&
    'userMessage' in error &&
    'timestamp' in error &&
    'retryable' in error
  );
}
