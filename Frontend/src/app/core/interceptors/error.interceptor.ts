import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '@hospital-carlos-cisterna-calama/ui';

/**
 * Interceptor global de errores HTTP.
 *
 * - 401 → redirige a login externo (sesión expirada)
 * - 403 → redirige a /errors/unauthorized
 * - 404 → toast "Recurso no encontrado"
 * - 0   → toast "Sin conexión al servidor"
 * - 5xx → toast "Error interno del servidor"
 *
 * Registrar en app.config.ts DESPUÉS de authInterceptor.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notify = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // No interceptar errores que ya fueron manejados manualmente
      if (req.headers.has('X-Skip-Error-Interceptor')) {
        return throwError(() => error);
      }

      switch (error.status) {
        case 0:
          notify.error('No se pudo conectar con el servidor. Verifica tu conexión.');
          break;

        case 401:
          notify.warning('Tu sesión ha expirado. Redirigiendo al login...');
          // Dar tiempo para que el usuario lea el toast
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
          break;

        case 403:
          router.navigate(['/errors/unauthorized']);
          break;

        case 404:
          notify.warning('El recurso solicitado no fue encontrado.');
          break;

        case 422:
          // Validation errors — dejar que el componente los maneje
          break;

        default:
          if (error.status >= 500) {
            notify.error('Error interno del servidor. Intenta nuevamente más tarde.');
          }
          break;
      }

      return throwError(() => error);
    })
  );
};
