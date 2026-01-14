import { Injectable, inject, signal } from '@angular/core';
import { Observable, MonoTypeOperatorFunction, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { AppError, AppErrorFactory, ErrorType, isAppError } from '../models/error.model';

/**
 * Options for error handling
 */
export interface HandleErrorOptions {
  /** Don't show notification to user */
  silent?: boolean;
  /** Custom user message to show instead of default */
  customMessage?: string;
  /** Context for logging (e.g., 'loadChargePoints') */
  context?: string;
  /** Whether to rethrow the error after handling */
  rethrow?: boolean;
}

/**
 * Centralized error handling service.
 * Provides consistent error processing, logging, and user notifications.
 *
 * Usage in services:
 * ```typescript
 * loadData(): Observable<Data> {
 *   return this.apiService.get<Data>(endpoint).pipe(
 *     this.errorHandlingService.handleError({ context: 'loadData' })
 *   );
 * }
 * ```
 *
 * Usage in components:
 * ```typescript
 * this.errorHandlingService.handle(error, { silent: false });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  private readonly notificationService = inject(NotificationService);

  /** Last error that occurred */
  private readonly _lastError = signal<AppError | null>(null);

  /** Read-only signal of the last error */
  readonly lastError = this._lastError.asReadonly();

  /**
   * Handle an error with optional notification.
   * Normalizes any error type to AppError.
   *
   * @param error - The error to handle
   * @param options - Handling options
   * @returns The normalized AppError
   */
  handle(error: unknown, options: HandleErrorOptions = {}): AppError {
    const appError = this.normalize(error);

    // Log error for debugging
    this.logError(appError, options.context);

    // Store as last error
    this._lastError.set(appError);

    // Notify user unless silent
    if (!options.silent) {
      const message = options.customMessage || appError.userMessage;
      this.notifyUser(appError, message);
    }

    return appError;
  }

  /**
   * RxJS operator for handling errors in Observable pipelines.
   * Automatically normalizes errors and optionally notifies users.
   *
   * @param options - Handling options
   * @returns RxJS operator function
   *
   * @example
   * ```typescript
   * this.http.get('/api/data').pipe(
   *   this.errorHandlingService.handleError({ context: 'fetchData' })
   * );
   * ```
   */
  handleError<T>(options: HandleErrorOptions = {}): MonoTypeOperatorFunction<T> {
    return (source: Observable<T>) => {
      return source.pipe(
        catchError((error: unknown) => {
          const appError = this.handle(error, options);

          // Always rethrow unless explicitly disabled
          if (options.rethrow !== false) {
            return throwError(() => appError);
          }

          // If not rethrowing, we need to complete the stream
          // This case is rare but useful for fire-and-forget operations
          return new Observable<T>(subscriber => subscriber.complete());
        })
      );
    };
  }

  /**
   * Normalize any error to AppError format
   */
  normalize(error: unknown): AppError {
    if (isAppError(error)) {
      return error;
    }
    return AppErrorFactory.fromUnknown(error);
  }

  /**
   * Clear the last error
   */
  clear(): void {
    this._lastError.set(null);
  }

  /**
   * Check if an error is of a specific type
   */
  isType(error: AppError, type: ErrorType): boolean {
    return error.type === type;
  }

  /**
   * Check if an error is retryable
   */
  isRetryable(error: AppError): boolean {
    return error.retryable;
  }

  /**
   * Log error to console with context
   */
  private logError(error: AppError, context?: string): void {
    const prefix = context ? `[${context}]` : '[Error]';
    console.error(`${prefix} ${error.type}:`, {
      code: error.code,
      message: error.message,
      status: error.status,
      details: error.details
    });
  }

  /**
   * Show notification to user based on error type
   */
  private notifyUser(error: AppError, message: string): void {
    // Don't notify for authentication errors - they're handled by redirects
    if (error.type === ErrorType.AUTHENTICATION) {
      return;
    }

    this.notificationService.error(message);
  }
}
