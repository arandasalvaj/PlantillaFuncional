export interface AccessData {
  has_access: boolean;
  username: string;
  rol: string;
  profesion: string;
  servicio: string;
  nombre_completo: string;
}

export interface AuthSuccess {
  userId: number;
  accessData: AccessData;
  token: string;
  exp: number | null;
}

export interface AuthError {
  error: true;
  status: number;
  message: string;
}

export type AuthResult = AuthSuccess | AuthError;

export interface JwtPayload {
  sub?: string;
  exp?: number;
  [k: string]: any;
}

export interface AclData {
  roles?: string[];
  profesiones?: string[];
}
