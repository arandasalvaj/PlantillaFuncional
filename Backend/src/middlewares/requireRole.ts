/**
 * Autorización por ROL — el enforcement vive en el BACKEND (doctrina de la
 * casa: el frontend solo esconde botones, la UI nunca es la seguridad).
 *
 * Uso (después de validateToken, que ya corre para todo /api):
 *   router.delete('/:id', requireRole(ROLES.ADMIN), ExampleController.delete);
 *   router.post('/', requireRole(ROLES.ADMIN, ROLES.USER), ...);
 *
 * El rol sale de ApiLogin (hasaccess) con el MISMO nombre de sistema que usa
 * el frontend (env SISTEMA_APILOGIN — case-sensitive, el registrado en la
 * tabla SistemaWeb). Se cachea por usuario (TTL 5 min) para no golpear
 * ApiLogin en cada request; si ApiLogin cae, el error 503 viaja solo al
 * errorHandler (Express 5).
 */
import { Request, Response, NextFunction } from 'express';
import { authService } from '@services/Auth.service';

/** Roles corporativos (una sola fuente de verdad — espejo de Frontend roles.ts). */
export const ROLES = {
  ADMIN: 'Admin',
  USER: 'User',
  CONSULTOR: 'Consultor',
} as const;
export type Rol = (typeof ROLES)[keyof typeof ROLES];

declare global {
  namespace Express {
    interface Request {
      /** Rol del usuario en ESTE sistema (lo setea requireRole). */
      userRol?: string;
    }
  }
}

interface CacheEntry {
  hasAccess: boolean;
  rol?: string;
  exp: number;
}
const cache = new Map<string, CacheEntry>();
const TTL_MS = Number(process.env.ROLE_CACHE_TTL_MS) || 5 * 60 * 1000;

/** Solo para tests: limpia el caché de roles. */
export function clearRoleCache(): void {
  cache.clear();
}

export const requireRole = (...permitidos: Rol[]) => {
  return async (req: Request, res: Response, _next: NextFunction) => {
    const sistema = process.env.SISTEMA_APILOGIN;
    if (!sistema) {
      // Fail-closed: sin nombre de sistema no se puede autorizar a nadie.
      res.status(500).json({ message: 'SISTEMA_APILOGIN no configurado' });
      return;
    }

    const userId = req.userId !== undefined ? String(req.userId) : '';
    if (!userId) {
      res.status(401).json({ message: 'Token sin identificador de usuario' });
      return;
    }

    let entry = cache.get(userId);
    if (!entry || entry.exp < Date.now()) {
      const r = await authService.hasAccess(
        { id: userId, sistema },
        { Authorization: req.headers.authorization, Cookie: req.headers.cookie }
      );
      entry = { hasAccess: r.has_access, rol: r.rol, exp: Date.now() + TTL_MS };
      cache.set(userId, entry);
    }

    if (!entry.hasAccess) {
      res.status(403).json({ message: 'Sin acceso a este sistema' });
      return;
    }
    if (!entry.rol || !permitidos.includes(entry.rol as Rol)) {
      res.status(403).json({
        message: `Acción no permitida para el rol '${entry.rol ?? 'desconocido'}' — requiere: ${permitidos.join(' o ')}`,
      });
      return;
    }

    req.userRol = entry.rol;
    _next();
  };
};
