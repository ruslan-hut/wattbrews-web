import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle different HTTP error status codes
      switch (error.status) {
        case 401:
          // Unauthorized - redirect to login
          console.warn('HTTP 401: Unauthorized access. Redirecting to login.');
          authService.logout();
          router.navigate(['/auth/login'], {
            queryParams: { returnUrl: router.url }
          });
          break;

        case 403:
          // Forbidden - user doesn't have permission
          console.warn('HTTP 403: Access forbidden.');
          // Could show a notification here
          break;

        case 404:
          // Not found
          console.warn('HTTP 404: Resource not found.', req.url);
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          console.error(`HTTP ${error.status}: Server error.`, error.message);
          // Could show a notification here
          break;

        case 0:
          // Network error or CORS issue
          console.error('Network error: Unable to connect to server.');
          break;

        default:
          // Other errors
          if (error.status >= 400) {
            console.error(`HTTP ${error.status}: ${error.message}`);
          }
      }

      // Re-throw the error so it can be handled by the calling code
      return throwError(() => error);
    })
  );
};

