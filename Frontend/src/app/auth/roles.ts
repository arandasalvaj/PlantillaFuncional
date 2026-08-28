export const ROLES = {
  ADMIN: 'Admin',
  CONSULTOR: 'Consultor',
  USER: 'User'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// ============================================================================
// ÚNICO archivo del módulo auth que se toca por sistema: acá viven los
// permisos por módulo. Espejo del backend: lo que acá esconde botones,
// requireRole(ROLES.ADMIN, ...) lo hace cumplir en la ruta (la UI nunca
// es la seguridad).
// ============================================================================

// === Permisos de Acceso por Módulo ===

/** Roles que pueden ver reportes */
export const REPORTES_ACCESS_ROLES: Role[] = [ROLES.ADMIN, ROLES.CONSULTOR];

/** Roles que pueden ver el dashboard */
export const DASHBOARD_ACCESS_ROLES: Role[] = [ROLES.ADMIN, ROLES.CONSULTOR, ROLES.USER];

// === Permisos del módulo Example (renombrar al empezar; duplicar por módulo real) ===

/** Roles que pueden crear y editar (Admin, User) */
export const EXAMPLE_WRITE_ROLES: Role[] = [ROLES.ADMIN, ROLES.USER];

/** Roles que solo pueden ver (Consultor) */
export const EXAMPLE_READ_ONLY_ROLES: Role[] = [ROLES.CONSULTOR];
