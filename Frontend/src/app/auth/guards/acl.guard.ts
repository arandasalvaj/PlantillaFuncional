import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '@auth/services/auth.service';
import { environment } from '@environments/environment';
import type { AclData } from '@auth/models';

/**
 * Guard para control de acceso basado en roles y profesiones (ACL)
 *
 * Optimización: Reduce evaluaciones redundantes y mejora legibilidad
 */
export const aclGuard: CanActivateFn = (route: ActivatedRouteSnapshot): Observable<boolean> | boolean => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const { roles, profesiones } = route.data as AclData;

  /**
   * Verifica si el usuario tiene los permisos necesarios
   */
  const checkPermissions = (accessData: any): boolean => {
    const hasValidRole = !roles || roles.includes(accessData.rol);
    const hasValidProfession = !profesiones || profesiones.includes(accessData.profesion);
    return hasValidRole && hasValidProfession;
  };

  /**
   * Niega el acceso y redirige
   */
  const denyAccess = (): boolean => {
    router.navigate(['/errors/unauthorized']);
    return false;
  };

  // Fast path: Si ya hay accessData, evaluar inmediatamente (síncrono)
  const currentAccess = auth.accessData();
  if (currentAccess) {
    return checkPermissions(currentAccess) || denyAccess();
  }

  // Slow path: Validar de forma asíncrona si no hay accessData cargado
  // Usa apiBaseUrl (proxy del backend) en lugar de loginApiUrl (servicio externo directo)
  return auth.ensureAccess$(environment.apiBaseUrl, environment.systemName).pipe(
    map(hasValidAccess => {
      if (!hasValidAccess) return denyAccess();

      const accessData = auth.accessData();
      return accessData ? checkPermissions(accessData) || denyAccess() : denyAccess();
    })
  );
};
