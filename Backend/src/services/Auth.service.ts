import axios from 'axios';
import https from 'https';
import { authLog } from '@utils/logger';

// Agent para SSL: configurable via env (default relaxed para dev)
const rejectUnauthorized = process.env.AUTH_TLS_VERIFY === 'true'; // Stricto solo si AUTH_TLS_VERIFY=true
const httpsAgent = new https.Agent({ rejectUnauthorized });

interface HasAccessParams { id: string; sistema: string; }
interface HasAccessResponse {
  has_access: boolean;
  error?: string;
  rol?: string;
  username?: string;
  profesion?: string;
  servicio?: string;
  nombre_completo?: string;
}
interface AuthHeaders { Authorization?: string; Cookie?: string; }

/** Error tipado para el servicio de autenticación (reemplaza throw de objetos planos) */
export class AuthServiceError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthServiceError';
    this.status = status;
  }
}

/** Helpers internos */
const getApiBase = () => (process.env.API_LOGIN_URL || '').replace(/\/$/, '');
const buildHeaders = (headers: AuthHeaders) => ({
  'Content-Type': 'application/json',
  ...(headers.Authorization && { Authorization: headers.Authorization }),
  ...(headers.Cookie && { Cookie: headers.Cookie }),
});
const handleAxiosError = (error: unknown, context: string): never => {
  authLog.error({ context, error: error instanceof Error ? error.message : String(error) }, 'Auth service error');
  if (axios.isAxiosError(error) && error.response) {
    throw new AuthServiceError(error.response.status, error.response.data?.message || 'Error en servicio de autenticación');
  }
  throw new AuthServiceError(503, 'Servicio de autenticación no disponible');
};

export class AuthService {
  /** Verifica si un usuario tiene acceso a un sistema específico */
  async hasAccess(params: HasAccessParams, headers: AuthHeaders): Promise<HasAccessResponse> {
    const { id, sistema } = params;
    if (!id || !sistema) return { has_access: false, error: 'Parámetros requeridos: id, sistema' };

    const apiBase = getApiBase();
    if (!apiBase) return { has_access: false, error: 'API_LOGIN_URL no configurada' };

    try {
      const response = await axios.post(`${apiBase}/api/usuario/hasaccess`, { id, sistema }, {
        timeout: 15000,
        httpsAgent,
        headers: buildHeaders(headers),
      });
      return response.data;
    } catch (error) {
      return handleAxiosError(error, 'hasAccess');
    }
  }

  /** Obtiene los grupos/sistemas a los que pertenece un usuario */
  async getGrupos(headers: AuthHeaders): Promise<{ status: string; grupos?: Array<{ NombreGrupo: string; [k: string]: unknown }> }> {
    const apiBase = getApiBase();
    if (!apiBase) throw new AuthServiceError(500, 'API_LOGIN_URL no configurada');

    try {
      const response = await axios.get(`${apiBase}/api/usuario/grupos`, {
        timeout: 15000,
        httpsAgent,
        headers: buildHeaders(headers),
      });
      return response.data;
    } catch (error) {
      return handleAxiosError(error, 'getGrupos');
    }
  }
}

export const authService = new AuthService();
