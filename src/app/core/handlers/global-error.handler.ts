import { ErrorHandler, inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { AppError, AppErrorFactory, ErrorType, isAppError } from '../models/error.model';
import { ErrorHandlingService } from '../services/error-handling.service';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  handleError(error: Error | unknown): void {
    // Normalize error to AppError
    const appError = this.normalizeError(error);

    // Log error to console in development
    console.error('Global error handler:', appError.message, error);

    // Skip notification for authentication errors (handled by AuthService)
    // and for errors that have already been handled
    if (this.shouldShowNotification(appError)) {
      this.showErrorNotification(appError);
    }

    // Store the last error for debugging/display purposes
    this.storeError(appError);
  }

  private normalizeError(error: unknown): AppError {
    // If already an AppError, return it
    if (isAppError(error)) {
      return error;
    }

    // Create AppError from unknown error
    return AppErrorFactory.fromUnknown(error);
  }

  private shouldShowNotification(error: AppError): boolean {
    // Don't show notifications for authentication errors
    // (these are handled by AuthService and shown in the UI)
    if (error.type === ErrorType.AUTHENTICATION) {
      return false;
    }

    // Don't show notifications for authorization errors during navigation
    // (user will be redirected to login)
    if (error.type === ErrorType.AUTHORIZATION) {
      return false;
    }

    // Show notifications for other errors
    return true;
  }

  private showErrorNotification(error: AppError): void {
    // Use runInInjectionContext to safely inject services
    runInInjectionContext(this.injector, () => {
      const notificationService = inject(NotificationService);

      // Show user-friendly error notification
      notificationService.error(
        error.userMessage,
        this.getErrorTitle(error.type),
        {
          duration: error.retryable ? 7000 : 5000,
          action: error.retryable ? {
            label: 'Retry',
            callback: () => {
              // Emit retry event (components can listen to this)
              window.dispatchEvent(new CustomEvent('app-error-retry', { detail: error }));
            }
          } : undefined
        }
      );
    });
  }

  private storeError(error: AppError): void {
    // Use runInInjectionContext to safely inject services
    try {
      runInInjectionContext(this.injector, () => {
        const errorHandlingService = inject(ErrorHandlingService);
        // Store error without showing notification (we already showed it)
        errorHandlingService.handle(error, { silent: true });
      });
    } catch (e) {
      // ErrorHandlingService might not be available during bootstrap
      console.warn('Could not store error in ErrorHandlingService:', e);
    }
  }

  private getErrorTitle(errorType: ErrorType): string {
    switch (errorType) {
      case ErrorType.NETWORK:
        return 'Connection Error';
      case ErrorType.SERVER:
        return 'Server Error';
      case ErrorType.VALIDATION:
        return 'Validation Error';
      case ErrorType.NOT_FOUND:
        return 'Not Found';
      case ErrorType.TIMEOUT:
        return 'Request Timeout';
      default:
        return 'Error';
    }
  }
}
