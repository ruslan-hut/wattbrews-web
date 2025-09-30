import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { switchMap, catchError } from 'rxjs/operators';
import { from, throwError, of } from 'rxjs';

export const firebaseAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  
  // Skip auth for certain URLs (like login, register, etc.)
  if (req.url.includes('/auth/') || req.url.includes('/public/')) {
    return next(req);
  }

  // Get current user
  const user = auth.currentUser;
  
  if (!user) {
    // No user, proceed without auth header
    return next(req);
  }

  // User is authenticated, get token and add to request
  return from(user.getIdToken()).pipe(
    switchMap(token => {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next(authReq);
    }),
    catchError(error => {
      console.error('Firebase Auth Interceptor - Error getting token:', error);
      // If token fails, try to proceed without auth
      return next(req);
    })
  );
};
