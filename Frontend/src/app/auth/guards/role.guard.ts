import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@auth/services/auth.service';
import { ToastService } from '@hospital-carlos-cisterna-calama/ui';
import type { Role } from '@auth/roles';

/**
 * Factory para crear guards de roles específicos
 *
 * Uso (crear uno por módulo real del sistema):
 * ```typescript
 * export const canEditMiModulo = createRoleGuard(['Admin', 'User']);
 * ```
 */
export function createRoleGuard(allowedRoles: Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);

    const accessData = auth.accessData();
    const userRole = accessData?.rol;

    if (!userRole || !allowedRoles.includes(userRole as Role)) {
      toast.error(
        `Esta acción requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
        { title: 'Acceso Denegado' }
      );
      router.navigate(['/']);
      return false;
    }

    return true;
  };
}

/**
 * Guard del módulo Example (renombrar al empezar): solo Admin y User editan
 */
export const canEditExample = createRoleGuard(['Admin', 'User']);

/**
 * Guard: Solo Admin puede gestionar configuración
 */
export const canManageConfig = createRoleGuard(['Admin']);
