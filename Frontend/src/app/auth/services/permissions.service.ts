import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { EXAMPLE_WRITE_ROLES, type Role } from '@auth/roles';

/**
 * Servicio centralizado para gestión de permisos basados en roles
 *
 * Proporciona signals computados que verifican permisos en tiempo real.
 * Duplicar el bloque del módulo Example por cada módulo real del sistema.
 *
 * Reglas corporativas: Admin (todo) | User (opera) | Consultor (solo lectura)
 * Recordar: esto solo esconde botones — el enforcement real vive en el
 * backend (requireRole en las rutas).
 */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly auth = inject(AuthService);

  /** Rol actual del usuario autenticado */
  readonly currentRole = computed<Role | null>(() =>
    this.auth.accessData()?.rol as Role || null
  );

  // === Permisos del módulo Example (renombrar al empezar) ===

  /** Admin y User pueden crear/editar */
  readonly canEditExample = computed(() =>
    this.hasRole(EXAMPLE_WRITE_ROLES)
  );

  /** Consultor solo puede ver */
  readonly isReadOnlyExample = computed(() =>
    this.currentRole() === 'Consultor'
  );

  // === Checks de Roles ===

  readonly isAdmin = computed(() => this.currentRole() === 'Admin');
  readonly isConsultor = computed(() => this.currentRole() === 'Consultor');
  readonly isUser = computed(() => this.currentRole() === 'User');

  // === Helpers ===

  /** Verifica si el rol actual está en la lista de roles permitidos */
  private hasRole(allowedRoles: Role[]): boolean {
    const role = this.currentRole();
    return role ? allowedRoles.includes(role) : false;
  }

  /** Mensaje descriptivo del rol actual */
  getRoleDescription(): string {
    const role = this.currentRole();
    const descriptions: Record<Role, string> = {
      Admin: 'Administrador - Acceso total',
      Consultor: 'Consultor - Solo lectura',
      User: 'Usuario - Operación del sistema'
    };
    return role ? descriptions[role] : 'Sin rol asignado';
  }
}
