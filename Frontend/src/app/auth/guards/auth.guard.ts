import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@auth/services/auth.service';
import { AUTH_COOKIE } from '@core/entorno';

/**
 * Guard para verificar autenticación básica (token presente)
 *
 * Optimización: Intenta leer cookie solo una vez en el ciclo de vida
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Intentar inicializar desde cookie si no hay token
  if (!auth.getToken()) {
    auth.initFromCookie(AUTH_COOKIE);
  }

  // Si aún no hay token después de intentar cookie, redirigir
  if (!auth.getToken()) {
    router.navigate(['/errors/unauthorized']);
    return false;
  }

  return true;
};
