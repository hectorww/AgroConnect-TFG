import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Rutas públicas: no añadir token
  const publicRoutes = ['/api/register', '/api/login_check'];
  const isPublic = publicRoutes.some(route => req.url.includes(route));

  // Rutas donde un 401 NO significa sesión expirada sino credencial incorrecta
  const skipRedirectOn401 = ['/api/change-password', '/api/change-email'];
  const skipRedirect = skipRedirectOn401.some(route => req.url.includes(route));

  const token = authService.getToken();

  const authReq = (token && !isPublic)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublic && !skipRedirect) {
        localStorage.removeItem('jwt_token');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};