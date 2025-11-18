import { ErrorHandler, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly router = inject(Router);

  handleError(error: Error | unknown): void {
    // Log error to console in development
    if (error instanceof Error) {
      console.error('Global error handler:', error.message, error.stack);
    } else {
      console.error('Global error handler:', error);
    }

    // In production, you might want to:
    // - Send error to logging service (e.g., Sentry, LogRocket)
    // - Show user-friendly error message
    // - Track error metrics

    // Example: Send to error tracking service
    // this.errorTrackingService.logError(error);

    // Prevent the default console error handler from running
    // The error is already logged above
  }
}

