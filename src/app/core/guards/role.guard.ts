import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

export const roleGuard = (roles: string[]): CanActivateFn => () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const currentUser = authService.user();
  
  // If user is already loaded, check immediately
  if (currentUser !== null) {
    const ok = authService.hasAnyRole(roles);
    if (!ok) {
      router.navigate(['/']);
    }
    return ok;
  }
  
  // Otherwise, wait for user to load
  return authService.user$.pipe(
    filter(user => user !== null), // Only proceed when we have a user object
    take(1),
    timeout({
      each: 5000, // Wait max 5 seconds for auth to complete
      with: () => {
        router.navigate(['/']);
        return of(null);
      }
    }),
    map(user => {
      const ok = authService.hasAnyRole(roles);
      
      if (!ok) {
        router.navigate(['/']);
      }
      
      return ok;
    })
  );
};
