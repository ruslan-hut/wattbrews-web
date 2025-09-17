import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Auth } from '@angular/fire/auth';
import { switchMap, catchError } from 'rxjs/operators';
import { from, throwError, of } from 'rxjs';

export const firebaseAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  
  console.log('Firebase Auth Interceptor - Processing request to:', req.url);
  
  // Skip auth for certain URLs (like login, register, etc.)
  if (req.url.includes('/auth/') || req.url.includes('/public/')) {
    console.log('Firebase Auth Interceptor - Skipping auth for public URL');
    return next(req);
  }

  // Get current user
  const user = auth.currentUser;
  
  console.log('Firebase Auth Interceptor - User:', user ? 'Authenticated' : 'Not authenticated');
  console.log('Firebase Auth Interceptor - User UID:', user?.uid);
  console.log('Firebase Auth Interceptor - Request URL:', req.url);
  
  if (!user) {
    // No user, proceed without auth header
    console.log('Firebase Auth Interceptor - No user found, proceeding without auth header');
    return next(req);
  }

  // User is authenticated, get token and add to request
  console.log('Firebase Auth Interceptor - Getting token for user:', user.uid);
  return from(user.getIdToken()).pipe(
    switchMap(token => {
      console.log('Firebase Auth Interceptor - Token obtained, length:', token.length);
      console.log('Firebase Auth Interceptor - Token preview:', token.substring(0, 20) + '...');
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Firebase Auth Interceptor - Request headers:', authReq.headers.keys());
      return next(authReq);
    }),
    catchError(error => {
      console.error('Firebase Auth Interceptor - Error getting token:', error);
      // If token fails, try to proceed without auth
      return next(req);
    })
  );
};
