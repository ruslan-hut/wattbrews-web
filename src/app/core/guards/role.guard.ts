import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

export const roleGuard = (roles: string[]): CanActivateFn => () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const user = auth.currentUser;
  const userRoles: string[] = (user as any)?.customClaims?.roles ?? [];
  const ok = roles.some(r => userRoles.includes(r));
  if (!ok) router.navigate(['/']);
  return ok;
};
