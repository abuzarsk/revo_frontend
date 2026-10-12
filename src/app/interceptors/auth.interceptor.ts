import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor to:
 * 1. Automatically add Authorization header with Bearer token to requests
 * 2. Handle 401 Unauthorized errors by clearing token and redirecting to login
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Get token from localStorage if available
  let token: string | null = null;
  if (typeof localStorage !== 'undefined') {
    const tokenObj = localStorage.getItem('token_obj');
    if (tokenObj) {
      try {
        const parsed = JSON.parse(tokenObj);
        token = parsed.token || parsed.access_token || null;
      } catch (e) {
        // If parsing fails, try to use the raw value
        token = tokenObj;
      }
    }
  }

  // Clone the request and add Authorization header if token exists
  // Only add if not already present (to allow manual override)
  let authReq = req;
  if (token && !req.headers.has('Authorization')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Check if the error is a 401 Unauthorized
      if (error.status === 401) {
        // Clear the authentication token from localStorage
        if (typeof localStorage !== 'undefined') {
          console.log('Removing token from localStorage');
          localStorage.removeItem('token_obj');
        }
        
        // Redirect to login page
        router.navigate(['/login']);
      }
      
      // Re-throw the error so it can be handled by the component if needed
      return throwError(() => error);
    })
  );
};

