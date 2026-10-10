import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { STORAGE_KEYS } from '../../constants';

/**
 * Guard that redirects authenticated users away from login/signup pages.
 * If token exists, redirects to home/dashboard; otherwise allows access.
 * Works with SSR by checking if we're in a browser environment.
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  //console.log('guestGuard');
  // Only access localStorage in browser environment (not during SSR)
  if (isPlatformBrowser(platformId)) {
    // Check if token exists in localStorage
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN_OBJ);
    //console.log('Token from localStorage:', token);
    if (token) {
      // If token exists, redirect authenticated user to home
      router.navigate(['/dashboard']);
      return false; // Prevent access to login/signup when authenticated
    }
  }
  // No token or server-side: allow access to guest route
  return true;
};

