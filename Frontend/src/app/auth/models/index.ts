/**
 * Barrel export para interfaces de Auth
 *
 * Facilita la importación de tipos de autenticación:
 * import { AccessData, AuthResult, JwtPayload } from '@auth/models';
 */

export type {
  AccessData,
  AuthSuccess,
  AuthError,
  AuthResult,
  JwtPayload,
  AclData
} from './auth.interfaces';
