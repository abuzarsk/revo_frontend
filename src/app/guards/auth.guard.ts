import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { STORAGE_KEYS } from '../../constants/app.constants';

/**
 * Guard that checks if localStorage has authentication data (token).
 * If token exists, allows access; otherwise redirects to login.
 * Works with SSR by checking if we're in a browser environment.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  // Only access localStorage in browser environment (not during SSR)
  if (isPlatformBrowser(platformId)) {
    console.log(STORAGE_KEYS.TOKEN_OBJ);
    // Check if token exists in localStorage
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN_OBJ);
    console.log('Token from localStorage:', token);

    if (token) {
      //router.navigate(['/']);
      return true;

      /*
      // Check module access if the route requires a specific module
      const requiredModule = route.data?.['moduleKey'] as string | undefined;

      if (!requiredModule) {
        // No specific module required, only auth is needed
        return true;
      }

      try {
        const rawModules = localStorage.getItem(STORAGE_KEYS.MODULE_ACCESS_MODULES);

        if (!rawModules) {
          // No module access info, block access
          router.navigate(['/home']);
          return false;
        }

        const parsed = JSON.parse(rawModules);
        const keys: string[] = [];

        if (Array.isArray(parsed)) {
          parsed.forEach((m: any) => {
            if (typeof m === 'string') {
              keys.push(m);
            } else if (m) {
              const candidate =
                m.key ||
                m.menuKey ||
                m.module_key ||
                m.moduleKey ||
                m.slug ||
                m.name;
              if (typeof candidate === 'string') {
                keys.push(candidate);
              }
            }
          });
        }

        const allowed = new Set(keys);

        if (allowed.has(requiredModule)) {
          return true;
        } else {
          // User authenticated but not allowed for this module
          router.navigate(['/home']);
          return false;
        }
      } catch (error) {
        console.error('Error checking module access in authGuard:', error);
        router.navigate(['/home']);
        return false;
      }*/
    } else {
      // No token found, redirect to login
      router.navigate(['/login']);
      return false;
    }
  } else {
    // Server-side: allow rendering for SSR
    // The client-side guard will handle authentication check after hydration
    return true;
  }
};

