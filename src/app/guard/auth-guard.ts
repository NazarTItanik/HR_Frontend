import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth-service/auth';
import { Role } from '../models/Role';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    const userRole = auth.currentUser()?.role;

    if (route.data['roles'] && userRole && route.data['roles'].indexOf(userRole) === -1) {
      return router.createUrlTree(['/']);
    }

    return true;
  }
  return true;

  return router.createUrlTree(['/login']);
};  